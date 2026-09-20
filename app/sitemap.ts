import type { MetadataRoute } from "next";

import { INDEXABLE_RACES } from "@/lib/seo/races";
import { canonical } from "@/lib/seo/site";

/* A static export has no server to answer a request, so this route has to be
   declared static: Next then runs it once at build and writes a real file into
   `out/`. Without it the build refuses the route outright. */
export const dynamic = "force-static";

/**
 * `sitemap.xml` — the list of addresses worth indexing.
 *
 * Only public pages. Everything behind a sign-in is left out, because a
 * sitemap is a recommendation and recommending a login form wastes the crawl
 * budget on pages that can never rank.
 *
 * `priority` is a hint about relative importance *within this site* and
 * nothing more; it does not raise a ranking. It is set here only so the
 * homepage and the race directory are crawled before the legal boilerplate.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: canonical("/"), priority: 1, changeFrequency: "weekly" },
    { url: canonical("/races"), priority: 0.9, changeFrequency: "weekly" },
    { url: canonical("/how-it-works"), priority: 0.8, changeFrequency: "monthly" },
    { url: canonical("/pricing"), priority: 0.8, changeFrequency: "monthly" },
    { url: canonical("/guide"), priority: 0.6, changeFrequency: "monthly" },
    { url: canonical("/login"), priority: 0.3, changeFrequency: "yearly" },
    { url: canonical("/signup"), priority: 0.5, changeFrequency: "yearly" },
  ];

  /* One entry per race. This is the whole reason the race list is committed:
     a sitemap generated from an API call would be empty on any build that ran
     while the backend was down. */
  const races: MetadataRoute.Sitemap = INDEXABLE_RACES.map((race) => ({
    url: canonical(`/races/${race.slug}`),
    priority: 0.7,
    changeFrequency: "weekly" as const,
  }));

  return [...pages, ...races].map((entry) => ({ lastModified: now, ...entry }));
}
