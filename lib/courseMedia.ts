/**
 * Where a course's photograph lives.
 *
 * **One rule: the file is named after the course slug.** `kalmar-703` is
 * `assets/courses/kalmar-703.webp`. No lookup table, so adding art for a race
 * is dropping in a correctly-named file and nothing else — and a course with
 * no file simply shows its `tone_color`, which is what the design does for a
 * race whose photography has not been shot yet.
 *
 * This replaces two paths that pointed at files which never existed
 * (`courses/course-hero.jpg`, `courses/placeholder.jpg`), so every course
 * rendered the same gradient no matter which race it was.
 *
 * The backend's `media_card_path` / `media_hero_path` still win when set. They
 * are null for every row today, but they are the way a curated or
 * athlete-submitted course carries its own image, and that has to keep
 * working.
 */

import { assetExists } from "./assetManifest";

export function courseImage(slug: string | null | undefined): string | null {
  if (!slug) return null;
  /* Checked against the build-time manifest rather than asked for and hoped.
     Most races have no photograph, and a miss used to cost five requests as
     the media component tried each extension — eighty-five 404s to draw a
     directory of gradients. */
  for (const ext of ["webp", "jpg", "jpeg", "png", "avif"]) {
    const path = `assets/courses/${slug}.${ext}`;
    if (assetExists(path)) return path;
  }
  return null;
}

/** The backend's path if it has one, else the slug convention. */
export function courseImageFor(
  course: { slug?: string | null; media_card_path?: string | null; media_hero_path?: string | null },
  prefer: "card" | "hero" = "card",
): string | null {
  const stored = prefer === "hero" ? course.media_hero_path : course.media_card_path;
  return stored ?? courseImage(course.slug);
}
