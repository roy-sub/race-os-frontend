"use client";

/**
 * The locked-data treatment.
 *
 * Before this, a locked course rendered its withheld sections as *empty* ones:
 * three elevation cards reading "SEA LEVEL — no relief to render" over a 90 km
 * bike leg with 387 m of climb, a "SUPPLY MAP — 0 aid stations" headline, and a
 * cut-off slider whose bounds collapsed to 27–66 minutes because it derived
 * them from a barrier list that had been redacted to `[]`.
 *
 * Every one of those is a false statement about the course, not a paywall. A
 * visitor cannot tell "we are not showing you this" from "there is nothing
 * here", and the second reading is the one that makes a product look broken and
 * costs the sale.
 *
 * So: locked data is drawn as locked. The shape of the section is preserved —
 * the same grid, the same headings, the same height, so nothing reflows when an
 * athlete unlocks it — and the values are replaced with a blurred stand-in and
 * a single, plain sentence about what is behind it. One call to action per
 * section at most; a page that asks eight times is a page that is begging.
 */

import Link from "next/link";
import type { ReactNode } from "react";

const LOCK_PATH =
  "M5 8V6a3 3 0 1 1 6 0v2h.5A1.5 1.5 0 0 1 13 9.5v4A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-4A1.5 1.5 0 0 1 4.5 8H5Zm1.4 0h3.2V6a1.6 1.6 0 0 0-3.2 0v2Z";

export function LockIcon({ size = 13, tone = "#8C8578" }: { size?: number; tone?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden style={{ flex: "none" }}>
      <path d={LOCK_PATH} fill={tone} />
    </svg>
  );
}

/**
 * A small inline badge for a section heading.
 *
 * Used where the section still has *something* true to show and only part of it
 * is withheld — the heading says which, and the section keeps its own shape.
 */
export function LockedBadge({ label = "WITH A PLAN" }: { label?: string }) {
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 9px",
        borderRadius: 4,
        background: "rgba(21,20,15,.06)",
        border: "1px solid rgba(21,20,15,.09)",
        fontSize: 8.5,
        letterSpacing: ".14em",
        color: "#6B6455",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      <LockIcon size={10} tone="#6B6455" />
      {label}
    </span>
  );
}

/**
 * A section whose content is withheld, wrapped around a blurred stand-in.
 *
 * `preview` is rendered behind the message, blurred and dimmed, purely so the
 * panel has the texture of the thing it is standing in for. It must never be
 * the real data at low fidelity: that either gives away what is being sold or
 * misrepresents it, and both are worse than an honest abstraction.
 */
export function LockedPanel({
  title,
  body,
  action,
  preview,
  minHeight = 260,
  dark = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  preview?: ReactNode;
  minHeight?: number;
  /**
   * Match the panel this one is standing in for.
   *
   * The wide elevation chart is dark, so its locked stand-in is too — a cream
   * panel in the slot where a black one belongs reads as a section that failed
   * to load rather than one that is deliberately closed.
   */
  dark?: boolean;
}) {
  const ink = dark ? "#FBF8F2" : "#15140F";
  const muted = dark ? "rgba(251,248,242,.62)" : "#6B6455";
  return (
    <div
      style={{
        position: "relative",
        minHeight,
        borderRadius: dark ? 12 : 10,
        overflow: "hidden",
        background: dark ? "#15140F" : "#FBF8F2",
        border: dark ? "1px solid rgba(251,248,242,.09)" : "1px solid rgba(21,20,15,.12)",
      }}
    >
      {preview && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            filter: "blur(7px) saturate(.6)",
            opacity: 0.4,
            pointerEvents: "none",
          }}
        >
          {preview}
        </div>
      )}
      {/* A wash over the preview so the copy always has its contrast, whatever
          the stand-in underneath happens to be. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: dark
            ? "radial-gradient(120% 90% at 50% 45%, rgba(21,20,15,.92) 30%, rgba(21,20,15,.72) 100%)"
            : "radial-gradient(120% 90% at 50% 45%, rgba(251,248,242,.94) 30%, rgba(251,248,242,.72) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          height: "100%",
          minHeight,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "44px 40px",
        }}
      >
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 12px",
            borderRadius: 5,
            background: dark ? "rgba(251,248,242,.08)" : "#15140F",
            fontSize: 9,
            letterSpacing: ".16em",
            color: dark ? "rgba(251,248,242,.78)" : "rgba(251,248,242,.9)",
          }}
        >
          <LockIcon size={10} tone="#E4622F" />
          OPENS WITH A RACE PLAN
        </span>
        <div
          style={{
            marginTop: 18,
            fontSize: 26,
            lineHeight: 1.18,
            fontWeight: 600,
            letterSpacing: "-.034em",
            maxWidth: 460,
            color: ink,
          }}
        >
          {title}
        </div>
        <p
          style={{
            margin: "12px 0 0",
            maxWidth: 440,
            fontSize: 14.5,
            lineHeight: 1.55,
            color: muted,
          }}
        >
          {body}
        </p>
        {action && <div style={{ marginTop: 24 }}>{action}</div>}
      </div>
    </div>
  );
}

/** The standard unlock button, so every locked section offers the same door. */
export function UnlockAction({ href, label = "Build my race plan" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="btn-accent"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 46,
        padding: "0 24px",
        background: "#E4622F",
        color: "#fff",
        borderRadius: 7,
        fontSize: 15,
        fontWeight: 600,
      }}
    >
      {label}
    </Link>
  );
}

/**
 * A single withheld figure, sized like the number it replaces.
 *
 * Used in stat rows where printing `0` would be read as a measurement. "0 aid
 * stations" is a claim about the course; a lock is a claim about the account.
 */
export function LockedFigure({ label, width = 46 }: { label: string; width?: number }) {
  return (
    <div>
      <div
        aria-hidden
        style={{
          width,
          height: 22,
          borderRadius: 4,
          background:
            "repeating-linear-gradient(115deg, rgba(21,20,15,.10) 0 6px, rgba(21,20,15,.05) 6px 12px)",
        }}
      />
      <div
        className="mono"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 9,
          letterSpacing: ".14em",
          color: "#A8A192",
          marginTop: 8,
        }}
      >
        <LockIcon size={9} tone="#A8A192" />
        {label}
      </div>
    </div>
  );
}
