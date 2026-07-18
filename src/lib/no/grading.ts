// AlmiNorwegian scoring engine — per-skill READINESS estimate. Norskprøven B1–B2,
// the University of Norway entrance exam and the CEFR levels are pass/fail against
// official criteria; we do NOT fabricate an official UDI /
// Ministry result. We score each skill's objective items
// deterministically to a percentage and map it to an honest readiness band, and
// we label productive skills (Writing/Speaking) as AI estimates.

import { READY_PCT, BORDERLINE_PCT } from "./registry";
import type { ObjectiveAnswer, NorwegianTaskType, NorwegianSkill } from "./types";
import { isObjectiveTask } from "./types";
import { splitByLevel, CEFR_ORDER } from "@smnasiruz016-blip/almi-data";
import type { CefrLevel, LevelScored } from "@smnasiruz016-blip/almi-data";

export type Readiness = "CLEAR" | "BORDERLINE" | "BELOW";

export interface ObjectiveResult {
  points: number;
  maxPoints: number;
}

/** Deterministically grade one objective item's response against its key. */
export function gradeObjective(
  answer: ObjectiveAnswer,
  response: unknown,
): ObjectiveResult {
  switch (answer.type) {
    case "MCQ_SINGLE":
    case "TRUE_FALSE": {
      const picked = (response as { index?: number } | null)?.index;
      return { points: picked === answer.correctIndex ? 1 : 0, maxPoints: 1 };
    }
    case "MATCHING": {
      const picks = (response as { pairs?: [number, number][] } | null)?.pairs ?? [];
      const key = new Map(answer.pairs.map(([l, r]) => [l, r]));
      let pts = 0;
      for (const [l, r] of picks) if (key.get(l) === r) pts++;
      return { points: pts, maxPoints: answer.pairs.length };
    }
    case "CLOZE": {
      const picks = (response as { gaps?: { id: number; index: number }[] } | null)?.gaps ?? [];
      const key = new Map(answer.correct.map((c) => [c.id, c.index]));
      let pts = 0;
      for (const g of picks) if (key.get(g.id) === g.index) pts++;
      return { points: pts, maxPoints: answer.correct.length };
    }
    case "ORDERING": {
      const order = (response as { order?: number[] } | null)?.order ?? [];
      const correct =
        order.length === answer.order.length &&
        order.every((v, i) => v === answer.order[i]);
      return { points: correct ? 1 : 0, maxPoints: 1 };
    }
  }
}

/** Percentage → honest readiness band vs the level's real criteria. */
export function readinessFromPct(pct: number): Readiness {
  if (pct >= READY_PCT) return "CLEAR";
  if (pct >= BORDERLINE_PCT) return "BORDERLINE";
  return "BELOW";
}

export interface SkillReadout {
  skill: NorwegianSkill;
  points: number;
  maxPoints: number;
  pct: number;
  readiness: Readiness; // objective skills only; productive → estimate label
  isEstimate: boolean; // productive (Writing/Speaking) = AI estimate
}

export function skillReadout(
  skill: NorwegianSkill,
  points: number,
  maxPoints: number,
): SkillReadout {
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0;
  const isEstimate = skill === "WRITING" || skill === "SPEAKING";
  return { skill, points, maxPoints, pct, readiness: readinessFromPct(pct), isEstimate };
}

/** Overall readiness LABEL for a percentage (honest, non-official framing). */
export function classificationLabel(pct: number): string {
  if (pct >= 85) return "Strong (practice estimate)";
  if (pct >= READY_PCT) return "On track (practice estimate)";
  if (pct >= BORDERLINE_PCT) return "Borderline (practice estimate)";
  return "Below level (practice estimate)";
}

/**
 * Aggregate a full mock's per-skill readouts into an overall readiness estimate.
 * Honest model: the official result is pass/fail per part against criteria, so we
 * take the mean objective percentage as an ORIENTATION estimate and flag the
 * weakest skill — never claim an official classification. We also surface whether
 * every graded skill reads CLEAR (the "ready across all four skills" shape).
 */
export function aggregateReadout(readouts: SkillReadout[]): {
  meanPct: number;
  overall: Readiness;
  label: string;
  weakest: NorwegianSkill | null;
  allClear: boolean;
} {
  const graded = readouts.filter((r) => r.maxPoints > 0);
  const meanPct = graded.length
    ? Math.round(graded.reduce((s, r) => s + r.pct, 0) / graded.length)
    : 0;
  let weakest: NorwegianSkill | null = null;
  let low = Infinity;
  for (const r of graded) if (r.pct < low) { low = r.pct; weakest = r.skill; }
  return {
    meanPct,
    overall: readinessFromPct(meanPct),
    label: classificationLabel(meanPct),
    weakest,
    allClear: graded.length > 0 && graded.every((r) => r.readiness === "CLEAR"),
  };
}

/** True when this task type is auto-gradable (objective). */
export function isObjectiveTaskType(t: NorwegianTaskType): boolean {
  return isObjectiveTask(t);
}

