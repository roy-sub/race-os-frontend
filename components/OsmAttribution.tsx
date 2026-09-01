"use client";

/**
 * The OpenStreetMap credit.
 *
 * ODbL 1.0 requires attribution **wherever the derived data is displayed** —
 * the map, the elevation chart, the course page and the plan page — which is
 * why the backend ships `attribution` alongside the geometry rather than
 * beside it in a document somewhere. Rendering it is not decoration; it is the
 * licence condition, so this component exists to make it hard to forget.
 *
 * It renders nothing when the API sent nothing, so a bundle without attribution
 * is visibly missing it rather than silently credited.
 */

export function OsmAttribution({
  attribution,
  tone = "light",
  style,
}: {
  attribution: string | null | undefined;
  tone?: "light" | "dark";
  style?: React.CSSProperties;
}) {
  if (!attribution) return null;

  return (
    <div
      className="mono"
      style={{
        fontSize: 9.5,
        lineHeight: 1.5,
        letterSpacing: ".08em",
        color: tone === "dark" ? "#7C7669" : "#A8A192",
        ...style,
      }}
    >
      {attribution}
    </div>
  );
}
