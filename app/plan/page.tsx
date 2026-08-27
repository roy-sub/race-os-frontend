"use client";

import { useMemo, useState } from "react";
import { AccountHeader } from "@/components/AccountHeader";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import {
  AID_PLAN,
  AID_TICKS,
  AID_TICK_KMS,
  BAGS,
  BIKE,
  BIKE_START,
  CONSTRAINTS,
  FUEL_MARKS,
  GATES,
  HEAT_ROWS,
  RUN,
  SEGS,
  SEG_NOTES,
  SWIM,
  WORST,
  buildElevation,
  buildFuelBars,
  fmtClock,
  wallClock,
  type ConstraintKey,
} from "@/lib/racePlan";

const TABS: { key: string; name: string; locked?: boolean }[] = [
  { key: "feas", name: "Feasibility" },
  { key: "pacing", name: "Pacing" },
  { key: "fuel", name: "Fuelling" },
  { key: "bags", name: "Bags" },
  { key: "course", name: "Course" },
  { key: "cond", name: "Conditions" },
  { key: "review", name: "Review", locked: true },
];

const CHECK = (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function WhyButton({ onClick }: { onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      className="why-btn"
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: "50%", border: "1px solid rgba(21,20,15,.22)", fontSize: 9.5, color: "#8C8578", cursor: "pointer" }}
    >
      ?
    </span>
  );
}

