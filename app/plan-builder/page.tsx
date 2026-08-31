"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  RACE_RESULTS,
  SEG,
  SOLVE_STAGES,
  STEP_NAMES,
  buildBags,
  buildElevation,
  elevPath,
  fmtClock,
  wallClock,
} from "@/lib/planBuilder";

type GoalType = "safe" | "time" | "pb";
type Risk = "Conservative" | "Balanced" | "Aggressive";

type State = {
  step: number;
  goal: number;
  dist: string;
  query: string;
  picked: boolean;
  splitImported: boolean;
  goalType: GoalType;
  risk: Risk;
  firstTimer: boolean;
  solving: boolean;
  stage: number;
  solved: boolean;
  carb: number;
  source: string;
  caffeine: string;
  bag: number;
  qty: Record<string, number>;
};

const INITIAL: State = {
  step: 1, goal: 705, dist: "Full", query: "Tramuntana Full", picked: true,
  splitImported: false, goalType: "time", risk: "Balanced", firstTimer: false,
  solving: false, stage: 0, solved: false,
  carb: 78, source: "Gels", caffeine: "Run only",
  bag: 1, qty: {},
};

function PlanBuilderPage() {
  const [st, setSt] = useState<State>(INITIAL);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const el = useMemo(() => buildElevation(), []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const startSolve = () => {
    if (timer.current) clearInterval(timer.current);
    setSt((s) => ({ ...s, solving: true, solved: false, stage: 0 }));
    timer.current = setInterval(() => {
      setSt((s) => {
        const n = s.stage + 1;
        if (n >= SOLVE_STAGES.length) {
          if (timer.current) clearInterval(timer.current);
          return { ...s, stage: n, solving: false, solved: true };
        }
        return { ...s, stage: n };
      });
    }, 440);
  };

  const goTo = (n: number) => {
    if (n > st.step && !st.solved && n > 4) return;
    setSt((s) => ({ ...s, step: n }));
    if (n === 4 && !st.solved && !st.solving) setTimeout(startSolve, 220);
  };
  const goBack = () => setSt((s) => ({ ...s, step: Math.max(1, s.step - 1) }));
  const goNext = () => {
    const n = Math.min(7, st.step + 1);
    setSt((s) => ({ ...s, step: n }));
    if (n === 4 && !st.solved && !st.solving) setTimeout(startSolve, 220);
  };

  // ---- solver math ----
  const G = st.goal;
  const swim = G * 0.093, t1 = 8, t2 = 5, rest = G - swim - t1 - t2;
  const bike = rest * 0.582, run = rest * 0.418;
  const gates = [
    { name: "SWIM EXIT", limit: 140, eta: swim },
    { name: "BIKE KM 120", limit: 510, eta: swim + t1 + bike * (120 / 180.2) },
    { name: "BIKE CUT-OFF", limit: 630, eta: swim + t1 + bike },
    { name: "FINISH LINE", limit: 960, eta: G },
  ];
  const worst = Math.min(...gates.map((g) => g.limit - g.eta));
  const tight = gates.reduce((a, b) => (a.limit - a.eta < b.limit - b.eta ? a : b));
  const failing = gates.find((g) => g.limit - g.eta < 0);
  const S: "clear" | "tight" | "fail" = failing ? "fail" : worst < 20 ? "tight" : "clear";
  const col = { clear: "#3E7B55", tight: "#A0701A", fail: "#C0392B" }[S];
  const panelCol = { clear: "#7CC08F", tight: "#E0A33C", fail: "#E86A5A" }[S];

  const bags = useMemo(() => buildBags(st.carb, st.goal > 690), [st.carb, st.goal]);
  const B = bags[st.bag];
  const qtyOf = (b: number, i: number, d: number) => {
    const k = b + ":" + i;
    return st.qty[k] === undefined ? d : st.qty[k];
  };
  const bump = (b: number, i: number, d: number, by: number) => () => {
    const k = b + ":" + i;
    const cur = st.qty[k] === undefined ? d : st.qty[k];
    setSt((s) => ({ ...s, qty: { ...s.qty, [k]: Math.max(0, cur + by) } }));
  };

  const carbTotal = Math.round((bike / 60) * st.carb + (run / 60) * (st.carb - 18));
  const ceilPos = ((90 - 40) / 70) * 100;

  const binding: { name: string; value: string }[] = [
    { name: "Heat adjustment", value: "31°C" },
    { name: "Aid-station spacing", value: "29.5 km" },
  ];
  if (st.splitImported) binding.push({ name: "Imported bike split", value: "LOCKED" });
  else binding.push({ name: "Bike threshold power", value: "293 w" });
  if (st.carb >= 88) binding.push({ name: "Gut carbohydrate ceiling", value: "90 g/hr" });

  const results = RACE_RESULTS.filter((r) => r.name.toLowerCase().includes(st.query.toLowerCase()));
  const showResults = !st.picked && st.query.length > 0;

  const cSwim = st.dist === "Full" ? "3.8 km" : st.dist === "70.3" ? "1.9 km" : "1.5 km";
  const cBike = st.dist === "Full" ? "180.2 km" : st.dist === "70.3" ? "90.1 km" : "40 km";
  const cRun = st.dist === "Full" ? "42.2 km" : st.dist === "70.3" ? "21.1 km" : "10 km";
  const prevLine = elevPath(el, 420, 10, 84);
  const prevArea = prevLine + " L 420 86 L 0 86 Z";

  const ovLine = elevPath(el, 900, 10, 122);
  const ovArea = ovLine + " L 900 124 L 0 124 Z";
  const overlayBands = SEG.map((s) => ({
    x: ((s.from / 180.2) * 900).toFixed(1),
    w: (((s.to - s.from) / 180.2) * 900).toFixed(1),
    cx: (((s.from + s.to) / 2 / 180.2) * 900).toFixed(1),
    w2: s.w,
    fill: s.w === "224 w" || s.w === "214 w" ? "rgba(228,98,47,.08)" : "rgba(228,98,47,.03)",
  }));
  const clockCards = gates.map((g) => {
    const m = g.limit - g.eta;
    return {
      name: g.name, eta: fmtClock(g.eta), limit: fmtClock(g.limit),
      margin: (m >= 0 ? "+" : "") + fmtClock(m),
      color: m < 0 ? "#C0392B" : m < 20 ? "#A0701A" : "#3E7B55",
      bg: m < 0 ? "rgba(192,57,43,.07)" : m < 20 ? "rgba(224,163,60,.1)" : "rgba(124,192,143,.1)",
      border: m < 0 ? "rgba(192,57,43,.3)" : m < 20 ? "rgba(224,163,60,.34)" : "rgba(124,192,143,.36)",
    };
  });

  const ceilPath = "M 0 " + (128 - (90 / 110) * 116).toFixed(1) + " L 400 " + (128 - (90 / 110) * 116).toFixed(1);
  const intakePts = (() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      const rate = f < 0.1 ? 0 : f < 0.62 ? st.carb : st.carb - 18;
      pts.push([f * 400, 128 - (rate / 110) * 116]);
    }
    return pts;
  })();
  const intakePath = intakePts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const intakeArea = intakePath + " L 400 128 L 0 128 Z";

  const aidRows = [
    { at: wallClock(swim + t1) + " · T1", name: "Transition 1", action: "Three bottles on, first gel in the top tube", total: "12 g", dot: "#E4622F" },
    { at: wallClock(swim + t1 + bike * 0.19) + " · km 34", name: "Alcúdia", action: "Water only — top bottle A, do not stop", total: "132 g", dot: "#E4622F" },
    { at: wallClock(swim + t1 + bike * 0.35) + " · km 62", name: "Femenia summit", action: "Water. Drink now, the descent gives you nothing", total: "236 g", dot: "#E4622F" },
    { at: wallClock(swim + t1 + bike * 0.51) + " · km 92", name: "Bike special needs", action: "Swap bottle, three gels, sunscreen wipe", total: "318 g", dot: "#E4622F" },
    { at: wallClock(swim + t1 + bike * 0.71) + " · km 128", name: "Sa Pobla", action: "Sports drink and water, last full top-up", total: "462 g", dot: "#E4622F" },
    { at: wallClock(swim + t1 + bike + t2 + run * 0.5) + " · km 21", name: "Run special needs", action: "Flask refill, two caffeine gels, dry socks", total: carbTotal + " g", dot: "#64707A" },
  ];

  const cardSections = [
    { title: "PACING", step: 4, cols: 3, rows: [
      { k: "SWIM 3.8 KM", v: "1:44/100m · " + fmtClock(swim) },
      { k: "BIKE 180.2 KM", v: "208 w · " + fmtClock(bike) },
      { k: "RUN 42.2 KM", v: "6:12/km · " + fmtClock(run) },
    ] },
    { title: "CUT-OFF MARGINS", step: 4, cols: 4, rows: gates.map((g) => ({ k: g.name, v: (g.limit - g.eta >= 0 ? "+" : "") + fmtClock(g.limit - g.eta) })) },
    { title: "FUELLING", step: 5, cols: 3, rows: [
      { k: "CARB / HR", v: st.carb + " g" },
      { k: "FLUID / HR", v: "760 ml" },
      { k: "SODIUM / HR", v: "950 mg" },
    ] },
    { title: "BAGS", step: 6, cols: 5, rows: bags.map((b, i) => ({ k: "0" + (i + 1) + " " + b.name.toUpperCase().split(" ")[0], v: b.items.length + " items" })) },
  ];

  const pLabel = st.solved || st.step > 4 ? { clear: "CLEARS", tight: "TIGHT", fail: "INFEASIBLE" }[S] : "NOT SOLVED";
  const pColor = st.solved || st.step > 4 ? panelCol : "#8C8578";
  const panelSplits = [
    { name: "Swim", target: "1:44/100m", time: fmtClock(swim), color: "#4F7C93" },
    { name: "T1", target: "transition", time: fmtClock(t1), color: "#8C8578" },
    { name: "Bike", target: "208 w", time: fmtClock(bike), color: "#E4622F" },
    { name: "T2", target: "transition", time: fmtClock(t2), color: "#8C8578" },
    { name: "Run", target: "6:12/km", time: fmtClock(run), color: "#64707A" },
  ];
  const panelNote = st.step === 1
    ? "The panel fills in as you go. Nothing here is final until step 4 solves it."
    : st.step < 4
      ? "These are projections from your inputs, not a solved plan. Step 4 checks them against the real course."
      : "Every number in this panel came out of the solver and can be traced to the constraint that produced it.";

  const inputBoxStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, height: 46, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" };
  const cardStyle: React.CSSProperties = { background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <Link href={routes.dashboard} style={{ display: "flex", alignItems: "center", gap: 11, flex: "none" }}>
            <Mark width={26} height={17} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center" }}>
            {STEP_NAMES.map((name, i) => {
              const n = i + 1;
              const done = n < st.step;
              const cur = n === st.step;
              const reachable = n <= st.step || st.solved || n <= 4;
              return (
                <div key={name} onClick={() => goTo(n)} style={{ display: "flex", alignItems: "center", cursor: reachable ? "pointer" : "not-allowed" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 12px" }}>
                    <span className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", flex: "none", background: cur ? "#E4622F" : done ? "#15140F" : "transparent", border: `1px solid ${cur ? "#E4622F" : done ? "#15140F" : "rgba(21,20,15,.24)"}`, fontSize: 9.5, color: cur || done ? "#FBF8F2" : "#A8A192" }}>
                      {done ? "✓" : n}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: cur ? 600 : 500, letterSpacing: "-.012em", color: cur ? "#15140F" : done ? "#5C574B" : "#A8A192", whiteSpace: "nowrap" }}>{name}</span>
                  </div>
                  {n < 7 && <span style={{ width: 18, height: 1, background: done ? "rgba(21,20,15,.3)" : "rgba(21,20,15,.14)", flex: "none" }} />}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>DRAFT SAVED · {wallClock(0)}</span>
            <Link href={routes.dashboard} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 36, padding: "0 15px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
              Save and exit
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "44px 48px 96px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 356px", gap: 40, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          {/* ---------------- Step 1: Race ---------------- */}
          {st.step === 1 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 1 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Which race?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                Pick it from the directory and you inherit the official course, cut-offs and aid stations. Upload a GPX if it is not listed.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 34 }}>
                <div style={cardStyle}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>RACE</div>
                  <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                    <input
                      type="text"
                      value={st.query}
                      onChange={(e) => setSt((s) => ({ ...s, query: e.target.value, picked: false }))}
                      placeholder="Search 412 courses"
                      style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }}
                    />
                    {st.picked && <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "3px 7px", borderRadius: 3, background: "rgba(124,192,143,.18)", color: "#3E7B55", whiteSpace: "nowrap" }}>SELECTED</span>}
                  </div>
                  {showResults && (
                    <div style={{ marginTop: 8, border: "1px solid rgba(21,20,15,.12)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      {results.map((r) => (
                        <div key={r.name} onClick={() => setSt((s) => ({ ...s, query: r.name, picked: true }))} className="result-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderBottom: "1px solid rgba(21,20,15,.07)", cursor: "pointer" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.dot, flex: "none" }} />
                          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{r.name}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{r.date}</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>{r.prov}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 26 }}>DISTANCE</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    {["Full", "70.3", "Olympic", "Sprint"].map((d) => {
                      const sel = st.dist === d;
                      return (
                        <div key={d} onClick={() => setSt((s) => ({ ...s, dist: d }))} className="row-hover-border" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42, borderRadius: 7, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.16)"}`, fontSize: 14, fontWeight: sel ? 600 : 500, color: sel ? "#FBF8F2" : "#5C574B" }}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 26 }}>RACE DATE</div>
                  <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                    <span className="mono" style={{ fontSize: 15 }}>21 / 06 / 2026</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 10, letterSpacing: ".12em", color: "#3E7B55" }}>+6 DAYS</span>
                  </div>
                  <div className="upload-dash" style={{ marginTop: 22, padding: "16px 18px", border: "1px dashed rgba(21,20,15,.22)", borderRadius: 9, display: "flex", alignItems: "center", gap: 13, cursor: "pointer" }}>
                    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" style={{ flex: "none" }}><path d="M9 12.5V3.5M9 3.5 5.5 7M9 3.5 12.5 7" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /><path d="M3 12v2.5h12V12" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>Course not listed? Upload a GPX</div>
                      <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 3 }}>The plan still solves. Anything estimated is marked as estimated.</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>COURSE PREVIEW</span>
                      <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8.5, letterSpacing: ".13em", color: "#3E7B55" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#7CC08F" }} />OFFICIAL
                      </span>
                    </div>
                    <svg viewBox="0 0 420 92" style={{ display: "block", width: "100%", marginTop: 16 }}>
                      <path d={prevArea} fill="rgba(228,98,47,.13)" />
                      <path d={prevLine} fill="none" stroke="#E4622F" strokeWidth={1.6} strokeLinejoin="round" />
                      <line x1={0} y1={86} x2={420} y2={86} stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                    </svg>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                      <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>SWIM</div><div className="mono" style={{ fontSize: 16, marginTop: 6 }}>{cSwim}</div></div>
                      <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>BIKE</div><div className="mono" style={{ fontSize: 16, marginTop: 6 }}>{cBike}</div></div>
                      <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>RUN</div><div className="mono" style={{ fontSize: 16, marginTop: 6 }}>{cRun}</div></div>
                    </div>
                  </div>
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>FORECAST · DISPLAY ONLY</span>
                      <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>62% CONFIDENCE AT 6 DAYS</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 16 }}>
                      <span className="mono" style={{ fontSize: 44, lineHeight: 0.85, letterSpacing: "-.045em" }}>31°</span>
                      <span style={{ fontSize: 14, color: "#6B6455" }}>21 km/h NE · water 23.1°</span>
                    </div>
                    <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: 8, background: "rgba(21,20,15,.04)", fontSize: 13, lineHeight: 1.5, color: "#5C574B" }}>
                      This far out the plan solves against eleven editions of history. The forecast replaces it at 72 hours.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Step 2: Fitness ---------------- */}
          {st.step === 2 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 2 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What can you hold?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                Every field takes a number, a file, or two plain questions. No field is required, and nothing is gated behind connecting an account.
              </p>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 28px 24px", marginTop: 34, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.1fr 130px", gap: 18, padding: "20px 0 12px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                  <span>METRIC</span><span>VALUE</span><span>SOURCE</span><span style={{ textAlign: "right" }}>IF YOU DO NOT KNOW</span>
                </div>
                {[
                  { name: "Swim threshold pace", value: "1:38", unit: "/100m", dot: "#4F7C93", source: "TESTED", srcBg: "rgba(124,192,143,.16)", srcFg: "#3E7B55", canEstimate: true, locked: false },
                  { name: "Bike threshold power", value: st.splitImported ? "LOCKED" : "293", unit: st.splitImported ? "" : "w", dot: "#E4622F", source: st.splitImported ? "IMPORTED" : "TESTED", srcBg: st.splitImported ? "rgba(228,98,47,.16)" : "rgba(124,192,143,.16)", srcFg: st.splitImported ? "#C6461B" : "#3E7B55", canEstimate: !st.splitImported, locked: st.splitImported },
                  { name: "Run threshold pace", value: "4:42", unit: "/km", dot: "#64707A", source: "TESTED", srcBg: "rgba(124,192,143,.16)", srcFg: "#3E7B55", canEstimate: true, locked: false },
                  { name: "Weight", value: "68", unit: "kg", dot: "#C4BCAC", source: "MANUAL", srcBg: "rgba(21,20,15,.07)", srcFg: "#5C574B", canEstimate: false, locked: false },
                  { name: "Sweat rate", value: "1.3", unit: "L/hr", dot: "#C4BCAC", source: "ESTIMATED", srcBg: "rgba(224,163,60,.18)", srcFg: "#A0701A", canEstimate: true, locked: false },
                  { name: "Gut carbohydrate ceiling", value: "90", unit: "g/hr", dot: "#C4BCAC", source: "MEASURED", srcBg: "rgba(124,192,143,.16)", srcFg: "#3E7B55", canEstimate: true, locked: false },
                ].map((f) => (
                  <div key={f.name} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.1fr 130px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: f.dot, flex: "none" }} />
                      <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{f.name}</span>
                      {f.locked && <svg width="10" height="11" viewBox="0 0 12 13" fill="none" style={{ flex: "none" }}><rect x="1.5" y="5.5" width="9" height="6.5" rx="1.5" stroke="#C6461B" strokeWidth={1.4} /><path d="M3.8 5.5V3.9a2.2 2.2 0 0 1 4.4 0v1.6" stroke="#C6461B" strokeWidth={1.4} /></svg>}
                    </span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span className="mono" style={{ fontSize: 18, letterSpacing: "-.02em" }}>{f.value}</span>
                      <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{f.unit}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "4px 8px", borderRadius: 4, justifySelf: "start", whiteSpace: "nowrap", background: f.srcBg, color: f.srcFg }}>{f.source}</span>
                    <span style={{ textAlign: "right" }}>{f.canEstimate && <span className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer", whiteSpace: "nowrap" }}>ESTIMATE IT →</span>}</span>
                  </div>
                ))}
              </div>

              <div onClick={() => setSt((s) => ({ ...s, splitImported: !s.splitImported }))} style={{ marginTop: 16, borderRadius: 12, padding: "24px 28px", cursor: "pointer", background: st.splitImported ? "#15140F" : "#FBF8F2", border: `1px solid ${st.splitImported ? "#15140F" : "rgba(21,20,15,.1)"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.splitImported ? "#E4622F" : "#C4BCAC" }} />
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: st.splitImported ? "#E4622F" : "#8C8578" }}>{st.splitImported ? "ACTIVE · BIKE POWER LOCKED" : "OPTIONAL"}</span>
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.028em", marginTop: 11, color: st.splitImported ? "#FBF8F2" : "#15140F" }}>Import a bike split you already trust</div>
                    <p style={{ margin: "8px 0 0", maxWidth: 600, fontSize: 14.5, lineHeight: 1.55, color: st.splitImported ? "rgba(251,248,242,.55)" : "#5C574B" }}>
                      {st.splitImported
                        ? "Your bike power is now a fixed constraint. Pacing, fuelling and every cut-off margin will be solved around it rather than re-derived."
                        : "If another tool already gave you a bike split you believe, we will lock it as a constraint instead of computing our own."}
                    </p>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: st.splitImported ? "flex-end" : "flex-start", width: 44, height: 26, borderRadius: 13, flex: "none", background: st.splitImported ? "#E4622F" : "rgba(21,20,15,.16)", padding: 3 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 16 }}>
                {[
                  { name: "SWIM", target: "1:44/100m", note: "Threshold plus 6s for open water", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
                  { name: "BIKE", target: st.splitImported ? "Imported" : "208 w", note: st.splitImported ? "Locked as given" : "0.71 of threshold", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
                  { name: "RUN", target: "6:12/km", note: "Threshold plus heat adjustment", color: "#64707A", tint: "rgba(100,112,122,.13)" },
                ].map((z) => (
                  <div key={z.name} style={{ background: "#FBF8F2", borderRadius: 11, padding: "20px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 5, background: z.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: z.color }} /></span>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{z.name}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 22, letterSpacing: "-.03em", marginTop: 14 }}>{z.target}</div>
                    <div style={{ fontSize: 12.5, color: "#8C8578", marginTop: 7 }}>{z.note}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- Step 3: Goal ---------------- */}
          {st.step === 3 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 3 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What are you racing for?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>This changes what the solver protects. Finishing safely and chasing a personal best are different problems.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 34 }}>
                {[
                  { k: "safe" as GoalType, kicker: "CONSERVATIVE", name: "Finish safely", desc: "The solver protects every cut-off first and optimises nothing else." },
                  { k: "time" as GoalType, kicker: "TARGETED", name: "Time target", desc: "A specific finish time, with the plan built to hold it honestly." },
                  { k: "pb" as GoalType, kicker: "AGGRESSIVE", name: "Personal best", desc: "Maximum sustainable effort, with margins deliberately thinner." },
                ].map((g) => {
                  const on = st.goalType === g.k;
                  return (
                    <div key={g.k} onClick={() => setSt((s) => ({ ...s, goalType: g.k }))} style={{ borderRadius: 12, padding: "24px 26px 26px", cursor: "pointer", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.1)"}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: on ? "#E4622F" : "#8C8578" }}>{g.kicker}</span>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${on ? "#E4622F" : "rgba(21,20,15,.24)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                          {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E4622F" }} />}
                        </span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 14, color: on ? "#FBF8F2" : "#15140F" }}>{g.name}</div>
                      <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: on ? "rgba(251,248,242,.55)" : "#5C574B" }}>{g.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", marginTop: 16, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>GOAL FINISH TIME</span>
                  <span className="mono" style={{ fontSize: 38, letterSpacing: "-.04em" }}>{fmtClock(G)}:00</span>
                </div>
                <input type="range" min={540} max={1020} step={5} value={G} onChange={(e) => setSt((s) => ({ ...s, goal: +e.target.value, solved: false }))} style={{ width: "100%", margin: "20px 0 8px", height: 18 }} />
                <div className="mono" style={{ position: "relative", height: 15, fontSize: 9.5, letterSpacing: ".11em", color: "#A8A192" }}>
                  <span style={{ position: "absolute", left: 0 }}>09:00</span>
                  <span style={{ position: "absolute", left: "37.5%", transform: "translateX(-50%)" }}>13:00</span>
                  <span style={{ position: "absolute", left: "87.5%", transform: "translateX(-50%)", color: "#C0392B" }}>16:00</span>
                  <span style={{ position: "absolute", right: 0 }}>17:00</span>
                </div>
                <div style={{ position: "relative", height: 13 }}>
                  <span style={{ position: "absolute", left: "87.5%", top: -16, width: 1, height: 8, background: "rgba(192,57,43,.55)" }} />
                  <span className="mono" style={{ position: "absolute", left: "87.5%", top: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, letterSpacing: ".13em", color: "#C0392B" }}>FINISH CUT-OFF</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, padding: "16px 18px", borderRadius: 9, background: S === "fail" ? "rgba(192,57,43,.08)" : S === "tight" ? "rgba(224,163,60,.1)" : "rgba(21,20,15,.04)", border: `1px solid ${S === "fail" ? "rgba(192,57,43,.32)" : S === "tight" ? "rgba(224,163,60,.34)" : "rgba(21,20,15,.08)"}` }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: S === "fail" ? "#C0392B" : S === "tight" ? "#E0A33C" : "#7CC08F", flex: "none" }} />
                  <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>
                    {S === "fail"
                      ? "This implies a bike power you have not held in training. You can proceed — the plan will show you exactly where it breaks."
                      : S === "tight"
                        ? "Achievable, but the margin on the " + tight.name.toLowerCase() + " is under twenty minutes. One puncture and this becomes a decision made under pressure."
                        : "Consistent with your tested numbers. The implied bike is 0.71 of threshold, which you have held for six hours before."}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 16, marginTop: 16 }}>
                <div style={cardStyle}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>RISK TOLERANCE</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                    {[
                      { k: "Conservative" as Risk, d: "Wider margins, slower plan" },
                      { k: "Balanced" as Risk, d: "The default for most athletes" },
                      { k: "Aggressive" as Risk, d: "Thin margins, no contingency" },
                    ].map((r) => {
                      const sel = st.risk === r.k;
                      return (
                        <div key={r.k} onClick={() => setSt((s) => ({ ...s, risk: r.k }))} className="row-hover-border" style={{ flex: 1, padding: "15px 16px", borderRadius: 8, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}` }}>
                          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.02em", color: sel ? "#FBF8F2" : "#15140F" }}>{r.k}</div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.4, color: sel ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 6 }}>{r.d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div onClick={() => setSt((s) => ({ ...s, firstTimer: !s.firstTimer }))} style={{ borderRadius: 12, padding: "26px 28px", cursor: "pointer", background: st.firstTimer ? "rgba(228,98,47,.07)" : "#FBF8F2", border: `1px solid ${st.firstTimer ? "rgba(228,98,47,.36)" : "rgba(21,20,15,.1)"}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>FIRST IRON DISTANCE</div>
                      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.025em", marginTop: 11 }}>This is my first one</div>
                      <p style={{ margin: "7px 0 0", fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>Adds beginner bag items, paces more conservatively, and expands the cut-off guidance.</p>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: st.firstTimer ? "flex-end" : "flex-start", width: 44, height: 26, borderRadius: 13, flex: "none", background: st.firstTimer ? "#E4622F" : "rgba(21,20,15,.16)", padding: 3 }}>
                      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Step 4: Feasibility (solve) ---------------- */}
          {st.step === 4 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 4 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>{st.solving ? "Solving." : "It holds."}</h1>

              {st.solving && (
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "36px 38px 34px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "block", width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(228,98,47,.25)", borderTopColor: "#E4622F", animation: "spin .8s linear infinite", flex: "none" }} />
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578" }}>SOLVING · {Math.round((st.stage / SOLVE_STAGES.length) * 100)}%</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
                    {SOLVE_STAGES.map((name, i) => {
                      const done = i < st.stage;
                      const cur = i === st.stage;
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0" }}>
                          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 17, height: 17, borderRadius: "50%", flex: "none", background: done ? "#5C9E72" : "transparent", border: `1px solid ${done ? "#5C9E72" : cur ? "#E4622F" : "rgba(21,20,15,.18)"}` }}>
                            {done && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </span>
                          <span style={{ fontSize: 15.5, color: i <= st.stage ? "#15140F" : "#A8A192" }}>{name}</span>
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 10.5, color: "#C4BCAC" }}>{done ? 380 + i * 40 + "ms" : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {st.solved && (
                <div style={{ marginTop: 26 }}>
                  <div style={{ borderRadius: 12, padding: "30px 32px", background: S === "clear" ? "rgba(124,192,143,.1)" : S === "tight" ? "rgba(224,163,60,.11)" : "rgba(192,57,43,.09)", border: `1px solid ${S === "clear" ? "rgba(124,192,143,.4)" : S === "tight" ? "rgba(224,163,60,.4)" : "rgba(192,57,43,.34)"}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
                      <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: col }}>{{ clear: "CLEARS EVERY CUT-OFF", tight: "TIGHT · ONE BINDING BARRIER", fail: "INFEASIBLE AS SET" }[S]}</span>
                    </div>
                    <p style={{ margin: "15px 0 0", maxWidth: 640, fontSize: 30, lineHeight: 1.16, fontWeight: 500, letterSpacing: "-.035em" }}>
                      {failing
                        ? "You miss the " + failing.name.toLowerCase() + " by " + fmtClock(failing.eta - failing.limit) + "."
                        : "You clear the " + tight.name.toLowerCase() + " with " + fmtClock(worst) + " in hand."}
                    </p>
                    <p style={{ margin: "12px 0 0", maxWidth: 600, fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>
                      {failing
                        ? "Held at your gut ceiling and threshold power, the plan cannot reach that barrier in time. Two levers would change it: bike power, and time lost in transition."
                        : "Solved against course bundle v2026.2 and a forecast 31°C. Every value below traces to a constraint you can inspect."}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 14 }}>
                    {[
                      { name: "SWIM", target: "1:44", unit: "/100m", split: fmtClock(swim), note: "Non-wetsuit", color: "#4F7C93", tint: "rgba(79,124,147,.13)" },
                      { name: "BIKE", target: "208", unit: "w", split: fmtClock(bike), note: "0.71 IF", color: "#E4622F", tint: "rgba(228,98,47,.13)" },
                      { name: "RUN", target: "6:12", unit: "/km", split: fmtClock(run), note: "Heat adjusted", color: "#64707A", tint: "rgba(100,112,122,.13)" },
                    ].map((d) => (
                      <div key={d.name} style={{ background: "#FBF8F2", borderRadius: 11, padding: "22px 24px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <span style={{ width: 20, height: 20, borderRadius: 5, background: d.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} /></span>
                            <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{d.name}</span>
                          </span>
                          <span className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".11em", color: "#C6461B", cursor: "pointer" }}>ADJUST</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 16 }}>
                          <span className="mono" style={{ fontSize: 30, letterSpacing: "-.035em" }}>{d.target}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{d.unit}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                          <span style={{ fontSize: 13, color: "#8C8578" }}>{d.note}</span>
                          <span className="mono" style={{ fontSize: 15 }}>{d.split}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 28px 20px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>ELEVATION WITH PACING OVERLAY</div>
                    <svg viewBox="0 0 900 150" style={{ display: "block", width: "100%", marginTop: 14 }}>
                      {overlayBands.map((b, i) => (
                        <g key={i}>
                          <rect x={b.x} y={6} width={b.w} height={118} fill={b.fill} />
                          <text x={b.cx} y={140} textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize={9.5}>{b.w2}</text>
                        </g>
                      ))}
                      <path d={ovArea} fill="rgba(228,98,47,.12)" />
                      <path d={ovLine} fill="none" stroke="#E4622F" strokeWidth={1.6} strokeLinejoin="round" />
                      <line x1={0} y1={124} x2={900} y2={124} stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                    </svg>
                  </div>

                  <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 28px 22px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CUT-OFF CLOCK</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 16 }}>
                      {clockCards.map((c) => (
                        <div key={c.name} style={{ borderRadius: 9, padding: "17px 18px", background: c.bg, border: `1px solid ${c.border}` }}>
                          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#6B6455" }}>{c.name}</div>
                          <div className="mono" style={{ fontSize: 24, letterSpacing: "-.035em", marginTop: 12, color: c.color }}>{c.margin}</div>
                          <div className="mono" style={{ fontSize: 9, color: "#A8A192", marginTop: 8 }}>{c.eta} / {c.limit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------- Step 5: Fuelling ---------------- */}
          {st.step === 5 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 5 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>How will you fuel it?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 540, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Your gut ceiling is a hard stop, not a suggestion. Crossing it needs an explicit override.</p>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", marginTop: 32, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CARBOHYDRATE ON THE BIKE</span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span className="mono" style={{ fontSize: 38, letterSpacing: "-.04em", color: st.carb > 90 ? "#C0392B" : "#15140F" }}>{st.carb}</span>
                    <span className="mono" style={{ fontSize: 13, color: "#8C8578" }}>g / hr</span>
                  </span>
                </div>
                <div style={{ position: "relative", margin: "22px 0 0" }}>
                  <input type="range" min={40} max={110} step={1} value={st.carb} onChange={(e) => setSt((s) => ({ ...s, carb: +e.target.value }))} style={{ width: "100%", height: 18 }} />
                  <span style={{ position: "absolute", left: ceilPos.toFixed(1) + "%", top: -4, width: 2, height: 22, background: "#C0392B", pointerEvents: "none" }} />
                </div>
                <div className="mono" style={{ position: "relative", height: 15, marginTop: 4, fontSize: 9.5, letterSpacing: ".11em", color: "#A8A192" }}>
                  <span style={{ position: "absolute", left: 0 }}>40</span>
                  <span style={{ position: "absolute", left: ceilPos.toFixed(1) + "%", transform: "translateX(-50%)", color: "#C0392B", whiteSpace: "nowrap" }}>CEILING 90</span>
                  <span style={{ position: "absolute", right: 0 }}>110</span>
                </div>
                {st.carb > 90 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(192,57,43,.08)", border: "1px solid rgba(192,57,43,.32)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B", flex: "none" }} />
                    <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>Above your measured ceiling of 90 g/hr. Nine of eleven athletes who did this reported gut distress after hour four.</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".12em", padding: "7px 12px", border: "1px solid rgba(192,57,43,.4)", borderRadius: 5, color: "#C0392B", cursor: "pointer", whiteSpace: "nowrap" }}>OVERRIDE</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(21,20,15,.04)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7CC08F", flex: "none" }} />
                    <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>
                      {st.carb >= 85
                        ? "Close to your ceiling of 90 g/hr. Workable, but intake usually drops on the climbs, so this leaves you little room."
                        : "Comfortably inside your measured ceiling of 90 g/hr, with headroom for the climbs where intake usually drops."}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 14, marginTop: 14 }}>
                <div style={cardStyle}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CARBOHYDRATE SOURCE</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
                    {["Gels", "Drink mix", "Chews", "Real food"].map((s) => {
                      const sel = st.source === s;
                      return (
                        <div key={s} onClick={() => setSt((prev) => ({ ...prev, source: s }))} className="row-hover-border" style={{ padding: "9px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13.5, fontWeight: 500, background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}`, color: sel ? "#FBF8F2" : "#5C574B" }}>{s}</div>
                      );
                    })}
                  </div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 24 }}>CAFFEINE STRATEGY</div>
                  <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
                    {[
                      { k: "None", d: "No caffeine at all" },
                      { k: "Run only", d: "Held back until km 12" },
                      { k: "Bike and run", d: "Split across both legs" },
                    ].map((c) => {
                      const sel = st.caffeine === c.k;
                      return (
                        <div key={c.k} onClick={() => setSt((s) => ({ ...s, caffeine: c.k }))} className="row-hover-border" style={{ flex: 1, padding: "12px 14px", borderRadius: 7, cursor: "pointer", background: sel ? "#15140F" : "#fff", border: `1px solid ${sel ? "#15140F" : "rgba(21,20,15,.14)"}` }}>
                          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.018em", color: sel ? "#FBF8F2" : "#15140F" }}>{c.k}</div>
                          <div style={{ fontSize: 12, lineHeight: 1.4, color: sel ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 5 }}>{c.d}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={cardStyle}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CUMULATIVE INTAKE</span>
                    <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>AGAINST CEILING</span>
                  </div>
                  <svg viewBox="0 0 400 140" style={{ display: "block", width: "100%", marginTop: 16 }}>
                    <path d={ceilPath} fill="none" stroke="rgba(192,57,43,.5)" strokeWidth={1.4} strokeDasharray="4 4" />
                    <path d={intakeArea} fill="rgba(228,98,47,.14)" />
                    <path d={intakePath} fill="none" stroke="#E4622F" strokeWidth={1.8} strokeLinejoin="round" />
                    <line x1={0} y1={128} x2={400} y2={128} stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                  </svg>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>CARB TOTAL</div><div className="mono" style={{ fontSize: 18, marginTop: 6 }}>{carbTotal}<span style={{ fontSize: 11, color: "#8C8578" }}> g</span></div></div>
                    <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>FLUID</div><div className="mono" style={{ fontSize: 18, marginTop: 6 }}>8.4<span style={{ fontSize: 11, color: "#8C8578" }}> L</span></div></div>
                    <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>SODIUM</div><div className="mono" style={{ fontSize: 18, marginTop: 6 }}>10.9<span style={{ fontSize: 11, color: "#8C8578" }}> g</span></div></div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 30px 20px", marginTop: 14, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 12px", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>AID STATION TIMELINE · SPECIAL NEEDS DECIDED HERE</span>
                  <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>6 STATIONS</span>
                </div>
                {aidRows.map((a) => (
                  <div key={a.name} style={{ display: "grid", gridTemplateColumns: "104px 1.2fr 1.7fr 92px", gap: 18, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 12.5, color: "#5C574B" }}>{a.at}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, fontWeight: 500, letterSpacing: "-.018em", whiteSpace: "nowrap" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: a.dot, flex: "none" }} />{a.name}
                    </span>
                    <span style={{ fontSize: 13.5, color: "#3D3A31" }}>{a.action}</span>
                    <span className="mono" style={{ textAlign: "right", fontSize: 12.5, color: "#5C574B" }}>{a.total}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- Step 6: Bags ---------------- */}
          {st.step === 6 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 6 OF 7</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
                <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Five bags, packed for you.</h1>
                <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600, flex: "none" }}>Print all five</a>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
                {[
                  { tag: "HEAT · 31°C", text: "Arm coolers and two extra salt capsules", bg: "rgba(228,98,47,.07)", border: "rgba(228,98,47,.3)", dot: "#E4622F", tagFg: "#C6461B" },
                  { tag: "NIGHT FINISH", text: "Head torch in Run Special Needs", bg: "rgba(21,20,15,.05)", border: "rgba(21,20,15,.12)", dot: "#5C574B", tagFg: "#5C574B" },
                  { tag: "COLD WATER · 23.1°C", text: "Non-wetsuit, so a second tinted pair of goggles", bg: "rgba(79,124,147,.09)", border: "rgba(79,124,147,.3)", dot: "#4F7C93", tagFg: "#3D6478" },
                ].map((c) => (
                  <div key={c.tag} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 15px", borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flex: "none" }} />
                    <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: c.tagFg }}>{c.tag}</span>
                    <span style={{ fontSize: 13.5, color: "#3D3A31" }}>{c.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0,1fr)", borderRadius: 12, overflow: "hidden", background: "#EAE3D6", marginTop: 20 }}>
                <div style={{ padding: 13, display: "flex", flexDirection: "column", gap: 2 }}>
                  {bags.map((b, k) => {
                    const sel = k === st.bag;
                    return (
                      <div key={b.name} onClick={() => setSt((s) => ({ ...s, bag: k }))} className={sel ? "" : "row-hover"} style={{ display: "flex", alignItems: "center", gap: 13, padding: "17px 16px", borderRadius: 8, cursor: "pointer", background: sel ? "#15140F" : "transparent", color: sel ? "#FBF8F2" : "#15140F" }}>
                        <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: sel ? "rgba(255,255,255,.45)" : "#8C8578" }}>{"0" + (k + 1)}</span>
                        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.026em", whiteSpace: "nowrap" }}>{b.name}</span>
                        <span className="mono" style={{ marginLeft: "auto", fontSize: 9, color: sel ? "rgba(255,255,255,.45)" : "#8C8578" }}>{b.items.length} items</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#FBF8F2", padding: "28px 32px 30px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingBottom: 18, borderBottom: "1px solid rgba(21,20,15,.09)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 13 }}>
                      <span style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.034em" }}>{B.name}</span>
                      <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>{B.when}</span>
                    </div>
                    <span className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer" }}>+ ADD ITEM</span>
                  </div>
                  {B.items.map((it, k) => (
                    <div key={it.name} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 96px 26px", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 15.5 }}>{it.name}</span>
                        {it.note && <span style={{ display: "block", fontSize: 12.5, lineHeight: 1.45, color: "#8C8578", marginTop: 4 }}>{it.note}</span>}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, overflow: "hidden" }}>
                        <span onClick={bump(st.bag, k, it.qty, -1)} className="qty-btn mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 30, cursor: "pointer", fontSize: 13, color: "#8C8578" }}>–</span>
                        <span className="mono" style={{ flex: 1, textAlign: "center", fontSize: 12.5 }}>{qtyOf(st.bag, k, it.qty)}×</span>
                        <span onClick={bump(st.bag, k, it.qty, 1)} className="qty-btn mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 30, cursor: "pointer", fontSize: 13, color: "#8C8578" }}>+</span>
                      </span>
                      <span className="remove-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 5, cursor: "pointer" }}>
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5 10.5 10.5M10.5 1.5 1.5 10.5" stroke="#A8A192" strokeWidth={1.4} strokeLinecap="round" /></svg>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------- Step 7: Race card ---------------- */}
          {st.step === 7 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 7 OF 7</div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
                <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Your race card.</h1>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", paddingBottom: 8, whiteSpace: "nowrap" }}>EXACTLY AS IT PRINTS · A5 · MONOCHROME LEGIBLE</span>
              </div>

              <div style={{ background: "#EAE3D6", borderRadius: 12, padding: 26, marginTop: 26 }}>
                <div style={{ background: "#fff", borderRadius: 6, padding: "32px 34px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.4)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 16, borderBottom: "2px solid #15140F" }}>
                    <div>
                      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-.03em" }}>TRAMUNTANA FULL</div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#5C574B", marginTop: 5 }}>21 JUNE 2026 · 06:40 START · PORT DE POLLENÇA</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 23, letterSpacing: "-.03em" }}>{fmtClock(G)}:00</div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#5C574B", marginTop: 5 }}>GOAL · PLAN v1</div>
                    </div>
                  </div>
                  {cardSections.map((s) => (
                    <div key={s.title} style={{ padding: "18px 0", borderBottom: "1px solid rgba(21,20,15,.18)" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", fontWeight: 500 }}>{s.title}</span>
                        <span onClick={() => setSt((prev) => ({ ...prev, step: s.step }))} className="mono link-accent" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer" }}>EDIT STEP {s.step} →</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${s.cols},1fr)`, gap: 14, marginTop: 14 }}>
                        {s.rows.map((r) => (
                          <div key={r.k}>
                            <div className="mono" style={{ fontSize: 8, letterSpacing: ".12em", color: "#6B6455" }}>{r.k}</div>
                            <div className="mono" style={{ fontSize: 15, marginTop: 5 }}>{r.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, fontSize: 8, letterSpacing: ".12em", color: "#6B6455" }}>
                    <span>RACEOS · BUNDLE v2026.2</span>
                    <span>SWEAT RATE ESTIMATED · ALL OTHER VALUES MEASURED OR OFFICIAL</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 16, padding: "24px 28px", background: "#FBF8F2", borderRadius: 12, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em" }}>One race, one payment, yours permanently.</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: "#5C574B", marginTop: 7 }}>Includes every export, the drift re-solves through race week, and offline Race Mode on the day.</div>
                </div>
                <Link href={routes.checkout} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15.5, fontWeight: 600, flex: "none" }}>
                  Purchase this plan — $19
                </Link>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 32 }}>
            <div onClick={goBack} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", gap: 9, whiteSpace: "nowrap", height: 46, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14.5, fontWeight: 600, cursor: "pointer", visibility: st.step === 1 ? "hidden" : "visible" }}>
              <span className="mono" style={{ fontSize: 13 }}>←</span>{STEP_NAMES[Math.max(0, st.step - 2)]}
            </div>
            {st.step < 7 && !st.solving && (
              <div onClick={goNext} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap", height: 46, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}>
                {st.step === 3 ? "Solve my plan" : st.step === 4 ? "Looks right, continue" : "Continue to " + STEP_NAMES[st.step]}
                <span className="mono" style={{ fontSize: 13 }}>→</span>
              </div>
            )}
          </div>
        </div>

        {/* ---------------- Live panel ---------------- */}
        <div style={{ position: "sticky", top: 110 }}>
          <div style={{ background: "#15140F", borderRadius: 12, padding: "24px 26px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}>LIVE PANEL</span>
              <span className="mono" style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 8.5, letterSpacing: ".13em", color: pColor }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: pColor, animation: "breathe 2.6s ease-in-out infinite" }} />{pLabel}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 18 }}>
              <span className="mono" style={{ fontSize: 40, letterSpacing: "-.045em", color: "#FBF8F2" }}>{fmtClock(G)}:00</span>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "rgba(251,248,242,.35)" }}>GOAL</span>
            </div>
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(251,248,242,.1)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(251,248,242,.35)" }}>PROJECTED SPLITS</div>
              {panelSplits.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flex: "none" }} />
                  <span style={{ fontSize: 13.5, color: "rgba(251,248,242,.72)" }}>{s.name}</span>
                  <span className="mono" style={{ marginLeft: "auto", fontSize: 9.5, color: "rgba(251,248,242,.35)" }}>{s.target}</span>
                  <span className="mono" style={{ fontSize: 14, color: "#FBF8F2", minWidth: 48, textAlign: "right" }}>{s.time}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(251,248,242,.1)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(251,248,242,.35)" }}>TIGHTEST BARRIER</div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 11 }}>
                <span style={{ fontSize: 14, color: "rgba(251,248,242,.72)" }}>{tight.name.toLowerCase().replace("km", "km ")}</span>
                <span className="mono" style={{ fontSize: 17, color: pColor }}>{(worst >= 0 ? "+" : "") + fmtClock(worst)}</span>
              </div>
            </div>
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(251,248,242,.1)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "rgba(251,248,242,.35)" }}>BINDING NOW</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {binding.map((b) => (
                  <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#E4622F", flex: "none" }} />
                    <span style={{ fontSize: 13, color: "rgba(251,248,242,.68)" }}>{b.name}</span>
                    <span className="mono" style={{ marginLeft: "auto", fontSize: 11, color: "rgba(251,248,242,.42)" }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: "16px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)", fontSize: 12.5, lineHeight: 1.5, color: "#6B6455" }}>{panelNote}</div>
        </div>
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedPlanBuilderPage() {
  return (
    <GuardedPage>
      <PlanBuilderPage />
    </GuardedPage>
  );
}
