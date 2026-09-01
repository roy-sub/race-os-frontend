"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  ACT_STYLE, ATHLETES, BOARD_STATS, CMP_INDICES, CMP_INSIGHTS, CMP_ROW_DEFS, LINKS,
  M_COLOR, PERMS, SHARE_RULES, type PermKey,
} from "@/lib/coach";

type Tab = "board" | "athlete" | "compare" | "add" | "shared";
const TABS: { k: Tab; n: string }[] = [
  { k: "board", n: "Board" }, { k: "athlete", n: "Athlete" },
  { k: "compare", n: "Compare" }, { k: "add", n: "Invite" }, { k: "shared", n: "Shared links" },
];
const FILTERS = ["All", "Needs you", "Race week", "Clear"] as const;

function CoachPage() {
  const [tab, setTab] = useState<Tab>("board");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [perms, setPerms] = useState<Record<PermKey, boolean>>({ plans: true, build: true, analysis: true, constraints: false });

  const needsYouCount = ATHLETES.filter((a) => a.action).length;
  const counts = {
    All: ATHLETES.length,
    "Needs you": needsYouCount,
    "Race week": ATHLETES.filter((a) => a.when === "6d").length,
    Clear: ATHLETES.filter((a) => a.mState === "clear").length,
  };
  let list = filter === "All" ? ATHLETES
    : filter === "Needs you" ? ATHLETES.filter((a) => a.action)
    : filter === "Race week" ? ATHLETES.filter((a) => a.when === "6d")
    : ATHLETES.filter((a) => a.mState === "clear");
  if (query) list = list.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  function openAthlete(i: number) {
    setSel(i);
    setTab("athlete");
  }
  function pickTab(t: Tab) {
    setTab(t);
    if (t === "athlete" && sel === null) setSel(0);
  }

  const selAthlete = sel !== null ? ATHLETES[sel] : null;
  const cmpAthletes = CMP_INDICES.map((i) => ATHLETES[i]);

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={27} height={18} />
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
            </Link>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", padding: "4px 8px", borderRadius: 4, background: "#15140F", color: "#F1EEE8", whiteSpace: "nowrap" }}>COACH</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((t) => {
              const active = tab === t.k;
              return (
                <div key={t.k} onClick={() => pickTab(t.k)} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, height: 68, padding: "0 15px", cursor: "pointer", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#15140F" : "#6B6455" }}>{t.n}</span>
                  {t.k === "board" && needsYouCount > 0 && <span className="mono" style={{ fontSize: 8, letterSpacing: ".1em", padding: "2px 6px", borderRadius: 3, background: "rgba(228,98,47,.16)", color: "#C6461B" }}>{needsYouCount}</span>}
                  <span style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 2, background: active ? "#E4622F" : "transparent" }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578", whiteSpace: "nowrap" }}>11 / 15 SEATS</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 14, borderLeft: "1px solid rgba(21,20,15,.12)" }}>
              <MediaPlaceholder path="assets/account/jonas.jpg" background="#D8D0C2" style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }} />
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-.01em" }}>Jonas Feldt</div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#8C8578", marginTop: 2 }}>FELDT ENDURANCE</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {tab === "board" && (
        <div>
          <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Race-week board</h1>
                <p style={{ margin: "13px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Monday morning. Three of your eleven athletes are in trouble on Sunday, and this is which three and why.</p>
              </div>
              <div style={{ display: "flex", gap: 10, flex: "none" }}>
                <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 17px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Export board</span>
                <span onClick={() => setTab("add")} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", height: 42, padding: "0 17px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                  <span className="mono" style={{ fontSize: 13, lineHeight: 1 }}>+</span>Invite athlete
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 32 }}>
              {BOARD_STATS.map((b) => (
                <div key={b.k} style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 12, padding: "22px 24px 20px" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: b.labelFg }}>{b.k}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 13 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 36, letterSpacing: "-.045em", color: b.valueFg }}>{b.v}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: b.labelFg }}>{b.u}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: b.noteFg, marginTop: 9 }}>{b.note}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "56px 0 64px", marginTop: 44, background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {FILTERS.map((f) => {
                    const on = filter === f;
                    return (
                      <div key={f} onClick={() => setFilter(f)} className="row-hover-border" style={{ display: "flex", alignItems: "center", gap: 8, height: 34, padding: "0 13px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: f === "Needs you" ? "#E4622F" : f === "Clear" ? "#7CC08F" : "transparent", flex: "none" }} />
                        <span style={{ fontSize: 13, fontWeight: on ? 600 : 500, letterSpacing: "-.01em", color: on ? "#FBF8F2" : "#5C574B" }}>{f}</span>
                        <span className="mono" style={{ fontSize: 9.5, color: on ? "rgba(251,248,242,.5)" : "#A8A192" }}>{counts[f]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, height: 36, padding: "0 13px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#FBF8F2" }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search athletes" style={{ width: 150, border: 0, background: "transparent", fontSize: 13.5, color: "#15140F", padding: 0, outline: "none" }} />
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 22, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
                <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "8px 28px 22px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 1fr .8fr .8fr .9fr 1.3fr 108px", gap: 18, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                    <span>ATHLETE</span><span>RACE</span><span>WHEN</span><span>GOAL</span><span>MARGIN</span><span>WHAT NEEDS YOU</span><span style={{ textAlign: "right" }}>ACTION</span>
                  </div>
                  {list.map((a) => {
                    const idx = ATHLETES.indexOf(a);
                    const act = ACT_STYLE[a.actState];
                    return (
                      <div key={a.name} onClick={() => openAthlete(idx)} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 1fr .8fr .8fr .9fr 1.3fr 108px", gap: 18, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center", cursor: "pointer", background: idx === sel ? "rgba(228,98,47,.05)" : "transparent" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                          <MediaPlaceholder path={a.avatar} background="#D8D0C2" style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }} />
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 15.5, fontWeight: 500, letterSpacing: "-.02em", whiteSpace: "nowrap" }}>{a.name}</span>
                            <span className="mono" style={{ display: "block", fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192", marginTop: 3 }}>{a.level}</span>
                          </span>
                        </span>
                        <span style={{ fontSize: 14, color: "#5C574B", whiteSpace: "nowrap" }}>{a.race}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: a.when === "6d" ? "#C6461B" : "#5C574B" }}>{a.when}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5 }}>{a.goal}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: M_COLOR[a.mState], flex: "none" }} />
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5, color: M_COLOR[a.mState] }}>{a.margin}</span>
                        </span>
                        <span style={{ fontSize: 13.5, color: a.action ? "#3D3A31" : "#A8A192" }}>{a.issue}</span>
                        <span style={{ textAlign: "right" }}>
                          {a.action && <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "6px 10px", borderRadius: 5, background: act.bg, color: act.fg, whiteSpace: "nowrap" }}>{a.action}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "athlete" && selAthlete && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => setTab("board")} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, cursor: "pointer", flex: "none" }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3 5 8l5 5" stroke="#5C574B" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192" }}>BOARD / ATHLETE</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 48, alignItems: "end", marginTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <MediaPlaceholder path={selAthlete.avatar} background="#D8D0C2" style={{ width: 76, height: 76, borderRadius: "50%", flex: "none" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 9px", border: `1px solid ${selAthlete.action ? "rgba(192,57,43,.42)" : "rgba(124,192,143,.5)"}`, borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".14em", color: selAthlete.action ? "#A03227" : "#3E7B55" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: selAthlete.action ? "#C0392B" : "#7CC08F" }} />{selAthlete.action ? "NEEDS YOU" : "ON TRACK"}
                  </span>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578" }}>{selAthlete.level}</span>
                </div>
                <h1 style={{ margin: "12px 0 0", fontSize: 52, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em", whiteSpace: "nowrap" }}>{selAthlete.name}</h1>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flex: "none" }}>
              <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 44, padding: "0 18px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Message</span>
              <Link href={routes.racePlan} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 44, padding: "0 18px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Open their plan</Link>
              <Link href={routes.planBuilder} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 44, padding: "0 20px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Build on their behalf</Link>
            </div>
          </div>

          {selAthlete.verdict && (
            <div style={{ background: "#191713", borderRadius: 12, padding: "26px 30px", marginTop: 32, position: "relative", overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
              <div style={{ position: "absolute", right: -90, top: -120, width: 400, height: 400, background: `radial-gradient(closest-side,${selAthlete.action ? "rgba(192,57,43,.16)" : "rgba(124,192,143,.14)"},transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span className="om-breathe" style={{ width: 6, height: 6, borderRadius: "50%", background: selAthlete.action ? "#C0392B" : "#7CC08F" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: ".17em", color: selAthlete.action ? "#C0392B" : "#7CC08F" }}>COACH VERDICT</span>
                </div>
                <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.033em", color: "#FBF8F2", marginTop: 13, maxWidth: 820 }}>{selAthlete.verdict}</div>
                <p style={{ margin: "11px 0 0", maxWidth: 740, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>{selAthlete.verdictSub}</p>
              </div>
            </div>
          )}

          {selAthlete.splits.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 14 }}>
              {selAthlete.splits.map((sp) => (
                <div key={sp.k} style={{ background: "#FBF8F2", borderRadius: 11, padding: "22px 24px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, background: sp.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: sp.color }} />
                    </span>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{sp.k}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 15 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, letterSpacing: "-.035em" }}>{sp.v}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#8C8578" }}>{sp.u}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 9 }}>{sp.note}</div>
                </div>
              ))}
            </div>
          )}

          {(selAthlete.gates.length > 0 || selAthlete.notes.length > 0) && (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CUT-OFF MARGINS</div>
                <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                  {selAthlete.gates.map((g) => (
                    <div key={g.name} style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr 1fr", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                      <span style={{ fontSize: 14.5 }}>{g.name}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#A8A192" }}>{g.limit}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5 }}>{g.eta}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: g.w, background: M_COLOR[g.state], borderRadius: 2 }} />
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: M_COLOR[g.state], whiteSpace: "nowrap" }}>{g.margin}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>YOUR NOTES · VISIBLE TO THEM</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                  {selAthlete.notes.map((n, i) => (
                    <div key={i} style={{ padding: "14px 16px", borderRadius: 9, background: "rgba(21,20,15,.04)" }}>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{n.when}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "#3D3A31", marginTop: 8 }}>{n.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 11, height: 46, marginTop: 14, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                  <input type="text" placeholder="Add a note…" style={{ flex: 1, border: 0, background: "transparent", fontSize: 14.5, color: "#15140F", padding: 0, outline: "none" }} />
                  <span className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer", whiteSpace: "nowrap" }}>SEND</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "compare" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Compare</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Four athletes on the same course. Where their plans differ is where your coaching decisions actually are.</p>
            </div>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", paddingBottom: 8, whiteSpace: "nowrap" }}>TRAMUNTANA FULL · 21 JUNE</span>
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 26px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)", overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px repeat(4,minmax(0,1fr))", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span />
              {cmpAthletes.map((a) => (
                <span key={a.name} style={{ display: "flex", alignItems: "center", gap: 9, whiteSpace: "nowrap" }}>
                  <MediaPlaceholder path={a.avatar} background="#D8D0C2" style={{ width: 22, height: 22, borderRadius: "50%", flex: "none" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "-.015em", color: "#15140F" }}>{a.name.split(" ")[0]}</span>
                </span>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "180px repeat(4,minmax(0,1fr))", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578", whiteSpace: "nowrap" }}>GOAL FINISH</span>
              {cmpAthletes.map((a) => (
                <span key={a.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#15140F", whiteSpace: "nowrap" }}>{a.goal}</span>
                </span>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "180px repeat(4,minmax(0,1fr))", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578", whiteSpace: "nowrap" }}>TIGHTEST MARGIN</span>
              {cmpAthletes.map((a) => (
                <span key={a.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: M_COLOR[a.mState], flex: "none" }} />
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: a.mState !== "clear" ? M_COLOR[a.mState] : "#15140F", whiteSpace: "nowrap" }}>{a.margin}</span>
                </span>
              ))}
            </div>
            {CMP_ROW_DEFS.map((r) => (
              <div key={r.k} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "180px repeat(4,minmax(0,1fr))", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578", whiteSpace: "nowrap" }}>{r.k}</span>
                {r.vals.map((c, ci) => (
                  <span key={ci} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {c.flag && <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.state ? M_COLOR[c.state] : "transparent", flex: "none" }} />}
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: c.flag && c.state && c.state !== "clear" ? M_COLOR[c.state] : "#15140F", whiteSpace: "nowrap" }}>{c.v}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
            {CMP_INSIGHTS.map((i) => (
              <div key={i.tag} style={{ background: i.bg, border: `1px solid ${i.border}`, borderRadius: 12, padding: "24px 26px" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: i.tagFg }}>{i.tag}</div>
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.025em", marginTop: 13 }}>{i.name}</div>
                <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>{i.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "add" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ maxWidth: 760 }}>
            <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Invite an athlete</h1>
            <p style={{ margin: "13px 0 0", fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>They keep their own account and their own data. You get read access to their plans and the ability to build on their behalf — nothing else.</p>

            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "30px 32px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "22px 26px" }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>ATHLETE EMAIL</div>
                  <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                    <input type="text" placeholder="them@example.com" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
                  </div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>THEIR NAME</div>
                  <div style={{ display: "flex", alignItems: "center", height: 48, marginTop: 10, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                    <input type="text" placeholder="Optional" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
                  </div>
                </div>
              </div>

              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 26 }}>WHAT YOU ARE ASKING FOR</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                {PERMS.map((p) => {
                  const on = p.locked ? false : perms[p.k];
                  return (
                    <div
                      key={p.k}
                      onClick={() => { if (p.locked) return; setPerms((q) => ({ ...q, [p.k]: !on })); }}
                      style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "16px 18px", borderRadius: 9, cursor: p.locked ? "not-allowed" : "pointer", background: p.locked ? "rgba(21,20,15,.03)" : on ? "rgba(228,98,47,.06)" : "#fff", border: `1px solid ${p.locked ? "rgba(21,20,15,.1)" : on ? "rgba(228,98,47,.3)" : "rgba(21,20,15,.14)"}` }}
                    >
                      <span style={{ width: 19, height: 19, borderRadius: 5, border: `1px solid ${p.locked ? "rgba(21,20,15,.14)" : on ? "#5C9E72" : "rgba(21,20,15,.22)"}`, background: on ? "#5C9E72" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>
                        {on && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{p.name}</span>
                          {p.locked && <span className="mono" style={{ fontSize: 8, letterSpacing: ".11em", padding: "2px 6px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#8C8578", whiteSpace: "nowrap" }}>NEVER</span>}
                        </span>
                        <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.45, color: "#8C8578", marginTop: 5 }}>{p.desc}</span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
                <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Send invitation</span>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>4 SEATS REMAINING ON YOUR PLAN</span>
              </div>
            </div>

            <div style={{ background: "#15140F", borderRadius: 12, padding: "26px 30px", marginTop: 14, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>HOW THIS LOOKS TO THEM</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 12 }}>They approve each permission individually, and can revoke any of them at any time.</div>
              <p style={{ margin: "10px 0 0", maxWidth: 620, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>If they revoke access you keep nothing. No cached plans, no exported data, no residual view. That is deliberate — a coaching relationship ending should not leave their data with you.</p>
            </div>
          </div>
        </div>
      )}

      {tab === "shared" && (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "44px 48px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Shared links</h1>
              <p style={{ margin: "13px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>A read-only plan anyone can open without an account. Expires on a date you set, and shows only what you allow.</p>
            </div>
            <div style={{ display: "flex", gap: 10, flex: "none" }}>
              <Link href={routes.sharedPlan} className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 17px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Preview as recipient</Link>
              <span className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", height: 42, padding: "0 17px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                <span className="mono" style={{ fontSize: 13, lineHeight: 1 }}>+</span>New link
              </span>
            </div>
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 24px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) 1fr .9fr .9fr .8fr 100px", gap: 18, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>PLAN</span><span>SHARED WITH</span><span>SHOWS</span><span>EXPIRES</span><span>OPENS</span><span style={{ textAlign: "right" }}>STATUS</span>
            </div>
            {LINKS.map((l) => {
              const dot = l.state === "active" ? "#7CC08F" : l.state === "expired" ? "#C4BCAC" : "#E0A33C";
              const expFg = l.state === "expired" ? "#A8A192" : "#5C574B";
              const stBg = l.state === "active" ? "rgba(124,192,143,.16)" : l.state === "expired" ? "rgba(21,20,15,.06)" : "rgba(224,163,60,.18)";
              const stFg = l.state === "active" ? "#3E7B55" : l.state === "expired" ? "#8C8578" : "#A0701A";
              return (
                <div key={l.plan} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) 1fr .9fr .9fr .8fr 100px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flex: "none" }} />
                    <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>{l.plan}</span>
                  </span>
                  <span style={{ fontSize: 14, color: "#5C574B", whiteSpace: "nowrap" }}>{l.who}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: "#5C574B", whiteSpace: "nowrap" }}>{l.shows}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: expFg }}>{l.expires}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{l.opens}</span>
                  <span style={{ textAlign: "right" }}><span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, background: stBg, color: stFg, whiteSpace: "nowrap" }}>{l.status}</span></span>
                </div>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
            {SHARE_RULES.map((r) => (
              <div key={r.k} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{r.k}</div>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em", marginTop: 12 }}>{r.name}</div>
                <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedCoachPage() {
  return (
    <GuardedPage>
      <CoachPage />
    </GuardedPage>
  );
}
