// Freeform university-subject string → one of the 12 canonical subject slugs.
// Ported from AlmiStudy's mapper (same 12 categories). Used for the TAUGHT-GATE:
// a study cell is INDEXED only where the university actually teaches the subject;
// otherwise it noindex + canonical-ups to the subject×origin hub (Localization
// Standard rule #3 — noindex only genuinely empty/nonsensical cells).
//
// Returns null when nothing matches (honest — no forced "Other" bucket).

import type { SeoUniversity } from "@/lib/seo/axes";

export type SubjectSlug =
  | "medicine-health-sciences"
  | "engineering-technology"
  | "computer-science-it"
  | "business-management"
  | "law"
  | "natural-sciences"
  | "arts-humanities"
  | "social-sciences"
  | "education"
  | "mathematics-statistics"
  | "architecture-design"
  | "agriculture-environment";

// Most-specific FIRST; first match wins. Word-boundary anchors where an
// unanchored token would over-match (e.g. \blaw\b, \barts?\b).
const PATTERNS: ReadonlyArray<{ pattern: RegExp; slug: SubjectSlug }> = [
  { pattern: /computer|software|information tech|data science|cyber|\bAI\b|informatics/i, slug: "computer-science-it" },
  { pattern: /medicine|medical|health|nursing|pharmacy|dental|dentist|odontolog|veterinary/i, slug: "medicine-health-sciences" },
  { pattern: /engineer|mechanical|electrical|civil eng/i, slug: "engineering-technology" },
  { pattern: /business|management|\bMBA\b|finance|marketing|economics|accounting|tourism|hospitality|public administration/i, slug: "business-management" },
  { pattern: /\blaw\b|legal|jurisprudence/i, slug: "law" },
  { pattern: /architect|\bdesign\b|urban plan/i, slug: "architecture-design" },
  { pattern: /agricultur|agronom|forestry|environment|ecology/i, slug: "agriculture-environment" },
  { pattern: /math|statistic|actuarial/i, slug: "mathematics-statistics" },
  { pattern: /educat|pedagog|teaching/i, slug: "education" },
  { pattern: /physics|chemistry|biology|biotech|natural sci|geograph|geolog|marine science|sport science|materials science|earth science|applied science/i, slug: "natural-sciences" },
  { pattern: /sociolog|psycholog|political|social sci|anthropolog|communication|international relations|journalism|criminolog/i, slug: "social-sciences" },
  { pattern: /\barts?\b|humanit|history|philosoph|literature|language|theology|religious|linguistic|music|film|\bletters?\b|philolog/i, slug: "arts-humanities" },
];

/** Map one freeform subject string to a canonical slug, or null. */
export function mapToCanonical(freeform: string): SubjectSlug | null {
  if (!freeform) return null;
  for (const { pattern, slug } of PATTERNS) {
    if (pattern.test(freeform)) return slug;
  }
  return null;
}

/** The canonical subject slugs a university teaches (deduped). */
export function canonicalSubjectsOf(uni: SeoUniversity): Set<SubjectSlug> {
  const out = new Set<SubjectSlug>();
  for (const s of uni.subjects ?? []) {
    const slug = mapToCanonical(s);
    if (slug) out.add(slug);
  }
  return out;
}

/** TAUGHT-GATE: does this university actually teach this canonical subject? */
export function uniTeaches(uni: SeoUniversity, subjectSlug: string): boolean {
  return canonicalSubjectsOf(uni).has(subjectSlug as SubjectSlug);
}
