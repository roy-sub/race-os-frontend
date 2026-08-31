"use client";

import { useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { Reveal } from "@/components/Reveal";
import { ApiErrorState } from "@/components/ApiErrorState";
import { Skeleton } from "@/components/Skeleton";
import { routes, courseReconHref } from "@/lib/routes";
import { useCourses, type Course, type DistanceType } from "@/lib/api/courses";
import { formatClock, formatMetres, formatBarrierName } from "@/lib/courseGeo";

/**
 * The race directory.
 *
 * There is no DATE column, no countdown, no MONTH filter and no DATE sort, and
 * their absence is the point: a *course* has no date. The same course runs every
 * year, and a date belongs to a race — this athlete, this edition — which is why
 * countdowns live on the dashboard and My Plans instead.
 */

const DIST_FILTERS = ["All", "Full", "70.3", "Olympic", "Sprint"] as const;
const SORTS = ["DIFFICULTY", "DISTANCE"] as const;

const DIFF_COLOR: Record<string, string> = {
  APPROACHABLE: "#3E7B55",
  MODERATE: "#5C574B",
  HARD: "#A0701A",
  BRUTAL: "#C0392B",
};
const DIFF_ORDER: Record<string, number> = { BRUTAL: 3, HARD: 2, MODERATE: 1, APPROACHABLE: 0 };
const DIST_ORDER: Record<string, number> = { Full: 3, "70.3": 2, Olympic: 1, Sprint: 0 };

/**
 * Provenance is whatever the API says it is.
 *
 * Every course in V1 comes back ESTIMATED, and none is dressed up as OFFICIAL.
 * The map is open so a value we have not styled still renders with a label
 * rather than disappearing.
 */
const PROV_STYLE: Record<string, { dot: string; fg: string }> = {
  OFFICIAL: { dot: "#7CC08F", fg: "#3E7B55" },
  CROWD_VERIFIED: { dot: "#C4BCAC", fg: "#8C8578" },
  "CROWD-VERIFIED": { dot: "#C4BCAC", fg: "#8C8578" },
  ESTIMATED: { dot: "#E0A33C", fg: "#A0701A" },
};
const PROV_FALLBACK = { dot: "#C4BCAC", fg: "#8C8578" };

function provStyle(p: string | null | undefined) {
  return (p && PROV_STYLE[p]) || PROV_FALLBACK;
}

function CourseRow({ course, delay }: { course: Course; delay: number }) {
  const prov = provStyle(course.provenance);
  const diffColor = DIFF_COLOR[course.difficulty] ?? "#5C574B";

  return (
    <Reveal
      as={Link}
      href={courseReconHref(course.slug)}
      delay={delay}
      className="next-step-card"
      style={{ display: "block", background: "#FBF8F2", borderRadius: 12, padding: 0, overflow: "hidden", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "172px minmax(0,1.3fr) 1fr 1fr auto", gap: 26, alignItems: "center", padding: "0 28px 0 0" }}>
        <MediaPlaceholder path={course.media_card_path ?? "assets/courses/placeholder.jpg"} background={course.tone_color ?? "#3E352B"} style={{ height: 132, position: "relative", flex: "none" }} />
        <div style={{ minWidth: 0, padding: "22px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: prov.dot, flex: "none" }} />
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: prov.fg, whiteSpace: "nowrap" }}>{course.provenance ?? "UNVERIFIED"}</span>
          </div>
          <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.032em", marginTop: 9, whiteSpace: "nowrap" }}>{course.name}</div>
          <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 6, whiteSpace: "nowrap" }}>{course.place}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>DISTANCE</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, marginTop: 8 }}>{course.distance_type}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: "#8C8578", marginTop: 5 }}>
            {course.elevation_gain_m == null ? "—" : `${formatMetres(course.elevation_gain_m)} m`}
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>TIGHTEST CUT-OFF</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, marginTop: 8 }}>
            {course.cutoff_minutes == null ? "—" : formatClock(course.cutoff_minutes)}
            {course.cutoff_barrier_name && (
              <span style={{ fontSize: 11, color: "#8C8578" }}> {formatBarrierName(course.cutoff_barrier_name).toLowerCase()}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: diffColor, flex: "none" }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: diffColor, whiteSpace: "nowrap" }}>{course.difficulty}</span>
          </div>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#E4622F", flex: "none" }}>→</span>
      </div>
    </Reveal>
  );
}

