/**
 * The command palette's two halves.
 *
 * **Server-side results** — courses, the athlete's own races and plans, and
 * help articles — come from `GET /search`, which scopes every row to whoever
 * is asking.
 *
 * **Navigation results** — "open settings", "add a race" — are matched here,
 * in the client, against the same `routes` table every link on the site is
 * built from. They are deliberately not a server concern: the frontend
 * already owns the one list of its own pages, and a round trip to be told
 * that a page it renders exists would be a round trip for nothing. It also
 * means the palette answers a navigation query with no network at all, which
 * is what makes it feel like a palette rather than a search box.
 */

import { useQuery } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import { routes } from "../routes";
import type { components } from "./schema";

export type SearchHit = components["schemas"]["SearchHitOut"];

/** A palette row, whichever half it came from. */
export type PaletteItem = {
  key: string;
  kind: SearchHit["kind"] | "action";
  title: string;
  subtitle: string;
  href: string;
};

/**
 * Where a server result actually lives.
 *
 * The server returns a `ref` — a slug or an id — rather than a URL, so this is
 * the only place a result becomes a link, and it is built from `routes` like
 * everything else.
 */
function hrefFor(hit: SearchHit): string | null {
  switch (hit.kind) {
    case "course":
      return `${routes.courseRecon}?course=${encodeURIComponent(hit.ref)}`;
    case "race":
      return `${routes.planBuilder}?race=${encodeURIComponent(hit.ref)}`;
    case "plan":
      return `${routes.racePlan}?plan=${encodeURIComponent(hit.ref)}`;
    case "help":
      return `${routes.guide}?article=${encodeURIComponent(hit.ref)}`;
    default:
      // A kind this build does not know about. Dropping the row is better than
      // rendering one that goes nowhere.
      return null;
  }
}

/**
 * Everywhere in the app a person can go, with the words they might use to look
 * for it.
 *
 * `keywords` exist because people search for the thing, not for the page:
 * somebody typing "invoice" wants Billing, and "wetsuit" wants their bags.
 */
const DESTINATIONS: { title: string; subtitle: string; href: string; keywords: string }[] = [
  { title: "Dashboard", subtitle: "Your next race and what needs doing", href: routes.dashboard, keywords: "home overview next race countdown" },
  { title: "My plans", subtitle: "Every plan, and its exports", href: routes.myPlans, keywords: "plans list versions history export download pdf" },
  { title: "Race directory", subtitle: "Every course you can plan against", href: routes.races, keywords: "races directory courses browse find calendar season" },
  { title: "Add a race", subtitle: "Upload a route file for a race we have not built", href: routes.addRace, keywords: "add new race gpx upload submit course missing" },
  { title: "Course recon", subtitle: "Read a course before you commit to it", href: routes.courseRecon, keywords: "recon course map elevation cut-off calculator free" },
  { title: "Build a plan", subtitle: "Start the plan builder", href: routes.planBuilder, keywords: "build new plan solve builder start" },
  { title: "Race Mode", subtitle: "Your plan, cached for a phone with no signal", href: routes.raceMode, keywords: "race mode offline phone start line day splits" },
  { title: "Post-race", subtitle: "What actually happened, against the plan", href: routes.postRace, keywords: "post race analysis upload fit calibration after result" },
  { title: "Notifications", subtitle: "Drift alerts and everything else", href: routes.notifications, keywords: "notifications alerts drift inbox unread" },
  { title: "Settings · Profile", subtitle: "Name, units, experience level", href: `${routes.settings}?tab=profile`, keywords: "settings profile account name units metric imperial password email" },
  { title: "Settings · Constraints", subtitle: "Your eight values and where each came from", href: `${routes.settings}?tab=constraints`, keywords: "constraints ftp threshold power pace weight sweat sodium carb caffeine estimate provenance" },
  { title: "Settings · Notifications", subtitle: "Which alerts reach you, and how", href: `${routes.settings}?tab=notifs`, keywords: "notification preferences email push digest quiet" },
  { title: "Settings · Billing", subtitle: "Subscription, invoices, currency", href: `${routes.settings}?tab=billing`, keywords: "billing subscription invoice receipt cancel season pass coach upgrade payment card price" },
  { title: "Pricing", subtitle: "What each tier includes", href: routes.pricing, keywords: "pricing tiers cost plans compare season coach free" },
  { title: "How it works", subtitle: "The solver, stage by stage", href: routes.howItWorks, keywords: "how it works solver stages deterministic explanation" },
  { title: "Help", subtitle: "Guides and answers", href: routes.guide, keywords: "help guide faq support question article" },
];

/** Navigation matches, ranked so a title match beats a keyword one. */
export function matchDestinations(query: string, limit = 5): PaletteItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return [];

  const scored: { score: number; item: PaletteItem }[] = [];
  for (const d of DESTINATIONS) {
    const title = d.title.toLowerCase();
    const score = title.startsWith(needle)
      ? 0
      : title.includes(needle)
        ? 1
        : d.keywords.includes(needle)
          ? 2
          : -1;
    if (score < 0) continue;
    scored.push({
      score,
      item: { key: `action:${d.href}`, kind: "action", title: d.title, subtitle: d.subtitle, href: d.href },
    });
  }
  scored.sort((a, b) => a.score - b.score || a.item.title.localeCompare(b.item.title));
  return scored.slice(0, limit).map((s) => s.item);
}

/**
 * The server half.
 *
 * Under two characters the server returns nothing, so the query is simply not
 * enabled — asking it to tell us that would be a request per keystroke for an
 * answer we already know.
 */
export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: queryKeys.search.query(trimmed),
    enabled: trimmed.length >= 2,
    // A palette is typed into. Keeping recent answers stops the list blanking
    // when somebody backspaces one character.
    staleTime: 30_000,
    queryFn: () =>
      unwrap(client.GET("/api/v1/search", { params: { query: { q: trimmed, limit: 12 } } })),
  });
}

/** Server rows as palette items, with anything unroutable dropped. */
export function toPaletteItems(hits: SearchHit[] | undefined): PaletteItem[] {
  return (hits ?? []).flatMap((hit) => {
    const href = hrefFor(hit);
    if (href === null) return [];
    return [{ key: `${hit.kind}:${hit.ref}`, kind: hit.kind, title: hit.title, subtitle: hit.subtitle, href }];
  });
}

/** How each kind is labelled in the list. */
export const KIND_LABEL: Record<string, string> = {
  plan: "PLAN",
  race: "YOUR RACE",
  course: "COURSE",
  help: "HELP",
  action: "GO TO",
};
