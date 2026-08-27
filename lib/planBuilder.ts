// Pure data + math for the Plan Builder — ported 1:1 from the prototype's
// Component class: the seven step names, the solve-animation stage list,
// the bike elevation model, and the five bags (carb/heat/night aware).

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

export const STEP_NAMES = ["Race", "Fitness", "Goal", "Feasibility", "Fuelling", "Bags", "Race card"];

export const SOLVE_STAGES = [
  "Loading course bundle v2026.2",
  "Checking swim cut-off against wave start",
  "Solving bike power under a forecast 31°C",
  "Checking bike cut-off at km 180.2",
  "Solving run pace under heat",
  "Balancing carb rate against gut ceiling",
  "Packing five bags",
];

export function buildElevation(): number[] {
  const n = 240;
  const p: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let h = 60 + 40 * Math.sin(t * 5.1 + 0.4) + 22 * Math.sin(t * 11.3 + 1.9);
    h += 430 * Math.exp(-Math.pow((t - 0.3) / 0.075, 2));
    h += 560 * Math.exp(-Math.pow((t - 0.55) / 0.065, 2));
    h += 300 * Math.exp(-Math.pow((t - 0.78) / 0.055, 2));
    p.push(Math.max(2, h));
  }
  return p;
}

export function elevPath(elev: number[], w: number, top: number, bot: number): string {
  const mn = Math.min(...elev);
  const mx = Math.max(...elev);
  return elev.map((v, i) => (i ? "L" : "M") + ((i / (elev.length - 1)) * w).toFixed(1) + " " + (bot - ((v - mn) / (mx - mn)) * (bot - top)).toFixed(1)).join(" ");
}

export const RACE_RESULTS = [
  { name: "Tramuntana Full", date: "21 Jun 2026", prov: "OFFICIAL", dot: "#7CC08F" },
  { name: "Tramuntana 70.3", date: "20 Jun 2026", prov: "OFFICIAL", dot: "#7CC08F" },
  { name: "Tramuntana Sprint", date: "20 Jun 2026", prov: "CROWD-VERIFIED", dot: "#C4BCAC" },
  { name: "Serra de Tramuntana Classic", date: "12 Sep 2026", prov: "ESTIMATED", dot: "#C4BCAC" },
];

export const SEG = [
  { w: "195 w", from: 0, to: 42 },
  { w: "224 w", from: 42, to: 62.5 },
  { w: "150 w", from: 62.5, to: 78 },
  { w: "205 w", from: 78, to: 118 },
  { w: "214 w", from: 118, to: 152 },
  { w: "200 w", from: 152, to: 180.2 },
];

export type BagItem = { name: string; qty: number; note: string };
export type Bag = { name: string; when: string; items: BagItem[] };

export function buildBags(carb: number, night: boolean): Bag[] {
  const heat = true;
  return [
    {
      name: "Morning Clothes", when: "BEFORE SWIM START",
      items: [
        { name: "Breakfast, 3h out", qty: 1, note: "890 kcal at 03:40 for a 06:40 start" },
        { name: "Pre-swim gel", qty: 1, note: "" },
        { name: "Goggles", qty: 2, note: "Second pair tinted — east-facing bay at sunrise" },
        { name: "Warm layer", qty: 1, note: "" },
        { name: "Timing chip, swim cap", qty: 1, note: "" },
        { name: "Race card, printed", qty: 1, note: "Monochrome legible" },
      ],
    },
    {
      name: "Bike (T1)", when: "TRANSITION 1",
      items: [
        { name: "Gels", qty: 9, note: carb + " g/hr across the bike, minus two aid-station bottles" },
        { name: "Salt capsules", qty: 6, note: "1.3 L/hr sweat rate at a forecast 31°C" },
        { name: "Bottles, concentrate", qty: 3, note: "Third bottle carries the 29.5 km station gap" },
        { name: "Helmet, shoes, glasses", qty: 1, note: "" },
        { name: "Arm coolers", qty: 1, note: heat ? "Added: forecast above 28°C on the exposed plain" : "" },
        { name: "Tube, CO₂, levers", qty: 2, note: "" },
      ],
    },
    {
      name: "Run (T2)", when: "TRANSITION 2",
      items: [
        { name: "Caffeine gels", qty: 4, note: "First at km 12, then every 8 km" },
        { name: "Flask, concentrate", qty: 1, note: "" },
        { name: "Run shoes, socks, cap", qty: 1, note: "" },
        { name: "Race belt", qty: 1, note: "Pre-pinned the night before" },
        { name: "Anti-chafe, plasters", qty: 1, note: "" },
        { name: "Paracetamol", qty: 2, note: "Not an anti-inflammatory — kidney load at hour nine" },
      ],
    },
    {
      name: "Bike Special Needs", when: "KM 92",
      items: [
        { name: "Bottle, concentrate", qty: 1, note: "Reached 04:20 elapsed — covers to km 140" },
        { name: "Gels", qty: 3, note: "" },
        { name: "Spare tube, CO₂", qty: 1, note: "" },
        { name: "Sunscreen wipe", qty: 1, note: "UV 9 from 11:00, and the plain has no shade" },
      ],
    },
    {
      name: "Run Special Needs", when: "KM 21",
      items: [
        { name: "Flask refill", qty: 1, note: "" },
        { name: "Caffeine gel", qty: 2, note: "Held for the last 12 km" },
        { name: "Head torch", qty: 1, note: night ? "Projected finish after dusk — required" : "Carried in case you slow" },
        { name: "Dry socks", qty: 1, note: "" },
        { name: "Long-sleeve layer", qty: 1, note: "Coastal wind drops to 16°C after 20:30" },
      ],
    },
  ];
}
