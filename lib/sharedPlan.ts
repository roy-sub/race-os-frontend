/**
 * Presentation for a shared plan. **No athlete data lives here.**
 *
 * Three legs, four gates and a fuelling block used to be module constants —
 * one athlete's race, shown to anyone who opened any share link. The page now
 * reads `GET /shared/{token}`, and what comes back is filtered server-side by
 * the link's own scope.
 *
 * The one thing worth stating about that filter: **no scope exposes a
 * constraint value**, `full_plan` included. It is enforced field by field
 * inside every block, because it has been caught failing once — bag items
 * carried a "Why this?" reason, and "Swim leg planned at 1:56/100m" is a
 * constraint value written out in prose.
 */

import type { SharedPlan } from "./api/screens";

export type ShareScope = SharedPlan["scope"];

/** What each scope actually shows, said plainly to the person reading it. */
export const SCOPE_COPY: Record<string, { name: string; blurb: string }> = {
  splits_only: {
    name: "Splits only",
    blurb: "Target pace or power per leg, and the projected split for each.",
  },
  splits_and_gates: {
    name: "Splits and cut-offs",
    blurb: "The pacing, plus every published cut-off and the margin against it.",
  },
  full_plan: {
    name: "Full plan",
    blurb:
      "Pacing, cut-offs, fuelling, aid actions and bags. Not the constraint values behind them — no scope shares those.",
  },
};

export function scopeCopy(scope: string) {
  return (
    SCOPE_COPY[scope] ?? {
      name: scope.replace(/_/g, " "),
      blurb: "What the athlete chose to share.",
    }
  );
}

/** A share link is time-bounded. Say how long is left, not just when it ends. */
export function expiresIn(iso: string): string {
  const expires = new Date(iso);
  if (Number.isNaN(expires.valueOf())) return "";
  const hours = Math.round((expires.getTime() - Date.now()) / 3_600_000);
  if (hours <= 0) return "expired";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} left`;
}
