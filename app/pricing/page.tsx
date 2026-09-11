"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import {
  CURRENCY_SYMBOL,
  ENTRY_COST,
  PRICE_19,
  PRICE_59,
  PRICE_99,
  SUIT_COST,
  matrixRows,
  type Currency,
} from "@/lib/pricing";

const TIERS = [
  {
    kicker: "FREE",
    name: "Course Recon",
    priceKey: null,
    unit: "FOREVER",
    desc: "Understand a course before you commit to it.",
    features: [
      { ok: true, text: "Every course, full recon" },
      { ok: true, text: "Cut-off calculator" },
      { ok: true, text: "Race directory and conditions" },
      { ok: false, text: "No solved plan" },
    ],
    cta: "Explore a course",
    href: routes.courseRecon,
    dark: false,
    recommended: false,
  },
  {
    kicker: "PER RACE",
    name: "Race Plan",
    priceKey: "p19" as const,
    unit: "ONE-TIME, PER RACE",
    desc: "One complete plan, kept permanently.",
    features: [
      { ok: true, text: "Solved pacing, fuelling, five bags" },
      { ok: true, text: "Race card, PDF and print" },
      { ok: true, text: "Device and calendar export" },
      { ok: true, text: "Drift re-solves and Race Mode" },
    ],
    cta: "Build my race plan",
    href: routes.dashboard,
    dark: true,
    recommended: true,
  },
  {
    kicker: "ANNUAL",
    name: "Season Pass",
    priceKey: "p59" as const,
    suffix: "/ year",
    unit: "WORTH IT AT THREE RACES",
    desc: "A season of racing, with constraints that get truer each time.",
    features: [
      { ok: true, text: "Unlimited plans" },
      { ok: true, text: "Post-race analysis" },
      { ok: true, text: "Constraint calibration" },
      { ok: true, text: "Season history and export" },
    ],
    cta: "Start a season pass",
    href: routes.dashboard,
    dark: false,
    recommended: false,
  },
  {
    kicker: "MONTHLY",
    name: "Coach",
    priceKey: "p99" as const,
    suffix: "/ month",
    unit: "UP TO 15 ATHLETES",
    desc: "The board that answers your Monday question.",
    features: [
      { ok: true, text: "Build on an athlete's behalf" },
      { ok: true, text: "Race-week board and comparison" },
      { ok: true, text: "White-label export" },
      { ok: true, text: "Everything in Season Pass" },
    ],
    cta: "Talk to us first",
    href: routes.dashboard,
    dark: false,
    recommended: false,
  },
];

