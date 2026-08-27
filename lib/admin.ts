// Admin/ops dashboard data + chart generators, ported 1:1 from the prototype.

export function spark(seed: number, up: boolean) {
  const p: number[] = [];
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    const trend = up ? t * 22 : -t * 8;
    p.push(28 - trend - 6 * Math.sin(t * 9 + seed) - 3 * Math.sin(t * 21 + seed * 2));
  }
  const mn = Math.min(...p), mx = Math.max(...p);
  return p.map((v, i) => (i ? "L" : "M") + ((i / 29) * 220).toFixed(1) + " " + (36 - ((v - mn) / (mx - mn || 1)) * 30).toFixed(1)).join(" ");
}

export function lat(base: number, jitter: number, seed: number) {
  const p: number[] = [];
  for (let i = 0; i < 42; i++) {
    const t = i / 41;
    const v = base + jitter * Math.sin(t * 11 + seed) + jitter * 0.5 * Math.sin(t * 27 + seed * 3) + (t > 0.82 ? jitter * 1.4 * (t - 0.82) * 5 : 0);
    p.push(v);
  }
  return p.map((v, i) => (i ? "L" : "M") + ((i / 41) * 760).toFixed(1) + " " + (176 - (v / 10) * 168).toFixed(1)).join(" ");
}

export function days(failAt: number[]) {
  const out: { color: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const bad = failAt.includes(i);
    out.push({ color: bad ? (i === failAt[0] ? "#C0392B" : "#E0A33C") : "rgba(124,192,143,.55)" });
  }
  return out;
}

export const KPIS = [
  { k: "PLANS SOLVED", v: "4,218", delta: "+18%", deltaFg: "#3E7B55", note: "Race-week spike, as expected", spark: spark(0.4, true), line: "#E4622F" },
  { k: "FREE → PAID", v: "11.4%", delta: "+0.8pt", deltaFg: "#3E7B55", note: "Cut-off clock is the moment", spark: spark(1.7, true), line: "#E4622F" },
  { k: "SOLVER P95", v: "5.4s", delta: "+0.6s", deltaFg: "#A0701A", note: "Under the 6s SLA, watching it", spark: spark(2.9, true), line: "#E0A33C" },
  { k: "SUPPORT TICKETS", v: "34", delta: "−12%", deltaFg: "#3E7B55", note: "Mostly course corrections", spark: spark(4.1, false), line: "rgba(21,20,15,.3)" },
];

export const SLA_Y = (176 - (6 / 10) * 168).toFixed(1);
export const SLA_LABEL_Y = (176 - (6 / 10) * 168 - 6).toFixed(1);
export const P50_PATH = lat(3.1, 0.5, 0.4);
export const P95_PATH = lat(5.0, 0.7, 1.9);
export const P99_PATH = lat(7.6, 1.0, 3.2);
export const LAT_TICKS = ["19 MAY", "24", "29", "03 JUN", "08", "13", "18"].map((d, i) => ({ d, x: (i * 126.7).toFixed(0) }));

export const QUEUE = [
  { name: "Course corrections pending", meta: "OLDEST 6 DAYS", n: "38", dot: "#E0A33C" },
  { name: "GPX uploads awaiting review", meta: "AUTO-APPROVES IN 48H", n: "17", dot: "#E0A33C" },
  { name: "Bundles due season rollover", meta: "BEFORE 01 JAN", n: "9", dot: "#C4BCAC" },
  { name: "Support tickets unassigned", meta: "SLA 4 HOURS", n: "4", dot: "#C0392B" },
  { name: "Refund requests", meta: "ALL RACE CANCELLATIONS", n: "2", dot: "#C4BCAC" },
];

export type CourseState = "ok" | "pending" | "stale" | "unverified";
export type Provenance = "OFFICIAL" | "CROWD" | "ESTIMATED";

