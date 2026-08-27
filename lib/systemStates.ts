// System-states showcase data (404/500/offline/loading/empty/errors), ported 1:1 from the prototype.
import { routes } from "./routes";

function toPath(points: [number, number][]) {
  return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
}

/** The 404 illustration: a course line with a stray path diverging off it. */
export function strayCourse() {
  const course: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60;
    course.push([120 + f * 300, 620 - f * 480 + 40 * Math.sin(f * 7)]);
  }
  const stray: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const f = i / 40;
    const base = course[Math.round(f * 34)];
    stray.push([base[0] + f * f * 190, base[1] + f * 60 * Math.sin(f * 3)]);
  }
  const tip = stray[stray.length - 1];
  return {
    coursePath: toPath(course),
    strayPath: toPath(stray),
    strayX: tip[0].toFixed(1),
    strayY: tip[1].toFixed(1),
  };
}

export const NOT_FOUND_LINKS = [
  { k: "FREE", name: "Browse all 412 courses", href: routes.races },
  { k: "APP", name: "Back to your dashboard", href: routes.dashboard },
  { k: "PLANS", name: "Your solved plans", href: routes.myPlans },
  { k: "HELP", name: "Search the help centre", href: routes.notifications },
];

export const ERROR_FACTS = [
  { k: "WHAT FAILED", v: "The solver timed out at the pacing stage, 4.2 seconds in." },
  { k: "WHAT WAS SAVED", v: "Nothing. Your inputs are still in the draft, exactly as you left them." },
  { k: "WHAT WAS CHARGED", v: "Nothing. Payment is only taken after a solve completes." },
  { k: "REQUEST ID", v: "req_3b90c7f1 · already sent to our on-call engineer." },
];

export const OFFLINE_WORKS = [
  { name: "Your full solved plan, all versions", size: "84 KB" },
  { name: "Course geometry and elevation", size: "1.2 MB" },
  { name: "Aid stations and cut-off gates", size: "12 KB" },
  { name: "All five bag manifests", size: "9 KB" },
  { name: "Race card PDF", size: "220 KB" },
];

export const OFFLINE_WAITS = [
  { name: "Solving a new plan", why: "The solver runs server-side, so this needs a connection." },
  { name: "Forecast updates", why: "You keep the last forecast we cached, with its timestamp shown." },
  { name: "Device export", why: "Queued. It will upload by itself when signal returns." },
  { name: "Sharing a link", why: "Queued, and the link becomes live once you are back online." },
];

export const SHIMMER = "linear-gradient(90deg, rgba(21,20,15,.06) 0%, rgba(21,20,15,.11) 50%, rgba(21,20,15,.06) 100%) 0 0 / 420px 100%";

export const EMPTY_STATES = [
  { where: "MY PLANS · NO PLANS YET", kicker: "NOTHING SOLVED", head: "Your first plan takes about six minutes.",
    sub: "Pick a race, answer what you know, and the solver handles the rest. Nothing is required.",
    cta: "Build a plan", ctaBg: "#E4622F", ctaFg: "#fff", ctaBorder: "#E4622F" },
  { where: "RACE DIRECTORY · NO MATCHES", kicker: "NOT IN THE DIRECTORY", head: "We do not have that course.",
    sub: "Upload a GPX and enter the cut-offs. The plan still solves, and estimates are marked as estimates.",
    cta: "Upload a course", ctaBg: "transparent", ctaFg: "#15140F", ctaBorder: "rgba(21,20,15,.2)" },
  { where: "SEASON HISTORY · NO FINISHES", kicker: "NOTHING RACED YET", head: "Your first finish lands here.",
    sub: "Upload your file after the race and this becomes a history with real, measured numbers.",
    cta: "See how it works", ctaBg: "transparent", ctaFg: "#15140F", ctaBorder: "rgba(21,20,15,.2)" },
  { where: "NOTIFICATIONS · ALL READ", kicker: "NOTHING NEEDS YOU", head: "You are all caught up.",
    sub: "We only send things that change a decision. A quiet inbox is the product working correctly.",
    cta: "Notification settings", ctaBg: "transparent", ctaFg: "#15140F", ctaBorder: "rgba(21,20,15,.2)" },
];

export type ErrorState = "bad" | "warn" | "info";
const ERROR_STYLE: Record<ErrorState, { dot: string; tagFg: string; bg: string; border: string }> = {
  bad: { dot: "#C0392B", tagFg: "#A03227", bg: "rgba(192,57,43,.06)", border: "rgba(192,57,43,.28)" },
  warn: { dot: "#E0A33C", tagFg: "#A0701A", bg: "rgba(224,163,60,.08)", border: "rgba(224,163,60,.32)" },
  info: { dot: "#4F7C93", tagFg: "#3D6478", bg: "rgba(79,124,147,.07)", border: "rgba(79,124,147,.28)" },
};

const ERROR_ROWS_RAW: { tag: string; state: ErrorState; title: string; body: string; cta: string }[] = [
  { tag: "INVALID INPUT", state: "bad", title: "That FTP is higher than the current world record holder's.",
    body: "We think you may have entered watts per kilo rather than watts. 293 w is typical for your other numbers.",
    cta: "Use 293 w" },
  { tag: "INFEASIBLE", state: "bad", title: "This goal misses the bike cut-off by 14 minutes.",
    body: "Held at your gut ceiling and threshold power, the plan cannot reach that barrier in time. Two levers would change it.",
    cta: "Show the levers" },
  { tag: "OVER CEILING", state: "warn", title: "94 g/hr is above your measured ceiling of 90.",
    body: "Nine of eleven athletes who overrode this reported gut distress after hour four. It is available, but not silently.",
    cta: "Override anyway" },
  { tag: "STALE DATA", state: "warn", title: "Your FTP was tested six months ago.",
    body: "We will still solve with it, and the plan will mark the value as stale wherever it appears.",
    cta: "Update it" },
  { tag: "UPLOAD FAILED", state: "bad", title: "That GPX has no elevation data.",
    body: "We can sample elevation from terrain instead, which is what we do for most courses anyway.",
    cta: "Sample terrain" },
  { tag: "PARTIAL DATA", state: "info", title: "Two aid stations on this course are crowd-verified, not official.",
    body: "They agree across 40+ athlete uploads but are not in the published guide. We treat them as real and label them.",
    cta: "See provenance" },
];

export const ERROR_ROWS = ERROR_ROWS_RAW.map((e) => {
  const m = ERROR_STYLE[e.state];
  return {
    ...e,
    ...m,
    ctaBg: e.state === "bad" ? "#15140F" : "transparent",
    ctaFg: e.state === "bad" ? "#F1EEE8" : "#15140F",
    ctaBorder: e.state === "bad" ? "#15140F" : "rgba(21,20,15,.2)",
  };
});
