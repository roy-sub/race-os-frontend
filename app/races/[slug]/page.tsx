import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { courseHeroImage, courseImage } from "@/lib/courseMedia";
import { courseReconHref, routes } from "@/lib/routes";
import { JsonLd } from "@/lib/seo/JsonLd";
import {
  INDEXABLE_RACES,
  distanceLabel,
  raceBySlug,
  raceDateLabel,
  type SeoRace,
} from "@/lib/seo/races";
import { pageMetadata } from "@/lib/seo/pageMetadata";
import { SITE_NAME, absolute, canonical } from "@/lib/seo/site";

/**
 * One page per race, written to disk at build time.
 *
 * **Why this exists.** A course was only ever reachable as
 * `/course-recon?course=<slug>`: one address, eight races, and a query string a
 * search engine treats as one page. Nobody searches for "course recon" — they
 * search for "IRONMAN 70.3 Málaga bike course" — and there was no page that
 * could answer them. This is that page, one per race, with the race's name in
 * the title, its facts in the HTML and its date and place in structured data.
 *
 * **The recon screen is untouched.** `?course=` still works, still renders the
 * interactive map, and is still where the depth is; it is simply marked
 * `noindex` now, so one course does not compete with itself. The button below
 * hands off to it.
 *
 * **Only public facts appear here.** Prerendered means public: these files sit
 * on a CDN with no auth in front of them. So this page carries what the
 * signed-out directory already shows — name, place, date, distance, difficulty,
 * coordinates — and nothing that is bought. No geometry, no elevation series,
 * no cut-off ladder, no station list.
 */

/* `dynamicParams = false` is what makes this safe in a static export: an
   address not in the list below is a 404 at build time rather than an attempt
   to render at request time, which there is no server to do. */
export const dynamicParams = false;

export function generateStaticParams() {
  return INDEXABLE_RACES.map((race) => ({ slug: race.slug }));
}

/** 1.9 / 90 / 21.1 and 3.8 / 180 / 42.2 — the standard legs, said once. */
const LEGS: Record<string, { swim: string; bike: string; run: string }> = {
  "70.3": { swim: "1.9 km", bike: "90 km", run: "21.1 km" },
  Full: { swim: "3.8 km", bike: "180 km", run: "42.2 km" },
  Olympic: { swim: "1.5 km", bike: "40 km", run: "10 km" },
  Sprint: { swim: "750 m", bike: "20 km", run: "5 km" },
};

const DIFFICULTY_PROSE: Record<string, string> = {
  APPROACHABLE:
    "graded approachable — the climbing is modest and the cut-offs leave room, which is what makes it a reasonable first race at this distance",
  MODERATE:
    "graded moderate — no single part of it is brutal, but the bike and the run both ask real questions if the pacing is wrong early",
  HARD: "graded hard — the climbing, the heat or the cut-offs are tight enough that a plan built on averages will come apart",
  BRUTAL:
    "graded brutal — the margins are thin enough that pacing, fuelling and the cut-off ladder have to be right rather than roughly right",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  APPROACHABLE: "#3E7B55",
  MODERATE: "#5C574B",
  HARD: "#A0701A",
  BRUTAL: "#C0392B",
};

/** The one-sentence summary, used for both the meta description and the lede. */
function summarise(race: SeoRace): string {
  const when = raceDateLabel(race.date);
  const legs = LEGS[race.distance];
  const swimBikeRun = legs ? `${legs.swim} swim, ${legs.bike} bike, ${legs.run} run` : distanceLabel(race.distance);
  return (
    `${race.name} — ${swimBikeRun} in ${race.place}` +
    (when ? `, ${when}` : "") +
    `. Pacing, fuelling, five bags and every cut-off, solved against the real course.`
  );
}

/* `params` is a promise in this version of Next — awaited, not read. */
type RaceParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RaceParams): Promise<Metadata> {
  const { slug } = await params;
  const race = raceBySlug(slug);
  if (!race) return {};

  const hero = courseHeroImage(race.slug) ?? courseImage(race.slug);
  return pageMetadata({
    title: race.name,
    description: summarise(race),
    path: `/races/${race.slug}`,
    /* The race's own photograph beats the generic card when there is one:
       a link to Málaga should look like Málaga in the preview. */
    ...(hero ? { image: { url: `/${hero}`, alt: race.name } } : {}),
  });
}

