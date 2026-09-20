#!/usr/bin/env node
/**
 * Check the built site's SEO invariants, and fail the build if one is broken.
 *
 * Everything here is silent when it breaks. A layout deleted in a refactor, a
 * race added to the backend but not pulled into `lib/seo/races.ts`, a rename
 * that leaves the sitemap pointing at a 404 — none of them throw, none of them
 * show up on screen, and all of them cost weeks of ranking before anyone
 * notices. So they are asserted against the real `out/` directory after every
 * build rather than trusted.
 *
 * Runs automatically as `postbuild`. Run it alone with `npm run seo:check`
 * against an existing `out/`.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

const failures = [];
const fail = (message) => failures.push(message);

/* Next's own not-found pages. They are noindex by design and share the root
   title because the site does not define a custom one, so they are exempt from
   both the uniqueness and the indexability checks rather than made to pass. */
const NOT_FOUND_ROUTES = ["404", "_not-found"];

/** Routes that must never be indexable, mirroring app/robots.ts. */
const PRIVATE_ROUTES = [
  "dashboard", "plans", "plan", "plan-builder", "race-mode", "post-race",
  "settings", "notifications", "onboarding", "coach", "admin",
  "admin/accounts", "shared", "reset-password", "races/add", "map-check",
  "course-recon",
];

if (!(await stat(OUT).catch(() => null))) {
  console.error("seo-check: no out/ directory — run `npm run build` first.");
  process.exit(1);
}

/* The committed race list is the source of truth for which pages must exist;
   read as text rather than imported, because it is TypeScript. */
const racesSource = await readFile(join(ROOT, "lib", "seo", "races.ts"), "utf8");
const raceEntries = [...racesSource.matchAll(/slug: "([^"]+)",[\s\S]*?showcase: (true|false),/g)].map(
  ([, slug, showcase]) => ({ slug, showcase: showcase === "true" }),
);
const indexable = raceEntries.filter((race) => !race.showcase).map((race) => race.slug);
if (indexable.length === 0) fail("lib/seo/races.ts lists no indexable races");

/** Every index.html in out/, as a route path. */
async function* pages(dir = OUT) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_next") continue;
      yield* pages(full);
    } else if (entry.name === "index.html") {
      const route = relative(OUT, dir).split("\\").join("/");
      yield { route, file: full };
    }
  }
}

const seenTitles = new Map();
let checked = 0;

for await (const { route, file } of pages()) {
  if (NOT_FOUND_ROUTES.includes(route)) continue;

  const html = await readFile(file, "utf8");
  checked += 1;

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) fail(`/${route} has no <title>`);
  else if (seenTitles.has(title)) fail(`/${route} and /${seenTitles.get(title)} share the title ${JSON.stringify(title)}`);
  else seenTitles.set(title, route);

  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) {
    fail(`/${route} has no usable <meta name="description">`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) fail(`/${route} has no canonical URL`);
  else if (!canonical.endsWith("/")) fail(`/${route} canonical ${canonical} has no trailing slash`);

  const robots = html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
  const isPrivate = PRIVATE_ROUTES.includes(route);
  if (isPrivate && !robots.includes("noindex")) fail(`/${route} is private but is not noindex`);
  if (!isPrivate && robots.includes("noindex")) fail(`/${route} is public but is marked noindex`);
}

/* One page per indexable race, with the race's own name in its title. */
for (const slug of indexable) {
  const file = join(OUT, "races", slug, "index.html");
  if (!(await stat(file).catch(() => null))) {
    fail(`no page was built for race ${slug} — is it missing from generateStaticParams?`);
    continue;
  }
  const html = await readFile(file, "utf8");
  if (!html.includes('"@type":"SportsEvent"')) fail(`/races/${slug}/ has no SportsEvent structured data`);
}

/* The sitemap must name every race page and nothing that 404s. */
const sitemap = await readFile(join(OUT, "sitemap.xml"), "utf8").catch(() => null);
if (!sitemap) fail("no sitemap.xml was written");
else {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
  for (const slug of indexable) {
    if (!locs.some((url) => url.endsWith(`/races/${slug}/`))) fail(`sitemap.xml is missing /races/${slug}/`);
  }
  for (const url of locs) {
    const path = new URL(url).pathname.replace(/^\/|\/$/g, "");
    const file = path === "" ? join(OUT, "index.html") : join(OUT, path, "index.html");
    if (!(await stat(file).catch(() => null))) fail(`sitemap.xml lists ${url}, which was not built`);
    if (PRIVATE_ROUTES.includes(path)) fail(`sitemap.xml lists ${url}, which is a private page`);
  }
}

const robotsTxt = await readFile(join(OUT, "robots.txt"), "utf8").catch(() => null);
if (!robotsTxt) fail("no robots.txt was written");
else if (!robotsTxt.includes("Sitemap:")) fail("robots.txt does not point at the sitemap");

if (failures.length) {
  console.error(`\nseo-check: ${failures.length} problem(s) in ${checked} pages\n`);
  for (const message of failures) console.error(`  \u2717 ${message}`);
  console.error("");
  process.exit(1);
}

console.log(
  `seo-check: ${checked} pages, ${indexable.length} race pages, ` +
    `${seenTitles.size} distinct titles \u2014 all good`,
);
