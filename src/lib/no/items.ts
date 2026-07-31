// Bundled item loader for AlmiNorwegian practice.
//
// Items are authored as JSON bundles under src/data/items/*.json (one per
// surface). The content pipeline may still be generating them, so the loader is
// defensive: any missing, empty, or malformed file falls back to [] rather than
// throwing. Files are read from disk at module load (Node runtime) so we don't
// need every bundle to exist at build/tsc time.

import crypto from "crypto";
import fs from "fs";
import path from "path";
import type {
  NorwegianTrack,
  NorwegianExam,
  NorwegianSkill,
  NorwegianTaskType,
  NorwegianDifficulty,
  CefrLevel,
  NorwegianCivicsArea,
  ObjectiveAnswer,
} from "./types";

/** A single authored item, matching the NorwegianItem content fields (no DB id). */
export interface NorwegianItemSeed {
  track: NorwegianTrack;
  exam: NorwegianExam;
  skill: NorwegianSkill;
  taskType: NorwegianTaskType;
  difficulty: NorwegianDifficulty;
  /** The CEFR level this task is pitched at (optional). Feeds the goal band where a
   *  skill has a pass mark, and the achieved-level readout where it does not. Absent =
   *  UNDECLARED: never counted toward a level, never silently treated as at-goal. */
  cefr?: CefrLevel;
  /** For KNOWLEDGE items only: which of the seven 50-hour samfunnskunnskap emner this
   *  question belongs to. Optional because the language skills have no such syllabus —
   *  absent on every READING/LISTENING/WRITING/SPEAKING item by design, and present on
   *  every civics item, which is what makes per-emne coverage measurable rather than
   *  merely describable. NOT part of stableItemId: keying an item to its emne is
   *  classification, not a change to the question, so it must not move the id. */
  area?: NorwegianCivicsArea;
  title: string;
  prompt: string;
  payload: unknown;
  answer: ObjectiveAnswer | null;
  maxPoints: number;
}

const BUNDLE_FILES = [
  // Norskprøven ladder — reading / listening / productive (writing+speaking) per exam
  "norskprove-a1a2-reading.json",
  "norskprove-a1a2-listening.json",
  "norskprove-a1a2-productive.json",
  "norskprove-a1a2-productive-2.json",
  "norskprove-a2b1-reading.json",
  "norskprove-a2b1-listening.json",
  "norskprove-a2b1-productive.json",
  "norskprove-a2b1-productive-2.json",
  "norskprove-b1b2-reading.json",
  "norskprove-b1b2-listening.json",
  "norskprove-b1b2-productive.json",
  "norskprove-b1b2-productive-2.json",
  "bergenstesten-reading.json",
  "bergenstesten-listening.json",
  "bergenstesten-productive.json",
  "bergenstesten-productive-2.json",
  // Society / citizenship knowledge tests — single KNOWLEDGE (MCQ) module each
  "statsborgerproven.json",
  "samfunnskunnskapsproven.json",
];

const ITEMS_DIR = path.join(process.cwd(), "src", "data", "items");

function loadBundle(file: string): NorwegianItemSeed[] {
  try {
    const full = path.join(ITEMS_DIR, file);
    if (!fs.existsSync(full)) return [];
    const raw = fs.readFileSync(full, "utf8").trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as NorwegianItemSeed[];
  } catch {
    // Malformed / partially-written bundle — tolerate and skip.
    return [];
  }
}

let cache: NorwegianItemSeed[] | null = null;

function allItems(): NorwegianItemSeed[] {
  if (cache) return cache;
  cache = BUNDLE_FILES.flatMap(loadBundle);
  return cache;
}

/** Filtered item lookup by any combination of track / exam / skill. */
export function getItems(filter: {
  track?: NorwegianTrack;
  exam?: NorwegianExam;
  skill?: NorwegianSkill;
} = {}): NorwegianItemSeed[] {
  return allItems().filter(
    (it) =>
      (filter.track === undefined || it.track === filter.track) &&
      (filter.exam === undefined || it.exam === filter.exam) &&
      (filter.skill === undefined || it.skill === filter.skill),
  );
}

