// Notifications inbox + help center data, ported 1:1 from the prototype.

export type ItemState = "warn" | "bad" | "info" | "ok";

export type Delta = { k: string; from: string; to: string };

export type Item = {
  k: string; tag: string; state: ItemState; race: string; when: string; unread: boolean;
  title: string; body: string; deltas: Delta[]; cta: string; href: string; primary: boolean;
};

export const ITEMS: Item[] = [
  { k: "a", tag: "PLAN DRIFT", state: "warn", race: "TRAMUNTANA FULL", when: "2h ago", unread: true,
    title: "Forecast moved to 31°C. Bike target down 6 w.",
    body: "Thursday is 3.4°C warmer than when this plan was solved. Heat adjustment moves power, fluid and one bag item.",
    deltas: [{ k: "BIKE", from: "214 w", to: "208 w" }, { k: "FLUID", from: "620 ml", to: "760 ml" }, { k: "RUN", from: "5:22", to: "5:31" }],
    cta: "Apply and re-solve", href: "racePlan", primary: true },
  { k: "b", tag: "CUT-OFF RISK", state: "bad", race: "KALMAR 70.3", when: "1d ago", unread: true,
    title: "Your Kalmar margin fell under twenty minutes.",
    body: "A re-solve against the updated bike course leaves +0:18 on the bike cut-off. One puncture makes that a decision under pressure.",
    deltas: [], cta: "Review margins", href: "racePlan", primary: true },
  { k: "c", tag: "RACE WEEK", state: "info", race: "TRAMUNTANA FULL", when: "1d ago", unread: true,
    title: "Special-needs bags must be booked by Thursday 18:00.",
    body: "Your plan puts a bottle, three gels and a sunscreen wipe in the bike bag at km 92. The organiser closes booking in 36 hours.",
    deltas: [], cta: "Open bags", href: "racePlan", primary: false },
  { k: "d", tag: "COURSE BUNDLE", state: "info", race: "NORTH SHORE FULL", when: "3d ago", unread: false,
    title: "The organiser moved the bike cut-off 20 minutes earlier.",
    body: "Bundle v2026.3 changes one barrier on your September race. Re-solving is free and takes about three seconds.",
    deltas: [{ k: "BIKE CUT-OFF", from: "10:50", to: "10:30" }], cta: "Re-solve free", href: "planBuilder", primary: false },
  { k: "e", tag: "ANALYSIS READY", state: "ok", race: "ÖTZTALER CLASSIC", when: "5d ago", unread: false,
    title: "Your race file is processed. Four constraints recalibrated.",
    body: "Gut ceiling, sweat rate, heat decoupling and run threshold all moved from estimated toward measured.",
    deltas: [], cta: "See analysis", href: "postRace", primary: false },
  { k: "f", tag: "SHARED", state: "info", race: "TRAMUNTANA FULL", when: "1w ago", unread: false,
    title: "Jonas Feldt opened your plan.",
    body: "Your coach has read access until 28 June. They can comment but cannot change your constraints.",
    deltas: [], cta: "", href: "#", primary: false },
  { k: "g", tag: "BILLING", state: "ok", race: "ACCOUNT", when: "2w ago", unread: false,
    title: "Season Pass renewed for 2026.",
    body: "$70.80 including VAT. Invoice INV-2026-0417 is in your billing history.",
    deltas: [], cta: "", href: "#", primary: false },
];

export const TAG_FG: Record<ItemState, string> = { warn: "#A0701A", bad: "#A03227", info: "#3D6478", ok: "#3E7B55" };
export const DOT_COLOR: Record<ItemState, string> = { warn: "#E0A33C", bad: "#C0392B", info: "#4F7C93", ok: "#7CC08F" };

export type Article = { q: string; body: string };

export const HELP: Record<string, Article[]> = {
  "Getting started": [
    { q: "I do not know my FTP. Can I still use this?", body: "Yes. Every metric offers an estimator — two plain-language questions instead of a number — and the value is stamped as estimated wherever it appears, including on the printed race card. Most first-timers solve their entire plan without a single tested number." },
    { q: "How long does building a plan actually take?", body: "About six minutes for a first plan, and under two for later ones because your constraints carry over. The solve itself takes around three seconds." },
    { q: "Do I have to connect Garmin or Strava?", body: "No feature is gated behind a connection. Type it, upload a file, or connect a service — all three paths reach the same solver, and each stamps the source on the value." },
  ],
  "Plans and solving": [
    { q: "Where do the numbers actually come from?", body: "A deterministic solver holds every hard constraint — gut ceiling, power limits, aid-station spacing, heat adjustment, cut-off times. A language model only phrases the result. Any value can show you the constraint that produced it." },
    { q: "Can I override a number I disagree with?", body: "Almost all of them. Overrides are marked as overrides and the solver re-checks everything downstream, so if your override breaks a cut-off you will be told immediately. Official course values like cut-off times are not overridable." },
    { q: "What if the plan says my goal is infeasible?", body: "It shows you exactly which barrier fails, by how much, and names the two levers that would change it. It does not silently give you a slower plan." },
  ],
  "Courses and data": [
    { q: "My race is not in the directory.", body: "Upload a GPX and enter the cut-offs. The plan still solves, and anything we had to estimate is marked as estimated — including on the printed card." },
    { q: "What does crowd-verified mean?", body: "An aid station or detail that agrees across 40 or more athlete uploads but does not appear in the published guide. We treat it as real and label it honestly." },
    { q: "How current is the course data?", body: "Bundles are versioned by season and the version appears on your plan header. If a bundle changes after you solve, you get a free re-solve." },
  ],
  "Race week": [
    { q: "What happens if the forecast changes?", body: "You get a drift alert naming what moved and what it costs you — previous value beside new value, per number. You either apply it, which re-solves and increments the plan version, or you keep what you have." },
    { q: "Does Race Mode work without signal?", body: "Yes, entirely. Everything caches at bike check-in on Saturday and race day makes zero network requests. A dead cell tower changes nothing." },
    { q: "Can I print the plan?", body: "One A5 page per plan and one page per bag, monochrome legible, designed to be read at hour nine through a wet plastic sleeve." },
  ],
  "Billing": [
    { q: "What if the race is cancelled?", body: "The plan stays in your account permanently and the race status appears on the plan header. If you defer to next season, re-solving against the new course bundle is free." },
    { q: "What happens if I cancel a subscription?", body: "You keep every plan you have already solved, permanently, at full function. What lapses is new solves, post-race analysis, and constraint calibration." },
    { q: "Do you offer refunds?", body: "If the race is cancelled, yes, in full. If a course bundle turns out to have been wrong in a way that materially changed your plan, also yes — email us." },
  ],
  "Privacy": [
    { q: "What data do you read from connected services?", body: "Threshold values and completed race files. Not your training history, routes, followers or private activities. When you disconnect, derived values stay and the connection is deleted the same day." },
    { q: "Do you sell training data?", body: "No, and we do not run advertising. The product is paid for by the people using it, which is the whole reason it can be built this way." },
  ],
};
