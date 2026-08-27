// Coach dashboard data (athletes, comparisons, shared links), ported 1:1 from the prototype.

export type MarginState = "clear" | "tight" | "bad" | "none";
export type ActionState = "urgent" | "warn" | "";

export type Split = { k: string; v: string; u: string; note: string; color: string; tint: string };
export type Gate = { name: string; limit: string; eta: string; margin: string; w: string; state: MarginState };
export type Note = { when: string; text: string };

export type Athlete = {
  name: string; level: string; race: string; when: string; goal: string; margin: string; mState: MarginState;
  issue: string; action: string; actState: ActionState; avatar: string;
  verdict: string; verdictSub: string; splits: Split[]; gates: Gate[]; notes: Note[];
};

export const ATHLETES: Athlete[] = [
  { name: "Priya Raman", level: "FIRST TIMER", race: "Tramuntana Full", when: "6d", goal: "13:58", margin: "+0:11", mState: "bad",
    issue: "Bike cut-off at risk if she punctures", action: "RE-SOLVE", actState: "urgent", avatar: "assets/athletes/priya.jpg",
    verdict: "Priya clears the bike cut-off by eleven minutes. That is not a margin, it is a coin flip.",
    verdictSub: "Her plan is internally sound but has no contingency. One puncture, one slow special-needs stop, and she is off the course. Lowering her goal by twelve minutes buys her a real buffer and costs her nothing that matters on a first iron distance.",
    splits: [
      { k: "SWIM", v: "2:14", u: "/100m", note: "Non-wetsuit, estimated", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
      { k: "BIKE", v: "168", u: "w", note: "Estimated from two questions", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
      { k: "RUN", v: "7:48", u: "/km", note: "Heat adjusted, conservative", color: "#64707A", tint: "rgba(100,112,122,.13)" },
      { k: "CARB", v: "52", u: "g/hr", note: "Below her 65 ceiling", color: "#B5762A", tint: "rgba(181,118,42,.13)" },
    ],
    gates: [
      { name: "Swim exit", limit: "2:20", eta: "1:26", margin: "+0:54", w: "61%", state: "clear" },
      { name: "Bike, km 120", limit: "8:30", eta: "8:02", margin: "+0:28", w: "94%", state: "tight" },
      { name: "Bike cut-off", limit: "10:30", eta: "10:19", margin: "+0:11", w: "98%", state: "bad" },
      { name: "Finish line", limit: "16:00", eta: "13:58", margin: "+2:02", w: "87%", state: "clear" },
    ],
    notes: [
      { when: "MON 15 JUN", text: "Priya — I have flagged your bike cut-off margin. Let us lower the goal to 14:10 and race the last hour, not the first." },
      { when: "THU 11 JUN", text: "Good long ride. Hold 52 g/hr again next week, it clearly agrees with you." },
      { when: "SAT 06 JUN", text: "Wetsuit will almost certainly not be allowed. Practise a non-wetsuit start twice before race week." },
    ] },
  { name: "Marcus Vidal", level: "EXPERIENCED", race: "Tramuntana Full", when: "6d", goal: "09:41", margin: "+2:48", mState: "clear",
    issue: "Nothing — plan is solid", action: "", actState: "", avatar: "assets/athletes/marcus.jpg",
    verdict: "Marcus is the least of your worries this week.",
    verdictSub: "Every barrier clears with real room, his constraints are measured rather than estimated, and his imported bike split is locked as a constraint. The only thing worth a conversation is whether he is leaving time on the table by pacing the run this conservatively.",
    splits: [
      { k: "SWIM", v: "1:22", u: "/100m", note: "Measured, non-wetsuit", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
      { k: "BIKE", v: "268", u: "w", note: "Imported split, locked", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
      { k: "RUN", v: "4:38", u: "/km", note: "Heat adjusted", color: "#64707A", tint: "rgba(100,112,122,.13)" },
      { k: "CARB", v: "94", u: "g/hr", note: "At his measured ceiling", color: "#B5762A", tint: "rgba(181,118,42,.13)" },
    ],
    gates: [
      { name: "Swim exit", limit: "2:20", eta: "0:52", margin: "+1:28", w: "37%", state: "clear" },
      { name: "Bike, km 120", limit: "8:30", eta: "4:11", margin: "+4:19", w: "49%", state: "clear" },
      { name: "Bike cut-off", limit: "10:30", eta: "5:42", margin: "+4:48", w: "54%", state: "clear" },
      { name: "Finish line", limit: "16:00", eta: "09:41", margin: "+6:19", w: "60%", state: "clear" },
    ],
    notes: [
      { when: "SUN 14 JUN", text: "Happy with this. Hold 268 w on Femenia and do not chase anyone up it." },
      { when: "WED 10 JUN", text: "94 g/hr is right at your ceiling. If the stomach turns, drop to 80 and accept four minutes." },
    ] },
  { name: "Sofia Lindqvist", level: "IMPROVER", race: "Kalmar 70.3", when: "49d", goal: "05:31", margin: "+0:18", mState: "tight",
    issue: "Constraints six months stale", action: "RETEST", actState: "warn", avatar: "assets/athletes/sofia.jpg",
    verdict: "Sofia's plan is solved against numbers from January.",
    verdictSub: "Her FTP was tested six months ago and her sweat rate is still estimated. The margin looks tight, but it may not actually be tight — we simply do not know. A ramp test and one sweat-tested long ride would tell us whether this is a real problem or a data problem.",
    splits: [
      { k: "SWIM", v: "1:48", u: "/100m", note: "Tested January", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
      { k: "BIKE", v: "196", u: "w", note: "Six months old", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
      { k: "RUN", v: "5:14", u: "/km", note: "Tested January", color: "#64707A", tint: "rgba(100,112,122,.13)" },
      { k: "CARB", v: "70", u: "g/hr", note: "Estimated", color: "#B5762A", tint: "rgba(181,118,42,.13)" },
    ],
    gates: [
      { name: "Swim exit", limit: "1:10", eta: "0:34", margin: "+0:36", w: "49%", state: "clear" },
      { name: "Bike, km 60", limit: "4:15", eta: "3:22", margin: "+0:53", w: "79%", state: "clear" },
      { name: "Bike cut-off", limit: "5:15", eta: "4:57", margin: "+0:18", w: "94%", state: "tight" },
      { name: "Finish line", limit: "8:00", eta: "05:31", margin: "+2:29", w: "69%", state: "clear" },
    ],
    notes: [
      { when: "MON 15 JUN", text: "Book a ramp test this week. Everything below is guesswork until we have a current number." },
    ] },
  { name: "Tom Achebe", level: "FIRST TIMER", race: "North Shore Full", when: "98d", goal: "14:20", margin: "—", mState: "none",
    issue: "Has not solved a plan yet", action: "NUDGE", actState: "warn", avatar: "assets/athletes/tom.jpg",
    verdict: "Tom has a race in his account and no plan against it.",
    verdictSub: "He picked North Shore three weeks ago and has not returned. First-timers who do not build a plan by twelve weeks out have historically been the ones who arrive underprepared. A single nudge from you is usually enough.",
    splits: [
      { k: "SWIM", v: "—", u: "", note: "Not entered", color: "#C4BCAC", tint: "rgba(21,20,15,.06)" },
      { k: "BIKE", v: "—", u: "", note: "Not entered", color: "#C4BCAC", tint: "rgba(21,20,15,.06)" },
      { k: "RUN", v: "—", u: "", note: "Not entered", color: "#C4BCAC", tint: "rgba(21,20,15,.06)" },
      { k: "CARB", v: "—", u: "", note: "Not entered", color: "#C4BCAC", tint: "rgba(21,20,15,.06)" },
    ],
    gates: [],
    notes: [
      { when: "FRI 12 JUN", text: "Tom — twenty minutes on the plan builder this weekend and we have something to work from." },
    ] },
  { name: "Ines Duarte", level: "EXPERIENCED", race: "Tramuntana Full", when: "6d", goal: "10:24", margin: "+1:52", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/ines.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Karl Brenner", level: "IMPROVER", race: "Kalmar 70.3", when: "49d", goal: "05:02", margin: "+1:14", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/karl.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Maya Okonkwo", level: "FIRST TIMER", race: "Cala Olympic", when: "119d", goal: "03:04", margin: "+2:41", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/maya.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Dan Whitcombe", level: "EXPERIENCED", race: "Tramuntana Full", when: "6d", goal: "10:58", margin: "+1:31", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/dan.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Lena Farkas", level: "IMPROVER", race: "Skagen 70.3", when: "76d", goal: "05:44", margin: "+0:52", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/lena.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Rui Marques", level: "FIRST TIMER", race: "Tramuntana Full", when: "6d", goal: "15:12", margin: "+0:34", mState: "tight",
    issue: "Special needs not booked", action: "REMIND", actState: "warn", avatar: "assets/athletes/rui.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
  { name: "Aiko Tanaka", level: "EXPERIENCED", race: "Patagonia Full", when: "154d", goal: "11:06", margin: "+2:18", mState: "clear",
    issue: "Nothing", action: "", actState: "", avatar: "assets/athletes/aiko.jpg", verdict: "", verdictSub: "", splits: [], gates: [], notes: [] },
];

export const M_COLOR: Record<MarginState, string> = { clear: "#3E7B55", tight: "#A0701A", bad: "#C0392B", none: "#A8A192" };
export const ACT_STYLE: Record<ActionState, { bg: string; fg: string }> = {
  urgent: { bg: "rgba(192,57,43,.12)", fg: "#A03227" },
  warn: { bg: "rgba(224,163,60,.18)", fg: "#A0701A" },
  "": { bg: "transparent", fg: "transparent" },
};

export const BOARD_STATS = [
  { k: "ATHLETES", v: "11", u: "of 15", note: "Four seats remaining", bg: "#FBF8F2", border: "rgba(21,20,15,.1)", labelFg: "#8C8578", valueFg: "#15140F", noteFg: "#5C574B" },
  { k: "RACING THIS WEEK", v: "5", u: "", note: "Tramuntana Full on Sunday", bg: "#FBF8F2", border: "rgba(21,20,15,.1)", labelFg: "#8C8578", valueFg: "#15140F", noteFg: "#5C574B" },
  { k: "NEED YOU TODAY", v: "3", u: "", note: "One cut-off risk, two data gaps", bg: "rgba(228,98,47,.07)", border: "rgba(228,98,47,.32)", labelFg: "#C6461B", valueFg: "#15140F", noteFg: "#5C574B" },
  { k: "NO PLAN YET", v: "1", u: "", note: "Tom Achebe, 98 days out", bg: "rgba(224,163,60,.09)", border: "rgba(224,163,60,.36)", labelFg: "#A0701A", valueFg: "#15140F", noteFg: "#5C574B" },
];

// Compare tab: athletes at indices [1, 4, 7, 0] of ATHLETES = Marcus, Ines, Dan, Priya
export const CMP_INDICES = [1, 4, 7, 0];

type CmpCell = { v: string; flag?: boolean; state?: MarginState };
export const CMP_ROW_DEFS: { k: string; vals: CmpCell[] }[] = [
  { k: "SWIM PACE", vals: ["1:22", "1:38", "1:31", "2:14"].map((v) => ({ v })) },
  { k: "BIKE POWER", vals: ["268 w", "241 w", "228 w", "168 w"].map((v) => ({ v })) },
  { k: "RUN PACE", vals: ["4:38", "5:24", "5:41", "7:48"].map((v) => ({ v })) },
  { k: "CARB / HR", vals: [{ v: "94 g", flag: true, state: "tight" }, { v: "82 g" }, { v: "76 g" }, { v: "52 g" }] },
  { k: "FLUID / HR", vals: ["820 ml", "760 ml", "740 ml", "680 ml"].map((v) => ({ v })) },
  { k: "CONSTRAINTS", vals: [{ v: "measured" }, { v: "measured" }, { v: "tested" }, { v: "estimated", flag: true, state: "tight" }] },
  { k: "BAGS PACKED", vals: [{ v: "5 / 5" }, { v: "5 / 5" }, { v: "3 / 5" }, { v: "1 / 5", flag: true, state: "bad" }] },
];

export const CMP_INSIGHTS = [
  { tag: "THE OUTLIER", name: "Priya's estimated constraints", desc: "She is the only one whose plan rests on estimated rather than measured numbers, and the only one with a margin under twenty minutes. Those two facts are related.", bg: "rgba(192,57,43,.06)", border: "rgba(192,57,43,.28)", tagFg: "#A03227" },
  { tag: "WORTH A CONVERSATION", name: "Marcus at 94 g/hr", desc: "He is racing at his measured ceiling all day. It works in training, but there is no headroom if the stomach turns on Femenia.", bg: "rgba(224,163,60,.08)", border: "rgba(224,163,60,.32)", tagFg: "#A0701A" },
  { tag: "PATTERN ACROSS THE GROUP", name: "Everyone under-fuels the bike", desc: "All four plans put more carbohydrate on the bike than these athletes have historically taken. That is a squad-wide practice problem, not four individual ones.", bg: "#FBF8F2", border: "rgba(21,20,15,.1)", tagFg: "#8C8578" },
];

export type PermKey = "plans" | "build" | "analysis" | "constraints";
export const PERMS: { k: PermKey; name: string; desc: string; locked: boolean }[] = [
  { k: "plans", name: "Read their solved plans", desc: "Pacing, fuelling, bags and cut-off margins for any plan they have solved.", locked: false },
  { k: "build", name: "Build a plan on their behalf", desc: "You solve it, they review and approve it before it becomes theirs.", locked: false },
  { k: "analysis", name: "Read post-race analysis", desc: "Plan against actual, and the constraints their races recalibrated.", locked: false },
  { k: "constraints", name: "Change their constraints directly", desc: "Never available. Their body's numbers belong to them, not to you.", locked: true },
];

export type LinkState = "active" | "expired" | "unopened";
export const LINKS: { plan: string; who: string; shows: string; expires: string; opens: string; status: string; state: LinkState }[] = [
  { plan: "Tramuntana Full", who: "elena.marsh@…", shows: "FULL PLAN", expires: "28 Jun", opens: "4", status: "ACTIVE", state: "active" },
  { plan: "Kalmar 70.3", who: "Sofia Lindqvist", shows: "PACING ONLY", expires: "12 Aug", opens: "1", status: "ACTIVE", state: "active" },
  { plan: "Ötztaler Classic", who: "Public link", shows: "RACE CARD", expires: "expired", opens: "37", status: "EXPIRED", state: "expired" },
  { plan: "North Shore Full", who: "tom.achebe@…", shows: "FULL PLAN", expires: "01 Oct", opens: "0", status: "UNOPENED", state: "unopened" },
  { plan: "Skagen 70.3", who: "Lena Farkas", shows: "BAGS ONLY", expires: "18 Sep", opens: "2", status: "ACTIVE", state: "active" },
];

export const SHARE_RULES = [
  { k: "NO ACCOUNT NEEDED", name: "Anyone with the link can read it", desc: "A coach, a partner driving support, a friend at an aid station. They open it and see exactly what you allowed." },
  { k: "SCOPED", name: "Show only part of a plan", desc: "Race card only, pacing only, or bags only. Your constraints and your body's numbers are never shared." },
  { k: "REVOCABLE", name: "Kill any link instantly", desc: "Revoking works immediately, including on pages someone already has open. Expired links show a plain message, not a broken page." },
];
