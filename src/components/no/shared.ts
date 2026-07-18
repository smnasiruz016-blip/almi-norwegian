// Shared client-side item shapes handed from the runner pages to the practice
// components. Payloads stay `unknown` and are narrowed by taskType at render.

import type {
  NorwegianExam,
  NorwegianSkill,
  NorwegianTaskType,
  CefrLevel,
  ObjectiveAnswer,
} from "@/lib/no/types";

export interface RunnerItem {
  title: string;
  prompt: string;
  exam: NorwegianExam;
  skill: NorwegianSkill;
  taskType: NorwegianTaskType;
  /** CEFR level this task is pitched at — carried so the runner can band a goal skill
   *  from at-goal tasks only, report the level reached where there is no pass mark,
   *  and let the productive grader judge at the right level. */
  cefr?: CefrLevel;
  payload: unknown;
  answer: ObjectiveAnswer | null;
  maxPoints: number;
}

export type ProductiveItem = Omit<RunnerItem, "answer" | "maxPoints">;

export interface SubmitResult {
  ok: boolean;
  points: number;
  maxPoints: number;
  correct: boolean;
}

/**
 * The BCP-47 voice tag for listening audio — Norwegian Bokmål (all tracks).
 *
 * nb-NO, not the generic no-NO: every item in this product is written in Bokmål, so the
 * voice should be too. Was "is-IS" (Icelandic) until 2026-07-15 — inherited unchanged
 * through the AlmiIcelandic → AlmiDanish → AlmiNorwegian fork chain, where is-IS was only
 * ever correct for the first. Every Listening transcript was read aloud in an Icelandic
 * voice while the docstring said Norwegian. If you fork this product, change this line —
 * nothing else can catch it.
 */
export function ttsLang(): string {
  return "nb-NO";
}

/** POST a graded/echoed attempt to the submit API. DB-optional, never throws. */
export async function submitAttempt(body: unknown): Promise<SubmitResult | null> {
  try {
    const res = await fetch("/api/no/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as SubmitResult;
  } catch {
    return null;
  }
}

export type ProductiveBand = "CLEAR" | "BORDERLINE" | "BELOW";

export interface AiFeedback {
  band: ProductiveBand;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export type GradeOutcome =
  | { status: "graded"; feedback: AiFeedback }
  | { status: "unavailable" } // key not provisioned / model hiccup → self-rate
  | { status: "error"; message: string };

/**
 * Request honest AI feedback on a productive answer. Returns "unavailable" (not
 * an error) when the key isn't provisioned yet, so the caller falls back to the
 * self-rating flow. Never throws.
 */
export async function gradeProductive(body: {
  exam: NorwegianExam;
  skill: NorwegianSkill;
  taskType: NorwegianTaskType;
  /** The level THIS task is pitched at — the grade route judges the answer at this
   *  level (via almi-data levelInstruction), never at the exam's "B1–B2" label. */
  cefr?: CefrLevel;
  title: string;
  prompt: string;
  criteria: string[];
  response: string;
}): Promise<GradeOutcome> {
  try {
    const res = await fetch("/api/no/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | ({ ok?: boolean; available?: boolean; error?: string } & Partial<AiFeedback>)
      | null;
    if (!res.ok || !data) {
      return { status: "error", message: data?.error ?? "Could not get feedback right now." };
    }
    if (data.available === false || !data.band) return { status: "unavailable" };
    return {
      status: "graded",
      feedback: {
        band: data.band,
        summary: data.summary ?? "",
        strengths: data.strengths ?? [],
        improvements: data.improvements ?? [],
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
