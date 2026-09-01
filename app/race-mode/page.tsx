"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  ACTION_BG, ACTION_BORDER, ACTION_COLOR, CACHED, CONSTRAINTS, NAV_BTNS, NEVERS,
  PHASES, PRINCIPLES, STATUS_COLOR,
} from "@/lib/raceMode";

function RaceModePage() {
  const [phase, setPhase] = useState(2);
  const p = PHASES[phase];
  const statusFg = STATUS_COLOR[p.statusState];
  const actionFg = ACTION_COLOR[p.actionState];
  const actionBg = ACTION_BG[p.actionState];
  const actionBorder = ACTION_BORDER[p.actionState];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, padding: "44px 0 80px" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 56px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={26} height={17} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192", marginLeft: 6 }}>RACE MODE · OFFLINE BY DESIGN</span>
            </div>
            <Reveal as="h1" style={{ margin: "20px 0 0", fontSize: 52, lineHeight: 1, fontWeight: 600, letterSpacing: "-.048em" }}>One number at a time.</Reveal>
            <Reveal as="p" delay={0.05} style={{ margin: "13px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Race Mode runs on the phone in your bento box, in bright sun, with wet hands, on no signal. Every decision is pre-made — it only tells you the next one.</Reveal>
          </div>
          <div style={{ display: "flex", gap: 10, flex: "none" }}>
            <Link href={routes.racePlan} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 17px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Back to plan</Link>
            <Link href={routes.dashboard} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 17px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Dashboard</Link>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "404px minmax(0,1fr)", gap: 32, alignItems: "start" }}>

          <div style={{ position: "sticky", top: 44 }}>
            <div style={{ background: "#15140F", borderRadius: 44, padding: 11, boxShadow: "0 40px 90px -40px rgba(21,20,15,.6)" }}>
              <div style={{ position: "relative", background: "#0B0A09", borderRadius: 34, overflow: "hidden", height: 772, display: "flex", flexDirection: "column" }}>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px 10px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "rgba(251,248,242,.75)", flex: "none" }}>
                  <span>{p.clock}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9, letterSpacing: ".1em", color: "rgba(251,248,242,.4)" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(251,248,242,.4)" }} />NO SIGNAL
                    </span>
                    <span>{p.battery}</span>
                  </div>
                </div>

                <div style={{ padding: "8px 22px 0", flex: "none" }}>
                  <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(251,248,242,.07)", borderRadius: 8 }}>
                    {PHASES.map((x, k) => (
                      <div key={x.key} onClick={() => setPhase(k)} style={{ flex: x.flex, display: "flex", alignItems: "center", justifyContent: "center", height: 32, borderRadius: 6, cursor: "pointer", background: k === phase ? "#E4622F" : "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".11em", color: k === phase ? "#fff" : "rgba(251,248,242,.42)", whiteSpace: "nowrap" }}>{x.name}</div>
                    ))}
                  </div>
                </div>

                <div style={{ flex: 1, overflow: "hidden", padding: "26px 26px 0", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".17em", color: "rgba(251,248,242,.4)" }}>{p.label}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".13em", color: statusFg }}>
                      <span className="om-breathe" style={{ width: 5, height: 5, borderRadius: "50%", background: statusFg }} />{p.status}
                    </span>
                  </div>

                  <div style={{ marginTop: 22 }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(251,248,242,.35)" }}>{p.bigLabel}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 96, lineHeight: 0.82, letterSpacing: "-.06em", color: "#FBF8F2" }}>{p.bigValue}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, color: "rgba(251,248,242,.42)" }}>{p.bigUnit}</span>
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.4, color: "rgba(251,248,242,.6)", marginTop: 14 }}>{p.bigNote}</div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(251,248,242,.1)", borderRadius: 10, overflow: "hidden", marginTop: 24 }}>
                    {p.tiles.map((t) => (
                      <div key={t.k} style={{ background: "#0B0A09", padding: "16px 17px 15px" }}>
                        <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "rgba(251,248,242,.35)" }}>{t.k}</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 9 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, letterSpacing: "-.035em", color: t.v.startsWith("+") ? "#7CC08F" : "#FBF8F2" }}>{t.v}</span>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(251,248,242,.32)" }}>{t.u}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 10, background: actionBg, border: `1px solid ${actionBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: actionFg, flex: "none" }} />
                      <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: actionFg }}>{p.actionTag}</span>
                    </div>
                    <div style={{ fontSize: 18, lineHeight: 1.32, fontWeight: 500, letterSpacing: "-.024em", color: "#FBF8F2", marginTop: 11 }}>{p.actionText}</div>
                  </div>

                  <div style={{ marginTop: "auto", padding: "18px 0 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".13em", color: "rgba(251,248,242,.3)" }}>
                      <span>{p.progLabel}</span><span>{p.progRight}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(251,248,242,.1)", marginTop: 10, position: "relative", overflow: "hidden" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: p.progW, background: statusFg, borderRadius: 2, transition: "width .5s cubic-bezier(.16,1,.3,1)" }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(251,248,242,.1)", flex: "none" }}>
                  {NAV_BTNS.map((n, k) => (
                    <div key={n} style={{ background: "#0B0A09", padding: "16px 0 22px", textAlign: "center", cursor: "pointer" }}>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: k === 0 ? "#FBF8F2" : "rgba(251,248,242,.4)" }}>{n}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 16 }}>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>SCRUB THE RACE</span>
              <div style={{ display: "flex", gap: 4 }}>
                {PHASES.map((x, k) => (
                  <span key={x.key} onClick={() => setPhase(k)} className="mono" style={{ fontSize: 8.5, letterSpacing: ".1em", padding: "5px 9px", borderRadius: 4, cursor: "pointer", background: k === phase ? "#15140F" : "rgba(21,20,15,.06)", color: k === phase ? "#FBF8F2" : "#8C8578", whiteSpace: "nowrap" }}>{x.name}</span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {PRINCIPLES.map((pr, i) => (
                <Reveal key={pr.n} delay={i * 0.06} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#E4622F" }}>{pr.n}</div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", marginTop: 14 }}>{pr.name}</div>
                  <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>{pr.desc}</p>
                </Reveal>
              ))}
            </div>

            <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>DESIGN CONSTRAINTS WE BUILT AGAINST</div>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.033em", marginTop: 11 }}>The phone is the worst screen you own on race day.</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 40px", marginTop: 22 }}>
                {CONSTRAINTS.map((c) => (
                  <div key={c.k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 18, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192" }}>{c.k}</span>
                    <span style={{ fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>{c.v}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14 }}>
              <Reveal style={{ background: "#15140F", borderRadius: 12, padding: "26px 28px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>OFFLINE GUARANTEE</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.028em", color: "#FBF8F2", marginTop: 13 }}>Everything is on the device before you start.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 20 }}>
                  {CACHED.map((c) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flex: "none" }}><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#7CC08F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontSize: 13.5, color: "rgba(251,248,242,.72)" }}>{c.name}</span>
                      <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(251,248,242,.35)" }}>{c.size}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(251,248,242,.1)", fontSize: 13, lineHeight: 1.5, color: "rgba(251,248,242,.5)" }}>Cached at bike check-in on Saturday. No request is made on race day, so a dead cell tower changes nothing.</div>
              </Reveal>

              <Reveal delay={0.06} style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WHAT RACE MODE WILL NOT DO</div>
                <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                  {NEVERS.map((n) => (
                    <div key={n.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#C0392B", flex: "none", marginTop: 1 }}>×</span>
                      <span>
                        <span style={{ display: "block", fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{n.name}</span>
                        <span style={{ display: "block", fontSize: 13, lineHeight: 1.45, color: "#8C8578", marginTop: 4 }}>{n.why}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedRaceModePage() {
  return (
    <GuardedPage>
      <RaceModePage />
    </GuardedPage>
  );
}
