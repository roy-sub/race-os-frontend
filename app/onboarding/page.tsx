"use client";

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { routes } from "@/lib/routes";

type Level = "first" | "improver" | "experienced";

const LEVELS: { k: Level; kicker: string; name: string; desc: string; changes: string }[] = [
  { k: "first", kicker: "MOST OF OUR ATHLETES", name: "First timer", desc: "Never finished this distance. You want to finish, and you want to know you will.", changes: "More explanation, conservative pacing, beginner bag items, expanded cut-off guidance." },
  { k: "improver", kicker: "SECOND OR THIRD", name: "Improver", desc: "You have finished before and want to do it faster and more cleanly.", changes: "Balanced margins, segment-level pacing, post-race calibration emphasised." },
  { k: "experienced", kicker: "DATA-LED", name: "Experienced", desc: "You know your numbers and want the solver to respect them, not re-derive them.", changes: "Fewer explanations, imported splits honoured, thinner margins available." },
];

const RACES_ALL = [
  { name: "Tramuntana Full", date: "21 Jun 2026", dist: "Full", prov: "OFFICIAL", official: true },
  { name: "Kalmar 70.3", date: "09 Aug 2026", dist: "70.3", prov: "OFFICIAL", official: true },
  { name: "North Shore Full", date: "27 Sep 2026", dist: "Full", prov: "OFFICIAL", official: true },
  { name: "Cala Olympic", date: "18 Oct 2026", dist: "Olympic", prov: "CROWD-VERIFIED", official: false },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<Level>("first");
  const [dist, setDist] = useState("Olympic");
  const [unit, setUnit] = useState("Metric");
  const [services, setServices] = useState({ Garmin: false, Strava: true, Wahoo: false });
  const [query, setQuery] = useState("");
  const [race, setRace] = useState(0);
  const [notifs, setNotifs] = useState({ drift: true, week: true, digest: false });

  const races = RACES_ALL.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()));

  const h2 = level === "experienced" ? "Give us your numbers." : "What do you know about yourself?";
  const p2 = level === "first"
    ? "Almost nobody knows all of these, and that is fine. Every blank one gets estimated from two plain questions instead."
    : "Type what you know, connect a service, or upload a file. Whatever you leave blank we estimate and mark as estimated.";

  const metrics = [
    { name: "Swim threshold pace", value: "1:38", unit: "/100m", dot: "#4F7C93", source: level === "first" ? "ESTIMATE IT" : "TESTED" },
    { name: "Bike threshold power", value: level === "first" ? "" : "293", unit: "w", dot: "#E4622F", source: level === "first" ? "ESTIMATE IT" : "TESTED" },
    { name: "Run threshold pace", value: "4:42", unit: "/km", dot: "#64707A", source: level === "first" ? "ESTIMATE IT" : "TESTED" },
    { name: "Weight", value: "68", unit: "kg", dot: "#C4BCAC", source: "MANUAL" },
  ].map((m) => ({
    ...m,
    srcBg: m.source === "ESTIMATE IT" ? "rgba(228,98,47,.12)" : m.source === "TESTED" ? "rgba(124,192,143,.16)" : "rgba(21,20,15,.07)",
    srcFg: m.source === "ESTIMATE IT" ? "#C6461B" : m.source === "TESTED" ? "#3E7B55" : "#5C574B",
  }));

  const services_ = [
    { name: "Garmin Connect", key: "Garmin" as const, tone: "#15140F" },
    { name: "Strava", key: "Strava" as const, tone: "#E4622F" },
    { name: "Wahoo SYSTM", key: "Wahoo" as const, tone: "#4F7C93" },
  ];

  const notifDefs = [
    { k: "drift" as const, name: "Plan drift alerts", desc: "When the forecast or your inputs move enough to change your numbers." },
    { k: "week" as const, name: "Race week reminders", desc: "Special-needs deadlines, bike check-in, and the packing checklists." },
    { k: "digest" as const, name: "Monthly digest", desc: "New course bundles and product changes. Off by default." },
  ];

  const hint = step === 1 ? "" : step === 2 ? "NOTHING HERE IS REQUIRED" : races[race] ? races[race].name.toUpperCase() : "";
  const nextLabel = step === 3 ? "Build my first plan" : step === 2 ? "Pick my race" : "Continue";

  const goNext = () => {
    if (step < 3) setStep(step + 1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ background: "rgba(241,238,232,.94)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={26} height={17} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[1, 2, 3].map((n) => (
                <span key={n} style={{ width: n === step ? 26 : 8, height: 4, borderRadius: 2, background: n <= step ? "#E4622F" : "rgba(21,20,15,.14)", transition: "all .5s cubic-bezier(.16,1,.3,1)" }} />
              ))}
            </div>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", whiteSpace: "nowrap" }}>STEP {step} OF 3</span>
            <Link href={routes.dashboard} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>SKIP FOR NOW</Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "60px 48px 96px" }}>
        {step === 1 && (
          <div style={{ animation: "rise .6s cubic-bezier(.16,1,.3,1) both" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 1 OF 3 · 40 SECONDS</div>
            <h1 style={{ margin: "14px 0 0", fontSize: 52, lineHeight: 1, fontWeight: 600, letterSpacing: "-.048em" }}>Who are we solving for?</h1>
            <p style={{ margin: "15px 0 0", maxWidth: 540, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>This decides how much the solver explains, and how conservative it is by default. You can change it later.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 38 }}>
              {LEVELS.map((l) => {
                const on = level === l.k;
                return (
                  <div key={l.k} onClick={() => setLevel(l.k)} style={{ borderRadius: 12, padding: "28px 28px 30px", cursor: "pointer", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.1)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: on ? "#E4622F" : "#8C8578" }}>{l.kicker}</span>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${on ? "#E4622F" : "rgba(21,20,15,.24)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E4622F" }} />}
                      </span>
                    </div>
                    <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.03em", marginTop: 16, color: on ? "#FBF8F2" : "#15140F" }}>{l.name}</div>
                    <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.5, color: on ? "rgba(251,248,242,.58)" : "#5C574B" }}>{l.desc}</p>
                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${on ? "rgba(251,248,242,.14)" : "rgba(21,20,15,.09)"}` }}>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: on ? "#E4622F" : "#8C8578" }}>WHAT CHANGES</div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: on ? "rgba(251,248,242,.58)" : "#5C574B", marginTop: 8 }}>{l.changes}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>LONGEST DISTANCE FINISHED</div>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {["None yet", "Sprint", "Olympic", "70.3", "Full"].map((d) => {
                    const sel = dist === d;
                    return (
                      <div key={d} onClick={() => setDist(d)} className="row-hover-border" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 7, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}`, fontSize: 13.5, fontWeight: sel ? 600 : 500, color: sel ? "#FBF8F2" : "#5C574B", whiteSpace: "nowrap" }}>{d}</div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>UNITS</div>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  {["Metric", "Imperial"].map((u) => {
                    const sel = unit === u;
                    return (
                      <div key={u} onClick={() => setUnit(u)} className="row-hover-border" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 7, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}`, fontSize: 13.5, fontWeight: sel ? 600 : 500, color: sel ? "#FBF8F2" : "#5C574B", whiteSpace: "nowrap" }}>{u}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: "rise .6s cubic-bezier(.16,1,.3,1) both" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 2 OF 3</div>
            <h1 style={{ margin: "14px 0 0", fontSize: 52, lineHeight: 1, fontWeight: 600, letterSpacing: "-.048em" }}>{h2}</h1>
            <p style={{ margin: "15px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>{p2}</p>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: 14, marginTop: 38 }}>
              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 116px", gap: 18, padding: "20px 0 12px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                  <span>METRIC</span><span>VALUE</span><span style={{ textAlign: "right" }}>SOURCE</span>
                </div>
                {metrics.map((m) => (
                  <div key={m.name} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 116px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, flex: "none" }} />
                      <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{m.name}</span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", height: 38, padding: "0 12px", border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, background: "#fff" }}>
                      <input type="text" defaultValue={m.value} className="mono" style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontSize: 14, color: "#15140F", padding: 0, outline: "none" }} />
                      <span className="mono" style={{ fontSize: 10, color: "#A8A192", whiteSpace: "nowrap" }}>{m.unit}</span>
                    </span>
                    <span style={{ textAlign: "right" }}>
                      <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "5px 9px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap", background: m.srcBg, color: m.srcFg }}>{m.source}</span>
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 20, padding: "15px 17px", borderRadius: 9, background: "rgba(21,20,15,.04)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4BCAC", flex: "none" }} />
                  <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "#5C574B" }}>Leave anything blank and we estimate it from two plain questions. Estimated values are marked wherever they appear.</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>OR CONNECT A SERVICE</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                    {services_.map((sv) => {
                      const on = services[sv.key];
                      return (
                        <div
                          key={sv.key}
                          onClick={() => setServices((prev) => ({ ...prev, [sv.key]: !prev[sv.key] }))}
                          className="row-hover-border"
                          style={{ display: "flex", alignItems: "center", gap: 12, height: 46, padding: "0 15px", borderRadius: 8, cursor: "pointer", background: on ? "rgba(124,192,143,.09)" : "#fff", border: `1px solid ${on ? "rgba(124,192,143,.42)" : "rgba(21,20,15,.14)"}` }}
                        >
                          <span style={{ width: 20, height: 20, borderRadius: 5, background: sv.tone, flex: "none" }} />
                          <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>{sv.name}</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: ".12em", color: on ? "#3E7B55" : "#A8A192", whiteSpace: "nowrap" }}>{on ? "CONNECTED" : "CONNECT"}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#8C8578", marginTop: 14 }}>No feature is gated behind a connection. All three paths reach the same solver.</div>
                </div>
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>UPLOAD A FILE</div>
                  <div className="upload-dash" style={{ marginTop: 14, padding: "22px 20px", border: "1px dashed rgba(21,20,15,.22)", borderRadius: 9, textAlign: "center", cursor: "pointer" }}>
                    <svg width="19" height="19" viewBox="0 0 18 18" fill="none" style={{ margin: "0 auto", display: "block" }}><path d="M9 12.5V3.5M9 3.5 5.5 7M9 3.5 12.5 7" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /><path d="M3 12v2.5h12V12" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 11 }}>FIT, TCX or GPX</div>
                    <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 4 }}>We read threshold values, not your whole history</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: "rise .6s cubic-bezier(.16,1,.3,1) both" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 3 OF 3</div>
            <h1 style={{ margin: "14px 0 0", fontSize: 52, lineHeight: 1, fontWeight: 600, letterSpacing: "-.048em" }}>What are you training for?</h1>
            <p style={{ margin: "15px 0 0", maxWidth: 540, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Pick your next race and we will hold it on your dashboard with a countdown. You can add more later.</p>

            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", marginTop: 38, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, height: 48, padding: "0 15px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search 412 courses" style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                {races.map((r, i) => {
                  const sel = race === i;
                  return (
                    <div key={r.name} onClick={() => setRace(i)} className="row-hover-border" style={{ display: "grid", gridTemplateColumns: "24px 1.5fr 1fr .8fr 90px", gap: 16, alignItems: "center", padding: "14px 14px", borderRadius: 8, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.12)"}` }}>
                      <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${sel ? "#E4622F" : "rgba(21,20,15,.24)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        {sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E4622F" }} />}
                      </span>
                      <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-.02em", color: sel ? "#FBF8F2" : "#15140F", whiteSpace: "nowrap" }}>{r.name}</span>
                      <span className="mono" style={{ fontSize: 13, color: sel ? "rgba(251,248,242,.55)" : "#5C574B" }}>{r.date}</span>
                      <span className="mono" style={{ fontSize: 13, color: sel ? "rgba(251,248,242,.55)" : "#5C574B" }}>{r.dist}</span>
                      <span className="mono" style={{ textAlign: "right", fontSize: 9, letterSpacing: ".12em", color: sel ? "rgba(251,248,242,.42)" : r.official ? "#3E7B55" : "#A8A192", whiteSpace: "nowrap" }}>{r.prov}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
              {notifDefs.map((n) => {
                const on = notifs[n.k];
                return (
                  <div key={n.k} onClick={() => setNotifs((prev) => ({ ...prev, [n.k]: !prev[n.k] }))} style={{ borderRadius: 12, padding: "22px 24px", cursor: "pointer", background: on ? "rgba(228,98,47,.06)" : "#FBF8F2", border: `1px solid ${on ? "rgba(228,98,47,.32)" : "rgba(21,20,15,.1)"}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.022em" }}>{n.name}</div>
                        <div style={{ fontSize: 13, lineHeight: 1.45, color: "#6B6455", marginTop: 7 }}>{n.desc}</div>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", width: 40, height: 24, borderRadius: 12, flex: "none", background: on ? "#E4622F" : "rgba(21,20,15,.16)", padding: 3 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 34 }}>
          <div onClick={() => setStep((s) => Math.max(1, s - 1))} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", gap: 9, whiteSpace: "nowrap", height: 48, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, fontSize: 14.5, fontWeight: 600, cursor: "pointer", visibility: step === 1 ? "hidden" : "visible" }}>
            <span className="mono" style={{ fontSize: 13 }}>←</span>Back
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>{hint}</span>
            {step < 3 ? (
              <div onClick={goNext} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", height: 48, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                {nextLabel}<span className="mono" style={{ fontSize: 13 }}>→</span>
              </div>
            ) : (
              <Link href={routes.planBuilder} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", height: 48, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 14.5, fontWeight: 600 }}>
                {nextLabel}<span className="mono" style={{ fontSize: 13 }}>→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
