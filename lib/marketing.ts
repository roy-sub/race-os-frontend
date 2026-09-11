/**
 * Headline figures for the marketing banners.
 *
 * Two of the three are fixed copy and say so; the first is not here at all any
 * more, and that is the point of this file's history.
 *
 * It used to read `{ value: 160, label: "COURSES" }` — a placeholder from
 * before there was a calendar. There is one now, with a real number of real
 * events in it, and a hero claiming 160 courses above a directory listing
 * sixteen is not a headline, it is a false statement to a visitor deciding
 * whether to trust the rest of the page. The count comes from
 * `GET /courses` like every other place that names it.
 *
 * The rule that remains: **when a real source exists, delete the entry here**
 * and read the real number, rather than leaving both and letting them
 * disagree.
 */

export type MarketingStat = {
  value: number;
  /** Decimal places for the count-up animation. */
  decimals: number;
  suffix: string;
  label: string;
};

/**
 * The two hero figures that still have no source.
 *
 * `MEDIAN SOLVE` is a target rather than a measurement: the solver's SLA is
 * configured at 3.1 s p50 and nothing yet publishes the achieved figure to a
 * public endpoint. It is labelled as a target on the page for that reason.
 */
export const HERO_STATS: MarketingStat[] = [
  { value: 3.1, decimals: 1, suffix: "s", label: "SOLVE TARGET" },
  // A fact about the product rather than a placeholder: a plan always produces
  // five bags, because a long-course race has five.
  { value: 5, decimals: 0, suffix: "", label: "BAGS PACKED" },
];
