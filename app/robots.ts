import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/seo/site";

/* A static export has no server to answer a request, so this route has to be
   declared static: Next then runs it once at build and writes a real file into
   `out/`. Without it the build refuses the route outright. */
export const dynamic = "force-static";

/**
 * `robots.txt` — what a crawler may look at.
 *
 * Next emits this as a real file at build time, so it works in a static export
 * with no server involved.
 *
 * The disallow list is the app itself. Those screens need an account, so a
 * crawler reaching one gets a login form — which is a thin, duplicate page
 * repeated a dozen times, and a pile of those is a liability rather than a
 * gap. They are also blocked from indexing by their own `noindex` tag; this
 * saves the crawler the trip. Both matter: `robots.txt` stops the visit,
 * `noindex` stops the listing, and a page linked from elsewhere can be listed
 * without ever being visited.
 *
 * Nothing here is a security control. `robots.txt` is a public request, not a
 * lock — the API is what refuses to hand over anyone's data.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/plans/",
          "/plan/",
          "/plan-builder/",
          "/race-mode/",
          "/post-race/",
          "/settings/",
          "/notifications/",
          "/onboarding/",
          "/coach/",
          "/admin/",
          "/shared/",
          "/reset-password/",
          "/races/add/",
          "/map-check/",
          // The old address for a course page. It still works for anyone
          // holding the link, but the indexable version is /races/<slug>/ and
          // one page should not compete with itself.
          "/course-recon/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
