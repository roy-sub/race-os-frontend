"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import {
  EMPTY_STATES, ERROR_FACTS, ERROR_ROWS, NOT_FOUND_LINKS, OFFLINE_WAITS, OFFLINE_WORKS,
  SHIMMER, strayCourse,
} from "@/lib/systemStates";

type Tab = "404" | "500" | "offline" | "loading" | "empty" | "errors";
const TABS: { k: Tab; n: string }[] = [
  { k: "404", n: "404" }, { k: "500", n: "500" }, { k: "offline", n: "Offline" },
  { k: "loading", n: "Loading" }, { k: "empty", n: "Empty" }, { k: "errors", n: "Errors" },
];

export default function SystemStatesPage() {
  const [tab, setTab] = useState<Tab>("404");
  const [retrying, setRetrying] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { coursePath, strayPath, strayX, strayY } = strayCourse();

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function retry() {
    if (retrying) return;
    setRetrying(true);
    timer.current = setTimeout(() => setRetrying(false), 1600);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 70, background: "#15140F" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={25} height={17} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em", color: "#FBF8F2" }}>RaceOS</span>
            </Link>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", padding: "4px 8px", borderRadius: 4, background: "rgba(251,248,242,.14)", color: "#FBF8F2", whiteSpace: "nowrap" }}>SYSTEM STATES</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((t) => {
              const active = tab === t.k;
              return (
                <div key={t.k} onClick={() => setTab(t.k)} style={{ position: "relative", display: "flex", alignItems: "center", height: 60, padding: "0 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#FBF8F2" : "rgba(251,248,242,.5)" }}>{t.n}</span>
                  <span style={{ position: "absolute", left: 9, right: 9, bottom: 0, height: 2, background: active ? "#E4622F" : "transparent" }} />
                </div>
              );
            })}
          </div>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "rgba(251,248,242,.4)", whiteSpace: "nowrap" }}>EVERY FAILURE STATE OFFERS A WAY OUT</span>
        </div>
      </div>

      {tab === "404" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", minHeight: "calc(100vh - 60px)" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "72px 88px" }}>
            <div className="om-rise">
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A8A192" }}>404 · PAGE NOT FOUND</div>
              <h1 style={{ margin: "22px 0 0", fontSize: 72, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>You have gone off course.</h1>
              <p style={{ margin: "20px 0 0", maxWidth: 480, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>This page does not exist. Either the link is old, or a course was renamed between seasons — both happen more than we would like.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 34, maxWidth: 440 }}>
                {NOT_FOUND_LINKS.map((l) => (
                  <Link key={l.k} href={l.href} className="next-step-card" style={{ display: "flex", alignItems: "center", gap: 15, padding: "18px 20px", borderRadius: 10, background: "#FBF8F2", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192", width: 52, flex: "none" }}>{l.k}</span>
                    <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{l.name}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#E4622F" }}>→</span>
                  </Link>
                ))}
              </div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 26 }}>REQUEST ID req_8f21ac04 · REPORTED AUTOMATICALLY</div>
            </div>
          </div>
          <div style={{ position: "relative", background: "#1C1916", overflow: "hidden" }}>
            <MediaPlaceholder path="assets/system/lost-road.jpg" background="linear-gradient(155deg,#3E352B 0%,#231E19 50%,#12100E 100%)" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(12,11,10,.72),rgba(12,11,10,.2))" }} />
            <svg viewBox="0 0 600 700" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <path d={strayPath} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={1.6} strokeDasharray="6 6" />
              <path d={coursePath} fill="none" stroke="rgba(228,98,47,.65)" strokeWidth={2.2} />
              <circle cx={strayX} cy={strayY} r="7" fill="#E4622F" stroke="#12100E" strokeWidth={3} />
            </svg>
            <div className="mono" style={{ position: "absolute", left: 32, bottom: 28, fontSize: 9, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>ASSETS/SYSTEM/LOST-ROAD.JPG · 4:5</div>
          </div>
        </div>
      )}

      {tab === "500" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 96px" }}>
          <div className="om-rise" style={{ maxWidth: 820 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="om-breathe" style={{ width: 7, height: 7, borderRadius: "50%", background: "#C0392B" }} />
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A03227" }}>500 · SOMETHING BROKE ON OUR SIDE</span>
            </div>
            <h1 style={{ margin: "22px 0 0", fontSize: 66, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>That was us, not you.</h1>
            <p style={{ margin: "20px 0 0", maxWidth: 600, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>The solver did not finish. Nothing was charged, nothing was saved in a half-solved state, and your existing plans are untouched.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, marginTop: 38 }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 32px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WHAT WE KNOW</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                {ERROR_FACTS.map((f) => (
                  <div key={f.k} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 20, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192" }}>{f.k}</span>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#3D3A31" }}>{f.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
                <span onClick={retry} className="opacity-btn" style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", height: 46, padding: "0 22px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                  {retrying && <span style={{ display: "block", width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite", flex: "none" }} />}
                  {retrying ? "Retrying…" : "Try solving again"}
                </span>
                <Link href={routes.dashboard} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>Back to dashboard</Link>
              </div>
            </div>
            <div style={{ background: "#191713", borderRadius: 12, padding: "28px 30px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>YOUR DATA IS FINE</div>
              <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.027em", color: "#FBF8F2", marginTop: 13 }}>A failed solve never writes a partial plan.</div>
              <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>Solves are all-or-nothing by design. If the solver dies halfway through, the old plan stays exactly as it was and nothing enters your account.</p>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(251,248,242,.1)" }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "rgba(251,248,242,.35)" }}>IF THIS KEEPS HAPPENING</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(251,248,242,.7)", marginTop: 9 }}>Email the request ID above and we will tell you what actually failed, not a canned apology.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "offline" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 96px" }}>
          <div className="om-rise" style={{ maxWidth: 820 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="om-breathe" style={{ width: 7, height: 7, borderRadius: "50%", background: "#E0A33C" }} />
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A0701A" }}>OFFLINE · WORKING FROM CACHE</span>
            </div>
            <h1 style={{ margin: "22px 0 0", fontSize: 66, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>No signal. Still usable.</h1>
            <p style={{ margin: "20px 0 0", maxWidth: 620, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>This is the state we designed for first. Everything you need on race day was cached at bike check-in, so most of the product carries on working exactly as normal.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginTop: 38 }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5C9E72" }} />
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#3E7B55" }}>WORKS OFFLINE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
                {OFFLINE_WORKS.map((w) => (
                  <div key={w.name} style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flex: "none" }}><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#5C9E72" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 15 }}>{w.name}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "#A8A192", whiteSpace: "nowrap" }}>{w.size}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4BCAC" }} />
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WAITS FOR SIGNAL</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
                {OFFLINE_WAITS.map((w) => (
                  <div key={w.name} style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#C4BCAC", flex: "none", marginTop: 1 }}>—</span>
                    <span>
                      <span style={{ display: "block", fontSize: 15, color: "#8C8578" }}>{w.name}</span>
                      <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.4, color: "#A8A192", marginTop: 4 }}>{w.why}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 14, padding: "24px 30px", background: "#191713", borderRadius: 12, boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>LAST SYNCED</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 11 }}>Saturday 20 June, 16:42 — at bike check-in.</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(251,248,242,.55)", marginTop: 7 }}>Plan v3, course bundle v2026.2, all five bag manifests, and the race card PDF.</div>
            </div>
            <Link href={routes.raceMode} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 22px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600, flex: "none" }}>Open Race Mode</Link>
          </div>
        </div>
      )}

      {tab === "loading" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 96px" }}>
          <div style={{ maxWidth: 760 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A8A192" }}>LOADING STATES</div>
            <h1 style={{ margin: "20px 0 0", fontSize: 60, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Skeletons, not spinners.</h1>
            <p style={{ margin: "18px 0 0", maxWidth: 600, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>A skeleton keeps the layout stable so nothing jumps when data lands. Spinners are reserved for actions you started deliberately, where the wait is the point.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 14, marginTop: 38 }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>PLAN CARD · LOADING</div>
              <div style={{ marginTop: 20 }}>
                <div style={{ height: 11, width: "34%", borderRadius: 3, background: SHIMMER }} />
                <div style={{ height: 30, width: "62%", borderRadius: 5, marginTop: 16, background: SHIMMER }} />
                <div style={{ height: 11, width: "46%", borderRadius: 3, marginTop: 14, background: SHIMMER }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 28 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i}>
                      <div style={{ height: 9, width: "60%", borderRadius: 3, background: SHIMMER }} />
                      <div style={{ height: 22, width: "80%", borderRadius: 4, marginTop: 11, background: SHIMMER }} />
                    </div>
                  ))}
                </div>
                <div style={{ height: 60, borderRadius: 6, marginTop: 26, background: SHIMMER }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>DELIBERATE ACTION · SPINNER</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 52, marginTop: 18, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
                  <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite", flex: "none" }} />
                  Solving your plan…
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#5C574B", marginTop: 14 }}>Only for waits the user asked for. Never for a page that is simply fetching.</div>
              </div>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>SLOW REQUEST · AFTER 4 SECONDS</div>
                <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 18, padding: "16px 18px", borderRadius: 9, background: "rgba(224,163,60,.09)", border: "1px solid rgba(224,163,60,.34)" }}>
                  <span className="om-breathe" style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C", flex: "none" }} />
                  <span style={{ fontSize: 14, lineHeight: 1.45, color: "#3D3A31" }}>Taking longer than usual. Still working — we will not time out silently.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "empty" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 96px" }}>
          <div style={{ maxWidth: 760 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A8A192" }}>EMPTY STATES</div>
            <h1 style={{ margin: "20px 0 0", fontSize: 60, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Nothing here is a dead end.</h1>
            <p style={{ margin: "18px 0 0", maxWidth: 600, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>Every empty state says what belongs here, why it is empty, and the one action that fills it. None of them are decorated with an illustration of a shrugging character.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 38 }}>
            {EMPTY_STATES.map((e) => (
              <div key={e.where} style={{ background: "#FBF8F2", borderRadius: 12, padding: 8, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ padding: "14px 20px 12px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>{e.where}</div>
                <div style={{ padding: "44px 34px 40px", border: "1px dashed rgba(21,20,15,.18)", borderRadius: 9, textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192" }}>{e.kicker}</div>
                  <div style={{ margin: "14px auto 0", maxWidth: 340, fontSize: 23, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.028em" }}>{e.head}</div>
                  <p style={{ margin: "11px auto 0", maxWidth: 340, fontSize: 14, lineHeight: 1.55, color: "#6B6455" }}>{e.sub}</p>
                  <span className="opacity-btn" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 20px", marginTop: 22, background: e.ctaBg, color: e.ctaFg, border: `1px solid ${e.ctaBorder}`, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{e.cta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "errors" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 48px 96px" }}>
          <div style={{ maxWidth: 760 }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A8A192" }}>INLINE ERRORS AND WARNINGS</div>
            <h1 style={{ margin: "20px 0 0", fontSize: 60, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Say what happened and what to do.</h1>
            <p style={{ margin: "18px 0 0", maxWidth: 620, fontSize: 17, lineHeight: 1.55, color: "#5C574B" }}>No error blames the user, none of them say &quot;oops&quot;, and every one names the next action. Colour always travels with a word, so nothing depends on hue alone.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 38 }}>
            {ERROR_ROWS.map((e) => (
              <div key={e.title} style={{ background: e.bg, border: `1px solid ${e.border}`, borderRadius: 11, padding: "22px 26px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "130px minmax(0,1fr) auto", gap: 24, alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.dot, flex: "none" }} />
                    <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: e.tagFg, whiteSpace: "nowrap" }}>{e.tag}</span>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-.022em" }}>{e.title}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: "#5C574B", marginTop: 6 }}>{e.body}</div>
                  </div>
                  <span className="opacity-btn" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 17px", background: e.ctaBg, color: e.ctaFg, border: `1px solid ${e.ctaBorder}`, borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer", flex: "none" }}>{e.cta}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#191713", borderRadius: 12, padding: "28px 32px", marginTop: 14, boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>THE RULE</div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.028em", color: "#FBF8F2", marginTop: 12 }}>An error the user cannot act on should not be shown to the user.</div>
            <p style={{ margin: "10px 0 0", maxWidth: 680, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>If we can fix it silently, we fix it silently. If we cannot, we say precisely what failed and give one action. Anything else is noise dressed as transparency.</p>
          </div>
        </div>
      )}
    </div>
  );
}
