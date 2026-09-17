"use client";

import { useState } from "react";
import { selectable } from "@/lib/a11y";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Reveal, RevealLines } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import { BOUNDARY, PIPELINE, PROVENANCE, STAGES } from "@/lib/howItWorks";

export default function HowItWorksPage() {
  const [stage, setStage] = useState(2);
  const c = STAGES[stage];
  const curOutBg = c.dot === "#E4622F" ? "rgba(228,98,47,.07)" : "rgba(79,124,147,.08)";
  const curOutBorder = c.dot === "#E4622F" ? "rgba(228,98,47,.28)" : "rgba(79,124,147,.28)";

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, overflow: "hidden" }}>
      <AppHeader active="howItWorks" ctaLabel="Start free" ctaHref={routes.planBuilder} />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "66px 56px 0" }}>
        <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".19em", color: "#A8A192" }}>HOW IT WORKS</Reveal>
        <RevealLines
          as="h1"
          style={{ whiteSpace: "nowrap", margin: "22px 0 0", fontSize: 92, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.052em" }}
          lines={["A solver, not", "a chatbot."]}
          lineDelay={0.11}
        />
        <Reveal as="p" delay={0.2} style={{ margin: "26px 0 0", maxWidth: 560, fontSize: 18, lineHeight: 1.5, color: "#5C574B" }}>Every number in your plan comes from a hard constraint you can inspect. A language model only writes the sentence around it.</Reveal>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "64px 56px 0" }}>
        <Reveal style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {PIPELINE.map((p) => (
            <div key={p.n} style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px 30px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#E4622F" }}>{p.n}</span>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192" }}>{p.time}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.033em", marginTop: 18 }}>{p.name}</div>
              <p style={{ margin: "11px 0 0", fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>{p.desc}</p>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>{p.detailLabel}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 9 }}>{p.detail}</div>
              </div>
            </div>
          ))}
        </Reveal>
      </section>

      <section style={{ marginTop: 96, padding: "88px 0 92px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 40px" }}>
            <Reveal style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".18em", color: "#8C8578", marginBottom: 20 }}>
              <span className="om-breathe" style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />INSIDE ONE SOLVE
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 54, lineHeight: 1, fontWeight: 600, letterSpacing: "-.046em" }}>Watch a constraint bind.</Reveal>
            <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 460, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>Click any stage. This is the actual order the solver works in, and what it refuses to do.</Reveal>
          </div>

          <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
            <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "32px 34px 30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "290px minmax(0,1fr)", gap: 36 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {STAGES.map((st, k) => {
                    const active = k === stage;
                    return (
                      <div key={st.n} {...selectable(() => setStage(k), stage === k)} className="row-hover-faint" style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 16px", borderRadius: 8, cursor: "pointer", background: active ? "#EAE3D6" : "transparent" }}>
                        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", flex: "none", background: active ? "#E4622F" : "rgba(21,20,15,.08)", fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: active ? "#fff" : "#8C8578" }}>{st.n}</span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: 14.5, fontWeight: active ? 600 : 500, letterSpacing: "-.018em", color: active ? "#15140F" : "#5C574B", whiteSpace: "nowrap" }}>{st.name}</span>
                        </span>
                        <span style={{ marginLeft: "auto", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: active ? "#8C8578" : "#C4BCAC" }}>{st.ms}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: ".16em", color: c.dot }}>{c.tag}</span>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-.035em", marginTop: 14, lineHeight: 1.16 }}>{c.title}</div>
                  <p style={{ margin: "13px 0 0", maxWidth: 620, fontSize: 15.5, lineHeight: 1.6, color: "#5C574B" }}>{c.body}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(21,20,15,.1)", borderRadius: 9, overflow: "hidden", marginTop: 26 }}>
                    {c.inputs.map((inp) => (
                      <div key={inp.k} style={{ background: "#FBF8F2", padding: "17px 19px" }}>
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{inp.k}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, letterSpacing: "-.028em", marginTop: 9, color: inp.fg || "#15140F" }}>{inp.v}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 20, padding: "16px 18px", borderRadius: 9, background: curOutBg, border: `1px solid ${curOutBorder}` }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: c.dot, flex: "none" }}>OUTPUT</span>
                    <span style={{ fontSize: 15, lineHeight: 1.45, color: "#3D3A31" }}>{c.out}</span>
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>WHAT IT WILL NOT DO</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: "#6B6455", marginTop: 9, maxWidth: 600 }}>{c.never}</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,.8fr) minmax(0,1.4fr)", gap: 72 }}>
          <Reveal as="h2" style={{ margin: 0, fontSize: 54, lineHeight: 1, fontWeight: 600, letterSpacing: "-.046em" }}>Where the model is, and is not.</Reveal>
          <div>
            {BOUNDARY.map((b) => (
              <Reveal key={b.name} delay={parseFloat(b.delay)} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1.5fr", gap: 22, padding: "24px 0", borderTop: "1px solid rgba(21,20,15,.12)", alignItems: "baseline" }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: b.markFg }}>{b.mark}</span>
                <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.025em" }}>{b.name}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>{b.desc}</span>
              </Reveal>
            ))}
            <div style={{ height: 1, background: "rgba(21,20,15,.12)" }} />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", gap: 52, alignItems: "center" }}>
          <Reveal style={{ borderRadius: 12, overflow: "hidden", height: 460 }}>
            <MediaPlaceholder path="assets/how/solver-desk.webp" background="linear-gradient(148deg,#463C31 0%,#282219 100%)" style={{ width: "100%", height: "100%" }} showLabel />
          </Reveal>
          <div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 54, lineHeight: 1, fontWeight: 600, letterSpacing: "-.046em" }}>Provenance on every value.</Reveal>
            <Reveal as="p" delay={0.06} style={{ margin: "18px 0 0", maxWidth: 480, fontSize: 16.5, lineHeight: 1.55, color: "#5C574B" }}>You always know which numbers are measured, which are inferred, and which came from the race organiser. It appears on screen and on the printed card.</Reveal>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 30 }}>
              {PROVENANCE.map((p) => (
                <Reveal key={p.tag} delay={parseFloat(p.delay)} style={{ display: "flex", alignItems: "flex-start", gap: 15, padding: "20px 22px", borderRadius: 11, background: p.bg, border: `1px solid ${p.border}` }}>
                  <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "4px 8px", borderRadius: 4, background: p.tagBg, color: p.tagFg, flex: "none", whiteSpace: "nowrap" }}>{p.tag}</span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#3D3A31" }}>{p.desc}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 104, position: "relative", height: 460, overflow: "hidden" }}>
        <Reveal style={{ position: "absolute", inset: 0 }}>
          <MediaPlaceholder path="assets/how/dawn-start.webp" background="linear-gradient(120deg,#332B21 0%,#191510 62%,#100E0B 100%)" style={{ position: "absolute", inset: 0 }} />
        </Reveal>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(12,11,10,.82),rgba(12,11,10,.34))" }} />
        {/* The photograph does not end at the footer, it becomes it. */}
        <div aria-hidden className="fade-to-ink" />
        <div style={{ position: "relative", maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <RevealLines
            as="h2"
            style={{ whiteSpace: "nowrap", margin: 0, fontSize: 66, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em", color: "#FBF8F2" }}
            lines={["See it solve", "your course."]}
            lineDelay={0.1}
          />
          <Reveal delay={0.2} style={{ display: "flex", gap: 12, marginTop: 34 }}>
            <Link href={routes.courseRecon} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 54, padding: "0 28px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 16, fontWeight: 600 }}>Explore your race — free</Link>
            <Link href={routes.pricing} className="btn-outline-fade" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 54, padding: "0 26px", border: "1px solid rgba(255,255,255,.28)", borderRadius: 6, fontSize: 16, fontWeight: 600, color: "#FBF8F2" }}>See pricing</Link>
          </Reveal>
        </div>
      </section>

      <Footer extra=" · DETERMINISTIC SOLVER · LANGUAGE MODEL FOR PHRASING ONLY" />
    </div>
  );
}
