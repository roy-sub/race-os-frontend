"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import { LANDMARKS, RELATED, SHARES, TAKEAWAYS, TOC, fuellingChart } from "@/lib/guide";

export default function GuidePage() {
  const [section, setSection] = useState("s1");
  const { planPath, actualPath, actualArea, chartTicks } = fuellingChart();

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader ctaLabel="Start free" ctaHref={routes.planBuilder} />

      <section style={{ position: "relative", height: 520, overflow: "hidden", background: "#1C1916" }}>
        <MediaPlaceholder path="assets/guide/valley-drag.jpg" background="linear-gradient(152deg,#453A2D 0%,#241E18 52%,#12100D 100%)" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(12,11,10,.92) 0%,rgba(12,11,10,.3) 58%,rgba(12,11,10,.42) 100%)" }} />
        <div className="mono" style={{ position: "absolute", left: 56, top: 32, fontSize: 9, letterSpacing: ".16em", color: "rgba(255,255,255,.35)" }}>ASSETS/GUIDE/VALLEY-DRAG.JPG · 21:9</div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 1360, margin: "0 auto", padding: "0 56px 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: ".15em", color: "rgba(255,255,255,.5)", marginBottom: 24 }}>
            <Link href={routes.guide} style={{ color: "rgba(255,255,255,.5)" }}>GUIDES</Link><span>/</span><span style={{ color: "rgba(255,255,255,.8)" }}>FUELLING</span><span>/</span><span style={{ color: "rgba(255,255,255,.5)" }}>9 MIN READ</span>
          </div>
          <h1 style={{ margin: 0, maxWidth: 900, fontSize: 64, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.048em", color: "#FBF8F2" }}>Why your fuelling plan fails at km 90, not at km 10</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
            <MediaPlaceholder path="assets/authors/jonas.jpg" background="#4A4038" style={{ width: 38, height: 38, borderRadius: "50%", flex: "none" }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#FBF8F2" }}>Jonas Feldt</div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "rgba(255,255,255,.45)", marginTop: 4 }}>COACH · 11 ATHLETES · UPDATED 12 JUN 2026</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "56px 56px 96px", display: "grid", gridTemplateColumns: "220px minmax(0,1fr) 260px", gap: 52, alignItems: "start" }}>

        <div style={{ position: "sticky", top: 112 }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>CONTENTS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
            {TOC.map((t) => {
              const active = section === t.k;
              return (
                <a key={t.k} href={`#${t.k}`} onClick={() => setSection(t.k)} className="row-hover-faint" style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", borderRadius: 6, background: active ? "#FBF8F2" : "transparent" }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: active ? "#E4622F" : "transparent", flex: "none" }} />
                  <span style={{ fontSize: 13.5, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#15140F" : "#5C574B" }}>{t.name}</span>
                </a>
              );
            })}
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(21,20,15,.12)" }}>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>SHARE</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {SHARES.map((sh) => (
                <span key={sh.k} className="row-hover-border mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, cursor: "pointer", fontSize: 9, color: "#8C8578" }}>{sh.k}</span>
              ))}
            </div>
          </div>
        </div>

        <article style={{ minWidth: 0 }}>
          <Reveal as="p" style={{ margin: 0, fontSize: 23, lineHeight: 1.5, letterSpacing: "-.018em", color: "#3D3A31" }}>Almost every athlete I coach who blows up on the run did not blow up on the run. They blew up somewhere between km 90 and T2, and the run is just where it became visible.</Reveal>

          <Reveal as="p" style={{ margin: "26px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>The pattern is remarkably consistent. Intake is excellent for the first three hours — you are fresh, the gels taste fine, the alarm on your head unit is still novel. Then the road tilts up, or the wind turns, or you simply stop wanting to eat. Intake drops from 78 g/hr to something in the fifties without you deciding it should. Nothing feels wrong at the time. Four hours later you are walking.</Reveal>

          <Reveal as="h2" id="s1" style={{ margin: "52px 0 0", fontSize: 36, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.038em" }}>The number that matters is the second half</Reveal>
          <Reveal as="p" style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>When athletes report their fuelling they almost always report the plan, not the execution — and they average the whole ride. An honest average across six hours hides the shape entirely. What you want is two numbers: the first half and the second half.</Reveal>

          <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 32px 24px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CARB INTAKE ACROSS THE BIKE · 22 ATHLETES, 2025 SEASON</span>
              <div style={{ display: "flex", gap: 16, fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".12em", color: "#A8A192" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 2, background: "#C4BCAC" }} />PLANNED</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 2, background: "#E4622F" }} />ACTUAL MEDIAN</span>
              </div>
            </div>
            <svg viewBox="0 0 720 200" style={{ display: "block", width: "100%", marginTop: 20 }}>
              <rect x="360" y="8" width="360" height="158" fill="rgba(192,57,43,.05)" />
              <path d={planPath} fill="none" stroke="#C4BCAC" strokeWidth={1.8} strokeDasharray="5 4" />
              <path d={actualArea} fill="rgba(228,98,47,.11)" />
              <path d={actualPath} fill="none" stroke="#E4622F" strokeWidth={2.1} strokeLinejoin="round" />
              <line x1="360" y1="8" x2="360" y2="166" stroke="rgba(192,57,43,.42)" strokeWidth={1.2} />
              <text x="370" y="26" fill="#C0392B" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="1.2">HALFWAY · KM 90</text>
              <line x1="0" y1="166" x2="720" y2="166" stroke="rgba(21,20,15,.14)" strokeWidth={1} />
              {chartTicks.map((t) => (
                <text key={t.k} x={t.x} y="186" textAnchor="middle" fill="#A8A192" fontFamily="JetBrains Mono, monospace" fontSize="9.5">{t.k}</text>
              ))}
            </svg>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
              <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>FIRST HALF MEDIAN</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, marginTop: 7 }}>76 g/hr</div></div>
              <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>SECOND HALF MEDIAN</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, marginTop: 7, color: "#C0392B" }}>51 g/hr</div></div>
              <div><div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>REPORTED AS</div><div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, marginTop: 7, color: "#8C8578" }}>&quot;about 70&quot;</div></div>
            </div>
          </Reveal>

          <Reveal as="h2" id="s2" style={{ margin: "52px 0 0", fontSize: 36, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.038em" }}>Why the clock is the wrong trigger</Reveal>
          <Reveal as="p" style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>Most plans schedule intake by time: a gel every twenty minutes, a bottle an hour. The problem is that the moments you are least able to eat are also the moments the clock does not know about. You cannot take a gel while descending at 60 km/h on a technical road. You do not want one three minutes into an 8 km climb at threshold.</Reveal>
          <Reveal as="p" style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>So the gel gets skipped, and skipped gels are almost never made up. The clock keeps ticking, your next reminder arrives twenty minutes later, and the deficit compounds quietly for the rest of the day.</Reveal>

          <Reveal style={{ margin: "30px 0 0", padding: "26px 30px", borderLeft: "2px solid #E4622F", background: "rgba(228,98,47,.05)" }}>
            <p style={{ margin: 0, fontSize: 20, lineHeight: 1.48, letterSpacing: "-.018em", color: "#3D3A31" }}>Schedule intake by landmark, not by clock. Before the climb, not on it. At the top of the descent, not the bottom. Fifteen minutes before the aid station, so a missed bottle is not also a missed gel.</p>
          </Reveal>

          <Reveal as="h2" id="s3" style={{ margin: "52px 0 0", fontSize: 36, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.038em" }}>The three landmarks that matter</Reveal>
          <Reveal style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
            {LANDMARKS.map((l) => (
              <div key={l.n} style={{ display: "grid", gridTemplateColumns: "60px minmax(0,1fr)", gap: 22, padding: "22px 26px", background: "#FBF8F2", borderRadius: 11, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)", alignItems: "start" }}>
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#E4622F", paddingTop: 4 }}>{l.n}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em" }}>{l.name}</div>
                  <p style={{ margin: "9px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C574B" }}>{l.desc}</p>
                </div>
              </div>
            ))}
          </Reveal>

          <Reveal as="h2" id="s4" style={{ margin: "52px 0 0", fontSize: 36, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.038em" }}>Practise the second half, not the first</Reveal>
          <Reveal as="p" style={{ margin: "18px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>Almost all fuelling practice happens in the first two hours of a long ride, because that is when athletes are paying attention. That is precisely the part that never fails. If you want to know whether you can hold 78 g/hr in hour five, you have to ride into hour five and find out.</Reveal>
          <Reveal as="p" style={{ margin: "20px 0 0", fontSize: 17, lineHeight: 1.68, color: "#3D3A31" }}>Two rides is usually enough to learn the truth about your own ceiling. It will almost certainly be lower than the number you have been planning against — mine was 22 g/hr lower — and knowing the real figure is worth more than any amount of optimism.</Reveal>

          <Reveal style={{ background: "#15140F", borderRadius: 12, padding: "30px 34px", marginTop: 36, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>THE SHORT VERSION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 18 }}>
              {TAKEAWAYS.map((t) => (
                <div key={t.n} style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#E4622F", flex: "none", marginTop: 3 }}>{t.n}</span>
                  <span style={{ fontSize: 16, lineHeight: 1.5, color: "rgba(251,248,242,.82)" }}>{t.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </article>

        <div style={{ position: "sticky", top: 112, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>DO THIS IN RACEOS</div>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em", marginTop: 12 }}>Your fuelling is already scheduled by landmark.</div>
            <p style={{ margin: "9px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#5C574B" }}>The solver puts intake before the climb and at the top of the descent, and holds your rate against a measured gut ceiling rather than an aspiration.</p>
            <Link href={routes.planBuilder} className="btn-accent" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 42, marginTop: 16, background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600 }}>Build a plan</Link>
          </div>
          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>MORE GUIDES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
              {RELATED.map((r) => (
                <Link key={r.name} href={routes.guide} className="link-accent" style={{ display: "block", padding: "12px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                  <span className="mono" style={{ display: "block", fontSize: 8, letterSpacing: ".13em", color: "#A8A192" }}>{r.cat}</span>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 500, letterSpacing: "-.018em", lineHeight: 1.35, marginTop: 6 }}>{r.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer extra=" · GUIDES WRITTEN BY COACHES, NOT BY A MODEL" />
    </div>
  );
}
