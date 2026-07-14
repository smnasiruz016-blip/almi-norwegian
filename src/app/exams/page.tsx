import type { Metadata } from "next";
import Link from "next/link";
import {
  LANGUAGE_EXAMS,
  KNOWLEDGE_EXAMS,
  type ExamMeta,
} from "@/lib/dk/registry";

export const metadata: Metadata = {
  title: {
    absolute:
      "Danish exams — Prøve i Dansk 1–3, Studieprøven & knowledge tests | AlmiDanish",
  },
  description:
    "The Danish exams for citizenship, permanent residence, getting started and university — Prøve i Dansk 1, 2 and 3, Studieprøven, plus the Indfødsretsprøven and Medborgerskabsprøven knowledge tests. Honest per-skill readiness practice.",
  alternates: { canonical: "/exams" },
};

function ExamList({ exams }: { exams: ExamMeta[] }) {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {exams.map((e) => (
        <li key={e.slug}>
          <Link
            href={`/exams/${e.slug}`}
            className="flex h-full flex-col rounded-2xl border border-almi-bg-peach bg-almi-paper p-5 hover:border-almi-coral"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-md bg-almi-bg-peach px-1.5 text-xs font-bold text-almi-ink">{e.cefr}</span>
              <span className="text-lg font-semibold text-almi-ink">{e.name}</span>
              {e.lead && <span className="rounded-full bg-almi-coral/15 px-2 py-0.5 text-xs font-semibold text-almi-coral-deep">Citizenship</span>}
            </div>
            <span className="mt-2 text-sm text-almi-text-muted">{e.blurb}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function DanishExamsHub() {
  return (
    <main className="bg-almi-bg text-almi-text">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-almi-ink sm:text-4xl">
          Danish exams — citizenship, residence, study &amp; getting started
        </h1>
        <p className="mt-3 max-w-2xl text-base text-almi-text">
          The Prøve i Dansk ladder (PD1–PD3 and Studieprøven), administered under the Ministry of
          Immigration and Integration, plus the two Danish society knowledge tests. Each language
          exam tests Reading, Listening, Writing and Speaking. Pick a level for an honest readiness
          estimate — never a fabricated official result.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">Prøve i Dansk ladder</h2>
          <p className="mt-1 text-sm text-almi-text-muted">
            The core Danish-language exams. Prøve i Dansk 3 (B1–B2) is commonly required for Danish
            citizenship; Prøve i Dansk 2 (A2–B1) for permanent residence; Prøve i Dansk 1 (A1–A2) to
            get started; and Studieprøven (≈C1) for admission to Danish-taught university programmes.
            Confirm the current residency and citizenship rules with SIRI.
          </p>
          <ExamList exams={LANGUAGE_EXAMS} />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-almi-ink">Danish society knowledge tests</h2>
          <p className="mt-1 text-sm text-almi-text-muted">
            Multiple-choice tests about Danish society, history and culture — not language
            proficiency. The Indfødsretsprøven is required for citizenship in addition to Prøve i
            Dansk 3; the Medborgerskabsprøven is used on the permanent-residence path. Our questions
            are original practice, not the official question bank.
          </p>
          <ExamList exams={KNOWLEDGE_EXAMS} />
        </section>
      </div>
    </main>
  );
}
