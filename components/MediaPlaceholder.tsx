import type { CSSProperties, ReactNode } from "react";

type MediaPlaceholderProps = {
  path: string;
  background: string;
  className?: string;
  style?: CSSProperties;
  /** Show the asset path as an on-image label, as the design handoff does. */
  showLabel?: boolean;
  labelStyle?: CSSProperties;
  children?: ReactNode;
};

/**
 * Stand-in for real photography/video. Every slot carries the exact path
 * listed in project/MEDIA-ASSETS.md as a visible label, so dropping a real
 * file at `/public/assets/...` and swapping this for an <img>/<video> is a
 * mechanical, easy-to-audit follow-up once media is commissioned.
 */
export function MediaPlaceholder({
  path,
  background,
  className,
  style,
  showLabel = false,
  labelStyle,
  children,
}: MediaPlaceholderProps) {
  return (
    <div
      data-media={path}
      className={className}
      style={{ position: "relative", background, ...style }}
    >
      {showLabel && (
        <div
          className="mono"
          style={{
            position: "absolute",
            left: 16,
            bottom: 14,
            right: 16,
            fontSize: 9,
            letterSpacing: ".12em",
            color: "rgba(255,255,255,.5)",
            ...labelStyle,
          }}
        >
          {path}
        </div>
      )}
      {children}
    </div>
  );
}
