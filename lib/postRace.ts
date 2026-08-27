// Post Race analysis data + derived SVG paths, ported 1:1 from the prototype.

export type CompareRow = {
  name: string; planned: string; actual: string; delta: string;
  state: "good" | "ok" | "warn" | "bad"; why: string; drift: number; dot: string; bold: boolean;
};

const DELTA_COLOR: Record<CompareRow["state"], string> = { good: "#3E7B55", ok: "#5C574B", warn: "#A0701A", bad: "#C0392B" };

export const COMPARE: CompareRow[] = [
  { name: "Swim · 3.8 km", planned: "1:08", actual: "1:07", delta: "−0:01", state: "good", why: "Cleaner than modelled", drift: 4, dot: "#4F7C93", bold: false },
  { name: "T1", planned: "0:08", actual: "0:09", delta: "+0:01", state: "ok", why: "Wetsuit strip queue", drift: 6, dot: "#8C8578", bold: false },
  { name: "Bike · km 0–90", planned: "3:02", actual: "3:00", delta: "−0:02", state: "good", why: "Held 209 w against 208", drift: 7, dot: "#E4622F", bold: false },
  { name: "Bike · km 90–180", planned: "3:03", actual: "3:05", delta: "+0:02", state: "ok", why: "Intake fell to 52 g/hr here", drift: 12, dot: "#E4622F", bold: true },
  { name: "T2", planned: "0:05", actual: "0:07", delta: "+0:02", state: "ok", why: "Took the extra two minutes", drift: 10, dot: "#8C8578", bold: false },
  { name: "Run · km 0–26", planned: "2:38", actual: "2:39", delta: "+0:01", state: "good", why: "On pace to decoupling", drift: 5, dot: "#64707A", bold: false },
  { name: "Run · km 26–42", planned: "1:46", actual: "1:57", delta: "+0:11", state: "bad", why: "Decoupled — 41 g/hr intake", drift: 84, dot: "#64707A", bold: true },
  { name: "Total", planned: "11:50", actual: "12:04", delta: "+0:14", state: "warn", why: "All of it after km 26", drift: 34, dot: "#15140F", bold: true },
];

export function compareRows() {
  return COMPARE.map((c) => ({ ...c, deltaFg: DELTA_COLOR[c.state], driftW: `${c.drift}%`, weight: c.bold ? 600 : 500 }));
}

function toPath(points: [number, number][]) {
  return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
}

/** Run-pace planned-vs-actual line chart geometry. */
export function runChart() {
  const runAct: [number, number][] = [];
  for (let i = 0; i <= 42; i++) {
    const x = (i / 42) * 760;
    const base = 372;
    const act = i < 26 ? base + i * 0.5 : base + 13 + (i - 26) * 5.4;
    runAct.push([x, 174 - Math.max(6, 168 - (act - 360) * 1.55)]);
  }
  const planY = 174 - Math.max(6, 168 - (376 - 360) * 1.55);
  return {
    plannedPath: `M 0 ${planY.toFixed(1)} L 760 ${planY.toFixed(1)}`,
    actualPath: toPath(runAct),
    decoupleX: ((26 / 42) * 760).toFixed(1),
    decoupleW: (760 - (26 / 42) * 760).toFixed(1),
    decoupleLabelX: ((26 / 42) * 760 + 10).toFixed(1),
    runTicks: [0, 10, 21, 32, 42].map((km) => ({ km: "KM " + km, x: ((km / 42) * 760).toFixed(1) })),
  };
}

/** Carbohydrate planned-vs-taken area chart geometry. */
export function carbChart() {
  const carbPlan: [number, number][] = [];
  const carbAct: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * 380, f = i / 40;
    carbPlan.push([x, 146 - (78 / 100) * 130]);
    const rate = f < 0.08 ? 12 : f < 0.42 ? 76 : f < 0.62 ? 52 : f < 0.72 ? 30 : 41;
    carbAct.push([x, 146 - (rate / 100) * 130]);
  }
  return {
    carbPlanPath: toPath(carbPlan),
    carbActualPath: toPath(carbAct),
    carbActualArea: toPath(carbAct) + " L 380 146 L 0 146 Z",
  };
}

export const CALIBRATION = [
  { name: "Gut carbohydrate ceiling", was: "90 g/hr", now: "68 g/hr", nowFg: "#C0392B", evidence: "You held 76 g/hr for 3 hours, then fell away. 68 is what you actually sustained." },
  { name: "Sweat rate", was: "1.1 L/hr", now: "1.42 L/hr", nowFg: "#15140F", evidence: "3.1 kg lost across 12 hours against 9.8 L consumed." },
  { name: "Heat decoupling point", was: "not modelled", now: "km 26", nowFg: "#15140F", evidence: "Pace and heart rate separated at 26 km, twice across two races." },
  { name: "Run threshold pace", was: "4:42/km", now: "4:38/km", nowFg: "#3E7B55", evidence: "First 26 km implies a slightly faster threshold than tested." },
  { name: "Transition time", was: "13 min", now: "16 min", nowFg: "#15140F", evidence: "Your two transitions have averaged 16 minutes across four races." },
];

