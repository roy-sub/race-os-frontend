/**
 * Presentation for the Dashboard. **No athlete data lives here.**
 *
 * This file used to hold four races, a week of tasks, five bags and two alerts
 * as module constants, together with a procedurally generated course. Every
 * account that signed in saw all of it. It is gone: the dashboard now renders
 * `GET /dashboard`, which answers for whoever the token belongs to, and the
 * map it draws is the real course from `GET /courses/{ref}/terrain`.
 *
 * What is left is the part that is genuinely not per-user — how a status is
 * coloured, and how minutes are written out.
 */

import type { RaceCard } from "./api/account";

/** `705` → `11:45`. Negative keeps its sign, because a margin's sign is the point. */
export function fmtClock(minutes: number): string {
  const rounded = Math.round(minutes);
  const sign = rounded < 0 ? "-" : "";
  const value = Math.abs(rounded);
  return `${sign}${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export type Feasibility = RaceCard["feasibility"];

/**
 * How a plan's verdict is coloured.
 *
 * Open on purpose: the API's `feasibility` is a string, and a value we have
 * not styled renders in the neutral tone with its own label rather than
 * disappearing or being silently recoloured as something it is not.
 */
/**
 * The glyph beside every feasibility state.
 *
 * Mirrors `raceos/exports/tokens.py` STATE_GLYPHS, and exists for the same
 * reason: these get printed on whatever machine is in the house, and a state
 * carried by colour alone is unreadable in grey. Colour stays — it is faster
 * to read in colour — but it is never asked to work on its own.
 */
export const FEAS_GLYPH: Record<string, string> = {
  CLEAR: "OK",
  TIGHT: "!",
  INFEASIBLE: "X",
  STALE: "\u2020", // dagger, as the PDF marks non-official provenance
};

export const FEAS_STYLE: Record<string, { fg: string; dot: string; border: string; note: string }> = {
  CLEAR: {
    fg: "#3E7B55",
    dot: "#7CC08F",
    border: "rgba(124,192,143,.5)",
    note: "Clears every cut-off",
  },
  TIGHT: {
    fg: "#A0701A",
    dot: "#E0A33C",
    border: "rgba(224,163,60,.5)",
    note: "Tight — one binding barrier",
  },
  INFEASIBLE: {
    fg: "#C0392B",
    dot: "#C0392B",
    border: "rgba(192,57,43,.45)",
    note: "Infeasible as set",
  },
  STALE: {
    fg: "#8C8578",
    dot: "#A8A192",
    border: "rgba(21,20,15,.2)",
    note: "Solved against an older course",
  },
};

export const FEAS_FALLBACK = {
  fg: "#8C8578",
  dot: "#A8A192",
  border: "rgba(21,20,15,.2)",
  note: "Not solved yet",
};

export function feasStyle(value: string | null | undefined) {
  return (value && FEAS_STYLE[value]) || FEAS_FALLBACK;
}

/** The glyph for a state, or an em dash when there is nothing to say. */
export function feasGlyph(value: string | null | undefined): string {
  return (value && FEAS_GLYPH[value]) || "\u2014";
}

/**
 * Plan status as the athlete reads it, never as the enum spells it.
 *
 * Keyed by `display_status`, which the server derives — so a paid-for race
 * that has not been solved yet says so instead of reading as a bare draft,
 * and a plan with drift waiting says it needs review instead of "solved".
 * Those are not lifecycle states and are deliberately not in the enum: a plan
 * is routinely both active *and* needing review, and exactly one version per
 * race may be `active`.
 *
 * The `plan_status` keys are kept as fallbacks so a client running against an
 * older server, which sends no `display_status`, still renders a label rather
 * than a raw enum value.
 */
export const PLAN_STATUS_LABEL: Record<string, string> = {
  active: "PLAN SOLVED",
  draft: "DRAFT · NOT SOLVED",
  past: "RACED",
  pending_athlete_approval: "AWAITING YOUR APPROVAL",
  none: "NO PLAN YET",
  raced: "RACED",
  needs_review: "NEEDS REVIEW",
  purchased_not_solved: "PAID FOR · NOT SOLVED",
  purchased_not_started: "PAID FOR · NOT STARTED",
};

export function planStatusLabel(card: RaceCard): string {
  const key = card.display_status || card.plan_status;
  const base = PLAN_STATUS_LABEL[key] ?? key.toUpperCase().replace(/_/g, " ");
  // The version only where it means something: on the plan that is live.
  if (key === "active" && card.plan_version != null) {
    return `${base} · V${card.plan_version}`;
  }
  return base;
}

/** A short name for the race switcher: the first distinctive word or two. */
export function shortName(name: string): string {
  const cleaned = name.replace(/^IRONMAN\s+/i, "").replace(/\s+70\.3$/i, "");
  const words = cleaned.split(/\s+/);
  return words.slice(0, 2).join(" ");
}
