// Plan data + race-card content for My Plans, ported 1:1 from the prototype.

export type PlanState = "Active" | "Draft" | "Past";
export type MarginState = "clear" | "tight" | "none";

export type Plan = {
  name: string;
  date: string;
  place: string;
  version: string;
  status: string;
  state: PlanState;
  dot: string;
  statusFg: string;
  goal: string;
  proj: string;
  margin: string;
  marginState: MarginState;
  ready: string;
  readyW: string;
  readyNote: string;
  readyColor: string;
  shared: boolean;
  cta: string;
  href: string;
  primary: boolean;
  alert: boolean;
  alertTag?: string;
  alertText?: string;
  alertCta?: string;
};

export const PLANS: Plan[] = [
  {
    name: "Tramuntana Full", date: "21 Jun 2026", place: "Mallorca", version: "v3 · solved 18 Jun",
    status: "RACE WEEK · 6 DAYS", state: "Active", dot: "#7CC08F", statusFg: "#3E7B55",
    goal: "11:45", proj: "11:45", margin: "+1:14", marginState: "clear",
    ready: "6/7", readyW: "86%", readyNote: "Bags not packed", readyColor: "#5C9E72",
    shared: true, cta: "Open plan", href: "racePlan", primary: true,
    alert: true, alertTag: "DRIFT", alertText: "Forecast moved to 31°C. Bike target down 6 w, one bag item added.", alertCta: "REVIEW →",
  },
  {
    name: "Kalmar 70.3", date: "09 Aug 2026", place: "Sweden", version: "v1 · solved 02 Jun",
    status: "SOLVED", state: "Active", dot: "#7CC08F", statusFg: "#3E7B55",
    goal: "05:32", proj: "05:38", margin: "+0:18", marginState: "tight",
    ready: "2/7", readyW: "28%", readyNote: "49 days out", readyColor: "#C4BCAC",
    shared: false, cta: "Open plan", href: "racePlan", primary: false, alert: false,
  },
  {
    name: "North Shore Full", date: "27 Sep 2026", place: "New Zealand", version: "v2 · solved 11 May",
    status: "NEEDS REVIEW", state: "Active", dot: "#E0A33C", statusFg: "#A0701A",
    goal: "13:00", proj: "13:12", margin: "+0:42", marginState: "clear",
    ready: "1/7", readyW: "14%", readyNote: "Course bundle updated", readyColor: "#E0A33C",
    shared: false, cta: "Re-solve", href: "planBuilder", primary: false,
    alert: true, alertTag: "STALE", alertText: "The organiser moved the bike cut-off 20 minutes earlier for 2026.", alertCta: "RE-SOLVE FREE →",
  },
  {
    name: "Cala Olympic", date: "18 Oct 2026", place: "Mallorca", version: "draft",
    status: "DRAFT · NOT SOLVED", state: "Draft", dot: "#C4BCAC", statusFg: "#8C8578",
    goal: "—", proj: "—", margin: "—", marginState: "none",
    ready: "0/7", readyW: "3%", readyNote: "Course picked only", readyColor: "#C4BCAC",
    shared: false, cta: "Finish it", href: "planBuilder", primary: false, alert: false,
  },
  {
    name: "Ötztaler Classic", date: "14 Sep 2025", place: "Austria", version: "v4 · raced",
    status: "FINISHED · 12:04:31", state: "Past", dot: "#8C8578", statusFg: "#5C574B",
    goal: "11:50", proj: "12:04", margin: "+2:41", marginState: "clear",
    ready: "7/7", readyW: "100%", readyNote: "Analysis complete", readyColor: "#8C8578",
    shared: true, cta: "View analysis", href: "postRace", primary: false, alert: false,
  },
];

export const CARD_BLOCKS = [
  { title: "PACING", cols: 3, rows: [
    { k: "SWIM 3.8 KM", v: "1:44/100m · 1:06" },
    { k: "BIKE 180.2 KM", v: "208 w · 6:05" },
    { k: "RUN 42.2 KM", v: "6:12/km · 4:21" },
  ] },
  { title: "CUT-OFF MARGINS", cols: 4, rows: [
    { k: "SWIM EXIT", v: "+1:14" }, { k: "BIKE KM 120", v: "+2:19" },
    { k: "BIKE CUT-OFF", v: "+1:21" }, { k: "FINISH", v: "+4:15" },
  ] },
  { title: "FUELLING", cols: 3, rows: [
    { k: "CARB / HR", v: "78 g" }, { k: "FLUID / HR", v: "760 ml" }, { k: "SODIUM / HR", v: "950 mg" },
  ] },
  { title: "AID STATIONS", cols: 3, rows: [
    { k: "KM 34 · 09:22", v: "Water only" },
    { k: "KM 92 · 11:34", v: "Special needs" },
    { k: "KM 128 · 13:01", v: "Full top-up" },
  ] },
  { title: "BAGS", cols: 5, rows: [
    { k: "01 MORNING", v: "9" }, { k: "02 BIKE", v: "14" }, { k: "03 RUN", v: "11" },
    { k: "04 BIKE SN", v: "5" }, { k: "05 RUN SN", v: "6" },
  ] },
];

export const EXPORTS = [
  { ext: "PDF", name: "Race card" },
  { ext: "FIT", name: "Course with waypoints" },
  { ext: "GPX", name: "Route only" },
  { ext: "ICS", name: "Race week calendar" },
];
