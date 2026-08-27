// Pure data + math for the Race Plan page — ported 1:1 from the prototype's
// Component class: the seven tabs' content, the constraint set behind the
// "Why this?" drawer, the bike elevation/power model, and the fuelling model.

export function fmtClock(m: number): string {
  const r = Math.round(m);
  const s = r < 0 ? "-" : "";
  const a = Math.abs(r);
  return s + Math.floor(a / 60) + ":" + String(a % 60).padStart(2, "0");
}

export function wallClock(m: number): string {
  const t = (400 + m) % 1440;
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(Math.round(t % 60)).padStart(2, "0");
}

// Canonical splits, internally consistent, summing to 11:45.
export const SWIM = 66;
export const T1 = 8;
export const BIKE = 365;
export const T2 = 5;
export const RUN = 261;
export const GOAL = 705;
export const BIKE_START = SWIM + T1;

export const GATES = [
  { name: "Swim exit", limit: 140, eta: SWIM },
  { name: "Bike, km 120", limit: 510, eta: SWIM + T1 + BIKE * (120 / 180.2) },
  { name: "Bike cut-off", limit: 630, eta: SWIM + T1 + BIKE },
  { name: "Finish line", limit: 960, eta: 705 },
];
export const WORST = Math.min(...GATES.map((g) => g.limit - g.eta));

export type ConstraintKey = "heat" | "ftp" | "aid" | "gut" | "sweat" | "caff" | "swim" | "cut";

export const CONSTRAINTS: Record<ConstraintKey, { name: string; value: string; source: string; binding: boolean; desc: string; affects: string; override: string }> = {
  heat: {
    name: "Heat adjustment", value: "31°C", source: "FORECAST · THU 14:20", binding: true,
    desc: "Sustainable power falls as wet-bulb temperature rises, and the run suffers more than the bike. At a forecast 31°C the solver lowers your bike target by 6 w and opens your run pace by 9 s/km rather than letting you hold a number you cannot hold.",
    affects: "Bike target · run target · fluid rate · one bike-bag item",
    override: "You can hold the cooler-day targets, but the solver will not protect the finish cut-off if you do.",
  },
  ftp: {
    name: "Bike threshold power", value: "293 w", source: "TESTED · 12 MAY", binding: true,
    desc: "Your 60-minute sustainable power. At balanced risk the plan holds 0.71 of it across six hours, which is the practical ceiling for an iron-distance bike leg with a marathon still to run.",
    affects: "Bike target · bike split · every segment power",
    override: "Raising the intensity factor above 0.74 is available, and the run projection widens sharply when you do.",
  },
  aid: {
    name: "Aid-station spacing", value: "29.5 km", source: "OFFICIAL · 2026 GUIDE", binding: true,
    desc: "The gap between Femenia summit at km 62.5 and your special-needs bag at km 92 is 29.5 km, on the most exposed part of the course. You must carry enough fluid and carbohydrate to cross it without a station.",
    affects: "Bottle count · bike-bag gel count · sunscreen wipe",
    override: "Not overridable — this one comes from the published course, not from you.",
  },
  gut: {
    name: "Gut carbohydrate ceiling", value: "90 g/hr", source: "MEASURED · 3 LONG RIDES", binding: false,
    desc: "The most carbohydrate you have absorbed per hour without distress in training. The plan holds 78 g/hr on the bike, leaving headroom for the climbs where intake usually drops rather than running you against the ceiling all day.",
    affects: "Carb rate · gel count · special-needs contents",
    override: "You can push toward 90 g/hr, which buys about four minutes and costs you the margin for a bad stomach.",
  },
  sweat: {
    name: "Sweat rate", value: "1.3 L/hr", source: "ESTIMATED · 2 QUESTIONS", binding: false,
    desc: "Fluid lost per hour at race intensity, adjusted for the forecast. This sets your bottle count and your sodium load. It is estimated rather than measured, so it is marked as estimated everywhere it appears, including on the printed card.",
    affects: "Fluid rate · salt capsules · bottle count",
    override: "A sweat test replaces the estimate and usually moves the sodium number more than the fluid number.",
  },
  caff: {
    name: "Caffeine tolerance", value: "480 mg", source: "ESTIMATED · 2 QUESTIONS", binding: false,
    desc: "Total caffeine you tolerate across a long effort without a rebound. This is why no caffeinated gel appears before km 12 of the run — held back so it still does something when you need it.",
    affects: "Run gels · run special needs · caffeine timing",
    override: "Front-loading caffeine onto the bike is available and rarely helps a first-time iron finisher.",
  },
  swim: {
    name: "Swim threshold pace", value: "1:38/100m", source: "TESTED · 04 MAY", binding: false,
    desc: "Your sustainable 1,000 m pace in the pool. The plan holds 1:44 in open water — six seconds slower to pay for a non-wetsuit swim, sighting off the headland, and the plain fact that nothing you gain here survives the bike.",
    affects: "Swim target · swim split · T1 arrival time",
    override: "Swimming closer to threshold is available. It buys about two minutes and costs you a measurably worse first hour on the bike.",
  },
  cut: {
    name: "Bike cut-off", value: "10:30", source: "OFFICIAL · 2026 GUIDE", binding: false,
    desc: "You must be off the bike course 10:30 after your wave start. The plan protects this barrier before it optimises anything else, which is why the valley drag is paced conservatively even though you have the legs for more.",
    affects: "Bike target · contingency budget · valley segment",
    override: "Not overridable — this one comes from the race, not from you.",
  },
};

