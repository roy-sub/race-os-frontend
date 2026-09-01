"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal, RevealLines, ZoomReveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { BAGS, FAQS, fmtClock } from "@/lib/landing";
import { useCourses, useRecon } from "@/lib/api/courses";
import { elevationPath, formatKm, formatMetres, projectLegs, sortLegs } from "@/lib/courseGeo";
import { OsmAttribution } from "@/components/OsmAttribution";

const COURSES = [
  "TRAMUNTANA FULL",
  "NORTH SHORE FULL",
  "KALMAR 70.3",
  "CALA OLYMPIC",
  "ROTH LONG COURSE",
  "SKAGEN 70.3",
  "PATAGONIA FULL",
];

function Ticker() {
  const row = (
    <span style={{ display: "flex", gap: 44, paddingRight: 44 }}>
      {COURSES.map((c) => (
        <span key={c} style={{ display: "flex", gap: 44 }}>
          <span>{c}</span>
          <span>·</span>
        </span>
      ))}
    </span>
  );
  return (
    <div style={{ background: "#15140F", overflow: "hidden", padding: "15px 0" }}>
      <div
        className="mono"
        style={{
          display: "flex",
          width: "max-content",
          animation: "ticker 42s linear infinite",
          fontSize: 10.5,
          letterSpacing: ".19em",
          color: "rgba(255,255,255,.34)",
        }}
      >
        {row}
        {row}
      </div>
    </div>
  );
}

const STAR =
  "M10 1l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.3l6.1-.7z";