export default async function RacePage({ params }: RaceParams) {
  const { slug } = await params;
  /* `dynamicParams = false` guarantees this resolves — the build only ever
     renders slugs `generateStaticParams` returned. */
  const race = raceBySlug(slug)!;
  const when = raceDateLabel(race.date);
  const legs = LEGS[race.distance];
  const hero = courseHeroImage(race.slug);
  const url = canonical(`/races/${race.slug}`);

  const facts: Array<[string, string]> = [
    ["Date", when ?? "To be announced"],
    ["Location", race.place],
    ["Distance", distanceLabel(race.distance)],
    ["Difficulty", race.difficulty.charAt(0) + race.difficulty.slice(1).toLowerCase()],
    ...(legs
      ? ([
          ["Swim", legs.swim],
          ["Bike", legs.bike],
          ["Run", legs.run],
        ] as Array<[string, string]>)
      : []),
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          name: race.name,
          description: summarise(race),
          url,
          ...(race.date ? { startDate: race.date } : {}),
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          sport: "Triathlon",
          ...(hero ? { image: [absolute(hero)] } : {}),
          location: {
            "@type": "Place",
            name: race.place,
            address: {
              "@type": "PostalAddress",
              addressLocality: race.place.split(",")[0].trim(),
              ...(race.country ? { addressCountry: race.country } : {}),
            },
            geo: { "@type": "GeoCoordinates", latitude: race.lat, longitude: race.lng },
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: canonical("/") },
            { "@type": "ListItem", position: 2, name: "Races", item: canonical("/races") },
            { "@type": "ListItem", position: 3, name: race.name, item: url },
          ],
        }}
      />

      <AppHeader active="races" ctaLabel="Build your plan" ctaHref={courseReconHref(race.slug)} />

      <main>
        {/* --- banner ---------------------------------------------------- */}
        <section style={{ position: "relative", minHeight: 420, display: "flex", alignItems: "flex-end", overflow: "hidden" }}>
          <MediaPlaceholder
            path={hero ?? ""}
            background="linear-gradient(155deg,#453B31 0%,#251F1A 52%,#13110F 100%)"
            style={{ position: "absolute", inset: 0 }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(19,17,15,.15) 0%, rgba(19,17,15,.82) 100%)" }} />
          <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "0 48px 56px", width: "100%" }}>
            <p style={{ margin: 0, fontFamily: "var(--mono, monospace)", fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(251,248,242,.72)" }}>
              {distanceLabel(race.distance)} · {race.place}
            </p>
            <h1 style={{ margin: "14px 0 0", fontSize: 64, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em", color: "#FBF8F2", maxWidth: 900 }}>
              {race.name}
            </h1>
            {when ? (
              <p style={{ margin: "18px 0 0", fontSize: 18, color: "rgba(251,248,242,.85)" }}>{when}</p>
            ) : null}
          </div>
        </section>

        {/* --- the facts, as real text ----------------------------------- */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 64, alignItems: "start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 22, lineHeight: 1.5, letterSpacing: "-.015em", color: "#15140F" }}>
                {summarise(race)}
              </p>
              <p style={{ margin: "26px 0 0", fontSize: 17, lineHeight: 1.7, color: "#3D3A31" }}>
                {race.name} is{" "}
                <strong style={{ fontWeight: 600, color: DIFFICULTY_COLOR[race.difficulty] ?? "#3D3A31" }}>
                  {DIFFICULTY_PROSE[race.difficulty] ?? "graded against the courses we have solved"}
                </strong>
                . RaceOS reads the actual course — the elevation under the wheels, the surface, the exposure,
                the aid-station gaps and the organiser&apos;s own cut-off times — and solves a plan against it
                rather than against a generic finish time.
              </p>
              <p style={{ margin: "22px 0 0", fontSize: 17, lineHeight: 1.7, color: "#3D3A31" }}>
                The full course recon is free and needs no account: the profile, the climbs, the surface, the
                conditions and every barrier on the day. A plan — pacing by segment, fuelling by the hour, the
                five bags packed item by item, and what to do when a cut-off gets close — is what you buy, once,
                and keep.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34 }}>
                <Link
                  href={courseReconHref(race.slug)}
                  className="btn-accent"
                  style={{ display: "inline-flex", alignItems: "center", padding: "15px 26px", borderRadius: 2, background: "#E4622F", color: "#fff", fontSize: 15, fontWeight: 600 }}
                >
                  Open the full course recon — free
                </Link>
                <Link
                  href={routes.races}
                  className="btn-outline-dark2"
                  style={{ display: "inline-flex", alignItems: "center", padding: "15px 26px", borderRadius: 2, border: "1px solid rgba(21,20,15,.2)", color: "#15140F", fontSize: 15, fontWeight: 500 }}
                >
                  All races
                </Link>
              </div>
            </div>

            <dl style={{ margin: 0, border: "1px solid rgba(21,20,15,.12)", background: "#FBF8F2" }}>
              {facts.map(([term, value], index) => (
                <div
                  key={term}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 24,
                    padding: "16px 22px",
                    borderTop: index === 0 ? "none" : "1px solid rgba(21,20,15,.09)",
                  }}
                >
                  <dt style={{ margin: 0, fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase", color: "#8C8578" }}>{term}</dt>
                  <dd style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "#15140F", textAlign: "right" }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* --- the rest of the season, so this page is not a dead end ----- */}
        <section style={{ maxWidth: 1400, margin: "0 auto", padding: "80px 48px 100px" }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-.035em", color: "#15140F" }}>
            Other races this season
          </h2>
          <ul style={{ listStyle: "none", margin: "26px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
            {INDEXABLE_RACES.filter((other) => other.slug !== race.slug).map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/races/${other.slug}/`}
                  style={{ display: "block", padding: "18px 20px", border: "1px solid rgba(21,20,15,.12)", background: "#FBF8F2" }}
                >
                  <span style={{ display: "block", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color: "#8C8578" }}>
                    {raceDateLabel(other.date) ?? "Date to be announced"}
                  </span>
                  <span style={{ display: "block", marginTop: 8, fontSize: 17, fontWeight: 600, letterSpacing: "-.02em", color: "#15140F" }}>
                    {other.name}
                  </span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 14, color: "#5C574B" }}>
                    {distanceLabel(other.distance)} · {other.place}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <Footer />
    </>
  );
}
