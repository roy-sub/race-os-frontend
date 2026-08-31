/**
 * Turning real course geometry into things a browser can draw.
 *
 * Everything here is projection and formatting — no data is invented, and where
 * a number cannot be derived honestly from what the API sent, the function
 * returns null rather than a plausible figure.
 *
 * The coordinates arriving from `/courses/{ref}/recon` are GeoJSON order,
 * **longitude first**: `[lng, lat, elevation]`.
 */

import type { Leg, ReconElevationLeg, ReconLeg } from "./api/courses";

export type Box = { width: number; height: number };

/**
 * Project every leg through one shared transform.
 *
 * One transform for all legs is the point: the swim, bike and run of a triathlon
 * share a start and a finish, and projecting each to its own bounding box would
 * scatter them across the canvas as three unrelated shapes.
 *
 * The projection is equirectangular with the standard cosine correction — at the
 * scale of one race course the difference from a conformal projection is far
 * below a pixel, and it keeps the maths readable.
 */
export function projectLegs(
  legs: ReconLeg[],
  box: Box,
  padding = 16,
): { paths: { leg: Leg; d: string }[]; project: (lng: number, lat: number) => [number, number] } | null {
  const points = legs.flatMap((l) => l.coordinates);
  if (points.length < 2) return null;

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const [lng, lat] of points) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  // A degree of longitude is shorter than a degree of latitude everywhere but
  // the equator. Without this the course comes out stretched east-west.
  const midLatRad = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const lngScale = Math.cos(midLatRad);

  const spanX = Math.max((maxLng - minLng) * lngScale, 1e-9);
  const spanY = Math.max(maxLat - minLat, 1e-9);

  const usableW = box.width - padding * 2;
  const usableH = box.height - padding * 2;
  // One scale for both axes, so the course keeps its real shape.
  const scale = Math.min(usableW / spanX, usableH / spanY);

  const offsetX = padding + (usableW - spanX * scale) / 2;
  const offsetY = padding + (usableH - spanY * scale) / 2;

  const project = (lng: number, lat: number): [number, number] => [
    offsetX + (lng - minLng) * lngScale * scale,
    // SVG y grows downward; north should be up.
    offsetY + (maxLat - lat) * scale,
  ];

  const paths = legs
    .filter((l) => l.coordinates.length >= 2)
    .map((l) => ({
      leg: l.leg,
      d: l.coordinates
        .map(([lng, lat], i) => {
          const [x, y] = project(lng, lat);
          return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" "),
    }));

  return { paths, project };
}

/**
 * The elevation chart, from the bundle's own display series.
 *
 * `s_km` is distance along the leg and `h_m` is height, both real. The vertical
 * scale is taken from the series itself rather than from zero, because a 2,238 m
 * bike profile and a 275 m run profile drawn on a shared axis would render the
 * run as a flat line.
 */
export function elevationPath(
  profile: ReconElevationLeg,
  box: { width: number; top: number; bottom: number },
): { line: string; area: string; minH: number; maxH: number } | null {
  const { s_km: s, h_m: h } = profile.display;
  if (!s?.length || !h?.length || s.length !== h.length) return null;

  const maxS = s[s.length - 1] || 1;
  let minH = Infinity, maxH = -Infinity;
  for (const v of h) {
    if (v < minH) minH = v;
    if (v > maxH) maxH = v;
  }
  // A dead-flat leg (the swim) would divide by zero; give it a nominal band so
  // it draws as the straight line it is.
  const spanH = maxH - minH || 1;

  const line = s
    .map((sk, i) => {
      const x = (sk / maxS) * box.width;
      const y = box.bottom - ((h[i] - minH) / spanH) * (box.bottom - box.top);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return {
    line,
    area: `${line} L ${box.width.toFixed(1)} ${box.bottom} L 0 ${box.bottom} Z`,
    minH,
    maxH,
  };
}

/** `[minutes] -> "10:30"`. Negative renders with a leading minus. */
export function formatClock(minutes: number): string {
  const sign = minutes < 0 ? "-" : "";
  const m = Math.abs(Math.round(minutes));
  return `${sign}${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
}

/** `[minutes] -> "+1:08"`, for a cut-off margin where the sign carries meaning. */
export function formatMargin(minutes: number): string {
  return (minutes >= 0 ? "+" : "") + formatClock(minutes);
}

export function formatKm(metres: number, decimals = 1): string {
  return (metres / 1000).toFixed(decimals);
}

/** `2238 -> "2,238"`. */
export function formatMetres(m: number): string {
  return Math.round(m).toLocaleString("en-GB");
}

/**
 * Aid-station contents arrive as tokens: `["water", "sports_drink"]`.
 *
 * They become prose, and nothing is added. A station listing only water says
 * only water.
 */
export function formatContents(tokens: string[]): string {
  if (!tokens?.length) return "Contents not published";
  const words = tokens.map((t) => t.replace(/_/g, " ").trim()).filter(Boolean);
  if (!words.length) return "Contents not published";
  const first = words[0];
  return [first.charAt(0).toUpperCase() + first.slice(1), ...words.slice(1)].join(", ");
}

/**
 * A barrier's key is a slug: `bike_cutoff`, `swim_exit`, `bike_km_120`.
 *
 * These are the published names, so they are tidied rather than rewritten —
 * `bike_km_120` becomes "Bike km 120", never "The valley drag".
 */
export function formatBarrierName(name: string): string {
  const words = name.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const LEG_COLOR: Record<Leg, string> = {
  SWIM: "#2E6F8E",
  BIKE: "#C6461B",
  RUN: "#7A6A2E",
};

/** Order legs the way a triathlon is raced, whatever order the API sent. */
export const LEG_ORDER: Record<Leg, number> = { SWIM: 0, BIKE: 1, RUN: 2 };

export function sortLegs<T extends { leg: Leg }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => LEG_ORDER[a.leg] - LEG_ORDER[b.leg]);
}

/**
 * The widest gap between consecutive aid stations on one leg, in km.
 *
 * Derived from the stations themselves — it is the question "how long am I
 * carrying my own fluid for?" and it is answerable from real data, so it stays.
 * Fewer than two stations on the leg means there is no gap to report.
 */
export function widestGapKm(stations: { leg: Leg; km: number }[], leg: Leg): number | null {
  const kms = stations.filter((s) => s.leg === leg).map((s) => s.km).sort((a, b) => a - b);
  if (kms.length < 2) return null;
  let widest = 0;
  for (let i = 1; i < kms.length; i++) widest = Math.max(widest, kms[i] - kms[i - 1]);
  return widest;
}
