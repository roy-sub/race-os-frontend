// Pure data + math for the Landing page's live solver, course canvas and bag
// rail — ported 1:1 from the Claude Design prototype's Component class so the
// same numbers (splits, cut-off margins, fuelling) come out of React state.

export type CutoffRow = { name: string; limit: number; eta: number };

export function fmtClock(m: number): string {
  const s = m < 0 ? "-" : "";
  const mm = Math.abs(Math.round(m));
  return s + Math.floor(mm / 60) + ":" + String(mm % 60).padStart(2, "0");
}

/** Synthetic elevation profile for the bike leg (320 samples, metres). */
export function buildElevation(): number[] {
  const n = 320;
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

/** Synthetic route loop for the bike leg (261 points, canvas coordinates). */
export function buildRoute(): [number, number][] {
  const p: [number, number][] = [];
  for (let i = 0; i <= 260; i++) {
    const a = (i / 260) * Math.PI * 2;
    const r = 1 + 0.26 * Math.sin(3 * a + 0.6) + 0.15 * Math.sin(5 * a + 2.1) + 0.07 * Math.sin(8 * a + 4.4);
    p.push([640 + r * 380 * Math.cos(a), 140 + r * 96 * Math.sin(a)]);
  }
  return p;
}

export type BagItem = { name: string; qty: string; note: string };
export type Bag = { name: string; when: string; count: string; tone: string; media: string; items: BagItem[] };

export const BAGS: Bag[] = [
  {
    name: "Morning Clothes",
    when: "BEFORE SWIM START",
    count: "9",
    tone: "#3E362C",
    media: "assets/bags/morning.jpg",
    items: [
      { name: "Breakfast, 3h out", qty: "890 kcal", note: "Taken at 03:40 for a 06:40 start" },
      { name: "Pre-swim gel", qty: "1×", note: "" },
      { name: "Wetsuit, goggles", qty: "2 pairs", note: "Second pair tinted — east-facing bay" },
      { name: "Warm layer", qty: "1×", note: "" },
      { name: "Timing chip, cap", qty: "—", note: "" },
      { name: "Race card, printed", qty: "1×", note: "v3, solved 18 Jun" },
    ],
  },
  {
    name: "Bike (T1)",
    when: "T1",
    count: "14",
    tone: "#463A2E",
    media: "assets/bags/bike-t1.jpg",
    items: [
      { name: "Gels", qty: "9×", note: "78 g/hr across 5:42, minus two aid bottles" },
      { name: "Salt capsules", qty: "6×", note: "Sweat rate 1.3 L/hr at 29°C" },
      { name: "Helmet, shoes", qty: "—", note: "" },
      { name: "Arm coolers", qty: "1×", note: "Added: forecast above 28°C" },
      { name: "Tube, CO₂, levers", qty: "2 / 2 / 1", note: "" },
      { name: "Chain link, mini tool", qty: "1×", note: "" },
    ],
  },
  {
    name: "Run (T2)",
    when: "T2",
    count: "11",
    tone: "#3A3A31",
    media: "assets/bags/run-t2.jpg",
    items: [
      { name: "Caffeine gels", qty: "4×", note: "First at 12 km, then every 8 km" },
      { name: "Flask concentrate", qty: "300 ml", note: "" },
      { name: "Run shoes, socks", qty: "—", note: "" },
      { name: "Race belt", qty: "1×", note: "Pre-pinned" },
      { name: "Anti-chafe, plasters", qty: "—", note: "" },
      { name: "Paracetamol", qty: "2×", note: "Not an anti-inflammatory — kidney load at hour nine" },
    ],
  },
  {
    name: "Bike Special Needs",
    when: "KM 92",
    count: "5",
    tone: "#4A3E30",
    media: "assets/bags/bike-sn.jpg",
    items: [
      { name: "Bottle, concentrate", qty: "90 g", note: "Reached at 04:12 — covers to km 140" },
      { name: "Gels", qty: "3×", note: "" },
      { name: "Spare tube, CO₂", qty: "1 / 1", note: "" },
      { name: "Sunscreen wipe", qty: "1×", note: "UV 9 from 11:00, exposed valley ahead" },
      { name: "Chamois cream", qty: "1×", note: "" },
    ],
  },
  {
    name: "Run Special Needs",
    when: "KM 21",
    count: "6",
    tone: "#33342E",
    media: "assets/bags/run-sn.jpg",
    items: [
      { name: "Flask refill", qty: "300 ml", note: "" },
      { name: "Caffeine gel", qty: "2×", note: "Held for the last 12 km, within tolerance" },
      { name: "Head torch", qty: "1×", note: "Coastal section unlit after 21:12" },
      { name: "Dry socks", qty: "1×", note: "" },
      { name: "Long-sleeve layer", qty: "1×", note: "Wind drops to 16°C after 20:30" },
      { name: "Salt capsules", qty: "3×", note: "" },
    ],
  },
];

export const FAQS = [
  {
    q: "I do not know my FTP. Can I still use this?",
    a: "Yes. Every metric offers an estimator — two plain questions instead of a number — and the value is stamped as estimated wherever it appears.",
  },
  {
    q: "What if the forecast changes in race week?",
    a: "You get a drift alert naming what moved and what it costs — previous value beside new value. Apply it and the plan re-solves.",
  },
  {
    q: "Where do the numbers come from?",
    a: "A deterministic solver holds every hard constraint. A language model only phrases the result. Any value can show the constraint that produced it.",
  },
  {
    q: "My race is not in the directory.",
    a: "Upload a GPX and enter the cut-offs. The plan still solves, and anything estimated is marked — including on the printed card.",
  },
];
