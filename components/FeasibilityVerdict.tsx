"use client";

/**
 * `INFEASIBLE` is a verdict, not an error.
 *
 * The solver ran, it succeeded, and the answer is "not at this goal". Rendering
 * that as a red error toast would be wrong twice over: it tells the athlete
 * something broke when nothing did, and it throws away the levers — the one or
 * two things that would actually change the outcome.
 *
 * The headline is built from `barrier` and `miss_minutes`, which name the
 * **earliest missed** barrier. That is deliberate and load-bearing: told they
 * miss the finish by 132 minutes, an athlete concludes the race is out of
 * reach; told they miss the bike cut-off by 10, they learn the truth. The
 * tightest pair is carried in the payload for the admin blast-radius view and
 * is never used to phrase this.
 */

import type { InfeasibleDetails } from "@/lib/api/errors";
import { formatBarrierName, formatClock } from "@/lib/courseGeo";

/**
 * The solver's lever keys (`raceos.domain.enums.LEVER_KEYS`), phrased.
 *
 * Only four constraints enter the time model, so only four can be offered —
 * perturbing the others returns zero and offering them would be dishonest.
 * `lower_goal` is always available and is the honest "nothing you can change
 * before race day closes this gap".
 */
const LEVER_COPY: Record<string, { title: string; body: string }> = {
  raise_ftp: {
    title: "Raise your bike threshold power",
    body: "The bike is where this plan runs out of time. A higher threshold, tested rather than hoped for, moves the barrier most.",
  },
  improve_run_pace: {
    title: "Improve your run threshold pace",
    body: "A faster run threshold buys time after the bike, where the remaining margin is spent.",
  },
  improve_swim_pace: {
    title: "Improve your swim threshold pace",
    body: "Time saved in the water is time the bike cut-off does not have to find.",
  },
  reduce_weight: {
    title: "Reduce weight",
    body: "Less mass up the climbs is less time on the bike, at the same power.",
  },
  lower_goal: {
    title: "Give the race more time",
    body: "Nothing you can change before race day closes this gap. A later target finish is the honest answer.",
  },
};

export function FeasibilityVerdict({
  details,
  message,
  requestId,
  onAdjustGoal,
}: {
  details: InfeasibleDetails;
  message: string;
  requestId?: string;
  onAdjustGoal?: () => void;
}) {
  return (
    <div
      role="status"
      style={{
        borderRadius: 12,
        padding: "30px 32px",
        background: "rgba(192,57,43,.09)",
        border: "1px solid rgba(192,57,43,.34)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C0392B" }} />
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#C0392B" }}>
          INFEASIBLE AS SET
        </span>
      </div>

      {/* The server's sentence. It already names the earliest missed barrier. */}
      <p style={{ margin: "15px 0 0", maxWidth: 640, fontSize: 30, lineHeight: 1.16, fontWeight: 500, letterSpacing: "-.035em" }}>
        {message}
      </p>
      <p style={{ margin: "12px 0 0", maxWidth: 600, fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>
        The solve completed — this is its answer, not a failure. Held at your ceilings, the plan
        misses the {formatBarrierName(details.barrier).toLowerCase()} by {formatClock(details.miss_minutes)}.
        Nothing has been charged.
      </p>

      {details.levers.length > 0 && (
        <>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578", margin: "26px 0 12px" }}>
            {details.levers.length === 1 ? "ONE LEVER WOULD CHANGE IT" : `${details.levers.length} LEVERS WOULD CHANGE IT`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(details.levers.length, 3)},1fr)`, gap: 12 }}>
            {details.levers.map((lever) => {
              const copy = LEVER_COPY[lever] ?? {
                title: lever.replace(/_/g, " "),
                body: "The solver named this as a lever that would change the outcome.",
              };
              return (
                <div key={lever} style={{ background: "#FBF8F2", borderRadius: 9, padding: "18px 20px", border: "1px solid rgba(21,20,15,.1)" }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.022em" }}>{copy.title}</div>
                  <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "#6B6455" }}>{copy.body}</p>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24 }}>
        {onAdjustGoal && (
          <button
            type="button"
            onClick={onAdjustGoal}
            className="btn-dark-to-accent"
            style={{ height: 46, padding: "0 22px", background: "#15140F", color: "#F1EEE8", border: 0, borderRadius: 7, fontSize: 14.5, fontWeight: 600, cursor: "pointer" }}
          >
            Change the goal
          </button>
        )}
        {requestId && (
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192" }}>
            REQUEST ID · {requestId}
          </span>
        )}
      </div>
    </div>
  );
}
