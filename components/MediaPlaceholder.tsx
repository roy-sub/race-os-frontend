"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

type MediaPlaceholderProps = {
  path: string;
  background: string;
  className?: string;
  style?: CSSProperties;
  /** Show the asset path as an on-image label, as the design handoff does. */
  showLabel?: boolean;
  labelStyle?: CSSProperties;
  /** Alternative text. Defaults to "" because every slot here is decorative
   *  photography behind its own copy — announcing it would add noise, not
   *  meaning. Pass a string on any slot that ever carries information. */
  alt?: string;
  children?: ReactNode;
};

/**
 * A media slot that shows the real file when there is one, and the design's
 * gradient when there is not.
 *
 * This began as a pure stand-in: it painted a coloured box and printed the
 * intended path on top, so the layout could be built before any photography
 * existed. Now that `/public/assets` is populated it loads the file — but it
 * keeps the gradient underneath, so a slot whose asset has not been shot yet,
 * or whose file is missing on a given deploy, looks exactly as it did before
 * rather than showing a broken-image icon.
 *
 * **Format-agnostic on purpose.** The paths in the code were written against a
 * `.jpg` handoff and the delivered assets are `.png`; the next batch may well
 * be `.webp`. Rather than make every call site a liability whenever that
 * changes, the declared extension is only the *first* thing tried — if it is
 * not there, the other web formats are tried in turn before giving up. So the
 * same code works whether a slot is served as png, jpg, webp or avif, and
 * swapping a file's format later needs no code change at all.
 */

/** Tried in order after whatever the call site declared. */
const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "avif"] as const;
const VIDEO_EXTS = ["mp4", "webm"] as const;

function candidates(path: string): { kind: "image" | "video"; srcs: string[] } {
  // No path at all is a real answer — a course whose photography has not been
  // shot yet. Without this the extension fallback would ask for "/.png",
  // "/.jpg" and the rest, five 404s to render a gradient.
  if (!path || !path.trim()) return { kind: "image", srcs: [] };

  // Root-absolute, always. A bare "assets/…" would resolve against the current
  // route — on /how-it-works/ that asks for /how-it-works/assets/… and 404s.
  const clean = path.replace(/^\/+/, "");
  const dot = clean.lastIndexOf(".");
  const base = dot === -1 ? clean : clean.slice(0, dot);
  const ext = dot === -1 ? "" : clean.slice(dot + 1).toLowerCase();

  const video = (VIDEO_EXTS as readonly string[]).includes(ext);
  const pool = video ? VIDEO_EXTS : IMAGE_EXTS;
  const ordered = [ext, ...pool.filter((e) => e !== ext)].filter(Boolean);

  return { kind: video ? "video" : "image", srcs: ordered.map((e) => `/${base}.${e}`) };
}

/** The `type` hint on a <source>, so the browser can skip what it cannot play. */
const MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
};

function mimeFor(src: string): string | undefined {
  return MIME[src.slice(src.lastIndexOf(".") + 1).toLowerCase()];
}

export function MediaPlaceholder({
  path,
  background,
  className,
  style,
  showLabel = false,
  labelStyle,
  alt = "",
  children,
}: MediaPlaceholderProps) {
  const { kind, srcs } = candidates(path);
  /** Which candidate is being tried. Past the end means none of them exist. */
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = srcs[attempt];

  const cover: CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  return (
    <div
      data-media={path}
      className={className}
      style={{ position: "relative", overflow: "hidden", background, ...style }}
    >
      {kind === "video" ? (
        /* One <source> per candidate rather than a src plus an onError chain.
           The browser walks the list itself and the `type` hints let it skip a
           codec it cannot decode *without downloading it* — which is the whole
           game when the alternatives are a 25 MB mp4 and a 5.7 MB webm.

           It also fixes a real bug. A media element that fails can fire its
           error before React has attached `onError` — the element is created
           with the src already on it — so the chain silently stopped at the
           first candidate and the fallback never ran. Sources have no such
           race: the fallback is the browser's, not ours. */
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedData={() => setLoaded(true)}
          style={cover}
        >
          {srcs.map((s) => (
            <source key={s} src={s} type={mimeFor(s)} />
          ))}
        </video>
      ) : (
        src && (
          /* `next/image` buys nothing here: the export is static and the
             optimiser is off (`images.unoptimized`), and a plain <img> is what
             lets the format fallback work through onError. <picture> would not
             do it — it falls back on an unsupported *type*, never on a 404. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            // Catches the same race as above: if the image already failed
            // before React wired `onError` up, `complete` is true while
            // `naturalWidth` is still 0, and the next candidate is tried.
            ref={(el) => {
              if (el && el.complete && el.naturalWidth === 0) {
                setAttempt((i) => (i === attempt ? i + 1 : i));
              }
            }}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setAttempt((i) => i + 1)}
            style={cover}
          />
        )
      )}

      {/* The handoff label is for an empty slot. Once a real file is on screen
          it would just be a path printed over somebody's photograph. */}
      {showLabel && !loaded && (
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
