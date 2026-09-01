"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { ApiErrorState } from "@/components/ApiErrorState";
import { Skeleton } from "@/components/Skeleton";
import { OsmAttribution } from "@/components/OsmAttribution";
import { routes } from "@/lib/routes";
import { useCourses, useRecon, type CutoffCheck, type Recon, type Leg } from "@/lib/api/courses";
import { usePrices, priceFor, formatPrice } from "@/lib/api/billing";
import { client, unwrap } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import {
  LEG_COLOR, elevationPath, formatBarrierName, formatClock, formatContents,
  formatKm, formatMargin, formatMetres, projectLegs, sortLegs, widestGapKm,
} from "@/lib/courseGeo";

const SUBNAV = [
  { href: "#overview", label: "OVERVIEW" },
  { href: "#elevation", label: "ELEVATION" },
  { href: "#aid", label: "AID STATIONS" },
  { href: "#cutoffs", label: "CUT-OFFS" },
];

const MAP_W = 800;
const MAP_H = 460;
/**
 * The route occupies the upper band and the elevation profile the lower one.
 * They share a canvas but not a region — overlapping them makes both unreadable.
 */
const ROUTE_H = 326;
const ELEV_TOP = 348;

/** The free cut-off calculator. Public, no account — it is the front door. */
function useCutoffCheck(courseRef: string | null, projectedMinutes: number) {
  return useQuery({
    queryKey: ["courses", "cutoff-check", courseRef, projectedMinutes],
    enabled: Boolean(courseRef),
    queryFn: async (): Promise<CutoffCheck> => {
      const body = await unwrap(
        client.POST("/api/v1/courses/{course_ref}/cutoff-check", {
          params: { path: { course_ref: courseRef! } },
          body: { projected_minutes: projectedMinutes },
        }),
      );
      return body as unknown as CutoffCheck;
    },
    // Every drag of the slider is a new key; keeping resolved ones warm makes
    // dragging back and forth instant instead of re-fetching.
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });
}

function ReconContent() {
  const params = useSearchParams();
  const courses = useCourses();
  // With no ?course= the page shows the first course in the directory rather
  // than a hardcoded slug, so it stays correct whatever the directory holds.
  const courseRef = params.get("course") ?? courses.data?.data[0]?.slug ?? null;

  const { data: recon, isPending, error, refetch } = useRecon(courseRef);
  const prices = usePrices();

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref={routes.planBuilder} />
        <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 56px" }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
          <Link href={routes.races} className="mono link-accent" style={{ display: "inline-block", marginTop: 24, fontSize: 11, letterSpacing: ".14em", color: "#C6461B" }}>
            ← BACK TO THE DIRECTORY
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (isPending || !recon) return <ReconSkeleton />;
  return <Recon_ recon={recon} priceLabel={priceLabelOf(prices.data)} />;
}

function priceLabelOf(prices: ReturnType<typeof usePrices>["data"]): string | null {
  const p = priceFor(prices, "per_race", "GBP");
  return p ? formatPrice(p.amount_cents, p.currency) : null;
}

