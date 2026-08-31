/**
 * One block of copy per error code, in the voice `systemStates.ts` already ships.
 *
 * The API supplies a specific `message` for each instance ("that FTP is higher
 * than the world record holder's"); this table supplies the frame around it —
 * the tag, the severity, what was and was not saved, and the one next action.
 * A screen renders the API's message as the title and this body underneath, so
 * the specific sentence always comes from the server and the reassurance always
 * reads the same.
 *
 * Two entries are never rendered by the generic error card:
 * `INFEASIBLE` is a verdict with its own component, and `OVER_CEILING` is a
 * warning with an override. Their copy is here so that a fallback path has
 * something correct to say, not because the card is the intended home.
 */

import type { ErrorCode } from "./api/errors";
import type { ErrorState } from "./systemStates";

export type ErrorCopy = {
  /** Short all-caps label, matching the existing ERROR_ROWS tags. */
  tag: string;
  state: ErrorState;
  /** Used when the API sent no usable message. The server's message wins. */
  title: string;
  /** What it means and what happened to the user's work. */
  body: string;
  /** The one next action. */
  cta: string;
};

export const ERROR_COPY: Record<ErrorCode, ErrorCopy> = {
  INVALID_INPUT: {
    tag: "INVALID INPUT",
    state: "bad",
    title: "That value does not look right.",
    body: "Check the highlighted field. Everything else you entered is untouched.",
    cta: "Fix it",
  },

  INFEASIBLE: {
    tag: "INFEASIBLE",
    state: "bad",
    title: "This goal misses a cut-off.",
    body: "Held at your ceilings, the plan cannot reach that barrier in time. The levers below would change it.",
    cta: "Show the levers",
  },

  OVER_CEILING: {
    tag: "OVER CEILING",
    state: "warn",
    title: "That is above a value you have measured.",
    body: "It is available, but not silently. Overriding is recorded against the plan and shown wherever the number appears.",
    cta: "Override anyway",
  },

  UPLOAD_FAILED: {
    tag: "UPLOAD FAILED",
    state: "bad",
    title: "We could not read that file.",
    body: "Nothing was saved. A .fit, .gpx or .tcx straight out of your head unit is the format we handle best.",
    cta: "Try another file",
  },

  // Declared as warnings backend-side and collected but never emitted, so they
  // only reach the client as errors — which backend-side means a 500 and a
  // programming mistake. Say so plainly rather than dressing it as a caveat.
  STALE_DATA: {
    tag: "STALE DATA",
    state: "bad",
    title: "Something broke on our side.",
    body: "A caveat about ageing data arrived where a response should have been. This is ours, not yours. Nothing was saved and nothing was charged.",
    cta: "Try again",
  },

  PARTIAL_DATA: {
    tag: "PARTIAL DATA",
    state: "bad",
    title: "Something broke on our side.",
    body: "A caveat about incomplete data arrived where a response should have been. This is ours, not yours. Nothing was saved and nothing was charged.",
    cta: "Try again",
  },

  FREEZE_WINDOW: {
    tag: "FREEZE WINDOW",
    state: "warn",
    title: "This plan is inside its freeze window.",
    body: "Race week is too late to change the shape of a plan. Reading it, exporting it and Race Mode all still work; structural edits reopen after the race.",
    cta: "Back to the plan",
  },

  FORBIDDEN_STRUCTURAL: {
    tag: "NOT PERMITTED",
    state: "bad",
    title: "No account can do that.",
    body: "This is blocked by how RaceOS is built rather than by your permissions — an athlete's constraints, for one, are only ever writable by that athlete. Nothing was changed.",
    cta: "Go back",
  },

  UNAUTHENTICATED: {
    tag: "SIGNED OUT",
    state: "info",
    title: "You are signed out.",
    body: "Your session expired. Sign in again and you will land back on this page; nothing you typed has been discarded.",
    cta: "Sign in",
  },

  FORBIDDEN: {
    tag: "NO ACCESS",
    state: "bad",
    title: "This is not yours to open.",
    body: "Your account does not have access to it. If someone meant to show you this, ask them for a share link.",
    cta: "Back to your plans",
  },

  // The paywall. `details` carries required_tiers and purchasable_per_race, so
  // the checkout surface names the actual options; this is the frame around them.
  PAYMENT_REQUIRED: {
    tag: "PAYMENT REQUIRED",
    state: "info",
    title: "This one is not paid for yet.",
    body: "Everything you have entered is saved and nothing has been charged. Buy this race on its own, or a season if you have more than one coming.",
    cta: "See the options",
  },

  NOT_FOUND: {
    tag: "NOT FOUND",
    state: "info",
    title: "We cannot find that.",
    body: "It may have been deleted, or the link may be wrong. Nothing is broken on your side.",
    cta: "Back to your plans",
  },

  CONFLICT: {
    tag: "CONFLICT",
    state: "warn",
    title: "This changed while you were working.",
    body: "It was edited somewhere else since you opened it. Reload to see the current version — nothing of yours was overwritten.",
    cta: "Reload",
  },

  SOLVER_TIMEOUT: {
    tag: "SOLVER TIMEOUT",
    state: "bad",
    title: "The solver ran out of time.",
    body: "Nothing was saved and nothing was charged — payment is only taken after a solve completes. Your inputs are exactly as you left them.",
    cta: "Try again",
  },

  RATE_LIMITED: {
    tag: "TOO MANY REQUESTS",
    state: "warn",
    title: "That was a few too many, too fast.",
    body: "Wait a moment and try again. Nothing was lost.",
    cta: "Try again",
  },

  INTERNAL_ERROR: {
    tag: "SOMETHING BROKE",
    state: "bad",
    title: "Something broke on our side.",
    body: "This is ours, not yours. The request id below is already with our on-call engineer. Nothing was saved and nothing was charged.",
    cta: "Try again",
  },

  SERVICE_UNAVAILABLE: {
    tag: "UNAVAILABLE",
    state: "bad",
    title: "RaceOS is not reachable right now.",
    body: "Either the service is down or your connection dropped. Your work is still here. Try again in a moment.",
    cta: "Try again",
  },
};

export function errorCopy(code: ErrorCode): ErrorCopy {
  return ERROR_COPY[code] ?? ERROR_COPY.INTERNAL_ERROR;
}
