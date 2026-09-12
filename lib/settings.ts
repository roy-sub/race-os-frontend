/**
 * Presentation for the Settings screen. **No athlete data lives here.**
 *
 * This file used to hold one particular person's profile, constraints,
 * connections and invoices as module constants, and every account that signed
 * in saw them. What is left is the part that genuinely is not per-user: which
 * tabs exist, how a constraint key is spelled for a human, and which colour a
 * provenance badge takes. Everything with a value in it now comes from the
 * API, scoped to whoever is signed in.
 */

import type { Constraint, DriftSensitivity, NotificationType } from "./api/account";

export type Tab = "profile" | "constraints" | "notifs" | "billing";

/**
 * Four tabs, not five. The fifth was **Connections**, and it is gone because
 * the thing it described does not exist: third-party athlete-data
 * integrations are permanently out of scope, and the backend has no
 * connections table, no provider adapter and no OAuth custody to show. A
 * screen offering to connect Garmin was describing a feature nobody could
 * ever use.
 */
export const TABS: { k: Tab; name: string }[] = [
  { k: "profile", name: "Profile" },
  { k: "constraints", name: "Constraints" },
  { k: "notifs", name: "Notifications" },
  { k: "billing", name: "Billing" },
];

/** The constraint keys the solver reads, in the order a screen reads them. */
export const CONSTRAINT_ORDER: string[] = [
  "swim_threshold_pace",
  "bike_threshold_power",
  "run_threshold_pace",
  "weight",
  "sweat_rate",
  "sodium_loss",
  "gut_carb_ceiling",
  "caffeine_tolerance",
];

/** Human names for the keys above. A key with no entry is tidied, not hidden. */
export const CONSTRAINT_LABEL: Record<string, string> = {
  swim_threshold_pace: "Swim threshold pace",
  bike_threshold_power: "Bike threshold power",
  run_threshold_pace: "Run threshold pace",
  weight: "Weight",
  sweat_rate: "Sweat rate",
  sodium_loss: "Sodium loss",
  gut_carb_ceiling: "Gut carbohydrate ceiling",
  caffeine_tolerance: "Caffeine tolerance",
};

export function constraintLabel(key: string): string {
  const known = CONSTRAINT_LABEL[key];
  if (known) return known;
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Sort by the order above, then alphabetically for anything unlisted. */
export function sortConstraints(rows: Constraint[]): Constraint[] {
  const rank = (key: string) => {
    const index = CONSTRAINT_ORDER.indexOf(key);
    return index === -1 ? CONSTRAINT_ORDER.length : index;
  };
  return [...rows].sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

export type ConstraintSource = Constraint["source"];

/**
 * How a source is badged.
 *
 * Law 2: provenance travels forever, and this is where it surfaces. A value
 * the athlete typed is `MANUAL` and is never dressed as measured; an estimate
 * is amber because an estimate is what a plan is least sure of.
 */
export const SRC_STYLE: Record<ConstraintSource, { bg: string; fg: string; label: string }> = {
  measured: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55", label: "MEASURED" },
  tested: { bg: "rgba(124,192,143,.12)", fg: "#3E7B55", label: "TESTED" },
  manual: { bg: "rgba(21,20,15,.07)", fg: "#5C574B", label: "MANUAL" },
  estimated: { bg: "rgba(224,163,60,.18)", fg: "#A0701A", label: "ESTIMATED" },
  // Blue: neither a measurement nor a guess, but somebody else's model.
  imported: { bg: "rgba(79,124,147,.15)", fg: "#3D6478", label: "IMPORTED" },
};

export const CONF_FG: Record<ConstraintSource, string> = {
  measured: "#5C9E72",
  tested: "#5C9E72",
  manual: "#8C8578",
  estimated: "#E0A33C",
  imported: "#4F7C93",
};

/** A stale value is amber whatever its source: age is its own warning. */
export const STALE_FG = "#E0A33C";

/**
 * Copy for each notification type, keyed by the enum the API returns.
 *
 * The rows themselves come from `GET /notification-preferences`, which returns
 * every type with its current channels — so a type added server-side appears
 * here with a tidied name rather than disappearing.
 */
export const NOTIF_COPY: Partial<Record<NotificationType, { name: string; desc: string }>> = {
  drift: {
    name: "Plan drift",
    desc: "When the forecast or a constraint moves enough to change your numbers.",
  },
  week: {
    name: "Race week reminders",
    desc: "Special-needs deadlines, bike check-in, packing checklists.",
  },
  cutoff: {
    name: "Cut-off risk",
    desc: "When a re-solve puts a barrier under twenty minutes of margin.",
  },
  bundle: {
    name: "Course bundle updated",
    desc: "The organiser changed the course, cut-offs or aid stations.",
  },
  analysis: {
    name: "Post-race analysis ready",
    desc: "Your uploaded file has been processed and calibration is waiting.",
  },
  digest: {
    name: "Monthly digest",
    desc: "New courses and product changes. Off by default.",
  },
  plan_ready: {
    name: "A coach built you a plan",
    desc: "It is not live until you approve it, so this is how you find out it exists.",
  },
  coach_shared: {
    name: "A coach shared something",
    desc: "An invitation to link accounts, or a plan they built for you.",
  },
  athlete_accepted: {
    name: "An athlete accepted your invite",
    desc: "Coaches only. They control what you can see until they grant it.",
  },
  payment_succeeded: {
    name: "Payment receipts",
    desc: "In-app only by default — the invoice is already on this screen.",
  },
  payment_failed: {
    name: "Payment problems",
    desc: "A declined card pauses new solves. Always shown here, whatever you choose.",
  },
  subscription_renewing: {
    name: "Before a renewal",
    desc: "A week's notice, so cancelling is still a choice rather than a refund request.",
  },
  support_access: {
    name: "Support access requests",
    desc: "When somebody asks to look at your account. Always shown here.",
  },
};

/**
 * Types whose in-app delivery cannot be switched off, mirroring
 * `CRITICAL_NOTIFICATION_TYPES` on the server.
 *
 * Duplicated rather than fetched because it is a *label*: the server enforces
 * the floor regardless of what this says, and a switch that looks off while
 * the message still arrives is worse than one that says why it is fixed.
 */
export const ALWAYS_IN_APP: NotificationType[] = [
  "drift",
  "cutoff",
  "payment_failed",
  "support_access",
];

export function notificationName(key: NotificationType): string {
  const copy = NOTIF_COPY[key];
  if (copy) return copy.name;
  const words = String(key).replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function notificationDescription(key: NotificationType): string {
  return NOTIF_COPY[key]?.desc ?? "";
}

export const SENSITIVITY: { k: DriftSensitivity; name: string; d: string }[] = [
  { k: "everything", name: "Everything", d: "Any change at all" },
  { k: "balanced", name: "Balanced", d: "Changes over 2 min" },
  { k: "critical", name: "Critical", d: "Cut-off risk only" },
];

export const TIER_LABEL: Record<string, string> = {
  free: "Free",
  per_race: "Race plan",
  season: "Season Pass",
  coach: "Coach",
};
