// Pure data + math for the Course Recon page — ported 1:1 from the Claude
// Design prototype's Component class (elevation profile, route loop, the
// cut-off clock, aid-station rows, small leg sparklines, finish histogram).

export function fmtClock(m: number): string {
  const s = m < 0 ? "-" : "";
  const mm = Math.abs(Math.round(m));
  return s + Math.floor(mm / 60) + ":" + String(mm % 60).padStart(2, "0");
}

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

export function buildRoute(): [number, number][] {
  const p: [number, number][] = [];
  for (let i = 0; i <= 260; i++) {
    const a = (i / 260) * Math.PI * 2;
    const r = 1 + 0.26 * Math.sin(3 * a + 0.6) + 0.15 * Math.sin(5 * a + 2.1) + 0.07 * Math.sin(8 * a + 4.4);
    p.push([420 + r * 250 * Math.cos(a), 160 + r * 112 * Math.sin(a)]);
  }
  return p;
}

/** Same normalize-to-path helper the prototype used for every sparkline. */
export function toPath(vals: number[], w: number, top: number, bot: number): string {
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  return vals
    .map((v, i) => (i ? "L" : "M") + ((i / (vals.length - 1)) * w).toFixed(1) + " " + (bot - ((v - mn) / (mx - mn)) * (bot - top)).toFixed(1))
    .join(" ");
}

export function buildRunSmall(): number[] {
  const runSmall: number[] = [];
  const lapAmp = [9.4, 11.3, 10.1, 12.2];
  const lapWide = [0.54, 0.6, 0.5, 0.63];
  const lapAt = [0.21, 0.17, 0.24, 0.15];
  for (let k = 0; k < 220; k++) {
    const t = k / 219;
    const li = Math.min(3, Math.floor(t * 4));
    const lap = (t * 4) % 1;
    const climb = Math.min(1, Math.max(0, (lap - lapAt[li]) / lapWide[li]));
    const terrain = 11 + 4.6 * Math.sin(t * 6.1 + 0.7) + 2.8 * Math.sin(t * 13.4 + 2.2) + 1.5 * Math.sin(t * 24.7 + 1.1);
    runSmall.push(terrain + lapAmp[li] * (0.5 - 0.5 * Math.cos(Math.PI * 2 * climb)));
  }
  return runSmall;
}

export type AidRow = {
  leg: "SWIM" | "BIKE" | "RUN";
  name: string;
  km: string;
  contents: string;
  prov: "OFFICIAL" | "CROWD-VERIFIED";
};

const LEG_COLOR: Record<AidRow["leg"], string> = { SWIM: "#2E6F8E", BIKE: "#C6461B", RUN: "#7A6A2E" };

const AID_BASE: AidRow[] = [
  { leg: "SWIM", name: "Beach exit", km: "3.8", contents: "Water, fresh-water hose", prov: "OFFICIAL" },
  { leg: "BIKE", name: "Alcúdia", km: "34.0", contents: "Water, sports drink, bananas", prov: "OFFICIAL" },
  { leg: "BIKE", name: "Femenia summit", km: "62.5", contents: "Water only", prov: "CROWD-VERIFIED" },
  { leg: "BIKE", name: "Special needs", km: "92.0", contents: "Your bag, plus water and gels", prov: "OFFICIAL" },
  { leg: "BIKE", name: "Sa Pobla", km: "128.4", contents: "Water, sports drink, gels, bars", prov: "OFFICIAL" },
  { leg: "BIKE", name: "Marina approach", km: "164.0", contents: "Water, cola", prov: "CROWD-VERIFIED" },
  { leg: "RUN", name: "Lap station A", km: "5.3", contents: "Water, cola, sponges, salt, ice — every lap", prov: "OFFICIAL" },
  { leg: "RUN", name: "Special needs", km: "21.1", contents: "Your bag, plus broth after 19:00", prov: "OFFICIAL" },
];

export function aidRows() {
  return AID_BASE.map((a) => {
    const off = a.prov === "OFFICIAL";
    return {
      ...a,
      km: a.km + " km",
      legColor: LEG_COLOR[a.leg],
      dotBg: off ? "#E4622F" : "#FBF8F2",
      dotRing: off ? "rgba(228,98,47,.28)" : "rgba(21,20,15,.22)",
      chipBg: off ? "#EAF5EE" : "#F1EDE4",
      chipFg: off ? "#2E7D53" : "#8C8578",
    };
  });
}

export const FINISH_HIST = [1, 3, 7, 13, 19, 24, 27, 25, 22, 18, 14, 11, 8, 5, 3, 1];