export default function LandingPage() {
  /**
   * The course canvas draws a real course, not a sine wave.
   *
   * It takes whichever course the directory lists first and reads its recon
   * payload — the same public, unauthenticated endpoints the course pages use.
   * If the API is unreachable the canvas renders empty rather than falling back
   * to a fabricated loop: a blank panel that shows a real outage beats a
   * plausible one that hides it.
   */
  const courses = useCourses();
  const featuredSlug = courses.data?.data[0]?.slug ?? null;
  const recon = useRecon(featuredSlug);
  const featured = recon.data ?? null;

  const canvasLegs = useMemo(() => (featured ? sortLegs(featured.legs) : []), [featured]);
  const canvasProjection = useMemo(
    () => (canvasLegs.length ? projectLegs(canvasLegs, { width: 1200, height: 286 }, 20) : null),
    [canvasLegs],
  );
  const canvasBikeLeg = canvasLegs.find((l) => l.leg === "BIKE") ?? canvasLegs[0] ?? null;
  const canvasProfile = featured?.elevation_profile?.legs?.[canvasBikeLeg?.leg ?? "BIKE"] ?? null;
  const canvasSeries = canvasProfile?.display ?? null;
  const canvasPoints = canvasSeries?.s_km.length ?? 0;
  const canvasChart = useMemo(
    () => (canvasProfile ? elevationPath(canvasProfile, { width: 1200, top: 306, bottom: 400 }) : null),
    [canvasProfile],
  );

  const [goal, setGoal] = useState(705);
  const [hoverOn, setHoverOn] = useState(false);
  const [hi, setHi] = useState(0);
  const [bagIdx, setBagIdx] = useState(0);
  const [openFaqs, setOpenFaqs] = useState<boolean[]>([false, false, false, false]);

  // --- solver math (ported from the prototype's renderVals()) ---
  const swim = goal * 0.093;
  const t1 = 8;
  const t2 = 5;
  const rest = goal - swim - t1 - t2;
  const bike = rest * 0.582;
  const run = rest * 0.418;

  const rows = [
    { name: "SWIM EXIT · 2:20", limit: 140, eta: swim },
    { name: "BIKE KM 120 · 8:30", limit: 510, eta: swim + t1 + bike * (120 / 180.2) },
    { name: "BIKE CUT-OFF · 10:30", limit: 630, eta: swim + t1 + bike },
    { name: "FINISH LINE · 16:00", limit: 960, eta: goal },
  ];
  const worst = Math.min(...rows.map((r) => r.limit - r.eta));
  const failing = rows.find((r) => r.limit - r.eta < 0);
  const tight = rows.reduce((a, b) => (a.limit - a.eta < b.limit - b.eta ? a : b));
  const status: "clear" | "tight" | "fail" = failing ? "fail" : worst < 20 ? "tight" : "clear";
  const statusColor = { clear: "#2E7D53", tight: "#A9761A", fail: "#C0432E" }[status];
  const pillBg = status === "clear" ? "#EAF5EE" : status === "tight" ? "#FBF2E0" : "#FBEAE6";

  const X = (i: number) => (canvasPoints > 1 ? (i / (canvasPoints - 1)) * 1200 : 0);
  const hoverKm = canvasSeries && hi < canvasPoints ? canvasSeries.s_km[hi] : null;
  const hoverH = canvasSeries && hi < canvasPoints ? canvasSeries.h_m[hi] : null;

  /** The point on the route matching the hovered point on the profile. */
  const routeMarker = (() => {
    if (!canvasProjection || !canvasBikeLeg || canvasPoints < 2) return null;
    const f = hi / (canvasPoints - 1);
    const c = canvasBikeLeg.coordinates[Math.round(f * (canvasBikeLeg.coordinates.length - 1))];
    return c ? canvasProjection.project(c[0], c[1]) : null;
  })();

  const carb = Math.max(55, Math.min(90, Math.round(55 + (960 - goal) * 0.09)));
  const carbPct = Math.round((carb / 90) * 100) + "%";
  const gels = Math.ceil(((bike / 60) * carb - 120) / 25);
  const dusk = 21 * 60 + 12;
  const finishClock = 6 * 60 + 40 + goal;
  const bagDelta =
    finishClock > dusk
      ? "Run Special Needs — head torch, projected finish " + fmtClock(finishClock % 1440) + ", after dusk."
      : "Bike (T1) — standard load, aid at km 34 and km 92 covers the gap.";

  const verdictHead = failing
    ? "This misses the " + failing.name.split(" ·")[0].toLowerCase() + " by " + fmtClock(failing.eta - failing.limit) + "."
    : "You clear the " + tight.name.split(" ·")[0].toLowerCase() + " with " + fmtClock(worst) + " to spare.";

  const splits = [
    { name: "Swim", target: Math.round((swim * 60) / 38) + "s/100m", time: fmtClock(swim) },
    { name: "T1", target: "transition", time: fmtClock(t1) },
    { name: "Bike", target: Math.round((180.2 / (bike / 60)) * 10) / 10 + " km/h", time: fmtClock(bike) },
    { name: "T2", target: "transition", time: fmtClock(t2) },
    { name: "Run", target: fmtClock(run / 42.2) + "/km", time: fmtClock(run) },
  ];

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (canvasPoints < 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHoverOn(true);
    setHi(Math.round(f * (canvasPoints - 1)));
  };

  const bag = BAGS[bagIdx];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, overflow: "hidden" }}>
      <Header variant="transparent" />

      {/* ---------------- Hero ---------------- */}
      <section id="top" style={{ position: "relative", height: "92vh", minHeight: 700, background: "#1C1916", overflow: "hidden" }}>
        <ZoomReveal style={{ position: "absolute", inset: 0 }}>
          <MediaPlaceholder
            path="assets/hero/hero-loop.mp4"
            background="linear-gradient(158deg,#3A332B 0%,#241F1A 46%,#14120F 100%)"
            style={{ position: "absolute", inset: 0 }}
          />
        </ZoomReveal>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top,rgba(12,11,10,.88) 0%,rgba(12,11,10,.34) 44%,rgba(12,11,10,.5) 100%)",
          }}
        />

        <div
          className="mono"
          style={{
            position: "absolute",
            left: 48,
            top: 96,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 10,
            letterSpacing: ".18em",
            color: "rgba(255,255,255,.5)",
          }}
        >
          <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%", animation: "breathe 2.6s ease-in-out infinite" }} />
          <span>ASSETS/HERO/HERO-LOOP.MP4 · 16:9 LOOP, MUTED, 8S</span>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 1400, margin: "0 auto", padding: "0 48px 56px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 64 }}>
            <div>
              <Reveal className="mono" style={{ fontSize: 10.5, letterSpacing: ".2em", color: "rgba(255,255,255,.62)", marginBottom: 26 }}>
                LONG COURSE · RACE-WEEK EXECUTION
              </Reveal>
              <RevealLines
                as="h1"
                lines={["Race week,", "solved."]}
                style={{
                  whiteSpace: "nowrap",
                  margin: 0,
                  fontSize: 112,
                  lineHeight: 0.86,
                  fontWeight: 600,
                  letterSpacing: "-.05em",
                  color: "#FBF8F2",
                }}
              />
              <Reveal
                as="p"
                delay={0.2}
                style={{ margin: "28px 0 0", maxWidth: 440, fontSize: 18, lineHeight: 1.5, color: "rgba(255,255,255,.74)" }}
              >
                Pacing, fuelling, five bags and every cut-off — solved against your real course.
              </Reveal>
              <Reveal delay={0.28} style={{ display: "flex", gap: 12, marginTop: 36 }}>
                <Link
                  href={routes.courseRecon}
                  className="btn-accent-invert"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    height: 52,
                    padding: "0 28px",
                    background: "#E4622F",
                    color: "#fff",
                    borderRadius: 6,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  Explore your race
                </Link>
                <a
                  href="#solver"
                  className="btn-outline-dark"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    height: 52,
                    padding: "0 26px",
                    border: "1px solid rgba(255,255,255,.28)",
                    borderRadius: 6,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#FBF8F2",
                  }}
                >
                  See the live solver
                </a>
              </Reveal>
            </div>
            <div style={{ display: "flex", gap: 52, paddingBottom: 8 }}>
              {[
                { value: courses.data?.meta.total, dec: 0, suffix: "", label: "COURSES", delay: 0.34 },
                { value: 5, dec: 0, suffix: "", label: "BAGS PACKED", delay: 0.46 },
              ].map((stat) => (
                <Reveal key={stat.label} delay={stat.delay}>
                  <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.035em", color: "#FBF8F2" }}>
                    {stat.value === undefined
                      ? <span style={{ opacity: .35 }}>—</span>
                      : <CountUp value={stat.value} decimals={stat.dec} suffix={stat.suffix} />}
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginTop: 8 }}>
                    {stat.label}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Ticker />

      {/* ---------------- Course canvas ---------------- */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 60, marginBottom: 44 }}>
          <RevealLines
            lines={["Your course,", "before you ride it."]}
            style={{ whiteSpace: "nowrap", margin: 0, fontSize: 60, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}
          />
          <Reveal as="p" style={{ margin: "0 0 10px", maxWidth: 330, fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
            Real elevation, real aid stations, real cut-off positions. Hover the profile and the course marker follows.
          </Reveal>
        </div>

        <Reveal style={{ background: "#15140F", borderRadius: 9, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
            <div className="mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 10, letterSpacing: ".16em", color: "rgba(255,255,255,.42)" }}>
              <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />{featured ? `${featured.course.name.toUpperCase()} · ${featured.course.place.toUpperCase()}` : "LOADING COURSE"}
            </div>
            <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(255,255,255,.06)", borderRadius: 5 }}>
              <span className="mono" style={{ padding: "5px 12px", borderRadius: 3, background: "#E4622F", color: "#fff", fontSize: 9.5, letterSpacing: ".12em" }}>2D</span>
              <span className="mono" style={{ padding: "5px 12px", borderRadius: 3, color: "rgba(255,255,255,.4)", fontSize: 9.5, letterSpacing: ".12em" }}>3D</span>
            </div>
          </div>
          <div
            onMouseMove={onHover}
            onMouseLeave={() => setHoverOn(false)}
            style={{ position: "relative", borderRadius: 8, background: "#0B0A09", overflow: "hidden", cursor: "crosshair" }}
          >
            <svg viewBox="0 0 1200 400" style={{ display: "block", width: "100%", height: "auto" }}>
              <defs>
                <linearGradient id="lp-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E4622F" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#E4622F" stopOpacity={0.015} />
                </linearGradient>
              </defs>
              {canvasProjection?.paths.map((pathRow) => (
                <path
                  key={pathRow.leg}
                  d={pathRow.d}
                  fill="none"
                  stroke={pathRow.leg === "BIKE" ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.14)"}
                  strokeWidth={pathRow.leg === "BIKE" ? 1.7 : 1.4}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={pathRow.leg === "RUN" ? "5 5" : undefined}
                />
              ))}
              {canvasProjection && featured?.aid_stations.map((station, k) => {
                const legRow = canvasLegs.find((l) => l.leg === station.leg);
                if (!legRow?.coordinates.length) return null;
                const f = Math.max(0, Math.min(1, (station.km * 1000) / legRow.distance_m));
                const c = legRow.coordinates[Math.round(f * (legRow.coordinates.length - 1))];
                const [x, y] = canvasProjection.project(c[0], c[1]);
                return <circle key={k} cx={x} cy={y} r={3.4} fill="#0B0A09" stroke="rgba(255,255,255,.5)" strokeWidth={1.3} />;
              })}
              {hoverOn && routeMarker && <circle cx={routeMarker[0].toFixed(1)} cy={routeMarker[1].toFixed(1)} r={6.5} fill="#E4622F" stroke="#0B0A09" strokeWidth={2.4} />}
              {canvasChart && <path d={canvasChart.area} fill="url(#lp-fill)" />}
              {canvasChart && <path d={canvasChart.line} fill="none" stroke="#E4622F" strokeWidth={1.7} strokeLinejoin="round" />}
              {hoverOn && canvasChart && <line x1={X(hi).toFixed(1)} y1={298} x2={X(hi).toFixed(1)} y2={400} stroke="rgba(255,255,255,.4)" strokeWidth={1} />}
            </svg>
            <div className="mono" style={{ position: "absolute", left: 18, bottom: 14, fontSize: 9.5, letterSpacing: ".14em", color: "rgba(255,255,255,.34)" }}>
              {canvasBikeLeg && canvasProfile
                ? `${canvasBikeLeg.leg} · ${formatKm(canvasBikeLeg.distance_m)} KM · ${formatMetres(canvasProfile.gain_m)} M GAIN`
                : ""}
            </div>
            <div className="mono" style={{ position: "absolute", right: 18, top: 16, display: "flex", gap: 18, fontSize: 11, color: "#FBF8F2" }}>
              {hoverOn && hoverKm != null && <span>{hoverKm.toFixed(1)} km</span>}
              {hoverOn && hoverH != null && <span>{Math.round(hoverH)} m</span>}
            </div>
          </div>
          <OsmAttribution attribution={featured?.bundle.attribution} tone="dark" style={{ marginTop: 12, padding: "0 4px" }} />
        </Reveal>
      </section>

      {/* ---------------- Problem cards ---------------- */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 0" }}>
        <Reveal as="h2" style={{ margin: "0 0 56px", fontSize: 60, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}>
          Nobody fails on fitness.
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 56 }}>
          {[
            { n: "01", t: "The inherited spreadsheet", d: "Someone else's body, last season's course.", delay: 0 },
            { n: "02", t: "The self-contradicting plan", d: "90 g of carbs an hour. A gut that takes 65.", delay: 0.09 },
            { n: "03", t: "The 4am packing panic", d: "Five bags, one hotel floor, no answers.", delay: 0.18 },
          ].map((c) => (
            <Reveal key={c.n} delay={c.delay}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".18em", color: "#E4622F" }}>{c.n}</div>
              <div style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-.03em", marginTop: 20 }}>{c.t}</div>
              <div style={{ fontSize: 16, lineHeight: 1.55, color: "#5C574B", marginTop: 10 }}>{c.d}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Live solver ---------------- */}
      <section
        id="solver"
        style={{
          marginTop: 120,
          padding: "104px 0 108px",
          background: "#EAE3D6",
          backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 52px" }}>
            <Reveal
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 15px",
                background: "#FBF8F2",
                borderRadius: 5,
                boxShadow: "0 2px 10px rgba(21,20,15,.06)",
                fontSize: 10,
                letterSpacing: ".16em",
                color: "#8C7A5E",
                marginBottom: 28,
              }}
            >
              <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />LIVE SOLVER
            </Reveal>
            <RevealLines
              lines={["Certainty first.", "Speed second."]}
              style={{ margin: 0, fontSize: 62, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}
            />
            <Reveal as="p" delay={0.15} style={{ margin: "22px auto 0", maxWidth: 460, fontSize: 17, lineHeight: 1.5, color: "#6B6455" }}>
              Move your goal time. Every dependent number moves with it.
            </Reveal>
          </div>

          <Reveal
            style={{
              background: "rgba(255,255,255,.34)",
              borderRadius: 16,
              padding: 26,
              backdropFilter: "blur(24px) saturate(140%)",
              boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr)", gap: 10 }}>
              {/* Goal + cut-off table */}
              <div style={{ background: "#fff", borderRadius: 8, padding: "34px 34px 30px", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#A39B8A" }}>GOAL FINISH</div>
                    <div className="mono" style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-.04em", marginTop: 9, lineHeight: 1 }}>
                      {fmtClock(goal)}:00
                    </div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 13px", borderRadius: 5, background: pillBg }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                    <span className="mono" style={{ fontSize: 10, letterSpacing: ".13em", color: statusColor }}>
                      {{ clear: "CLEARS", tight: "TIGHT", fail: "INFEASIBLE" }[status]}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={540}
                  max={1020}
                  step={5}
                  value={goal}
                  onChange={(e) => setGoal(+e.target.value)}
                  style={{ width: "100%", margin: "26px 0 8px", height: 20 }}
                />
                <div className="mono" style={{ position: "relative", height: 15, fontSize: 9.5, letterSpacing: ".12em", color: "#A39B8A" }}>
                  <span style={{ position: "absolute", left: 0 }}>09:00</span>
                  <span style={{ position: "absolute", left: "37.5%", transform: "translateX(-50%)" }}>13:00</span>
                  <span style={{ position: "absolute", left: "87.5%", transform: "translateX(-50%)", color: "#C0432E" }}>16:00</span>
                  <span style={{ position: "absolute", right: 0 }}>17:00</span>
                </div>
                <div style={{ position: "relative", height: 13 }}>
                  <span style={{ position: "absolute", left: "87.5%", top: -16, width: 1, height: 8, background: "rgba(192,67,46,.5)" }} />
                  <span
                    className="mono"
                    style={{
                      position: "absolute",
                      left: "87.5%",
                      top: 0,
                      transform: "translateX(-50%)",
                      whiteSpace: "nowrap",
                      fontSize: 9,
                      letterSpacing: ".14em",
                      color: "#C0432E",
                    }}
                  >
                    FINISH CUT-OFF
                  </span>
                </div>

                <div style={{ marginTop: 26, padding: "22px 24px", borderRadius: 8, background: pillBg }}>
                  <p style={{ margin: 0, fontSize: 23, lineHeight: 1.26, fontWeight: 500, letterSpacing: "-.03em", color: "#15140F" }}>
                    {verdictHead}
                  </p>
                </div>

                <div style={{ marginTop: 26 }}>
                  <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: 14, fontSize: 9.5, letterSpacing: ".15em", color: "#A39B8A", paddingBottom: 10 }}>
                    <span>BARRIER</span>
                    <span style={{ textAlign: "right" }}>PROJECTED</span>
                    <span style={{ textAlign: "right" }}>MARGIN</span>
                  </div>
                  {rows.map((r) => {
                    const m = r.limit - r.eta;
                    const color = m < 0 ? "#C0432E" : m < 20 ? "#A9761A" : "#2E7D53";
                    return (
                      <div
                        key={r.name}
                        className="row-hover mono"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr 1fr",
                          gap: 14,
                          padding: "12px 12px",
                          margin: "0 -12px",
                          borderRadius: 8,
                          fontSize: 13.5,
                          alignItems: "center",
                        }}
                      >
                        <span style={{ color: "#6B6455", fontSize: 12, letterSpacing: ".05em" }}>{r.name}</span>
                        <span style={{ textAlign: "right", color: "#15140F" }}>{fmtClock(r.eta)}</span>
                        <span style={{ textAlign: "right", color }}>{(m >= 0 ? "+" : "") + fmtClock(m)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Splits + fuelling + bags */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: "#fff", borderRadius: 8, padding: "26px 28px", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".18em", color: "#A39B8A" }}>SOLVED SPLITS</div>
                  {splits.map((s) => (
                    <div
                      key={s.name}
                      style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #F1EDE4" }}
                    >
                      <span style={{ fontSize: 14.5, color: "#3D3A31" }}>{s.name}</span>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                        <span className="mono" style={{ fontSize: 11, color: "#A39B8A" }}>{s.target}</span>
                        <span className="mono" style={{ fontSize: 15, color: "#15140F", minWidth: 54, textAlign: "right" }}>{s.time}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 8, padding: "26px 28px", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".18em", color: "#A39B8A", marginBottom: 18 }}>FUELLING, RE-DERIVED</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                    <div style={{ background: "#FFF4EE", borderRadius: 7, padding: "15px 15px 13px" }}>
                      <div className="mono" style={{ fontSize: 27, letterSpacing: "-.035em", color: "#C6461B" }}>{carb}</div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#B08B72", marginTop: 7 }}>G CARB / HR</div>
                    </div>
                    <div style={{ background: "#F7F4ED", borderRadius: 7, padding: "15px 15px 13px" }}>
                      <div className="mono" style={{ fontSize: 27, letterSpacing: "-.035em", color: "#15140F" }}>620</div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A39B8A", marginTop: 7 }}>ML FLUID / HR</div>
                    </div>
                    <div style={{ background: "#F7F4ED", borderRadius: 7, padding: "15px 15px 13px" }}>
                      <div className="mono" style={{ fontSize: 27, letterSpacing: "-.035em", color: "#15140F" }}>{gels}</div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A39B8A", marginTop: 7 }}>GELS, BIKE BAG</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: "#F1EDE4", overflow: "hidden", position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        width: carbPct,
                        background: "#E4622F",
                        borderRadius: 3,
                        transition: "width .35s cubic-bezier(.16,1,.3,1)",
                      }}
                    />
                  </div>
                  <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9, letterSpacing: ".12em", color: "#A39B8A" }}>
                    <span>INTAKE</span>
                    <span>GUT CEILING 90 G/HR</span>
                  </div>
                </div>

                <div style={{ background: "#15140F", borderRadius: 8, padding: "26px 28px", flex: 1 }}>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".18em", color: "rgba(255,255,255,.36)", marginBottom: 16 }}>
                    BAGS, ADJUSTED
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span className="mono" style={{ fontSize: 12, color: "#E4622F", marginTop: 2 }}>+</span>
                    <span style={{ fontSize: 15, lineHeight: 1.5, color: "rgba(255,255,255,.8)" }}>{bagDelta}</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Five bags ---------------- */}
      <section id="bags" style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 60, marginBottom: 48 }}>
          <RevealLines
            lines={["Five bags.", "No guessing."]}
            style={{ whiteSpace: "nowrap", margin: 0, fontSize: 60, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}
          />
          <Reveal as="p" style={{ margin: "0 0 10px", maxWidth: 300, fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
            Every item carries the reason it is there.
          </Reveal>
        </div>

        <Reveal style={{ display: "grid", gridTemplateColumns: "300px minmax(0,1fr)", gap: 0, borderRadius: 9, overflow: "hidden", background: "#EAE6DE" }}>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 2 }}>
            {BAGS.map((b, k) => {
              const selected = k === bagIdx;
              return (
                <div
                  key={b.name}
                  onClick={() => setBagIdx(k)}
                  className={selected ? "" : "row-hover"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "19px 18px",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: selected ? "#15140F" : "transparent",
                    color: selected ? "#FBF8F2" : "#15140F",
                  }}
                >
                  <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".13em", color: selected ? "rgba(255,255,255,.45)" : "#8C8578" }}>
                    {"0" + (k + 1)}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.025em" }}>{b.name}</span>
                  <span className="mono" style={{ marginLeft: "auto", fontSize: 10, color: selected ? "rgba(255,255,255,.45)" : "#8C8578" }}>
                    {b.count}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ background: "#FBF8F2", padding: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px" }}>
            <div style={{ padding: "34px 36px 36px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.035em" }}>{bag.name}</span>
                <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>{bag.when}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "0 40px", marginTop: 26 }}>
                {bag.items.map((it) => (
                  <div key={it.name} style={{ padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.08)" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontSize: 15.5 }}>{it.name}</span>
                      <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{it.qty}</span>
                    </div>
                    {it.note && <div style={{ fontSize: 13, lineHeight: 1.45, color: "#8C8578", marginTop: 5 }}>{it.note}</div>}
                  </div>
                ))}
              </div>
            </div>
            <MediaPlaceholder path={bag.media} background={bag.tone} showLabel />
          </div>
        </Reveal>
      </section>

      {/* ---------------- Reviews ---------------- */}
      <section style={{ marginTop: 120, padding: "96px 0 104px", background: "#F6F4EF" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ textAlign: "center", maxWidth: 660, margin: "0 auto 48px" }}>
            <Reveal
              className="mono"
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "7px 16px",
                background: "#fff",
                borderRadius: 5,
                boxShadow: "0 2px 10px rgba(21,20,15,.06)",
                fontSize: 10,
                letterSpacing: ".16em",
                color: "#8C8578",
                marginBottom: 26,
              }}
            >
              RACE REPORTS
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 58, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              Raced on. Not theorised.
            </Reveal>
            <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 430, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>
              What athletes said after they crossed the line with a solved plan.
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.28fr)", gap: 14, alignItems: "stretch" }}>
            <Reveal style={{ background: "#fff", borderRadius: 8, padding: "34px 34px 30px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
              <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-.05em", lineHeight: 1 }}>94%</div>
              <div style={{ fontSize: 16, color: "#3D3A31", marginTop: 12 }}>of solved plans cleared every cut-off on race day</div>
              <div className="mono" style={{ fontSize: 18, color: "#E4622F", marginTop: 30 }}>&rdquo;</div>
              <p style={{ margin: "10px 0 0", fontSize: 17.5, lineHeight: 1.5, color: "#3D3A31" }}>
                I had a bike split I trusted and nothing that told me whether the run would still clear the last barrier. It told me. To the minute — and it was right to ninety seconds.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 34 }}>
                <MediaPlaceholder path="assets/athletes/marcus.jpg" background="#DED7C9" style={{ width: 42, height: 42, borderRadius: "50%", flex: "none" }} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.01em" }}>Marcus Vidal</div>
                  <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".11em", color: "#8C8578", marginTop: 3 }}>TRAMUNTANA FULL · 09:41:12</div>
                </div>
              </div>
            </Reveal>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Reveal delay={0.07} style={{ background: "#fff", borderRadius: 8, padding: "30px 32px", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-.05em", lineHeight: 1 }}>2×</span>
                  <span style={{ fontSize: 16, color: "#3D3A31" }}>faster race-week preparation</span>
                </div>
                <div className="mono" style={{ fontSize: 18, color: "#E4622F", marginTop: 20 }}>&rdquo;</div>
                <p style={{ margin: "8px 0 0", fontSize: 17, lineHeight: 1.5, color: "#3D3A31" }}>
                  First iron distance. I did not know my FTP and I still got a plan that told me exactly what went in the red bag and why.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
                  <MediaPlaceholder path="assets/athletes/priya.jpg" background="#DED7C9" style={{ width: 38, height: 38, borderRadius: "50%", flex: "none" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.01em" }}>Priya Raman</div>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".11em", color: "#8C8578", marginTop: 3 }}>NORTH SHORE FULL · 13:58:40</div>
                  </div>
                </div>
              </Reveal>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, flex: 1 }}>
                <Reveal delay={0.14} style={{ background: "#fff", borderRadius: 8, padding: "26px 26px 24px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                  <div className="mono" style={{ fontSize: 16, color: "#E4622F" }}>&rdquo;</div>
                  <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, color: "#3D3A31" }}>
                    Eleven athletes. On Monday I know which three are in trouble on Sunday.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", paddingTop: 22 }}>
                    <MediaPlaceholder path="assets/athletes/jonas.jpg" background="#DED7C9" style={{ width: 32, height: 32, borderRadius: "50%", flex: "none" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Jonas Feldt</div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".11em", color: "#8C8578", marginTop: 2 }}>COACH · 11 ATHLETES</div>
                    </div>
                  </div>
                </Reveal>
                <Reveal delay={0.2} style={{ background: "#15140F", borderRadius: 8, padding: "26px 26px 24px", display: "flex", flexDirection: "column" }}>
                  <div className="mono" style={{ fontSize: 16, color: "#E4622F" }}>&rdquo;</div>
                  <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5, color: "rgba(255,255,255,.82)" }}>
                    The forecast moved on Thursday. It re-solved and told me what it cost. Six watts.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto", paddingTop: 22 }}>
                    <MediaPlaceholder path="assets/athletes/lena.jpg" background="#3A352D" style={{ width: 32, height: 32, borderRadius: "50%", flex: "none" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#FBF8F2" }}>Lena Ostergaard</div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".11em", color: "rgba(255,255,255,.4)", marginTop: 2 }}>KALMAR 70.3 · 05:12:08</div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>

          <Reveal style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, marginTop: 26, padding: "0 6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
              <span style={{ fontSize: 15, color: "#3D3A31" }}>
                <CountUp value={1184} /> athletes have raced a solved plan
              </span>
              <span style={{ width: 1, height: 26, background: "rgba(21,20,15,.12)" }} />
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ display: "flex", gap: 3 }}>
                  {[0, 1, 2, 3, 4].map((k) => (
                    <svg key={k} width="14" height="14" viewBox="0 0 20 20" fill="#E4622F">
                      <path d={STAR} />
                    </svg>
                  ))}
                </span>
                <span className="mono" style={{ fontSize: 13 }}>4.9</span>
                <span style={{ fontSize: 13.5, color: "#8C8578" }}>from 412 race reports</span>
              </span>
            </div>
            <a
              href="#"
              className="btn-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                gap: 9,
                height: 44,
                padding: "0 20px",
                background: "#fff",
                borderRadius: 6,
                boxShadow: "0 1px 3px rgba(21,20,15,.08)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Read all reports <span className="mono">↗</span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Pricing teaser ---------------- */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 40 }}>
          <Reveal as="h2" style={{ margin: 0, fontSize: 60, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}>
            Pay per race.
          </Reveal>
          <Reveal as={Link} href={routes.pricing} style={{ fontSize: 15, fontWeight: 600, color: "#C6461B" }}>
            Full pricing →
          </Reveal>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <Reveal style={{ border: "1px solid rgba(21,20,15,.13)", borderRadius: 8, padding: "26px 24px 28px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>FREE</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Course Recon</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>£0</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>Every course. Every cut-off calculator.</p>
          </Reveal>
          <Reveal delay={0.07} style={{ borderRadius: 8, padding: "26px 24px 28px", background: "#15140F", color: "#FBF8F2", position: "relative" }}>
            <div className="mono" style={{ position: "absolute", top: -8, left: 24, background: "#E4622F", color: "#fff", fontSize: 9, letterSpacing: ".16em", padding: "3px 8px", borderRadius: 3 }}>
              RECOMMENDED
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(255,255,255,.42)" }}>PER RACE</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Race Plan</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>$19</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,.58)" }}>One solved plan, yours permanently.</p>
          </Reveal>
          <Reveal delay={0.14} style={{ border: "1px solid rgba(21,20,15,.13)", borderRadius: 8, padding: "26px 24px 28px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>ANNUAL</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Season Pass</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>$59</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>Unlimited plans. Constraints that calibrate.</p>
          </Reveal>
          <Reveal delay={0.21} style={{ border: "1px solid rgba(21,20,15,.13)", borderRadius: 8, padding: "26px 24px 28px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>MONTHLY</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Coach</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>$99</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>Fifteen athletes. One race-week board.</p>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 72, alignItems: "start" }}>
          <div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 56, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}>
              Answered plainly.
            </Reveal>
            <Reveal delay={0.1} style={{ marginTop: 32, padding: "26px 26px 24px", borderRadius: 14, background: "#15140F" }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.02em", color: "#FBF8F2" }}>Still not sure?</div>
              <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,.55)" }}>
                Ask an actual long-course athlete, not a support bot.
              </p>
              <a
                href="mailto:hello@raceos.cc"
                className="btn-accent-invert"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                  gap: 10,
                  height: 44,
                  padding: "0 20px",
                  marginTop: 20,
                  background: "#E4622F",
                  color: "#fff",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Talk to a human <span className="mono">→</span>
              </a>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "rgba(255,255,255,.34)", marginTop: 18 }}>
                TYPICAL REPLY · UNDER 4 HOURS
              </div>
            </Reveal>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((f, k) => {
              const open = openFaqs[k];
              return (
                <Reveal
                  key={f.q}
                  style={{
                    borderRadius: 9,
                    background: open ? "#F6F4EF" : "transparent",
                    border: `1px solid ${open ? "rgba(21,20,15,.01)" : "rgba(21,20,15,.12)"}`,
                    overflow: "hidden",
                    transition: "background .3s ease",
                  }}
                >
                  <div
                    onClick={() =>
                      setOpenFaqs((prev) => {
                        const next = prev.slice();
                        next[k] = !next[k];
                        return next;
                      })
                    }
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "26px 28px", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.025em" }}>{f.q}</span>
                    <span
                      className="mono"
                      style={{
                        width: 30,
                        height: 30,
                        flex: "none",
                        borderRadius: "50%",
                        background: open ? "#E4622F" : "#F1EDE4",
                        color: open ? "#fff" : "#15140F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 15,
                        transition: "background .3s ease",
                      }}
                    >
                      {open ? "–" : "+"}
                    </span>
                  </div>
                  {open && (
                    <p style={{ margin: 0, padding: "0 28px 28px", maxWidth: 640, fontSize: 16, lineHeight: 1.6, color: "#5C574B" }}>{f.a}</p>
                  )}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- CTA banner ---------------- */}
      <section style={{ marginTop: 130, position: "relative", height: 540, overflow: "hidden" }}>
        <ZoomReveal style={{ position: "absolute", inset: 0 }}>
          <MediaPlaceholder
            path="assets/cta/dawn-swim.jpg"
            background="linear-gradient(120deg,#33291F 0%,#181410 62%,#0F0D0B 100%)"
            style={{ position: "absolute", inset: 0 }}
          />
        </ZoomReveal>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(12,11,10,.8),rgba(12,11,10,.35))" }} />
        <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(255,255,255,.4)", marginBottom: 26 }}>
            ASSETS/CTA/DAWN-SWIM.JPG · 21:9
          </div>
          <RevealLines
            lines={["Start with your", "own course."]}
            style={{ whiteSpace: "nowrap", margin: 0, fontSize: 78, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em", color: "#FBF8F2" }}
          />
          <Reveal delay={0.2} style={{ marginTop: 36 }}>
            <Link
              href={routes.courseRecon}
              className="btn-accent-invert"
              style={{
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                height: 54,
                padding: "0 30px",
                background: "#E4622F",
                color: "#fff",
                borderRadius: 6,
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              Explore your race — free
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
