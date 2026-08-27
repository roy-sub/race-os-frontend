// Pure data + math for the Dashboard — ported 1:1 from the prototype's
// Component class: the season's races, the plan-overlay map geometry
// (swim/bike/run + elevation, with an isometric 3D projection), the
// per-leg sparklines, and the render helpers shared across every card.

export function fmtClock(m: number): string {
  const r = Math.round(m);
  const s = r < 0 ? "-" : "";
  const a = Math.abs(r);
  return s + Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0");
}

export type RaceData = {
  name: string;
  short: string;
  away: string;
  date: string;
  place: string;
  start: string;
  days: number;
  goal: number;
  solved: boolean;
  drift: boolean;
  status: "PLAN READY · v3" | "PLAN SOLVED · v1" | "NEEDS REVIEW" | "DRAFT";
  meta: string;
  dist: "Full" | "70.3" | "Olympic";
  proj: string;
  feas: "CLEAR" | "TIGHT" | "STALE" | "NOT SOLVED";
  statusTag: "PURCHASED" | "SOLVED" | "REVIEW" | "DRAFT";
};

export const RACES: RaceData[] = [
  {
    name: "Tramuntana Full", short: "Tramuntana", away: "6d", date: "Sunday 21 June 2026", place: "Port de Pollença, Mallorca", start: "06:40 rolling start",
    days: 6, goal: 705, solved: true, drift: true, status: "PLAN READY · v3", meta: "PURCHASED · SOLVED 18 JUN",
    dist: "Full", proj: "11:45", feas: "CLEAR", statusTag: "PURCHASED",
  },
  {
    name: "Kalmar 70.3", short: "Kalmar", away: "49d", date: "Sunday 9 August 2026", place: "Kalmar, Sweden", start: "07:10 wave start",
    days: 49, goal: 332, solved: true, drift: false, status: "PLAN SOLVED · v1", meta: "SEASON PASS · SOLVED 02 JUN",
    dist: "70.3", proj: "05:32", feas: "TIGHT", statusTag: "SOLVED",
  },
  {
    name: "North Shore Full", short: "North Shore", away: "98d", date: "Sunday 27 September 2026", place: "Auckland, New Zealand", start: "06:20 mass start",
    days: 98, goal: 780, solved: true, drift: false, status: "NEEDS REVIEW", meta: "COURSE BUNDLE UPDATED 14 AUG",
    dist: "Full", proj: "13:00", feas: "STALE", statusTag: "REVIEW",
  },
  {
    name: "Cala Olympic", short: "Cala", away: "119d", date: "Sunday 18 October 2026", place: "Cala Millor, Mallorca", start: "08:00 wave start",
    days: 119, goal: 0, solved: false, drift: false, status: "DRAFT", meta: "NO PLAN YET",
    dist: "Olympic", proj: "—", feas: "NOT SOLVED", statusTag: "DRAFT",
  },
];

export const STATUS_MAP: Record<RaceData["status"], { fg: string; dot: string; border: string }> = {
  "PLAN READY · v3": { fg: "#3E7B55", dot: "#7CC08F", border: "rgba(124,192,143,.5)" },
  "PLAN SOLVED · v1": { fg: "#3E7B55", dot: "#7CC08F", border: "rgba(124,192,143,.5)" },
  "NEEDS REVIEW": { fg: "#A0701A", dot: "#E0A33C", border: "rgba(224,163,60,.5)" },
  DRAFT: { fg: "#8C8578", dot: "#A8A192", border: "rgba(21,20,15,.2)" },
};

export const FEAS_COLOR: Record<RaceData["feas"], string> = {
  CLEAR: "#3E7B55", TIGHT: "#A0701A", STALE: "#8C8578", "NOT SOLVED": "#A8A192",
};

export const TAG_STYLE: Record<RaceData["statusTag"], { bg: string; fg: string }> = {
  PURCHASED: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55" },
  SOLVED: { bg: "rgba(21,20,15,.07)", fg: "#5C574B" },
  REVIEW: { bg: "rgba(224,163,60,.18)", fg: "#A0701A" },
  DRAFT: { bg: "rgba(21,20,15,.05)", fg: "#8C8578" },
};

export type Geom = { swim: [number, number][]; bike: [number, number][]; run: [number, number][]; elev: number[] };

