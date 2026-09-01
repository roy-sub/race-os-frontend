"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  BILLING_STATS, CONF_FG, CONNECTIONS, CONSTRAINTS, INVOICES, NOTIFS, PROFILE_FIELDS,
  SENSITIVITY, SRC_STYLE, TABS, type ConnectionKey, type Tab,
} from "@/lib/settings";

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(true);
  const [unit, setUnit] = useState("Metric");
  const [verbosity, setVerbosity] = useState("Standard");
  const [sens, setSens] = useState("Balanced");
  const [conn, setConn] = useState<Record<ConnectionKey, boolean>>({ Garmin: true, Strava: true, Wahoo: false, TrainingPeaks: false });
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function markDirty() {
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(true), 1100);
  }

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
            <Link href={routes.postRace} style={{ color: "#5C574B" }}>Review</Link>
            <Link href={routes.settings} style={{ color: "#15140F" }}>Settings</Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: saved ? "#8C8578" : "#C6461B", whiteSpace: "nowrap" }}>{saved ? "ALL CHANGES SAVED" : "SAVING…"}</span>
            <MediaPlaceholder path="assets/account/elena.jpg" background="#D8D0C2" style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }} />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Settings</h1>

        <div style={{ display: "grid", gridTemplateColumns: "246px minmax(0,1fr)", gap: 40, marginTop: 34, alignItems: "start" }}>

          <div style={{ position: "sticky", top: 112, display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((t) => (
              <div key={t.k} onClick={() => setTab(t.k)} className="row-hover-faint" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 8, cursor: "pointer", background: tab === t.k ? "#FBF8F2" : "transparent" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: tab === t.k ? "#E4622F" : "transparent", flex: "none" }} />
                <span style={{ fontSize: 15, fontWeight: tab === t.k ? 600 : 500, letterSpacing: "-.018em", color: tab === t.k ? "#15140F" : "#5C574B", whiteSpace: "nowrap" }}>{t.name}</span>
                {t.badge && <span className="mono" style={{ marginLeft: "auto", fontSize: 8, letterSpacing: ".11em", padding: "2px 6px", borderRadius: 3, background: "rgba(228,98,47,.16)", color: "#C6461B", whiteSpace: "nowrap" }}>{t.badgeText}</span>}
              </div>
            ))}
            <div style={{ marginTop: 22, padding: "18px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>PLAN</div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.022em", marginTop: 9 }}>Season Pass</div>
              <div className="mono" style={{ fontSize: 10, color: "#8C8578", marginTop: 6 }}>RENEWS 04 MAR 2027</div>
            </div>
          </div>

          <div>
            {tab === "profile" && (
              <div className="om-rise">
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Profile</div>
                <p style={{ margin: "11px 0 0", maxWidth: 560, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>Who you are, and how the solver talks to you.</p>

                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", marginTop: 26, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 24, borderBottom: "1px solid rgba(21,20,15,.08)" }}>
                    <MediaPlaceholder path="assets/account/elena.jpg" background="#D8D0C2" style={{ width: 66, height: 66, borderRadius: "50%", flex: "none" }} />
                    <div>
                      <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.026em" }}>Elena Marsh</div>
                      <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 5 }}>elena.marsh@gmail.com · joined March 2024</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Change photo</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "22px 26px", marginTop: 24 }}>
                    {PROFILE_FIELDS.map((f) => (
                      <div key={f.label}>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{f.label}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, marginTop: 10, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                          <input type="text" defaultValue={f.value} onChange={markDirty} style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontSize: 15, color: "#15140F", padding: 0 }} />
                          {f.hasSuffix && <span className="mono" style={{ fontSize: 10, color: "#A8A192", whiteSpace: "nowrap" }}>{f.suffix}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 14 }}>
                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>UNITS</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      {["Metric", "Imperial"].map((u) => (
                        <div key={u} onClick={() => { setUnit(u); markDirty(); }} className="seg-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 7, cursor: "pointer", background: unit === u ? "#15140F" : "#fff", border: `1px solid ${unit === u ? "#15140F" : "rgba(21,20,15,.14)"}`, fontSize: 14, fontWeight: unit === u ? 600 : 500, color: unit === u ? "#FBF8F2" : "#5C574B" }}>{u}</div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>EXPLANATION LEVEL</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      {["Minimal", "Standard", "Full"].map((v) => (
                        <div key={v} onClick={() => { setVerbosity(v); markDirty(); }} className="seg-btn" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 7, cursor: "pointer", background: verbosity === v ? "#15140F" : "#fff", border: `1px solid ${verbosity === v ? "#15140F" : "rgba(21,20,15,.14)"}`, fontSize: 13.5, fontWeight: verbosity === v ? 600 : 500, color: verbosity === v ? "#FBF8F2" : "#5C574B", whiteSpace: "nowrap" }}>{v}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "constraints" && (
              <div className="om-rise">
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Constraints</div>
                <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>The numbers every plan is solved against. Measured values come from races you have uploaded — you can override any of them, and the override is marked.</p>

                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 26px", marginTop: 26, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1.5fr 132px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                    <span>CONSTRAINT</span><span>VALUE</span><span>CONFIDENCE</span><span style={{ textAlign: "right" }}>SOURCE</span>
                  </div>
                  {CONSTRAINTS.map((c) => (
                    <div key={c.name} style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1.5fr 132px", gap: 20, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flex: "none" }} />
                        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{c.name}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", height: 38, padding: "0 12px", border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, background: "#fff" }}>
                        <input type="text" defaultValue={c.value} onChange={markDirty} style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#15140F", padding: 0 }} />
                        <span className="mono" style={{ fontSize: 10, color: "#A8A192", whiteSpace: "nowrap" }}>{c.unit}</span>
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <span style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: c.w, background: CONF_FG[c.state], borderRadius: 2 }} />
                        </span>
                        <span className="mono" style={{ fontSize: 9, letterSpacing: ".11em", color: CONF_FG[c.state], whiteSpace: "nowrap" }}>{c.conf}</span>
                      </span>
                      <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, background: SRC_STYLE[c.state].bg, color: SRC_STYLE[c.state].fg, whiteSpace: "nowrap" }}>{SRC_STYLE[c.state].label}</span></span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(228,98,47,.07)", border: "1px solid rgba(228,98,47,.28)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E4622F", flex: "none" }} />
                    <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>Changing a constraint does not change plans you have already solved. Each affected plan will offer a re-solve.</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "connections" && (
              <div className="om-rise">
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Connections</div>
                <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>No feature is gated behind a connection. These only save you typing.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
                  {CONNECTIONS.map((c) => {
                    const on = conn[c.key];
                    return (
                      <div key={c.key} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "44px minmax(0,1fr) 200px auto", gap: 20, alignItems: "center" }}>
                          <span style={{ width: 40, height: 40, borderRadius: 9, background: c.tone, flex: "none" }} />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em" }}>{c.name}</span>
                              {on && <span className="mono" style={{ fontSize: 8, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3, background: "rgba(124,192,143,.18)", color: "#3E7B55", whiteSpace: "nowrap" }}>CONNECTED</span>}
                            </div>
                            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#8C8578", marginTop: 6 }}>{c.desc}</div>
                          </div>
                          <div>
                            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{c.metaLabel}</div>
                            <div className="mono" style={{ fontSize: 12.5, color: "#5C574B", marginTop: 6 }}>{c.meta}</div>
                          </div>
                          <span
                            onClick={() => { setConn((p) => ({ ...p, [c.key]: !on })); markDirty(); }}
                            className="opacity-btn"
                            style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 17px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, fontWeight: 600, background: on ? "transparent" : "#15140F", border: `1px solid ${on ? "rgba(21,20,15,.18)" : "#15140F"}`, color: on ? "#15140F" : "#F1EEE8", flex: "none" }}
                          >{on ? "Disconnect" : "Connect"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: "#15140F", borderRadius: 12, padding: "26px 30px", marginTop: 14, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>WHAT WE READ</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 12 }}>Threshold values and race files. Nothing else.</div>
                  <p style={{ margin: "10px 0 0", maxWidth: 620, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>We do not read your training history, your routes, your followers or your private activities. When you disconnect, the derived values stay and the connection is deleted the same day.</p>
                </div>
              </div>
            )}

            {tab === "notifs" && (
              <div className="om-rise">
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Notifications</div>
                <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>We send few things, and everything we send is actionable. Nothing here is marketing.</p>

                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 20px", marginTop: 26, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px 92px 92px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                    <span>EVENT</span><span style={{ textAlign: "center" }}>EMAIL</span><span style={{ textAlign: "center" }}>PUSH</span><span style={{ textAlign: "center" }}>IN-APP</span>
                  </div>
                  {NOTIFS.map((n) => (
                    <div key={n.k} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px 92px 92px", gap: 20, padding: "17px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{n.name}</span>
                          {n.critical && <span className="mono" style={{ fontSize: 8, letterSpacing: ".11em", padding: "2px 6px", borderRadius: 3, background: "rgba(228,98,47,.16)", color: "#C6461B", whiteSpace: "nowrap" }}>ALWAYS ON</span>}
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.45, color: "#8C8578", marginTop: 5 }}>{n.desc}</div>
                      </div>
                      {n.def.map((d, ci) => {
                        const key = `${n.k}:${ci}`;
                        const on = notifs[key] === undefined ? d : notifs[key];
                        const locked = n.critical && ci === 0;
                        return (
                          <span
                            key={key}
                            onClick={() => { if (locked) return; setNotifs((p) => ({ ...p, [key]: !on })); markDirty(); }}
                            style={{ justifySelf: "center", display: "flex", alignItems: "center", width: 40, height: 24, borderRadius: 12, cursor: locked ? "not-allowed" : "pointer", background: on ? "#E4622F" : "rgba(21,20,15,.16)", padding: 3, justifyContent: on ? "flex-end" : "flex-start", opacity: locked ? 0.55 : 1 }}
                          >
                            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 14 }}>
                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>QUIET HOURS</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff" }}>
                        <span className="mono" style={{ fontSize: 15 }}>21:30</span>
                      </div>
                      <span className="mono" style={{ fontSize: 12, color: "#A8A192" }}>TO</span>
                      <div style={{ display: "flex", alignItems: "center", height: 44, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff" }}>
                        <span className="mono" style={{ fontSize: 15 }}>06:00</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "#8C8578", marginTop: 14 }}>Race week reminders ignore quiet hours on the two days before a race.</div>
                  </div>
                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>DRIFT SENSITIVITY</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                      {SENSITIVITY.map((sv) => (
                        <div key={sv.k} onClick={() => { setSens(sv.k); markDirty(); }} className="seg-btn" style={{ flex: 1, padding: "12px 13px", borderRadius: 7, cursor: "pointer", background: sens === sv.k ? "#15140F" : "#fff", border: `1px solid ${sens === sv.k ? "#15140F" : "rgba(21,20,15,.14)"}` }}>
                          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.018em", color: sens === sv.k ? "#FBF8F2" : "#15140F" }}>{sv.k}</div>
                          <div style={{ fontSize: 11.5, lineHeight: 1.35, color: sens === sv.k ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 5 }}>{sv.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "billing" && (
              <div className="om-rise">
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Billing</div>
                <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>Cancel any time. Every plan you have already solved stays yours at full function.</p>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, marginTop: 26 }}>
                  <div style={{ background: "#15140F", borderRadius: 12, padding: "28px 30px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>CURRENT PLAN</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".13em", color: "#7CC08F" }}>
                        <span className="om-breathe" style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />ACTIVE
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 16 }}>
                      <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.038em", color: "#FBF8F2" }}>Season Pass</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, color: "rgba(251,248,242,.5)" }}>$59/yr</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(251,248,242,.1)", borderRadius: 9, overflow: "hidden", marginTop: 24 }}>
                      {BILLING_STATS.map((b) => (
                        <div key={b.k} style={{ background: "#15140F", padding: "16px 18px" }}>
                          <div className="mono" style={{ fontSize: 8, letterSpacing: ".13em", color: "rgba(251,248,242,.35)" }}>{b.k}</div>
                          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 9 }}>{b.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                      <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Update card</span>
                      <span className="btn-outline-fade" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(251,248,242,.24)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, color: "#FBF8F2", cursor: "pointer" }}>Cancel renewal</span>
                    </div>
                  </div>
                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>PAYMENT METHOD</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, padding: "16px 18px", borderRadius: 9, background: "rgba(21,20,15,.04)" }}>
                      <svg width="30" height="19" viewBox="0 0 28 18" fill="none" style={{ flex: "none" }}><rect x="0.7" y="0.7" width="26.6" height="16.6" rx="2.6" stroke="rgba(21,20,15,.22)" strokeWidth={1.4} /><rect x="1.4" y="4.6" width="25.2" height="3" fill="rgba(21,20,15,.16)" /></svg>
                      <div>
                        <div className="mono" style={{ fontSize: 14 }}>VISA ···· 4242</div>
                        <div className="mono" style={{ fontSize: 10, color: "#8C8578", marginTop: 4 }}>EXPIRES 09/28</div>
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 24 }}>BILLING EMAIL</div>
                    <div style={{ display: "flex", alignItems: "center", height: 44, marginTop: 10, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff" }}>
                      <span style={{ fontSize: 14.5 }}>elena.marsh@gmail.com</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 22px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 110px 92px 100px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                    <span>DATE</span><span>DESCRIPTION</span><span>INVOICE</span><span style={{ textAlign: "right" }}>AMOUNT</span><span style={{ textAlign: "right" }} />
                  </div>
                  {INVOICES.map((v) => (
                    <div key={v.no} className="row-hover-faint" style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 110px 92px 100px", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{v.date}</span>
                      <span style={{ fontSize: 14.5 }}>{v.desc}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: "#8C8578" }}>{v.no}</span>
                      <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>{v.amount}</span>
                      <span className="mono link-accent" style={{ textAlign: "right", fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer" }}>DOWNLOAD</span>
                    </div>
                  ))}
                </div>

                <div style={{ border: "1px solid rgba(192,57,43,.3)", background: "rgba(192,57,43,.05)", borderRadius: 12, padding: "24px 28px", marginTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A03227" }}>DANGER ZONE</div>
                      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em", marginTop: 11 }}>Delete account and all data</div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#5C574B", marginTop: 7 }}>Immediate and irreversible. Export your plans first — we cannot recover them afterwards.</div>
                    </div>
                    <span className="btn-danger" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(192,57,43,.4)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, color: "#A03227", cursor: "pointer", flex: "none" }}>Delete account</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedSettingsPage() {
  return (
    <GuardedPage>
      <SettingsPage />
    </GuardedPage>
  );
}