export const ACTIONS = [
  { n: "01", gain: "−11 min", name: "Fix bike-half intake", delay: "0s",
    desc: "Your intake halved after km 90 in this race and in Roth. The plan will now schedule intake by landmark rather than by the clock.",
    how: "Two long rides at 70 g/hr with a gel every 20 minutes, alarmed on your head unit." },
  { n: "02", gain: "−4 min", name: "Practise the T2 exit", delay: ".08s",
    desc: "You leave transition two minutes slow and then run the first kilometre too hard to compensate. Both cost you.",
    how: "Six bike-to-run transitions off a 90-minute ride, timed, with the same shoes and belt." },
  { n: "03", gain: "−3 min", name: "Pace the last climb honestly", delay: ".16s",
    desc: "You went 14 w over target on the final climb, which reads as free speed and is not.",
    how: "Ride the last hour of your long ride at exactly race power, no exceptions." },
];

export type HistoryRow = { name: string; date: string; dist: string; planned: string; actual: string; d: number; limiter: string; dot: string };

export const HISTORY: HistoryRow[] = [
  { name: "Ötztaler Classic", date: "Sep 2025", dist: "Full", planned: "11:50", actual: "12:04", d: 14, limiter: "Fuelling", dot: "#E4622F" },
  { name: "Kalmar 70.3", date: "Aug 2025", dist: "70.3", planned: "05:28", actual: "05:31", d: 3, limiter: "None", dot: "#7CC08F" },
  { name: "Cala Olympic", date: "Jun 2025", dist: "Olympic", planned: "02:24", actual: "02:22", d: -2, limiter: "None", dot: "#7CC08F" },
  { name: "Roth Long Course", date: "Sep 2024", dist: "Full", planned: "12:10", actual: "12:38", d: 28, limiter: "Fuelling", dot: "#E4622F" },
  { name: "Skagen 70.3", date: "Jul 2024", dist: "70.3", planned: "05:41", actual: "05:52", d: 11, limiter: "Fuelling", dot: "#E4622F" },
  { name: "First Olympic", date: "May 2024", dist: "Olympic", planned: "02:38", actual: "02:44", d: 6, limiter: "Pacing", dot: "#E0A33C" },
];

export function historyRows() {
  return HISTORY.map((h) => ({
    ...h,
    delta: (h.d > 0 ? "+" : "") + Math.floor(Math.abs(h.d) / 60) + ":" + String(Math.abs(h.d) % 60).padStart(2, "0"),
    deltaFg: h.d < 0 ? "#3E7B55" : h.d > 15 ? "#C0392B" : h.d > 6 ? "#A0701A" : "#5C574B",
  }));
}

export function accuracyBars() {
  const list = HISTORY.slice().reverse().concat(HISTORY.slice(0, 5)).slice(0, 11);
  return list.map((h, i) => {
    const px = Math.min(96, Math.abs(h.d) * 3.4);
    const up = h.d < 0;
    return {
      x: (i * 106 + 74).toFixed(0),
      cx: (i * 106 + 74 + 23).toFixed(0),
      y: up ? (110 - px).toFixed(0) : "110",
      h: Math.max(3, px).toFixed(0),
      fill: up ? "#5C9E72" : h.d > 15 ? "#C0392B" : h.d > 6 ? "#E0A33C" : "rgba(21,20,15,.22)",
      delta: (h.d > 0 ? "+" : "") + h.d,
      labelY: up ? (110 - px - 8).toFixed(0) : (110 + px + 16).toFixed(0),
      labelFill: up ? "#3E7B55" : h.d > 15 ? "#C0392B" : "#6B6455",
      race: h.dist === "Full" ? "FULL" : h.dist === "70.3" ? "70.3" : "OLY",
    };
  });
}

export const SEASON_STATS = [
  { k: "RACES FINISHED", v: "11", u: "of 12", note: "One DNS, no DNFs", delay: "0s" },
  { k: "MEDIAN PLAN DELTA", v: "+6", u: "min", note: "Down from +19 in 2023", delay: ".07s" },
  { k: "BEST FULL", v: "12:04", u: "", note: "Ötztaler, September 2025", delay: ".14s" },
  { k: "MOST COMMON LIMITER", v: "Fuel", u: "4 of 5", note: "Not fitness, not heat", delay: ".21s" },
];

export const CONFIDENCE = [
  { name: "Sweat rate", label: "MEASURED · 4 RACES", w: "94%", fg: "#3E7B55" },
  { name: "Gut ceiling", label: "MEASURED · 3 RACES", w: "82%", fg: "#3E7B55" },
  { name: "Bike threshold power", label: "TESTED · 2 MONTHS OLD", w: "68%", fg: "#5C9E72" },
  { name: "Heat decoupling", label: "MEASURED · 2 RACES", w: "54%", fg: "#E0A33C" },
  { name: "Caffeine tolerance", label: "STILL ESTIMATED", w: "22%", fg: "#C4BCAC" },
];

export const SEASONS = ["2025", "2024", "2023", "All"] as const;
