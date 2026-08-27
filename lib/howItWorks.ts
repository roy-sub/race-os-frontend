// How It Works page data (pipeline, solve stages, boundary, provenance), ported 1:1 from the prototype.

export const PIPELINE = [
  { n: "01", time: "6 MIN", name: "You answer what you know", detailLabel: "IF YOU DO NOT KNOW A NUMBER",
    desc: "Seven steps, none of them required. Type a value, upload a file, or connect a service — all three reach the same place.",
    detail: "Two plain-language questions produce an estimate, and it is marked as estimated for the rest of the plan's life." },
  { n: "02", time: "3.1 SEC", name: "The solver does the work", detailLabel: "WHAT MAKES IT DETERMINISTIC",
    desc: "A deterministic constraint solver, not a language model. Same inputs always produce the same plan, and every value traces to a rule.",
    detail: "No sampling, no temperature, no creativity. Given identical inputs it returns a byte-identical plan every time." },
  { n: "03", time: "RACE WEEK", name: "It watches for drift", detailLabel: "WHAT COUNTS AS DRIFT",
    desc: "When the forecast or a constraint moves enough to change your numbers, you get told what moved and what it costs you.",
    detail: "A change of more than two minutes on any projected split, or any change that moves a barrier's margin under twenty minutes." },
];

export type StageInput = { k: string; v: string; fg?: string };
export type Stage = {
  n: string; name: string; ms: string; tag: string; dot: string;
  title: string; body: string; inputs: StageInput[]; out: string; never: string;
};

export const STAGES: Stage[] = [
  { n: "1", name: "Load the course", ms: "0.2s", tag: "COURSE BUNDLE", dot: "#4F7C93",
    title: "Geometry and barriers first, before anything about you.",
    body: "The solver starts from the race, not the athlete. Elevation is sampled from terrain rather than barometers, cut-offs come from the published athlete guide, and aid stations carry their provenance. Nothing here is negotiable — it is the shape of the problem.",
    inputs: [{ k: "BUNDLE", v: "v2026.2" }, { k: "BARRIERS", v: "4" }, { k: "AID STATIONS", v: "11" }],
    out: "A fixed problem space: 180.2 km at 2,340 m gain, four hard time barriers, longest station gap 29.5 km.",
    never: "It will not smooth a climb to make a plan work, and it will not invent an aid station that is not documented." },
  { n: "2", name: "Read your constraints", ms: "0.3s", tag: "ATHLETE INPUTS", dot: "#4F7C93",
    title: "Measured, tested, or estimated — and it tracks which.",
    body: "Threshold values, gut ceiling, sweat rate, caffeine tolerance. Every one is stamped with where it came from. An estimated value is used exactly like a measured one, but it is labelled as estimated for the rest of the plan's life.",
    inputs: [{ k: "MEASURED", v: "4" }, { k: "TESTED", v: "2" }, { k: "ESTIMATED", v: "2" }],
    out: "Eight constraints, three of which will turn out to bind.",
    never: "It will not silently upgrade an estimate into a measurement, and it will not ask you to connect an account to proceed." },
  { n: "3", name: "Protect the barriers", ms: "1.1s", tag: "BINDING CONSTRAINT", dot: "#E4622F",
    title: "The bike cut-off binds. Everything downstream bends around it.",
    body: "Before optimising anything, the solver checks every barrier. Here the bike cut-off at 10:30 is the tightest, so the valley drag gets paced conservatively even though your threshold power says you could go harder. Feasibility is decided before speed.",
    inputs: [{ k: "TIGHTEST", v: "BIKE 10:30" }, { k: "MARGIN", v: "+1:21", fg: "#3E7B55" }, { k: "STATUS", v: "CLEARS", fg: "#3E7B55" }],
    out: "A power ceiling on the valley segment that is lower than your fitness allows, and a stated reason why.",
    never: "It will not produce a plan that misses a barrier and call it ambitious. Infeasible is reported as infeasible." },
  { n: "4", name: "Solve pacing", ms: "0.9s", tag: "OPTIMISATION", dot: "#E4622F",
    title: "Twelve segments, each with its own target.",
    body: "Heat adjustment lowers sustainable power and opens run pace. The bike is split by terrain rather than by distance, so the climb, the descent and the headwind drag each get their own number instead of one average that is wrong everywhere.",
    inputs: [{ k: "SEGMENTS", v: "12" }, { k: "BIKE IF", v: "0.71" }, { k: "RUN SPLIT", v: "1.03" }],
    out: "208 w average across six named bike segments, and a run paced for a 1.03 positive split.",
    never: "It will not give you a single average power for 180 km, because nobody rides a course that way." },
  { n: "5", name: "Balance fuelling", ms: "0.4s", tag: "BINDING CONSTRAINT", dot: "#E4622F",
    title: "Your gut ceiling is a wall, not a target.",
    body: "The solver wants to give you more carbohydrate than your gut has ever absorbed, because more is faster. It is not allowed to. It holds 78 g/hr against a measured ceiling of 90, leaving headroom for the climbs where intake reliably drops.",
    inputs: [{ k: "CEILING", v: "90 g/hr" }, { k: "PLANNED", v: "78 g/hr" }, { k: "STATION GAP", v: "29.5 km" }],
    out: "852 g total, scheduled by landmark rather than by clock, with bottle counts that survive the 29.5 km gap.",
    never: "It will not cross your ceiling without an explicit override, and the override tells you what nine of eleven athletes experienced." },
  { n: "6", name: "Pack the bags", ms: "0.2s", tag: "DERIVED", dot: "#4F7C93",
    title: "Every item exists because a number upstream required it.",
    body: "Nothing in the five bags is a generic checklist item. Arm coolers appear because the forecast crossed 28°C. The head torch appears because your projected finish is after dusk. Two extra salt capsules appear because your sweat rate moved.",
    inputs: [{ k: "BAGS", v: "5" }, { k: "ITEMS", v: "45" }, { k: "CONDITIONAL", v: "7" }],
    out: "Five printable manifests, each item annotated with the constraint that put it there.",
    never: "It will not pad a bag with things you might want. If an item has no reason, it is not in the bag." },
];

