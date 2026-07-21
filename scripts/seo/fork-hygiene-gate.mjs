// Build-time FORK HYGIENE GATE — the AlmiWorld §7 rule, enforced instead of trusted.
//
// WHY THIS EXISTS. This repo's lineage is:
//   almi-celpip → almi-goethe → almi-icelandic → almi-danish → almi-norwegian (you are here)
// and every hop leaked the previous product's facts into user-facing copy. Real
// examples found live in this repo, not hypotheticals:
//   • src/components/no/shared.ts's ttsLang() returned "is-IS" — every Norwegian
//     Listening transcript read aloud in an ICELANDIC voice, inherited unchanged
//     through icelandic → danish → norwegian (fixed to nb-NO 2026-07-15).
//   • The lineage also produced Danish-authority leaks in sibling forks: almi-swiss,
//     forked further down this chain, shipped SESSION_COOKIE_NAME = "almi_norwegian_session"
//     while its BANNED list held only the HYPHEN form "almi-norwegian" — the underscore
//     spelling that actually shipped sailed through. That is the shape this gate exists
//     to catch, and why product names are ENUMERATED, not hand-listed.
//
// The lesson: a grep for the previous country's nouns is NOT enough, because the
// dangerous cases are the ones where the LABEL was localized and the FACT was not.
// So this gate bans the ancestors' proper nouns outright — a Norwegian product has no
// reason to name a Danish exam, an Icelandic authority, or a German certificate.
//
// Runs before the build and FAILS it on any hit. If a future fork descends from this
// repo (almi-swedish did), RE-CUT BANNED in BOTH directions: ADD the Norwegian nouns
// (Norskprøven, UDI, Bergenstesten...) — the moment Norway becomes an ancestor they
// become leaks — and REMOVE whatever the new country legitimately owns. Inheriting
// this list unchanged is itself a fork bug.
//
// ⚠️ WHAT IS DELIBERATELY *NOT* BANNED HERE, unlike the swiss original this borrows its
// machinery from: bare Nordic COUNTRY NAMES ("Danmark", "Sverige", "Tyskland", "Island"
// / Denmark, Sweden, Germany, Iceland). A Norwegian citizenship product legitimately
// names its neighbours in geography and history items — statsborgerproven.json asks which
// countries occupied Norway, norskprove listening lists Nordic countries as options. A
// country name as CONTENT is not a fork leak; only an ancestor's EXAM / AUTHORITY /
// INSTITUTION / PRODUCT / LOCALE noun is. Banning the country words would fail the gate
// on correct content, and a gate that cries wolf gets switched off.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "scripts", "prisma"];
const SCAN_EXT = /\.(ts|tsx|js|mjs|json|prisma|css|md)$/;

// Files allowed to mention an ancestor noun, with the reason. Kept deliberately tiny —
// every entry is a hole in the gate.
const ALLOWLIST = new Map([
  // The family nav legitimately links to sibling AlmiWorld products by name.
  ["src/lib/nav/family.ts", "links to sibling AlmiWorld products by name"],
  // This gate documents the exact leaks it prevents.
  ["scripts/seo/fork-hygiene-gate.mjs", "documents the banned nouns"],
]);

// Per-line escape for prose that must NAME an ancestor to warn about it. Deliberately
// verbose so it shows up in review: a line carrying this marker asserts "on purpose".
const LINE_ESCAPE = "hygiene-allow";

// Ancestor proper nouns. A Norwegian product naming any of these is a fork leak.
// ⚠️ PRODUCT-SPECIFIC — RE-CUT AT EVERY FORK, IN BOTH DIRECTIONS. Bare country names are
// NOT here on purpose (see the header). Norwegian's OWN nouns (Norskprøven, Bergenstesten,
// Statsborgerprøven, UDI, HK-dir, Utlendingsdirektoratet, Leseforståelse...) must NEVER
// be added — they are this product's subject matter.
const BANNED = [
  // — Danish (the IMMEDIATE ancestor) — exam / authority / skill nouns only —
  "Prøve i Dansk", "Indfødsretsprøven", "Studieprøven",
  "Styrelsen for Patientsikkerhed", "Styrelsen for International Rekruttering",
  "Læsning", "Lytning", "Skrivning",           // Danish skill words; Norwegian uses Leseforståelse/Lytteforståelse/Skriftlig
  "da-DK",
  // — Icelandic — institutions / exam / locale (bare "Iceland" NOT banned: Nordic context is legitimate) —
  "Ríkisborgarapróf", "Útlendingastofnun", "Háskóli Íslands",
  "is-IS",
  // — German (Goethe lineage) — Norwegian teaches no German; institution/exam/locale nouns are leaks —
  "Goethe-Institut", "Goethe-Zertifikat", "TestDaF",
  "de-DE",
  // — CELPIP (root ancestor) —
  "CELPIP",
  // Sibling/ancestor PRODUCT names are appended below — GENERATED, not hand-listed.
];

// ── Ancestor product names, in every form a slug can ship in ─────────────────
// Hand-listing these was itself a fork bug in the lineage: a list carried "almi-x"
// (hyphen) but not "almi_x" (underscore), and an underscore identifier — a session
// cookie, a CSS class — sailed through the gate meant to ban it. A grep does not know
// that `almi-x` and `almi_x` are the same idea. So name the products once and let the
// code enumerate the spellings.
const ANCESTOR_PRODUCTS = ["celpip", "goethe", "icelandic", "danish"];
/** Every form a product slug ships in: almi-x · almi_x · almix · AlmiX. */
function productNameForms(p) {
  return [`almi-${p}`, `almi_${p}`, `almi${p}`, `Almi${p[0].toUpperCase()}${p.slice(1)}`];
}
for (const p of ANCESTOR_PRODUCTS) BANNED.push(...productNameForms(p));
// Display names the generator cannot derive from a plain capitalisation. Keep SHORT.
BANNED.push("AlmiCELPIP");

