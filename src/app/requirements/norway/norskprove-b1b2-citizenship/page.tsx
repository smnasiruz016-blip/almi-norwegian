import type { Metadata } from "next";
import Link from "next/link";

// Honest requirements explainer: what Norwegian you actually need for citizenship,
// and how to PREPARE for it. Framed as honest preparation, never as beating or
// getting around UDI. ISR.
//
// FACT BASE — verified 2026-07-15 against the authorities themselves. Read this before
// changing any claim on this page; an earlier version of it invented all three.
//
//  • Norskprøven has NO pass mark and no pass/fail. HK-dir's own FAQ: "You will only get
//    a result." Each part is reported at its own CEFR level, parts can be retaken
//    individually, and "the best and last result will be on your transcript".
//    → There is NO combined average and NO weighting. Never say the test is "passed".
//  • "B1–B2" is the VERSION of the test you sit (which level-pair paper), not a grade and
//    not the requirement.
//  • UDI sets the citizenship requirement, HK-dir runs the test. For applications from
//    1 Oct 2022, ages 18–67: the ORAL part at level B1 or higher, PLUS the citizenship
//    test (or the social studies test) in Norwegian. Reading, listening and writing
//    levels are NOT part of the citizenship requirement.
//  • A2 oral suffices for specific exempted groups (stateless; over 55 who arrived via
//    protection/resettlement; over 55 on disability benefit) — we point at UDI rather
//    than enumerate, because these change.
//
// Sources: prove.hkdir.no (FAQ + Find your result + Language levels) and
// udi.no/en/word-definitions/test-requirements-norwegian-citizenship/
export const revalidate = 2592000;

const PATH = "/requirements/norway/norskprove-b1b2-citizenship";

const UDI_SOURCE = "https://www.udi.no/en/word-definitions/test-requirements-norwegian-citizenship/";
const HKDIR_SOURCE = "https://prove.hkdir.no/en/frequently-asked-questions-about-the-norwegian-language-test-a1-b2";

export const metadata: Metadata = {
  title: { absolute: "Norskprøven for Citizenship: You Need B1 on the Oral Part" },
  description:
    "For Norwegian citizenship, UDI requires level B1 or higher on the oral part of Norskprøven — plus the citizenship test. Norskprøven itself has no pass mark: you get a level per part. Practise honestly with AlmiNorwegian.",
  alternates: { canonical: PATH },
  openGraph: {
    title: "Norskprøven for citizenship — you need B1 on the oral part",
    description:
      "Honest guide to the Norwegian citizenship language requirement: B1 or higher on the oral part of Norskprøven, plus the citizenship test. Confirm your own conditions with UDI.",
  },
};

