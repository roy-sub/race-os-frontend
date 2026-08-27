// Race directory listing data, ported 1:1 from the prototype.

export type Difficulty = "APPROACHABLE" | "MODERATE" | "HARD" | "BRUTAL";
export type Provenance = "OFFICIAL" | "CROWD-VERIFIED" | "ESTIMATED";
export type Distance = "Full" | "70.3" | "Olympic" | "Sprint";

export type Race = {
  name: string; place: string; date: string; away: string; month: string;
  dist: Distance; gain: string; cutoff: string; diff: Difficulty; prov: Provenance;
  tone: string; media: string;
};

export const RACES: Race[] = [
  { name: "Tramuntana Full", place: "Port de Pollença, Mallorca", date: "21 Jun", away: "6 days", month: "JUN",
    dist: "Full", gain: "2,340 m", cutoff: "10:30 bike", diff: "HARD", prov: "OFFICIAL",
    tone: "#3E352B", media: "assets/courses/tramuntana.jpg" },
  { name: "Kalmar 70.3", place: "Kalmar, Sweden", date: "09 Aug", away: "49 days", month: "AUG",
    dist: "70.3", gain: "410 m", cutoff: "5:15 bike", diff: "MODERATE", prov: "OFFICIAL",
    tone: "#2E3A40", media: "assets/courses/kalmar.jpg" },
  { name: "North Shore Full", place: "Auckland, New Zealand", date: "27 Sep", away: "98 days", month: "SEP",
    dist: "Full", gain: "1,860 m", cutoff: "10:10 bike", diff: "HARD", prov: "OFFICIAL",
    tone: "#33403A", media: "assets/courses/north-shore.jpg" },
  { name: "Cala Olympic", place: "Cala Millor, Mallorca", date: "18 Oct", away: "119 days", month: "OCT",
    dist: "Olympic", gain: "240 m", cutoff: "3:30 total", diff: "APPROACHABLE", prov: "CROWD-VERIFIED",
    tone: "#42392E", media: "assets/courses/cala.jpg" },
  { name: "Roth Long Course", place: "Roth, Germany", date: "05 Jul", away: "20 days", month: "JUL",
    dist: "Full", gain: "1,420 m", cutoff: "10:45 bike", diff: "MODERATE", prov: "OFFICIAL",
    tone: "#39362E", media: "assets/courses/roth.jpg" },
  { name: "Skagen 70.3", place: "Skagen, Denmark", date: "26 Jul", away: "41 days", month: "JUL",
    dist: "70.3", gain: "180 m", cutoff: "5:00 bike", diff: "APPROACHABLE", prov: "OFFICIAL",
    tone: "#2B343A", media: "assets/courses/skagen.jpg" },
  { name: "Patagonia Full", place: "Puerto Varas, Chile", date: "15 Nov", away: "147 days", month: "NOV",
    dist: "Full", gain: "3,100 m", cutoff: "10:00 bike", diff: "BRUTAL", prov: "CROWD-VERIFIED",
    tone: "#2F3830", media: "assets/courses/patagonia.jpg" },
  { name: "Serra Classic", place: "Serra de Tramuntana, Mallorca", date: "12 Sep", away: "83 days", month: "SEP",
    dist: "Full", gain: "2,890 m", cutoff: "10:15 bike", diff: "BRUTAL", prov: "ESTIMATED",
    tone: "#3B3227", media: "assets/courses/serra.jpg" },
  { name: "Bergen Sprint", place: "Bergen, Norway", date: "14 Jun", away: "yesterday", month: "JUN",
    dist: "Sprint", gain: "90 m", cutoff: "1:45 total", diff: "APPROACHABLE", prov: "OFFICIAL",
    tone: "#2C3339", media: "assets/courses/bergen.jpg" },
];

export const PROV_STYLE: Record<Provenance, { dot: string; fg: string }> = {
  OFFICIAL: { dot: "#7CC08F", fg: "#3E7B55" },
  "CROWD-VERIFIED": { dot: "#C4BCAC", fg: "#8C8578" },
  ESTIMATED: { dot: "#E0A33C", fg: "#A0701A" },
};

export const DIFF_COLOR: Record<Difficulty, string> = { APPROACHABLE: "#3E7B55", MODERATE: "#5C574B", HARD: "#A0701A", BRUTAL: "#C0392B" };
export const DIFF_ORDER: Record<Difficulty, number> = { BRUTAL: 3, HARD: 2, MODERATE: 1, APPROACHABLE: 0 };
export const DIST_ORDER: Record<Distance, number> = { Full: 3, "70.3": 2, Olympic: 1, Sprint: 0 };

export const DIST_FILTERS = ["All", "Full", "70.3", "Olympic", "Sprint"] as const;
export const MONTH_FILTERS = ["All", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV"] as const;
export const SORTS = ["DATE", "DIFFICULTY", "DISTANCE"] as const;
