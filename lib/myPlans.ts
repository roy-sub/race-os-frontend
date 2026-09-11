/**
 * Presentation for My Plans. **No athlete data lives here.**
 *
 * Five named plans used to be module constants in this file, and every account
 * that signed in read all five. The screen now renders `GET /my-plans`, which
 * takes no user id and answers for whoever the token belongs to.
 *
 * What remains is grouping and formatting: the three sections the screen has,
 * how a margin is coloured, and which export files a solved plan offers.
 */

import type { RaceCard } from "./api/account";

/** The three groups the API itself returns, in the order they are read. */
export const PLAN_GROUPS = [
  { key: "active", name: "Active", blurb: "Entered, and solved or ready to solve." },
  { key: "draft", name: "Draft", blurb: "Entered, no plan yet." },
  { key: "past", name: "Past", blurb: "Raced. The numbers stay exactly as they were." },
] as const;

export type PlanGroup = (typeof PLAN_GROUPS)[number]["key"];

export type MarginState = "clear" | "tight" | "fail" | "none";

/**
 * A margin's state from the margin itself, not from a stored label.
 *
 * Twenty minutes is the same threshold the server uses for cut-off risk, so a
 * row that reads "tight" here is tight for the same reason the notification
 * said so.
 */
export function marginState(minutes: number | null | undefined): MarginState {
  if (minutes == null) return "none";
  if (minutes < 0) return "fail";
  if (minutes < 20) return "tight";
  return "clear";
}

export const MARGIN_COLOR: Record<MarginState, string> = {
  clear: "#3E7B55",
  tight: "#A0701A",
  fail: "#C0392B",
  none: "#8C8578",
};

/**
 * What a solved plan can be exported as.
 *
 * The four the backend actually serves. A fifth listed here would be a
 * download button that 404s, which is worse than not offering it.
 */
export const EXPORTS = [
  { ext: "PDF", name: "Race card", kind: "race-card" as const },
  { ext: "PDF", name: "Bag manifests", kind: "bags" as const },
  { ext: "FIT", name: "Course with waypoints", kind: "fit" as const },
  { ext: "GPX", name: "Route only", kind: "gpx" as const },
  { ext: "ICS", name: "Race week calendar", kind: "ics" as const },
];

/** Does this card represent a plan that has actually been through the solver? */
export function isSolved(card: RaceCard): boolean {
  return card.plan_id != null && card.plan_status !== "draft" && card.plan_status !== "none";
}
