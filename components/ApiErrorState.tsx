"use client";

/**
 * The generic failure surface.
 *
 * One component so that every screen says the same true things in the same
 * order: what happened, what became of the user's work, the request id, and one
 * action. The specific sentence comes from the server's `message`; the frame
 * around it comes from `errorCopy`.
 *
 * `INFEASIBLE` deliberately does not belong here — it is a verdict with its own
 * component. Passing one in renders the fallback copy rather than pretending it
 * is a fault, but the plan builder should never take that path.
 */

import { ApiError } from "@/lib/api/errors";
import { errorCopy } from "@/lib/errorCopy";

const STATE_STYLE = {
  bad: { dot: "#C0392B", fg: "#A03227", bg: "rgba(192,57,43,.06)", border: "rgba(192,57,43,.28)" },
  warn: { dot: "#E0A33C", fg: "#A0701A", bg: "rgba(224,163,60,.08)", border: "rgba(224,163,60,.32)" },
  info: { dot: "#4F7C93", fg: "#3D6478", bg: "rgba(79,124,147,.07)", border: "rgba(79,124,147,.28)" },
} as const;

export function ApiErrorState({
  error,
  onRetry,
  compact = false,
}: {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const apiError = error instanceof ApiError ? error : null;
  const copy = errorCopy(apiError?.code ?? "INTERNAL_ERROR");
  const style = STATE_STYLE[copy.state];
  // The server's message is written for this exact failure; the table's title is
  // only the fallback for a body that arrived without one.
  const title = apiError?.message || copy.title;

  return (
    <div
      role="alert"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 4,
        padding: compact ? "14px 16px" : "22px 24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: "50%", background: style.dot }}
        />
        <span
          style={{
            font: "500 10px/1 var(--mono, ui-monospace)",
            letterSpacing: ".14em",
            color: style.fg,
          }}
        >
          {copy.tag}
        </span>
      </div>

      <p style={{ margin: "0 0 8px", fontSize: compact ? 15 : 18, fontWeight: 600, lineHeight: 1.3 }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "rgba(21,20,15,.66)" }}>
        {copy.body}
      </p>

      {apiError?.requestId ? (
        <p
          style={{
            margin: "12px 0 0",
            font: "400 11px/1.4 var(--mono, ui-monospace)",
            color: "rgba(21,20,15,.45)",
          }}
        >
          REQUEST ID · <span style={{ userSelect: "all" }}>{apiError.requestId}</span>
        </p>
      ) : null}

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 16,
            padding: "9px 16px",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            color: copy.state === "bad" ? "#F1EEE8" : "#15140F",
            background: copy.state === "bad" ? "#15140F" : "transparent",
            border: `1px solid ${copy.state === "bad" ? "#15140F" : "rgba(21,20,15,.2)"}`,
            borderRadius: 3,
          }}
        >
          {copy.cta}
        </button>
      ) : null}
    </div>
  );
}