/** Sized to the row it replaces, so the list does not jump when courses land. */
function CourseRowSkeleton() {
  return (
    <div style={{ background: "#FBF8F2", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "172px minmax(0,1.3fr) 1fr 1fr auto", gap: 26, alignItems: "center", padding: "0 28px 0 0" }}>
        <Skeleton width={172} height={132} radius={0} />
        <div style={{ padding: "22px 0", display: "flex", flexDirection: "column", gap: 9 }}>
          <Skeleton width={92} height={9} />
          <Skeleton width={210} height={24} />
          <Skeleton width={150} height={13} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={60} height={9} /><Skeleton width="5ch" height={16} /><Skeleton width="7ch" height={11} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton width={96} height={9} /><Skeleton width="9ch" height={16} /><Skeleton width="8ch" height={11} />
        </div>
        <span />
      </div>
    </div>
  );
}

export default function RaceDirectoryPage() {
  const [query, setQuery] = useState("");
  const [dist, setDist] = useState<(typeof DIST_FILTERS)[number]>("All");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("DIFFICULTY");

  // Filtering server-side would round-trip on every keystroke for three rows.
  // The whole directory is one small page, so it is fetched once and filtered here.
  const { data, isPending, error, refetch } = useCourses();
  const all = data?.data ?? [];
  const total = data?.meta.total;

  let list = all;
  if (dist !== "All") list = list.filter((c) => c.distance_type === (dist as DistanceType));
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter((c) => `${c.name} ${c.place}`.toLowerCase().includes(q));
  }
  list =
    sort === "DIFFICULTY"
      ? [...list].sort((a, b) => (DIFF_ORDER[b.difficulty] ?? 0) - (DIFF_ORDER[a.difficulty] ?? 0))
      : [...list].sort((a, b) => (DIST_ORDER[b.distance_type] ?? 0) - (DIST_ORDER[a.distance_type] ?? 0));

  const resultCount = isPending ? "…" : `${list.length} ${list.length === 1 ? "COURSE" : "COURSES"}`;

  /** Provenance counts, tallied from the rows themselves rather than asserted. */
  const provCounts = all.reduce<Record<string, number>>((acc, c) => {
    const key = c.provenance ?? "UNVERIFIED";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="races" ctaLabel="Start free" ctaHref={routes.planBuilder} />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 56 }}>
          <div>
            <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
              {total === undefined ? "LOADING THE DIRECTORY" : `${total} ${total === 1 ? "COURSE" : "COURSES"} · FREE TO EXPLORE`}
            </Reveal>
            <Reveal as="h1" delay={0.05} style={{ margin: "16px 0 0", fontSize: 66, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>Every course, every cut-off.</Reveal>
            <Reveal as="p" delay={0.1} style={{ margin: "15px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>Real elevation, real aid stations, real barriers. No account, no card, no trial.</Reveal>
          </div>
          <Reveal delay={0.14} style={{ display: "flex", gap: 34, paddingBottom: 8, flex: "none" }}>
            {Object.entries(provCounts).map(([label, count]) => (
              <div key={label}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 30, letterSpacing: "-.04em" }}>{count}</div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>{label}</div>
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal style={{ display: "flex", alignItems: "center", gap: 12, height: 56, marginTop: 34, padding: "0 18px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 10, background: "#FBF8F2" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by race, city or country" style={{ flex: 1, border: 0, background: "transparent", fontSize: 16.5, color: "#15140F", padding: 0, outline: "none" }} />
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>{resultCount}</span>
        </Reveal>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", marginRight: 4 }}>DISTANCE</span>
            {DIST_FILTERS.map((d) => {
              const on = dist === d;
              return (
                <div key={d} onClick={() => setDist(d)} className="row-hover-border" style={{ display: "flex", alignItems: "center", height: 32, padding: "0 12px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`, fontSize: 12.5, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B" }}>{d}</div>
              );
            })}
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
        {error ? (
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        ) : isPending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map((i) => <CourseRowSkeleton key={i} />)}
          </div>
        ) : list.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {list.map((c, i) => <CourseRow key={c.id} course={c} delay={i * 0.05} />)}
          </div>
        ) : (
          /* No course upload exists, so the empty state points at what does. */
          <div style={{ padding: "80px 40px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12, textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOT IN THE DIRECTORY</div>
            <div style={{ margin: "18px auto 0", maxWidth: 460, fontSize: 28, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-.032em" }}>
              {query.trim() ? <>Nothing matches &quot;{query}&quot;.</> : "No courses match those filters."}
            </div>
            <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
              {total === undefined
                ? "Clear the filters to see the whole directory."
                : `${total} ${total === 1 ? "course is" : "courses are"} available. Clear the filters to see ${total === 1 ? "it" : "them"}.`}
            </p>
            <span
              onClick={() => { setQuery(""); setDist("All"); }}
              className="btn-accent"
              style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Clear filters
            </span>
          </div>
        )}
      </section>

      <div style={{ marginTop: 88 }}>
        <Footer />
      </div>
    </div>
  );
}
