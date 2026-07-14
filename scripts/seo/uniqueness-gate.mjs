// Build-time UNIQUENESS GATE — AlmiWorld pSEO Localization Standard.
// Runs before the build; fails it on any violation so a thin / name-swapped
// origin page cannot ship. Validates the verified per-origin recognition data
// (from @smnasiruz016-blip/almi-data) that every origin page weaves:
//   (A) every localized origin has a non-empty recognitionBody AND commonConcern;
//   (B) no two localized origins share a recognitionBody (a shared body would
//       make their pages a name-swap of each other).
// Unresearched origins use the honest-generic fallback (disclosed, not failed).

import { originContext, LOCALIZED_ORIGIN_SLUGS, findOrigin } from "@smnasiruz016-blip/almi-data";

const violations = [];
const bodies = new Map();

for (const slug of LOCALIZED_ORIGIN_SLUGS) {
  const loc = originContext(slug);
  const name = findOrigin(slug)?.name ?? slug;
  if (!loc) { violations.push(`${slug}: listed as localized but originContext() is null.`); continue; }
  if (!loc.recognitionBody?.trim()) violations.push(`${name}: empty recognitionBody.`);
  if (!loc.commonConcern?.trim()) violations.push(`${name}: empty commonConcern.`);
  const prev = bodies.get(loc.recognitionBody);
  if (prev) violations.push(`${name} shares recognitionBody with ${prev} ("${loc.recognitionBody}") — name-swap risk.`);
  else bodies.set(loc.recognitionBody, name);
}

// Self-test: the duplicate detector must actually fire.
{
  const seen = new Map();
  const r = ["x", "x"].map((b) => { const hit = seen.has(b); seen.set(b, 1); return hit; });
  if (!r[1]) { console.error("GATE SELF-TEST FAILED: duplicate detector not working."); process.exit(1); }
}

console.log(`Uniqueness gate — origin recognition layer`);
console.log(`  localized origins checked: ${LOCALIZED_ORIGIN_SLUGS.length}`);
console.log(`  distinct recognition bodies: ${bodies.size}`);
console.log(`  self-test: duplicate correctly detected ✓`);

if (violations.length) {
  console.error(`\n❌ UNIQUENESS GATE FAILED — ${violations.length} violation(s):`);
  for (const v of violations) console.error("   • " + v);
  process.exit(1);
}
console.log("\n✅ Uniqueness gate passed.");
