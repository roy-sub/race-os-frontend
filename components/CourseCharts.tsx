"use client";

/**
 * The charts on the course pages.
 *
 * Three problems this file exists to solve, all of them things a first-time
 * visitor saw before they saw anything else:
 *
 * 1. **The profiles read as heart-rate traces.** A polyline through 240 samples
 *    across 800px puts a corner every three pixels. Terrain does not look like
 *    that; sampling noise does. The curves are smoothed and drawn as monotone
 *    cubics now — see `smoothPath` in `lib/courseGeo`.
 * 2. **The swim card was empty.** A swim has no elevation, so the card drew a
 *    flat rule and said "no relief to render", which is a card admitting it has
 *    nothing to say. A swim leg has plenty to say — it is just not height.
 * 3. **A locked course looked broken rather than locked.** With the geometry
 *    withheld, the elevation cards fell through to the *flat-leg* branch and
 *    claimed a 90 km bike leg was at sea level. That is not a paywall, it is a
 *    false statement about the course. Locked data now renders as locked.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Leg, ReconElevationLeg } from "@/lib/api/courses";
import {
  LEG_COLOR,
  elevationPath,
  formatKm,
  formatMetres,
  racePath,
} from "@/lib/courseGeo";

// ---------------------------------------------------------------------------
// Water
// ---------------------------------------------------------------------------

/**
 * One sine, sampled to a path.
 *
 * Drawn across `2 × width` so that translating by exactly `width` loops without
 * a seam, which is what lets the drift animation run forever on three layers
 * for the cost of one transform each.
 */
function wave(
  width: number,
  amplitude: number,
  wavelength: number,
  phase: number,
  baseline: number,
  floor: number,
): string {
  const step = 6;
  const points: string[] = [];
  for (let x = 0; x <= width * 2 + step; x += step) {
    const y = baseline + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude;
    points.push(`${x === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(2)}`);
  }
  return `${points.join(" ")} L ${(width * 2 + step).toFixed(1)} ${floor} L 0 ${floor} Z`;
}

/**
 * The swim leg, drawn as water.
 *
 * Layered swell rather than a chart: three sine bands at different wavelengths
 * and speeds, the slowest and darkest at the back. Read together they give the
 * parallax of open water, which is the honest visual answer to "what is this
 * leg like" for a leg with no relief.
 *
 * The buoys are the one piece of real information on it — a 70.3 swim is raced
 * between turn buoys, and their spacing is the course. Everything else here is
 * atmosphere and says so.
 */
