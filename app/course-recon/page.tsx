"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import {
  FINISH_HIST,
  aidRows,
  buildElevation,
  buildRoute,
  buildRunSmall,
  fmtClock,
  toPath,
} from "@/lib/courseRecon";

const SUBNAV = [
  { href: "#overview", label: "OVERVIEW" },
  { href: "#elevation", label: "ELEVATION" },
  { href: "#aid", label: "AID STATIONS" },
  { href: "#cutoffs", label: "CUT-OFFS" },
  { href: "#conditions", label: "CONDITIONS" },
];

export default function CourseReconPage() {
  const el = useMemo(() => buildElevation(), []);
  const rt = useMemo(() => buildRoute(), []);
  const runSmall = useMemo(() => buildRunSmall(), []);
  const bikeSmall = useMemo(() => el.filter((_, k) => k % 3 === 0), [el]);
  const aid = useMemo(() => aidRows(), []);

  const [goal, setGoal] = useState(705);
  const [hoverOn, setHoverOn] = useState(false);
  const [hi, setHi] = useState(0);

  const swim = goal * 0.093;
  const t1 = 8;
  const t2 = 5;
  const rest = goal - swim - t1 - t2;
  const bike = rest * 0.582;
  const run = rest * 0.418;

  const rows = [
    { name: "SWIM EXIT", limit: 140, eta: swim },
    { name: "BIKE KM 120", limit: 510, eta: swim + t1 + bike * (120 / 180.2) },
    { name: "BIKE CUT-OFF", limit: 630, eta: swim + t1 + bike },
    { name: "FINISH LINE", limit: 960, eta: goal },
  ];
  const worst = Math.min(...rows.map((r) => r.limit - r.eta));
  const failing = rows.find((r) => r.limit - r.eta < 0);
  const tight = rows.reduce((a, b) => (a.limit - a.eta < b.limit - b.eta ? a : b));
  const status: "clear" | "tight" | "fail" = failing ? "fail" : worst < 20 ? "tight" : "clear";
  const verdictColor = { clear: "#2E7D53", tight: "#A9761A", fail: "#C0432E" }[status];
  const verdictBg =
    status === "clear" ? "rgba(95,175,119,.07)" : status === "tight" ? "rgba(216,155,44,.08)" : "rgba(216,65,47,.09)";
  const verdictLabel = { clear: "Clears every cut-off", tight: "Tight — one binding barrier", fail: "Infeasible as set" }[status];
  const verdictHead = failing
    ? "This misses the " + failing.name.toLowerCase() + " by " + fmtClock(failing.eta - failing.limit) + "."
    : "You clear the " + tight.name.toLowerCase() + " with " + fmtClock(worst) + " to spare.";
  const verdictSub = failing
    ? "The barrier fails before you reach the run. A solved plan would name the two levers that change it — bike power and time lost in transition."
    : status === "tight"
      ? "Under twenty minutes on the tightest barrier. One puncture and this becomes a decision made under pressure rather than in advance."
      : "Comfortable at every barrier, so the plan can be built around finishing well rather than finishing at all.";

  const line = toPath(el, 800, 350, 456);
  const elevArea = line + " L 800 460 L 0 460 Z";
  const routePath = rt.map((p, k) => (k ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") + " Z";
  const runPath = (() => {
    let d = "";
    for (let k = 0; k <= 70; k++) {
      const a = (k / 70) * Math.PI * 2;
      d += (k ? " L " : "M ") + (250 + 110 * Math.cos(a)).toFixed(1) + " " + (296 + 24 * Math.sin(a)).toFixed(1);
    }
    return d;
  })();
  const markers = [0.09, 0.24, 0.38, 0.52, 0.67, 0.86].map((f) => {
    const p = rt[Math.round(f * (rt.length - 1))];
    return { x: p[0].toFixed(1), y: p[1].toFixed(1) };
  });
  const mp = rt[Math.round((hi / (el.length - 1)) * (rt.length - 1))];
  const grad = hi > 0 ? ((el[hi] - el[hi - 1]) / (180200 / el.length)) * 100 : 0;
  const km = 180.2 * (hi / (el.length - 1));
  const pointNote =
    km < 20
      ? "Flat coastal road out of town. Hold back here — the first climb starts at km 42."
      : km < 70
        ? "Coll de Femenia. 8.4 km at 5.8% average, the single biggest power decision of the day."
        : km < 110
          ? "Technical descent, then the exposed plain. Aid station at km 92 with your special-needs bag."
          : km < 150
            ? "The valley drag. Headwind in eight of eleven editions, and where the bike cut-off is won or lost."
            : "Rolling return to T2. Two short ramps, then flat into transition.";

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHoverOn(true);
    setHi(Math.round(f * (el.length - 1)));
  };

  const smallBike = toPath(bikeSmall, 320, 12, 76);
  const smallBikeArea = smallBike + " L 320 76 L 0 76 Z";
  const smallRun = toPath(runSmall, 320, 12, 76);
  const smallRunArea = smallRun + " L 320 76 L 0 76 Z";

  const progressW = (((goal - 540) / 480) * 100).toFixed(1) + "%";
  const clock = rows.map((r, k) => {
    const m = r.limit - r.eta;
    return {
      name: r.name,
      limit: fmtClock(r.limit),
      eta: fmtClock(r.eta),
      margin: (m >= 0 ? "+" : "") + fmtClock(m),
      color: m < 0 ? "#C0432E" : m < 20 ? "#A9761A" : "#2E7D53",
      left: [9, 37, 63, 91][k] + "%",
    };
  });

  const splits = [
    { name: "Swim · 3.8 km", target: Math.round((swim * 60) / 38) + "s/100m", time: fmtClock(swim) },
    { name: "T1", target: "transition", time: fmtClock(t1) },
    { name: "Bike · 180.2 km", target: Math.round((180.2 / (bike / 60)) * 10) / 10 + " km/h", time: fmtClock(bike) },
    { name: "T2", target: "transition", time: fmtClock(t2) },
    { name: "Run · 42.2 km", target: fmtClock(run / 42.2) + "/km", time: fmtClock(run) },
  ];

  const hmax = Math.max(...FINISH_HIST);
  const youIdx = Math.max(0, Math.min(15, Math.round(((goal - 540) / 480) * 15)));
  const hist = FINISH_HIST.map((v, k) => ({
    x: k * 30 + 2,
    y: 200 - (v / hmax) * 186,
    h: (v / hmax) * 186,
    fill: k === youIdx ? "#E4622F" : "rgba(21,20,15,.16)",
  }));
  const youX = youIdx * 30 + 14;
  const percentile = (() => {
    const below = FINISH_HIST.slice(0, youIdx).reduce((a, b) => a + b, 0);
    const tot = FINISH_HIST.reduce((a, b) => a + b, 0);
    return Math.round((below / tot) * 100) + "%";
  })();

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref="#convert" />

      {/* ---------------- Hero ---------------- */}
      <section style={{ position: "relative", height: "66vh", minHeight: 520, background: "#1C1916", overflow: "hidden" }}>
        <MediaPlaceholder
          path="assets/courses/tramuntana-hero.jpg"
          background="linear-gradient(155deg,#453B31 0%,#251F1A 52%,#13110F 100%)"
          style={{ position: "absolute", inset: 0 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top,rgba(12,11,10,.9) 0%,rgba(12,11,10,.3) 55%,rgba(12,11,10,.45) 100%)",
          }}
        />
        <div className="mono" style={{ position: "absolute", left: 56, top: 28, fontSize: 9.5, letterSpacing: ".16em", color: "rgba(255,255,255,.4)" }}>
          ASSETS/COURSES/TRAMUNTANA-HERO.JPG · 21:9
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 1360, margin: "0 auto", padding: "0 56px 44px" }}>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, letterSpacing: ".15em", color: "rgba(255,255,255,.45)", marginBottom: 22 }}>
            <Link href={routes.home} style={{ color: "rgba(255,255,255,.45)" }}>RACEOS</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,.8)" }}>TRAMUNTANA FULL 2026</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 56 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <span
                  className="mono"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 10px",
                    border: "1px solid rgba(124,192,143,.45)",
                    borderRadius: 4,
                    fontSize: 9.5,
                    letterSpacing: ".14em",
                    color: "#8FCBA0",
                  }}
                >
                  <span style={{ width: 5, height: 5, background: "#7CC08F", borderRadius: "50%" }} />OFFICIAL COURSE
                </span>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>VERIFIED 04 MAR 2026</span>
              </div>
              <h1 data-reveal="out" style={{ whiteSpace: "nowrap", margin: 0, fontSize: 92, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em", color: "#FBF8F2" }}>
                Tramuntana Full
              </h1>
              <div style={{ display: "flex", gap: 22, marginTop: 20, fontSize: 16, color: "rgba(255,255,255,.66)", whiteSpace: "nowrap" }}>
                <span>Port de Pollença, Mallorca</span>
                <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                <span>Sunday 21 June 2026</span>
                <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                <span>06:40 rolling start</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flex: "none" }}>
              <a
                href="#cutoffs"
                className="btn-outline-fade"
                style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 24px", border: "1px solid rgba(255,255,255,.28)", borderRadius: 6, fontSize: 15, fontWeight: 600, color: "#FBF8F2" }}
              >
                Check my cut-offs
              </a>
              <a
                href="#convert"
                className="btn-accent-invert"
                style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600 }}
              >
                Build your plan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Map + layers ---------------- */}
      <section style={{ maxWidth: 1360, margin: "34px auto 0", padding: "0 56px" }}>
        <div style={{ background: "#15140F", borderRadius: 9, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 316px" }}>
            <div onMouseMove={onHover} onMouseLeave={() => setHoverOn(false)} style={{ position: "relative", background: "#0B0A09", cursor: "crosshair" }}>
              <svg viewBox="0 0 800 460" style={{ display: "block", width: "100%", height: "auto" }}>
                <defs>
                  <linearGradient id="cr-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E4622F" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#E4622F" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <path d={routePath} fill="none" stroke="rgba(255,255,255,.34)" strokeWidth={1.8} strokeLinejoin="round" />
                <path d={runPath} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={1.5} strokeDasharray="5 5" />
                <rect x={70} y={258} width={70} height={36} rx={5} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={1.4} strokeDasharray="3 4" />
                <text x={105} y={311} textAnchor="middle" fill="#6B665B" fontFamily="JetBrains Mono, monospace" fontSize={9} letterSpacing={1.2}>SWIM</text>
                {markers.map((m, k) => (
                  <circle key={k} cx={m.x} cy={m.y} r={4} fill="#0B0A09" stroke="rgba(255,255,255,.6)" strokeWidth={1.4} />
                ))}
                {hoverOn && <circle cx={mp[0].toFixed(1)} cy={mp[1].toFixed(1)} r={7} fill="#E4622F" stroke="#0B0A09" strokeWidth={2.4} />}
                <path d={elevArea} fill="url(#cr-fill)" />
                <path d={line} fill="none" stroke="#E4622F" strokeWidth={1.8} strokeLinejoin="round" />
                {hoverOn && <line x1={((hi / (el.length - 1)) * 800).toFixed(1)} y1={340} x2={((hi / (el.length - 1)) * 800).toFixed(1)} y2={460} stroke="rgba(255,255,255,.42)" strokeWidth={1} />}
              </svg>
              <div style={{ position: "absolute", left: 20, top: 18, display: "flex", gap: 6, padding: 4, background: "rgba(255,255,255,.07)", borderRadius: 6 }}>
                <span className="mono" style={{ padding: "5px 13px", borderRadius: 6, background: "#E4622F", color: "#fff", fontSize: 10, letterSpacing: ".1em" }}>2D</span>
                <span className="mono" style={{ padding: "5px 13px", borderRadius: 6, color: "#7C7669", fontSize: 10, letterSpacing: ".1em" }}>3D</span>
              </div>
              <div className="mono" style={{ position: "absolute", left: 20, bottom: 16, fontSize: 9.5, letterSpacing: ".12em", color: "#6B665B" }}>
                BIKE PROFILE · 180.2 KM · 2,340 M GAIN · MAX GRADIENT 12.4%
              </div>
              <div className="mono" style={{ position: "absolute", right: 20, top: 18, display: "flex", gap: 16, fontSize: 11, color: "#FBF8F2" }}>
                {hoverOn && <span>{km.toFixed(1)} km</span>}
                {hoverOn && <span>{Math.round(el[hi])} m</span>}
                {hoverOn && <span style={{ color: "#E4622F" }}>{grad.toFixed(1)}%</span>}
              </div>
            </div>

            <div style={{ borderLeft: "1px solid rgba(255,255,255,.09)", padding: "22px 24px", color: "#FBF8F2" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#5A554C" }}>LAYERS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                {[
                  { label: "Race route", swatch: <span style={{ width: 14, height: 2, background: "rgba(255,255,255,.5)" }} />, status: "ON" },
                  { label: "Aid stations", swatch: <span style={{ width: 8, height: 8, border: "1.4px solid rgba(255,255,255,.6)", borderRadius: "50%" }} />, status: "ON · 11" },
                  { label: "Transitions", swatch: <span style={{ width: 8, height: 8, background: "rgba(255,255,255,.55)" }} />, status: "ON · 2" },
                  { label: "Cut-off points", swatch: <span style={{ width: 8, height: 8, border: "1.4px solid #E4622F", transform: "rotate(45deg)" }} />, status: "ON · 4" },
                  { label: "Gradient heat", swatch: <span style={{ width: 14, height: 2, background: "rgba(255,255,255,.18)" }} />, status: "OFF", off: true },
                  { label: "Spectator zones", swatch: <span style={{ width: 14, height: 2, background: "rgba(255,255,255,.18)" }} />, status: "OFF · 6", off: true },
                ].map((layer, i, arr) => (
                  <div
                    key={layer.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : undefined,
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: layer.off ? "#6B665B" : "#CFC9BC" }}>
                      {layer.swatch}
                      {layer.label}
                    </span>
                    <span className="mono" style={{ fontSize: 10, color: layer.off ? "#5A554C" : "#7CC08F" }}>{layer.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.09)" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#5A554C" }}>AT THIS POINT</div>
                <div className="mono" style={{ marginTop: 14, fontSize: 32, letterSpacing: "-.02em" }}>
                  {km.toFixed(1)}
                  <span style={{ fontSize: 14, color: "#5A554C" }}> km</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55, color: "#96907F" }}>{pointNote}</div>
              </div>
              <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,.05)", fontSize: 12.5, lineHeight: 1.5, color: "#7C7669" }}>
                A structured text description of this course is available as a full alternative to the map.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Sub-nav ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 40, background: "rgba(241,238,232,.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(21,20,15,.10)", marginTop: 44 }}>
        <div className="mono" style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 52, display: "flex", alignItems: "center", gap: 32, fontSize: 10.5, letterSpacing: ".14em" }}>
          {SUBNAV.map((s) => (
            <a key={s.href} href={s.href} style={{ color: s.href === "#cutoffs" ? "#E4622F" : "#8C8578" }}>
              {s.label}
            </a>
          ))}
          <span style={{ marginLeft: "auto", color: "#8C8578" }}>SEASON 2026</span>
        </div>
      </div>

      {/* ---------------- Overview ---------------- */}
      <section id="overview" style={{ maxWidth: 1360, margin: "0 auto", padding: "64px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(21,20,15,.14)", borderTop: "1px solid rgba(21,20,15,.14)", borderBottom: "1px solid rgba(21,20,15,.14)" }}>
          {[
            { label: "SWIM", value: "3.8", unit: "km", note: "Two-lap sea swim, anticlockwise, beach exit" },
            { label: "BIKE", value: "180.2", unit: "km", note: "One loop, 2,340 m gain, three sustained climbs" },
            { label: "RUN", value: "42.2", unit: "km", note: "Four seafront laps, 210 m gain, unlit after km 30" },
            { label: "TOTAL CUT-OFF", value: "16:00", unit: "", note: "Four barriers, tightest is the bike at 10:30" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#F1EEE8", padding: "26px 28px 30px" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>{c.label}</div>
              <div className="mono" style={{ fontSize: 38, letterSpacing: "-.03em", marginTop: 12 }}>
                {c.value}
                {c.unit && <span style={{ fontSize: 16, color: "#8C8578" }}> {c.unit}</span>}
              </div>
              <div style={{ fontSize: 14, color: "#5C574B", marginTop: 10 }}>{c.note}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Elevation ---------------- */}
      <section id="elevation" style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(21,20,15,.14)", paddingTop: 26 }}>
          <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-.045em" }}>
            Where the course takes it out of you.
          </Reveal>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".13em", color: "#8C8578" }}>ELEVATION SAMPLED FROM TERRAIN, NOT BAROMETERS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 36 }}>
          <div style={{ background: "#FBF8F2", border: "1px solid rgba(21,20,15,.14)", borderRadius: 8, padding: "22px 24px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em" }}>Swim</span>
              <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>SEA LEVEL · 2 LAPS</span>
            </div>
            <svg viewBox="0 0 320 90" style={{ display: "block", width: "100%", marginTop: 18 }}>
              <line x1={0} y1={70} x2={320} y2={70} stroke="rgba(46,111,142,.4)" strokeWidth={1.6} />
              <circle cx={20} cy={70} r={3.5} fill="#2E6F8E" />
              <circle cx={160} cy={70} r={3} fill="none" stroke="#2E6F8E" strokeWidth={1.4} />
              <circle cx={300} cy={70} r={3.5} fill="#E4622F" />
            </svg>
            <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 6 }}>No profile to render. Current runs south-west on the second lap.</div>
          </div>
          <div style={{ background: "#FBF8F2", border: "1px solid rgba(21,20,15,.14)", borderRadius: 8, padding: "22px 24px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em" }}>Bike</span>
              <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>2,340 M · MAX 12.4%</span>
            </div>
            <svg viewBox="0 0 320 90" style={{ display: "block", width: "100%", marginTop: 18 }}>
              <path d={smallBikeArea} fill="rgba(228,98,47,.14)" />
              <path d={smallBike} fill="none" stroke="#E4622F" strokeWidth={1.6} />
            </svg>
            <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 6 }}>Coll de Femenia at km 54, the long valley drag from km 118.</div>
          </div>
          <div style={{ background: "#FBF8F2", border: "1px solid rgba(21,20,15,.14)", borderRadius: 8, padding: "22px 24px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em" }}>Run</span>
              <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>210 M · 4 LAPS</span>
            </div>
            <svg viewBox="0 0 320 90" style={{ display: "block", width: "100%", marginTop: 18 }}>
              <path d={smallRunArea} fill="rgba(100,112,122,.13)" />
              <path d={smallRun} fill="none" stroke="#64707A" strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 6 }}>One 24 m ramp per lap at the marina, taken four times.</div>
          </div>
        </div>
      </section>

      {/* ---------------- Aid stations ---------------- */}
      <section id="aid" style={{ maxWidth: 1360, margin: "0 auto", padding: "104px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 44 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#E4622F", marginBottom: 18 }}>SUPPLY MAP</div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 52, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}>
              Eleven aid stations.
            </Reveal>
          </div>
          <div style={{ display: "flex", gap: 34, paddingBottom: 6 }}>
            {[
              { v: "9", l: "OFFICIAL" },
              { v: "2", l: "CROWD-VERIFIED" },
              { v: "5.3", u: "km", l: "WIDEST RUN GAP" },
            ].map((s) => (
              <div key={s.l}>
                <div className="mono" style={{ fontSize: 25, letterSpacing: "-.03em" }}>
                  {s.v}
                  {s.u && <span style={{ fontSize: 13, color: "#8C8578" }}>{s.u}</span>}
                </div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginTop: 6 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <Reveal style={{ background: "#FBF8F2", borderRadius: 8, padding: 14, boxShadow: "0 30px 60px -46px rgba(21,20,15,.3)" }}>
          <div style={{ position: "relative", padding: "22px 0 10px" }}>
            <div style={{ position: "absolute", left: 150, top: 34, bottom: 34, width: 2, background: "linear-gradient(to bottom,rgba(21,20,15,.06),rgba(228,98,47,.35),rgba(21,20,15,.06))" }} />
            {aid.map((a) => (
              <div
                key={a.name}
                className="row-hover-cream"
                style={{ position: "relative", display: "grid", gridTemplateColumns: "150px 44px minmax(0,1fr) 150px", alignItems: "center", gap: 0, padding: "14px 24px 14px 0", borderRadius: 8 }}
              >
                <div style={{ textAlign: "right", paddingRight: 26 }}>
                  <div className="mono" style={{ fontSize: 19, letterSpacing: "-.03em" }}>{a.km}</div>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: a.legColor, marginTop: 5 }}>{a.leg}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{ width: 13, height: 13, borderRadius: "50%", background: a.dotBg, border: "2.5px solid #FBF8F2", boxShadow: `0 0 0 2px ${a.dotRing}` }} />
                </div>
                <div style={{ paddingLeft: 22 }}>
                  <div style={{ fontSize: 17.5, fontWeight: 600, letterSpacing: "-.025em" }}>{a.name}</div>
                  <div style={{ fontSize: 14, color: "#6B6455", marginTop: 4 }}>{a.contents}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    className="mono"
                    style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 4, background: a.chipBg, fontSize: 9, letterSpacing: ".12em", color: a.chipFg, whiteSpace: "nowrap" }}
                  >
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: a.chipFg }} />
                    {a.prov}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, margin: "6px 10px 6px", padding: "16px 18px", borderRadius: 8, background: "#F4F1E9" }}>
            <span style={{ fontSize: 14, color: "#6B6455" }}>Two stations appear in athlete files but not the published guide. They carry the mark on screen and in print.</span>
            <a href="#convert" className="mono link-accent" style={{ fontSize: 10, letterSpacing: ".14em", color: "#C6461B", whiteSpace: "nowrap" }}>SOLVE MY FUELLING →</a>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Cut-off clock ---------------- */}
      <section
        id="cutoffs"
        style={{ marginTop: 104, padding: "96px 0 100px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      >
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 46px" }}>
            <Reveal
              className="mono"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 15px", background: "#FBF8F2", borderRadius: 5, boxShadow: "0 2px 10px rgba(21,20,15,.06)", fontSize: 10, letterSpacing: ".16em", color: "#8C7A5E", marginBottom: 26 }}
            >
              <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />CUT-OFF CLOCK · FREE, NO ACCOUNT
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 56, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              Where do your margins sit?
            </Reveal>
            <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 420, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>
              Set your target finish. Every barrier on this course recalculates against it.
            </Reveal>
          </div>

          <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
            <div style={{ background: "#fff", borderRadius: 9, padding: "28px 30px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#A39B8A" }}>TARGET FINISH</div>
                  <div className="mono" style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1, marginTop: 9 }}>{fmtClock(goal)}:00</div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 15px", borderRadius: 5, background: verdictBg }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: verdictColor }} />
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: verdictColor }}>{verdictLabel}</span>
                </div>
              </div>

              <input type="range" min={540} max={1020} step={5} value={goal} onChange={(e) => setGoal(+e.target.value)} style={{ width: "100%", margin: "26px 0 8px", height: 20 }} />
              <div className="mono" style={{ position: "relative", height: 16, fontSize: 9.5, letterSpacing: ".1em", color: "#A39B8A" }}>
                <span style={{ position: "absolute", left: 0 }}>09:00</span>
                <span style={{ position: "absolute", left: "25%", transform: "translateX(-50%)" }}>11:00</span>
                <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>13:00</span>
                <span style={{ position: "absolute", left: "87.5%", transform: "translateX(-50%)", color: "#C0432E" }}>16:00</span>
                <span style={{ position: "absolute", right: 0 }}>17:00</span>
              </div>
              <div style={{ position: "relative", height: 14, marginTop: 2 }}>
                <span style={{ position: "absolute", left: "87.5%", top: -18, width: 1, height: 9, background: "rgba(192,67,46,.5)" }} />
                <span className="mono" style={{ position: "absolute", left: "87.5%", top: 0, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: 9, letterSpacing: ".12em", color: "#C0432E" }}>
                  FINISH CUT-OFF
                </span>
              </div>

              <div style={{ position: "relative", marginTop: 40, height: 128 }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 60, height: 3, borderRadius: 2, background: "#F1EDE4" }} />
                <div style={{ position: "absolute", left: 0, top: 60, height: 3, borderRadius: 2, background: "#E4622F", width: progressW, transition: "width .35s cubic-bezier(.16,1,.3,1)" }} />
                {clock.map((c) => (
                  <div key={c.name} style={{ position: "absolute", top: 0, left: c.left, transform: "translateX(-50%)", width: 150, textAlign: "center" }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A39B8A" }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 17, marginTop: 6 }}>{c.eta}</div>
                    <div style={{ margin: "13px auto 0", width: 13, height: 13, borderRadius: "50%", background: c.color, border: "3px solid #fff", boxShadow: `0 0 0 2px ${c.color}` }} />
                    <div className="mono" style={{ fontSize: 12.5, color: c.color, marginTop: 13 }}>{c.margin}</div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#A39B8A", marginTop: 4 }}>LIMIT {c.limit}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: 10, marginTop: 10 }}>
              <div style={{ borderRadius: 9, padding: "24px 26px", background: verdictBg }}>
                <p style={{ margin: 0, fontSize: 23, lineHeight: 1.26, fontWeight: 500, letterSpacing: "-.03em", color: "#15140F" }}>{verdictHead}</p>
                <p style={{ margin: "14px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>{verdictSub}</p>
              </div>
              <div style={{ background: "#fff", borderRadius: 9, padding: "22px 24px", boxShadow: "0 1px 2px rgba(21,20,15,.05)" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".18em", color: "#A39B8A" }}>SPLITS THIS IMPLIES</div>
                {splits.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid #F1EDE4" }}>
                    <span style={{ fontSize: 14.5, color: "#3D3A31" }}>{s.name}</span>
                    <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                      <span className="mono" style={{ fontSize: 11, color: "#A39B8A" }}>{s.target}</span>
                      <span className="mono" style={{ fontSize: 15, minWidth: 54, textAlign: "right" }}>{s.time}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Convert banner ---------------- */}
      <section id="convert" style={{ maxWidth: 1360, margin: "0 auto", padding: "56px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, padding: "32px 40px", border: "1px solid rgba(21,20,15,.2)", borderRadius: 8, background: "#FBF8F2" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.032em" }}>That is the course. Now put yourself on it.</div>
            <p style={{ margin: "10px 0 0", maxWidth: 620, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
              Pacing targets, an aid-station timeline, five packed bags, a card you can print. Six minutes, $19.
            </p>
          </div>
          <Link
            href={routes.dashboard}
            className="btn-accent"
            style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 52, padding: "0 30px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600, flex: "none" }}
          >
            Build my race plan
          </Link>
        </div>
      </section>

      {/* ---------------- Conditions ---------------- */}
      <section id="conditions" style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 64, borderTop: "1px solid rgba(21,20,15,.14)", paddingTop: 26 }}>
          <div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-.045em" }}>
              What race day is usually like.
            </Reveal>
            <p style={{ margin: "20px 0 0", maxWidth: 440, fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
              Eleven editions of history. Your plan is solved against this until the forecast is close enough to replace it.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(21,20,15,.14)", marginTop: 34, border: "1px solid rgba(21,20,15,.14)" }}>
              {[
                { l: "MEDIAN AIR, 14:00", v: "29°C" },
                { l: "WATER, START", v: "22.4°C" },
                { l: "WIND, VALLEY", v: "18", u: "km/h" },
                { l: "WETSUIT LIKELIHOOD", v: "18%" },
              ].map((s) => (
                <div key={s.l} style={{ background: "#F1EEE8", padding: "20px 22px" }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>{s.l}</div>
                  <div className="mono" style={{ fontSize: 30, marginTop: 10 }}>
                    {s.v}
                    {s.u && <span style={{ fontSize: 14, color: "#8C8578" }}> {s.u}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, padding: "16px 20px", borderLeft: "2px solid #E4622F", background: "rgba(228,98,47,.06)", fontSize: 14.5, lineHeight: 1.55, color: "#5C574B" }}>
              Water has been above the 24.5°C wetsuit limit in nine of eleven editions. Plan for a non-wetsuit swim and treat the wetsuit as the exception.
            </div>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>FINISH TIME DISTRIBUTION · 2015–2025</div>
            <svg viewBox="0 0 480 240" style={{ display: "block", width: "100%", marginTop: 20 }}>
              {hist.map((b, k) => (
                <rect key={k} x={b.x} y={b.y} width={24} height={b.h} fill={b.fill} />
              ))}
              <line x1={0} y1={200} x2={480} y2={200} stroke="rgba(21,20,15,.25)" strokeWidth={1} />
              <line x1={youX} y1={8} x2={youX} y2={200} stroke="#E4622F" strokeWidth={1.6} strokeDasharray="4 3" />
            </svg>
            <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8C8578", marginTop: 8 }}>
              <span>09:00</span><span>11:00</span><span>13:00</span><span>15:00</span><span>17:00</span>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 28 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: "#8C8578" }}>MEDIAN FINISH</div>
                <div className="mono" style={{ fontSize: 22, marginTop: 6 }}>12:48</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: "#8C8578" }}>DNF RATE</div>
                <div className="mono" style={{ fontSize: 22, marginTop: 6 }}>9.4%</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: "#8C8578" }}>MISSED BIKE CUT-OFF</div>
                <div className="mono" style={{ fontSize: 22, marginTop: 6 }}>3.1%</div>
              </div>
            </div>
            <div style={{ marginTop: 22, fontSize: 14, lineHeight: 1.55, color: "#5C574B" }}>Your target sits at the marker. Roughly {percentile} of finishers came in ahead of it.</div>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 104 }}>
        <Footer extra=" · COURSE BUNDLE v2026.2" />
      </div>
    </div>
  );
}
