"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";

const METHODS = ["Card", "Apple Pay", "PayPal"];

const INCLUDED = [
  "Solved pacing for all three legs",
  "Fuelling plan with aid-station timeline",
  "Five bags, every item reasoned",
  "Race card · PDF and print",
  "Device and calendar export",
  "Drift re-solves and offline Race Mode",
];

const NEXT_STEPS = [
  { kicker: "DO THIS FIRST", name: "Print the race card", desc: "One A5 page. Monochrome legible, in your morning clothes bag.", delay: 0.08 },
  { kicker: "BEFORE SATURDAY", name: "Pack five bags", desc: "One printed page per bag, with the reason each item is there.", delay: 0.16 },
  { kicker: "ON YOUR HEAD UNIT", name: "Export the course", desc: "Route plus waypoints for every aid station and cut-off.", delay: 0.24 },
];

const TIMELINE = [
  { when: "NOW", what: "The plan is in your dashboard and on your phone. Race Mode works offline from Saturday." },
  { when: "THURSDAY", what: "Forecast lands at 72 hours. If anything moves your numbers, you get a drift alert naming what changed." },
  { when: "SATURDAY", what: "Bike check-in reminder, and the bag checklists switch to a packing view." },
  { when: "AFTER SUNDAY", what: "Upload your file and post-race analysis writes your real numbers back into your constraints." },
];

