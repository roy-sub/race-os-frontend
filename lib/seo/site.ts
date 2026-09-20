/**
 * Everything that needs to know the site's own public address.
 *
 * A canonical URL, a sitemap entry and an Open Graph image all have to be
 * absolute, and none of them can be derived from the page they appear on: a
 * static export has no request to read a host from, and the same files are
 * served from the Cloudflare preview domain, the production domain and
 * `localhost` during a build. So the address is configuration, set once at
 * build time, and everything else composes from it.
 *
 * Getting this wrong is quiet rather than loud, which is why it is centralised.
 * A canonical tag pointing at the wrong host tells Google the real page lives
 * somewhere else, and the page you wanted ranked disappears instead of moving.
 */

/** No trailing slash, so every composed path is `${SITE_URL}/thing`. */
function normalise(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * The public origin.
 *
 * Defaults to the production domain rather than throwing, because unlike the
 * API base URL a wrong value here is recoverable and a missing one would break
 * every build. `raceos.cc` is the domain the site already puts in front of
 * people (it is the contact address in the footer and on the pricing page), so
 * it is the honest default.
 *
 * Set `NEXT_PUBLIC_SITE_URL` when building for anywhere else — a preview
 * deploy, or a rename. A canonical tag naming the wrong host tells Google the
 * real page lives somewhere else, and the page you wanted ranked disappears
 * instead of moving.
 */
export const SITE_URL = normalise(
  process.env.NEXT_PUBLIC_SITE_URL || "https://raceos.cc",
);

export const SITE_NAME = "RaceOS";

/**
 * The suffix appended to a page's own title.
 *
 * Lives here rather than only in the root layout because a template is
 * cancelled by any ancestor that sets a plain string title — so a layout
 * with children of its own (`/races`, `/admin`) has to restate it, and two
 * copies of the literal would eventually disagree.
 */
export const TITLE_TEMPLATE = `%s — ${SITE_NAME}`;

/** What the site is, in one sentence, for search results and share cards. */
export const SITE_DESCRIPTION =
  "Pacing, fuelling, five bags and every cut-off — solved against your real course.";

/** The default share image, 1200x630, referenced from the root metadata. */
export const OG_IMAGE_PATH = "/assets/og/raceos-share.png";

/** An absolute URL for `path`, which may or may not start with a slash. */
export function absolute(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}/${path.replace(/^\/+/, "")}`;
}

/**
 * The canonical URL for a route.
 *
 * `trailingSlash: true` is set in `next.config.ts`, so Cloudflare serves
 * `/races/` from `/races/index.html` and `/races` would redirect. The
 * canonical has to name the address that actually answers, or it points at a
 * redirect and Google follows it every time it checks.
 */
export function canonical(path: string): string {
  if (path === "/") return `${SITE_URL}/`;
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return `${SITE_URL}/${clean}/`;
}
