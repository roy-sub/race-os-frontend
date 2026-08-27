"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { FUEL, GATES, LEGS } from "@/lib/sharedPlan";

type View = "plan" | "code" | "expired" | "revoked";
const TABS: { k: View; n: string }[] = [
  { k: "plan", n: "VALID" }, { k: "code", n: "CODE REQUIRED" },
  { k: "expired", n: "EXPIRED" }, { k: "revoked", n: "REVOKED" },
];

export default function SharedPlanPage() {
  const [view, setView] = useState<View>("plan");
  const [code, setCode] = useState("");
  const [tries, setTries] = useState(0);

  const ok = code.trim().length === 6;
  const bad = tries > 0 && !ok;

  function pickTab(k: View) {
    setView(k);
    setTries(0);
  }

  function submitCode() {
    if (ok) { setView("plan"); setTries(0); }
    else setTries((t) => t + 1);
  }

  const expTag = view === "revoked" ? "LINK REVOKED" : "LINK EXPIRED";
  const expHead = view === "revoked" ? "This link was turned off." : "This link has expired.";
  const expBody = view === "revoked"
    ? "Jonas Feldt revoked access on 22 June. Revoking works immediately, including on pages someone already had open. Ask them for a new link if you still need it."
    : "It was set to expire on 28 June 2026 and that date has passed. Whoever shared it can create a new one in seconds.";

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <div style={{ background: "#15140F" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", padding: "4px 8px", borderRadius: 4, background: "rgba(251,248,242,.14)", color: "#FBF8F2", whiteSpace: "nowrap" }}>STATE PREVIEW</span>
            <div style={{ display: "flex", gap: 3 }}>
              {TABS.map((t) => {
                const isOn = view === t.k;
                return (
                  <span key={t.k} onClick={() => pickTab(t.k)} className="mono" style={{ padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 9, letterSpacing: ".11em", background: isOn ? "#E4622F" : "rgba(251,248,242,.1)", color: isOn ? "#fff" : "rgba(251,248,242,.55)", whiteSpace: "nowrap" }}>{t.n}</span>
                );
              })}
            </div>
          </div>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "rgba(251,248,242,.4)", whiteSpace: "nowrap" }}>SPEC 44 · TOKEN-ACCESSED · NO NAVIGATION</span>
        </div>
      </div>

      {view === "plan" && (
        <div>
          <div style={{ background: "#FBF8F2", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
            <div style={{ maxWidth: 1080, margin: "0 auto", padding: "22px 48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <MediaPlaceholder path="assets/coach/feldt-mark.png" background="#D8D0C2" style={{ width: 38, height: 38, borderRadius: 9, flex: "none" }} />
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.02em" }}>Feldt Endurance</div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578", marginTop: 4 }}>SHARED BY JONAS FELDT · READ ONLY</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".13em", color: "#A0701A", whiteSpace: "nowrap" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E0A33C" }} />EXPIRES 28 JUN 2026
                </span>
                <span className="row-hover-border" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Print</span>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 48px 88px" }}>
            <div className="om-rise">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: "1px solid rgba(124,192,143,.5)", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: ".14em", color: "#3E7B55" }}>
                  <span className="om-breathe" style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />PLAN READY
                </span>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>v3 · SOLVED 18 JUN · BUNDLE v2026.2</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 48, alignItems: "end", marginTop: 20 }}>
                <div>
                  <h1 style={{ whiteSpace: "nowrap", margin: 0, fontSize: 62, lineHeight: 0.93, fontWeight: 600, letterSpacing: "-.05em" }}>Tramuntana Full</h1>
                  <div style={{ display: "flex", gap: 18, marginTop: 18, fontSize: 15.5, color: "#5C574B", whiteSpace: "nowrap" }}>
                    <span>Elena Marsh</span><span style={{ color: "#C4BCAC" }}>·</span><span>Sunday 21 June 2026</span><span style={{ color: "#C4BCAC" }}>·</span><span>06:40 start</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#A8A192" }}>GOAL</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 44, lineHeight: 0.88, letterSpacing: "-.045em", marginTop: 8 }}>11:45</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 32px", marginTop: 34, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3E7B55" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#3E7B55" }}>CLEARS EVERY CUT-OFF</span>
              </div>
              <p style={{ margin: "15px 0 0", maxWidth: 660, fontSize: 30, lineHeight: 1.16, fontWeight: 500, letterSpacing: "-.036em" }}>Clears the swim exit with 1:14 in hand. It is the barrier that binds first.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
              {LEGS.map((l) => (
                <div key={l.name} style={{ background: "#FBF8F2", borderRadius: 11, padding: "24px 26px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 20, height: 20, borderRadius: 5, background: l.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                    </span>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{l.name}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 9.5, color: "#A8A192" }}>{l.dist}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, letterSpacing: "-.038em" }}>{l.target}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#8C8578" }}>{l.unit}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <span style={{ fontSize: 13, color: "#8C8578" }}>{l.note}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15 }}>{l.split}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CUT-OFF MARGINS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 }}>
                {GATES.map((g) => (
                  <div key={g.name} style={{ borderRadius: 9, padding: "17px 18px", background: "rgba(124,192,143,.09)", border: "1px solid rgba(124,192,143,.34)" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#6B6455" }}>{g.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 24, letterSpacing: "-.035em", marginTop: 12, color: "#3E7B55" }}>{g.margin}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "#A8A192", marginTop: 8 }}>{g.eta} / {g.limit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>FUELLING</span>
                <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>852 G TOTAL</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginTop: 18 }}>
                {FUEL.map((f) => (
                  <div key={f.k}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{f.k}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, letterSpacing: "-.032em" }}>{f.v}</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#8C8578" }}>{f.u}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "rgba(21,20,15,.04)", borderRadius: 12, padding: "24px 28px", marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <svg width="15" height="16" viewBox="0 0 12 13" fill="none" style={{ flex: "none", marginTop: 2 }}><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" stroke="#8C8578" strokeWidth={1.4} /><path d="M3.8 5.5V3.9a2.2 2.2 0 0 1 4.4 0v1.6" stroke="#8C8578" strokeWidth={1.4} /></svg>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WITHHELD FROM THIS LINK</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.55, color: "#5C574B", marginTop: 9, maxWidth: 620 }}>Elena&apos;s constraint values — threshold power, gut ceiling, sweat rate — are not shared. Two fields sourced from a connected service are omitted rather than shown blank, because that provider restricts redisplay.</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 34, padding: "26px 30px", background: "#15140F", borderRadius: 12, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", color: "#FBF8F2" }}>Solve your own race week.</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: "rgba(251,248,242,.55)", marginTop: 7 }}>Course recon is free and needs no account. $19 for a solved plan.</div>
              </div>
              <Link href={routes.races} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 22px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600, flex: "none" }}>Explore your race</Link>
            </div>
          </div>
        </div>
      )}

      {view === "code" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 52px)", padding: 48 }}>
          <div className="om-rise" style={{ maxWidth: 420, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={26} height={17} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
            </div>
            <h1 style={{ margin: "30px 0 0", fontSize: 38, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-.045em" }}>This plan needs an access code.</h1>
            <p style={{ margin: "13px 0 0", fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>Jonas Feldt protected this link. The code was sent separately — it is not in the same email as the link.</p>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 30 }}>ACCESS CODE</div>
            <div style={{ display: "flex", alignItems: "center", height: 52, marginTop: 10, padding: "0 16px", border: `1px solid ${bad ? "rgba(192,57,43,.45)" : "rgba(21,20,15,.16)"}`, borderRadius: 8, background: "#FBF8F2" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="6 characters"
                style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 17, letterSpacing: ".22em", color: "#15140F", padding: 0, textTransform: "uppercase", outline: "none" }}
              />
              <span className="mono" style={{ fontSize: 10, color: "#A8A192" }}>{code.trim().length}/6</span>
            </div>
            {bad && (
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#C0392B", flex: "none" }} />
                <span style={{ fontSize: 13.5, color: "#A03227" }}>That code does not match. Two attempts left before the link locks for an hour.</span>
              </div>
            )}
            <div onClick={submitCode} style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 52, marginTop: 22, borderRadius: 8, cursor: ok ? "pointer" : "not-allowed", background: ok ? "#E4622F" : "rgba(21,20,15,.1)", color: ok ? "#fff" : "#A8A192", fontSize: 15.5, fontWeight: 600, letterSpacing: "-.015em" }}>Open the plan</div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 22 }}>NO ACCOUNT NEEDED · NOTHING IS STORED ABOUT YOU</div>
          </div>
        </div>
      )}

      {(view === "expired" || view === "revoked") && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 52px)", padding: 48 }}>
          <div className="om-rise" style={{ maxWidth: 520, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <Mark width={26} height={17} />
              <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 32 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4BCAC" }} />
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>{expTag}</span>
            </div>
            <h1 style={{ margin: "20px 0 0", fontSize: 40, lineHeight: 1.02, fontWeight: 600, letterSpacing: "-.045em" }}>{expHead}</h1>
            <p style={{ margin: "15px 0 0", fontSize: 16.5, lineHeight: 1.55, color: "#5C574B" }}>{expBody}</p>
            <div style={{ marginTop: 26, padding: "20px 22px", borderRadius: 10, background: "#FBF8F2", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>WHAT THIS IS NOT</div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "#5C574B", marginTop: 9 }}>This is not a broken page. The link worked and has since been closed by the person who created it, which is exactly how it is meant to behave.</div>
            </div>
            <Link href={routes.races} className="btn-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 50, marginTop: 22, background: "#E4622F", color: "#fff", borderRadius: 8, fontSize: 15, fontWeight: 600 }}>Explore courses instead — free</Link>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 20 }}>LINK ID shr_4e77d · CREATED 14 JUN 2026</div>
          </div>
        </div>
      )}
    </div>
  );
}