// ── SERVER-SIDE ITEM IDENTITY ───────────────────────────────────────────────
// Items are bundle-served with NO database id, but grading must be server-authoritative:
// the submit route re-loads the item by id and grades against the SERVER-held answer
// key, so the key never ships in the served payload and a client-supplied answer is
// never trusted. Before this existed, /api/no/submit destructured `answer` off the
// request body and passed it to gradeObjective() — a forged POST that supplied both the
// key and the matching response scored 100% without knowing anything.
//
// ── WHY A CONTENT HASH AND NOT THE SWISS TUPLE ──
// almi-swiss keys on language|track|exam|skill|title, because there a title is unique
// within a surface. That tuple DOES NOT HOLD HERE and copying it would have been a
// silent mis-grade: across the authored bank exam|skill|title collides 3 times (measured
// at 272 items, still 3 at 298), and adding `track` or `taskType` does not separate them —
//
//   BERGENSTEST|WRITING|Summary of a research finding    (productive.json vs -2.json)
//   NORSKPROVE_A1A2|SPEAKING|Talk about your family      "…out loud." vs "…in Norwegian."
//   NORSKPROVE_A1A2|SPEAKING|Ask for directions          "…to a place in town." vs "…in Norwegian."
//
// These are DISTINCT tasks that happen to share a title, not duplicates, so the fix is a
// wider id — never a retitle. Hashing the prompt and payload in as well separates all
// three: 272/272 unique. assertNoIdCollisions() keeps that true as content is added.
//
// `answer`, `cefr` and `difficulty` are deliberately NOT hashed. The id names the
// QUESTION, not its key or its tagging, so a de-game re-key pass or a CEFR tagging pass
// leaves every id untouched. The trade, stated rather than implied: editing a title,
// prompt or payload DOES change that item's id. That is safe here because the id is a
// round-trip handle (served with the item, posted straight back) and is never persisted
// as a foreign key that has to survive — NorwegianAttempt.itemId points at NorwegianItem,
// a table nothing populates, so that write already fails into its own catch.

/** Stable, content-derived id for a bundle item — the handle the client posts back. */
export function stableItemId(
  it: Pick<NorwegianItemSeed, "exam" | "skill" | "taskType" | "title" | "prompt" | "payload">,
): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        exam: it.exam,
        skill: it.skill,
        taskType: it.taskType,
        title: it.title,
        prompt: it.prompt,
        payload: it.payload,
      }),
    )
    .digest("hex")
    .slice(0, 16);
}

/** Re-load the full item (INCLUDING its answer key) by its stable id, server-side. */
export function getItemById(id: string): NorwegianItemSeed | undefined {
  return allItems().find((it) => stableItemId(it) === id);
}

/** The collision check as a PURE function over any item list, so the gate can be shown
 *  RED against a synthetic duplicate without ever editing an authored bundle. Returns
 *  one human-readable line per colliding pair; empty means clean. */
export function findIdCollisions(items: readonly NorwegianItemSeed[]): string[] {
  const seen = new Map<string, string>();
  const out: string[] = [];
  for (const it of items) {
    const id = stableItemId(it);
    const key = `${it.exam}|${it.skill}|${it.taskType}|${it.title}`;
    const prior = seen.get(id);
    if (prior) {
      out.push(`"${key}" and "${prior}" both hash to ${id} — grading would key against the wrong item`);
      continue;
    }
    seen.set(id, key);
  }
  return out;
}

/**
 * Build-time guard: no two bundle items may share a stable id. A collision would make
 * getItemById() return the wrong item, so the submit route would grade a learner's
 * answer against a DIFFERENT item's key — silently, and only for the colliding pair.
 */
export function assertNoIdCollisions(): void {
  const collisions = findIdCollisions(allItems());
  if (collisions.length > 0) {
    throw new Error(`stableItemId collision:\n  ${collisions.join("\n  ")}`);
  }
}

/**
 * Deterministic stable string hash → 32-bit int. Used as a fallback seed so the
 * pick is varied but reproducible without Math.random at module/build scope.
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) for a stable shuffle from a numeric seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const rng = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Deterministically pick up to n practice items for an exam + skill. With no
 * seed the natural (authored) order is preserved; a numeric seed produces a
 * stable reshuffle for variety. Never uses Math.random.
 */
export function pickPractice(
  exam: NorwegianExam,
  skill: NorwegianSkill,
  n: number,
  seed?: number,
): NorwegianItemSeed[] {
  const pool = getItems({ exam, skill });
  const ordered =
    seed === undefined
      ? pool
      : stableShuffle(pool, seed ^ hashSeed(`${exam}:${skill}`));
  return ordered.slice(0, Math.max(0, n));
}
