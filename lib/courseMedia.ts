/**
 * Where a course's photographs live.
 *
 * **One rule: the files are named after the course slug.** `kalmar-703` is
 * `assets/courses/kalmar-703.webp` for the directory card and
 * `assets/courses/kalmar-703-hero.webp` for the full-bleed banner. No lookup
 * table, so adding art for a race is dropping in two correctly-named files and
 * nothing else — and a course with neither simply shows its `tone_color`,
 * which is what the design does for a race whose photography has not been shot
 * yet.
 *
 * This replaces two paths that pointed at files which never existed
 * (`courses/course-hero.jpg`, `courses/placeholder.jpg`), so every course
 * rendered the same gradient no matter which race it was.
 *
 * **Why two files rather than one.** The card renders 132 px tall and the
 * banner full-bleed; serving one 2336 px original to both meant the directory
 * downloaded up to 939 KB per card to paint a thumbnail. The two are cropped
 * and sized for their own slot, and a hero falls back to the card rather than
 * to a gradient, so a race with only one photograph still shows it everywhere.
 *
 * The backend's `media_card_path` / `media_hero_path` still win when set. They
 * are null for every catalogue row today — catalogue art is a frontend asset,
 * and the backend's own media audit resolves these against object storage —
 * but they are the way a curated or athlete-submitted course carries its own
 * image, and that has to keep working.
 */

import { assetExists } from "./assetManifest";

/* Checked against the build-time manifest rather than asked for and hoped.
   A miss used to cost five requests as the media component tried each
   extension — eighty-five 404s to draw a directory of gradients. */
function firstExisting(stem: string): string | null {
  for (const ext of ["webp", "jpg", "jpeg", "png", "avif"]) {
    const path = `assets/courses/${stem}.${ext}`;
    if (assetExists(path)) return path;
  }
  return null;
}

/** The directory-card image for a slug, or null if none was shot. */
export function courseImage(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return firstExisting(slug);
}

/** The full-bleed banner for a slug, falling back to the card. */
export function courseHeroImage(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return firstExisting(`${slug}-hero`) ?? firstExisting(slug);
}

/** The backend's path if it has one and it resolves, else the slug convention. */
export function courseImageFor(
  course: { slug?: string | null; media_card_path?: string | null; media_hero_path?: string | null },
  prefer: "card" | "hero" = "card",
): string | null {
  const stored = prefer === "hero" ? course.media_hero_path : course.media_card_path;
  /* A stored path that is not in the build is worse than none: it costs the
     extension fallback's requests and still ends on the gradient. */
  if (stored && assetExists(stored)) return stored;
  return prefer === "hero" ? courseHeroImage(course.slug) : courseImage(course.slug);
}