export default function PricingPage() {
  const [cur, setCur] = useState<Currency>("USD");
  const sym = CURRENCY_SYMBOL[cur];
  const rows = matrixRows();

  const priceFor = (key: "p19" | "p59" | "p99" | null) => {
    if (!key) return "0";
    return { p19: PRICE_19, p59: PRICE_59, p99: PRICE_99 }[key][cur];
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="pricing" ctaLabel="Start free" ctaHref={routes.courseRecon} />

      {/* ---------------- Hero + currency switch ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "76px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 60 }}>
          <div>
            <Reveal as="h1" style={{ margin: 0, maxWidth: 820, fontSize: 76, lineHeight: 0.94, fontWeight: 700, letterSpacing: "-.05em" }}>
              A plan costs less than the gels you will throw away.
            </Reveal>
            <p style={{ margin: "26px 0 0", maxWidth: 520, fontSize: 18, lineHeight: 1.5, color: "#5C574B" }}>
              Course recon is free forever. You pay when you want the solved plan.
            </p>
          </div>
          <div style={{ display: "flex", flex: "none", gap: 4, padding: 4, border: "1px solid rgba(21,20,15,.18)", borderRadius: 6 }}>
            {(["GBP", "USD", "EUR"] as Currency[]).map((c) => (
              <span
                key={c}
                onClick={() => setCur(c)}
                className="mono"
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  fontSize: 11,
                  letterSpacing: ".1em",
                  cursor: "pointer",
                  background: cur === c ? "#15140F" : "transparent",
                  color: cur === c ? "#F1EEE8" : "#8C8578",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Tiers ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "54px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, alignItems: "stretch" }}>
          {TIERS.map((t) => (
            <div
              key={t.name}
              style={{
                border: t.dark ? "1px solid #15140F" : "1px solid rgba(21,20,15,.16)",
                borderRadius: 8,
                padding: "32px 30px 30px",
                background: t.dark ? "#15140F" : "#FBF8F2",
                color: t.dark ? "#F1EEE8" : "#15140F",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: t.dark ? "0 30px 60px -34px rgba(21,20,15,.6)" : undefined,
              }}
            >
              {t.recommended && (
                <div
                  className="mono"
                  style={{ position: "absolute", top: -10, left: 30, background: "#E4622F", color: "#fff", fontSize: 9.5, letterSpacing: ".15em", padding: "4px 10px", borderRadius: 3 }}
                >
                  RECOMMENDED
                </div>
              )}
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".15em", color: "#8C8578" }}>{t.kicker}</div>
              <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-.035em", marginTop: 14 }}>{t.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 22 }}>
                <span className="mono" style={{ fontSize: 44, letterSpacing: "-.045em" }}>
                  {sym}
                  {priceFor(t.priceKey)}
                </span>
                {t.suffix && <span className="mono" style={{ fontSize: 14, color: "#8C8578" }}>{t.suffix}</span>}
              </div>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".1em", color: "#8C8578", marginTop: 8 }}>{t.unit}</div>
              <p style={{ margin: "18px 0 0", fontSize: 14.5, lineHeight: 1.55, color: t.dark ? "#96907F" : "#5C574B" }}>{t.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 26, flex: 1 }}>
                {t.features.map((f) => (
                  <div key={f.text} style={{ display: "flex", gap: 10, fontSize: 14, color: f.ok ? undefined : "#A6A093" }}>
                    <span className="mono" style={{ color: f.ok ? "#E4622F" : undefined }}>{f.ok ? "✓" : "—"}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
              <Link
                href={t.href}
                className={t.dark ? "btn-accent-invert" : "btn-outline-dark2"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  height: 46,
                  marginTop: 26,
                  borderRadius: 6,
                  fontSize: 14.5,
                  fontWeight: 600,
                  ...(t.dark
                    ? { background: "#E4622F", color: "#fff" }
                    : { border: "1px solid rgba(21,20,15,.24)" }),
                }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26, padding: "18px 24px", borderRadius: 9, background: "rgba(21,20,15,.045)" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578", flex: "none" }}>FOR SCALE</span>
          <span style={{ fontSize: 15, color: "#5C574B" }}>
            A full-distance entry runs {ENTRY_COST[cur]}. A wetsuit runs {SUIT_COST[cur]}. The plan that decides how you use both is {sym}
            {priceFor("p19")}.
          </span>
        </div>
      </section>

      {/* ---------------- Cancellation answers ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, borderTop: "1px solid rgba(21,20,15,.14)", paddingTop: 34 }}>
          {[
            { h: "If your race is cancelled", p: "The plan stays in your account permanently. Defer to next season and re-solving costs nothing." },
            { h: "If you cancel a subscription", p: "You keep every plan already solved, at full function. Only new solves and analysis lapse." },
            { h: "If the plan is wrong", p: "Every number traces to its constraint and every one is overridable. Bad course data means a free re-solve." },
          ].map((q) => (
            <div key={q.h}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-.02em" }}>{q.h}</h3>
              <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C574B" }}>{q.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Comparison matrix ---------------- */}
      <section style={{ marginTop: 110, padding: "92px 0 96px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 46px" }}>
            <Reveal
              className="mono"
              style={{ display: "inline-flex", alignItems: "center", padding: "7px 15px", background: "#FBF8F2", borderRadius: 5, boxShadow: "0 2px 10px rgba(21,20,15,.06)", fontSize: 10, letterSpacing: ".16em", color: "#8C7A5E", marginBottom: 26 }}
            >
              COMPARE
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 54, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              Everything, side by side.
            </Reveal>
          </div>

          <Reveal style={{ background: "#FBF8F2", borderRadius: 14, padding: 12, boxShadow: "0 40px 80px -44px rgba(21,20,15,.34), 0 2px 8px rgba(21,20,15,.05)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) repeat(4,minmax(0,1fr))", alignItems: "end", padding: "22px 26px 20px" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".18em", color: "#A39B8A" }}>WHAT YOU GET</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.025em" }}>Free</div>
                <div className="mono" style={{ fontSize: 13, color: "#A39B8A", marginTop: 5 }}>{sym}0</div>
              </div>
              <div style={{ textAlign: "center", position: "relative", background: "#fff", borderRadius: "9px 9px 0 0", padding: "16px 8px 14px", boxShadow: "0 -1px 0 rgba(21,20,15,.04)" }}>
                <div className="mono" style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "#E4622F", color: "#fff", fontSize: 8.5, letterSpacing: ".16em", padding: "3px 9px", borderRadius: 3, whiteSpace: "nowrap" }}>
                  RECOMMENDED
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.025em" }}>Race Plan</div>
                <div className="mono" style={{ fontSize: 13, color: "#C6461B", marginTop: 5 }}>{sym}{priceFor("p19")}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.025em" }}>Season Pass</div>
                <div className="mono" style={{ fontSize: 13, color: "#A39B8A", marginTop: 5 }}>{sym}{priceFor("p59")}/yr</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.025em" }}>Coach</div>
                <div className="mono" style={{ fontSize: 13, color: "#A39B8A", marginTop: 5 }}>{sym}{priceFor("p99")}/mo</div>
              </div>
            </div>

            {rows.map((r, i) =>
              r.isGroup ? (
                <div key={`g-${i}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) repeat(4,minmax(0,1fr))" }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".18em", color: "#B3AA97", padding: "26px 26px 10px" }}>{r.label}</div>
                  <div />
                  <div style={{ background: "#fff" }} />
                  <div />
                  <div />
                </div>
              ) : (
                <div key={r.label} className="row-hover-cream" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) repeat(4,minmax(0,1fr))", alignItems: "center" }}>
                  <div style={{ fontSize: 15.5, padding: "15px 26px" }}>{r.label}</div>
                  {r.values!.map((v, k) => (
                    <div
                      key={k}
                      className="mono"
                      style={{ textAlign: "center", fontSize: 12.5, color: r.colors![k], padding: "15px 8px", background: k === 1 ? "#fff" : undefined }}
                    >
                      {v}
                    </div>
                  ))}
                </div>
              )
            )}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) repeat(4,minmax(0,1fr))", alignItems: "start", paddingTop: 16 }}>
              <div />
              <div style={{ padding: "12px 8px 20px", display: "flex", justifyContent: "center" }}>
                <Link href={routes.courseRecon} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                  Explore
                </Link>
              </div>
              <div style={{ background: "#fff", borderRadius: "0 0 9px 9px", padding: "12px 8px 20px", display: "flex", justifyContent: "center" }}>
                <Link href={routes.dashboard} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 18px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                  Build a plan
                </Link>
              </div>
              <div style={{ padding: "12px 8px 20px", display: "flex", justifyContent: "center" }}>
                <Link href={routes.dashboard} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                  Subscribe
                </Link>
              </div>
              <div style={{ padding: "12px 8px 20px", display: "flex", justifyContent: "center" }}>
                {/* A "Talk to us" button that went nowhere, on the one tier whose
                    whole proposition is that you can talk to us. */}
                <a href="mailto:hello@raceos.cc?subject=RaceOS%20for%20coaches" className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 38, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
                  Talk to us
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- CTA banner ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "110px 56px 0" }}>
        <div style={{ background: "#15140F", borderRadius: 8, padding: "66px 56px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 60 }}>
          <div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 52, lineHeight: 1, fontWeight: 700, letterSpacing: "-.04em", color: "#F5F2EA" }}>
              Try the free half first.
            </Reveal>
            <p style={{ margin: "20px 0 0", maxWidth: 460, fontSize: 16.5, lineHeight: 1.5, color: "#96907F" }}>
              Drive the cut-off clock first. Most people decide at the bike barrier.
            </p>
          </div>
          <Link
            href={routes.courseRecon}
            className="btn-accent-invert"
            style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 54, padding: "0 32px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 16, fontWeight: 600, flex: "none" }}
          >
            Explore your race
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 104 }}>
        <Footer extra=" · PRICES EXCLUDE LOCAL TAX" />
      </div>
    </div>
  );
}
