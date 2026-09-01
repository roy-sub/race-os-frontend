"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  ACTIONS, CALIBRATION, CONFIDENCE, SEASONS, SEASON_STATS,
  accuracyBars, carbChart, compareRows, historyRows, runChart,
} from "@/lib/postRace";

function PostRacePage() {
  const [view, setView] = useState<"race" | "season">("race");
  const [season, setSeason] = useState<(typeof SEASONS)[number]>("2025");
  const [hover, setHover] = useState(5);

  const compare = compareRows();
  const { plannedPath, actualPath, decoupleX, decoupleW, decoupleLabelX, runTicks } = runChart();
  const { carbPlanPath, carbActualPath, carbActualArea } = carbChart();
  const history = historyRows();
  const bars = accuracyBars();

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
            <Link href={routes.postRace} style={{ color: "#15140F" }}>Review</Link>
            <Link href={routes.courseRecon} style={{ color: "#5C574B" }}>Course recon</Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
              {([{ k: "race", n: "This race" }, { k: "season", n: "Season history" }] as const).map((v) => (
                <span key={v.k} onClick={() => setView(v.k)} style={{ padding: "8px 14px", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: view === v.k ? 600 : 500, letterSpacing: "-.012em", background: view === v.k ? "#FBF8F2" : "transparent", color: view === v.k ? "#15140F" : "#8C8578", whiteSpace: "nowrap" }}>{v.n}</span>
              ))}
            </div>
            <MediaPlaceholder path="assets/account/elena.jpg" background="#D8D0C2" style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }} />
          </div>
        </div>
      </header>

      {view === "race" ? (
        <div>
          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 56, alignItems: "end" }}>
              <div>
                <Reveal style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: "1px solid rgba(124,192,143,.5)", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: ".14em", color: "#3E7B55" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />FINISHED
                  </span>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>FIT FILE UPLOADED · PLAN v4 · 214TH OF 1,842</span>
                </Reveal>
                <Reveal as="h1" delay={0.05} style={{ whiteSpace: "nowrap", margin: 0, fontSize: 66, lineHeight: 0.92, fontWeight: 600, letterSpacing: "-.05em" }}>Ötztaler Classic</Reveal>
                <Reveal delay={0.1} style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 15.5, color: "#5C574B", whiteSpace: "nowrap" }}>
                  <span>14 September 2025</span><span style={{ color: "#C4BCAC" }}>·</span><span>Sölden, Austria</span><span style={{ color: "#C4BCAC" }}>·</span><span>Full distance</span>
                </Reveal>
              </div>
              <Reveal delay={0.14} style={{ display: "flex", gap: 34 }}>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A8A192" }}>PLANNED</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 34, letterSpacing: "-.04em", color: "#A8A192", marginTop: 8 }}>11:50</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A8A192" }}>ACTUAL</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 54, lineHeight: 0.86, letterSpacing: "-.05em", marginTop: 6 }}>12:04</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#A0701A", marginTop: 6 }}>+14:31 OVER</div>
                </div>
              </Reveal>
            </div>

            <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "30px 34px", marginTop: 34, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C98A1F" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A0701A" }}>THE HONEST VERDICT</span>
              </div>
              <p style={{ margin: "15px 0 0", maxWidth: 820, fontSize: 31, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.036em" }}>You lost fourteen minutes on the run, and the plan was wrong about why you would.</p>
              <p style={{ margin: "13px 0 0", maxWidth: 700, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>Swim and bike came in within a minute of target. The run decoupled at km 26 — earlier than a heat-only model predicts — and your intake had fallen to 41 g/hr by then. That is a fuelling failure the plan should have caught, not a fitness one.</p>
            </Reveal>
          </div>

          <div style={{ padding: "66px 0 72px", marginTop: 56, background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 28 }}>
                <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Plan against actual.</Reveal>
                <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>HOVER ANY SEGMENT</Reveal>
              </div>

              <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
                <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "8px 32px 26px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr .9fr .9fr 1.2fr 96px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                    <span>SEGMENT</span><span>PLANNED</span><span>ACTUAL</span><span>DELTA</span><span>WHAT HAPPENED</span><span style={{ textAlign: "right" }}>DRIFT</span>
                  </div>
                  {compare.map((c, i) => (
                    <div key={c.name} onMouseEnter={() => setHover(i)} style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr .9fr .9fr 1.2fr 96px", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center", background: hover === i ? "rgba(21,20,15,.03)" : "transparent" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flex: "none" }} />
                        <span style={{ fontSize: 15, fontWeight: c.weight, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>{c.name}</span>
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#A8A192" }}>{c.planned}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>{c.actual}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: c.deltaFg }}>{c.delta}</span>
                      <span style={{ fontSize: 13.5, color: "#5C574B" }}>{c.why}</span>
                      <span style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 44, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: c.driftW, background: c.deltaFg, borderRadius: 2 }} />
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
                <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>RUN PACE · PLANNED VS ACTUAL</span>
                    <div style={{ display: "flex", gap: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 2, background: "#C4BCAC" }} />PLANNED</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 2, background: "#E4622F" }} />ACTUAL</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 760 210" style={{ display: "block", width: "100%", marginTop: 18 }}>
                    <rect x={decoupleX} y="6" width={decoupleW} height="168" fill="rgba(192,57,43,.06)" />
                    <path d={plannedPath} fill="none" stroke="#C4BCAC" strokeWidth={1.7} strokeDasharray="5 4" />
                    <path d={actualPath} fill="none" stroke="#E4622F" strokeWidth={2} strokeLinejoin="round" />
                    <line x1={decoupleX} y1="6" x2={decoupleX} y2="174" stroke="rgba(192,57,43,.5)" strokeWidth={1.2} />
                    <text x={decoupleLabelX} y="26" fill="#C0392B" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.2">DECOUPLED · KM 26</text>
                    <line x1="0" y1="174" x2="760" y2="174" stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                    {runTicks.map((t) => (
                      <text key={t.km} x={t.x} y="196" textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize="9.5">{t.km}</text>
                    ))}
                  </svg>
                </Reveal>
                <Reveal delay={0.07} style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CARBOHYDRATE · PLANNED VS TAKEN</div>
                  <svg viewBox="0 0 380 172" style={{ display: "block", width: "100%", marginTop: 18 }}>
                    <path d={carbPlanPath} fill="none" stroke="#C4BCAC" strokeWidth={1.7} strokeDasharray="5 4" />
                    <path d={carbActualArea} fill="rgba(228,98,47,.13)" />
                    <path d={carbActualPath} fill="none" stroke="#E4622F" strokeWidth={2} strokeLinejoin="round" />
                    <line x1="0" y1="146" x2="380" y2="146" stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                  </svg>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>PLANNED TOTAL</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, marginTop: 6, color: "#A8A192" }}>852 g</div></div>
                    <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>ACTUALLY TAKEN</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, marginTop: 6, color: "#C0392B" }}>611 g</div></div>
                  </div>
                  <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 8, background: "rgba(192,57,43,.07)", fontSize: 13, lineHeight: 1.5, color: "#3D3A31" }}>241 g short. Almost all of it lost on the bike between km 90 and T2.</div>
                </Reveal>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, marginBottom: 28 }}>
              <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Your constraints, recalibrated.</Reveal>
              <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>APPLIES TO EVERY FUTURE PLAN</Reveal>
            </div>
            <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 32px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr .9fr 1.6fr 130px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                <span>CONSTRAINT</span><span>WAS</span><span>NOW</span><span>EVIDENCE</span><span style={{ textAlign: "right" }}>SOURCE</span>
              </div>
              {CALIBRATION.map((c) => (
                <div key={c.name} style={{ display: "grid", gridTemplateColumns: "1.4fr .9fr .9fr 1.6fr 130px", gap: 20, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{c.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#A8A192", textDecoration: "line-through" }}>{c.was}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: c.nowFg }}>{c.now}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "#5C574B" }}>{c.evidence}</span>
                  <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, background: "rgba(124,192,143,.16)", color: "#3E7B55", whiteSpace: "nowrap" }}>MEASURED</span></span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(124,192,143,.1)", border: "1px solid rgba(124,192,143,.36)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5C9E72", flex: "none" }} />
                <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>Four values moved from estimated to measured. Your next plan will be solved against the athlete you actually are.</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Apply to my profile</span>
              </div>
            </Reveal>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, margin: "66px 0 28px" }}>
              <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Three things to change.</Reveal>
              <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>RANKED BY MINUTES RECOVERABLE</Reveal>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {ACTIONS.map((a) => (
                <Reveal key={a.n} style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)", transitionDelay: a.delay }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#E4622F" }}>{a.n}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, letterSpacing: "-.03em", color: "#3E7B55" }}>{a.gain}</span>
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.027em", marginTop: 16 }}>{a.name}</div>
                  <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.55, color: "#5C574B" }}>{a.desc}</p>
                  <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>HOW TO PRACTISE IT</div>
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6B6455", marginTop: 8 }}>{a.how}</div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 56, padding: "28px 32px", background: "#15140F", borderRadius: 12, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>NEXT RACE</div>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", color: "#FBF8F2", marginTop: 11 }}>Solve Tramuntana Full with these numbers instead.</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(251,248,242,.55)", marginTop: 8 }}>Your recalibrated gut ceiling alone moves the projected finish by nine minutes.</div>
              </div>
              <Link href={routes.planBuilder} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15.5, fontWeight: 600, flex: "none" }}>Re-solve my next plan</Link>
            </Reveal>
          </div>
          <div style={{ height: 88 }} />
        </div>
      ) : (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <Reveal as="h1" style={{ margin: 0, fontSize: 60, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Season history</Reveal>
              <Reveal delay={0.05} as="p" style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Four seasons, eleven finishes. The line that matters is not your finish time — it is how close each plan got.</Reveal>
            </div>
            <Reveal delay={0.1} style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
              {SEASONS.map((y) => (
                <span key={y} onClick={() => setSeason(y)} className="mono" style={{ padding: "9px 15px", borderRadius: 5, cursor: "pointer", fontSize: 11, letterSpacing: ".1em", background: season === y ? "#15140F" : "transparent", color: season === y ? "#FBF8F2" : "#8C8578" }}>{y}</span>
              ))}
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 34 }}>
            {SEASON_STATS.map((s) => (
              <Reveal key={s.k} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)", transitionDelay: s.delay }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{s.k}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 14 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 34, letterSpacing: "-.042em" }}>{s.v}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#8C8578" }}>{s.u}</span>
                </div>
                <div style={{ fontSize: 13, color: "#8C8578", marginTop: 9 }}>{s.note}</div>
              </Reveal>
            ))}
          </div>

          <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 32px 24px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>PLAN ACCURACY OVER TIME · DELTA BETWEEN PLANNED AND ACTUAL</span>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>CLOSER TO ZERO IS BETTER</span>
            </div>
            <svg viewBox="0 0 1180 220" style={{ display: "block", width: "100%", marginTop: 20 }}>
              <line x1="0" y1="110" x2="1180" y2="110" stroke="rgba(21,20,15,.18)" strokeWidth={1.2} />
              <text x="6" y="104" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize="9.5" letterSpacing="1">ON PLAN</text>
              {bars.map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={b.y} width="46" height={b.h} rx="3" fill={b.fill} />
                  <text x={b.cx} y={b.labelY} textAnchor="middle" fill={b.labelFill} fontFamily="JetBrains Mono, monospace" fontSize="10">{b.delta}</text>
                  <text x={b.cx} y="212" textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize="9">{b.race}</text>
                </g>
              ))}
            </svg>
          </Reveal>

          <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 32px 26px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .7fr .8fr .8fr .8fr 1fr", gap: 18, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>RACE</span><span>DATE</span><span>DIST</span><span>PLANNED</span><span>ACTUAL</span><span>DELTA</span><span style={{ textAlign: "right" }}>LIMITER</span>
            </div>
            {history.map((h) => (
              <div key={h.name} className="row-hover-faint" style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .7fr .8fr .8fr .8fr 1fr", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: h.dot, flex: "none" }} />
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>{h.name}</span>
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{h.date}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{h.dist}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#A8A192" }}>{h.planned}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>{h.actual}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: h.deltaFg }}>{h.delta}</span>
                <span style={{ textAlign: "right", fontSize: 13, color: "#5C574B" }}>{h.limiter}</span>
              </div>
            ))}
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
            <Reveal style={{ background: "#15140F", borderRadius: 12, padding: "28px 30px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>THE PATTERN</div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.032em", color: "#FBF8F2", marginTop: 13 }}>Fuelling has limited you in four of your last five races.</div>
              <p style={{ margin: "11px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>Not fitness, not pacing discipline, not heat. In every case your intake fell below plan on the back half of the bike, and the run paid for it. This is the single most improvable thing in your racing.</p>
            </Reveal>
            <Reveal delay={0.07} style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CONSTRAINT CONFIDENCE</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 18 }}>
                {CONFIDENCE.map((c) => (
                  <div key={c.name}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14.5 }}>{c.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: c.fg }}>{c.label}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", marginTop: 9, position: "relative", overflow: "hidden" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: c.w, background: c.fg, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)", fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>Every finish you upload moves a value from estimated toward measured. Nothing here was typed in by you.</div>
            </Reveal>
          </div>
        </div>
      )}
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedPostRacePage() {
  return (
    <GuardedPage>
      <PostRacePage />
    </GuardedPage>
  );
}
