// Settings tab data, ported 1:1 from the prototype.

export type Tab = "profile" | "constraints" | "connections" | "notifs" | "billing";

export const TABS: { k: Tab; name: string; badge?: boolean; badgeText?: string }[] = [
  { k: "profile", name: "Profile" },
  { k: "constraints", name: "Constraints", badge: true, badgeText: "4 NEW" },
  { k: "connections", name: "Connections" },
  { k: "notifs", name: "Notifications" },
  { k: "billing", name: "Billing" },
];

export const PROFILE_FIELDS = [
  { label: "FULL NAME", value: "Elena Marsh", hasSuffix: false, suffix: "" },
  { label: "EMAIL", value: "elena.marsh@gmail.com", hasSuffix: true, suffix: "VERIFIED" },
  { label: "DATE OF BIRTH", value: "14 / 03 / 1991", hasSuffix: false, suffix: "" },
  { label: "COUNTRY", value: "United Kingdom", hasSuffix: false, suffix: "" },
  { label: "EMERGENCY CONTACT", value: "Tom Marsh", hasSuffix: false, suffix: "" },
  { label: "EMERGENCY PHONE", value: "+44 7700 900 812", hasSuffix: false, suffix: "" },
];

export type ConstraintState = "tested" | "measured" | "manual" | "estimated";

export const CONSTRAINTS: { name: string; value: string; unit: string; dot: string; conf: string; w: string; state: ConstraintState }[] = [
  { name: "Swim threshold pace", value: "1:38", unit: "/100m", dot: "#4F7C93", conf: "TESTED", w: "78%", state: "tested" },
  { name: "Bike threshold power", value: "293", unit: "w", dot: "#E4622F", conf: "2 MONTHS OLD", w: "68%", state: "tested" },
  { name: "Run threshold pace", value: "4:38", unit: "/km", dot: "#64707A", conf: "MEASURED", w: "88%", state: "measured" },
  { name: "Weight", value: "68", unit: "kg", dot: "#C4BCAC", conf: "MANUAL", w: "100%", state: "manual" },
  { name: "Sweat rate", value: "1.42", unit: "L/hr", dot: "#C4BCAC", conf: "4 RACES", w: "94%", state: "measured" },
  { name: "Sodium loss", value: "1,140", unit: "mg/L", dot: "#C4BCAC", conf: "ESTIMATED", w: "34%", state: "estimated" },
  { name: "Gut carbohydrate ceiling", value: "68", unit: "g/hr", dot: "#C4BCAC", conf: "3 RACES", w: "82%", state: "measured" },
  { name: "Caffeine tolerance", value: "480", unit: "mg", dot: "#C4BCAC", conf: "ESTIMATED", w: "22%", state: "estimated" },
];

export const SRC_STYLE: Record<ConstraintState, { bg: string; fg: string; label: string }> = {
  measured: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55", label: "MEASURED" },
  tested: { bg: "rgba(124,192,143,.12)", fg: "#3E7B55", label: "TESTED" },
  manual: { bg: "rgba(21,20,15,.07)", fg: "#5C574B", label: "MANUAL" },
  estimated: { bg: "rgba(224,163,60,.18)", fg: "#A0701A", label: "ESTIMATED" },
};

export const CONF_FG: Record<ConstraintState, string> = { measured: "#5C9E72", tested: "#5C9E72", manual: "#8C8578", estimated: "#E0A33C" };

export type ConnectionKey = "Garmin" | "Strava" | "Wahoo" | "TrainingPeaks";

export const CONNECTIONS: { key: ConnectionKey; name: string; tone: string; desc: string; metaLabel: string; meta: string }[] = [
  { key: "Garmin", name: "Garmin Connect", tone: "#15140F", desc: "Reads threshold values and completed race files.", metaLabel: "LAST SYNC", meta: "18 Jun · 06:12" },
  { key: "Strava", name: "Strava", tone: "#E4622F", desc: "Reads race activities only, never your training log.", metaLabel: "LAST SYNC", meta: "17 Jun · 21:40" },
  { key: "Wahoo", name: "Wahoo SYSTM", tone: "#4F7C93", desc: "Reads bike threshold power from your latest ramp test.", metaLabel: "NOT CONNECTED", meta: "—" },
  { key: "TrainingPeaks", name: "TrainingPeaks", tone: "#5C9E72", desc: "Reads threshold values set by you or your coach.", metaLabel: "NOT CONNECTED", meta: "—" },
];

export type NotifDef = { k: string; name: string; critical: boolean; desc: string; def: [boolean, boolean, boolean] };

export const NOTIFS: NotifDef[] = [
  { k: "drift", name: "Plan drift", critical: true, desc: "When the forecast or a constraint moves enough to change your numbers.", def: [true, true, true] },
  { k: "week", name: "Race week reminders", critical: false, desc: "Special-needs deadlines, bike check-in, packing checklists.", def: [true, true, true] },
  { k: "cutoff", name: "Cut-off risk", critical: true, desc: "When a re-solve puts a barrier under twenty minutes of margin.", def: [true, true, true] },
  { k: "bundle", name: "Course bundle updated", critical: false, desc: "The organiser changed the course, cut-offs or aid stations.", def: [true, false, true] },
  { k: "analysis", name: "Post-race analysis ready", critical: false, desc: "Your uploaded file has been processed and calibration is waiting.", def: [true, false, true] },
  { k: "digest", name: "Monthly digest", critical: false, desc: "New courses and product changes. Off by default.", def: [false, false, false] },
];

export const SENSITIVITY = [
  { k: "Everything", d: "Any change at all" },
  { k: "Balanced", d: "Changes over 2 min" },
  { k: "Critical", d: "Cut-off risk only" },
] as const;

export const BILLING_STATS = [
  { k: "RENEWS", v: "04 MAR 2027" },
  { k: "PLANS SOLVED", v: "7 of ∞" },
  { k: "MEMBER SINCE", v: "MAR 2024" },
];

export const INVOICES = [
  { date: "04 Mar 2026", desc: "Season Pass · annual", no: "INV-2026-0417", amount: "$70.80" },
  { date: "18 Jun 2025", desc: "Race Plan · Ötztaler Classic", no: "INV-2025-3390", amount: "$22.80" },
  { date: "04 Mar 2025", desc: "Season Pass · annual", no: "INV-2025-0288", amount: "$70.80" },
  { date: "11 Aug 2024", desc: "Race Plan · Skagen 70.3", no: "INV-2024-5512", amount: "$22.80" },
  { date: "04 Mar 2024", desc: "Race Plan · First Olympic", no: "INV-2024-0104", amount: "$22.80" },
];
