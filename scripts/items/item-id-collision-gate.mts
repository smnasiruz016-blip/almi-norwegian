// ITEM-ID COLLISION GATE.
//
// Grading is server-authoritative: /api/no/submit re-loads an item by its stable id
// (content hash of exam|skill|taskType|title|prompt|payload) and grades against the
// SERVER-held answer key. If two bundle items hashed to the same id, getItemById()
// would return the wrong one and a learner's answer would be graded against a DIFFERENT
// item's key — silently, and only for the colliding pair. This gate refuses the build.
//
// The narrower Swiss tuple (exam|skill|title) is NOT safe here and this gate is why we
// know: it collides 3× across the 272 authored items on titles that two genuinely
// different tasks share. See the identity note in src/lib/no/items.ts.
//
// SEEN RED: proven by scripts/items/grade-integrity-proof.mts, which feeds
// findIdCollisions() a synthetic duplicate and asserts it reports the pair — so the gate
// is shown red without ever editing an authored bundle.
//
// Run: npm run gate:item-id

import { assertNoIdCollisions, getItems, stableItemId } from "../../src/lib/no/items";

try {
  assertNoIdCollisions();
  const n = getItems({}).length;
  const ids = new Set(getItems({}).map((it) => stableItemId(it)));
  console.log(`✓ ITEM-ID GATE: ${ids.size}/${n} served items carry a unique stableItemId.`);
} catch (e) {
  console.error(`\n✗ ITEM-ID COLLISION GATE FAILED\n  ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
}
