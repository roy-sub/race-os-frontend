"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Reveal, RevealLines, ZoomReveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { routes } from "@/lib/routes";
import { BAGS, FAQS, fmtClock } from "@/lib/landing";
import { useCourses } from "@/lib/api/courses";
import { usePrices, priceFor, formatPrice } from "@/lib/api/billing";
import { HERO_STATS } from "@/lib/marketing";
import { ShowcaseMap } from "@/components/CourseMap";

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

export default function LandingPage() {
  /*
   * The teaser's prices came from four hardcoded strings, and they did not
   * agree with each other: "£0" beside "$19", "$59" and "$99". A pricing row
   * a visitor cannot read a single currency off is worse than no pricing row,
   * and these had also drifted from what `GET /prices` actually charges.
   *
   * Read from the same endpoint the pricing page uses, so the two can never
   * disagree again, and fall back to the tier's name rather than to a number
   * we would be inventing.
   */
  const prices = usePrices();
  const priceLabel = (tier: "per_race" | "season" | "coach") => {
    const price = priceFor(prices.data, tier);
    return price ? formatPrice(price.amount_cents, price.currency) : "—";
  };
  const freeLabel = (() => {
    const any = priceFor(prices.data, "per_race");
    return any ? formatPrice(0, any.currency) : "Free";
  })();

  /* The course count in the hero, from the real calendar. The map itself is
     the showcase venue and needs no fetch — see the Course canvas section. */
  const courses = useCourses();
  const raceCount = courses.data?.meta.total ?? null;

  const [goal, setGoal] = useState(705);
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
              {/*
                The first figure is the real calendar, from `GET /courses` — the
                same number the directory shows, because a hero and a directory
                disagreeing in front of the same visitor is worse than no hero.
                The other two are fixed copy and labelled as what they are; see
                lib/marketing.ts.
              */}
              <Reveal delay={0.34}>
                <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.035em", color: "#FBF8F2", minWidth: "2ch" }}>
                  {raceCount == null ? "—" : <CountUp value={raceCount} decimals={0} suffix="" />}
                </div>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginTop: 8 }}>
                  RACES LISTED
                </div>
              </Reveal>
              {HERO_STATS.map((stat, i) => (
                <Reveal key={stat.label} delay={0.4 + i * 0.06}>
                  <div className="mono" style={{ fontSize: 32, fontWeight: 500, letterSpacing: "-.035em", color: "#FBF8F2" }}>
                    <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
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
          <Reveal as="p" style={{ margin: "0 0 10px", maxWidth: 340, fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
            Every cut-off, every aid station and every metre of climbing, in the shape you will
            actually ride it. Drag to turn it; the readout follows your cursor across the ground.
          </Reveal>
        </div>

        {/*
          The showcase map.

          One map, and deliberately always the same one: Kalmar 70.3, our own
          demonstration course. It is a tuned graphic rather than a survey — its
          three legs are drawn at different scales so the swim reads at all, and
          the vertical is exaggerated — and it says so on its own face rather
          than in a footnote. Every real race gets this same renderer with
          measured terrain and one honest scale, which is what opens with a
          plan.
        */}
        <Reveal>
          <ShowcaseMap height="min(72vh,760px)" />
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

      {/*
        ---------------- What it actually does ----------------

        This was a "Race reports" section: four named athletes with photographs,
        finish times and quotes, a 94% success rate, a 2x claim, "1,184 athletes
        have raced a solved plan", and "4.9 from 412 race reports" under five
        filled stars.

        None of it was real. There have been no race reports, there is no
        rating, and Marcus Vidal and Lena Ostergaard are not people — two of
        them were credited with finishing courses that no longer exist on the
        site, which is how it was noticed. Invented testimonials are not a
        placeholder to fill in later; they are a false statement to a visitor
        deciding whether to trust us with a race they have trained a year for,
        and in the UK and US they are separately unlawful.

        What replaces it has to do the same job honestly. The strongest true
        thing about this product is not a rating, it is the specificity of what
        it produces — so that is what this section says, and every claim in it
        is a description of the software rather than a report about the world.
        When there are real race reports, they belong here, with real names.
      */}
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
              WHAT YOU GET
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 58, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              Specific enough to race on.
            </Reveal>
            <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 470, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>
              Not training advice. A plan for one race, on one course, at your
              numbers — and every figure in it carries where it came from.
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.28fr)", gap: 14, alignItems: "stretch" }}>
            <Reveal style={{ background: "#fff", borderRadius: 8, padding: "34px 34px 30px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>EVERY BARRIER</div>
              <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-.04em", lineHeight: 1.08, marginTop: 14 }}>
                Your margin at every cut-off, before you enter.
              </div>
              <p style={{ margin: "14px 0 0", fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
                Each barrier on the course, the time you are projected to reach
                it, and how much room that leaves. The cut-off calculator is free
                and needs no account — it is the first thing worth knowing about
                a race, so it is not behind anything.
              </p>
              <Link href={routes.courseRecon} className="link-accent" style={{ marginTop: "auto", paddingTop: 30, fontSize: 15, fontWeight: 600, color: "#C6461B" }}>
                Try it on a real course →
              </Link>
            </Reveal>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Reveal delay={0.07} style={{ background: "#fff", borderRadius: 8, padding: "30px 32px", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>FIVE BAGS</div>
                <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.032em", marginTop: 12 }}>
                  Packed item by item, each with its reason.
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
                  A long-course race has five bags and no second chances at them.
                  Every item says why it is in there, so you can disagree with it
                  before race morning rather than at the aid station.
                </p>
              </Reveal>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, flex: 1 }}>
                <Reveal delay={0.14} style={{ background: "#fff", borderRadius: 8, padding: "26px 26px 24px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px rgba(21,20,15,.06)" }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>PROVENANCE</div>
                  <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.5, color: "#3D3A31" }}>
                    Every number says whether you measured it, tested it, typed
                    it, or we estimated it — and estimates are labelled on the
                    plan, not buried in a footnote.
                  </p>
                </Reveal>
                <Reveal delay={0.2} style={{ background: "#15140F", borderRadius: 8, padding: "26px 26px 24px", display: "flex", flexDirection: "column" }}>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(251,248,242,.45)" }}>WHEN IT CHANGES</div>
                  <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.5, color: "rgba(255,255,255,.82)" }}>
                    A forecast that moves in race week re-solves the plan and
                    tells you what it cost. Nothing is recalculated silently.
                  </p>
                </Reveal>
              </div>
            </div>
          </div>

          <Reveal style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 26, marginTop: 26, padding: "0 6px" }}>
            <span style={{ fontSize: 15, color: "#6B6455" }}>
              Course recon and the cut-off calculator are free. You pay when you
              want the plan.
            </span>
            <Link href={routes.pricing} className="link-accent" style={{ fontSize: 15, fontWeight: 600, color: "#C6461B", whiteSpace: "nowrap" }}>
              See pricing →
            </Link>
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
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>{freeLabel}</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>Every course. Every cut-off calculator.</p>
          </Reveal>
          <Reveal delay={0.07} style={{ borderRadius: 8, padding: "26px 24px 28px", background: "#15140F", color: "#FBF8F2", position: "relative" }}>
            <div className="mono" style={{ position: "absolute", top: -8, left: 24, background: "#E4622F", color: "#fff", fontSize: 9, letterSpacing: ".16em", padding: "3px 8px", borderRadius: 3 }}>
              RECOMMENDED
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "rgba(255,255,255,.42)" }}>PER RACE</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Race Plan</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>{priceLabel("per_race")}</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "rgba(255,255,255,.58)" }}>One solved plan, yours permanently.</p>
          </Reveal>
          <Reveal delay={0.14} style={{ border: "1px solid rgba(21,20,15,.13)", borderRadius: 8, padding: "26px 24px 28px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>ANNUAL</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Season Pass</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>{priceLabel("season")}</div>
            <p style={{ margin: "12px 0 0", fontSize: 14, lineHeight: 1.5, color: "#5C574B" }}>Unlimited plans. Constraints that calibrate.</p>
          </Reveal>
          <Reveal delay={0.21} style={{ border: "1px solid rgba(21,20,15,.13)", borderRadius: 8, padding: "26px 24px 28px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>MONTHLY</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12 }}>Coach</div>
            <div className="mono" style={{ fontSize: 32, letterSpacing: "-.035em", marginTop: 18 }}>{priceLabel("coach")}</div>
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
            path="assets/cta/dawn-swim.png"
            background="linear-gradient(120deg,#33291F 0%,#181410 62%,#0F0D0B 100%)"
            style={{ position: "absolute", inset: 0 }}
          />
        </ZoomReveal>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(12,11,10,.8),rgba(12,11,10,.35))" }} />
        <div style={{ position: "relative", maxWidth: 1400, margin: "0 auto", padding: "0 48px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