function Recon_({ recon, priceLabel }: { recon: Recon; priceLabel: string | null }) {
  const { course, bundle, legs, totals, barriers, aid_stations: aid, segments } = recon;

  const orderedLegs = useMemo(() => sortLegs(legs), [legs]);
  const projection = useMemo(
    () => projectLegs(orderedLegs, { width: MAP_W, height: ROUTE_H }, 18),
    [orderedLegs],
  );

  const elevationLegs = recon.elevation_profile?.legs ?? {};
  // The bike is the leg the map's profile is about — it is where a long-course
  // race is decided, and the only leg with meaningful relief on these courses.
  const chartLeg: Leg = elevationLegs.BIKE ? "BIKE" : orderedLegs[0]?.leg ?? "BIKE";
  const chartProfile = elevationLegs[chartLeg];

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const series = chartProfile?.display;
  const pointCount = series?.s_km.length ?? 0;

  const onHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointCount) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHoverIndex(Math.round(f * (pointCount - 1)));
  };

  const hoverKm = hoverIndex != null && series ? series.s_km[hoverIndex] : null;
  const hoverH = hoverIndex != null && series ? series.h_m[hoverIndex] : null;

  /**
   * The segment the cursor is over, by name.
   *
   * These names come from the ingest pipeline (`name_source: DERIVED_TERRAIN`),
   * so "Flat 1" and "Climb 3" are what the data actually says. The prototype's
   * prose about Coll de Femenia and headwinds in eight of eleven editions was
   * invented, and nothing serves it.
   */
  const hoverSegment = useMemo(() => {
    if (hoverKm == null) return null;
    return segments.find((s) => s.leg === chartLeg && hoverKm >= s.from_km && hoverKm <= s.to_km) ?? null;
  }, [hoverKm, segments, chartLeg]);

  const chart = useMemo(
    () => (chartProfile ? elevationPath(chartProfile, { width: MAP_W, top: ELEV_TOP, bottom: MAP_H }) : null),
    [chartProfile],
  );

  const [goal, setGoal] = useState(() => Math.round(totals.final_cutoff_minutes ?? 720));
  const cutoff = useCutoffCheck(course.slug, goal);
  const cutoffRows = cutoff.data?.barriers ?? [];
  const worstMargin = cutoffRows.length ? Math.min(...cutoffRows.map((r) => r.margin_minutes)) : null;
  const failing = cutoffRows.find((r) => r.margin_minutes < 0);
  const tightest = cutoffRows.length
    ? cutoffRows.reduce((a, b) => (a.margin_minutes < b.margin_minutes ? a : b))
    : null;

  const status: "clear" | "tight" | "fail" = failing ? "fail" : (worstMargin ?? 0) < 20 ? "tight" : "clear";
  const verdictColor = { clear: "#2E7D53", tight: "#A9761A", fail: "#C0432E" }[status];
  const verdictBg = status === "clear" ? "rgba(95,175,119,.07)" : status === "tight" ? "rgba(216,155,44,.08)" : "rgba(216,65,47,.09)";
  const verdictLabel = { clear: "Clears every cut-off", tight: "Tight — one binding barrier", fail: "Infeasible as set" }[status];

  const provLabel = bundle.provenance ?? "UNVERIFIED";
  const provTone = provLabel === "OFFICIAL" ? "#8FCBA0" : "#E0B36A";

  /** Slider bounds from the course's own barriers, not a guessed 09:00–17:00. */
  const finishLimit = Math.max(...barriers.map((b) => b.limit_minutes_from_start), 60);
  const sliderMin = Math.round(finishLimit * 0.45);
  const sliderMax = Math.round(finishLimit * 1.1);

  const provCounts = aid.reduce<Record<string, number>>((acc, s) => {
    const k = s.provenance ?? "UNVERIFIED";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const runGap = widestGapKm(aid, "RUN");
  const bikeGap = widestGapKm(aid, "BIKE");

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref="#convert" />

      {/* ---------------- Hero ---------------- */}
      <section style={{ position: "relative", height: "66vh", minHeight: 520, background: "#1C1916", overflow: "hidden" }}>
        <MediaPlaceholder path="assets/courses/course-hero.jpg" background="linear-gradient(155deg,#453B31 0%,#251F1A 52%,#13110F 100%)" style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(12,11,10,.9) 0%,rgba(12,11,10,.3) 55%,rgba(12,11,10,.45) 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 1360, margin: "0 auto", padding: "0 56px 44px" }}>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, letterSpacing: ".15em", color: "rgba(255,255,255,.45)", marginBottom: 22 }}>
            <Link href={routes.home} style={{ color: "rgba(255,255,255,.45)" }}>RACEOS</Link>
            <span>/</span>
            <Link href={routes.races} style={{ color: "rgba(255,255,255,.45)" }}>COURSES</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,.8)" }}>{course.name.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 56 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                {/* Whatever provenance the API returns. Nothing claims OFFICIAL. */}
                <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid ${provTone}55`, borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: provTone }}>
                  <span style={{ width: 5, height: 5, background: provTone, borderRadius: "50%" }} />{provLabel}
                </span>
                {bundle.verified_at ? (
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>
                    VERIFIED {new Date(bundle.verified_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
                  </span>
                ) : (
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>NOT YET VERIFIED</span>
                )}
                {course.is_fictional && (
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "rgba(255,255,255,.4)" }}>FICTIONAL COURSE</span>
                )}
              </div>
              <h1 style={{ whiteSpace: "nowrap", margin: 0, fontSize: 92, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em", color: "#FBF8F2" }}>{course.name}</h1>
              {/* No date and no start time: those belong to a race, not a course. */}
              <div style={{ display: "flex", gap: 22, marginTop: 20, fontSize: 16, color: "rgba(255,255,255,.66)", whiteSpace: "nowrap" }}>
                <span>{course.place}</span>
                <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                <span>{course.distance_type}</span>
                <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
                <span>{course.difficulty.toLowerCase()}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, flex: "none" }}>
              <a href="#cutoffs" className="btn-outline-fade" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 24px", border: "1px solid rgba(255,255,255,.28)", borderRadius: 6, fontSize: 15, fontWeight: 600, color: "#FBF8F2" }}>Check my cut-offs</a>
              <a href="#convert" className="btn-accent-invert" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 50, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600 }}>Build your plan</a>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Map + elevation, both from real geometry ---------------- */}
      <section style={{ maxWidth: 1360, margin: "34px auto 0", padding: "0 56px" }}>
        <div style={{ background: "#15140F", borderRadius: 9, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 316px" }}>
            <div onMouseMove={onHover} onMouseLeave={() => setHoverIndex(null)} style={{ position: "relative", background: "#0B0A09", cursor: "crosshair" }}>
              <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} style={{ display: "block", width: "100%", height: "auto" }} role="img" aria-label={`Route and bike elevation profile for ${course.name}`}>
                <defs>
                  <linearGradient id="cr-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E4622F" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#E4622F" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                {/* The real route: legs[].coordinates, GeoJSON order, one shared projection. */}
                {projection?.paths.map((p) => (
                  <path
                    key={p.leg}
                    d={p.d}
                    fill="none"
                    stroke={p.leg === "BIKE" ? "rgba(255,255,255,.42)" : "rgba(255,255,255,.24)"}
                    strokeWidth={p.leg === "BIKE" ? 1.9 : 1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={p.leg === "RUN" ? "5 5" : undefined}
                  />
                ))}

                {/* An aid station is drawn where it actually is, by interpolating its
                    km along the leg it belongs to. */}
                {projection && aid.map((s, i) => {
                  const legRow = orderedLegs.find((l) => l.leg === s.leg);
                  if (!legRow?.coordinates.length) return null;
                  const f = Math.max(0, Math.min(1, (s.km * 1000) / legRow.distance_m));
                  const c = legRow.coordinates[Math.round(f * (legRow.coordinates.length - 1))];
                  const [x, y] = projection.project(c[0], c[1]);
                  return <circle key={`${s.leg}-${s.km}-${i}`} cx={x} cy={y} r={3.4} fill="#0B0A09" stroke="rgba(255,255,255,.55)" strokeWidth={1.3} />;
                })}

                {/* Cut-off barriers, same interpolation, diamond to distinguish them. */}
                {projection && barriers.map((b, i) => {
                  const legRow = orderedLegs.find((l) => l.leg === b.leg);
                  if (!legRow?.coordinates.length) return null;
                  const f = Math.max(0, Math.min(1, (b.km * 1000) / legRow.distance_m));
                  const c = legRow.coordinates[Math.round(f * (legRow.coordinates.length - 1))];
                  const [x, y] = projection.project(c[0], c[1]);
                  return <rect key={`${b.name}-${i}`} x={x - 3.6} y={y - 3.6} width={7.2} height={7.2} fill="none" stroke="#E4622F" strokeWidth={1.5} transform={`rotate(45 ${x} ${y})`} />;
                })}

                {/* The real elevation series for the bike leg. */}
                {chart && <path d={chart.area} fill="url(#cr-fill)" />}
                {chart && <path d={chart.line} fill="none" stroke="#E4622F" strokeWidth={1.8} strokeLinejoin="round" />}
                {chart && hoverIndex != null && pointCount > 1 && (
                  <line x1={((hoverIndex / (pointCount - 1)) * MAP_W).toFixed(1)} y1={ELEV_TOP - 8} x2={((hoverIndex / (pointCount - 1)) * MAP_W).toFixed(1)} y2={MAP_H} stroke="rgba(255,255,255,.42)" strokeWidth={1} />
                )}
              </svg>

              <div className="mono" style={{ position: "absolute", left: 20, bottom: 16, fontSize: 9.5, letterSpacing: ".12em", color: "#6B665B" }}>
                {chartLeg} PROFILE · {chartProfile ? `${formatKm(chartProfile.distance_m)} KM · ${formatMetres(chartProfile.gain_m)} M GAIN · MAX ${formatMetres(chartProfile.max_m)} M` : "NO PROFILE"}
              </div>
              <div className="mono" style={{ position: "absolute", right: 20, top: 18, display: "flex", gap: 16, fontSize: 11, color: "#FBF8F2" }}>
                {hoverKm != null && <span>{hoverKm.toFixed(1)} km</span>}
                {hoverH != null && <span>{Math.round(hoverH)} m</span>}
              </div>
            </div>

            <div style={{ borderLeft: "1px solid rgba(255,255,255,.09)", padding: "22px 24px", color: "#FBF8F2" }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#5A554C" }}>ON THIS MAP</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                {[
                  ...orderedLegs.map((l) => ({
                    label: `${l.leg.charAt(0)}${l.leg.slice(1).toLowerCase()} route`,
                    swatch: <span style={{ width: 14, height: 2, background: l.leg === "BIKE" ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.28)" }} />,
                    status: `${formatKm(l.distance_m)} km`,
                  })),
                  { label: "Aid stations", swatch: <span style={{ width: 8, height: 8, border: "1.4px solid rgba(255,255,255,.6)", borderRadius: "50%" }} />, status: String(aid.length) },
                  { label: "Cut-off points", swatch: <span style={{ width: 8, height: 8, border: "1.4px solid #E4622F", transform: "rotate(45deg)" }} />, status: String(barriers.length) },
                ].map((layer, i, arr) => (
                  <div key={layer.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,.06)" : undefined }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "#CFC9BC" }}>{layer.swatch}{layer.label}</span>
                    <span className="mono" style={{ fontSize: 10, color: "#7CC08F" }}>{layer.status}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.09)" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".15em", color: "#5A554C" }}>AT THIS POINT</div>
                <div className="mono" style={{ marginTop: 14, fontSize: 32, letterSpacing: "-.02em" }}>
                  {hoverKm == null ? "—" : hoverKm.toFixed(1)}
                  <span style={{ fontSize: 14, color: "#5A554C" }}> km</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55, color: "#96907F" }}>
                  {hoverSegment
                    ? `${hoverSegment.name} · ${hoverSegment.from_km.toFixed(1)}–${hoverSegment.to_km.toFixed(1)} km · ${formatMetres(hoverSegment.elevation_gain_m)} m gain · ${hoverSegment.surface_quality.replace(/_/g, " ")}`
                    : "Move across the profile to read a segment."}
                </div>
              </div>
              <OsmAttribution attribution={bundle.attribution} tone="dark" style={{ marginTop: 20 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Sub-nav ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 40, background: "rgba(241,238,232,.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(21,20,15,.10)", marginTop: 44 }}>
        <div className="mono" style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 52, display: "flex", alignItems: "center", gap: 32, fontSize: 10.5, letterSpacing: ".14em" }}>
          {SUBNAV.map((s) => (
            <a key={s.href} href={s.href} style={{ color: s.href === "#cutoffs" ? "#E4622F" : "#8C8578" }}>{s.label}</a>
          ))}
          <span style={{ marginLeft: "auto", color: "#8C8578" }}>BUNDLE {bundle.version.toUpperCase()}</span>
        </div>
      </div>

      {/* ---------------- Overview ---------------- */}
      <section id="overview" style={{ maxWidth: 1360, margin: "0 auto", padding: "64px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(21,20,15,.14)", borderTop: "1px solid rgba(21,20,15,.14)", borderBottom: "1px solid rgba(21,20,15,.14)" }}>
          {orderedLegs.map((l) => {
            const p = elevationLegs[l.leg];
            return (
              <div key={l.leg} style={{ background: "#F1EEE8", padding: "26px 28px 30px" }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>{l.leg}</div>
                <div className="mono" style={{ fontSize: 38, letterSpacing: "-.03em", marginTop: 12 }}>
                  {formatKm(l.distance_m)}<span style={{ fontSize: 16, color: "#8C8578" }}> km</span>
                </div>
                <div style={{ fontSize: 14, color: "#5C574B", marginTop: 10 }}>
                  {formatMetres(l.elevation_gain_m)} m gain
                  {p && p.laps > 1 ? ` · ${p.laps} laps` : ""}
                  {` · ${l.surface_quality.replace(/_/g, " ")}`}
                </div>
              </div>
            );
          })}
          <div style={{ background: "#F1EEE8", padding: "26px 28px 30px" }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: "#8C8578" }}>TIGHTEST CUT-OFF</div>
            <div className="mono" style={{ fontSize: 38, letterSpacing: "-.03em", marginTop: 12 }}>
              {totals.final_cutoff_minutes == null ? "—" : formatClock(totals.final_cutoff_minutes)}
            </div>
            <div style={{ fontSize: 14, color: "#5C574B", marginTop: 10 }}>
              {barriers.length} {barriers.length === 1 ? "barrier" : "barriers"}
              {totals.final_cutoff_name ? ` · ${formatBarrierName(totals.final_cutoff_name).toLowerCase()}` : ""}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Elevation, one card per leg ---------------- */}
      <section id="elevation" style={{ maxWidth: 1360, margin: "0 auto", padding: "96px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderTop: "1px solid rgba(21,20,15,.14)", paddingTop: 26 }}>
          <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-.045em" }}>Where the course takes it out of you.</Reveal>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: ".13em", color: "#8C8578" }}>
            ELEVATION FROM {(bundle.elevation_source ?? "terrain").toUpperCase()}, NOT BAROMETERS
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${orderedLegs.length},1fr)`, gap: 20, marginTop: 36 }}>
          {orderedLegs.map((l) => {
            const p = elevationLegs[l.leg];
            const small = p ? elevationPath(p, { width: 320, top: 12, bottom: 76 }) : null;
            const flat = !p || p.gain_m <= 0;
            return (
              <div key={l.leg} style={{ background: "#FBF8F2", border: "1px solid rgba(21,20,15,.14)", borderRadius: 8, padding: "22px 24px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em" }}>{l.leg.charAt(0) + l.leg.slice(1).toLowerCase()}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>
                    {flat ? "SEA LEVEL" : `${formatMetres(p!.gain_m)} M · MAX ${formatMetres(p!.max_m)} M`}
                    {p && p.laps > 1 ? ` · ${p.laps} LAPS` : ""}
                  </span>
                </div>
                <svg viewBox="0 0 320 90" style={{ display: "block", width: "100%", marginTop: 18 }} role="img" aria-label={`${l.leg} elevation profile`}>
                  {flat || !small ? (
                    <line x1={0} y1={70} x2={320} y2={70} stroke={`${LEG_COLOR[l.leg]}66`} strokeWidth={1.6} />
                  ) : (
                    <>
                      <path d={small.area} fill={`${LEG_COLOR[l.leg]}22`} />
                      <path d={small.line} fill="none" stroke={LEG_COLOR[l.leg]} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 6 }}>
                  {flat
                    ? "No relief to render — this leg is flat."
                    : `${formatKm(l.distance_m)} km, ${formatMetres(p!.gain_m)} m up and ${formatMetres(p!.loss_m)} m down.`}
                </div>
              </div>
            );
          })}
        </div>
        <OsmAttribution attribution={bundle.attribution} style={{ marginTop: 18 }} />
      </section>

      {/* ---------------- Aid stations ---------------- */}
      <section id="aid" style={{ maxWidth: 1360, margin: "0 auto", padding: "104px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 44 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#E4622F", marginBottom: 18 }}>SUPPLY MAP</div>
            <Reveal as="h2" style={{ margin: 0, fontSize: 52, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.045em" }}>
              {aid.length} aid {aid.length === 1 ? "station" : "stations"}.
            </Reveal>
          </div>
          <div style={{ display: "flex", gap: 34, paddingBottom: 6 }}>
            {Object.entries(provCounts).map(([label, count]) => (
              <div key={label}>
                <div className="mono" style={{ fontSize: 25, letterSpacing: "-.03em" }}>{count}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginTop: 6 }}>{label}</div>
              </div>
            ))}
            {bikeGap != null && (
              <div>
                <div className="mono" style={{ fontSize: 25, letterSpacing: "-.03em" }}>{bikeGap.toFixed(1)}<span style={{ fontSize: 13, color: "#8C8578" }}>km</span></div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginTop: 6 }}>WIDEST BIKE GAP</div>
              </div>
            )}
            {runGap != null && (
              <div>
                <div className="mono" style={{ fontSize: 25, letterSpacing: "-.03em" }}>{runGap.toFixed(1)}<span style={{ fontSize: 13, color: "#8C8578" }}>km</span></div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578", marginTop: 6 }}>WIDEST RUN GAP</div>
              </div>
            )}
          </div>
        </div>

        <Reveal style={{ background: "#FBF8F2", borderRadius: 8, padding: 14, boxShadow: "0 30px 60px -46px rgba(21,20,15,.3)" }}>
          <div style={{ position: "relative", padding: "22px 0 10px" }}>
            <div style={{ position: "absolute", left: 150, top: 34, bottom: 34, width: 2, background: "linear-gradient(to bottom,rgba(21,20,15,.06),rgba(228,98,47,.35),rgba(21,20,15,.06))" }} />
            {sortLegs(aid).map((s, i) => {
              const official = s.provenance === "OFFICIAL";
              return (
                <div key={`${s.leg}-${s.km}-${i}`} className="row-hover-cream" style={{ position: "relative", display: "grid", gridTemplateColumns: "150px 44px minmax(0,1fr) 150px", alignItems: "center", padding: "14px 24px 14px 0", borderRadius: 8 }}>
                  <div style={{ textAlign: "right", paddingRight: 26 }}>
                    <div className="mono" style={{ fontSize: 19, letterSpacing: "-.03em" }}>{s.km.toFixed(1)} km</div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: LEG_COLOR[s.leg], marginTop: 5 }}>{s.leg}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <span style={{ width: 13, height: 13, borderRadius: "50%", background: official ? "#E4622F" : "#FBF8F2", border: "2.5px solid #FBF8F2", boxShadow: `0 0 0 2px ${official ? "rgba(228,98,47,.28)" : "rgba(21,20,15,.22)"}` }} />
                  </div>
                  <div style={{ paddingLeft: 22 }}>
                    <div style={{ fontSize: 17.5, fontWeight: 600, letterSpacing: "-.025em" }}>{s.name}</div>
                    {/* Tokens formatted to prose. Nothing added that the API did not send. */}
                    <div style={{ fontSize: 14, color: "#6B6455", marginTop: 4 }}>{formatContents(s.contents)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 4, background: official ? "#EAF5EE" : "#F1EDE4", fontSize: 9, letterSpacing: ".12em", color: official ? "#2E7D53" : "#8C8578", whiteSpace: "nowrap" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: official ? "#2E7D53" : "#8C8578" }} />
                      {s.provenance ?? "UNVERIFIED"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, margin: "6px 10px", padding: "16px 18px", borderRadius: 8, background: "#F4F1E9" }}>
            <span style={{ fontSize: 14, color: "#6B6455" }}>
              Every station carries its provenance, on screen and in print. Contents are listed exactly as published — nothing is assumed to be there.
            </span>
            <a href="#convert" className="mono link-accent" style={{ fontSize: 10, letterSpacing: ".14em", color: "#C6461B", whiteSpace: "nowrap" }}>SOLVE MY FUELLING →</a>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Cut-off clock, from POST /cutoff-check ---------------- */}
      <section id="cutoffs" style={{ marginTop: 104, padding: "96px 0 100px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 46px" }}>
            <Reveal className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 15px", background: "#FBF8F2", borderRadius: 5, boxShadow: "0 2px 10px rgba(21,20,15,.06)", fontSize: 10, letterSpacing: ".16em", color: "#8C7A5E", marginBottom: 26 }}>
              <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />CUT-OFF CLOCK · FREE, NO ACCOUNT
            </Reveal>
            <Reveal as="h2" delay={0.06} style={{ margin: 0, fontSize: 56, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Where do your margins sit?</Reveal>
            <Reveal as="p" delay={0.12} style={{ margin: "20px auto 0", maxWidth: 420, fontSize: 16.5, lineHeight: 1.5, color: "#6B6455" }}>Set your target finish. Every barrier on this course recalculates against it.</Reveal>
          </div>

          <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
            <div style={{ background: "#fff", borderRadius: 9, padding: "28px 30px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#A39B8A" }}>TARGET FINISH</div>
                  <div className="mono" style={{ fontSize: 46, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1, marginTop: 9 }}>{formatClock(goal)}:00</div>
                </div>
                {cutoffRows.length > 0 && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 15px", borderRadius: 5, background: verdictBg }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: verdictColor }} />
                    <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", color: verdictColor }}>{verdictLabel}</span>
                  </div>
                )}
              </div>

              <input
                type="range" min={sliderMin} max={sliderMax} step={5} value={goal}
                onChange={(e) => setGoal(+e.target.value)}
                aria-label="Target finish time in minutes"
                style={{ width: "100%", margin: "26px 0 8px", height: 20 }}
              />
              <div className="mono" style={{ display: "flex", justifyContent: "space-between", height: 16, fontSize: 9.5, letterSpacing: ".1em", color: "#A39B8A" }}>
                <span>{formatClock(sliderMin)}</span>
                <span style={{ color: "#C0432E" }}>{formatClock(finishLimit)} FINISH CUT-OFF</span>
                <span>{formatClock(sliderMax)}</span>
              </div>

              <div style={{ marginTop: 34 }}>
                {cutoff.isPending && !cutoffRows.length ? (
                  <div style={{ display: "flex", gap: 40, justifyContent: "space-around", padding: "20px 0" }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                        <Skeleton width={92} height={9} /><Skeleton width="5ch" height={17} /><Skeleton width="6ch" height={12} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(cutoffRows.length, 1)},1fr)`, gap: 16 }}>
                    {cutoffRows.map((r) => {
                      const color = r.margin_minutes < 0 ? "#C0432E" : r.at_risk ? "#A9761A" : "#2E7D53";
                      return (
                        <div key={r.name} style={{ textAlign: "center" }}>
                          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A39B8A" }}>{formatBarrierName(r.name).toUpperCase()}</div>
                          <div className="mono" style={{ fontSize: 17, marginTop: 6 }}>{formatClock(r.estimated_eta_minutes)}</div>
                          <div style={{ margin: "13px auto 0", width: 13, height: 13, borderRadius: "50%", background: color, border: "3px solid #fff", boxShadow: `0 0 0 2px ${color}` }} />
                          <div className="mono" style={{ fontSize: 12.5, color, marginTop: 13 }}>{formatMargin(r.margin_minutes)}</div>
                          <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#A39B8A", marginTop: 4 }}>LIMIT {formatClock(r.limit_minutes)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/*
              The verdict, and only the verdict.
              The prototype also showed a "splits this implies" panel built from
              invented ratios — 9.3% swim, an 8-minute T1. Nothing serves those,
              and T1/T2 are not serialised at all, so the panel is gone rather
              than filled with plausible arithmetic.
            */}
            {tightest && (
              <div style={{ borderRadius: 9, padding: "24px 26px", marginTop: 10, background: verdictBg }}>
                <p style={{ margin: 0, fontSize: 23, lineHeight: 1.26, fontWeight: 500, letterSpacing: "-.03em", color: "#15140F" }}>
                  {failing
                    ? `This misses the ${formatBarrierName(failing.name).toLowerCase()} by ${formatClock(Math.abs(failing.margin_minutes))}.`
                    : `You clear the ${formatBarrierName(tightest.name).toLowerCase()} with ${formatClock(tightest.margin_minutes)} to spare.`}
                </p>
                <p style={{ margin: "14px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>{tightest.basis}</p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------------- Convert banner ---------------- */}
      <section id="convert" style={{ maxWidth: 1360, margin: "0 auto", padding: "56px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, padding: "32px 40px", border: "1px solid rgba(21,20,15,.2)", borderRadius: 8, background: "#FBF8F2" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.032em" }}>That is the course. Now put yourself on it.</div>
            <p style={{ margin: "10px 0 0", maxWidth: 620, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
              Pacing targets, an aid-station timeline, five packed bags, a card you can print.{priceLabel ? ` ${priceLabel} for this race.` : ""}
            </p>
          </div>
          <Link href={`${routes.planBuilder}?course=${encodeURIComponent(course.slug)}`} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 52, padding: "0 30px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600, flex: "none" }}>
            Build my race plan
          </Link>
        </div>
      </section>

      <div style={{ marginTop: 104 }}>
        <Footer extra={` · COURSE BUNDLE ${bundle.version}`} />
      </div>
    </div>
  );
}

/** Matched to the real page's shape so nothing jumps when the course lands. */
function ReconSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref="#convert" />
      <section style={{ position: "relative", height: "66vh", minHeight: 520, background: "#1C1916" }}>
        <div style={{ position: "absolute", left: 56, bottom: 44, display: "flex", flexDirection: "column", gap: 20 }}>
          <Skeleton width={220} height={10} />
          <Skeleton width={620} height={82} />
          <Skeleton width={380} height={16} />
        </div>
      </section>
      <section style={{ maxWidth: 1360, margin: "34px auto 0", padding: "0 56px" }}>
        <Skeleton width="100%" height={460} radius={9} />
      </section>
      <section style={{ maxWidth: 1360, margin: "64px auto 0", padding: "0 56px", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton width={70} height={10} /><Skeleton width="7ch" height={38} /><Skeleton width={170} height={14} />
          </div>
        ))}
      </section>
    </div>
  );
}

export default function CourseReconPage() {
  return (
    <Suspense fallback={<ReconSkeleton />}>
      <ReconContent />
    </Suspense>
  );
}
