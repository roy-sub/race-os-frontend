"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { routes } from "@/lib/routes";
import {
  C_DOT, CONF_COLOR, COURSES, INCIDENTS, KPIS, LAT_TICKS, P50_PATH, P95_PATH, P99_PATH,
  P_STYLE, QUEUE, REPORTS, SERVICES, SLA_LABEL_Y, SLA_Y, T_STYLE, USERS, USER_STATS,
  type CourseState,
} from "@/lib/admin";

type Tab = "overview" | "courses" | "users" | "feedback" | "health";
const TABS: { k: Tab; n: string; badge?: string }[] = [
  { k: "overview", n: "Overview" }, { k: "courses", n: "Courses", badge: "38" },
  { k: "users", n: "Users" }, { k: "feedback", n: "Feedback", badge: "6" }, { k: "health", n: "Health" },
];
const RANGES = ["7d", "30d", "90d"] as const;
const COURSE_FILTERS = ["All", "Pending", "Stale", "Unverified"] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [filter, setFilter] = useState<(typeof COURSE_FILTERS)[number]>("All");
  const [query, setQuery] = useState("");

  const counts = {
    All: COURSES.length,
    Pending: COURSES.filter((c) => c.state === "pending").length,
    Stale: COURSES.filter((c) => c.state === "stale").length,
    Unverified: COURSES.filter((c) => c.state === "unverified").length,
  };
  let courseList = filter === "All" ? COURSES : COURSES.filter((c) => c.state === (filter.toLowerCase() as CourseState));
  if (query) courseList = courseList.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "#15140F" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={25} height={17} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em", color: "#FBF8F2" }}>RaceOS</span>
            </Link>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", padding: "4px 8px", borderRadius: 4, background: "#E4622F", color: "#fff", whiteSpace: "nowrap" }}>INTERNAL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((t) => {
              const active = tab === t.k;
              return (
                <div key={t.k} onClick={() => setTab(t.k)} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, height: 62, padding: "0 15px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#FBF8F2" : "rgba(251,248,242,.5)" }}>{t.n}</span>
                  {t.badge && <span className="mono" style={{ fontSize: 8, letterSpacing: ".1em", padding: "2px 6px", borderRadius: 3, background: "rgba(228,98,47,.25)", color: "#F08A5C" }}>{t.badge}</span>}
                  <span style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 2, background: active ? "#E4622F" : "transparent" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".13em", color: "#7CC08F", whiteSpace: "nowrap" }}>
              <span className="om-breathe" style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />ALL SYSTEMS NOMINAL
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 14, borderLeft: "1px solid rgba(251,248,242,.14)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(251,248,242,.14)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#FBF8F2" }}>AD</div>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "rgba(251,248,242,.5)", whiteSpace: "nowrap" }}>OPS</span>
            </div>
          </div>
        </div>
      </header>

      {tab === "overview" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Operations</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Seven days to Tramuntana weekend. 412 courses live, 38 in the verification queue.</p>
            </div>
            <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7, flex: "none" }}>
              {RANGES.map((r) => (
                <span key={r} onClick={() => setRange(r)} className="mono" style={{ padding: "9px 15px", borderRadius: 5, cursor: "pointer", fontSize: 10.5, letterSpacing: ".1em", background: range === r ? "#15140F" : "transparent", color: range === r ? "#FBF8F2" : "#8C8578", whiteSpace: "nowrap" }}>{r}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 32 }}>
            {KPIS.map((k) => (
              <div key={k.k} style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 24px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{k.k}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 13 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 34, letterSpacing: "-.044em" }}>{k.v}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: k.deltaFg }}>{k.delta}</span>
                </div>
                <svg viewBox="0 0 220 40" style={{ display: "block", width: "100%", marginTop: 14 }}>
                  <path d={k.spark} fill="none" stroke={k.line} strokeWidth={1.6} strokeLinejoin="round" />
                </svg>
                <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 6 }}>{k.note}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>SOLVER LATENCY · P50 / P95 / P99</span>
                <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>TARGET P95 UNDER 6s</span>
              </div>
              <svg viewBox="0 0 760 200" style={{ display: "block", width: "100%", marginTop: 18 }}>
                <line x1="0" y1={SLA_Y} x2="760" y2={SLA_Y} stroke="rgba(192,57,43,.4)" strokeWidth={1.2} strokeDasharray="5 4" />
                <text x="6" y={SLA_LABEL_Y} fill="#C0392B" fontFamily="JetBrains Mono, monospace" fontSize="9.5" letterSpacing="1">SLA 6s</text>
                <path d={P99_PATH} fill="none" stroke="rgba(21,20,15,.2)" strokeWidth={1.5} />
                <path d={P95_PATH} fill="none" stroke="#E0A33C" strokeWidth={1.7} />
                <path d={P50_PATH} fill="none" stroke="#E4622F" strokeWidth={2} />
                <line x1="0" y1="176" x2="760" y2="176" stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                {LAT_TICKS.map((t) => (
                  <text key={t.d} x={t.x} y="194" textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize="9">{t.d}</text>
                ))}
              </svg>
              <div style={{ display: "flex", gap: 24, marginTop: 12, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".12em", color: "#8C8578" }}><span style={{ width: 12, height: 2, background: "#E4622F" }} />P50 3.1s</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".12em", color: "#8C8578" }}><span style={{ width: 12, height: 2, background: "#E0A33C" }} />P95 5.4s</span>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".12em", color: "#8C8578" }}><span style={{ width: 12, height: 2, background: "rgba(21,20,15,.2)" }} />P99 8.2s</span>
              </div>
            </div>
            <div style={{ background: "#191713", borderRadius: 12, padding: "26px 28px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>NEEDS A HUMAN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 16 }}>
                {QUEUE.map((q) => (
                  <div key={q.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(251,248,242,.09)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: q.dot, flex: "none" }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, color: "#FBF8F2" }}>{q.name}</span>
                      <span className="mono" style={{ display: "block", fontSize: 9, letterSpacing: ".11em", color: "rgba(251,248,242,.35)", marginTop: 4 }}>{q.meta}</span>
                    </span>
                    <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 19, letterSpacing: "-.03em", color: q.dot }}>{q.n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "courses" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Course bundles</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Every bundle is versioned by season. Publishing a change triggers a free re-solve for every affected plan and a drift alert to every athlete.</p>
            </div>
            <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", height: 42, padding: "0 17px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer", flex: "none" }}>
              <span className="mono" style={{ fontSize: 13, lineHeight: 1 }}>+</span>New bundle
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {COURSE_FILTERS.map((f) => {
                const on = filter === f;
                return (
                  <div key={f} onClick={() => setFilter(f)} className="row-hover-border" style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 13px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}` }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: f === "All" ? "transparent" : C_DOT[f.toLowerCase() as CourseState], flex: "none" }} />
                    <span style={{ fontSize: 13, fontWeight: on ? 600 : 500, letterSpacing: "-.01em", color: on ? "#FBF8F2" : "#5C574B" }}>{f}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: on ? "rgba(251,248,242,.5)" : "#A8A192" }}>{counts[f]}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 13px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#FBF8F2" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 412 courses" style={{ width: 170, border: 0, background: "transparent", fontSize: 13.5, color: "#15140F", padding: 0, outline: "none" }} />
            </div>
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 24px", marginTop: 22, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) .8fr .8fr .9fr .9fr 1fr 116px", gap: 18, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>COURSE</span><span>BUNDLE</span><span>DIST</span><span>VERIFIED</span><span>PLANS</span><span>PENDING CHANGE</span><span style={{ textAlign: "right" }}>PROVENANCE</span>
            </div>
            {courseList.map((c) => (
              <div key={c.name} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) .8fr .8fr .9fr .9fr 1fr 116px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: C_DOT[c.state], flex: "none" }} />
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>{c.name}</span>
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{c.bundle}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{c.dist}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: c.verified === "—" ? "#C0392B" : "#5C574B" }}>{c.verified}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{c.plans}</span>
                <span style={{ fontSize: 13, color: c.change === "—" ? "#A8A192" : "#C6461B" }}>{c.change}</span>
                <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, background: P_STYLE[c.prov].bg, color: P_STYLE[c.prov].fg, whiteSpace: "nowrap" }}>{c.prov}</span></span>
              </div>
            ))}
          </div>

          <div style={{ border: "1px solid rgba(228,98,47,.32)", background: "rgba(228,98,47,.06)", borderRadius: 12, padding: "26px 30px", marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40 }}>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#C6461B" }}>BLAST RADIUS · BEFORE YOU PUBLISH</div>
                <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Publishing North Shore v2026.3 re-solves 214 plans.</div>
                <p style={{ margin: "8px 0 0", maxWidth: 640, fontSize: 14.5, lineHeight: 1.55, color: "#5C574B" }}>The bike cut-off moved 20 minutes earlier. 31 of those plans go from clear to tight, and 4 become infeasible. Every affected athlete gets a drift alert naming the change and what it costs them.</p>
              </div>
              <div style={{ display: "flex", gap: 10, flex: "none" }}>
                <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(21,20,15,.2)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Preview impact</span>
                <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 20px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Publish bundle</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Users</h1>
          <p style={{ margin: "13px 0 0", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Support access only. Constraint values and plan contents are never visible from here — you can see that a plan exists, not what it says.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 30 }}>
            {USER_STATS.map((u) => (
              <div key={u.k} style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 24px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{u.k}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 13 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 32, letterSpacing: "-.042em" }}>{u.v}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: u.deltaFg }}>{u.delta}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 9 }}>{u.note}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 24px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) .9fr .8fr .8fr .8fr 1fr 108px", gap: 18, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>ACCOUNT</span><span>PLAN</span><span>SOLVED</span><span>RACED</span><span>JOINED</span><span>LAST SEEN</span><span style={{ textAlign: "right" }}>STATE</span>
            </div>
            {USERS.map((u) => (
              <div key={u.id} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) .9fr .8fr .8fr .8fr 1fr 108px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>{u.email}</span>
                  <span className="mono" style={{ display: "block", fontSize: 8.5, letterSpacing: ".11em", color: "#A8A192", marginTop: 3 }}>{u.id}</span>
                </span>
                <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, justifySelf: "start", background: T_STYLE[u.tier].bg, color: T_STYLE[u.tier].fg, whiteSpace: "nowrap" }}>{u.tier}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{u.solved}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{u.raced}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{u.joined}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{u.seen}</span>
                <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: u.state === "ACTIVE" ? "#3E7B55" : u.state === "ERASED" ? "#C0392B" : "#A8A192", whiteSpace: "nowrap" }}>{u.state}</span></span>
              </div>
            ))}
          </div>

          <div style={{ background: "#191713", borderRadius: 12, padding: "26px 30px", marginTop: 14, boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>WHAT SUPPORT CANNOT SEE</div>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.027em", color: "#FBF8F2", marginTop: 12 }}>Constraint values, plan contents, and uploaded race files.</div>
            <p style={{ margin: "10px 0 0", maxWidth: 660, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>Support can see that a plan exists, when it was solved, and which bundle it used. Reading the plan itself requires the athlete to grant temporary access from their own account, and every grant is logged and expires in one hour.</p>
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Feedback</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Course corrections from athletes, weighted by how many independent uploads agree. Two agreeing reports become crowd-verified; one stays pending.</p>
            </div>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", paddingBottom: 8, whiteSpace: "nowrap" }}>38 PENDING · MEDIAN AGE 2 DAYS</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 30 }}>
            {REPORTS.map((r) => {
              const cc = CONF_COLOR[r.conf];
              const tagFg = r.conf === "high" ? "#3E7B55" : r.conf === "med" ? "#A0701A" : "#8C8578";
              const bg = r.conf === "high" ? "rgba(124,192,143,.07)" : "#FBF8F2";
              const border = r.conf === "high" ? "rgba(124,192,143,.34)" : "rgba(21,20,15,.1)";
              const ctaBg = r.primary ? "#15140F" : "transparent";
              const ctaFg = r.primary ? "#F1EEE8" : "#15140F";
              return (
                <div key={r.title} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "24px 28px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 130px auto", gap: 24, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11, flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: tagFg, whiteSpace: "nowrap" }}>{r.tag}</span>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192", whiteSpace: "nowrap" }}>{r.course}</span>
                      </div>
                      <div style={{ fontSize: 17.5, fontWeight: 500, letterSpacing: "-.023em", marginTop: 10 }}>{r.title}</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#5C574B", marginTop: 6, maxWidth: 600 }}>{r.body}</div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>AGREEING UPLOADS</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9 }}>
                        <span style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: r.w, background: cc, borderRadius: 2 }} />
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: cc }}>{r.n}</span>
                      </div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>AFFECTS</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, marginTop: 9 }}>{r.affects}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flex: "none" }}>
                      <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 15px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reject</span>
                      <span className="opacity-btn" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", background: ctaBg, color: ctaFg, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{r.cta}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "health" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>System health</h1>
          <p style={{ margin: "13px 0 0", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Race weekends are the only load that matters. Everything here is sized for a Sunday morning in June.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 30 }}>
            {SERVICES.map((sv) => (
              <div key={sv.name} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.024em" }}>{sv.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".13em", color: sv.fg, whiteSpace: "nowrap" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: sv.dot }} />{sv.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 3, marginTop: 18 }}>
                  {sv.days.map((d, i) => (
                    <span key={i} style={{ flex: 1, height: 26, borderRadius: 2, background: d.color }} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 12 }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>30 DAYS</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{sv.uptime}</span>
                </div>
                <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "#8C8578", marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(21,20,15,.08)" }}>{sv.note}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 24px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "130px 90px minmax(0,1fr) 110px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>WHEN</span><span>SEVERITY</span><span>INCIDENT</span><span style={{ textAlign: "right" }}>DURATION</span>
            </div>
            {INCIDENTS.map((i) => (
              <div key={i.when} style={{ display: "grid", gridTemplateColumns: "130px 90px minmax(0,1fr) 110px", gap: 20, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{i.when}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".12em", color: i.sevFg }}>{i.sev}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{i.what}</span>
                <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: "#5C574B" }}>{i.dur}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
