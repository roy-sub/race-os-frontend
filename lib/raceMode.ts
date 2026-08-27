// Race Mode phone-screen phases + supporting content, ported 1:1 from the prototype.

export type StatusState = "ok" | "warn" | "bad";
export type ActionState = "go" | "info" | "warn";

export type Tile = { k: string; v: string; u: string };

export type Phase = {
  key: string;
  name: string;
  flex: string;
  label: string;
  status: string;
  statusState: StatusState;
  bigLabel: string;
  bigValue: string;
  bigUnit: string;
  bigNote: string;
  tiles: Tile[];
  actionTag: string;
  actionText: string;
  actionState: ActionState;
  progLabel: string;
  progRight: string;
  progW: string;
  clock: string;
  battery: string;
};

export const PHASES: Phase[] = [
  {
    key: "pre", name: "PRE", flex: "1",
    label: "BEFORE THE GUN", status: "READY", statusState: "ok",
    bigLabel: "WAVE START IN", bigValue: "0:12", bigUnit: "min",
    bigNote: "Green wave, rolling start. Non-wetsuit confirmed at 23.1°C.",
    tiles: [
      { k: "GOAL", v: "11:45", u: "" }, { k: "AIR", v: "22°", u: "at start" },
      { k: "WATER", v: "23.1°", u: "" }, { k: "FIRST GEL", v: "now", u: "" },
    ],
    actionTag: "DO THIS NOW", actionText: "Take your pre-swim gel and start sighting the headland, not the buoy.",
    actionState: "go",
    progLabel: "MORNING CLOTHES BAG HANDED IN", progRight: "06:28", progW: "4%",
    clock: "06:28", battery: "94%",
  },
  {
    key: "swim", name: "SWIM", flex: "1",
    label: "SWIM · LAP 2 OF 2", status: "ON PLAN", statusState: "ok",
    bigLabel: "TARGET PACE", bigValue: "1:44", bigUnit: "/100m",
    bigNote: "Current pushes you inside on this lap. Sight every six strokes.",
    tiles: [
      { k: "ELAPSED", v: "0:41", u: "" }, { k: "DISTANCE", v: "2.4", u: "km" },
      { k: "EXIT BY", v: "2:20", u: "cut-off" }, { k: "MARGIN", v: "+1:14", u: "" },
    ],
    actionTag: "AT THE EXIT", actionText: "Wetsuit strippers are on the right. Helmet before you touch the bike.",
    actionState: "info",
    progLabel: "SWIM", progRight: "2.4 / 3.8 KM", progW: "63%",
    clock: "07:21", battery: "93%",
  },
  {
    key: "bike", name: "BIKE", flex: "1.3",
    label: "BIKE · COLL DE FEMENIA", status: "8 W OVER", statusState: "warn",
    bigLabel: "TARGET POWER", bigValue: "224", bigUnit: "w",
    bigNote: "8.4 km at 5.8%. The single biggest power decision of your day.",
    tiles: [
      { k: "ELAPSED", v: "3:04", u: "" }, { k: "DISTANCE", v: "54.2", u: "km" },
      { k: "NEXT AID", v: "8.3", u: "km" }, { k: "MARGIN", v: "+1:21", u: "" },
    ],
    actionTag: "EASE OFF", actionText: "You are 8 w over. Let the strong climbers go — you get it back on the plain.",
    actionState: "warn",
    progLabel: "BIKE", progRight: "54.2 / 180.2 KM", progW: "30%",
    clock: "09:44", battery: "78%",
  },
  {
    key: "t2", name: "T2", flex: "0.8",
    label: "TRANSITION 2", status: "ON PLAN", statusState: "ok",
    bigLabel: "BUDGETED", bigValue: "5:00", bigUnit: "min",
    bigNote: "Take the whole five minutes. Rushing here costs you the first 10 km.",
    tiles: [
      { k: "ELAPSED", v: "7:19", u: "" }, { k: "BIKE SPLIT", v: "6:05", u: "" },
      { k: "RUN TARGET", v: "6:12", u: "/km" }, { k: "MARGIN", v: "+4:15", u: "" },
    ],
    actionTag: "BAG 03 · RUN", actionText: "Shoes, cap, race belt, flask. Drink 250 ml before you leave the tent.",
    actionState: "go",
    progLabel: "TRANSITION 2", progRight: "5:00 BUDGET", progW: "62%",
    clock: "14:01", battery: "61%",
  },
  {
    key: "run", name: "RUN", flex: "1",
    label: "RUN · LAP 3 OF 4", status: "ON PLAN", statusState: "ok",
    bigLabel: "TARGET PACE", bigValue: "6:15", bigUnit: "/km",
    bigNote: "Marina ramp this lap. Walk the aid station if it keeps the pace honest.",
    tiles: [
      { k: "ELAPSED", v: "10:12", u: "" }, { k: "DISTANCE", v: "28.4", u: "km" },
      { k: "CAFFEINE", v: "2 left", u: "" }, { k: "MARGIN", v: "+4:15", u: "" },
    ],
    actionTag: "AT KM 30", actionText: "Head torch from your special-needs bag. The coastal section is unlit.",
    actionState: "info",
    progLabel: "RUN", progRight: "28.4 / 42.2 KM", progW: "67%",
    clock: "16:52", battery: "44%",
  },
];

