"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountHeader } from "@/components/AccountHeader";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import { CARD_BLOCKS, EXPORTS, PLANS, type PlanState } from "@/lib/myPlans";
import { GuardedPage } from "@/lib/auth/GuardedPage";

const HREF_MAP: Record<string, string> = {
  racePlan: routes.racePlan,
  planBuilder: routes.planBuilder,
  postRace: routes.postRace,
};

const MARGIN_COLOR = { clear: "#3E7B55", tight: "#A0701A", none: "#A8A192" } as const;

const FILTERS = ["All", "Active", "Draft", "Past", "Shared"] as const;

function MyPlansPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [cardIdx, setCardIdx] = useState<number | null>(null);
  const [size, setSize] = useState<"A5" | "A4" | "Pocket">("A5");

  const counts = {
    All: PLANS.length,
    Active: PLANS.filter((p) => p.state === "Active").length,
    Draft: PLANS.filter((p) => p.state === "Draft").length,
    Past: PLANS.filter((p) => p.state === "Past").length,
    Shared: PLANS.filter((p) => p.shared).length,
  };

  let list = filter === "All" ? PLANS : filter === "Shared" ? PLANS.filter((p) => p.shared) : PLANS.filter((p) => p.state === (filter as PlanState));
  if (query) list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const countLine = `${counts.Active} active · ${counts.Draft} draft · ${counts.Past} finished. Every plan you have solved stays yours permanently.`;
  const card = cardIdx !== null ? PLANS[cardIdx] : null;

  const emptyKicker = query ? "NO MATCHES" : filter === "Draft" ? "NO DRAFTS" : filter === "Past" ? "NOTHING RACED YET" : "NOTHING SHARED";
  const emptyHead = query ? `Nothing matches "${query}".` : filter === "Past" ? "Your first finish will land here." : filter === "Draft" ? "No half-finished plans." : "You have not shared a plan yet.";
  const emptySub = query
    ? "Try a shorter search, or clear the filter to see all five plans."
    : filter === "Past"
      ? "After Sunday, upload your file and this becomes your race history with real numbers."
      : filter === "Draft"
        ? "Plans you start but do not solve are saved here automatically."
        : "Share a plan with a coach and they can read it without an account.";
  const emptyCta = query ? "Build a new plan" : "Build a plan";

  const paperW = size === "A4" ? 620 : size === "Pocket" ? 360 : 500;
  const printSpec = [
    { k: "Paper", v: size === "A4" ? "A4 · 210×297" : size === "Pocket" ? "105×148" : "A5 · 148×210" },
    { k: "Ink", v: "Monochrome" },
    { k: "Minimum type", v: "7.5 pt" },
    { k: "Fits one side", v: "Yes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="myPlans" />

      {cardIdx === null ? (
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div>
              <Reveal as="h1" style={{ margin: 0, fontSize: 60, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>My plans</Reveal>
              <Reveal as="p" delay={0.05} style={{ margin: "14px 0 0", fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>{countLine}</Reveal>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 40, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#FBF8F2" }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plans" style={{ width: 150, border: 0, background: "transparent", fontSize: 14, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
                {[
                  { k: "list" as const, icon: "M2 4h12M2 8h12M2 12h12" },
                  { k: "grid" as const, icon: "M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" },
                ].map((v) => {
                  const on = view === v.k;
                  return (
                    <span key={v.k} onClick={() => setView(v.k)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 5, cursor: "pointer", background: on ? "#FBF8F2" : "transparent" }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d={v.icon} stroke={on ? "#15140F" : "#A8A192"} strokeWidth={1.5} strokeLinecap="round" /></svg>
                    </span>
                  );
                })}
              </div>
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
            <span className="mono" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>SORTED BY RACE DATE</span>
          </div>

          {list.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
              {list.map((p) => {
                const idx = PLANS.indexOf(p);
                return (
                  <Reveal key={p.name} delay={idx * 0.06} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 200px 150px 1fr auto", gap: 26, alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.dot, flex: "none" }} />
                          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: p.statusFg, whiteSpace: "nowrap" }}>{p.status}</span>
                          {p.shared && <span className="mono" style={{ fontSize: 8, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#5C574B", whiteSpace: "nowrap" }}>SHARED WITH COACH</span>}
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.033em", marginTop: 11, whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 13.5, color: "#8C8578", whiteSpace: "nowrap" }}>
                          <span>{p.date}</span><span style={{ color: "#C4BCAC" }}>·</span><span>{p.place}</span><span style={{ color: "#C4BCAC" }}>·</span><span>{p.version}</span>
                        </div>
                      </div>

                      <div>
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>GOAL / PROJECTED</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                          <span className="mono" style={{ fontSize: 20, letterSpacing: "-.028em" }}>{p.goal}</span>
                          <span className="mono" style={{ fontSize: 12, color: "#A8A192" }}>/ {p.proj}</span>
                        </div>
                      </div>

                      <div>
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>TIGHTEST</div>
                        <div className="mono" style={{ fontSize: 20, letterSpacing: "-.028em", marginTop: 8, color: MARGIN_COLOR[p.marginState] }}>{p.margin}</div>
                      </div>

                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>READINESS</span>
                          <span className="mono" style={{ fontSize: 10, color: "#6B6455" }}>{p.ready}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", marginTop: 11, position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: p.readyW, background: p.readyColor, borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: 12, color: "#8C8578", marginTop: 8 }}>{p.readyNote}</div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "none" }}>
                        <Link href={HREF_MAP[p.href]} className="opacity-btn" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 17px", background: p.primary ? "#E4622F" : "transparent", color: p.primary ? "#fff" : "#15140F", border: `1px solid ${p.primary ? "#E4622F" : "rgba(21,20,15,.18)"}`, borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>{p.cta}</Link>
                        <div onClick={() => setCardIdx(idx)} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, cursor: "pointer" }}>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="#5C574B" strokeWidth={1.4} /><path d="M5 5.5h6M5 8.5h6M5 11.5h3.5" stroke="#5C574B" strokeWidth={1.3} strokeLinecap="round" /></svg>
                        </div>
                        <div className="btn-outline-dark2 mono" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, cursor: "pointer", fontSize: 14, color: "#5C574B" }}>⋯</div>
                      </div>
                    </div>

                    {p.alert && (
                      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 20, padding: "14px 16px", borderRadius: 8, background: "rgba(224,163,60,.09)", border: "1px solid rgba(224,163,60,.36)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C98A1F", flex: "none" }} />
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#C98A1F", whiteSpace: "nowrap" }}>{p.alertTag}</span>
                        <span style={{ fontSize: 14, color: "#3D3A31" }}>{p.alertText}</span>
                        <span className="mono link-accent" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer", whiteSpace: "nowrap" }}>{p.alertCta}</span>
                      </div>
                    )}
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <div style={{ marginTop: 22, padding: "80px 40px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12, textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>{emptyKicker}</div>
              <div style={{ margin: "18px auto 0", maxWidth: 420, fontSize: 28, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-.032em" }}>{emptyHead}</div>
              <p style={{ margin: "12px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>{emptySub}</p>
              <Link href={routes.planBuilder} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>{emptyCta}</Link>
            </div>
          )}
        </div>
      ) : (
        card && (
          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "32px 56px 88px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div onClick={() => setCardIdx(null)} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, cursor: "pointer", flex: "none" }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3 5 8l5 5" stroke="#5C574B" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192" }}>RACE CARD · {card.name}</div>
                  <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.033em", marginTop: 5 }}>Exactly as it prints</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
                  {(["A5", "A4", "Pocket"] as const).map((z) => {
                    const on = size === z;
                    return (
                      <span key={z} onClick={() => setSize(z)} className="mono" style={{ padding: "8px 13px", borderRadius: 5, cursor: "pointer", fontSize: 9.5, letterSpacing: ".12em", background: on ? "#15140F" : "transparent", color: on ? "#FBF8F2" : "#8C8578", whiteSpace: "nowrap" }}>{z}</span>
                    );
                  })}
                </div>
                <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 17px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Download PDF</a>
                <a href="#" className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 40, padding: "0 18px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Print</a>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 22, marginTop: 28, alignItems: "start" }}>
              <div style={{ background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px", borderRadius: 14, padding: 40, display: "flex", justifyContent: "center" }}>
                <div style={{ background: "#fff", borderRadius: 4, padding: "34px 36px", width: paperW, boxShadow: "0 30px 70px -34px rgba(21,20,15,.45)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 15, borderBottom: "2px solid #15140F" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.03em" }}>{card.name.toUpperCase()}</div>
                      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#5C574B", marginTop: 5 }}>{card.date.toUpperCase()} · 06:40 START · {card.place.toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em" }}>{card.goal}</div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#5C574B", marginTop: 5 }}>GOAL · {card.version.split(" · ")[0].toUpperCase()}</div>
                    </div>
                  </div>
                  {CARD_BLOCKS.map((b) => (
                    <div key={b.title} style={{ padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.18)" }}>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", fontWeight: 500 }}>{b.title}</div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${b.cols},1fr)`, gap: 12, marginTop: 12 }}>
                        {b.rows.map((r) => (
                          <div key={r.k}>
                            <div className="mono" style={{ fontSize: 7.5, letterSpacing: ".12em", color: "#6B6455" }}>{r.k}</div>
                            <div className="mono" style={{ fontSize: 14, marginTop: 4 }}>{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 13, fontSize: 7.5, letterSpacing: ".12em", color: "#6B6455" }}>
                    <span>RACEOS · BUNDLE v2026.2</span>
                    <span>SWEAT RATE ESTIMATED · ALL ELSE MEASURED OR OFFICIAL</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>PRINT SPEC</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                    {printSpec.map((s) => (
                      <div key={s.k} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
                        <span style={{ fontSize: 13.5, color: "#5C574B" }}>{s.k}</span>
                        <span className="mono" style={{ fontSize: 12.5, textAlign: "right" }}>{s.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>ALSO EXPORT</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                    {EXPORTS.map((x) => (
                      <div key={x.ext} className="row-hover-border" style={{ display: "flex", alignItems: "center", gap: 11, height: 42, padding: "0 13px", border: "1px solid rgba(21,20,15,.14)", borderRadius: 7, cursor: "pointer", background: "#fff" }}>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192", width: 32, flex: "none" }}>{x.ext}</span>
                        <span style={{ fontSize: 13.5, fontWeight: 500, letterSpacing: "-.015em" }}>{x.name}</span>
                        <span className="mono" style={{ marginLeft: "auto", fontSize: 12, color: "#E4622F" }}>↓</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "18px 20px", borderRadius: 11, background: "rgba(228,98,47,.07)", border: "1px solid rgba(228,98,47,.28)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#C6461B" }}>WHY MONOCHROME</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#3D3A31", marginTop: 10 }}>This card gets read at hour nine in bright sun, wet, through a plastic sleeve. Colour coding fails all four. Nothing here depends on it.</div>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedMyPlansPage() {
  return (
    <GuardedPage>
      <MyPlansPage />
    </GuardedPage>
  );
}