const fieldBox: React.CSSProperties = { display: "flex", alignItems: "center", height: 48, marginTop: 11, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" };
const fieldLabel: React.CSSProperties = { fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 24 };

function CheckoutPage() {
  const [method, setMethod] = useState("Card");
  const [terms, setTerms] = useState(true);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const pay = () => {
    if (!terms || paying) return;
    setPaying(true);
    timer.current = setTimeout(() => {
      setPaying(false);
      setDone(true);
    }, 1400);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ background: "rgba(241,238,232,.94)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={routes.dashboard} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={26} height={17} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>
            <svg width="11" height="12" viewBox="0 0 12 13" fill="none" style={{ flex: "none" }}><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" stroke="#8C8578" strokeWidth={1.4} /><path d="M3.8 5.5V3.9a2.2 2.2 0 0 1 4.4 0v1.6" stroke="#8C8578" strokeWidth={1.4} /></svg>
            SECURE CHECKOUT · CARD DETAILS NEVER TOUCH OUR SERVERS
          </div>
        </div>
      </header>

      {!done ? (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "52px 48px 96px" }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
            <Link href={routes.planBuilder} style={{ color: "#A8A192" }}>PLAN BUILDER</Link> / CHECKOUT
          </div>
          <h1 style={{ margin: "14px 0 0", fontSize: 50, lineHeight: 1, fontWeight: 600, letterSpacing: "-.047em" }}>One plan. One payment.</h1>
          <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Yours permanently, including every export and the drift re-solves through race week.</p>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 400px", gap: 32, marginTop: 38, alignItems: "start" }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "32px 34px 34px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {METHODS.map((m) => {
                  const sel = method === m;
                  return (
                    <div key={m} onClick={() => setMethod(m)} className="row-hover-border" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, height: 48, borderRadius: 8, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}` }}>
                      <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.018em", color: sel ? "#FBF8F2" : "#15140F" }}>{m}</span>
                    </div>
                  );
                })}
              </div>

              <div style={fieldLabel}>EMAIL</div>
              <div style={fieldBox}>
                <input type="text" defaultValue="elena.marsh@gmail.com" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
                <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#3E7B55", whiteSpace: "nowrap" }}>VERIFIED</span>
              </div>

              <div style={fieldLabel}>CARD NUMBER</div>
              <div style={{ ...fieldBox, gap: 12 }}>
                <svg width="26" height="17" viewBox="0 0 28 18" fill="none" style={{ flex: "none" }}><rect x="0.7" y="0.7" width="26.6" height="16.6" rx="2.6" stroke="rgba(21,20,15,.2)" strokeWidth={1.4} /><rect x="1.4" y="4.6" width="25.2" height="3" fill="rgba(21,20,15,.14)" /></svg>
                <input type="text" defaultValue="4242 4242 4242 4242" className="mono" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15, color: "#15140F", padding: 0, letterSpacing: ".04em", outline: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 24 }}>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>EXPIRY</div>
                  <div style={{ ...fieldBox }}>
                    <input type="text" defaultValue="09 / 28" className="mono" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }} />
                  </div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CVC</div>
                  <div style={{ ...fieldBox }}>
                    <input type="text" defaultValue="•••" className="mono" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }} />
                  </div>
                </div>
              </div>

              <div style={fieldLabel}>BILLING COUNTRY</div>
              <div style={fieldBox}>
                <span style={{ flex: 1, fontSize: 15.5 }}>United Kingdom</span>
                <svg width="11" height="7" viewBox="0 0 12 8" fill="none"><path d="M1 1.5 6 6.5l5-5" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>

              <div onClick={() => setTerms((t) => !t)} style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 28, cursor: "pointer" }}>
                <span style={{ width: 19, height: 19, borderRadius: 5, border: `1px solid ${terms ? "#5C9E72" : "rgba(21,20,15,.22)"}`, background: terms ? "#5C9E72" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 1 }}>
                  {terms && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>
                  I understand this plan is solved for <span style={{ color: "#15140F", fontWeight: 500 }}>Tramuntana Full on 21 June 2026</span>, and that a plan is guidance rather than a guarantee of a finish.
                </span>
              </div>

              <div
                onClick={pay}
                className="pay-btn"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 11, height: 54, marginTop: 26, borderRadius: 8,
                  cursor: terms ? "pointer" : "not-allowed", background: terms ? "#E4622F" : "rgba(21,20,15,.1)", color: terms ? "#fff" : "#A8A192",
                  fontSize: 16, fontWeight: 600, letterSpacing: "-.015em",
                }}
              >
                {paying && <span style={{ display: "block", width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite", flex: "none" }} />}
                {paying ? "Authorising…" : terms ? "Pay $22.80" : "Accept the terms to continue"}
              </div>

              <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 18, fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>
                <span>NO SUBSCRIPTION</span><span>·</span><span>NO AUTO-RENEWAL</span><span>·</span><span>REFUND IF THE RACE IS CANCELLED</span>
              </div>
            </div>

            <div>
              <div style={{ background: "#15140F", borderRadius: 12, padding: "26px 28px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}>YOU ARE BUYING</div>
                <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.032em", color: "#FBF8F2", marginTop: 14 }}>Tramuntana Full</div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(251,248,242,.42)", marginTop: 7 }}>21 JUNE 2026 · GOAL 11:45 · PLAN v1</div>

                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 22, paddingTop: 20, borderTop: "1px solid rgba(251,248,242,.1)" }}>
                  {INCLUDED.map((name) => (
                    <div key={name} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flex: "none" }}><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#E4622F" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ fontSize: 13.5, color: "rgba(251,248,242,.72)" }}>{name}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(251,248,242,.1)" }}>
                  <span style={{ fontSize: 14, color: "rgba(251,248,242,.55)" }}>Race Plan</span>
                  <span className="mono" style={{ fontSize: 15, color: "#FBF8F2" }}>$19.00</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 11 }}>
                  <span style={{ fontSize: 14, color: "rgba(251,248,242,.55)" }}>VAT · United Kingdom 20%</span>
                  <span className="mono" style={{ fontSize: 15, color: "#FBF8F2" }}>$3.80</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(251,248,242,.14)" }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: "#FBF8F2" }}>Total today</span>
                  <span className="mono" style={{ fontSize: 26, letterSpacing: "-.035em", color: "#FBF8F2" }}>$22.80</span>
                </div>
              </div>

              <div style={{ marginTop: 12, padding: "20px 22px", borderRadius: 11, background: "rgba(228,98,47,.07)", border: "1px solid rgba(228,98,47,.28)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#C6461B" }}>RACING MORE THIS SEASON?</div>
                <div style={{ fontSize: 15, lineHeight: 1.5, color: "#3D3A31", marginTop: 11 }}>A Season Pass is <span style={{ fontWeight: 600 }}>$59</span> for unlimited plans plus post-race analysis. Cheaper from your third race.</div>
                <Link href={routes.pricing} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", marginTop: 14, background: "#FBF8F2", border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                  Switch to Season Pass
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 48px 96px" }}>
          <div style={{ animation: "rise .7s cubic-bezier(.16,1,.3,1) both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: "#5C9E72", flex: "none" }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M4.5 10.5 8 14l7.5-7.5" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={64} style={{ animation: "draw .6s .25s cubic-bezier(.16,1,.3,1) both" }} /></svg>
              </span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#3E7B55" }}>PAID · RECEIPT SENT TO ELENA.MARSH@GMAIL.COM</span>
            </div>
            <h1 style={{ margin: "24px 0 0", fontSize: 62, lineHeight: 0.95, fontWeight: 600, letterSpacing: "-.05em" }}>Your plan is ready.</h1>
            <p style={{ margin: "18px 0 0", maxWidth: 560, fontSize: 17, lineHeight: 1.5, color: "#5C574B" }}>
              Solved against course bundle v2026.2 and a forecast 31°C. It is yours permanently, and it will tell you when anything changes.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 44 }}>
            {NEXT_STEPS.map((n) => (
              <Link
                key={n.name}
                href={routes.racePlan}
                className="next-step-card"
                style={{ display: "block", background: "#FBF8F2", borderRadius: 12, padding: "26px 28px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)", animation: "rise .7s cubic-bezier(.16,1,.3,1) both", animationDelay: `${n.delay}s` }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{n.kicker}</span>
                  <span className="mono" style={{ fontSize: 13, color: "#E4622F" }}>→</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 16 }}>{n.name}</div>
                <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>{n.desc}</p>
              </Link>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WHAT HAPPENS FROM HERE</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 18 }}>
                {TIMELINE.map((t) => (
                  <div key={t.when} style={{ display: "grid", gridTemplateColumns: "96px 1fr", gap: 20, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "baseline" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A8A192" }}>{t.when}</span>
                    <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#3D3A31" }}>{t.what}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>RECEIPT</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 18 }}>
                <span style={{ fontSize: 14, color: "#5C574B" }}>Race Plan · Tramuntana Full</span>
                <span className="mono" style={{ fontSize: 14 }}>$19.00</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 11 }}>
                <span style={{ fontSize: 14, color: "#5C574B" }}>VAT 20%</span>
                <span className="mono" style={{ fontSize: 14 }}>$3.80</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.1)" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Paid</span>
                <span className="mono" style={{ fontSize: 22, letterSpacing: "-.03em" }}>$22.80</span>
              </div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 16 }}>VISA ···· 4242 · 18 JUN 2026 · INV-2026-04417</div>
              <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", marginTop: 16, border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                Download invoice
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 34 }}>
            <Link href={routes.racePlan} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 52, padding: "0 28px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 16, fontWeight: 600 }}>
              Open my race plan
            </Link>
            <Link href={routes.dashboard} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 52, padding: "0 24px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 16, fontWeight: 600 }}>
              Back to dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedCheckoutPage() {
  return (
    <GuardedPage>
      <CheckoutPage />
    </GuardedPage>
  );
}
