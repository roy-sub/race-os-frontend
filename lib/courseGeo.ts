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
  options: { smooth?: boolean; points?: number; radius?: number } = {},
): ElevationDrawing | null {
  const { s_km, h_m } = profile.display;
  if (!s_km?.length || !h_m?.length || s_km.length !== h_m.length) return null;
  return seriesPath(s_km, h_m, box, options);
}

/** What a drawn profile hands back: two paths, the height band, and the samples. */
export type ElevationDrawing = {
  line: string;
  area: string;
  minH: number;
  maxH: number;
  /** The drawn samples, so a caller can place markers on the same curve. */
  points: [number, number][];
  /** Distance in km at each drawn sample, parallel to `points`. */
  atKm: number[];
};

/**
 * The shared drawing routine, over any distance/height pair.
 *
 * Separate from `elevationPath` so the whole-race profile — three legs
 * concatenated onto one axis — draws through exactly the same code as a single
 * leg, rather than through a second implementation that could drift from it.
 *
 * The vertical scale is taken from the series itself rather than from zero,
 * because a 2,238 m bike profile and a 275 m run profile drawn on a shared axis
 * would render the run as a flat line.
 */
export function seriesPath(
  s_km: number[],
  h_m: number[],
  box: { width: number; top: number; bottom: number },
  {
    smooth = true,
    points,
    radius = 3,
  }: { smooth?: boolean; points?: number; radius?: number } = {},
): ElevationDrawing | null {
  if (!s_km.length || s_km.length !== h_m.length) return null;

  // Roughly one sample per 18px of drawn width, so each cubic spans enough
  // pixels to read as a curve rather than as a facet. Clamped so a tiny
  // sparkline keeps its shape and a wide panel does not pay for detail nobody
  // can see.
  const target = points ?? Math.max(26, Math.min(90, Math.round(box.width / 18)));

  /*
   * Low-pass **before** decimating, not after.
   *
   * This used to thin first and blur second, on the reasoning that blurring at
   * full density and then thinning would put the noise back at the surviving
   * samples. That reasoning is exactly wrong, and it was the last real source
   * of roughness in these charts.
   *
   * `resample` point-samples: it interpolates at evenly-spaced targets and
   * discards everything between them. Taking 240 terrain samples down to ~40
   * that way, with no filter first, is textbook aliasing — energy above the new
   * Nyquist limit folds *down* into the low frequencies and reappears as slow,
   * broad wobble. Once that has happened it is indistinguishable from real
   * shape, so no amount of blurring afterwards can take it out again; the
   * post-blur was smoothing a signal that already had the artefact baked in.
   *
   * So: filter at source resolution with a kernel wide enough to cover the
   * decimation window (the anti-aliasing filter), then decimate, then one light
   * pass to polish the joins. Same three lines, correct order.
   */
  let dists = s_km;
  let heights = h_m;
  if (smooth) {
    const count = Math.min(target, s_km.length);
    const decimation = Math.max(1, s_km.length / count);
    // Kernel scaled to the decimation factor: a radius of D spans 2D+1 source
    // samples, so every source point contributes to the sample that replaces
    // it and nothing above the new Nyquist limit survives to fold down.
    const antiAliased = smoothSeries(h_m, Math.max(1, Math.round(decimation)));
    const thinned = resample(s_km, antiAliased, count);
    dists = thinned.s;
    // A short second pass, purely cosmetic: it evens out the decimated series
    // so the spline through it has no local kinks to honour.
    heights = smoothSeries(thinned.h, radius);
  }

  const first = dists[0] ?? 0;
  const maxS = (dists[dists.length - 1] ?? 1) - first || 1;

  let minH = Infinity;
  let maxH = -Infinity;
  for (const v of heights) {
    if (v < minH) minH = v;
    if (v > maxH) maxH = v;
  }
  // A dead-flat leg (the swim) would divide by zero; give it a nominal band so
  // it draws as the straight line it is.
  const spanH = maxH - minH || 1;

  /*
   * Plot into a slightly inset band rather than the full box.
   *
   * A C2 spline overshoots a little at a peak — that is the price of curvature
   * continuity, and on a pre-blurred series it is only a few percent. Without
   * headroom those control points hit the edge of the box and get clamped, and
   * a clamp is a curvature break: measured on the live chart it fired exactly
   * twice, at the highest peak and the lowest valley, which is precisely where
   * the shoulder was visible under magnification.
   *
   * Giving the curve room to overshoot inside the panel means the guard below
   * never fires, so the line stays C2 from end to end.
   */
  const headroom = (box.bottom - box.top) * 0.08;
  const plotTop = box.top + headroom;
  const plotBottom = box.bottom - headroom;

  const pts: [number, number][] = heights.map((height, i) => [
    ((dists[i] - first) / maxS) * box.width,
    plotBottom - ((height - minH) / spanH) * (plotBottom - plotTop),
  ]);

  const line = smooth
    ? smoothPath(pts, { bounds: [box.top, box.bottom] })
    : pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");

  return {
    line,
    area: `${line} L ${box.width.toFixed(1)} ${box.bottom} L 0 ${box.bottom} Z`,
    minH,
    maxH,
    points: pts,
    atKm: dists,
  };
}