export const COURSES: { name: string; bundle: string; dist: string; verified: string; plans: string; change: string; prov: Provenance; state: CourseState }[] = [
  { name: "Tramuntana Full", bundle: "v2026.2", dist: "Full", verified: "04 Mar", plans: "1,284", change: "—", prov: "OFFICIAL", state: "ok" },
  { name: "North Shore Full", bundle: "v2026.3", dist: "Full", verified: "14 Aug", plans: "214", change: "Bike cut-off −20 min", prov: "OFFICIAL", state: "pending" },
  { name: "Kalmar 70.3", bundle: "v2026.1", dist: "70.3", verified: "22 Jan", plans: "902", change: "—", prov: "OFFICIAL", state: "ok" },
  { name: "Patagonia Full", bundle: "v2026.1", dist: "Full", verified: "08 Feb", plans: "88", change: "2 aid stations reported", prov: "CROWD", state: "pending" },
  { name: "Cala Olympic", bundle: "v2026.2", dist: "Olympic", verified: "19 Apr", plans: "341", change: "—", prov: "OFFICIAL", state: "ok" },
  { name: "Skagen 70.3", bundle: "v2025.4", dist: "70.3", verified: "11 Nov", plans: "456", change: "Season rollover due", prov: "OFFICIAL", state: "stale" },
  { name: "Roth Long Course", bundle: "v2026.1", dist: "Full", verified: "02 Mar", plans: "1,102", change: "—", prov: "OFFICIAL", state: "ok" },
  { name: "Serra Classic", bundle: "v2026.1", dist: "Full", verified: "—", plans: "12", change: "Awaiting first verification", prov: "ESTIMATED", state: "unverified" },
];

export const P_STYLE: Record<Provenance, { bg: string; fg: string }> = {
  OFFICIAL: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55" },
  CROWD: { bg: "rgba(21,20,15,.07)", fg: "#5C574B" },
  ESTIMATED: { bg: "rgba(224,163,60,.18)", fg: "#A0701A" },
};
export const C_DOT: Record<CourseState, string> = { ok: "#7CC08F", pending: "#E0A33C", stale: "#C4BCAC", unverified: "#C0392B" };

export const USER_STATS = [
  { k: "TOTAL ACCOUNTS", v: "48,102", delta: "+2,410", deltaFg: "#3E7B55", note: "Race season inflow" },
  { k: "PAYING", v: "5,488", delta: "+11%", deltaFg: "#3E7B55", note: "11.4% of all accounts" },
  { k: "SEASON PASS", v: "1,902", delta: "+7%", deltaFg: "#3E7B55", note: "35% of paying users" },
  { k: "COACH SEATS", v: "214", delta: "+18", deltaFg: "#3E7B55", note: "Averaging 8 athletes each" },
];

export type Tier = "SEASON" | "PER RACE" | "COACH" | "FREE" | "—";
export const T_STYLE: Record<Tier, { bg: string; fg: string }> = {
  SEASON: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55" },
  "PER RACE": { bg: "rgba(228,98,47,.14)", fg: "#C6461B" },
  COACH: { bg: "rgba(21,20,15,.1)", fg: "#15140F" },
  FREE: { bg: "rgba(21,20,15,.05)", fg: "#8C8578" },
  "—": { bg: "transparent", fg: "#C4BCAC" },
};

export const USERS: { email: string; id: string; tier: Tier; solved: string; raced: string; joined: string; seen: string; state: "ACTIVE" | "DORMANT" | "ERASED" }[] = [
  { email: "elena.marsh@gmail.com", id: "usr_8f21a", tier: "SEASON", solved: "7", raced: "3", joined: "Mar 24", seen: "2 min ago", state: "ACTIVE" },
  { email: "m.vidal@protonmail.com", id: "usr_3b90c", tier: "SEASON", solved: "12", raced: "9", joined: "Jan 23", seen: "1 h ago", state: "ACTIVE" },
  { email: "priya.raman@outlook.com", id: "usr_7d44e", tier: "PER RACE", solved: "1", raced: "0", joined: "Apr 26", seen: "4 h ago", state: "ACTIVE" },
  { email: "jonas@feldtendurance.de", id: "usr_1a55f", tier: "COACH", solved: "63", raced: "41", joined: "Nov 22", seen: "18 min ago", state: "ACTIVE" },
  { email: "t.achebe@gmail.com", id: "usr_9c02b", tier: "FREE", solved: "0", raced: "0", joined: "May 26", seen: "3 w ago", state: "DORMANT" },
  { email: "sofia.l@icloud.com", id: "usr_4e77d", tier: "PER RACE", solved: "2", raced: "1", joined: "Feb 25", seen: "2 d ago", state: "ACTIVE" },
  { email: "deleted-account-2291", id: "usr_0b19a", tier: "—", solved: "—", raced: "—", joined: "Jun 24", seen: "—", state: "ERASED" },
];

export type ReportConf = "high" | "med" | "low";
export const CONF_COLOR: Record<ReportConf, string> = { high: "#5C9E72", med: "#E0A33C", low: "#C4BCAC" };

