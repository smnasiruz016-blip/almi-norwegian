// Import real AlmiWorld axis datasets into compact SEO bundles.
// Sources are read-only from sibling repos/packages; nothing is fabricated.
// Emits: src/data/seo/{universities,roles,countries,subjects,hubs}.json
import { createRequire } from "node:module";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/data/seo");
mkdirSync(OUT, { recursive: true });

const write = (name, data) => {
  writeFileSync(path.join(OUT, name), JSON.stringify(data));
  console.log(`  ${name}: ${Array.isArray(data) ? data.length : "?"} rows`);
};

// --- Universities (3,197) ---
const unisRaw = require("C:/Users/Lenovo/Documents/GitHub/almistudy/lib/universities-publishable.json");
const universities = unisRaw.map((u) => ({
  slug: u.slug,
  name: u.name,
  city: u.city || null,
  countrySlug: u.country?.slug || null,
  countryName: u.country?.name || null,
  cc: u.country?.iso2 || null,
  controlType: u.controlType || null, // public/private for content flavour
  subjects: Array.isArray(u.subjects) ? u.subjects.slice(0, 6) : [],
}));

// --- Roles (519 → exclude open-cv → 518, matching the almijob adapter) ---
const rolesPkg = require("C:/Projects/almi-shared-roles/dist/index.js");
const rolesAll = rolesPkg.getAllRoles();
const roles = rolesAll
  .filter((r) => r.slug !== "open-cv")
  .map((r) => ({ slug: r.slug, name: r.name, industry: r.industry, collar: r.collar }));

// --- Countries (197 → exclude portugal as an origin → 196) ---
const countriesPkg = require("C:/Projects/almi-data/dist/index.js");
const countries = countriesPkg.COUNTRIES
  .filter((c) => c.slug !== "portugal")
  .map((c) => ({ slug: c.slug, name: c.name, flag: c.flag }));

// --- Subjects (12 canonical, from almistudy subject-mapper) ---
const subjects = [
  { slug: "medicine-health-sciences", name: "Medicine & Health Sciences" },
  { slug: "engineering-technology", name: "Engineering & Technology" },
  { slug: "computer-science-it", name: "Computer Science & IT" },
  { slug: "business-management", name: "Business & Management" },
  { slug: "law", name: "Law" },
  { slug: "natural-sciences", name: "Natural Sciences" },
  { slug: "arts-humanities", name: "Arts & Humanities" },
  { slug: "social-sciences", name: "Social Sciences" },
  { slug: "education", name: "Education" },
  { slug: "mathematics-statistics", name: "Mathematics & Statistics" },
  { slug: "architecture-design", name: "Architecture & Design" },
  { slug: "agriculture-environment", name: "Agriculture & Environment" },
];

// --- Hubs (3 authored Portuguese work locations; real cities, distinct identities) ---
const hubs = [
  { slug: "lisbon", name: "Lisbon", region: "Lisbon metropolitan area",
    profile: "Portugal's capital and largest economy — services, finance, a fast-growing startup and tech scene, tourism and international companies." },
  { slug: "porto", name: "Porto", region: "Norte",
    profile: "The northern economic hub — industry and manufacturing, a rising tech and startup community, plus the port-wine and creative sectors." },
  { slug: "braga", name: "Braga", region: "Minho",
    profile: "A compact tech and manufacturing centre with strong universities and a lower cost of living, often called one of Portugal's emerging tech hubs." },
];

console.log("Writing SEO axis bundles:");
write("universities.json", universities);
write("roles.json", roles);
write("countries.json", countries);
write("subjects.json", subjects);
write("hubs.json", hubs);

const S = universities.length * subjects.length * countries.length;
const J = roles.length * countries.length * hubs.length;
console.log("\nMatrix:");
console.log(`  Study = ${universities.length} unis × ${subjects.length} subjects × ${countries.length} origins = ${S.toLocaleString()}`);
console.log(`  Jobs  = ${roles.length} roles × ${countries.length} origins × ${hubs.length} hubs = ${J.toLocaleString()}`);
console.log(`  Levels = 6`);
console.log(`  GRAND TOTAL ≈ ${(S + J + 6).toLocaleString()}`);
