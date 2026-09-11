"use client";

/**
 * The inbox — this athlete's notifications, and nobody else's.
 *
 * Six notifications about three named races used to be module constants, and
 * every account read the same six. The list is now `GET /notifications`, which
 * takes no user id and answers for the token's own user.
 *
 * Marking one read is a real write. The optimism is deliberate and bounded: the
 * row dims immediately, and on failure the query is invalidated so the server's
 * answer replaces the guess rather than the guess quietly standing.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  formatLongDate,
  useMarkAllRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationItem,
} from "@/lib/api/account";
import { HELP, INBOX_FILTERS, dayGroup, dotColor, tagColor, typeLabel, type InboxFilter } from "@/lib/notifications";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

function Row({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
  const dot = dotColor(item.severity);
  const tag = tagColor(item.severity);

  return (
    <div
      onClick={() => !item.read && onRead()}
      className="row-hover-faint"
      style={{
        display: "flex", gap: 16, padding: "22px 26px", borderBottom: "1px solid rgba(21,20,15,.07)",
        cursor: item.read ? "default" : "pointer",
        background: item.read ? "transparent" : "rgba(255,255,255,.5)",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.read ? "transparent" : dot, marginTop: 7, flex: "none", border: item.read ? "1px solid rgba(21,20,15,.14)" : "none" }} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: tag }}>
            {item.tag ?? typeLabel(item.type_key)}
          </span>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#B8B1A2" }}>
            {formatLongDate(item.created_at).toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em", marginTop: 9, color: item.read ? "#5C574B" : "#15140F" }}>
          {item.title}
        </div>
        <p style={{ margin: "8px 0 0", maxWidth: 680, fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>{item.body}</p>

        {(item.deltas?.length ?? 0) > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 1, marginTop: 16, background: "rgba(21,20,15,.1)", borderRadius: 8, overflow: "hidden" }}>
            {(item.deltas ?? []).map((delta, index) => {
              const row = delta as { label?: string; from?: string; to?: string };
              return (
                <div key={index} style={{ background: "#FBF8F2", padding: "13px 18px", flex: "1 1 150px" }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "#A8A192" }}>{row.label ?? ""}</div>
                  <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8, fontSize: 14 }}>
                    <span style={{ color: "#A8A192", textDecoration: "line-through" }}>{row.from ?? "—"}</span>
                    <span style={{ color: "#C4BCAC" }}>→</span>
                    <span>{row.to ?? "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {item.cta_label && item.cta_href && (
          <Link
            href={item.cta_href}
            className="btn-dark-to-accent"
            style={{ display: "inline-flex", alignItems: "center", height: 40, padding: "0 17px", marginTop: 16, background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}
          >
            {item.cta_label}
          </Link>
        )}
      </div>
    </div>
  );
}

function NotificationsPage() {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const { data, isPending, error, refetch } = useNotifications({ unread: filter === "unread", limit: 50 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();

  const grouped = useMemo(() => {
    const out = new Map<string, NotificationItem[]>();
    for (const item of data?.data ?? []) {
      const key = dayGroup(item.created_at);
      const rows = out.get(key);
      if (rows) rows.push(item);
      else out.set(key, [item]);
    }
    return [...out.entries()];
  }, [data]);

  const unread = data?.unread ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 500, color: "#5C574B", whiteSpace: "nowrap" }}>
            <Link href={routes.dashboard} style={{ color: "#5C574B" }}>Dashboard</Link>
            <Link href={routes.myPlans} style={{ color: "#5C574B" }}>My plans</Link>
            <Link href={routes.notifications} style={{ color: "#15140F" }}>Inbox</Link>
            <Link href={routes.settings} style={{ color: "#5C574B" }}>Settings</Link>
          </nav>
          <span
            onClick={() => unread > 0 && markAll.mutate()}
            className="mono"
            style={{ fontSize: 9.5, letterSpacing: ".13em", color: unread > 0 ? "#C6461B" : "#A8A192", cursor: unread > 0 ? "pointer" : "default", whiteSpace: "nowrap" }}
          >
            {markAll.isPending ? "MARKING…" : unread > 0 ? "MARK ALL READ" : "ALL READ"}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
              {isPending ? "LOADING" : `${data?.total ?? 0} TOTAL · ${unread} UNREAD`}
            </div>
            <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Inbox</h1>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {INBOX_FILTERS.map((f) => {
              const on = filter === f.key;
              return (
                <div
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="row-hover-border"
                  style={{
                    display: "flex", alignItems: "center", height: 36, padding: "0 15px", borderRadius: 7, cursor: "pointer",
                    background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`,
                    fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B", whiteSpace: "nowrap",
                  }}
                >
                  {f.name}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 32, marginTop: 30, alignItems: "start" }}>
          <div style={{ ...CARD, overflow: "hidden" }}>
            {error ? (
              <div style={{ padding: 26 }}>
                <ApiErrorState error={error} onRetry={() => void refetch()} />
              </div>
            ) : isPending ? (
              [0, 1, 2].map((i) => (
                <div key={i} style={{ padding: "22px 26px", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                  <Skeleton width={120} height={10} />
                  <div style={{ marginTop: 12 }}><Skeleton width={420} height={20} /></div>
                  <div style={{ marginTop: 10 }}><Skeleton width={560} height={14} /></div>
                </div>
              ))
            ) : grouped.length === 0 ? (
              <div style={{ padding: "80px 40px", textAlign: "center" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
                  {filter === "unread" ? "NOTHING UNREAD" : "NOTHING YET"}
                </div>
                <div style={{ margin: "18px auto 0", maxWidth: 400, fontSize: 24, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>
                  {filter === "unread" ? "You are up to date." : "No notifications yet."}
                </div>
                <p style={{ margin: "12px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
                  Every notification is tied to a race you entered. Enter one and you will hear from
                  us when something that plan depends on moves — and not otherwise.
                </p>
              </div>
            ) : (
              grouped.map(([day, items]) => (
                <div key={day}>
                  <div className="mono" style={{ padding: "14px 26px 12px", fontSize: 8.5, letterSpacing: ".16em", color: "#A8A192", background: "rgba(21,20,15,.025)", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                    {day.toUpperCase()}
                  </div>
                  {items.map((item) => (
                    <Row key={item.id} item={item} onRead={() => markRead.mutate(item.id)} />
                  ))}
                </div>
              ))
            )}
          </div>

          <div style={{ ...CARD, padding: "26px 28px", position: "sticky", top: 100 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>WHAT WE SEND</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
              {HELP.map((h) => (
                <div key={h.q}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.018em" }}>{h.q}</div>
                  <p style={{ margin: "7px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#6B6455" }}>{h.a}</p>
                </div>
              ))}
            </div>
            <Link href={routes.settings} className="mono link-accent" style={{ display: "inline-block", fontSize: 9.5, letterSpacing: ".13em", color: "#C6461B", marginTop: 24 }}>
              CHANGE WHAT YOU GET →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuardedNotificationsPage() {
  return (
    <GuardedPage>
      <NotificationsPage />
    </GuardedPage>
  );
}
