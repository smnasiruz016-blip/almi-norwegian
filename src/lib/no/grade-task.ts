// RR-399 A2 · THE SERVER DECIDES WHAT IS BEING GRADED. /api/no/grade used to take the task type, skill, level, title, prompt and
// criteria from the request body, so a free account could choose which kind (Writing or Speaking) its one AI scoring counted as,
// and could hand the model an easier standard. Now the item is loaded by its stable id from the bundles (getItemById), and the kind,
// the level and every word of the task come from that item. The body may still say which type it thinks it is sending; if that
// disagrees with the item, the request is refused (400) and nothing is counted, reserved or sent to AI.
import { isCefrLevel, levelInstruction, type CefrLevel } from "@smnasiruz016-blip/almi-data";
import { getItemById, type NorwegianItemSeed } from "./items";
import { ALL_EXAMS } from "./registry";
import type { ProductivePayload } from "./types";

export type GradeTaskBody = { itemId?: unknown; taskType?: unknown; skill?: unknown };

export type GradeTask =
  | { ok: false; status: 400 | 404; error: string }
  | { ok: true; itemId: string; item: NorwegianItemSeed; kind: "WRITING" | "SPEAKING"; isSpeaking: boolean };

export function resolveGradeTask(body: GradeTaskBody): GradeTask {
  const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
  if (!itemId) return { ok: false, status: 400, error: "Missing itemId" };
  const item = getItemById(itemId);
  if (!item) return { ok: false, status: 404, error: "Unknown item" };
  if (item.taskType !== "WRITING_PROMPT" && item.taskType !== "SPEAKING_PROMPT") {
    return { ok: false, status: 400, error: "This task has no AI feedback." };
  }
  if (body.taskType !== undefined && body.taskType !== item.taskType) {
    return { ok: false, status: 400, error: "The task type does not match this task." };
  }
  if (body.skill !== undefined && body.skill !== item.skill) {
    return { ok: false, status: 400, error: "The skill does not match this task." };
  }
  const isSpeaking = item.taskType === "SPEAKING_PROMPT";
  return { ok: true, itemId, item, kind: isSpeaking ? "SPEAKING" : "WRITING", isSpeaking };
}

/** The grader's prompt, built ONLY from the server-loaded item. */
export function buildGradePrompt(task: Extract<GradeTask, { ok: true }>, response: string): { system: string; user: string } {
  const { item, isSpeaking } = task;
  const exam = ALL_EXAMS.find((e) => e.exam === item.exam);
  const examName = exam?.name ?? "the Norwegian exam";
  // The level to judge THIS task at: the item's own level; else the exam's label ONLY IF it really is a single CEFR level
  // (isCefrLevel rejects "A2–B1" and "Knowledge test"); else no level, and the model is told to assume none.
  const cefr: CefrLevel | null = isCefrLevel(item.cefr) ? (item.cefr as CefrLevel) : isCefrLevel(exam?.cefr) ? (exam!.cefr as CefrLevel) : null;
  const levelPhrase = cefr ?? "the task's own criteria";
  const payload = (item.payload ?? {}) as Partial<ProductivePayload>;
  const criteria = (Array.isArray(payload.criteria) ? payload.criteria : []).filter((c) => typeof c === "string" && c.trim().length > 0);
  return { system: systemLines(examName, cefr, levelPhrase, isSpeaking), user: [
    `Task: ${item.title}`,
    item.prompt ? `Instructions: ${item.prompt}` : null,
    criteria.length ? `Criteria the answer should meet:\n- ${criteria.join("\n- ")}` : null,
    `\nLearner's answer:\n"""${response.slice(0, 6000)}"""`,
  ].filter(Boolean).join("\n") };
}

function systemLines(examName: string, cefr: CefrLevel | null, levelPhrase: string, isSpeaking: boolean): string {
  return [
    `You are an experienced Norwegian-language examiner for ${examName}.`,
    levelInstruction(cefr ?? undefined),
    `You give an HONEST practice readiness estimate against the task's own criteria — this is a study aid, never an official UDI or Ministry result, and you never claim otherwise.`,
    isSpeaking
      ? `This is a SPEAKING task; the learner has typed the answer they would say aloud, so judge content, structure, range and appropriacy, not pronunciation.`
      : `This is a WRITING task; judge task fulfilment, coherence, range and accuracy at ${levelPhrase}.`,
    `Be constructive, specific and level-aware. Do not inflate. Reply with STRICT JSON only, no prose, no code fences, in this exact shape:`,
    `{"band":"CLEAR|BORDERLINE|BELOW","summary":"1-2 sentence honest estimate","strengths":["..."],"improvements":["..."]}`,
    `Bands: CLEAR = comfortably meets the criteria at ${levelPhrase}; BORDERLINE = partially meets them, could go either way; BELOW = does not yet meet them.`,
  ].join(" ");
}