export default function RacePlanPage() {
  const [tab, setTab] = useState("feas");
  const [drawerKey, setDrawerKey] = useState<ConstraintKey | null>(null);
  const [bagIdx, setBagIdx] = useState(1);
  const [itemsDone, setItemsDone] = useState<Record<string, boolean>>({});
  const [prof, setProf] = useState(0.31);

  const el = useMemo(() => buildElevation(), []);
  const fuelBars = useMemo(() => buildFuelBars(), []);
  const d = drawerKey ? CONSTRAINTS[drawerKey] : null;

  const mn = Math.min(...el);
  const mx = Math.max(...el);
  const X = (i: number) => (i / (el.length - 1)) * 1180;
  const Y = (v: number) => 224 - ((v - mn) / (mx - mn)) * 196;
  const profLine = el.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  const profArea = profLine + " L 1180 228 L 0 228 Z";
  const pi = Math.round(prof * (el.length - 1));
  const grad = pi > 0 ? ((el[pi] - el[pi - 1]) / (180200 / el.length)) * 100 : 0;
  const km = 180.2 * prof;
  const seg = SEGS.find((s) => km >= s.from && km <= s.to) || SEGS[SEGS.length - 1];

  const onProfile = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setProf(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const ladder = (() => {
    const tops = GATES.reduce<number[]>((acc, g) => {
      const prevTop = acc.length ? acc[acc.length - 1] : -Infinity;
      const raw = (g.eta / 960) * 300 + 6;
      acc.push(Math.max(raw, prevTop + 52));
      return acc;
    }, []);
    return GATES.map((g, i) => {
      const m = g.limit - g.eta;
      return {
        name: g.name, limit: fmtClock(g.limit), eta: fmtClock(g.eta), clock: wallClock(g.eta),
        margin: fmtClock(m), tightest: m === WORST,
        color: m < 0 ? "#C0392B" : m < 20 ? "#E0A33C" : "#7CC08F",
        top: tops[i].toFixed(0) + "px",
      };
    });
  })();

  const constraintKeys = (Object.keys(CONSTRAINTS) as ConstraintKey[]).sort(
    (a, b) => (CONSTRAINTS[b].binding ? 1 : 0) - (CONSTRAINTS[a].binding ? 1 : 0)
  );
  const bindingCount = constraintKeys.filter((k) => CONSTRAINTS[k].binding).length;

  const bikeElapsed = (i: number) => fmtClock(BIKE_START + SEGS.slice(0, i + 1).reduce((a, b) => a + b.min, 0));

  const legs = [
    {
      name: "Swim", dist: "3.8 KM", target: "1:44/100m", split: fmtClock(SWIM), metric: "PACE", color: "#4F7C93", tint: "rgba(79,124,147,.13)", why: "swim" as ConstraintKey,
      rows: [
        { name: "Lap 1", dist: "1.9 km", terrain: "Outbound, sighting the headland", metric: "1:42", elapsed: "0:32", zone: "Z2", zoneW: "54%" },
        { name: "Lap 2", dist: "1.9 km", terrain: "Current pushes inside", metric: "1:46", elapsed: "1:06", zone: "Z2", zoneW: "50%" },
      ],
    },
    {
      name: "Bike", dist: "180.2 KM", target: "208 w", split: fmtClock(BIKE), metric: "POWER", color: "#E4622F", tint: "rgba(228,98,47,.13)", why: "ftp" as ConstraintKey,
      rows: SEGS.map((s, i) => ({ name: s.name, dist: `km ${s.from}–${s.to}`, terrain: s.terrain, metric: s.w + " w", zone: s.zone, zoneW: s.zw, elapsed: bikeElapsed(i) })),
    },
    {
      name: "Run", dist: "42.2 KM", target: "6:12/km", split: fmtClock(RUN), metric: "PACE", color: "#64707A", tint: "rgba(100,112,122,.13)", why: "heat" as ConstraintKey,
      rows: [
        { name: "Lap 1", dist: "10.55 km", terrain: "Marina ramp, hold back", metric: "6:04", elapsed: "8:38", zone: "Z2", zoneW: "58%" },
        { name: "Lap 2", dist: "10.55 km", terrain: "First caffeine at km 12", metric: "6:10", elapsed: "9:43", zone: "Z2", zoneW: "56%" },
        { name: "Lap 3", dist: "10.55 km", terrain: "Special needs at km 21", metric: "6:15", elapsed: "10:49", zone: "Z2", zoneW: "53%" },
        { name: "Lap 4", dist: "10.55 km", terrain: "Unlit after km 30", metric: "6:15", elapsed: "11:45", zone: "Z2", zoneW: "53%" },
      ],
    },
  ];

  const fuelRates = [
    { label: "CARBOHYDRATE", value: "78", unit: "g/hr", of: "CEILING 90", pct: "87%", w: "87%", color: "#E4622F", why: "gut" as ConstraintKey, delay: 0 },
    { label: "FLUID", value: "760", unit: "ml/hr", of: "SWEAT 1,300", pct: "58%", w: "58%", color: "#4F7C93", why: "sweat" as ConstraintKey, delay: 0.07 },
    { label: "SODIUM", value: "950", unit: "mg/hr", of: "LOSS 1,140", pct: "83%", w: "83%", color: "#B5762A", why: "sweat" as ConstraintKey, delay: 0.14 },
    { label: "CAFFEINE", value: "400", unit: "mg total", of: "TOLERANCE 480", pct: "83%", w: "83%", color: "#64707A", why: "caff" as ConstraintKey, delay: 0.21 },
  ];

  const B = BAGS[bagIdx];
  const packedCount = 0; // packing checkboxes are per-item here; whole-bag packed state isn't tracked separately in the port
  const zoneBands = SEGS.map((s) => ({
    x: ((s.from / 180.2) * 1180).toFixed(1),
    w: (((s.to - s.from) / 180.2) * 1180).toFixed(1),
    fill: s.zone === "Z3" ? "rgba(228,98,47,.07)" : s.zone === "Z1" ? "rgba(21,20,15,.02)" : "rgba(228,98,47,.03)",
  }));
  const aidTicks = AID_TICKS.map((a, i) => ({ ...a, x: ((AID_TICK_KMS[i] / 180.2) * 1180).toFixed(1) }));

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="racePlan" />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "34px 56px 0" }}>
        <div className="mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", marginBottom: 26 }}>
          <a href={routes.dashboard} style={{ color: "#8C8578" }}>DASHBOARD</a><span>/</span><a href={routes.myPlans} style={{ color: "#8C8578" }}>MY PLANS</a><span>/</span><span style={{ color: "#15140F" }}>TRAMUNTANA FULL</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 56, alignItems: "end" }}>
          <div>
            <Reveal style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: "1px solid rgba(124,192,143,.5)", borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: "#3E7B55" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F", animation: "breathe 2.6s ease-in-out infinite" }} />PLAN READY
              </span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>v3 · SOLVED 18 JUN · BUNDLE v2026.2</span>
            </Reveal>
            <Reveal as="h1" delay={0.05} style={{ whiteSpace: "nowrap", margin: 0, fontSize: 72, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em" }}>Tramuntana Full</Reveal>
            <Reveal delay={0.1} style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 15.5, color: "#5C574B", whiteSpace: "nowrap" }}>
              <span>Sunday 21 June 2026</span><span style={{ color: "#C4BCAC" }}>·</span><span>Port de Pollença</span><span style={{ color: "#C4BCAC" }}>·</span><span>06:40 rolling start</span>
            </Reveal>
          </div>
          <Reveal delay={0.14} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span className="mono" style={{ fontSize: 64, lineHeight: 0.82, letterSpacing: "-.05em" }}>6</span>
              <span className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#8C8578" }}>DAYS OUT</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href="#" className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Race card</a>
              <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Export</a>
              <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Share</a>
              <div className="btn-outline-dark2 mono" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, cursor: "pointer", fontSize: 15, color: "#5C574B" }}>⋯</div>
            </div>
          </Reveal>
        </div>

        <Reveal style={{ position: "relative", background: "#191713", borderRadius: 12, padding: "24px 28px", marginTop: 36, overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
          <div style={{ position: "absolute", right: -90, top: -120, width: 400, height: 400, background: "radial-gradient(closest-side,rgba(224,163,60,.16),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 44 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C", animation: "breathe 2.6s ease-in-out infinite" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#E0A33C" }}>NEEDS REVIEW · 2 INPUTS CHANGED</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12, color: "#FBF8F2" }}>Your gut ceiling and sweat rate moved since this was solved.</div>
              <div className="mono" style={{ display: "flex", gap: 26, marginTop: 14, fontSize: 12.5, color: "rgba(251,248,242,.5)" }}>
                <span>GUT CEILING <span style={{ textDecoration: "line-through" }}>82</span> → <span style={{ color: "#E0A33C" }}>90 g/hr</span></span>
                <span>SWEAT RATE <span style={{ textDecoration: "line-through" }}>1.1</span> → <span style={{ color: "#E0A33C" }}>1.3 L/hr</span></span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flex: "none" }}>
              <a href="#" className="btn-outline-fade" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(251,248,242,.24)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, color: "#FBF8F2" }}>Dismiss</a>
              <a href="#" className="btn-drift-apply" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 20px", background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Re-solve as v4</a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Tabs ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 60, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.09)", marginTop: 40 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <div
                  key={t.key}
                  onClick={() => { setTab(t.key); setDrawerKey(null); }}
                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, height: 54, padding: "0 15px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#15140F" : "#6B6455" }}>{t.name}</span>
                  {t.locked && (
                    <svg width="10" height="11" viewBox="0 0 12 13" fill="none" style={{ flex: "none" }}>
                      <rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" stroke="#A8A192" strokeWidth={1.4} />
                      <path d="M3.8 5.5V3.9a2.2 2.2 0 0 1 4.4 0v1.6" stroke="#A8A192" strokeWidth={1.4} />
                    </svg>
                  )}
                  <span style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 2, background: active ? "#E4622F" : "transparent" }} />
                </div>
              );
            })}
          </div>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578", whiteSpace: "nowrap" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />GOAL 11:45 · RISK BALANCED
          </div>
        </div>
      </div>

      {/* ---------------- Feasibility ---------------- */}
      {tab === "feas" && (
        <section style={{ padding: "80px 0 88px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 420px", gap: 26, alignItems: "start" }}>
              <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
                <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "34px 36px 30px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3E7B55" }} />
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#3E7B55" }}>CLEARS EVERY CUT-OFF</span>
                  </div>
                  <p style={{ margin: "16px 0 0", maxWidth: 560, fontSize: 34, lineHeight: 1.14, fontWeight: 500, letterSpacing: "-.038em" }}>
                    You clear the swim exit with 1:14 in hand. It is the barrier that binds first.
                  </p>
                  <div style={{ position: "relative", marginTop: 40, height: 300 }}>
                    <div style={{ position: "absolute", left: 132, top: 6, bottom: 6, width: 2, background: "rgba(21,20,15,.1)" }} />
                    {ladder.map((g) => (
                      <div key={g.name} style={{ position: "absolute", left: 0, right: 0, top: g.top }}>
                        <div style={{ position: "absolute", left: 0, top: -1, width: 118, textAlign: "right" }}>
                          <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192" }}>{g.clock}</div>
                          <div className="mono" style={{ fontSize: 16, marginTop: 3 }}>{g.eta}</div>
                        </div>
                        <span style={{ position: "absolute", left: 126, top: 5, width: 13, height: 13, borderRadius: "50%", background: g.color, border: "3px solid #FBF8F2", boxShadow: `0 0 0 1.5px ${g.color}` }} />
                        <div style={{ marginLeft: 164 }}>
                          <div style={{ fontSize: 16.5, fontWeight: 500, letterSpacing: "-.022em", whiteSpace: "nowrap" }}>{g.name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5 }}>
                            <span className="mono" style={{ fontSize: 11, color: "#A8A192" }}>LIMIT {g.limit}</span>
                            <span className="mono" style={{ fontSize: 13, color: g.color }}>{g.margin} in hand</span>
                            {g.tightest && <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "3px 7px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#5C574B" }}>BINDS FIRST</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>CONTINGENCY BUDGET</span>
                    <span style={{ fontSize: 15, color: "#3D3A31" }}>You can lose <span className="mono">1:14</span> to punctures, transitions and bad patches before anything fails.</span>
                    <a href={routes.dashboard} className="mono link-accent" style={{ marginLeft: "auto", fontSize: 9.5, letterSpacing: ".13em", color: "#C6461B", whiteSpace: "nowrap" }}>MODEL IT →</a>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578" }}>CONSTRAINTS</span>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192" }}>{bindingCount} BINDING · {constraintKeys.length - bindingCount} SLACK</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {constraintKeys.map((k) => {
                    const c = CONSTRAINTS[k];
                    return (
                      <div
                        key={k}
                        onClick={() => setDrawerKey(k)}
                        className="row-hover-border"
                        style={{ background: c.binding ? "rgba(228,98,47,.06)" : "#FBF8F2", border: `1px solid ${c.binding ? "rgba(228,98,47,.3)" : "rgba(21,20,15,.1)"}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.binding ? "#E4622F" : "#C4BCAC", flex: "none" }} />
                          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{c.name}</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 13.5, color: "#15140F", whiteSpace: "nowrap" }}>{c.value}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, paddingLeft: 15 }}>
                          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{c.source}</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: ".13em", color: c.binding ? "#C6461B" : "#A8A192" }}>{c.binding ? "BINDING" : "SLACK"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, padding: "0 4px", fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>Tap any constraint to see what it produced. Every solved number on this plan traces back to one of these.</div>
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Pacing ---------------- */}
      {tab === "pacing" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Twelve segments, one race.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>HEAT ADJUSTED · 1.03 POSITIVE SPLIT ON THE RUN</Reveal>
          </div>
          {legs.map((l) => (
            <Reveal key={l.name} style={{ marginBottom: 16, background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, paddingBottom: 18, borderBottom: "1px solid rgba(21,20,15,.09)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 6, background: l.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: l.color }} />
                  </span>
                  <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.032em" }}>{l.name}</span>
                  <span className="mono" style={{ fontSize: 11, letterSpacing: ".11em", color: "#A8A192" }}>{l.dist}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>TARGET</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7, justifyContent: "flex-end", marginTop: 5 }}>
                      <span className="mono" style={{ fontSize: 22, letterSpacing: "-.03em" }}>{l.target}</span>
                      <WhyButton onClick={() => setDrawerKey(l.why)} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>SPLIT</div>
                    <div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 5 }}>{l.split}</div>
                  </div>
                </div>
              </div>
              <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1fr .9fr .9fr 88px", gap: 18, padding: "14px 0 10px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>
                <span>SEGMENT</span><span>DISTANCE</span><span>TERRAIN</span><span>{l.metric}</span><span>ELAPSED</span><span style={{ textAlign: "right" }}>ZONE</span>
              </div>
              {l.rows.map((r) => (
                <div key={r.name} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1fr .9fr .9fr 88px", gap: 18, padding: "13px 0", borderTop: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{r.name}</span>
                  <span className="mono" style={{ fontSize: 13, color: "#5C574B" }}>{r.dist}</span>
                  <span style={{ fontSize: 13.5, color: "#6B6455" }}>{r.terrain}</span>
                  <span className="mono" style={{ fontSize: 14 }}>{r.metric}</span>
                  <span className="mono" style={{ fontSize: 13, color: "#5C574B" }}>{r.elapsed}</span>
                  <span style={{ justifySelf: "end", display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 34, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: r.zoneW, background: l.color, borderRadius: 2 }} />
                    </span>
                    <span className="mono" style={{ fontSize: 11, color: "#6B6455" }}>{r.zone}</span>
                  </span>
                </div>
              ))}
            </Reveal>
          ))}
        </section>
      )}

      {/* ---------------- Fuelling ---------------- */}
      {tab === "fuel" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>852 grams of carbohydrate.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>HELD UNDER A MEASURED 90 G/HR CEILING</Reveal>
          </div>

          <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "30px 32px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 22 }}>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578" }}>INTAKE TIMELINE · 00:00 → 11:45</span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192" }}>BAR HEIGHT = G CARB IN THAT 15 MIN</span>
            </div>
            <div style={{ position: "relative", height: 150, display: "flex", alignItems: "flex-end", gap: 2 }}>
              {fuelBars.map((b, i) => (
                <div key={i} style={{ flex: 1, height: b.h, background: b.color, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
              ))}
              <span style={{ position: "absolute", left: 0, right: 0, top: (150 - (22.5 / 24) * 150).toFixed(0) + "px", height: 1, background: "rgba(192,57,43,.4)" }} />
              <span className="mono" style={{ position: "absolute", right: 0, top: (150 - (22.5 / 24) * 150 - 15).toFixed(0) + "px", fontSize: 8.5, letterSpacing: ".13em", color: "#C0392B" }}>GUT CEILING 22.5 G / 15 MIN</span>
            </div>
            <div style={{ position: "relative", height: 46, marginTop: 10, borderTop: "1px solid rgba(21,20,15,.1)" }}>
              {FUEL_MARKS.map((m) => (
                <div key={m.label} style={{ position: "absolute", left: m.left, top: 0, transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                  <span style={{ display: "block", width: 1, height: 7, background: "rgba(21,20,15,.2)", margin: "0 auto" }} />
                  <span className="mono" style={{ display: "block", fontSize: 9.5, color: "#5C574B", marginTop: 5 }}>{m.clock}</span>
                  <span className="mono" style={{ display: "block", fontSize: 8.5, letterSpacing: ".11em", color: "#A8A192", marginTop: 3 }}>{m.label}</span>
                </div>
              ))}
            </div>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 16 }}>
            {fuelRates.map((r) => (
              <Reveal key={r.label} delay={r.delay} style={{ background: "#FBF8F2", borderRadius: 11, padding: "22px 24px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{r.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 14 }}>
                  <span className="mono" style={{ fontSize: 34, letterSpacing: "-.04em" }}>{r.value}</span>
                  <span className="mono" style={{ fontSize: 12, color: "#8C8578" }}>{r.unit}</span>
                  <span style={{ marginLeft: "auto" }}><WhyButton onClick={() => setDrawerKey(r.why)} /></span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", marginTop: 16, position: "relative", overflow: "hidden" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: r.w, background: r.color, borderRadius: 2 }} />
                </div>
                <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 9, fontSize: 9, color: "#A8A192" }}>
                  <span>{r.of}</span><span>{r.pct}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal style={{ marginTop: 16, background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div className="mono" style={{ display: "grid", gridTemplateColumns: "110px 1.3fr 1.6fr 1fr", gap: 20, padding: "20px 0 12px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>AT</span><span>STATION</span><span>YOUR ACTION</span><span style={{ textAlign: "right" }}>RUNNING TOTAL</span>
            </div>
            {AID_PLAN.map((a) => (
              <div key={a.name} className="row-hover-tint" style={{ display: "grid", gridTemplateColumns: "110px 1.3fr 1.6fr 1fr", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                <span className="mono" style={{ fontSize: 13, color: "#5C574B" }}>{a.at}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 15, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.dot, flex: "none" }} />{a.name}
                </span>
                <span style={{ fontSize: 14, color: "#3D3A31" }}>{a.action}</span>
                <span className="mono" style={{ textAlign: "right", fontSize: 13, color: "#5C574B" }}>{a.total}</span>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* ---------------- Bags ---------------- */}
      {tab === "bags" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Five bags. Every item reasoned.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>{packedCount} OF 5 PACKED</Reveal>
          </div>
          <Reveal style={{ display: "grid", gridTemplateColumns: "296px minmax(0,1fr)", borderRadius: 12, overflow: "hidden", background: "#EAE3D6" }}>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 2 }}>
              {BAGS.map((b, k) => {
                const selected = k === bagIdx;
                return (
                  <div key={b.name} onClick={() => setBagIdx(k)} className={selected ? "" : "row-hover"} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 17px", borderRadius: 8, cursor: "pointer", background: selected ? "#15140F" : "transparent", color: selected ? "#FBF8F2" : "#15140F" }}>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: selected ? "rgba(255,255,255,.45)" : "#8C8578" }}>{"0" + (k + 1)}</span>
                    <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.028em", whiteSpace: "nowrap" }}>{b.name}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 9.5, color: selected ? "rgba(255,255,255,.45)" : "#8C8578" }}>{b.items.length} items</span>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#FBF8F2", padding: "32px 34px 34px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, paddingBottom: 20, borderBottom: "1px solid rgba(21,20,15,.09)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>{B.name}</span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>{B.when}</span>
                </div>
                <a href="#" className="mono link-accent" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#C6461B", whiteSpace: "nowrap" }}>PRINT THIS BAG →</a>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 40px" }}>
                {B.items.map((it, k) => {
                  const key = bagIdx + ":" + k;
                  const done = !!itemsDone[key];
                  return (
                    <div key={it.name} onClick={() => setItemsDone((prev) => ({ ...prev, [key]: !prev[key] }))} style={{ display: "flex", gap: 14, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", cursor: "pointer", alignItems: "flex-start" }}>
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: `1px solid ${done ? "#5C9E72" : "rgba(21,20,15,.22)"}`, background: done ? "#5C9E72" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", marginTop: 2 }}>
                        {done && CHECK}
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                          <span style={{ fontSize: 15.5, color: done ? "#A8A192" : "#15140F" }}>{it.name}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#8C8578", whiteSpace: "nowrap" }}>{it.qty}</span>
                        </span>
                        {it.note && <span style={{ display: "block", fontSize: 13, lineHeight: 1.45, color: "#8C8578", marginTop: 5 }}>{it.note}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------- Course ---------------- */}
      {tab === "course" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Your targets on the terrain.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>HOVER THE PROFILE · BIKE LEG</Reveal>
          </div>
          <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div onMouseMove={onProfile} style={{ position: "relative", cursor: "crosshair" }}>
              <svg viewBox="0 0 1180 300" style={{ display: "block", width: "100%", height: "auto" }}>
                {zoneBands.map((z, i) => (
                  <rect key={i} x={z.x} y={16} width={z.w} height={212} fill={z.fill} />
                ))}
                <path d={profArea} fill="rgba(228,98,47,.13)" />
                <path d={profLine} fill="none" stroke="#E4622F" strokeWidth={1.8} strokeLinejoin="round" />
                <line x1={0} y1={228} x2={1180} y2={228} stroke="rgba(21,20,15,.16)" strokeWidth={1} />
                {aidTicks.map((a) => (
                  <g key={a.label}>
                    <line x1={a.x} y1={228} x2={a.x} y2={238} stroke="rgba(21,20,15,.3)" strokeWidth={1} />
                    <circle cx={a.x} cy={228} r={3.6} fill="#FBF8F2" stroke="rgba(21,20,15,.45)" strokeWidth={1.4} />
                    <text x={a.x} y={256} textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize={10} letterSpacing={1}>{a.km}</text>
                    <text x={a.x} y={272} textAnchor="middle" fill="#8C8578" fontFamily="JetBrains Mono, monospace" fontSize={9.5} letterSpacing={1}>{a.label}</text>
                  </g>
                ))}
                <line x1={X(pi).toFixed(1)} y1={16} x2={X(pi).toFixed(1)} y2={228} stroke="rgba(21,20,15,.4)" strokeWidth={1} />
                <circle cx={X(pi).toFixed(1)} cy={Y(el[pi]).toFixed(1)} r={6} fill="#E4622F" stroke="#FBF8F2" strokeWidth={2.6} />
              </svg>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 24, marginTop: 22, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.09)" }}>
              <div><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>DISTANCE</div><div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 7 }}>{km.toFixed(1)}<span style={{ fontSize: 12, color: "#8C8578" }}> km</span></div></div>
              <div><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>ELEVATION</div><div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 7 }}>{Math.round(el[pi])}<span style={{ fontSize: 12, color: "#8C8578" }}> m</span></div></div>
              <div><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>GRADIENT</div><div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 7, color: "#E4622F" }}>{grad.toFixed(1)}<span style={{ fontSize: 12 }}>%</span></div></div>
              <div><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>YOUR TARGET</div><div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 7 }}>{seg.w}<span style={{ fontSize: 12, color: "#8C8578" }}> w</span></div></div>
              <div><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>CLOCK HERE</div><div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 7 }}>{wallClock(BIKE_START + BIKE * prof)}</div></div>
            </div>
            <div style={{ marginTop: 20, padding: "16px 18px", borderRadius: 9, background: "rgba(21,20,15,.04)", fontSize: 14.5, lineHeight: 1.5, color: "#3D3A31" }}>{SEG_NOTES[seg.name]}</div>
          </Reveal>
        </section>
      )}

      {/* ---------------- Conditions ---------------- */}
      {tab === "cond" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What the day is likely to do.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>FORECAST REPLACES HISTORY AT 72 HOURS</Reveal>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
            <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>THURSDAY FORECAST</span>
                <span className="mono" style={{ fontSize: 9.5, color: "#A8A192" }}>UPDATED 14:20</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 20 }}>
                <span className="mono" style={{ fontSize: 62, lineHeight: 0.85, letterSpacing: "-.05em" }}>31°</span>
                <span style={{ fontSize: 15, color: "#6B6455" }}>feels 34° at 14:00</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px 26px", marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                {[{ l: "WIND", v: "21 km/h NE" }, { l: "HUMIDITY", v: "64%" }, { l: "WATER", v: "23.1°C" }, { l: "UV INDEX", v: "9 · high" }].map((s) => (
                  <div key={s.l}><div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{s.l}</div><div className="mono" style={{ fontSize: 18, marginTop: 7 }}>{s.v}</div></div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 24, padding: "15px 17px", borderRadius: 9, background: "rgba(79,124,147,.09)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7C93", flex: "none" }} />
                <span style={{ fontSize: 14, color: "#3D3A31" }}>Wetsuit verdict: <span style={{ fontWeight: 500 }}>non-wetsuit, 82% confidence</span></span>
              </div>
            </Reveal>
            <Reveal delay={0.08} style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>HOW HEAT MOVED YOUR PLAN</div>
              <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
                {HEAT_ROWS.map((h) => (
                  <div key={h.name} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 20px 1fr", gap: 14, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "baseline" }}>
                    <span style={{ fontSize: 15 }}>{h.name}</span>
                    <span className="mono" style={{ fontSize: 14, color: "#A8A192", textDecoration: "line-through" }}>{h.from}</span>
                    <span className="mono" style={{ fontSize: 13, color: "#C4BCAC" }}>→</span>
                    <span className="mono" style={{ fontSize: 14 }}>{h.to}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(224,163,60,.11)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
                Water has been above the 24.5°C wetsuit limit in nine of eleven editions. Plan for a non-wetsuit swim and treat the wetsuit as the exception.
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------------- Review (locked) ---------------- */}
      {tab === "review" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <Reveal style={{ position: "relative", borderRadius: 14, overflow: "hidden", padding: "56px 52px 52px" }}>
            <MediaPlaceholder path="assets/plan/review-locked.jpg" background="linear-gradient(125deg,#3B322A 0%,#1B1712 62%,#100E0C 100%)" style={{ position: "absolute", inset: 0 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(12,11,10,.86),rgba(12,11,10,.4))" }} />
            <div className="mono" style={{ position: "absolute", left: 52, top: 22, fontSize: 9, letterSpacing: ".16em", color: "rgba(255,255,255,.32)" }}>ASSETS/PLAN/REVIEW-LOCKED.JPG · 21:9</div>
            <div style={{ position: "relative" }}>
              <div className="mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 9.5, letterSpacing: ".17em", color: "rgba(255,255,255,.45)", marginBottom: 20 }}>
                <svg width="11" height="12" viewBox="0 0 12 13" fill="none" style={{ flex: "none" }}><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" stroke="rgba(255,255,255,.45)" strokeWidth={1.4} /><path d="M3.8 5.5V3.9a2.2 2.2 0 0 1 4.4 0v1.6" stroke="rgba(255,255,255,.45)" strokeWidth={1.4} /></svg>
                LOCKED · SEASON PASS
              </div>
              <h3 style={{ margin: 0, maxWidth: 620, fontSize: 42, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-.045em", color: "#FBF8F2" }}>After Sunday, this tab turns your estimates into measurements.</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(255,255,255,.1)", borderRadius: 9, overflow: "hidden", marginTop: 36, maxWidth: 820 }}>
                {[
                  { t: "PLAN VS ACTUAL", d: "Every segment, side by side, with where you drifted and by how much." },
                  { t: "CONSTRAINT CALIBRATION", d: "Gut ceiling, sweat rate and heat decoupling stop being estimates." },
                  { t: "WHAT TO CHANGE", d: "Three ranked changes for the next race, not a wall of charts." },
                ].map((c) => (
                  <div key={c.t} style={{ background: "rgba(20,17,14,.72)", padding: "20px 22px" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>{c.t}</div>
                    <div style={{ fontSize: 15, lineHeight: 1.45, color: "rgba(255,255,255,.78)", marginTop: 11 }}>{c.d}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 34 }}>
                <a href={routes.pricing} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15.5, fontWeight: 600 }}>Unlock with Season Pass</a>
                <span className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: "rgba(255,255,255,.4)" }}>$59 / YEAR · YOUR PLANS STAY YOURS IF IT LAPSES</span>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------- Constraint drawer ---------------- */}
      {d && <div onClick={() => setDrawerKey(null)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(21,20,15,.42)", backdropFilter: "blur(3px)" }} />}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 432, zIndex: 91, background: "#FBF8F2", boxShadow: "-30px 0 80px -40px rgba(21,20,15,.5)", transform: d ? "translateX(0)" : "translateX(100%)", transition: "transform .52s cubic-bezier(.16,1,.3,1)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 20px", borderBottom: "1px solid rgba(21,20,15,.09)" }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>WHY THIS NUMBER</span>
          <div onClick={() => setDrawerKey(null)} className="btn-outline-dark2" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, border: "1px solid rgba(21,20,15,.14)", cursor: "pointer" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5 10.5 10.5M10.5 1.5 1.5 10.5" stroke="#5C574B" strokeWidth={1.5} strokeLinecap="round" /></svg>
          </div>
        </div>
        {d && (
          <div style={{ padding: 28, flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.binding ? "#E4622F" : "#C4BCAC" }} />
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: d.binding ? "#C6461B" : "#8C8578" }}>{d.binding ? "BINDING CONSTRAINT" : "SLACK · NOT LIMITING"}</span>
            </div>
            <h3 style={{ margin: "14px 0 0", fontSize: 30, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.036em" }}>{d.name}</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 20, padding: "18px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)" }}>
              <span className="mono" style={{ fontSize: 32, letterSpacing: "-.04em" }}>{d.value}</span>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginLeft: "auto" }}>{d.source}</span>
            </div>
            <p style={{ margin: "22px 0 0", fontSize: 15.5, lineHeight: 1.6, color: "#3D3A31" }}>{d.desc}</p>
            <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.09)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WHAT IT PRODUCED</div>
              <div style={{ fontSize: 15, lineHeight: 1.5, color: "#3D3A31", marginTop: 12 }}>{d.affects}</div>
            </div>
            <div style={{ marginTop: 26, padding: "18px 20px", borderRadius: 10, background: "rgba(228,98,47,.07)", border: "1px solid rgba(228,98,47,.24)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#C6461B" }}>OVERRIDE</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#3D3A31", marginTop: 10 }}>{d.override}</div>
              <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", marginTop: 14, border: "1px solid rgba(21,20,15,.2)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, background: "#FBF8F2" }}>Override and re-solve</a>
            </div>
          </div>
        )}
      </div>

      <footer style={{ position: "relative", background: "#15140F", padding: 20, overflow: "hidden" }}>
        <div style={{ position: "relative", background: "#FBF8F2", borderRadius: 14, padding: "52px 44px 30px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(3,1fr)", gap: 44 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <svg width="27" height="18" viewBox="0 0 343 229" style={{ display: "block", flex: "none" }}><g fill="#E4622F"><circle cx="75.5" cy="27.5" r="27.5" /><circle cx="267.5" cy="27.5" r="27.5" /><circle cx="27.5" cy="114.5" r="27.5" /><circle cx="123.5" cy="114.5" r="27.5" /><circle cx="219.5" cy="114.5" r="27.5" /><circle cx="315.5" cy="114.5" r="27.5" /><circle cx="75.5" cy="201.5" r="27.5" /><circle cx="267.5" cy="201.5" r="27.5" /></g></svg>
                <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
              </div>
              <p style={{ margin: "16px 0 0", maxWidth: 260, fontSize: 14, lineHeight: 1.55, color: "#6B6455" }}>Race-week execution for long-course triathletes.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192", marginBottom: 3 }}>PLAN</div>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Race card</a>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Export to device</a>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Share with a coach</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192", marginBottom: 3 }}>RACE</div>
              <a href={routes.dashboard} style={{ fontSize: 14, color: "#5C574B" }}>Dashboard</a>
              <a href={routes.courseRecon} style={{ fontSize: 14, color: "#5C574B" }}>Course explorer</a>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Race Mode</a>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192", marginBottom: 3 }}>SUPPORT</div>
              <a href={routes.pricing} style={{ fontSize: 14, color: "#5C574B" }}>Pricing</a>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Help centre</a>
              <a href="#" style={{ fontSize: 14, color: "#5C574B" }}>Contact</a>
            </div>
          </div>
          <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 44, paddingTop: 20, borderTop: "1px solid rgba(21,20,15,.1)", fontSize: 9.5, letterSpacing: ".14em", color: "#A8A192" }}>
            <span>© 2026 RACEOS</span>
            <span>PLAN v3 · SOLVED 18 JUN 2026 · BUNDLE v2026.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
