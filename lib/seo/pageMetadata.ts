import type { Metadata } from "next";

import { OG_IMAGE_PATH, SITE_NAME, TITLE_TEMPLATE, canonical } from "./site";

/**
 * A page's own title, description and canonical URL.
 *
 * **Why this is a helper and not a literal per page.** Nineteen of the
 * twenty-two pages are Client Components, and a Client Component cannot export
 * `metadata` — so each one gets a tiny server `layout.tsx` beside it that does
 * nothing but render its children and export this. Writing the same object
 * nineteen times invites nineteen slightly different versions, and the field
 * that does real damage when it drifts is the canonical URL.
 *
 * **The merge rule this exists to survive.** Metadata from nested segments is
 * merged *shallowly*: a page that sets `openGraph` replaces the root layout's
 * `openGraph` outright rather than adding to it. So a naive per-page
 * `openGraph: { title, description }` would silently drop the share image,
 * `siteName` and `locale` from every page that used it — the share cards would
 * keep working on the homepage and go blank everywhere else, which is the kind
 * of break nobody notices until someone posts a link. The shared fields are
 * therefore spread back in here, in one place, deliberately.
 *
 * Nothing here touches the pages themselves. The layouts are additive, so no
 * existing screen changes behaviour.
 */
export function pageMetadata(options: {
  /** Short, without the site name — the root layout's template appends that. */
  title: string;
  description: string;
  /** Route path, e.g. "/pricing". */
  path: string;
  /** True for the app's own screens, which need an account to be worth reading. */
  noindex?: boolean;
  /** Overrides the default share image, for pages with art of their own. */
  image?: { url: string; alt: string };
  /**
   * Set on a layout that has routes nested under it.
   *
   * A title template is cancelled by any ancestor that sets a plain string
   * title, so `/races` setting `title: "Races"` is what stripped the site name
   * off `/races/<slug>/` — the child's title was correct and simply had no
   * template left to fill. A layout with children restates the template so its
   * descendants keep it.
   */
  hasNestedRoutes?: boolean;
}): Metadata {
  const { title, description, path, noindex = false, image, hasNestedRoutes = false } = options;
  const url = canonical(path);
  const share = image ?? { url: OG_IMAGE_PATH, alt: SITE_NAME };

  return {
    title: hasNestedRoutes ? { default: title, template: TITLE_TEMPLATE } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      /* Repeated from the root layout on purpose — see the merge rule above. */
      type: "website",
      siteName: SITE_NAME,
      locale: "en_GB",
      title,
      description,
      url,
      images: [{ url: share.url, width: 1200, height: 630, alt: share.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [share.url],
    },
    ...(noindex
      ? {
          /* `follow` stays on: these pages link back into the public site and
             there is no reason to strand that. What is refused is the listing,
             not the crawl. */
          robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
        }
      : {}),
  };
}
