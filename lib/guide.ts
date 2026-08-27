// Guide article page data + fuelling chart generator, ported 1:1 from the prototype.

export const TOC = [
  { k: "s1", name: "The second half" },
  { k: "s2", name: "Why clocks fail" },
  { k: "s3", name: "Three landmarks" },
  { k: "s4", name: "Practise late" },
];

export const SHARES = [{ k: "IN" }, { k: "X" }, { k: "↗" }];

function toPath(points: [number, number][]) {
  return points.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
}

/** Carb-intake-across-the-bike chart: planned flat line vs. actual median falling away after halfway. */
export function fuellingChart() {
  const plan: [number, number][] = [];
  const act: [number, number][] = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60, x = f * 720;
    plan.push([x, 166 - (78 / 100) * 150]);
    const rate = f < 0.12 ? 62 + f * 120
      : f < 0.46 ? 78 - 2 * Math.sin(f * 22)
      : f < 0.58 ? 74 - (f - 0.46) * 90
      : f < 0.74 ? 56 - (f - 0.58) * 30
      : 49 - (f - 0.74) * 14;
    act.push([x, 166 - (rate / 100) * 150]);
  }
  return {
    planPath: toPath(plan),
    actualPath: toPath(act),
    actualArea: toPath(act) + " L 720 166 L 0 166 Z",
    chartTicks: ["KM 0", "KM 45", "KM 90", "KM 135", "KM 180"].map((k, i) => ({ k, x: (i * 180).toFixed(0) })),
  };
}

export const LANDMARKS = [
  { n: "01", name: "Fifteen minutes before a climb", desc: "Not on it. Take the gel while the road is still flat and your breathing is still conversational, because you will not want it at 5.8% under threshold power." },
  { n: "02", name: "The top of every descent", desc: "Free speed means free hands and a low heart rate. This is the single most reliable eating window on any hilly course, and almost nobody plans for it." },
  { n: "03", name: "Fifteen minutes before an aid station", desc: "If you fuel only at stations, a missed bottle becomes a missed gel too. Front-loading breaks that coupling, so one bad hand-off costs you one thing rather than two." },
];

export const TAKEAWAYS = [
  { n: "01", text: "Measure your first and second half separately. The average is hiding the problem." },
  { n: "02", text: "Trigger intake on landmarks, not on a timer your course knows nothing about." },
  { n: "03", text: "Your real ceiling is what you sustain in hour five, not hour one." },
  { n: "04", text: "Practise the back half of the ride. That is the part that has never actually been tested." },
];

export const RELATED = [
  { cat: "PACING", name: "The bike cut-off is not the one that catches you" },
  { cat: "LOGISTICS", name: "What actually belongs in the red bag" },
  { cat: "HEAT", name: "Reading a forecast like a solver does" },
  { cat: "FIRST TIMER", name: "You do not need an FTP to race well" },
];
