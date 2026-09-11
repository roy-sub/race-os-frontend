"use client";

/**
 * A title that scrolls itself only when it does not fit.
 *
 * The course hero sets its name at 92px on one line. "IRONMAN 70.3 Italy
 * Emilia-Romagna" is 34 characters and ran off the right edge of the viewport,
 * so the one thing every visitor needs to read first — which race is this —
 * was the one thing they could not.
 *
 * Three rules, and the first is the one that matters:
 *
 * 1. **It only animates when it overflows.** A short name is a static heading
 *    with no animation, no duplicate copy in the DOM and no moving parts. Most
 *    courses never trigger this at all, and a page that animates its own title
 *    for no reason looks cheap.
 * 2. **Speed is proportional to overdraw**, so a name that overflows by 40px
 *    and one that overflows by 400px travel at the same pixels per second. A
 *    fixed duration would make the long one unreadably fast.
 * 3. **Hovering pauses it**, because the reason someone stops on a scrolling
 *    word is to read it.
 *
 * Overflow is measured after layout and re-measured on resize, since the same
 * name fits at 1600px and does not at 1320px. The global reduced-motion rule
 * in `globals.css` stops the animation outright; the duplicated copy is
 * `aria-hidden` so a screen reader hears the name once.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** Pixels per second. Slow enough to read a long race name comfortably. */
const SPEED = 46;

/** Blank space between the end of one copy and the start of the next. */
const GAP_PX = 96;

export function Marquee({
  text,
  children,
  style,
  className,
}: {
  /** The text, used for measurement and for the accessible copy. */
  text: string;
  /** Render prop for the styled text, so the caller keeps full control of type. */
  children: (content: string) => React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const maskRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLSpanElement | null>(null);
  const [run, setRun] = useState(false);
  const [duration, setDuration] = useState(26);

  const measure = useCallback(() => {
    const mask = maskRef.current;
    const copy = copyRef.current;
    if (!mask || !copy) return;
    // The single copy's width against the space available for it. A couple of
    // pixels of tolerance keeps sub-pixel rounding from starting a marquee on a
    // name that visually fits.
    const overflow = copy.scrollWidth - mask.clientWidth;
    if (overflow > 2) {
      setRun(true);
      setDuration(Math.max(12, (copy.scrollWidth + GAP_PX) / SPEED));
    } else {
      setRun(false);
    }
  }, []);

  useLayoutEffect(measure, [measure, text]);

  useEffect(() => {
    // Fonts land after first paint and change the measurement; re-measure when
    // they do, or a heading measured in the fallback face scrolls when the real
    // face fits (and the other way round).
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(measure).catch(() => {});

    const observer = new ResizeObserver(measure);
    if (maskRef.current) observer.observe(maskRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return (
    <div
      ref={maskRef}
      className={`marquee-mask${className ? ` ${className}` : ""}`}
      style={{ overflow: "hidden", ...style }}
      // The title is one heading whatever the animation does.
      title={run ? text : undefined}
    >
      <div
        className="marquee-track"
        data-run={run || undefined}
        style={run ? ({ "--marquee-duration": `${duration}s` } as React.CSSProperties) : undefined}
      >
        <span ref={copyRef} style={{ paddingRight: run ? GAP_PX : 0 }}>
          {children(text)}
        </span>
        {/* The second copy exists only to make the loop seamless. */}
        {run && (
          <span aria-hidden style={{ paddingRight: GAP_PX }}>
            {children(text)}
          </span>
        )}
      </div>
    </div>
  );
}
