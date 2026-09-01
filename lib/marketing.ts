/**
 * Headline figures for the marketing banners.
 *
 * **These are fixed marketing copy, not measurements.** Nothing in the product
 * produces them today: the API knows how many courses are bundled, and nothing
 * anywhere records a median solve time. They are set here, by hand, because the
 * banner needs them in place now and the systems that will back them are still
 * to be built.
 *
 * The whole point of this module is that they are stated in one place and
 * labelled for what they are, so nobody later reads `160` off a screen and
 * assumes a query produced it.
 *
 * Two rules keep this honest:
 *
 * 1. **Only marketing banners may read these.** Any screen that *lists* or
 *    *acts on* courses — the race directory, the plan builder's course picker —
 *    keeps using the live count from `GET /courses`. A directory claiming 160
 *    courses above three rows would be a bug, not a headline.
 * 2. **When a real source exists, delete the entry here** and read the real
 *    number instead, rather than leaving both and letting them disagree.
 */

export type MarketingStat = {
  value: number;
  /** Decimal places for the count-up animation. */
  decimals: number;
  suffix: string;
  label: string;
};

/** The hero banner's three figures, in display order. */
export const HERO_STATS: MarketingStat[] = [
  { value: 160, decimals: 0, suffix: "", label: "COURSES" },
  { value: 3.1, decimals: 1, suffix: "s", label: "MEDIAN SOLVE" },
  // The only one of the three that is a fact about the product rather than a
  // placeholder: a plan always produces five bags.
  { value: 5, decimals: 0, suffix: "", label: "BAGS PACKED" },
];

/**
 * The course figure on its own, for banners that show a single stat.
 *
 * Kept in step with `HERO_STATS` so the sign-up screen and the home page cannot
 * quote different numbers at the same visitor.
 */
export const MARKETING_COURSE_COUNT = HERO_STATS[0].value;
