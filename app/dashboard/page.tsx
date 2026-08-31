"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountHeader } from "@/components/AccountHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  ALERTS,
  BAG_DATA,
  BIKE_NOTE,
  DRIFT,
  FEAS_COLOR,
  RACES,
  RUN_NOTE,
  STATUS_MAP,
  TAG_STYLE,
  TASK_DATA,
  buildGeom,
  fmtClock,
  isoProject,
  spark,
  toPath,
} from "@/lib/dashboard";

function DashboardPage() {
  const geom = useMemo(() => buildGeom(), []);

  const [raceIdx, setRaceIdx] = useState(0);
  const [lost, setLost] = useState(0);
  const [tasksDone, setTasksDone] = useState([true, true, true, false, false, false, false]);
  const [bagsDone, setBagsDone] = useState([true, true, false, false, false]);
  const [scrub, setScrub] = useState(0.42);
  const [map3d, setMap3d] = useState(false);

  const R = RACES[raceIdx];
  const G = R.goal;

  const swim = G * 0.093;
  const t1 = 8;
  const t2 = 5;
  const rest = G - swim - t1 - t2;
  const bike = rest * 0.582;
  const run = rest * 0.418;
  const scale = R.dist === "70.3" ? 0.5 : R.dist === "Olympic" ? 0.24 : 1;
  const lim = R.dist === "70.3" ? [70, 255, 315, 480] : [140, 510, 630, 960];
  const rows = [
    { name: "SWIM EXIT", limit: lim[0], eta: swim + lost * 0.05 },
    { name: "BIKE KM 120", limit: lim[1], eta: swim + t1 + bike * 0.666 + lost * 0.6 },
    { name: "BIKE CUT-OFF", limit: lim[2], eta: swim + t1 + bike + lost * 0.8 },
    { name: "FINISH LINE", limit: lim[3], eta: G + lost },
  ];
  const worst = Math.min(...rows.map((r) => r.limit - r.eta));
  const failing = rows.find((r) => r.limit - r.eta < 0);
  const tight = rows.reduce((a, b) => (a.limit - a.eta < b.limit - b.eta ? a : b));
  const status: "clear" | "tight" | "fail" = failing ? "fail" : worst < 20 ? "tight" : "clear";
  const verdictColor = { clear: "#3E7B55", tight: "#A0701A", fail: "#C0392B" }[status];
  const sm = STATUS_MAP[R.status];

  const legs = [
    { name: "SWIM", dist: (3.8 * scale).toFixed(1) + " KM", target: "1:44", unit: "/100m", color: "#4F7C93", tint: "rgba(79,124,147,.13)", note: "Non-wetsuit", split: fmtClock(swim), kind: "swim" as const, delay: 0 },
    { name: "BIKE", dist: (180.2 * scale).toFixed(1) + " KM", target: "208", unit: "w", color: "#E4622F", tint: "rgba(228,98,47,.13)", note: "0.71 IF", split: fmtClock(bike), kind: "bike" as const, delay: 0.08 },
    { name: "RUN", dist: (42.2 * scale).toFixed(1) + " KM", target: "6:12", unit: "/km", color: "#64707A", tint: "rgba(100,112,122,.13)", note: "Heat adjusted", split: fmtClock(run), kind: "run" as const, delay: 0.16 },
  ].map((l) => ({ ...l, ...spark(l.kind) }));

  const tasks = TASK_DATA.map((t, i) => {
    const d = tasksDone[i];
    const live = i === 3 && !d;
    return {
      ...t, done: d,
      bg: d ? "rgba(124,192,143,.09)" : live ? "rgba(228,98,47,.07)" : "#FBF8F2",
      border: d ? "rgba(124,192,143,.42)" : live ? "rgba(228,98,47,.4)" : "rgba(21,20,15,.1)",
      boxBg: d ? "#5C9E72" : "transparent",
      boxBorder: d ? "#5C9E72" : "rgba(21,20,15,.22)",
      textColor: d ? "#8C8578" : "#15140F",
      dateColor: d ? "#5C9E72" : live ? "#C6461B" : "#A8A192",
    };
  });
  const doneN = tasksDone.filter(Boolean).length;
  const nextTaskLabel = TASK_DATA[tasksDone.findIndex((x) => !x)]?.label.toUpperCase();

  const bags = BAG_DATA.map((b, i) => {
    const d = bagsDone[i];
    const packed = d ? b.total : Math.round(b.total * 0.35);
    return {
      i: "0" + (i + 1), name: b.name, when: b.when, done: d,
      count: packed + "/" + b.total,
      w: Math.round((packed / b.total) * 100) + "%",
      barColor: d ? "#5C9E72" : "#E4622F",
      bg: d ? "rgba(124,192,143,.09)" : "#FBF8F2",
      border: d ? "rgba(124,192,143,.42)" : "rgba(21,20,15,.1)",
      fg: d ? "#6B6455" : "#15140F",
      boxBg: d ? "#5C9E72" : "transparent",
      boxBorder: d ? "#5C9E72" : "rgba(21,20,15,.22)",
    };
  });
  const packedN = bagsDone.filter(Boolean).length;

  // ---- plan-overlay map ----
  const bikePts = map3d ? isoProject(geom.bike, geom) : geom.bike;
  const fS = swim / G;
  const fT1 = (swim + t1) / G;
  const fB = (swim + t1 + bike) / G;
  const fT2 = (swim + t1 + bike + t2) / G;
  const f = scrub;

  let leg: "swim" | "t1" | "bike" | "t2" | "run";
  let legColor: string;
  let pt: [number, number];
  let kmAt: string;
  let legLabel: string;
  if (f < fS) {
    leg = "swim"; legColor = "#4F7C93"; pt = geom.swim[Math.round((f / fS) * (geom.swim.length - 1))];
    kmAt = (3.8 * scale * (f / fS)).toFixed(1); legLabel = "Swim · " + kmAt + " km";
  } else if (f < fT1) {
    leg = "t1"; legColor = "#8C8578"; pt = geom.swim[0]; kmAt = "—"; legLabel = "Transition 1";
  } else if (f < fB) {
    const u = (f - fT1) / (fB - fT1);
    leg = "bike"; legColor = "#E4622F"; pt = bikePts[Math.round(u * (bikePts.length - 1))];
    kmAt = (180.2 * scale * u).toFixed(1); legLabel = "Bike · " + kmAt + " km";
  } else if (f < fT2) {
    leg = "t2"; legColor = "#8C8578"; pt = geom.run[0]; kmAt = "—"; legLabel = "Transition 2";
  } else {
    const u = (f - fT2) / (1 - fT2);
    leg = "run"; legColor = "#64707A"; pt = geom.run[Math.round(u * (geom.run.length - 1))];
    kmAt = (42.2 * scale * u).toFixed(1); legLabel = "Run · " + kmAt + " km";
  }

  const startClock = 6 * 60 + 40;
  const elapsed = f * G;
  const clock = (m: number) => String(Math.floor((m % 1440) / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60)).padStart(2, "0");
  const ahead = rows.find((r) => r.eta >= elapsed) || rows[rows.length - 1];
  const gm = ahead.limit - ahead.eta;

  const aidKm = [34, 62.5, 92, 128.4, 164];
  const kmNum = +kmAt || 0;
  const nextAidVal = leg === "bike" ? (aidKm.find((k) => k > kmNum) ? "KM " + aidKm.find((k) => k > kmNum) : "T2") : leg === "run" ? "KM " + (Math.ceil(kmNum / 5.3) * 5.3).toFixed(1) : "—";

  const notes: Record<typeof leg, string> = {
    swim: "Two anticlockwise laps. Sight off the headland, not the buoy — the current pushes you inside on lap two.",
    t1: "Wetsuit off, helmet on, gels into the top tube. Eight minutes budgeted, not four.",
    bike: BIKE_NOTE(kmNum),
    t2: "Bike shoes off, cap and race belt on. Take the full five minutes and drink.",
    run: RUN_NOTE(kmNum),
  };

  const mn = Math.min(...geom.elev);
  const mx = Math.max(...geom.elev);
  const profileLine = geom.elev.map((v, i) => (i ? "L" : "M") + ((i / (geom.elev.length - 1)) * 1000).toFixed(1) + " " + (466 - ((v - mn) / (mx - mn)) * 74).toFixed(1)).join(" ");
  const profileArea = profileLine + " L 1000 470 L 0 470 Z";
  const profileX = (leg === "bike" ? ((f - fT1) / (fB - fT1)) * 1000 : leg === "swim" || leg === "t1" ? 0 : 1000).toFixed(1);

  const onScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setScrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  const barriers = rows.map((r) => {
    const m = r.limit - r.eta;
    return {
      name: r.name, eta: fmtClock(r.eta), limit: fmtClock(r.limit),
      margin: (m >= 0 ? "+" : "") + fmtClock(m),
      color: m < 0 ? "#C0392B" : m < 20 ? "#C98A1F" : "#5C9E72",
      bg: m < 0 ? "rgba(192,57,43,.07)" : m < 20 ? "rgba(224,163,60,.09)" : "rgba(124,192,143,.09)",
      border: m < 0 ? "rgba(192,57,43,.32)" : m < 20 ? "rgba(224,163,60,.36)" : "rgba(124,192,143,.36)",
      w: Math.max(3, Math.min(100, Math.round((r.eta / r.limit) * 100))) + "%",
    };
  });
  const contNote = failing
    ? "At +" + lost + " minutes the " + failing.name.toLowerCase() + " fails. Your contingency budget is " + fmtClock(Math.max(0, worst + lost)) + "."
    : lost === 0
      ? "With no time lost, the " + tight.name.toLowerCase() + " is the barrier that binds first."
      : "You can still lose " + fmtClock(worst) + " more before the " + tight.name.toLowerCase() + " fails.";

  const waypoints = [0.09, 0.24, 0.38, 0.52, 0.67, 0.86].map((fr, k) => {
    const p = bikePts[Math.round(fr * (bikePts.length - 1))];
    return { x: p[0].toFixed(1), y: p[1].toFixed(1), r: k === 3 ? 6 : 4, stroke: k === 3 ? "#E4622F" : "rgba(21,20,15,.4)" };
  });
  const drops = map3d
    ? geom.bike.filter((_, i) => i % 13 === 0).map((p, k) => {
        const q = bikePts[k * 13];
        return { d: "M" + q[0].toFixed(1) + " " + q[1].toFixed(1) + " L" + p[0].toFixed(1) + " " + (p[1] * 0.66 + 52).toFixed(1) };
      })
    : [];

  const legBands = [
    { name: "SWIM", left: "0%" },
    { name: "BIKE", left: (fT1 * 100).toFixed(1) + "%" },
    { name: "RUN", left: (fT2 * 100).toFixed(1) + "%" },
  ];

  const selectRace = (i: number) => {
    setRaceIdx(i);
    setLost(0);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="dashboard" alerts={ALERTS} />

      {/* ---------------- Race switcher ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 60, background: "rgba(241,238,232,.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.09)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578", flex: "none" }}>MY RACES</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {RACES.map((r, i) => {
                const selected = i === raceIdx;
                return (
                  <div
                    key={r.name}
                    onClick={() => selectRace(i)}
                    className="row-hover-border"
                    style={{
                      display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 13px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                      background: selected ? "#FBF8F2" : "rgba(255,255,255,.42)",
                      border: `1px solid ${selected ? "rgba(21,20,15,.22)" : "rgba(21,20,15,.09)"}`,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_MAP[r.status].dot, flex: "none" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-.01em", color: selected ? "#15140F" : "#6B6455" }}>{r.short}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: selected ? "#A8A192" : "#B8B1A2" }}>{r.away}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            href={routes.courseRecon}
            className="btn-dark-to-accent"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", height: 34, padding: "0 15px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13, fontWeight: 600, flex: "none" }}
          >
            <span className="mono" style={{ fontSize: 13, lineHeight: 1 }}>+</span>New race plan
          </Link>
        </div>
      </div>

      {/* ---------------- Race header ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 56, alignItems: "end" }}>
          <div>
            <Reveal style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid ${sm.border}`, borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: sm.fg }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot, animation: "breathe 2.6s ease-in-out infinite" }} />{R.status}
              </span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>{R.meta}</span>
            </Reveal>
            <Reveal as="h1" delay={0.05} style={{ whiteSpace: "nowrap", margin: 0, fontSize: 76, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em" }}>
              {R.name}
            </Reveal>
            <Reveal delay={0.1} style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 15.5, color: "#5C574B", whiteSpace: "nowrap" }}>
              <span>{R.date}</span><span style={{ color: "#C4BCAC" }}>·</span><span>{R.place}</span><span style={{ color: "#C4BCAC" }}>·</span><span>{R.start}</span>
            </Reveal>
          </div>
          <Reveal delay={0.14} style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 88, lineHeight: 0.82, letterSpacing: "-.055em" }}>{R.days}</div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#8C8578", marginTop: 12 }}>{R.days === 1 ? "DAY OUT" : "DAYS OUT"}</div>
          </Reveal>
        </div>

        {R.solved ? (
          <Reveal style={{ marginTop: 40, padding: "30px 34px", background: "#FBF8F2", borderRadius: 12, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -22px rgba(21,20,15,.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: verdictColor }} />
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: verdictColor }}>
                    {{ clear: "Clears every cut-off", tight: "Tight — one binding barrier", fail: "Infeasible as set" }[status]}
                  </span>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.035em" }}>
                  {failing
                    ? "You miss the " + failing.name.toLowerCase() + " by " + fmtClock(failing.eta - failing.limit) + "."
                    : "You clear the " + tight.name.toLowerCase() + " with " + fmtClock(worst) + " in hand."}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flex: "none" }}>
                <Link href={routes.racePlan} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 22px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>
                  View full plan
                </Link>
                <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>Race card</a>
                <a href="#" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>Export</a>
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal style={{ marginTop: 40, padding: "52px 34px", background: "#FBF8F2", borderRadius: 12, border: "1px dashed rgba(21,20,15,.2)", textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>DRAFT · NOT SOLVED</div>
            <p style={{ margin: "16px auto 0", maxWidth: 430, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>This race has a course but no plan yet.</p>
            <p style={{ margin: "12px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
              Six minutes of questions and the solver produces pacing, fuelling, bags and every cut-off margin.
            </p>
            <a href="#" className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600 }}>
              Solve this plan — $19
            </a>
          </Reveal>
        )}
      </section>

      {/* ---------------- Drift alert ---------------- */}
      {R.solved && R.drift && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 56px 0" }}>
          <Reveal style={{ position: "relative", background: "#191713", borderRadius: 12, padding: "28px 30px 26px", overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div style={{ position: "absolute", right: -90, top: -120, width: 420, height: 420, background: "radial-gradient(closest-side,rgba(224,163,60,.16),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 44 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C", animation: "breathe 2.6s ease-in-out infinite" }} />
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#E0A33C" }}>PLAN DRIFT · REVIEW</span>
                </div>
                <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.032em", marginTop: 13, color: "#FBF8F2" }}>Forecast moved to 31°C. Bike target down 6 w.</div>
                <p style={{ margin: "9px 0 0", maxWidth: 600, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>
                  Thursday is 3.4°C warmer than when this plan was solved. Heat adjustment moves power, fluid and one bag item.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, flex: "none" }}>
                <a href="#" className="btn-outline-fade" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", border: "1px solid rgba(251,248,242,.24)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, color: "#FBF8F2" }}>Keep current</a>
                <a href="#" className="btn-drift-apply" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 20px", background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>Apply and re-solve</a>
              </div>
            </div>
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, marginTop: 26, background: "rgba(251,248,242,.09)", borderRadius: 8, overflow: "hidden" }}>
              {DRIFT.map((d) => (
                <div key={d.label} style={{ background: "#191713", padding: "16px 18px 15px" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "rgba(251,248,242,.34)" }}>{d.label}</div>
                  <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 10, fontSize: 16 }}>
                    <span style={{ color: "rgba(251,248,242,.3)", textDecoration: "line-through" }}>{d.from}</span>
                    <span style={{ color: "rgba(251,248,242,.22)" }}>→</span>
                    <span style={{ color: "#E0A33C" }}>{d.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {R.solved && (
        <>
          {/* ---------------- Three legs ---------------- */}
          <section id="plan" style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 30 }}>
              <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Your three legs.</Reveal>
              <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>
                TARGETS SOLVED FOR {fmtClock(G)}:00 · HEAT ADJUSTED
              </Reveal>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {legs.map((l) => (
                <Reveal key={l.name} delay={l.delay} style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 5, background: l.tint, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                      </span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#6B6455" }}>{l.name}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#A8A192" }}>{l.dist}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 22 }}>
                    <span className="mono" style={{ fontSize: 44, lineHeight: 0.9, letterSpacing: "-.045em" }}>{l.target}</span>
                    <span className="mono" style={{ fontSize: 14, color: "#8C8578" }}>{l.unit}</span>
                  </div>
                  <svg viewBox="0 0 300 56" style={{ display: "block", width: "100%", marginTop: 20 }}>
                    <path d={l.area} fill={l.tint} />
                    <path d={l.line} fill="none" stroke={l.color} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <span style={{ fontSize: 13.5, color: "#6B6455" }}>{l.note}</span>
                    <span className="mono" style={{ fontSize: 15 }}>{l.split}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ---------------- Plan overlay map ---------------- */}
          <section style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 30 }}>
              <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Where you&apos;ll be, and when.</Reveal>
              <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>PLAN OVERLAY · DRAG THE COURSE</Reveal>
            </div>

            <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: 18, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 316px", gap: 18 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 5 }}>
                        <span onClick={() => setMap3d(false)} className="mono" style={{ padding: "6px 13px", borderRadius: 3, fontSize: 9.5, letterSpacing: ".13em", cursor: "pointer", background: !map3d ? "#15140F" : "transparent", color: !map3d ? "#FBF8F2" : "#8C8578" }}>2D</span>
                        <span onClick={() => setMap3d(true)} className="mono" style={{ padding: "6px 13px", borderRadius: 3, fontSize: 9.5, letterSpacing: ".13em", cursor: "pointer", background: map3d ? "#15140F" : "transparent", color: map3d ? "#FBF8F2" : "#8C8578" }}>3D</span>
                      </div>
                      <div className="mono" style={{ display: "flex", gap: 14, fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 2, background: "#4F7C93" }} />SWIM</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 2, background: "#E4622F" }} />BIKE</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 2, background: "#64707A" }} />RUN</span>
                      </div>
                    </div>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>{map3d ? "ISOMETRIC" : "PLAN VIEW"} · BUNDLE v2026.2</span>
                  </div>

                  <div onMouseMove={onScrub} style={{ position: "relative", background: "#F4F0E7", borderRadius: 9, overflow: "hidden", cursor: "crosshair" }}>
                    <svg viewBox="0 0 1000 470" style={{ display: "block", width: "100%", height: "auto" }}>
                      <path d={toPath(geom.swim, false)} fill="none" stroke="#4F7C93" strokeWidth={2} strokeLinejoin="round" strokeOpacity={0.75} />
                      <text x={68} y={168} textAnchor="middle" fill="#4F7C93" fontFamily="JetBrains Mono, monospace" fontSize={11} letterSpacing={1.6} opacity={0.8}>SWIM · 2 LAPS</text>
                      <path d={toPath(geom.run, true)} fill="none" stroke="#64707A" strokeWidth={2} strokeLinejoin="round" strokeDasharray="6 5" strokeOpacity={0.75} />
                      <text x={300} y={357} textAnchor="middle" fill="#64707A" fontFamily="JetBrains Mono, monospace" fontSize={11} letterSpacing={1.6} opacity={0.8}>RUN · 4 LAPS</text>
                      {drops.map((p, k) => (
                        <path key={k} d={p.d} stroke="rgba(228,98,47,.16)" strokeWidth={1} />
                      ))}
                      <path d={toPath(bikePts, true)} fill="none" stroke="#E4622F" strokeWidth={2.2} strokeLinejoin="round" />
                      {waypoints.map((w, k) => (
                        <circle key={k} cx={w.x} cy={w.y} r={w.r} fill="#F4F0E7" stroke={w.stroke} strokeWidth={1.6} />
                      ))}
                      <circle cx={pt[0].toFixed(1)} cy={pt[1].toFixed(1)} r={8} fill={legColor} stroke="#F4F0E7" strokeWidth={3} />
                      <line x1={0} y1={382} x2={1000} y2={382} stroke="rgba(21,20,15,.1)" strokeWidth={1} />
                      <text x={12} y={399} fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize={10.5} letterSpacing={1.5}>BIKE PROFILE · 2,340 M GAIN</text>
                      <path d={profileArea} fill="rgba(228,98,47,.12)" />
                      <path d={profileLine} fill="none" stroke="#E4622F" strokeWidth={1.6} strokeLinejoin="round" />
                      <line x1={profileX} y1={388} x2={profileX} y2={470} stroke="rgba(21,20,15,.32)" strokeWidth={1} />
                    </svg>
                  </div>

                  <div style={{ position: "relative", height: 34, margin: "14px 6px 0" }}>
                    <div style={{ position: "absolute", left: 0, right: 0, top: 9, height: 3, borderRadius: 2, background: "rgba(21,20,15,.09)" }} />
                    <div style={{ position: "absolute", left: 0, top: 9, height: 3, borderRadius: 2, background: legColor, width: (f * 100).toFixed(1) + "%", transition: "width .12s linear" }} />
                    {legBands.map((b) => (
                      <span key={b.name} className="mono" style={{ position: "absolute", left: b.left, top: 22, fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>{b.name}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#F4F0E7", borderRadius: 9, padding: "24px 24px 22px", display: "flex", flexDirection: "column" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#A8A192" }}>PROJECTED CLOCK</div>
                  <div className="mono" style={{ fontSize: 46, lineHeight: 0.9, letterSpacing: "-.045em", marginTop: 12 }}>{clock(startClock + elapsed)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: legColor }} />
                    <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>{legLabel}</span>
                    <span className="mono" style={{ fontSize: 11, color: "#8C8578", marginLeft: "auto" }}>{fmtClock(elapsed)} ELAPSED</span>
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.09)", fontSize: 14.5, lineHeight: 1.5, color: "#3D3A31" }}>{notes[leg]}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginTop: "auto", paddingTop: 22 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>NEXT AID</div>
                      <div className="mono" style={{ fontSize: 17, marginTop: 7 }}>{nextAidVal}</div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>FUEL DUE</div>
                      <div className="mono" style={{ fontSize: 17, marginTop: 7 }}>{leg === "bike" ? "78 g" : leg === "run" ? "60 g" : "—"}</div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>NEXT GATE</div>
                      <div className="mono" style={{ fontSize: 13, marginTop: 9 }}>{ahead.name}</div>
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>MARGIN</div>
                      <div className="mono" style={{ fontSize: 17, marginTop: 7, color: gm < 0 ? "#C0392B" : gm < 20 ? "#A0701A" : "#3E7B55" }}>{(gm >= 0 ? "+" : "") + fmtClock(gm)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ---------------- Contingency ---------------- */}
          <section style={{ marginTop: 88, padding: "88px 0 92px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
            <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
              <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 42px" }}>
                <Reveal className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: ".18em", color: "#8C8578", marginBottom: 20 }}>
                  <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />CUT-OFF CLOCK · CONTINGENCY MODEL
                </Reveal>
                <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 52, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>How much can go wrong?</Reveal>
                <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 420, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>
                  Add the time you might lose to a puncture, a slow transition or a bad patch. Watch which barrier binds first.
                </Reveal>
              </div>

              <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
                <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "34px 36px 30px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>TIME LOST TO CONTINGENCY</span>
                        <span className="mono" style={{ fontSize: 34, letterSpacing: "-.035em" }}>+{lost}<span style={{ fontSize: 15, color: "#8C8578" }}> min</span></span>
                      </div>
                      <input type="range" min={0} max={240} step={5} value={lost} onChange={(e) => setLost(+e.target.value)} style={{ width: "100%", margin: "20px 0 8px", height: 18 }} />
                      <div className="mono" style={{ position: "relative", height: 15, fontSize: 9.5, letterSpacing: ".11em", color: "#A8A192" }}>
                        <span style={{ position: "absolute", left: 0 }}>NONE</span>
                        <span style={{ position: "absolute", left: "10.4%", transform: "translateX(-50%)" }}>PUNCTURE</span>
                        <span style={{ position: "absolute", left: "31.2%", transform: "translateX(-50%)" }}>MECHANICAL</span>
                        <span style={{ position: "absolute", left: "62.5%", transform: "translateX(-50%)" }}>BAD PATCH</span>
                        <span style={{ position: "absolute", right: 0 }}>+240</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 34 }}>
                    {barriers.map((b) => (
                      <div key={b.name} style={{ borderRadius: 9, padding: "20px 20px 18px", background: b.bg, border: `1px solid ${b.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#6B6455" }}>{b.name}</span>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.color }} />
                        </div>
                        <div className="mono" style={{ fontSize: 30, letterSpacing: "-.04em", marginTop: 16, color: b.color }}>{b.margin}</div>
                        <div style={{ height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", marginTop: 16, position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: b.w, background: b.color, borderRadius: 2, transition: "width .5s cubic-bezier(.16,1,.3,1)" }} />
                        </div>
                        <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 9.5, color: "#A8A192" }}>
                          <span>{b.eta}</span><span>LIMIT {b.limit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: verdictColor, flex: "none" }} />
                    <span style={{ fontSize: 16.5, letterSpacing: "-.015em" }}>{contNote}</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* ---------------- Race week tasks ---------------- */}
          <section style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 26 }}>
              <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Race week.</Reveal>
              <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>
                {doneN === 7 ? "ALL SEVEN DONE" : `${doneN} OF 7 DONE · NEXT IS ${nextTaskLabel}`}
              </Reveal>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
              {tasks.map((t, i) => (
                <div
                  key={t.date}
                  onClick={() => setTasksDone((prev) => { const a = prev.slice(); a[i] = !a[i]; return a; })}
                  className="row-hover-border"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 11, padding: "18px 18px 20px", cursor: "pointer", minHeight: 158, display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: t.dateColor }}>{t.date}</span>
                    <span style={{ width: 18, height: 18, borderRadius: 5, border: `1px solid ${t.boxBorder}`, background: t.boxBg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      {t.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                  </div>
                  <div style={{ fontSize: 15, lineHeight: 1.28, fontWeight: 500, letterSpacing: "-.02em", marginTop: 16, color: t.textColor }}>{t.label}</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: "auto", paddingTop: 12, color: "#A8A192" }}>{t.note}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------------- Bags + conditions ---------------- */}
          <section style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 52 }}>
              <div>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, marginBottom: 26 }}>
                  <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Five bags.</Reveal>
                  <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>
                    {packedN === 5 ? "ALL FIVE PACKED" : `${packedN} OF 5 PACKED`}
                  </Reveal>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {bags.map((b, i) => (
                    <div
                      key={b.name}
                      onClick={() => setBagsDone((prev) => { const a = prev.slice(); a[i] = !a[i]; return a; })}
                      className="row-hover-border"
                      style={{ display: "grid", gridTemplateColumns: "26px 1fr 130px 92px 20px", gap: 18, alignItems: "center", background: b.bg, border: `1px solid ${b.border}`, borderRadius: 10, padding: "17px 20px", cursor: "pointer" }}
                    >
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#A8A192" }}>{b.i}</span>
                      <span style={{ fontSize: 16.5, fontWeight: 500, letterSpacing: "-.022em", color: b.fg, whiteSpace: "nowrap" }}>{b.name}</span>
                      <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192", whiteSpace: "nowrap" }}>{b.when}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: b.w, background: b.barColor, borderRadius: 2, transition: "width .45s cubic-bezier(.16,1,.3,1)" }} />
                        </div>
                        <span className="mono" style={{ fontSize: 10.5, color: "#6B6455", whiteSpace: "nowrap" }}>{b.count}</span>
                      </div>
                      <span style={{ width: 18, height: 18, borderRadius: 5, border: `1px solid ${b.boxBorder}`, background: b.boxBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {b.done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Reveal as="h2" style={{ margin: "0 0 26px", fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Conditions.</Reveal>
                <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 28px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>THURSDAY FORECAST</span>
                    <span className="mono" style={{ fontSize: 9.5, color: "#A8A192" }}>14:20</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 18 }}>
                    <span className="mono" style={{ fontSize: 56, lineHeight: 0.85, letterSpacing: "-.05em" }}>31°</span>
                    <span style={{ fontSize: 14.5, color: "#6B6455" }}>feels 34° at 14:00</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "18px 24px", marginTop: 26, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    {[
                      { l: "WIND", v: "21 km/h NE" },
                      { l: "HUMIDITY", v: "64%" },
                      { l: "WATER", v: "23.1°C" },
                      { l: "UV INDEX", v: "9 · high" },
                    ].map((s) => (
                      <div key={s.l}>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{s.l}</div>
                        <div className="mono" style={{ fontSize: 17, marginTop: 6 }}>{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, padding: "14px 16px", borderRadius: 8, background: "rgba(21,20,15,.04)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7C93", flex: "none" }} />
                    <span style={{ fontSize: 13.5, color: "#5C574B" }}>Wetsuit verdict: <span style={{ color: "#15140F", fontWeight: 500 }}>non-wetsuit, 82%</span></span>
                  </div>
                </Reveal>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ---------------- Season table ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 26 }}>
          <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Season 2026.</Reveal>
          <Reveal as={Link} href={routes.courseRecon} style={{ fontSize: 14.5, fontWeight: 600, color: "#C6461B", paddingBottom: 8 }}>Add a race →</Reveal>
        </div>
        <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 28px 20px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
          <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr .8fr 1fr 1fr 110px", gap: 20, padding: "18px 0 12px", fontSize: 9, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
            <span>RACE</span><span>DATE</span><span>DISTANCE</span><span>PLAN</span><span>PROJECTED</span><span style={{ textAlign: "right" }}>FEASIBILITY</span>
          </div>
          {RACES.map((r, i) => {
            const tag = TAG_STYLE[r.statusTag];
            const dateShort = r.date.replace(/^\w+ /, "").replace(/ 2026$/, "");
            return (
              <div
                key={r.name}
                onClick={() => selectRace(i)}
                className="row-hover-faint"
                style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr .8fr 1fr 1fr 110px", gap: 20, padding: "19px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center", cursor: "pointer", background: i === raceIdx ? "rgba(228,98,47,.05)" : "transparent" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 500, letterSpacing: "-.022em", whiteSpace: "nowrap" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: STATUS_MAP[r.status].dot, flex: "none" }} />{r.name}
                </span>
                <span className="mono" style={{ fontSize: 13.5, color: "#5C574B" }}>{dateShort}</span>
                <span className="mono" style={{ fontSize: 13.5, color: "#5C574B" }}>{r.dist}</span>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".11em", padding: "4px 9px", borderRadius: 4, justifySelf: "start", whiteSpace: "nowrap", background: tag.bg, color: tag.fg }}>{r.statusTag}</span>
                <span className="mono" style={{ fontSize: 13.5, color: r.proj === "—" ? "#B8B1A2" : "#15140F" }}>{r.proj}</span>
                <span className="mono" style={{ textAlign: "right", fontSize: 11, letterSpacing: ".1em", color: FEAS_COLOR[r.feas], whiteSpace: "nowrap" }}>{r.feas}</span>
              </div>
            );
          })}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginTop: 26, padding: "28px 0 8px", borderTop: "1px solid rgba(21,20,15,.1)" }}>
            {[
              { v: "7", l: "PLANS BUILT" },
              { v: "3", l: "RACES FINISHED" },
              { v: "11:52", l: "BEST FULL" },
              { v: "1,184", u: "km", l: "RACED" },
            ].map((s) => (
              <div key={s.l}>
                <div className="mono" style={{ fontSize: 30, letterSpacing: "-.04em" }}>
                  {s.v}
                  {s.u && <span style={{ fontSize: 14, color: "#8C8578" }}>{s.u}</span>}
                </div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginTop: 8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Post-race upsell ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "88px 56px 0" }}>
        <Reveal style={{ position: "relative", borderRadius: 14, overflow: "hidden", padding: "64px 52px" }}>
          <MediaPlaceholder path="assets/dashboard/post-race.jpg" background="linear-gradient(125deg,#3B322A 0%,#1B1712 62%,#100E0C 100%)" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(12,11,10,.84),rgba(12,11,10,.34))" }} />
          <div className="mono" style={{ position: "absolute", left: 52, top: 22, fontSize: 9, letterSpacing: ".16em", color: "rgba(255,255,255,.35)" }}>ASSETS/DASHBOARD/POST-RACE.JPG · 21:9</div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 56 }}>
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "rgba(255,255,255,.45)", marginBottom: 20 }}>LOCKED · SEASON PASS</div>
              <h2 style={{ margin: 0, fontSize: 48, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em", color: "#FBF8F2" }}>Your estimates<br />become measurements.</h2>
              <p style={{ margin: "20px 0 0", maxWidth: 440, fontSize: 16, lineHeight: 1.5, color: "rgba(255,255,255,.62)" }}>
                Upload the file after Sunday and your gut ceiling, sweat rate and heat decoupling stop being guesses.
              </p>
            </div>
            <Link href={routes.pricing} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 52, padding: "0 28px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15.5, fontWeight: 600, flex: "none" }}>
              See Season Pass
            </Link>
          </div>
        </Reveal>
      </section>

      <div style={{ marginTop: 104 }}>
        <Footer />
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedDashboardPage() {
  return (
    <GuardedPage>
      <DashboardPage />
    </GuardedPage>
  );
}
