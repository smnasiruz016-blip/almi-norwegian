// Taught-only index for the study sitemap (AlmiWorld pSEO Localization Standard).
//
// The full study matrix is subject × country × university (~7.5M), but ~63% of
// those cells are UNTAUGHT — the reference university doesn't teach the subject —
// and the page renders `robots: noindex`. Advertising those in the sitemap just
// burns crawl budget + ISR writes on pages Google is told not to index. This
// module enumerates ONLY the taught (subject, university) pairs × countries, so
// the sitemap emits exactly the indexable study leaves. It is the same taught
// predicate the page uses (canonicalSubjectsOf / uniTeaches), so sitemap and
// robots can never drift.

import { UNIVERSITIES, COUNTRIES, SUBJECT_BY_SLUG, N_COUNTRY, type SeoSubject, type SeoUniversity } from "@/lib/seo/axes";
import { canonicalSubjectsOf } from "@/lib/seo/subject-mapper";

// One entry per (subject, university) the uni actually teaches. Built once.
const TAUGHT_PAIRS: { subject: SeoSubject; university: SeoUniversity }[] = [];
for (const u of UNIVERSITIES) {
  for (const slug of canonicalSubjectsOf(u)) {
    const subject = SUBJECT_BY_SLUG.get(slug);
    if (subject) TAUGHT_PAIRS.push({ subject, university: u });
  }
}

// Total indexable study leaves = taught pairs × countries. Ordered so a linear
// index maps to (pair, country): index = pairIndex * N_COUNTRY + countryIndex.
export const TAUGHT_STUDY_TOTAL = TAUGHT_PAIRS.length * N_COUNTRY;

export function taughtStudyComboAtIndex(
  i: number,
): { subject: SeoSubject; country: (typeof COUNTRIES)[number]; university: SeoUniversity } | null {
  if (i < 0 || i >= TAUGHT_STUDY_TOTAL) return null;
  const pair = TAUGHT_PAIRS[Math.floor(i / N_COUNTRY)];
  const country = COUNTRIES[i % N_COUNTRY];
  if (!pair || !country) return null;
  return { subject: pair.subject, country, university: pair.university };
}