export function buildElevation(): number[] {
  const n = 300;
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let h = 60 + 40 * Math.sin(t * 5.1 + 0.4) + 22 * Math.sin(t * 11.3 + 1.9) + 10 * Math.sin(t * 23.7);
    h += 430 * Math.exp(-Math.pow((t - 0.3) / 0.075, 2));
    h += 560 * Math.exp(-Math.pow((t - 0.55) / 0.065, 2));
    h += 300 * Math.exp(-Math.pow((t - 0.78) / 0.055, 2));
    p.push(Math.max(2, h));
  }
  return p;
}

export const SEGS = [
  { name: "Coastal out", from: 0, to: 42, terrain: "Flat, sheltered", w: 195, min: 78, zone: "Z2", zw: "52%" },
  { name: "Coll de Femenia", from: 42, to: 62.5, terrain: "8.4 km at 5.8%", w: 224, min: 66, zone: "Z3", zw: "76%" },
  { name: "Femenia descent", from: 62.5, to: 78, terrain: "Technical, −4.9%", w: 150, min: 24, zone: "Z1", zw: "28%" },
  { name: "Exposed plain", from: 78, to: 118, terrain: "Rolling, no shade", w: 205, min: 74, zone: "Z2", zw: "60%" },
  { name: "Valley drag", from: 118, to: 152, terrain: "Headwind, false flat", w: 214, min: 68, zone: "Z3", zw: "68%" },
  { name: "Marina return", from: 152, to: 180.2, terrain: "Flat into T2", w: 200, min: 55, zone: "Z2", zw: "56%" },
];

export const SEG_NOTES: Record<string, string> = {
  "Coastal out": "Flat coastal road out of town. Hold 195 w even though it feels absurdly easy — everyone burns the first hour here and pays for it on Femenia.",
  "Coll de Femenia": "The single biggest power decision of your day. 224 w, not a watt more, and let the strong climbers go.",
  "Femenia descent": "Free speed. Drink here and eat here, because the plain gives you nothing.",
  "Exposed plain": "No shade for 40 km. Your special-needs bag is at km 92 with a fresh bottle and sunscreen.",
  "Valley drag": "Headwind in eight of eleven editions. This is where the bike cut-off is lost, and why this segment is paced to protect it.",
  "Marina return": "Two short ramps, then flat. Start drinking for the run — you are about to ask your legs for a marathon.",
};

export const AID_TICK_KMS = [34, 62.5, 92, 128.4, 164];
export const AID_TICKS = [
  { km: "KM 34", label: "ALCÚDIA" },
  { km: "KM 62.5", label: "SUMMIT" },
  { km: "KM 92", label: "SPECIAL NEEDS" },
  { km: "KM 128", label: "SA POBLA" },
  { km: "KM 164", label: "MARINA" },
];

export type BagItem = { name: string; qty: string; note: string };
export type Bag = { name: string; when: string; items: BagItem[] };