/**
 * Three legs on one axis: the whole race, start line to finish.
 *
 * Distance is cumulative, so the bike picks up where the swim ended and the run
 * where the bike did. Height is **not** renormalised per leg — the point of the
 * whole-race view is that the legs are finally comparable, and rescaling each
 * one would destroy exactly that.
 *
 * Returns the x offset where each leg begins, so the chart can band and label
 * them without recomputing the same arithmetic a second way.
 */
export function racePath(
  legs: Partial<Record<Leg, ReconElevationLeg>>,
  box: { width: number; top: number; bottom: number },
  options: { smooth?: boolean; points?: number; radius?: number } = {},
): (ElevationDrawing & { bands: { leg: Leg; fromX: number; toX: number }[] }) | null {
  const ordered = (["SWIM", "BIKE", "RUN"] as Leg[])
    .map((leg) => ({ leg, profile: legs[leg] }))
    .filter((row): row is { leg: Leg; profile: ReconElevationLeg } => Boolean(row.profile));
  if (!ordered.length) return null;

  const s: number[] = [];
  const h: number[] = [];
  const spans: { leg: Leg; fromKm: number; toKm: number }[] = [];
  let offset = 0;

  for (const { leg, profile } of ordered) {
    const ls = profile.display.s_km ?? [];
    const lh = profile.display.h_m ?? [];
    if (!ls.length || ls.length !== lh.length) continue;
    const fromKm = offset;
    for (let i = 0; i < ls.length; i++) {
      s.push(offset + ls[i]);
      h.push(lh[i]);
    }
    offset += ls[ls.length - 1] || profile.distance_m / 1000;
    spans.push({ leg, fromKm, toKm: offset });
  }
  if (s.length < 2) return null;

  const drawing = seriesPath(s, h, box, options);
  if (!drawing) return null;

  const total = offset || 1;
  return {
    ...drawing,
    bands: spans.map((span) => ({
      leg: span.leg,
      fromX: (span.fromKm / total) * box.width,
      toX: (span.toKm / total) * box.width,
    })),
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

// ---------------------------------------------------------------------------
// Smooth curves
// ---------------------------------------------------------------------------

/**
 * A **C2-continuous, approximating** cubic path — a clamped uniform B-spline.
 *
 * The chart began as an `L`-segment polyline through every sample, which at
 * ~240 points across 800px put a vertex every three pixels and read as a
 * heart-rate trace. Getting from there to a line that actually looks smooth
 * took four corrections, and each one looked finished until it was magnified:
 *
 * 1. **Halved Catmull-Rom tangents** kept the control points near their
 *    anchors, so each segment was nearly straight and the polygon showed
 *    through as faceting.
 * 2. **Clamping control points into each segment's span** stopped overshoot but
 *    broke the tangent match at every peak — arrive flat, leave with a corner.
 * 3. **Plain Catmull-Rom** is C1: tangents match, so no corners, but curvature
 *    still jumps at each anchor and reads as a shoulder — the line descends,
 *    briefly flattens, descends again.
 * 4. **A natural cubic spline** is C2, which removes the shoulders. It is also
 *    an *interpolating* spline: it is forced through every control point, so
 *    any small variation left in the series becomes a wiggle the curve is
 *    obliged to honour. Smoothing the input harder barely helped, because the
 *    oscillation was coming from the interpolation constraint rather than from
 *    the data.
 *
 * A uniform cubic B-spline drops that constraint. It is C2 like the natural
 * spline, but it *approximates* its control polygon instead of passing through
 * it — by the convex-hull property the curve cannot deviate further than the
 * polygon itself, so it physically cannot oscillate between points. That is the
 * quality the bell curves in a statistics textbook have, and it is what this
 * draws now.
 *
 * The ends are clamped (first and last control points tripled) so the line
 * still starts and finishes exactly on the data rather than floating short of
 * it. Each span converts to one Bézier by the standard uniform-B-spline
 * formulas, so the output is still an ordinary SVG path.
 */
export function smoothPath(
  points: [number, number][],
  { bounds }: { bounds?: [number, number] } = {},
): string {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0][0].toFixed(3)} ${points[0][1].toFixed(3)}`;
  if (n === 2) {
    return (
      `M${points[0][0].toFixed(3)} ${points[0][1].toFixed(3)} ` +
      `L${points[1][0].toFixed(3)} ${points[1][1].toFixed(3)}`
    );
  }

  // Clamp the ends by repeating them twice more, which pins the curve to the
  // first and last samples without affecting anything in between.
  const c: [number, number][] = [points[0], points[0], ...points, points[n - 1], points[n - 1]];

  const hold = (value: number) =>
    bounds ? Math.min(bounds[1], Math.max(bounds[0], value)) : value;

  // Uniform cubic B-spline span -> Bézier:
  //   b0 = (P0 + 4·P1 + P2) / 6      b1 = (2·P1 + P2) / 3
  //   b3 = (P1 + 4·P2 + P3) / 6      b2 = (P1 + 2·P2) / 3
  // With the ends tripled, the first span's b0 evaluates to exactly `points[0]`
  // — (P + 4P + P) / 6 — so the curve starts on the data rather than short of
  // it. The same holds for the final b3 and the last point.
  const out = [`M${points[0][0].toFixed(3)} ${points[0][1].toFixed(3)}`];

  for (let i = 1; i + 2 < c.length; i++) {
    const p1 = c[i];
    const p2 = c[i + 1];
    const p3 = c[i + 2];

    const b1x = (2 * p1[0] + p2[0]) / 3;
    const b1y = hold((2 * p1[1] + p2[1]) / 3);
    const b2x = (p1[0] + 2 * p2[0]) / 3;
    const b2y = hold((p1[1] + 2 * p2[1]) / 3);
    const b3x = (p1[0] + 4 * p2[0] + p3[0]) / 6;
    const b3y = hold((p1[1] + 4 * p2[1] + p3[1]) / 6);

    // Three decimals: at 800 viewBox units across a chart this wide, rounding
    // to 0.1 quantises the tangents enough to show as faint facets, and even
    // 0.01 is measurable in the second derivative.
    out.push(
      `C${b1x.toFixed(3)} ${b1y.toFixed(3)} ${b2x.toFixed(3)} ${b2y.toFixed(3)} ` +
        `${b3x.toFixed(3)} ${b3y.toFixed(3)}`,
    );
  }
  return out.join(" ");
}

/**
 * A Gaussian blur along a series, with the ends held.
 *
 * `radius` is in samples. Reflecting at the boundary rather than clamping keeps
 * the first and last few points from being dragged toward the interior, which
 * is what makes a naively-smoothed profile appear to start mid-climb.
 */
export function smoothSeries(values: number[], radius: number): number[] {
  if (radius < 1 || values.length < 3) return values;
  const sigma = radius / 2;
  const weights: number[] = [];
  for (let i = -radius; i <= radius; i++) weights.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const total = weights.reduce((a, b) => a + b, 0);

  return values.map((_, i) => {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) {
      let j = i + k;
      // Reflect at both ends.
      if (j < 0) j = -j;
      if (j >= values.length) j = 2 * (values.length - 1) - j;
      sum += values[Math.max(0, Math.min(values.length - 1, j))] * weights[k + radius];
    }
    return sum / total;
  });
}

/**
 * Resample a series to `count` evenly-spaced points by linear interpolation.
 *
 * Drawing 240 Bézier segments to fill 800 pixels is wasted work and reintroduces
 * the very jitter the smoothing removed. Sixty to eighty points is where a
 * terrain profile stops gaining shape and starts gaining noise.
 */
export function resample(s: number[], h: number[], count: number): { s: number[]; h: number[] } {
  if (s.length < 2 || count < 2) return { s, h };
  const first = s[0];
  const last = s[s.length - 1];
  const span = last - first || 1;
  const outS: number[] = [];
  const outH: number[] = [];
  let j = 0;
  for (let i = 0; i < count; i++) {
    const target = first + (span * i) / (count - 1);
    while (j < s.length - 2 && s[j + 1] < target) j++;
    const t = s[j + 1] === s[j] ? 0 : (target - s[j]) / (s[j + 1] - s[j]);
    outS.push(target);
    outH.push(h[j] + (h[j + 1] - h[j]) * Math.max(0, Math.min(1, t)));
  }
  return { s: outS, h: outH };
}