export function buildGeom(): Geom {
  const swim: [number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const per = t * 4;
    const seg = Math.floor(per);
    const u = per - seg;
    const box: [number, number][] = [[24, 150], [24, 92], [112, 92], [112, 150]];
    const a = box[seg % 4];
    const b = box[(seg + 1) % 4];
    swim.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  const bike: [number, number][] = [];
  const elev: number[] = [];
  for (let i = 0; i <= 260; i++) {
    const a = (i / 260) * Math.PI * 2;
    const r = 1 + 0.26 * Math.sin(3 * a + 0.6) + 0.15 * Math.sin(5 * a + 2.1) + 0.07 * Math.sin(8 * a + 4.4);
    bike.push([520 + r * 330 * Math.cos(a), 180 + r * 128 * Math.sin(a)]);
    const t = i / 260;
    let h = 60 + 40 * Math.sin(t * 5.1 + 0.4) + 22 * Math.sin(t * 11.3 + 1.9);
    h += 430 * Math.exp(-Math.pow((t - 0.3) / 0.075, 2));
    h += 560 * Math.exp(-Math.pow((t - 0.55) / 0.065, 2));
    h += 300 * Math.exp(-Math.pow((t - 0.78) / 0.055, 2));
    elev.push(h);
  }
  const run: [number, number][] = [];
  for (let i = 0; i <= 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    run.push([300 + 150 * Math.cos(a), 352 + 26 * Math.sin(a)]);
  }
  return { swim, bike, run, elev };
}

export function isoProject(p: [number, number][], g: Geom): [number, number][] {
  const mn = Math.min(...g.elev);
  const mx = Math.max(...g.elev);
  return p.map((pt, i) => {
    const e = g.elev[Math.round((i / (p.length - 1)) * (g.elev.length - 1))] ?? mn;
    return [pt[0], pt[1] * 0.66 + 52 - ((e - mn) / (mx - mn)) * 74] as [number, number];
  });
}

export function toPath(p: [number, number][], close: boolean): string {
  return p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ") + (close ? " Z" : "");
}

export function spark(kind: "swim" | "bike" | "run") {
  const p: number[] = [];
  if (kind === "swim") {
    for (let k = 0; k < 90; k++) p.push(26 + 5.5 * Math.sin(k / 5.2) + 2.4 * Math.sin(k / 1.7));
  } else if (kind === "bike") {
    for (let k = 0; k < 140; k++) {
      const t = k / 139;
      let h = 12 + 5 * Math.sin(t * 5.4 + 0.5) + 2.4 * Math.sin(t * 12.1 + 1.6);
      h += 20 * Math.exp(-Math.pow((t - 0.31) / 0.08, 2));
      h += 26 * Math.exp(-Math.pow((t - 0.56) / 0.07, 2));
      h += 15 * Math.exp(-Math.pow((t - 0.79) / 0.06, 2));
      p.push(h);
    }
  } else {
    const amp = [7.6, 9.2, 8.1, 9.9];
    const wide = [0.54, 0.6, 0.5, 0.63];
    const at = [0.21, 0.17, 0.24, 0.15];
    for (let k = 0; k < 140; k++) {
      const t = k / 139;
      const li = Math.min(3, Math.floor(t * 4));
      const lap = (t * 4) % 1;
      const c = Math.min(1, Math.max(0, (lap - at[li]) / wide[li]));
      p.push(9 + 3.6 * Math.sin(t * 6.1 + 0.7) + 2.1 * Math.sin(t * 13.4 + 2.2) + amp[li] * (0.5 - 0.5 * Math.cos(Math.PI * 2 * c)));
    }
  }
  const mn = Math.min(...p);
  const mx = Math.max(...p);
  const d = p.map((v, i) => (i ? "L" : "M") + ((i / (p.length - 1)) * 300).toFixed(1) + " " + (50 - ((v - mn) / (mx - mn || 1)) * 42).toFixed(1)).join(" ");
  return { line: d, area: d + " L 300 56 L 0 56 Z" };
}

export const TASK_DATA = [
  { date: "MON 15", label: "Test race fuelling", note: "78 g/hr on the long ride" },
  { date: "TUE 16", label: "Book special needs", note: "Deadline Thursday 18:00" },
  { date: "WED 17", label: "Bike service", note: "Tyres, cables, spare kit" },
  { date: "THU 18", label: "Check the forecast", note: "Re-solve if it moves 2°C" },
  { date: "FRI 19", label: "Pack all five bags", note: "One printed page per bag" },
  { date: "SAT 20", label: "Bike check-in", note: "12:00 to 17:00 at T1" },
  { date: "SUN 21", label: "Race", note: "06:40 rolling start" },
];

export const BAG_DATA = [
  { name: "Morning Clothes", when: "BEFORE START", total: 9 },
  { name: "Bike (T1)", when: "TRANSITION 1", total: 14 },
  { name: "Run (T2)", when: "TRANSITION 2", total: 11 },
  { name: "Bike Special Needs", when: "KM 92", total: 5 },
  { name: "Run Special Needs", when: "KM 21", total: 6 },
];

export const ALERTS = [
  { title: "Forecast moved to 31°C", body: "Heat adjustment lowers bike power by 6 w and raises fluid to 760 ml/hr.", when: "TRAMUNTANA FULL · 2H AGO", color: "#E0A33C" },
  { title: "North Shore course bundle updated", body: "The bike leg was re-routed around the viaduct. Your plan needs a re-solve.", when: "NORTH SHORE FULL · 14 AUG", color: "#8C8578" },
];

export const DRIFT = [
  { label: "BIKE TARGET", from: "214 w", to: "208 w" },
  { label: "FLUID / HR", from: "620 ml", to: "760 ml" },
  { label: "RUN TARGET", from: "5:22/km", to: "5:31/km" },
  { label: "BIKE BAG", from: "6 salt", to: "8 salt" },
];

export const BIKE_NOTE = (km: number) =>
  km < 40
    ? "Flat coastal road. Hold 20 w under target here — everyone burns the first hour."
    : km < 70
      ? "Coll de Femenia. 8.4 km at 5.8%. This is the single biggest power decision of the day."
      : km < 110
        ? "Technical descent, then the exposed plain. Your special-needs bag is at km 92."
        : km < 150
          ? "The valley drag. Headwind in eight of eleven editions — this is where the cut-off is lost."
          : "Rolling return to T2. Two short ramps, then flat. Start drinking for the run.";

export const RUN_NOTE = (km: number) =>
  km < 12
    ? "Four seafront laps. Your first caffeine gel is at km 12, not before."
    : km < 21
      ? "Marina ramp each lap. Walk the aid stations if that keeps the pace honest."
      : km < 32
        ? "Special-needs bag at km 21. Head torch if you are behind schedule."
        : "Unlit coastal section. Head torch on, and the last 8 km run in the dark.";