// SELF-CHECK. A blanket find-replace of an ancestor's product name across the repo can
// also rewrite THIS list, making the gate ban "AlmiNorwegian" — this product's own name —
// and report a leak storm of false positives (swiss hit exactly this, 90 of them). A
// careless global replace is the very thing this gate exists to catch, so assert it
// outright rather than relying on someone noticing the count moved the wrong way.
const SELF_NAMES = ["AlmiNorwegian", "almi-norwegian", "almi_norwegian", "alminorwegian"];
for (const n of SELF_NAMES) {
  if (BANNED.some((b) => b.toLowerCase() === n.toLowerCase())) {
    console.error("");
    console.error(`FORK-HYGIENE GATE IS MISCONFIGURED: BANNED contains "${n}", which is THIS product's own name.`);
    console.error("Every legitimate mention of ourselves would be reported as an ancestor leak.");
    console.error("Almost certainly a global find-replace that rewrote the banned list. Fix BANNED.");
    console.error("");
    process.exit(2);
  }
}

// Acronyms need word boundaries — they collide with ordinary substrings.
// ⚠️ UDI is Norway's own authority (Utlendingsdirektoratet) — it is DELIBERATELY ABSENT.
// The swiss original banned UDI because for a Swiss product Norway is an ancestor; here
// it is the subject. SIRI = Denmark's Styrelsen for International Rekruttering, CLB =
// CELPIP's Canadian Language Benchmark — both ancestors, both leaks.
const BANNED_WORD = ["SIRI", "CLB"];

// ── Scanning machinery (the real-entity-gate design: strip comments, scan STRING
//    values, never raw JSON). COMMENTS ARE NOT SCANNED — a comment naming an ancestor
//    is documentation, usually the note explaining a duplication so it is not mistaken
//    for original work. STRING LITERALS ARE SCANNED — they are the copy that ships.

// The stripper tracks string state so a `//` inside "https://…" is not mistaken for a
// comment — the common way a naive stripper eats real copy.
function stripComments(text) {
  let out = "";
  let i = 0;
  let quote = null;
  let inLine = false;
  let inBlock = false;
  while (i < text.length) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === "\n") { inLine = false; out += c; }
      else out += " ";
      i++; continue;
    }
    if (inBlock) {
      if (c === "*" && n === "/") { inBlock = false; out += "  "; i += 2; continue; }
      out += c === "\n" ? c : " ";
      i++; continue;
    }
    if (quote) {
      if (c === "\\") { out += text.slice(i, i + 2); i += 2; continue; }
      if (c === quote) quote = null;
      out += c; i++; continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; out += c; i++; continue; }
    if (c === "/" && n === "/") { inLine = true; out += "  "; i += 2; continue; }
    if (c === "/" && n === "*") { inBlock = true; out += "  "; i += 2; continue; }
    out += c; i++;
  }
  return out;
}

// Prisma comments are `//` and `///` — NOT `#` (a common wrong assumption; the swiss
// original stripped `#` and so scanned prisma's `//` provenance comments as if they were
// shipping copy, flagging every "forked from AlmiCELPIP" note). stripComments handles
// `//` while respecting string literals, so prisma reuses it.

// JSON is scanned as PARSED STRING VALUES: scanning raw JSON text matches escape
// sequences rather than content, and a gate that scans the wrong thing has never
// truly been red.
function jsonStrings(node, out = []) {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) for (const v of node) jsonStrings(v, out);
  else if (node && typeof node === "object") for (const v of Object.values(node)) jsonStrings(v, out);
  return out;
}

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e === ".git") continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.test(e)) out.push(full);
  }
  return out;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    if (ALLOWLIST.has(rel)) continue;
    const raw = readFileSync(file, "utf8");
    let text;
    if (rel.endsWith(".json")) {
      try { text = jsonStrings(JSON.parse(raw)).join("\n"); }
      catch { text = raw; }   // malformed JSON: fall back rather than skip silently
    } else if (rel.endsWith(".prisma")) {
      text = stripComments(raw);   // prisma comments are // — see note above
    } else {
      text = stripComments(raw);
    }
    const lines = text.split(/\r?\n/);
    // The per-line escape lives in a TRAILING COMMENT, so it must be read from the RAW
    // line — stripping comments removed the marker along with them.
    const rawLines = raw.split(/\r?\n/);

    lines.forEach((line, i) => {
      if ((rawLines[i] ?? "").includes(LINE_ESCAPE)) return;
      for (const term of BANNED) {
        if (line.includes(term)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
      for (const term of BANNED_WORD) {
        if (new RegExp(`\\b${term}\\b`).test(line)) {
          violations.push(`${rel}:${i + 1}  banned ancestor noun "${term}"\n      ${line.trim().slice(0, 120)}`);
        }
      }
    });
  }
}

if (violations.length) {
  console.error("\n✗ FORK HYGIENE GATE FAILED — ancestor content found.\n");
  console.error("  Norway must read as Norway. These are leaks from the fork lineage");
  console.error("  (celpip → goethe → icelandic → danish → norwegian).\n");
  for (const v of [...new Set(violations)]) console.error(`  ${v}`);
  console.error(`\n  ${violations.length} violation(s). Fix the FACT, not just the label —`);
  console.error("  the worst leaks are the ones where only the country word was swapped.\n");
  process.exit(1);
}

console.log(`✓ Fork hygiene gate: clean (no ancestor nouns across ${SCAN_DIRS.join(", ")}).`);
