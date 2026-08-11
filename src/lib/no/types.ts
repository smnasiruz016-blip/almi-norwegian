// AlmiNorwegian — shared type contracts for the four-track item bank.
// String-literal unions mirror the Prisma enums (kept in sync by hand) so the
// scoring engine, content pipeline, and UI don't depend on the generated client.

// The "Choose a Test" tree is organised by the user's GOAL, not by the exam name.
// Citizenship and permanent residence each pair a Norskprøven level with a
// knowledge test (as the Norwegian rules actually require).
export type NorwegianTrack =
  | "CITIZENSHIP" // → Norskprøven (oral B1) + Statsborgerprøven
  | "PERMANENT_RESIDENCE" // → Norskprøven (lower) + Samfunnskunnskapsprøven
  | "GETTING_STARTED" // → Norskprøven A1–A2
  | "UNIVERSITY"; // → Test i norsk – høyere nivå (Bergenstesten)

// Norskprøven is a single language test (four skills) reported per skill at the
// level demonstrated; we model three level bands as separate exams so the
// "Choose a Test" tree and content can target a goal. Delivered under HK-dir.
export type LanguageExam =
  | "NORSKPROVE_A1A2"
  | "NORSKPROVE_A2B1"
  | "NORSKPROVE_B1B2"
  | "BERGENSTEST";
// Knowledge tests (Norwegian society / civic knowledge) — multiple-choice only,
// a single KNOWLEDGE module rather than four language skills.
export type KnowledgeExam = "STATSBORGERPROVEN" | "SAMFUNNSKUNNSKAP";
export type NorwegianExam = LanguageExam | KnowledgeExam;

// The four language skills are shared by all Norskprøven bands; KNOWLEDGE is the
// single objective module used by the two knowledge tests.
export type LanguageSkill = "READING" | "LISTENING" | "WRITING" | "SPEAKING";
export type NorwegianSkill = LanguageSkill | "KNOWLEDGE";

export type NorwegianTaskType =
  | "MCQ_SINGLE"
  | "MATCHING"
  | "CLOZE"
  | "ORDERING"
  | "TRUE_FALSE"
  | "WRITING_PROMPT"
  | "SPEAKING_PROMPT";

export type NorwegianDifficulty = "FOUNDATION" | "CORE" | "STRETCH";

// The CEFR level a single task is PITCHED at — distinct from `difficulty`, which is a
// FOUNDATION/CORE/STRETCH ladder *inside* an exam and crosses levels freely. Level is
// what both readouts key on; difficulty is only for ordering/variety. Optional: an
// untagged task is UNDECLARED and never silently counted toward a level.
//
// Norwegian leans on this harder than its siblings. Norskprøven has NO pass mark — it
// reports the level you REACH in each skill — so for most skills there is nothing to
// band against and the level tag IS the result, not a step toward one.
export type { CefrLevel } from "@smnasiruz016-blip/almi-data";

/**
 * The seven emner of the 50-hour samfunnskunnskap course — the syllabus both knowledge
 * tests are drawn from (forskrift 2012-04-19-358, Lovdata).
 *
 * This is the product's civics taxonomy, and it is a TAXONOMY rather than a label list:
 * every KNOWLEDGE item carries one, so "which parts of the syllabus does this bank
 * actually cover, and how deeply" is a question the data can answer. Before it existed
 * the civics items carried no topic of any kind — 32 bare titles with no denominator, so
 * coverage could be described but never measured.
 *
 * It is deliberately the OFFICIAL list and not one derived from what happens to be
 * authored: a taxonomy invented from the items it is meant to audit can never report a
 * gap, because every item lands in a bucket that exists only because that item exists.
 */
export const CIVICS_AREAS = [
  "Ny innvandrer i Norge",
  "Historie, geografi og levesett",
  "Barn og familie",
  "Helse",
  "Utdanning og kompetanse",
  "Arbeidsliv",
  "Demokrati og velferdssamfunn",
] as const;

export type NorwegianCivicsArea = (typeof CIVICS_AREAS)[number];

export function isCivicsArea(v: unknown): v is NorwegianCivicsArea {
  return typeof v === "string" && (CIVICS_AREAS as readonly string[]).includes(v);
}

export const OBJECTIVE_TASK_TYPES: NorwegianTaskType[] = [
  "MCQ_SINGLE",
  "MATCHING",
  "CLOZE",
  "ORDERING",
  "TRUE_FALSE",
];

export const PRODUCTIVE_TASK_TYPES: NorwegianTaskType[] = [
  "WRITING_PROMPT",
  "SPEAKING_PROMPT",
];

export function isObjectiveTask(t: NorwegianTaskType): boolean {
  return OBJECTIVE_TASK_TYPES.includes(t);
}

/** A skill is objectively auto-graded vs AI-graded. This is a SCORING
 * distinction only -- every skill needs a subscription.
 *  Free taste = Reading + Listening + Knowledge (all objective, auto-graded).
 *  Gated = Writing + Speaking (AI-graded) + the full mock. */
export function isObjectiveSkill(skill: NorwegianSkill): boolean {
  return skill === "READING" || skill === "LISTENING" || skill === "KNOWLEDGE";
}

// ---- Task payload shapes (validated in items.ts) ----

/** One multiple-choice / true-false option group. */
export interface McqPayload {
  passage?: string; // reading passage (READING) — omitted for LISTENING
  transcript?: string; // listening transcript (LISTENING) — rendered as audio via TTS
  question: string;
  options: string[]; // 3–4 options
}

export interface MatchingPayload {
  transcript?: string;
  passage?: string;
  instructions: string;
  left: string[]; // prompts
  right: string[]; // candidate matches (may include distractors)
}

export interface ClozePayload {
  passage: string; // text with {{1}} {{2}} … gap markers
  gaps: { id: number; options: string[] }[];
}

export interface OrderingPayload {
  instructions: string;
  items: string[]; // presented shuffled; answer = correct order of indices
}

/** Objective answer keys keyed by taskType. */
export type ObjectiveAnswer =
  | { type: "MCQ_SINGLE"; correctIndex: number }
  | { type: "TRUE_FALSE"; correctIndex: number }
  | { type: "MATCHING"; pairs: [number, number][] } // [leftIndex, rightIndex]
  | { type: "CLOZE"; correct: { id: number; index: number }[] }
  | { type: "ORDERING"; order: number[] };

/** Productive prompt (Writing / Speaking) — AI-graded. */
export interface ProductivePayload {
  stimulus?: string; // context / situation (NB)
  criteria: string[]; // what the answer must show (feeds AI feedback)
  charBand?: { min: number; max: number }; // writing length guidance
  minSeconds?: number; // speaking guidance
}
