"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { courseImageFor } from "@/lib/courseMedia";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { MediaPlaceholder } from "@/components/MediaPlaceholder";
import { ApiErrorState } from "@/components/ApiErrorState";
import { Skeleton } from "@/components/Skeleton";
import { OsmAttribution } from "@/components/OsmAttribution";
import { ShowcaseMap, SurveyedMap } from "@/components/CourseMap";
import { LegChart, ProfilePanel } from "@/components/CourseCharts";
import { LockedBadge, LockedFigure, LockedPanel, UnlockAction } from "@/components/LockedPanel";
import { Marquee } from "@/components/Marquee";
import { routes } from "@/lib/routes";
import { useCourses, useRecon, type CutoffCheck, type Recon, type Leg } from "@/lib/api/courses";
import { usePrices, priceFor, formatPrice } from "@/lib/api/billing";
import { client, unwrap } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import {
  LEG_COLOR, formatBarrierName, formatClock, formatContents,
  formatKm, formatMargin, formatMetres, sortLegs, widestGapKm,
} from "@/lib/courseGeo";

const SUBNAV = [
  { href: "#overview", label: "OVERVIEW" },
  { href: "#elevation", label: "ELEVATION" },
  { href: "#aid", label: "AID STATIONS" },
  { href: "#cutoffs", label: "CUT-OFFS" },
];

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
  /**
   * With no `?course=` the page picks one from the directory rather than a
   * hardcoded slug, so it stays correct whatever the directory holds.
   *
   * It must pick a course that has **course data**, not simply the first row.
   * The directory lists the announced season alongside the built courses, and
   * an announced row has no bundle — so taking `data[0]` blindly opened recon
   * on a race whose map is still being built and answered a visitor's first
   * click with "no course data yet". That read as a broken page, which is
   * exactly what a directory's own landing page must never do.
   *
   * The directory is already ordered showcase → raceable → announced, so the
   * first available row is also the best one to open on. Falling back to
   * `data[0]` keeps the old behaviour if a directory ever holds nothing
   * raceable at all, where the honest answer really is "being built".
   */
  const landing =
    courses.data?.data.find((c) => c.availability === "available") ?? courses.data?.data[0];
  const courseRef = params.get("course") ?? landing?.slug ?? null;

  const { data: recon, isPending, error, refetch } = useRecon(courseRef);
  const prices = usePrices();

  /**
   * With no `?course=` this page depends on the directory to pick one, so the
   * directory's failure is this page's failure — and it has to be *said*.
   *
   * A query with no ref is disabled, and a disabled query reports
   * `isPending: true` with no error for as long as it stays that way. Rendering
   * the skeleton on `isPending` alone therefore left this page loading forever
   * whenever `GET /courses` failed: a spinner that can never resolve, with the
   * real error one component away and never shown.
   */
  const failure = error ?? (courseRef === null ? courses.error : null);

  if (failure) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref={routes.planBuilder} />
        <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 56px" }}>
          <ApiErrorState
            error={failure}
            onRetry={() => void (error ? refetch() : courses.refetch())}
          />
          <Link href={routes.races} className="mono link-accent" style={{ display: "inline-block", marginTop: 24, fontSize: 11, letterSpacing: ".14em", color: "#C6461B" }}>
            ← BACK TO THE DIRECTORY
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // The directory answered, and it is empty. Not an error, and not a wait.
  if (courseRef === null && !courses.isPending) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AppHeader active="courseRecon" ctaLabel="Build your plan" ctaHref={routes.planBuilder} />
        <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 56px", textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NO COURSE SELECTED</div>
          <h1 style={{ margin: "18px 0 0", fontSize: 34, lineHeight: 1.14, fontWeight: 500, letterSpacing: "-.032em" }}>
            Pick a course to explore.
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.55, color: "#6B6455" }}>
            Recon is free and needs no account — choose one from the directory.
          </p>
          <Link href={routes.races} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
            Browse the directory
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

  const elevationLegs = recon.elevation_profile?.legs ?? {};

  /**
   * Whether the course work is withheld from this visitor.
   *
   * The backend redacts the geometry, the segments, the aid stations, the
   * barrier ladder and the elevation series together, behind one flag. Reading
   * that flag — rather than inferring "locked" from an empty array — is what
   * keeps "you have not unlocked this" distinct from "this course has no data",
   * which look identical from the arrays alone and need opposite screens.
   */
  const locked = recon.access ? !recon.access.map_unlocked : false;
  const unlockHref = `${routes.planBuilder}?course=${encodeURIComponent(course.slug)}`;

  /** Where the cursor is on the wide profile, in km along the leg it is over. */
  const [hover, setHover] = useState<{ km: number; leg: Leg } | null>(null);
  const onHoverKm = useCallback(
    (km: number | null, leg: Leg | null) => setHover(km != null && leg ? { km, leg } : null),
    [],
  );

  /**
   * The segment the cursor is over, by name.
   *
   * These names come from the ingest pipeline (`name_source: DERIVED_TERRAIN`),
   * so "Flat 1" and "Climb 3" are what the data actually says. The prototype's
   * prose about Coll de Femenia and headwinds in eight of eleven editions was
   * invented, and nothing serves it.
   */
  const hoverSegment = useMemo(() => {
    if (!hover) return null;
    return (
      segments.find(
        (s) => s.leg === hover.leg && hover.km >= s.from_km && hover.km <= s.to_km,
      ) ?? null
    );
  }, [hover, segments]);

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

  /**
   * Slider bounds from the course's own final cut-off, not a guessed 09:00–17:00.
   *
   * `barriers` is redacted to `[]` on a locked course, and taking the max of an
   * empty list fell through to the 60-minute floor — which set a 70.3's target
   * slider to a range of 27 to 66 minutes, with the handle pinned off the end.
   * `totals.final_cutoff_minutes` ships either way, precisely so the free
   * cut-off calculator keeps working without the ladder, so it is the figure to
   * scale from.
   */
  const finishLimit = Math.max(
    ...barriers.map((b) => b.limit_minutes_from_start),
    totals.final_cutoff_minutes ?? 0,
    60,
  );
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
        <MediaPlaceholder path={courseImageFor(course, "hero") ?? ""} background="linear-gradient(155deg,#453B31 0%,#251F1A 52%,#13110F 100%)" style={{ position: "absolute", inset: 0 }} />
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
            {/* `minWidth: 0` is load-bearing. A flex item defaults to
                `min-width: auto`, so this column would size itself to the
                widest thing in it — the 92px title on one line — and report a
                client width equal to its own content. The marquee measures
                overflow against that width, found none, and never ran. */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                {/*
                  The showcase gets one line, not three.

                  It used to carry the same provenance row as a surveyed course:
                  "ESTIMATED · NOT YET VERIFIED · FICTIONAL COURSE", three grey
                  caveats stacked across the hero of the one page whose whole job
                  is to be worth looking at. Two of them are also confusing here —
                  Kalmar 70.3 is a real race, and what is illustrative is this
                  drawing of it, which the note under the map says plainly and
                  attractively. So the marketing course says what it is, once,
                  and the honesty lives where a visitor is actually looking.
                */}
                {recon.access?.illustrative_map ? (
                  <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: "1px solid rgba(228,98,47,.45)", borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: "#E4622F" }}>
                    <span style={{ width: 5, height: 5, background: "#E4622F", borderRadius: "50%" }} />
                    SAMPLE COURSE · OPEN TO EVERYONE
                  </span>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              {/* Set on one line at 92px, so a long official name — "IRONMAN
                  70.3 Costa Navarino, Peloponnese, Greece" — runs off the
                  right edge and the first thing a visitor needs to read would
                  be the one thing they could not. It scrolls itself, and only
                  when it has to. */}
              <Marquee
                text={course.name}
                style={{ maxWidth: "100%" }}
              >
                {(name) => (
                  <h1 style={{ whiteSpace: "nowrap", margin: 0, fontSize: 92, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em", color: "#FBF8F2" }}>{name}</h1>
                )}
              </Marquee>
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

      {/* ---------------- The course map ---------------- */}
      {/*
        One renderer for every map on the site.

        The route used to be drawn here as a flat SVG polyline over a dark
        panel — a second map design, unrelated to the one the marketing page
        shows, which meant the product looked like two products. It is the same
        component now: measured terrain, the real routes at one honest scale,
        the same pins and the same cursor readout.

        What it shows depends on whether this athlete may see it. `access` comes
        from the server rather than being inferred from an empty coordinate
        array, because "you have not paid for this" and "this course has no
        geometry yet" need different screens and look identical otherwise.
      */}
      <section style={{ maxWidth: 1360, margin: "34px auto 0", padding: "0 56px" }}>
        {recon.access?.illustrative_map ? (
          <ShowcaseMap height="min(70vh,740px)" />
        ) : (
          <SurveyedMap
            courseRef={course.slug}
            courseName={course.name}
            height="min(70vh,740px)"
            locked={recon.access ? !recon.access.map_unlocked : false}
            lockedReason={recon.access?.map_locked_reason}
            onUnlock={
              <Link
                href={routes.planBuilder}
                className="btn-accent"
                style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
              >
                Build a plan for this race
              </Link>
            }
          />
        )}

        {/*
          The elevation profile stays a chart, because that is what it is:
          distance against height, with the segments underneath it. The map
          answers "where"; this answers "how hard, and where does it get hard".

          Two views. **Bike** is where a long-course race is decided and the leg
          with the relief; **Race** puts all three legs on one cumulative axis,
          which is the only view in which the day reads as a single shape rather
          than three unrelated cards.
        */}
        {locked ? (
          <div style={{ marginTop: 14 }}>
            <LockedPanel
              minHeight={210}
              dark
              title="The profile, metre by metre"
              body="Every climb on this course, surveyed from terrain rather than barometers, with the segments named and the gradients measured. It opens with your race plan."
              action={<UnlockAction href={unlockHref} />}
            />
          </div>
        ) : (
          <ProfilePanel
            legs={elevationLegs}
            courseName={course.name}
            showcase={Boolean(recon.access?.illustrative_map)}
            onHoverKm={onHoverKm}
            attribution={<OsmAttribution attribution={bundle.attribution} tone="dark" style={{ flex: "none" }} />}
            hoverLabel={
              hoverSegment
                ? `${hoverSegment.name} · ${hoverSegment.from_km.toFixed(1)}–${hoverSegment.to_km.toFixed(1)} km · ${formatMetres(hoverSegment.elevation_gain_m)} m gain · ${hoverSegment.surface_quality.replace(/_/g, " ")}`
                : undefined
            }
          />
        )}
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
                  {/* "0 m gain · typical road" was the swim's line. Both halves
                      are true of the row and neither is true of a swim, which
                      is what happens when one template describes three sports. */}
                  {l.leg === "SWIM"
                    ? `open water${p && p.laps > 1 ? ` · ${p.laps} laps` : ""}`
                    : `${formatMetres(l.elevation_gain_m)} m gain${
                        p && p.laps > 1 ? ` · ${p.laps} laps` : ""
                      } · ${l.surface_quality.replace(/_/g, " ")}`}
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
              {/* The headline cut-off ships either way; the ladder behind it
                  does not. Printing "0 barriers" from a redacted list states
                  something false about the course, so the count is simply
                  omitted when it is not ours to give. */}
              {totals.final_cutoff_name ? formatBarrierName(totals.final_cutoff_name).toLowerCase() : ""}
              {barriers.length > 0
                ? `${totals.final_cutoff_name ? " · " : ""}${barriers.length} ${barriers.length === 1 ? "barrier" : "barriers"}`
                : `${totals.final_cutoff_name ? " · " : ""}full ladder with a plan`}
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
            const swim = l.leg === "SWIM";
            /* A swim has no relief and never will; a locked leg has relief we
               are not showing. The old card collapsed both into "SEA LEVEL —
               no relief to render", which for a 90 km bike leg with 387 m of
               climb was simply untrue. */
            const flat = !locked && !swim && (!p || p.gain_m <= 0);
            return (
              <div key={l.leg} style={{ background: "#FBF8F2", border: "1px solid rgba(21,20,15,.14)", borderRadius: 8, padding: "22px 24px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.02em" }}>{l.leg.charAt(0) + l.leg.slice(1).toLowerCase()}</span>
                  {locked ? (
                    <LockedBadge />
                  ) : (
                    <span className="mono" style={{ fontSize: 11, color: "#8C8578", textAlign: "right" }}>
                      {swim
                        ? `${formatKm(l.distance_m)} KM${p && p.laps > 1 ? ` · ${p.laps} LAPS` : ""}`
                        : flat
                          ? "SEA LEVEL"
                          : `${formatMetres(p!.gain_m)} M · MAX ${formatMetres(p!.max_m)} M${p!.laps > 1 ? ` · ${p!.laps} LAPS` : ""}`}
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 18 }}>
                  <LegChart
                    leg={l.leg}
                    profile={p}
                    distanceM={l.distance_m}
                    locked={locked}
                    showcase={Boolean(recon.access?.illustrative_map)}
                  />
                </div>
                <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 6 }}>
                  {/* Locked first, for every leg. The distance is a fact that
                      ships either way and is worth keeping on the card; what
                      changes is that the swim no longer describes itself as
                      though it were open while its neighbours are shut. */}
                  {locked
                    ? swim
                      ? `${formatKm(l.distance_m)} km of open water. The course opens with a plan.`
                      : `${formatKm(l.distance_m)} km, ${formatMetres(l.elevation_gain_m)} m of climbing. The profile opens with a plan.`
                    : swim
                      ? `${formatKm(l.distance_m)} km of open water${p && p.laps > 1 ? `, swum in ${p.laps} laps` : ""}.`
                      : flat
                        ? `${formatKm(l.distance_m)} km, and flat the whole way.`
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
              {/* "0 aid stations." was the headline on every locked course — a
                  sentence that says the organiser puts out no water. The count
                  is the withheld thing, so the headline stops being a count. */}
              {locked
                ? "Every aid station, in order."
                : `${aid.length} aid ${aid.length === 1 ? "station" : "stations"}.`}
            </Reveal>
          </div>
          <div style={{ display: "flex", gap: 34, paddingBottom: 6 }}>
            {locked ? (
              <>
                <LockedFigure label="STATIONS" width={40} />
                <LockedFigure label="WIDEST BIKE GAP" width={58} />
                <LockedFigure label="WIDEST RUN GAP" width={58} />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {locked ? (
          <Reveal>
            <LockedPanel
              minHeight={300}
              title="Where the water is, and what is on the table"
              body="Every station on the course, in order, with its distance and exactly what it carries — listed as published, so nothing is assumed to be there. Your plan puts your own fuelling on top of it."
              action={<UnlockAction href={unlockHref} />}
              preview={<AidPreview />}
            />
          </Reveal>
        ) : (
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
        )}
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

/**
 * The blurred stand-in behind the locked aid-station panel.
 *
 * Deliberately generic: evenly-spaced rows of the right shape, not this
 * course's real spacing. Drawing the true station positions at low fidelity
 * would leak the thing being sold, and drawing plausible-but-wrong ones would
 * be a lie about the course. A texture is neither.
 */
function AidPreview() {
  return (
    <div style={{ padding: "26px 0" }} aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "150px 44px minmax(0,1fr) 150px",
            alignItems: "center",
            padding: "14px 24px 14px 0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: 26 }}>
            <div style={{ width: 62, height: 15, borderRadius: 3, background: "rgba(21,20,15,.16)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <span style={{ width: 13, height: 13, borderRadius: "50%", background: i % 2 ? "#E4622F" : "#C9C1B2" }} />
          </div>
          <div style={{ paddingLeft: 22 }}>
            <div style={{ width: `${46 + ((i * 17) % 38)}%`, height: 15, borderRadius: 3, background: "rgba(21,20,15,.17)" }} />
            <div style={{ width: `${30 + ((i * 23) % 34)}%`, height: 11, borderRadius: 3, background: "rgba(21,20,15,.10)", marginTop: 7 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 72, height: 19, borderRadius: 4, background: "rgba(21,20,15,.10)" }} />
          </div>
        </div>
      ))}
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