export const BOUNDARY = [
  { mark: "✓", markFg: "#3E7B55", name: "Hard constraints", delay: "0s",
    desc: "Gut ceiling, power limits, aid-station spacing, cut-off times, heat adjustment. All held by the solver, all inspectable, all deterministic." },
  { mark: "✓", markFg: "#3E7B55", name: "Phrasing", delay: ".07s",
    desc: "A language model turns a solved number into the sentence you read. It is given the result and asked to describe it, never to compute it." },
  { mark: "×", markFg: "#C0392B", name: "Any number at all", delay: ".14s",
    desc: "No model output ever becomes a value in your plan. If the phrasing layer failed entirely you would still get every correct number, in a plainer sentence." },
  { mark: "×", markFg: "#C0392B", name: "Training advice", delay: ".21s",
    desc: "We own race week. Your coach or your training app owns the twelve months before it, and a tool that tries to be both is neither." },
];

export const PROVENANCE = [
  { tag: "OFFICIAL", desc: "Straight from the published athlete guide, with the verification date shown.", delay: "0s",
    bg: "rgba(124,192,143,.08)", border: "rgba(124,192,143,.34)", tagBg: "rgba(124,192,143,.2)", tagFg: "#3E7B55" },
  { tag: "MEASURED", desc: "Derived from race files you uploaded. The most trustworthy thing we have about you.", delay: ".06s",
    bg: "#FBF8F2", border: "rgba(21,20,15,.1)", tagBg: "rgba(124,192,143,.16)", tagFg: "#3E7B55" },
  { tag: "CROWD", desc: "Agrees across forty or more athlete uploads but is not in the guide. Treated as real, labelled honestly.", delay: ".12s",
    bg: "#FBF8F2", border: "rgba(21,20,15,.1)", tagBg: "rgba(21,20,15,.07)", tagFg: "#5C574B" },
  { tag: "ESTIMATED", desc: "Inferred from two questions. Used exactly like a real value, marked as estimated everywhere including in print.", delay: ".18s",
    bg: "rgba(224,163,60,.07)", border: "rgba(224,163,60,.32)", tagBg: "rgba(224,163,60,.2)", tagFg: "#A0701A" },
];
