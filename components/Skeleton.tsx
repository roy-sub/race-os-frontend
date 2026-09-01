"use client";

/**
 * Loading placeholders sized to the content that replaces them.
 *
 * The point is that nothing moves when the data lands, so a skeleton takes the
 * *final* width — and for numbers, the final digit count — rather than a generic
 * grey bar. `SHIMMER` is the gradient the rest of the product already uses.
 */

import { SHIMMER } from "@/lib/systemStates";

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 3,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width,
        height,
        borderRadius: radius,
        background: SHIMMER,
        backgroundSize: "420px 100%",
        animation: "raceos-shimmer 1.25s linear infinite",
        ...style,
      }}
    />
  );
}

/**
 * A number-shaped skeleton.
 *
 * `digits` is the width of the value that will replace it, in monospace `ch`
 * units, so a three-digit wattage does not reflow the row when it arrives.
 */
export function SkeletonNumber({ digits = 3, height = 20 }: { digits?: number; height?: number }) {
  return <Skeleton width={`${digits}ch`} height={height} />;
}

/** A block of body text: several lines, the last one short, as real prose is. */
export function SkeletonText({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? "62%" : "100%"} height={12} />
      ))}
    </span>
  );
}