export const REPORTS: { tag: string; course: string; n: string; w: string; conf: ReportConf; affects: string; title: string; body: string; cta: string; primary: boolean }[] = [
  { tag: "AID STATION", course: "PATAGONIA FULL", n: "47", w: "94%", conf: "high", affects: "88 plans",
    title: "Unlisted aid station at bike km 74", body: "47 independent uploads show a stop not in the published guide. Water and bananas, on the climb out of the valley.",
    cta: "Promote to crowd-verified", primary: true },
  { tag: "CUT-OFF", course: "SKAGEN 70.3", n: "12", w: "38%", conf: "med", affects: "456 plans",
    title: "Bike cut-off may have moved to 5:00", body: "Twelve reports, but the 2026 athlete guide still says 5:15. Needs confirmation from the organiser before we touch 456 plans.",
    cta: "Email organiser", primary: false },
  { tag: "ELEVATION", course: "TRAMUNTANA FULL", n: "31", w: "72%", conf: "high", affects: "1,284 plans",
    title: "Femenia gradient understated by 0.4%", body: "Barometric data from 31 uploads consistently reads steeper than our terrain sample on the middle 3 km.",
    cta: "Queue bundle patch", primary: true },
  { tag: "ROUTE", course: "ROTH LONG COURSE", n: "3", w: "12%", conf: "low", affects: "1,102 plans",
    title: "Run course re-routed around roadworks", body: "Three reports only, all from the same day. Could be a one-off diversion rather than a course change.",
    cta: "Hold for more data", primary: false },
  { tag: "SPECIAL NEEDS", course: "NORTH SHORE FULL", n: "22", w: "61%", conf: "med", affects: "214 plans",
    title: "Run special needs moved from km 21 to km 17", body: "Consistent across 22 uploads from the 2025 edition. Would shift the fuelling timeline for every affected plan.",
    cta: "Promote to crowd-verified", primary: true },
  { tag: "WATER TEMP", course: "KALMAR 70.3", n: "8", w: "26%", conf: "low", affects: "902 plans",
    title: "Historical water temp running 1.2°C warm", body: "Eight reports suggest our wetsuit-likelihood model is slightly optimistic for this venue.",
    cta: "Hold for more data", primary: false },
];

export const SERVICES = [
  { name: "Solver", status: "NOMINAL", state: "ok" as const, uptime: "99.98%", days: days([]), note: "Sized for 40× a normal Sunday. Last scaled up 11 June." },
  { name: "Course bundles", status: "NOMINAL", state: "ok" as const, uptime: "100%", days: days([]), note: "Read-only in race week by policy. No publishes Thu–Sun." },
  { name: "Race Mode cache", status: "NOMINAL", state: "ok" as const, uptime: "100%", days: days([]), note: "Nothing to fail on race day — everything is already on the device." },
  { name: "Forecast ingest", status: "DEGRADED", state: "warn" as const, uptime: "99.41%", days: days([6, 7]), note: "Upstream provider had a 4-hour gap on 12 June. Fell back to history." },
  { name: "Payments", status: "NOMINAL", state: "ok" as const, uptime: "99.99%", days: days([]), note: "Third-party processor. We never hold card data." },
  { name: "Device export", status: "NOMINAL", state: "ok" as const, uptime: "99.87%", days: days([19]), note: "One Garmin API deprecation handled 30 May." },
].map((sv) => ({
  ...sv,
  dot: sv.state === "ok" ? "#7CC08F" : "#E0A33C",
  fg: sv.state === "ok" ? "#3E7B55" : "#A0701A",
}));

export const INCIDENTS = [
  { when: "12 Jun 09:14", sev: "SEV-3", sevFg: "#A0701A", what: "Forecast provider outage. Plans fell back to eleven-edition history and showed a provenance note.", dur: "4h 02m" },
  { when: "30 May 14:40", sev: "SEV-4", sevFg: "#8C8578", what: "Garmin course export failed for 1.4% of requests after an upstream API deprecation.", dur: "1h 18m" },
  { when: "18 May 06:02", sev: "SEV-2", sevFg: "#C0392B", what: "Solver queue backed up during the Roth weekend spike. P95 reached 14s, no failed solves.", dur: "0h 46m" },
  { when: "04 Apr 11:25", sev: "SEV-4", sevFg: "#8C8578", what: "Race card PDF rendered without the provenance footer for a subset of estimated values.", dur: "2h 51m" },
  { when: "27 Feb 20:11", sev: "SEV-3", sevFg: "#A0701A", what: "Course bundle publish reverted after it changed a cut-off that had not actually moved.", dur: "0h 22m" },
];