const FAQ = [
  {
    q: "What Norwegian level do I need for citizenship?",
    a: "Level B1 or higher on the oral part of Norskprøven. UDI sets this requirement; it applies to applicants aged 18 to 67 who applied on or after 1 October 2022. Your reading, listening and writing levels are not part of the citizenship language requirement — only the oral part is. You must also pass the citizenship test (Statsborgerprøven) or the social studies test in Norwegian. Some applicants may meet the requirement at A2 instead, so confirm your own situation with UDI.",
  },
  {
    q: "What is the pass mark for Norskprøven?",
    a: "There isn't one. Norskprøven is not pass/fail and has no pass mark — HK-dir, which runs the test, says plainly that \"you will only get a result\". Each part is reported at its own CEFR level, and there is no combined average and no weighting between parts. What counts is the level you achieve on the part a given authority asks about — for citizenship, that is B1 or higher on the oral part.",
  },
  {
    q: "Does \"B1–B2\" mean I need B1–B2 in everything?",
    a: "No. B1–B2 is the version of Norskprøven you sit — which level-pair paper you take — not a grade and not the requirement. You can sit the B1–B2 version and be awarded a different level on each part. For citizenship, only your oral level matters, and it must be B1 or higher.",
  },
  {
    q: "Is the oral level enough for citizenship?",
    a: "It is the language requirement, not the whole application. Citizenship also depends on the citizenship test and on residency and other conditions decided by UDI. We don't state a fixed number of years or a fixed step, because those conditions change. Always confirm the current requirement for your own situation with UDI.",
  },
  {
    q: "How does AlmiNorwegian help?",
    a: "AlmiNorwegian is honest practice, not the official test. You practise the four parts — Leseforståelse, Lytteforståelse, Skriftlig framstilling and Muntlig — and get a per-skill readiness band (Clear or Borderline) against the real task criteria. It is an estimate to guide your prep, never an official HK-dir result or a UDI decision.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

function Row({
  skill,
  norwegian,
  requirement,
  note,
}: {
  skill: string;
  norwegian: string;
  requirement: string;
  note: string;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 sm:grid-cols-[8rem_10rem_1fr]">
      <div className="text-sm font-semibold text-almi-ink">{skill}</div>
      <div className="text-sm font-bold text-almi-coral-deep">{norwegian}</div>
      <div className="col-span-2 text-sm text-almi-text sm:col-span-1">
        <span className="font-semibold text-almi-ink">{requirement}</span> — {note}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="bg-almi-bg text-almi-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-almi-text-muted">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:text-almi-coral">Home</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><Link href="/exams" className="hover:text-almi-coral">Norwegian exams</Link></li>
            <li className="flex items-center gap-1"><span aria-hidden>/</span><span>Norskprøven: citizenship Norwegian</span></li>
          </ol>
        </nav>

        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-almi-accent-deep">Requirements · Norway</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight text-almi-ink sm:text-4xl">
            What Norwegian do you need for citizenship? B1 on the oral part of Norskprøven.
          </h1>
          <p className="mt-3 text-base text-almi-text">
            For Norwegian citizenship, <strong>UDI</strong> (Utlendingsdirektoratet, the Norwegian Directorate of
            Immigration) requires level <strong>B1 or higher on the oral part</strong> of Norskprøven — and separately,
            that you pass the citizenship test. The test itself is run by{" "}
            <strong>HK-dir</strong> (Direktoratet for høyere utdanning og kompetanse, the Directorate for Higher
            Education and Skills). Here&apos;s an honest read on what is actually required, and how to prepare for it
            fairly.
          </p>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-almi-ink">What counts for citizenship</h2>
          <Row
            skill="Speaking"
            norwegian="Muntlig"
            requirement="B1 or higher"
            note="this is the citizenship language requirement. Take part in everyday conversations and answer familiar questions in Norwegian."
          />
          <Row
            skill="Reading"
            norwegian="Leseforståelse"
            requirement="No level required"
            note="not part of the citizenship requirement. Other purposes ask for it — higher education, for instance, asks for B2 on all four parts."
          />
          <Row
            skill="Listening"
            norwegian="Lytteforståelse"
            requirement="No level required"
            note="not part of the citizenship requirement, though it underpins the oral part in practice."
          />
          <Row
            skill="Writing"
            norwegian="Skriftlig framstilling"
            requirement="No level required"
            note="not part of the citizenship requirement."
          />
          <p className="text-xs text-almi-text-muted">
            General information about the language requirement, not advice about your citizenship application. Only UDI
            can tell you which conditions apply to you.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
          <h2 className="text-xl font-semibold text-almi-ink">Norskprøven has no pass mark</h2>
          <p className="mt-3 text-base text-almi-text">
            Norskprøven is <strong>not pass/fail</strong>. HK-dir, which runs it, puts it plainly:{" "}
            <em>&ldquo;You will only get a result.&rdquo;</em> Each part is reported at{" "}
            <strong>its own CEFR level</strong> — there is no combined average, no overall score, and no weighting that
            makes one part count for more than another. Parts can be retaken individually, and the best and last result
            appears on your transcript.
          </p>
          <p className="mt-3 text-base text-almi-text">
            So nothing &ldquo;passes&rdquo; Norskprøven as such. What matters is the <strong>level you achieve on the
            part a given authority asks about</strong>. For citizenship, that is <strong>B1 or higher on the oral
            part</strong> — a level, not a mark.
          </p>
          <p className="mt-3 text-sm text-almi-text-muted">
            Source:{" "}
            <a href={HKDIR_SOURCE} rel="nofollow noopener" className="font-semibold text-almi-coral underline">
              HK-dir — frequently asked questions about the Norwegian language test
            </a>
            . Verified 2026-07-15.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6">
          <h2 className="text-xl font-semibold text-almi-ink">&ldquo;B1–B2&rdquo; is a test version, not a grade</h2>
          <p className="mt-3 text-base text-almi-text">
            Norskprøven is offered in level-pair versions, and <strong>B1–B2 is the version you sit</strong> — which
            paper you take — not a result and not the requirement. You can sit the B1–B2 version and be awarded a
            different level on each part. It is worth knowing this before you book: the label on the test is not the
            label on your result.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">The oral level is only one part</h2>
          <p className="mt-3 text-base text-almi-text">
            Your oral level proves the <strong>language</strong> requirement. It does not decide your application on its
            own. For citizenship you must also pass the <strong>citizenship test</strong> (Statsborgerprøven) or the
            social studies test <strong>in Norwegian</strong>, and citizenship depends on{" "}
            <strong>residency and other conditions</strong> set by UDI. Those rules change over time, so we don&apos;t
            state a fixed number of years or a fixed step. Check your own situation directly with UDI rather than
            assuming.
          </p>
          <p className="mt-3 text-base text-almi-text">
            The requirement above applies to applicants <strong>aged 18 to 67</strong> who applied on or after{" "}
            <strong>1 October 2022</strong>. Some applicants meet the requirement at <strong>A2</strong> instead — the
            exemptions are specific and they change, so confirm yours with UDI rather than relying on this page.
          </p>
          <p className="mt-3 text-sm text-almi-text-muted">
            Source:{" "}
            <a href={UDI_SOURCE} rel="nofollow noopener" className="font-semibold text-almi-coral underline">
              UDI — test requirements for Norwegian citizenship
            </a>
            . Verified 2026-07-15.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">How to prepare — honestly</h2>
          <p className="mt-3 text-base text-almi-text">
            If citizenship is your goal, the oral part is what your requirement rests on — so that is where preparation
            earns the most. The other parts still help: <strong>Lytteforståelse</strong> (listening) underpins a
            conversation, and reading and writing matter for plenty of other purposes. AlmiNorwegian lets you practise
            all four and shows an honest per-skill readiness band (Clear or Borderline) against the real task criteria —
            an estimate to guide your prep, never an official HK-dir result or a UDI decision. We help you prepare
            fairly; we don&apos;t claim to shortcut the process.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-bg-peach bg-almi-paper p-6 text-center shadow-sm">
          <p className="text-base font-semibold text-almi-ink">Practise the oral part — and the rest — honestly.</p>
          <Link
            href="/signup"
            className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-full bg-almi-coral px-7 py-3 text-base font-semibold text-almi-ink hover:bg-almi-coral-deep"
          >
            Start your 7-day free trial
          </Link>
          <p className="mt-3 text-xs text-almi-text-muted">$12/month after the trial · cancel anytime</p>
        </section>

        <section className="mt-10 rounded-2xl border border-almi-accent/40 bg-almi-accent/10 p-5">
          <p className="text-sm text-almi-ink">
            <strong>Always confirm your own requirement with UDI.</strong> Residency and citizenship rules change, and
            only the official authorities can tell you which conditions apply to your situation. AlmiNorwegian helps you
            prepare for the language test — it doesn&apos;t decide or replace the official process.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">Questions</h2>
          <dl className="mt-4 space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border border-almi-bg-peach bg-almi-paper p-5">
                <dt className="font-semibold text-almi-ink">{f.q}</dt>
                <dd className="mt-1 text-sm text-almi-text">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-almi-ink">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            <li><Link href="/exams/norskprove-b1b2" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Norskprøven B1–B2 guide</Link></li>
            <li><Link href="/exams/statsborgerproven" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Statsborgerprøven guide</Link></li>
            <li><Link href="/exams/norskprove-a1a2" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">Norskprøven A1–A2 guide</Link></li>
            <li><Link href="/exams" className="inline-block rounded-full border border-almi-bg-peach bg-almi-paper px-3 py-1.5 text-sm text-almi-ink hover:border-almi-coral">All Norwegian exams</Link></li>
          </ul>
        </section>
      </div>
    </main>
  );
}