export const STATUS_COLOR: Record<StatusState, string> = { ok: "#7CC08F", warn: "#E0A33C", bad: "#E86A5A" };
export const ACTION_COLOR: Record<ActionState, string> = { go: "#7CC08F", info: "#4F7C93", warn: "#E0A33C" };
export const ACTION_BG: Record<ActionState, string> = { go: "rgba(124,192,143,.1)", info: "rgba(79,124,147,.12)", warn: "rgba(224,163,60,.11)" };
export const ACTION_BORDER: Record<ActionState, string> = { go: "rgba(124,192,143,.3)", info: "rgba(79,124,147,.32)", warn: "rgba(224,163,60,.34)" };

export const PRINCIPLES = [
  { n: "01", name: "One decision per screen", desc: "At hour nine you cannot compare four numbers. You can read one and act." },
  { n: "02", name: "No input required", desc: "Nothing to type, tap or confirm. Swipe between legs and that is the whole interface." },
  { n: "03", name: "Never a live number", desc: "It shows what the plan says to do, not what your watch says you are doing." },
];

export const CONSTRAINTS = [
  { k: "SUNLIGHT", v: "Near-black ground with white type — the highest contrast a phone can produce at full brightness." },
  { k: "WET HANDS", v: "No gesture smaller than a full-width tap. Nothing to drag or pinch." },
  { k: "HEART RATE 155", v: "Minimum 24 px type for anything you must read while moving." },
  { k: "BENTO BOX", v: "Portrait only, top third holds the number, so a half-visible phone still works." },
  { k: "BATTERY", v: "No polling, no GPS, no network. Eleven hours on 40% of a charge." },
  { k: "NO SIGNAL", v: "Every asset cached Saturday. Race day makes zero requests." },
];

export const CACHED = [
  { name: "Full solved plan, all versions", size: "84 KB" },
  { name: "Course geometry and elevation", size: "1.2 MB" },
  { name: "Aid stations and cut-off gates", size: "12 KB" },
  { name: "All five bag manifests", size: "9 KB" },
  { name: "Race card PDF", size: "220 KB" },
];

export const NEVERS = [
  { name: "No live tracking", why: "The finish line is where signal goes to die. We do not pretend otherwise." },
  { name: "No re-solving mid-race", why: "A plan you can argue with at km 90 is worse than a plan you follow." },
  { name: "No social anything", why: "Nothing about the ninth hour is improved by an audience." },
  { name: "No notifications", why: "The phone stays silent. You look at it when you choose to." },
];

export const NAV_BTNS = ["PLAN", "BAGS", "CUT-OFFS"];