export const BAGS: Bag[] = [
  {
    name: "Morning Clothes", when: "BEFORE SWIM START",
    items: [
      { name: "Breakfast, 3h out", qty: "890 kcal", note: "Taken 03:40 for a 06:40 start" },
      { name: "Pre-swim gel", qty: "1×", note: "" },
      { name: "Wetsuit and goggles", qty: "2 pairs", note: "Second pair tinted — east-facing bay at sunrise" },
      { name: "Warm layer, flip-flops", qty: "—", note: "" },
      { name: "Timing chip, swim cap", qty: "—", note: "" },
      { name: "Race card, printed", qty: "1×", note: "v3, monochrome legible" },
    ],
  },
  {
    name: "Bike (T1)", when: "TRANSITION 1",
    items: [
      { name: "Gels", qty: "9×", note: "78 g/hr across 6:05, minus two aid-station bottles" },
      { name: "Salt capsules", qty: "6×", note: "1.3 L/hr sweat rate at a forecast 31°C" },
      { name: "Bottles, concentrate", qty: "3×", note: "Third bottle carries the 29.5 km station gap" },
      { name: "Helmet, shoes, glasses", qty: "—", note: "" },
      { name: "Arm coolers", qty: "1×", note: "Added: forecast above 28°C on the plain" },
      { name: "Tube, CO₂, levers", qty: "2 / 2 / 1", note: "" },
      { name: "Chain link, mini tool", qty: "1×", note: "" },
    ],
  },
  {
    name: "Run (T2)", when: "TRANSITION 2",
    items: [
      { name: "Caffeine gels", qty: "4×", note: "First at km 12, then every 8 km — within a 480 mg tolerance" },
      { name: "Flask, concentrate", qty: "300 ml", note: "" },
      { name: "Run shoes, socks, cap", qty: "—", note: "" },
      { name: "Race belt", qty: "1×", note: "Pre-pinned the night before" },
      { name: "Anti-chafe, plasters", qty: "—", note: "" },
      { name: "Paracetamol", qty: "2×", note: "Not an anti-inflammatory — kidney load at hour nine" },
    ],
  },
  {
    name: "Bike Special Needs", when: "KM 92",
    items: [
      { name: "Bottle, concentrate", qty: "90 g", note: "Reached 04:20 elapsed — covers to km 140" },
      { name: "Gels", qty: "3×", note: "" },
      { name: "Spare tube, CO₂", qty: "1 / 1", note: "" },
      { name: "Sunscreen wipe", qty: "1×", note: "UV 9 from 11:00, and the plain has no shade" },
      { name: "Chamois cream", qty: "1×", note: "" },
    ],
  },
  {
    name: "Run Special Needs", when: "KM 21",
    items: [
      { name: "Flask refill", qty: "300 ml", note: "" },
      { name: "Caffeine gel", qty: "2×", note: "Held for the last 12 km, inside your tolerance" },
      { name: "Head torch", qty: "1×", note: "Projected finish 18:25 — carried in case you slow" },
      { name: "Dry socks", qty: "1×", note: "" },
      { name: "Long-sleeve layer", qty: "1×", note: "Coastal wind drops to 16°C after 20:30" },
      { name: "Salt capsules", qty: "3×", note: "" },
    ],
  },
];

export const FUEL_MARKS = [
  { left: "0%", clock: "06:40", label: "SWIM START" },
  { left: "9.4%", clock: "07:46", label: "T1" },
  { left: "22%", clock: "09:22", label: "KM 34" },
  { left: "46%", clock: "11:34", label: "SPECIAL NEEDS" },
  { left: "63.5%", clock: "13:01", label: "KM 128" },
  { left: "75.6%", clock: "14:01", label: "T2" },
  { left: "100%", clock: "18:25", label: "FINISH" },
];

export const AID_PLAN = [
  { at: "07:46 · T1", name: "Transition 1", action: "Three bottles on, first gel in the top tube", total: "12 g", dot: "#E4622F" },
  { at: "09:22 · km 34", name: "Alcúdia", action: "Water only — top bottle A, do not stop", total: "132 g", dot: "#E4622F" },
  { at: "10:37 · km 62.5", name: "Femenia summit", action: "Water. Drink now, the descent gives you nothing", total: "236 g", dot: "#E4622F" },
  { at: "11:34 · km 92", name: "Special needs", action: "Swap bottle, take three gels, sunscreen wipe", total: "318 g", dot: "#E4622F" },
  { at: "13:01 · km 128", name: "Sa Pobla", action: "Sports drink and water, last full top-up", total: "462 g", dot: "#E4622F" },
  { at: "14:01 · T2", name: "Transition 2", action: "Flask on the belt, cap and shoes, drink 250 ml", total: "560 g", dot: "#64707A" },
];

export const HEAT_ROWS = [
  { name: "Bike target", from: "214 w", to: "208 w" },
  { name: "Run target", from: "6:03/km", to: "6:12/km" },
  { name: "Fluid per hour", from: "620 ml", to: "760 ml" },
  { name: "Salt capsules", from: "6×", to: "8×" },
  { name: "Projected finish", from: "11:31", to: "11:45" },
];

export function buildFuelBars() {
  const bars: { h: string; color: string }[] = [];
  for (let i = 0; i < 47; i++) {
    const m = i * 15;
    let g = 0;
    let col = "#4F7C93";
    if (m < SWIM) { g = 0; col = "rgba(79,124,147,.34)"; }
    else if (m < BIKE_START) { g = 6; col = "rgba(21,20,15,.16)"; }
    else if (m < BIKE_START + BIKE) { g = 19.5; col = "#E4622F"; }
    else if (m < BIKE_START + BIKE + T2) { g = 4; col = "rgba(21,20,15,.16)"; }
    else { g = 15; col = "#64707A"; }
    if (m >= BIKE_START && m < BIKE_START + BIKE) {
      const k = 180.2 * ((m - BIKE_START) / BIKE);
      if (k >= 42 && k <= 62.5) g = 14.5;
      if (k >= 62.5 && k <= 78) g = 22;
    }
    bars.push({ h: Math.max(2, (g / 24) * 150).toFixed(1) + "px", color: col });
  }
  return bars;
}
