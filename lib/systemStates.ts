/**
 * The two things every screen's failure and loading states share.
 *
 * This file used to carry a whole design gallery's worth of copy — every empty
 * state, every error row, every offline message, and a generated "stray course"
 * drawing — for a `/system-states` page that catalogued them. That page is
 * gone: it was a reference for us, published as a route for everybody, and the
 * copy it held was duplicated from the screens that actually render it.
 *
 * What is left is the gradient a skeleton shimmers with, and the three
 * severities every error is one of — both genuinely shared, both genuinely
 * belonging in one place.
 */

/** How bad an error is, which is all a screen needs to colour it. */
export type ErrorState = "bad" | "warn" | "info";

export const SHIMMER = "linear-gradient(90deg, rgba(21,20,15,.06) 0%, rgba(21,20,15,.11) 50%, rgba(21,20,15,.06) 100%) 0 0 / 420px 100%";
