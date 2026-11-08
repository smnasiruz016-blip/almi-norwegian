// AI grading for the gated productive skills (Writing / Speaking). Sends the task
// + the learner's written answer to Sonnet and returns an HONEST practice
// readiness band (CLEAR / BORDERLINE / BELOW) with constructive, level-aware
// feedback against the exam's own criteria — never an official Directorate of
// Education or HK-dir (the Directorate for Higher Education and Skills) result.
//
// Graceful degradation: if ANTHROPIC_API_KEY is not yet provisioned the route
// returns { ok: true, available: false } (HTTP 200) so the client falls back to
// the honest self-rating flow instead of surfacing a 500.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { aiGate, hasPracticeAccess, lockedCopy } from "@/lib/billing/free-access";
import { prisma } from "@/lib/prisma";
import { getAnthropicClient, recordCost } from "@/lib/ai/anthropic-client";
import { MODELS } from "@/lib/ai/models";
import { buildGradePrompt, resolveGradeTask } from "@/lib/no/grade-task";

export const runtime = "nodejs";
export const maxDuration = 60;

/** EVERYTHING THE CLIENT MAY SAY: which task (itemId) and what the learner wrote. RR-399 A2: the task type, skill, level, title,
 *  prompt and criteria used to come from here, so the caller chose what was graded and which free use it counted as. Now they all
 *  come from the server-loaded item; a taskType or skill in the body is only compared with the item (a mismatch is a 400). */
interface GradeBody {
  itemId?: string;
  taskType?: string;
  skill?: string;
  response?: string;
}

type Band = "CLEAR" | "BORDERLINE" | "BELOW";
const BANDS: Band[] = ["CLEAR", "BORDERLINE", "BELOW"];

interface AiFeedback {
  band: Band;
  summary: string;
  strengths: string[];
  improvements: string[];
}

/** RR-397: the cost-ledger feature of this grader, per kind, so a free account's one Writing and one Speaking can be counted
 *  apart. (Before RR-397 both were logged as "is.grade.productive"; free accounts had no AI then, so no free row is lost.) */
function gradeFeature(kind: "WRITING" | "SPEAKING"): string {
  return `is.grade.productive.${kind.toLowerCase()}`;
}

function keyAvailable(): boolean {
  const k = process.env.ANTHROPIC_API_KEY;
  return !!k && k.length >= 20 && k !== "TODO_FOUNDER_PROVIDES";
}

// Defensive JSON extraction — models occasionally wrap JSON in prose or fences.
function parseFeedback(raw: string): AiFeedback | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  const band = typeof o.band === "string" ? o.band.toUpperCase() : "";
  if (!BANDS.includes(band as Band)) return null;
  const summary = typeof o.summary === "string" ? o.summary.trim() : "";
  if (!summary) return null;
  const toList = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 5) : [];
  return {
    band: band as Band,
    summary,
    strengths: toList(o.strengths),
    improvements: toList(o.improvements),
  };
}

export async function POST(req: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  // RR-397: a learner who is neither paid nor inside the free 48 hours is refused here, before the body is read.
  // The one-per-kind rule and today's free-AI budget are checked below, once Writing or Speaking is known.
  if (!hasPracticeAccess(user)) {
    const c = lockedCopy(user);
    return NextResponse.json(
      { ok: false, error: `${c.title}. ${c.line}`, upgradeUrl: "/pricing" },
      { status: 402 },
    );
  }

  let body: GradeBody;
  try {
    body = (await req.json()) as GradeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const response = (body.response ?? "").trim();
  if (response.length < 20) {
    return NextResponse.json(
      { ok: false, error: "Write a fuller answer before requesting feedback." },
      { status: 400 },
    );
  }

  // ── RR-399 A2 · SERVER-AUTHORITATIVE: the task is loaded by id; its type decides Writing or Speaking ──
  const task = resolveGradeTask(body);
  if (!task.ok) return NextResponse.json({ ok: false, error: task.error }, { status: task.status });
  const { itemId, kind } = task;

  // Key not provisioned yet → tell the client to fall back to self-rating.
  if (!keyAvailable()) {
    return NextResponse.json({ ok: true, available: false });
  }

  // RR-397: paid users as before (owner + comp bypass live inside hasPaidAccess); a free account (48 hours, no card) gets ONE
  // AI-scored Writing and ONE AI-scored Speaking, within today's free-AI budget. "Used" = AI scorings this account already
  // RECEIVED of this kind: the successful cost rows of this grader for that kind (written only after the model answered).
  const feature = gradeFeature(kind);
  const gate = await aiGate(user, kind, () =>
    prisma.aICostLedger.count({ where: { userId: user.id, feature, success: true } }),
  );
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

  const { system, user: userMsg } = buildGradePrompt(task, response);

  let feedback: AiFeedback | null = null;
  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model: MODELS.SONNET,
      max_tokens: 700,
      temperature: 0.2,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    await recordCost({
      userId: user.id,
      feature,
      model: MODELS.SONNET,
      usage: {
        inputTokens: msg.usage.input_tokens,
        outputTokens: msg.usage.output_tokens,
      },
      success: true,
    });

    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    feedback = parseFeedback(text);
  } catch (e) {
    await recordCost({
      userId: user.id,
      feature,
      model: MODELS.SONNET,
      usage: { inputTokens: 0, outputTokens: 0 },
      success: false,
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    // RR-399 A3: the learner received nothing, so the free use is given back.
    await gate.release();
    // Fall back to self-rating rather than 500 on a transient model error.
    return NextResponse.json({ ok: true, available: false });
  }

  if (!feedback) {
    await gate.release(); // RR-399 A3: no usable feedback reached the learner
    return NextResponse.json({ ok: true, available: false });
  }

  // Persistence uses the VALIDATED id (it resolved to a served item). RR-399 A1: itemId is a plain id (no foreign key), so this
  // write now saves. A failure is logged loudly; it never costs the learner the feedback.
  try {
    await prisma.norwegianAttempt.create({
      data: {
        userId: user.id,
        itemId,
        status: "EVALUATED",
        response: { text: response } as object,
        aiFeedback: feedback as unknown as object,
        readiness: feedback.band,
        submittedAt: new Date(),
      },
    });
  } catch (e) {
    console.error("[no/grade] ATTEMPT NOT SAVED", { userId: user.id, itemId, error: e instanceof Error ? e.message : String(e) });
  }

  return NextResponse.json({ ok: true, available: true, ...feedback });
}
