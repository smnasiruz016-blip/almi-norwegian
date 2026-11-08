import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GlobalHeader } from "@/components/GlobalHeader";
import { GlobalFooter } from "@/components/GlobalFooter";

// RR-400: the Allura script font was loaded (and preloaded, ~49 KB) on every page but no element uses `font-script`, so it only
// competed with the page for bandwidth before the first big paint. Removed; Inter stays.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const SITE_URL = "https://alminorwegian.almiworld.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AlmiNorwegian — Norskprøven & Bergenstesten practice with honest AI feedback",
    template: "%s · AlmiNorwegian",
  },
  description:
    "Practise the Norwegian exams — Norskprøven A1–A2, A2–B1 and B1–B2, Bergenstesten, and the Statsborgerprøven and Samfunnskunnskapsprøven knowledge tests — with honest per-skill readiness estimates and AI feedback. Try free for 48 hours, no card. Then $12/month. Original material, never copied from official exam papers. Confirm residency and citizenship rules with UDI. Part of the AlmiWorld family.",
  applicationName: "AlmiNorwegian",
  authors: [{ name: "AlmiWorld" }],
  keywords: ["Norskprøven", "Norskprøven B1–B2", "Norwegian citizenship test", "Statsborgerprøven", "Samfunnskunnskapsprøven", "Bergenstesten", "learn Norwegian", "Norwegian exam practice", "permanent residence Norway", "AlmiNorwegian", "AlmiWorld"],
  openGraph: {
    title: "AlmiNorwegian — honest Norskprøven & Bergenstesten practice",
    description: "Original Norwegian practice for the Norskprøven ladder, Bergenstesten and the Norwegian society knowledge tests — honest per-skill readiness estimates and AI feedback.",
    url: SITE_URL,
    siteName: "AlmiNorwegian",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "AlmiNorwegian — Norskprøven & Bergenstesten practice", description: "Honest Norwegian practice — per-skill readiness estimates, ranges not inflated numbers." },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GlobalHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <GlobalFooter />
      </body>
    </html>
  );
}
