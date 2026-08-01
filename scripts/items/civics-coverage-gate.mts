// PER-EMNE CIVICS COVERAGE GATE.
//
// Both knowledge tests are drawn from the seven emner of the 50-hour samfunnskunnskap
// course (forskrift 2012-04-19-358). This gate refuses the build unless EVERY bank holds
// at least MIN_PER_EMNE items in EVERY emne.
//
// ── WHY PER BANK AND PER EMNE, AND NOT A TOTAL ──
// A total is exactly the measurement that hid this. Before the taxonomy existed the two
// banks held 32 items between them and looked adequately stocked; once each item was
// keyed, four of the seven emner turned out to hold ONE item or none. The same trap sits
// one level up: after round 1 the COMBINED figures cleared every emne comfortably (the
// thinnest was 5) while Statsborgerprøven still covered only three of the seven, because
// 25 of 26 new items had gone to the other bank. An aggregate cannot see a hole it is
// averaging over, so this gate counts at the finest axis there is — bank × emne — and
// names every cell that falls short rather than reporting a single verdict.
//
// MIN_PER_EMNE is 3 for the same reason MIN_TASKS_PER_LEVEL is 3 in the grading engine:
// one item is an anecdote and two cannot disagree with each other. It is a floor on
// COVERAGE, not a claim that 3 items teach an emne.
//
// SEEN RED: this gate failed on first run, on real data — Samfunnskunnskapsprøven held 2
// items in "Historie, geografi og levesett" against a floor of 3. It was not written to
// pass the bank it was written against.
//
// Run: npm run gate:civics-coverage

import { getItems } from "../../src/lib/no/items";
import { CIVICS_AREAS } from "../../src/lib/no/types";
import type { NorwegianExam } from "../../src/lib/no/types";

const MIN_PER_EMNE = 3;
const BANKS: { exam: NorwegianExam; label: string }[] = [
  { exam: "STATSBORGERPROVEN", label: "Statsborgerprøven" },
  { exam: "SAMFUNNSKUNNSKAP", label: "Samfunnskunnskapsprøven" },
];

const civics = getItems({}).filter((it) => it.skill === "KNOWLEDGE");

// An item with no emne is a hole the per-emne counts cannot show, because it is in none
// of the buckets being counted. Fail on it by name rather than letting it vanish.
const unkeyed = civics.filter((it) => !it.area);
const foreign = civics.filter(
  (it) => it.area && !(CIVICS_AREAS as readonly string[]).includes(it.area),
);

const short: string[] = [];
const rows: string[] = [];
const header = "emne".padEnd(34) + BANKS.map((b) => b.label.padStart(24)).join("");
rows.push(header);

for (const area of CIVICS_AREAS) {
  let line = area.padEnd(34);
  for (const b of BANKS) {
    const n = civics.filter((it) => it.exam === b.exam && it.area === area).length;
    if (n < MIN_PER_EMNE) short.push(`${b.label} · "${area}" holds ${n}, floor is ${MIN_PER_EMNE}`);
    line += `${n} ${n < MIN_PER_EMNE ? "✗" : "✓"}`.padStart(24);
  }
  rows.push(line);
}
for (const b of BANKS) {
  const n = civics.filter((it) => it.exam === b.exam).length;
  rows.push(`${b.label}: ${n} items`);
}

console.log(rows.join("\n"));

if (unkeyed.length || foreign.length || short.length) {
  console.error("\n✗ CIVICS COVERAGE GATE FAILED");
  for (const it of unkeyed) console.error(`  no emne: ${it.exam} "${it.title}"`);
  for (const it of foreign) console.error(`  emne outside the official seven: ${it.exam} "${it.title}" → ${it.area}`);
  for (const s of short) console.error(`  ${s}`);
  console.error(
    `\n  Every bank must hold at least ${MIN_PER_EMNE} items in each of the ${CIVICS_AREAS.length} emner.` +
      `\n  Add items to the named cell — do NOT re-key an existing item into it, which would` +
      `\n  move a question away from the emne it actually belongs to in order to please a gate.\n`,
  );
  process.exit(1);
}

console.log(
  `\n✓ CIVICS COVERAGE GATE: ${civics.length} items · every bank holds ≥${MIN_PER_EMNE} in each of the ${CIVICS_AREAS.length} emner.`,
);
