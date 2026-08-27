"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { DOT_COLOR, HELP, ITEMS, TAG_FG } from "@/lib/notifications";

const HREF_MAP: Record<string, string> = {
  racePlan: routes.racePlan,
  planBuilder: routes.planBuilder,
  postRace: routes.postRace,
  "#": "#",
};

const FILTERS = ["All", "Unread", "Actionable", "Archive"] as const;
const TOPIC_NAMES = Object.keys(HELP);

export default function NotificationsPage() {
  const [view, setView] = useState<"inbox" | "help">("inbox");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("Getting started");
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  const all = ITEMS.map((i) => ({ ...i, unread: read[i.k] ? false : i.unread }));
  const counts = {
    All: all.length,
    Unread: all.filter((i) => i.unread).length,
    Actionable: all.filter((i) => i.cta).length,
    Archive: all.filter((i) => !i.unread).length,
  };
  const list = filter === "All" ? all
    : filter === "Unread" ? all.filter((i) => i.unread)
    : filter === "Actionable" ? all.filter((i) => i.cta)
    : all.filter((i) => !i.unread);

  const headline = counts.Unread === 0
    ? "Nothing needs you right now. We only send what changes a decision."
    : `${counts.Unread} unread, ${counts.Actionable} of them worth acting on today.`;

  const emptyHead = filter === "Unread" ? "You are all caught up." : filter === "Archive" ? "Nothing archived yet." : "No notifications.";

  let articles = HELP[topic] || [];
  if (query) {
    const q = query.toLowerCase();
    articles = TOPIC_NAMES.flatMap((t) => HELP[t]).filter((a) => (a.q + a.body).toLowerCase().includes(q));
  }
  const topicName = query ? `${articles.length} results for "${query}"` : topic;
  const noResults = query.length > 0 && articles.length === 0;

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
            <Link href={routes.settings} style={{ color: "#5C574B" }}>Settings</Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
              {([{ k: "inbox", n: "Inbox" }, { k: "help", n: "Help" }] as const).map((v) => (
                <span key={v.k} onClick={() => setView(v.k)} style={{ padding: "8px 14px", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: view === v.k ? 600 : 500, letterSpacing: "-.012em", background: view === v.k ? "#FBF8F2" : "transparent", color: view === v.k ? "#15140F" : "#8C8578", whiteSpace: "nowrap" }}>{v.n}</span>
              ))}
            </div>
            <MediaPlaceholder path="assets/account/elena.jpg" background="#D8D0C2" style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }} />
          </div>
        </div>
      </header>

      {view === "inbox" ? (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Notifications</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>{headline}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                onClick={() => { const r: Record<string, boolean> = {}; all.forEach((i) => { r[i.k] = true; }); setRead(r); }}
                className="row-hover-border"
                style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
              >Mark all read</span>
              <Link href={routes.settings} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Preferences</Link>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 30 }}>
            {FILTERS.map((f) => {
              const on = filter === f;
              return (
                <div key={f} onClick={() => setFilter(f)} className="row-hover-border" style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 13px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}` }}>
                  <span style={{ fontSize: 13, fontWeight: on ? 600 : 500, letterSpacing: "-.01em", color: on ? "#FBF8F2" : "#5C574B" }}>{f}</span>
                  <span className="mono" style={{ fontSize: 9.5, color: on ? "rgba(251,248,242,.5)" : "#A8A192" }}>{counts[f]}</span>
                </div>
              );
            })}
          </div>

          {list.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
              {list.map((n) => (
                <div
                  key={n.k}
                  onClick={() => setRead((p) => ({ ...p, [n.k]: true }))}
                  className="row-hover-border"
                  style={{ background: n.unread ? "#FBF8F2" : "transparent", border: `1px solid ${n.unread ? "rgba(21,20,15,.12)" : "rgba(21,20,15,.09)"}`, borderRadius: 12, padding: "22px 26px", cursor: "pointer" }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "8px minmax(0,1fr) 120px auto", gap: 20, alignItems: "start" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: n.unread ? DOT_COLOR[n.state] : "rgba(21,20,15,.14)", marginTop: 7, flex: "none" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: TAG_FG[n.state], whiteSpace: "nowrap" }}>{n.tag}</span>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192", whiteSpace: "nowrap" }}>{n.race}</span>
                      </div>
                      <div style={{ fontSize: 19, fontWeight: n.unread ? 600 : 500, letterSpacing: "-.025em", marginTop: 10 }}>{n.title}</div>
                      <div style={{ fontSize: 14.5, lineHeight: 1.5, color: "#5C574B", marginTop: 7, maxWidth: 660 }}>{n.body}</div>
                      {n.deltas.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                          {n.deltas.map((d) => (
                            <span key={d.k} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "7px 12px", borderRadius: 6, background: "rgba(21,20,15,.05)", fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, whiteSpace: "nowrap" }}>
                              <span style={{ color: "#A8A192", letterSpacing: ".1em", fontSize: 8.5 }}>{d.k}</span>
                              <span style={{ color: "#A8A192", textDecoration: "line-through" }}>{d.from}</span>
                              <span style={{ color: "#C4BCAC" }}>→</span>
                              <span style={{ color: "#15140F" }}>{d.to}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="mono" style={{ fontSize: 10.5, color: "#A8A192", whiteSpace: "nowrap", paddingTop: 2 }}>{n.when}</span>
                    <div style={{ display: "flex", gap: 8, flex: "none" }}>
                      {n.cta && (
                        <Link
                          href={HREF_MAP[n.href] ?? "#"}
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-btn"
                          style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", background: n.primary ? "#E4622F" : "transparent", color: n.primary ? "#fff" : "#15140F", border: `1px solid ${n.primary ? "#E4622F" : "rgba(21,20,15,.18)"}`, borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                        >{n.cta}</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 22, padding: "80px 40px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOTHING HERE</div>
              <div style={{ margin: "18px auto 0", maxWidth: 420, fontSize: 28, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-.032em" }}>{emptyHead}</div>
              <p style={{ margin: "12px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>We only send things that change a decision. A quiet inbox means nothing needs you.</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
          <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Help</h1>
          <p style={{ margin: "13px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Answers to the things people actually ask, written plainly.</p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 52, marginTop: 28, maxWidth: 620, padding: "0 17px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 9, background: "#FBF8F2" }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search help — try "cut-off" or "refund"' style={{ flex: 1, border: 0, background: "transparent", fontSize: 16, color: "#15140F", padding: 0, outline: "none" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "246px minmax(0,1fr)", gap: 40, marginTop: 34, alignItems: "start" }}>
            <div style={{ position: "sticky", top: 112, display: "flex", flexDirection: "column", gap: 2 }}>
              {TOPIC_NAMES.map((t) => {
                const active = topic === t && !query;
                return (
                  <div key={t} onClick={() => { setTopic(t); setQuery(""); setOpen({ 0: true }); }} className="row-hover-faint" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderRadius: 8, cursor: "pointer", background: active ? "#FBF8F2" : "transparent" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "#E4622F" : "transparent", flex: "none" }} />
                    <span style={{ fontSize: 14.5, fontWeight: active ? 600 : 500, letterSpacing: "-.018em", color: active ? "#15140F" : "#5C574B", whiteSpace: "nowrap" }}>{t}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 9.5, color: "#A8A192" }}>{HELP[t].length}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 20, padding: "20px 22px", borderRadius: 10, background: "#15140F" }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "rgba(251,248,242,.4)" }}>STILL STUCK</div>
                <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.02em", color: "#FBF8F2", marginTop: 10 }}>Email a human</div>
                <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "rgba(251,248,242,.5)", marginTop: 7 }}>Median reply 4 hours on weekdays, and always faster in race week.</div>
                <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 36, padding: "0 14px", marginTop: 14, background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Contact support</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.032em" }}>{topicName}</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
                {articles.map((a, i) => (
                  <div key={a.q}>
                    <div onClick={() => setOpen((p) => ({ ...p, [i]: !p[i] }))} className="link-accent" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, padding: "22px 0", borderTop: "1px solid rgba(21,20,15,.12)", cursor: "pointer" }}>
                      <span style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-.024em" }}>{a.q}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#C6461B", flex: "none" }}>{open[i] ? "–" : "+"}</span>
                    </div>
                    {open[i] && <p style={{ margin: 0, padding: "0 0 24px", maxWidth: 680, fontSize: 15.5, lineHeight: 1.62, color: "#5C574B" }}>{a.body}</p>}
                  </div>
                ))}
                <div style={{ height: 1, background: "rgba(21,20,15,.12)" }} />
              </div>

              {noResults && (
                <div style={{ marginTop: 24, padding: "56px 40px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.03em" }}>Nothing matches &quot;{query}&quot;.</div>
                  <p style={{ margin: "11px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>Try a shorter word, or email us — we answer everything and turn the good questions into articles.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
