"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Reveal } from "@/components/Reveal";
import { routes } from "@/lib/routes";
import {
  DIFF_COLOR, DIFF_ORDER, DIST_FILTERS, DIST_ORDER, MONTH_FILTERS, PROV_STYLE, RACES, SORTS,
  type Distance,
} from "@/lib/raceDirectory";

export default function RaceDirectoryPage() {
  const [query, setQuery] = useState("");
  const [dist, setDist] = useState<(typeof DIST_FILTERS)[number]>("All");
  const [month, setMonth] = useState<(typeof MONTH_FILTERS)[number]>("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("DATE");

  let list = RACES;
  if (dist !== "All") list = list.filter((r) => r.dist === (dist as Distance));
  if (month !== "All") list = list.filter((r) => r.month === month);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((r) => (r.name + " " + r.place).toLowerCase().includes(q));
  }
  if (sort === "DIFFICULTY") list = [...list].sort((a, b) => DIFF_ORDER[b.diff] - DIFF_ORDER[a.diff]);
  if (sort === "DISTANCE") list = [...list].sort((a, b) => DIST_ORDER[b.dist] - DIST_ORDER[a.dist]);

  const resultCount = `${list.length} ${list.length === 1 ? "COURSE" : "COURSES"}`;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="races" ctaLabel="Start free" ctaHref={routes.planBuilder} />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 56 }}>
          <div>
            <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>412 COURSES · 31 COUNTRIES · FREE TO EXPLORE</Reveal>
            <Reveal as="h1" delay={0.05} style={{ margin: "16px 0 0", fontSize: 66, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>Every course, every cut-off.</Reveal>
            <Reveal as="p" delay={0.1} style={{ margin: "15px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Real elevation, real aid stations, real barriers. No account, no card, no trial.</Reveal>
          </div>
          <Reveal delay={0.14} style={{ display: "flex", gap: 34, paddingBottom: 8, flex: "none" }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, letterSpacing: "-.04em" }}>318</div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>OFFICIAL</div>
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, letterSpacing: "-.04em" }}>76</div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>CROWD-VERIFIED</div>
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, letterSpacing: "-.04em" }}>18</div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>ESTIMATED</div>
            </div>
          </Reveal>
        </div>

        <Reveal style={{ display: "flex", alignItems: "center", gap: 12, height: 56, marginTop: 34, padding: "0 18px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 10, background: "#FBF8F2" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by race, city or country" style={{ flex: 1, border: 0, background: "transparent", fontSize: 16.5, color: "#15140F", padding: 0, outline: "none" }} />
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>{resultCount}</span>
        </Reveal>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", marginRight: 4 }}>DISTANCE</span>
              {DIST_FILTERS.map((d) => {
                const on = dist === d;
                return (
                  <div key={d} onClick={() => setDist(d)} className="row-hover-border" style={{ display: "flex", alignItems: "center", height: 32, padding: "0 12px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`, fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B" }}>{d}</div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", marginRight: 4 }}>MONTH</span>
              {MONTH_FILTERS.map((m) => {
                const on = month === m;
                return (
                  <div key={m} onClick={() => setMonth(m)} className="row-hover-border" style={{ display: "flex", alignItems: "center", height: 32, padding: "0 11px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: ".1em", color: on ? "#FBF8F2" : "#5C574B" }}>{m}</div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>SORT</span>
            <div style={{ display: "flex", gap: 3, padding: 3, background: "rgba(21,20,15,.06)", borderRadius: 7 }}>
              {SORTS.map((so) => {
                const on = sort === so;
                return (
                  <span key={so} onClick={() => setSort(so)} className="mono" style={{ padding: "7px 12px", borderRadius: 5, cursor: "pointer", fontSize: 9.5, letterSpacing: ".1em", background: on ? "#15140F" : "transparent", color: on ? "#FBF8F2" : "#8C8578", whiteSpace: "nowrap" }}>{so}</span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "26px 56px 0" }}>
        {list.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((r, i) => (
              <Reveal
                key={r.name}
                as={Link}
                href={routes.courseRecon}
                delay={i * 0.05}
                className="next-step-card"
                style={{ display: "block", background: "#FBF8F2", borderRadius: 12, padding: 0, overflow: "hidden", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "172px minmax(0,1.3fr) 1fr 1fr 1fr auto", gap: 26, alignItems: "center", padding: "0 28px 0 0" }}>
                  <MediaPlaceholder path={r.media} background={r.tone} style={{ height: 132, position: "relative", flex: "none" }}>
                    <span className="mono" style={{ position: "absolute", left: 12, bottom: 10, fontSize: 7.5, letterSpacing: ".11em", color: "rgba(255,255,255,.5)" }}>{r.media.split("/").pop()?.toUpperCase()}</span>
                  </MediaPlaceholder>
                  <div style={{ minWidth: 0, padding: "22px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: PROV_STYLE[r.prov].dot, flex: "none" }} />
                      <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: PROV_STYLE[r.prov].fg, whiteSpace: "nowrap" }}>{r.prov}</span>
                    </div>
                    <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.032em", marginTop: 9, whiteSpace: "nowrap" }}>{r.name}</div>
                    <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 6, whiteSpace: "nowrap" }}>{r.place}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>DATE</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, marginTop: 8 }}>{r.date}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#8C8578", marginTop: 5 }}>{r.away}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>DISTANCE</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, marginTop: 8 }}>{r.dist}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#8C8578", marginTop: 5 }}>{r.gain}</div>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>TIGHTEST CUT-OFF</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, marginTop: 8 }}>{r.cutoff}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: DIFF_COLOR[r.diff], flex: "none" }} />
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: DIFF_COLOR[r.diff], whiteSpace: "nowrap" }}>{r.diff}</span>
                    </div>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#E4622F", flex: "none" }}>→</span>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <div style={{ padding: "80px 40px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12, textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOT IN THE DIRECTORY</div>
            <div style={{ margin: "18px auto 0", maxWidth: 460, fontSize: 28, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-.032em" }}>Nothing matches &quot;{query}&quot;.</div>
            <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>Upload a GPX and enter the cut-offs instead. The plan still solves, and anything we estimate is marked as estimated.</p>
            <Link href={routes.planBuilder} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>Upload a course</Link>
          </div>
        )}
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 0" }}>
        <Reveal style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, padding: "30px 34px", background: "#15140F", borderRadius: 12, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>RACE NOT LISTED?</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.03em", color: "#FBF8F2", marginTop: 12 }}>Upload a GPX and the plan still solves.</div>
            <p style={{ margin: "9px 0 0", maxWidth: 560, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>Enter the cut-offs you know and we estimate the rest, marked as estimated everywhere it appears — including on the printed card.</p>
          </div>
          <Link href={routes.planBuilder} className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600, flex: "none" }}>Upload a course</Link>
        </Reveal>
      </section>

      <div style={{ marginTop: 88 }}>
        <Footer />
      </div>
    </div>
  );
}