/**
 * Goal-readiness for a skill that HAS a pass mark, banded from AT-GOAL tasks ONLY
 * (via almi-data's splitByLevel — the canonical level-crossing rule). A task's `cefr`
 * decides where it sits vs the goal; `difficulty` NEVER does.
 *
 * In Norway only SPEAKING reaches this function on the citizenship path (B1 oral).
 * Because the B1–B2 paper genuinely carries B2 tasks, `above` is populated here in a
 * way it never was for the A2-goal siblings: a missed B2 task is reported on its own
 * and kept out of the band, since failing above the goal says nothing about meeting it.
 *
 * Honest edges:
 *  - `atGoalPct === null` when nothing at the goal was served → "no estimate yet",
 *    never 0% (0% would lie about the learner rather than describe the session).
 *  - below- and above-goal tasks are counted separately, never folded into the band.
 */
export interface GoalReadout {
  goal: CefrLevel | undefined;
  atGoalPct: number | null;
  readiness: Readiness | null;
  atGoalCount: number;
  foundationalCount: number;
  aboveCount: number;
  undeclaredCount: number;
}

export function goalReadout(
  scored: readonly LevelScored[],
  goal: CefrLevel | undefined,
): GoalReadout {
  const s = splitByLevel(scored, goal);
  const atGoalPct =
    s.atGoal.maxPoints > 0
      ? Math.round((s.atGoal.points / s.atGoal.maxPoints) * 100)
      : null;
  return {
    goal: s.goal,
    atGoalPct,
    readiness: atGoalPct === null ? null : readinessFromPct(atGoalPct),
    atGoalCount: s.atGoal.count,
    foundationalCount: s.foundational.count,
    aboveCount: s.above.count,
    undeclaredCount: s.undeclared,
  };
}

/** A level needs at least this many scored tasks before the session is allowed to say
 *  anything about it. One lucky B2 item is not evidence of working at B2, and one
 *  unlucky one is not evidence against it. */
export const MIN_TASKS_PER_LEVEL = 3;

export interface LevelBreakdown {
  cefr: CefrLevel;
  count: number;
  points: number;
  maxPoints: number;
  pct: number;
  /** False when `count < MIN_TASKS_PER_LEVEL` — shown, but never allowed to decide
   *  `workingAt`. Rendering it keeps the thin evidence visible instead of hiding it. */
  sufficient: boolean;
}

export interface AchievedReadout {
  /** The highest level the learner both attempted ENOUGH of and actually cleared.
   *  null = no level has enough evidence yet, or none was cleared — say so plainly
   *  rather than crowning the highest level they merely touched. */
  workingAt: CefrLevel | null;
  /** The lowest level above `workingAt` that was attempted with enough evidence and
   *  NOT cleared — what they are reaching for. null when there is no such level. */
  reachingFor: CefrLevel | null;
  byLevel: LevelBreakdown[];
  undeclaredCount: number;
}

/**
 * The readout for a skill with NO pass mark — which on Norskprøven is most of them.
 *
 * Norskprøven does not pass or fail you: it reports the level you reach in each skill.
 * So for reading, listening and writing there is nothing to band against, and asking
 * "are you ready?" is the wrong question. This answers the question the exam actually
 * answers — "what level are you working at?" — and it answers it conservatively:
 *
 *  - a level counts only with at least MIN_TASKS_PER_LEVEL tasks behind it, so a
 *    single item can neither crown nor sink a level;
 *  - `workingAt` is the HIGHEST such level actually cleared (READY_PCT), so clearing
 *    B1 while missing B2 reports B1 — a lower-level win can never imply a higher one;
 *  - every level attempted is reported with its own numbers, including the thin ones,
 *    so the learner sees the evidence and not just the verdict.
 *
 * It is a practice estimate from the tasks served, never a Norskprøven result.
 */
export function achievedReadout(scored: readonly LevelScored[]): AchievedReadout {
  const buckets = new Map<CefrLevel, { count: number; points: number; maxPoints: number }>();
  let undeclaredCount = 0;

  for (const s of scored) {
    if (!s.cefr) {
      undeclaredCount++;
      continue;
    }
    const b = buckets.get(s.cefr) ?? { count: 0, points: 0, maxPoints: 0 };
    b.count++;
    b.points += s.points;
    b.maxPoints += s.maxPoints;
    buckets.set(s.cefr, b);
  }

  const byLevel: LevelBreakdown[] = CEFR_ORDER.filter((l) => buckets.has(l)).map((cefr) => {
    const b = buckets.get(cefr)!;
    return {
      cefr,
      count: b.count,
      points: b.points,
      maxPoints: b.maxPoints,
      pct: b.maxPoints > 0 ? Math.round((b.points / b.maxPoints) * 100) : 0,
      sufficient: b.count >= MIN_TASKS_PER_LEVEL,
    };
  });

  const cleared = byLevel.filter((l) => l.sufficient && l.pct >= READY_PCT);
  const workingAt = cleared.length > 0 ? cleared[cleared.length - 1].cefr : null;

  // What they are reaching for: the lowest sufficiently-evidenced level ABOVE the one
  // they cleared that they did not clear. Undefined-by-design when they cleared the
  // top level they were served — there is nothing above it in this session to name.
  const above = byLevel.filter(
    (l) =>
      l.sufficient &&
      l.pct < READY_PCT &&
      (workingAt === null || CEFR_ORDER.indexOf(l.cefr) > CEFR_ORDER.indexOf(workingAt)),
  );
  const reachingFor = above.length > 0 ? above[0].cefr : null;

  return { workingAt, reachingFor, byLevel, undeclaredCount };
}