export function WaterMotif({
  width = 320,
  height = 90,
  laps = 1,
  tone = LEG_COLOR.SWIM,
  animate = true,
}: {
  width?: number;
  height?: number;
  laps?: number;
  tone?: string;
  animate?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const surface = height * 0.34;

  // Turn buoys: a one-lap swim is a circuit around two, a two-lap swim rounds
  // them twice. Evenly spaced, because the card is 320px wide and the real
  // geometry is on the map above it.
  const buoys = useMemo(() => {
    const count = Math.max(2, Math.min(4, laps * 2));
    return Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * width);
  }, [laps, width]);

  // Faint streaks below the surface, at varying depth and length. They read as
  // current rather than as data, which is the honest register for this card.
  const streaks = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const t = (i * 37) % 100;
        return {
          y: surface + 10 + ((i * 13) % Math.max(1, height - surface - 16)),
          x: (t / 100) * width * 0.8,
          len: 26 + ((i * 19) % 44),
          o: 0.05 + ((i * 7) % 9) / 100,
        };
      }),
    [surface, height, width],
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", width: "100%", overflow: "hidden" }}
      role="img"
      aria-label={`Open-water swim leg${laps > 1 ? `, ${laps} laps` : ""}`}
      preserveAspectRatio="none"
    >
      <defs>
        {/* The body of the water: saturated at the surface, falling away into
            depth. This is what makes the card read as water rather than as a
            pale chart with nothing plotted on it. */}
        <linearGradient id={`${gid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.52} />
          <stop offset="45%" stopColor={tone} stopOpacity={0.30} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id={`${gid}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.34} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.04} />
        </linearGradient>
        <linearGradient id={`${gid}-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity={0.20} />
          <stop offset="100%" stopColor={tone} stopOpacity={0.02} />
        </linearGradient>
        {/* Light on the surface, brightest a third of the way across. */}
        <linearGradient id={`${gid}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="34%" stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <rect x="0" y="0" width={width} height={height} rx="4" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${gid}-clip)`}>
        {/* Back swell: longest wavelength, slowest, palest. */}
        <g style={animate ? { animation: "raceos-drift-slow 21s linear infinite" } : undefined}>
          <path d={wave(width, 3.0, 196, 0, surface + 9, height)} fill={`url(#${gid}-back)`} />
        </g>
        {/* Mid swell. */}
        <g style={animate ? { animation: "raceos-drift 14s linear infinite" } : undefined}>
          <path d={wave(width, 4.4, 138, 1.1, surface + 4, height)} fill={`url(#${gid}-mid)`} />
        </g>
        {/* The water itself, and the one stroked edge that gives it a surface. */}
        <g style={animate ? { animation: "raceos-drift-fast 10s linear infinite" } : undefined}>
          <path d={wave(width, 3.2, 104, 2.2, surface, height)} fill={`url(#${gid}-body)`} />
          <path
            d={wave(width, 3.2, 104, 2.2, surface, height).split(" L 0 ")[0]}
            fill="none"
            stroke={tone}
            strokeOpacity={0.7}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <path
            d={wave(width, 3.2, 104, 2.2, surface - 1.5, height).split(" L 0 ")[0]}
            fill="none"
            stroke={`url(#${gid}-sheen)`}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
        </g>

        {/* Current, under the surface. */}
        {streaks.map((s, i) => (
          <line
            key={i}
            x1={s.x}
            x2={s.x + s.len}
            y1={s.y}
            y2={s.y}
            stroke="#FFFFFF"
            strokeOpacity={s.o + 0.12}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        ))}
      </g>

      {/* Turn buoys. The one piece of real information on the card: a 70.3 swim
          is raced between them, and their count is the lap structure. */}
      {buoys.map((x, i) => (
        <g key={i} transform={`translate(${x.toFixed(1)} ${surface})`}>
          <line y1={1} y2={13} stroke="#15140F" strokeOpacity={0.22} strokeWidth={1.2} />
          <path d="M0 -11 L6 -1 L-6 -1 Z" fill="#E4622F" />
          <circle cy={-1} r={2.2} fill="#FBF8F2" stroke="#E4622F" strokeWidth={1.2} />
        </g>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Per-leg cards
// ---------------------------------------------------------------------------

/**
 * One leg's card chart: water for the swim, a smoothed profile for the rest.
 *
 * `profile` absent means the data is not here. That is two different situations
 * and they must not look alike — a locked course and a course with no bundle
 * are both "no series", but only one of them is something the visitor can do
 * anything about. The caller passes `locked` to say which.
 */
export function LegChart({
  leg,
  profile,
  distanceM,
  locked = false,
  showcase = false,
  width = 320,
  height = 90,
}: {
  leg: Leg;
  profile?: ReconElevationLeg;
  distanceM: number;
  locked?: boolean;
  /**
   * The marketing course, where the picture is the product.
   *
   * Its terrain is already a stylisation that says so on its face, so there is
   * nothing to protect by rendering its sampling noise faithfully — smoothing
   * harder costs no truth and buys a line worth looking at. A surveyed course
   * keeps the lighter touch, because there the shape *is* the claim.
   */
  showcase?: boolean;
  width?: number;
  height?: number;
}) {
  const tone = LEG_COLOR[leg];

  // Locked is decided before the leg is.
  //
  // The swim used to draw its water motif whatever the course's access said,
  // on the reasoning that a swim has no elevation to withhold. True of the
  // data, wrong on the page: two cards behind a lock and a third wide open
  // reads as one of them having failed rather than as a paywall, and the
  // motif is atmosphere anyway. All three legs are covered together now, and
  // the swim is covered *as water*, so the section still looks like itself.
  if (locked) {
    return <LockedChart width={width} height={height} tone={tone} water={leg === "SWIM"} />;
  }
  if (leg === "SWIM") {
    return <WaterMotif width={width} height={height} laps={profile?.laps ?? 1} tone={tone} />;
  }
  if (!profile) return <LockedChart width={width} height={height} tone={tone} />;

  const drawn = elevationPath(
    profile,
    { width, top: 12, bottom: height - 14 },
    showcase ? { radius: 5, points: 22 } : {},
  );
  if (!drawn || profile.gain_m <= 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%" }}>
        <line
          x1={0}
          y1={height - 20}
          x2={width}
          y2={height - 20}
          stroke={`${tone}66`}
          strokeWidth={1.6}
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", width: "100%" }}
      role="img"
      aria-label={`${leg.toLowerCase()} elevation profile, ${formatKm(distanceM)} km`}
    >
      <path d={drawn.area} fill={`${tone}20`} />
      <path
        d={drawn.line}
        fill="none"
        stroke={tone}
        strokeWidth={1.9}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The stand-in for a chart whose data is behind the paywall.
 *
 * A blurred, generic ridge — deliberately *not* this course's shape, because
 * drawing the real profile at low fidelity would either give away the thing
 * being sold or misrepresent it. It reads as "a chart lives here", which is
 * exactly what it is.
 */
export function LockedChart({
  width = 320,
  height = 90,
  tone = "#8C8578",
  water = false,
}: {
  width?: number;
  height?: number;
  tone?: string;
  /** Draw the swim's water behind the blur instead of a ridge. */
  water?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const d = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * width;
      const t = i / 24;
      const y =
        height -
        22 -
        (Math.sin(t * Math.PI * 2.1) * 0.42 + Math.sin(t * Math.PI * 5.3 + 1.2) * 0.2 + 0.5) *
          (height * 0.42);
      pts.push([x, y]);
    }
    return (
      pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") +
      ` L ${width} ${height - 14} L 0 ${height - 14} Z`
    );
  }, [width, height]);

  if (water) {
    // The same motif the unlocked card shows, behind the same blur as the
    // ridge — so the swim reads as covered rather than as missing, and the
    // three cards are covered the same way.
    return (
      <div
        aria-hidden
        style={{ filter: "blur(4px) saturate(.55)", opacity: 0.55, pointerEvents: "none" }}
      >
        <WaterMotif width={width} height={height} tone={tone} animate={false} />
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%" }} aria-hidden>
      <defs>
        <filter id={`${gid}-blur`}>
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
      </defs>
      <path d={d} fill={tone} fillOpacity={0.13} filter={`url(#${gid}-blur)`} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The big profile panel
// ---------------------------------------------------------------------------

const PANEL_W = 800;
const PANEL_H = 150;

type PanelMode = "BIKE" | "RACE";

/** Where one leg starts and ends on the whole-race axis, in svg units. */
type LegBand = { leg: Leg; fromX: number; toX: number };

/**
 * The wide elevation panel under the map, with a Bike / Race toggle.
 *
 * **Bike** is the default because a long-course race is decided there and it is
 * the leg with the relief. **Race** puts all three legs on one cumulative axis —
 * the view that answers "what does the whole day look like", and the one where
 * the swim's flatness and the run's laps finally read as part of a single shape
 * instead of three unrelated cards.
 *
 * Height is not renormalised between the two: switching modes re-frames the
 * same terrain rather than redrawing it at a new vertical exaggeration, so the
 * toggle cannot make a course look hillier than the other view just showed it.
 */
export function ProfilePanel({
  legs,
  courseName,
  attribution,
  onHoverKm,
  hoverLabel,
  showcase = false,
}: {
  legs: Partial<Record<Leg, ReconElevationLeg>>;
  courseName: string;
  attribution?: React.ReactNode;
  onHoverKm?: (km: number | null, leg: Leg | null) => void;
  hoverLabel?: React.ReactNode;
  /** See `LegChart` — the marketing course is drawn for the eye. */
  showcase?: boolean;
}) {
  const available = useMemo(
    () => (["SWIM", "BIKE", "RUN"] as Leg[]).filter((leg) => legs[leg]),
    [legs],
  );
  const canRace = available.length > 1;
  const [mode, setMode] = useState<PanelMode>(legs.BIKE ? "BIKE" : "RACE");
  const [hover, setHover] = useState<number | null>(null);
  const box = { width: PANEL_W, top: 14, bottom: PANEL_H - 26 };

  // A course with no bike leg can never show the bike view; keep the toggle
  // honest rather than offering a mode that renders nothing.
  const effective: PanelMode = mode === "BIKE" && !legs.BIKE ? "RACE" : mode;

  const single = effective === "BIKE" ? legs.BIKE : undefined;
  const draw = showcase ? { radius: 5, points: 38 } : {};
  const drawn = useMemo(
    () =>
      effective === "RACE"
        ? racePath(legs, box, draw)
        : single
          ? elevationPath(single, box, draw)
          : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effective, legs, single, showcase],
  );
  // `racePath` returns the leg bands and `elevationPath` does not, so the union
  // is narrowed once here rather than at each of the four places that draw them.
  const bands: LegBand[] | null =
    drawn && "bands" in drawn ? (drawn as { bands: LegBand[] }).bands : null;

  const gid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onHoverKm) return;
    if (hover == null || !drawn) {
      onHoverKm(null, null);
      return;
    }
    const km = drawn.atKm[hover];
    if (km == null) {
      onHoverKm(null, null);
      return;
    }
    if (effective === "BIKE") {
      onHoverKm(km, "BIKE");
      return;
    }
    const x = drawn.points[hover]?.[0] ?? 0;
    const band = bands?.find((b) => x >= b.fromX && x <= b.toX) ?? null;
    // In race mode the cursor's km is cumulative; a segment lookup wants the
    // distance along its own leg, so subtract everything before it.
    const before = band && bands ? bands.slice(0, bands.indexOf(band)) : [];
    const priorKm = before.reduce(
      (total: number, b: LegBand) => total + (legs[b.leg]?.distance_m ?? 0) / 1000,
      0,
    );
    onHoverKm(km - priorKm, band?.leg ?? null);
  }, [hover, drawn, effective, bands, legs, onHoverKm]);

  if (!drawn) return null;

  const count = drawn.points.length;
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (count < 2) return;
    const r = e.currentTarget.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setHover(Math.round(f * (count - 1)));
  };

  const hoverPoint = hover != null ? drawn.points[hover] : null;
  const hoverKm = hover != null ? drawn.atKm[hover] : null;
  const tone = effective === "BIKE" ? LEG_COLOR.BIKE : "#E4622F";

  return (
    <div
      ref={stageRef}
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
      style={{
        position: "relative",
        background: "#15140F",
        borderRadius: 12,
        marginTop: 14,
        padding: "18px 24px 18px",
        cursor: "crosshair",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {canRace ? (
          <div
            role="tablist"
            aria-label="Elevation view"
            style={{
              display: "inline-flex",
              padding: 3,
              borderRadius: 7,
              background: "rgba(251,248,242,.07)",
            }}
          >
            {(["BIKE", "RACE"] as PanelMode[]).map((m) => {
              const on = effective === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setMode(m)}
                  className="mono"
                  style={{
                    appearance: "none",
                    border: 0,
                    cursor: on ? "default" : "pointer",
                    padding: "6px 14px",
                    borderRadius: 5,
                    fontSize: 9.5,
                    letterSpacing: ".15em",
                    background: on ? "#E4622F" : "transparent",
                    color: on ? "#fff" : "rgba(251,248,242,.5)",
                    transition: "background .18s ease, color .18s ease",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="mono"
            style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}
          >
            {effective} ELEVATION
          </div>
        )}
        <div className="mono" style={{ display: "flex", gap: 16, fontSize: 11, color: "#FBF8F2" }}>
          {hoverKm != null && <span>{hoverKm.toFixed(1)} km</span>}
          {hoverPoint && drawn && (
            <span>
              {Math.round(
                drawn.minH +
                  ((box.bottom - hoverPoint[1]) / (box.bottom - box.top)) *
                    (drawn.maxH - drawn.minH),
              )}{" "}
              m
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
        style={{ display: "block", width: "100%", height: "auto", marginTop: 12 }}
        role="img"
        aria-label={
          effective === "RACE"
            ? `Whole-race elevation profile for ${courseName}`
            : `Bike leg elevation profile for ${courseName}`
        }
      >
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity={0.34} />
            <stop offset="100%" stopColor={tone} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Leg bands, in race mode only: the shape is one curve, but the day
            is three efforts, and the boundaries are where the story changes. */}
        {bands?.map((b, i) =>
          i === 0 ? null : (
            <line
              key={b.leg}
              x1={b.fromX}
              x2={b.fromX}
              y1={6}
              y2={box.bottom}
              stroke="rgba(251,248,242,.16)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
          ),
        )}
        {bands?.map((b) => {
          // Centred on its own band, but kept inside the viewBox. The swim is
          // ~1.7% of a 70.3 and its band starts at x=0, so a centred label
          // hung off the left edge and rendered as "WIM".
          const half = (b.leg.length * 6.4) / 2;
          const centre = (b.fromX + b.toX) / 2;
          const x = Math.min(PANEL_W - half - 2, Math.max(half + 2, centre));
          return (
            <text
              key={`${b.leg}-label`}
              x={x}
              y={PANEL_H - 8}
              textAnchor="middle"
              className="mono"
              style={{ fontSize: 9, letterSpacing: ".14em", fill: "rgba(251,248,242,.38)" }}
            >
              {b.leg}
            </text>
          );
        })}

        <path d={drawn.area} fill={`url(#${gid}-fill)`} />
        <path
          d={drawn.line}
          fill="none"
          stroke={tone}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hoverPoint && (
          <>
            <line
              x1={hoverPoint[0]}
              y1={6}
              x2={hoverPoint[0]}
              y2={box.bottom}
              stroke="rgba(255,255,255,.4)"
              strokeWidth={1}
            />
            <circle
              cx={hoverPoint[0]}
              cy={hoverPoint[1]}
              r={4}
              fill={tone}
              stroke="#15140F"
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#96907F", maxWidth: 620 }}>
          {hoverLabel ?? "Move across the profile to read a segment."}
        </div>
        {attribution}
      </div>
    </div>
  );
}

/** Total climb across whatever legs are present, for the panel's caption. */
export function totalGain(legs: Partial<Record<Leg, ReconElevationLeg>>): number {
  return (["SWIM", "BIKE", "RUN"] as Leg[]).reduce(
    (sum, leg) => sum + (legs[leg]?.gain_m ?? 0),
    0,
  );
}

/** `formatMetres` re-exported so a caller needs one import, not two. */
export { formatMetres };
