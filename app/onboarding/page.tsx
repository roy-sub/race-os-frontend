"use client";

/**
 * The first screen after signing up.
 *
 * It used to be a four-step wizard over four invented races, four invented
 * threshold values and three toggles for device integrations that do not
 * exist — which made a brand-new account's very first impression a page of
 * things that were not true.
 *
 * What is left is what the product can actually act on today: how experienced
 * the athlete is, and which units they read. Both are real columns, both are
 * written by `PATCH /auth/me`, and both genuinely change what a plan says — the
 * level moves how much explanation a plan carries and how conservative its
 * margins are.
 *
 * Constraints are deliberately **not** asked for here. The plan builder asks
 * for the ones a specific race needs, at the point it needs them, and estimates
 * the rest with the estimate marked. Asking for eight numbers up front from
 * someone who has not chosen a race yet is how an onboarding loses people who
 * would have finished.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mark } from "@/components/Mark";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { client, unwrap } from "@/lib/api/client";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/errors";

type Level = "first" | "improver" | "experienced";

const LEVELS: { k: Level; kicker: string; name: string; desc: string; changes: string }[] = [
  {
    k: "first",
    kicker: "MOST OF OUR ATHLETES",
    name: "First timer",
    desc: "Never finished this distance. You want to finish, and you want to know you will.",
    changes: "More explanation, conservative pacing, beginner bag items, expanded cut-off guidance.",
  },
  {
    k: "improver",
    kicker: "SECOND OR THIRD",
    name: "Improver",
    desc: "You have finished before and want to do it faster and more cleanly.",
    changes: "Balanced margins, segment-level pacing, post-race calibration emphasised.",
  },
  {
    k: "experienced",
    kicker: "DATA-LED",
    name: "Experienced",
    desc: "You know your numbers and want the solver to respect them, not re-derive them.",
    changes: "Fewer explanations, your own tested values honoured, thinner margins available.",
  },
];

function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [level, setLevel] = useState<Level>(user?.level ?? "first");
  const [units, setUnits] = useState<"metric" | "imperial">(user?.units ?? "metric");
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      unwrap(client.PATCH("/api/v1/auth/me", { body })),
    onSuccess: async () => {
      await refresh();
      router.push(routes.races);
    },
    onError: (error) =>
      setProblem(
        error instanceof ApiError ? error.message : "That could not be saved. Try again.",
      ),
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ background: "rgba(241,238,232,.94)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={26} height={17} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <Link href={routes.races} className="mono link-accent" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#8C8578" }}>
            SKIP FOR NOW →
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "64px 48px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
          TWO QUESTIONS
        </div>
        <h1 style={{ margin: "16px 0 0", fontSize: 52, lineHeight: 0.98, fontWeight: 600, letterSpacing: "-.048em" }}>
          Welcome{user?.name?.trim() ? `, ${user.name.trim().split(" ")[0]}` : ""}.
        </h1>
        <p style={{ margin: "15px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.55, color: "#5C574B" }}>
          These two change what a plan says, so they are worth thirty seconds. Everything else — your
          thresholds, your sweat rate, your gut ceiling — the plan builder asks for when a specific
          race actually needs it, and estimates what you leave blank with the estimate marked.
        </p>

        <div style={{ marginTop: 44 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>
            WHERE ARE YOU WITH THIS DISTANCE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
            {LEVELS.map((option) => {
              const on = level === option.k;
              return (
                <div
                  key={option.k}
                  onClick={() => setLevel(option.k)}
                  className="row-hover-border"
                  style={{
                    padding: "22px 24px 24px", borderRadius: 12, cursor: "pointer",
                    background: on ? "#15140F" : "#FBF8F2",
                    border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`,
                  }}
                >
                  <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: on ? "rgba(251,248,242,.45)" : "#A8A192" }}>
                    {option.kicker}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em", marginTop: 12, color: on ? "#FBF8F2" : "#15140F" }}>
                    {option.name}
                  </div>
                  <p style={{ margin: "9px 0 0", fontSize: 13.5, lineHeight: 1.5, color: on ? "rgba(251,248,242,.6)" : "#6B6455" }}>
                    {option.desc}
                  </p>
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${on ? "rgba(251,248,242,.14)" : "rgba(21,20,15,.08)"}` }}>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: on ? "rgba(251,248,242,.4)" : "#A8A192" }}>
                      WHAT THIS CHANGES
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 12.5, lineHeight: 1.5, color: on ? "rgba(251,248,242,.55)" : "#8C8578" }}>
                      {option.changes}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 36 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>UNITS</div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, maxWidth: 360 }}>
            {(["metric", "imperial"] as const).map((option) => {
              const on = units === option;
              return (
                <div
                  key={option}
                  onClick={() => setUnits(option)}
                  className="seg-btn"
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 48,
                    borderRadius: 8, cursor: "pointer",
                    background: on ? "#15140F" : "#FBF8F2",
                    border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.14)"}`,
                    fontSize: 15, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B",
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </div>
              );
            })}
          </div>
        </div>

        {problem && (
          <div style={{ marginTop: 24, padding: "13px 15px", borderRadius: 8, background: "rgba(192,57,43,.06)", border: "1px solid rgba(192,57,43,.3)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
            {problem}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40 }}>
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => {
              setProblem(null);
              save.mutate({ level, units });
            }}
            className="btn-accent"
            style={{ display: "inline-flex", alignItems: "center", height: 52, padding: "0 28px", background: "#E4622F", color: "#fff", border: 0, borderRadius: 8, fontSize: 15.5, fontWeight: 600, cursor: save.isPending ? "progress" : "pointer" }}
          >
            {save.isPending ? "Saving…" : "Save and pick a race"}
          </button>
          <span style={{ fontSize: 13.5, color: "#8C8578" }}>
            Both are changeable at any time in Settings.
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GuardedOnboardingPage() {
  return (
    <GuardedPage>
      <OnboardingPage />
    </GuardedPage>
  );
}
