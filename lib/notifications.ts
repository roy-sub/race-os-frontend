/**
 * Presentation for the inbox. **No athlete data lives here.**
 *
 * Six named notifications about three named races used to be module constants
 * in this file, and every account that signed in read all six. The inbox now
 * renders `GET /notifications`, which takes no user id.
 */

import type { NotificationItem, NotificationType } from "./api/account";

export type Severity = NotificationItem["severity"];

export const DOT_COLOR: Record<string, string> = {
  bad: "#C0392B",
  warn: "#E0A33C",
  ok: "#7CC08F",
  info: "#8C8578",
};

export const TAG_FG: Record<string, string> = {
  bad: "#A03227",
  warn: "#A0701A",
  ok: "#3E7B55",
  info: "#8C8578",
};

export function dotColor(severity: string | null | undefined): string {
  return (severity && DOT_COLOR[severity]) || DOT_COLOR.info;
}

export function tagColor(severity: string | null | undefined): string {
  return (severity && TAG_FG[severity]) || TAG_FG.info;
}

/** The filter chips. `all` is not a server value, so it is spelled apart. */
export const INBOX_FILTERS = [
  { key: "all" as const, name: "All" },
  { key: "unread" as const, name: "Unread" },
];

export type InboxFilter = (typeof INBOX_FILTERS)[number]["key"];

/**
 * What the product will and will not send, shown beside the inbox.
 *
 * This is a promise about behaviour rather than a description of any one
 * account's mail, so it is a constant — and it is the only thing in this file
 * that is.
 */
export const HELP: { q: string; a: string }[] = [
  {
    q: "Why did I get this?",
    a: "Every notification is tied to a race you entered and a change to something that race's plan depends on. Nothing here is marketing, and there is no list you were added to.",
  },
  {
    q: "Does a drift notice change my plan?",
    a: "No. Your plan is untouched until you apply the change yourself. A drift notice shows what would move, side by side, and you decide.",
  },
  {
    q: "Can I turn these off?",
    a: "Every type and every channel, in Settings — except in-app delivery of plan drift and cut-off risk. You choose the channel for those; you do not choose whether the warning exists.",
  },
  {
    q: "Will you email me during a race?",
    a: "No. Notifications are suppressed around a race you have entered, from the hours before the start until you are finished.",
  },
];

/** Group key for the inbox's date headings. */
export function dayGroup(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "Earlier";
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return "Earlier";
}

export const TYPE_LABEL: Partial<Record<NotificationType, string>> = {
  drift: "PLAN DRIFT",
  week: "RACE WEEK",
  cutoff: "CUT-OFF RISK",
  bundle: "COURSE UPDATED",
  analysis: "ANALYSIS READY",
  digest: "DIGEST",
};

export function typeLabel(key: NotificationType): string {
  return TYPE_LABEL[key] ?? String(key).replace(/_/g, " ").toUpperCase();
}
