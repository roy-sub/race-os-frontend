"use client";

/**
 * After the race — this athlete's own files, comparisons and calibrations.
 *
 * One finished race with eight hand-written comparison rows used to be a
 * module constant here, and every account saw the same race. Everything now
 * comes from `GET /post-race/analyses`, which takes no user id.
 *
 * The one thing this screen is careful about is what a calibration *is*. It is
 * a proposal: a constraint the solver thinks the race just proved wrong. It
 * changes nothing until the athlete applies it, and applying it does not touch
 * a plan they have already solved — the numbers someone raced on must not move
 * behind them. Both buttons say so.
 */

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { ApiError } from "@/lib/api/errors";
import { formatLongDate, useMyPlans } from "@/lib/api/account";
import {
  compareColor,
  useAnalyses,
  useCalibrationDecision,
  useCreateAnalysis,
  useUploadRaceFile,
  type Analysis,
} from "@/lib/api/postRace";
import { constraintLabel } from "@/lib/settings";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

function UploadCard() {
  const input = useRef<HTMLInputElement>(null);
  const plans = useMyPlans();
  const upload = useUploadRaceFile();
  const analyse = useCreateAnalysis();
  const [planId, setPlanId] = useState<string>("");
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  /* Only a past race can be analysed: a comparison needs something that
     actually happened on one side of it. Offering an upcoming race here would
     be offering to compare a plan against nothing. */
  const candidates = (plans.data?.past ?? []).filter((card) => card.plan_id);

  async function handle(file: File) {
    setProblem(null);
    setDone(false);
    try {
      const record = await upload.mutateAsync({ file, planId: planId || null });
      const chosen = planId || candidates[0]?.plan_id || null;
      if (!chosen) {
        setProblem(
          "Uploaded. Pick which race this file is from to compare it against that plan.",
        );
        return;
      }
      await analyse.mutateAsync({ race_file_id: record.id, plan_id: chosen });
      setDone(true);
    } catch (error) {
      setProblem(
        error instanceof ApiError
          ? error.message
          : "That file could not be read. Export the activity again from whatever recorded it.",
      );
    }
  }

  const busy = upload.isPending || analyse.isPending;

  return (
    <div style={{ ...CARD, padding: "28px 30px" }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>UPLOAD A RACE FILE</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.028em", marginTop: 12 }}>
        What actually happened, against what was planned.
      </div>
      <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.55, color: "#6B6455" }}>
        A .fit, .gpx or .tcx from your watch or head unit. It is parsed on the way in, so a file we
        cannot read is refused immediately rather than after the analysis.
      </p>

      {candidates.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>WHICH RACE</div>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            style={{ width: "100%", height: 44, marginTop: 10, padding: "0 12px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff", fontSize: 14.5, color: "#15140F" }}
          >
            <option value="">Most recent past race</option>
            {candidates.map((card) => (
              <option key={card.race_id} value={card.plan_id ?? ""}>
                {card.course_name} — {formatLongDate(card.event_date)}
              </option>
            ))}
          </select>
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept=".fit,.gpx,.tcx"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
          e.target.value = "";
        }}
      />
      <span
        onClick={() => !busy && input.current?.click()}
        className="btn-accent"
        style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", marginTop: 20, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: busy ? "progress" : "pointer" }}
      >
        {upload.isPending ? "Uploading…" : analyse.isPending ? "Analysing…" : "Choose a file"}
      </span>

      {problem && (
        <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: 8, background: "rgba(192,57,43,.06)", border: "1px solid rgba(192,57,43,.3)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
          {problem}
        </div>
      )}
      {done && (
        <div style={{ marginTop: 16, padding: "13px 15px", borderRadius: 8, background: "rgba(124,192,143,.1)", border: "1px solid rgba(124,192,143,.4)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
          Analysed. It is at the top of the list.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One analysis
// ---------------------------------------------------------------------------

function AnalysisPanel({ analysis }: { analysis: Analysis }) {
  const decide = useCalibrationDecision();
  const rows = analysis.compare_rows ?? [];
  const calibrations = (analysis.calibrations ?? []).filter((c) => !c.applied && !c.applied_at && !c.dismissed_at);
  const settled = (analysis.calibrations ?? []).filter((c) => c.applied || c.applied_at || c.dismissed_at);
  const actions = analysis.actions ?? [];

  return (
    <>
      <div style={{ ...CARD, padding: "8px 30px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 100px 100px 100px minmax(0,1.2fr)", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
          <span>SEGMENT</span><span>PLANNED</span><span>ACTUAL</span><span>DELTA</span><span>WHY</span>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 14.5, color: "#8C8578" }}>
            This file had nothing comparable in it.
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.ordinal} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) 100px 100px 100px minmax(0,1.2fr)", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
              <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>{row.name}</span>
              <span className="mono" style={{ fontSize: 13.5, color: "#8C8578" }}>{row.planned}</span>
              <span className="mono" style={{ fontSize: 13.5 }}>{row.actual}</span>
              <span className="mono" style={{ fontSize: 13.5, color: compareColor(row.state) }}>{row.delta}</span>
              <span style={{ fontSize: 13, lineHeight: 1.45, color: "#6B6455" }}>{row.why}</span>
            </div>
          ))
        )}
      </div>

      {calibrations.length > 0 && (
        <div style={{ ...CARD, padding: "26px 30px 28px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>PROPOSED CALIBRATIONS</div>
          <p style={{ margin: "10px 0 0", maxWidth: 640, fontSize: 14, lineHeight: 1.55, color: "#6B6455" }}>
            What this race suggests about the numbers your next plan will be solved from. Nothing
            changes until you apply it, and applying it never touches a plan you have already
            solved.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {calibrations.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(255,255,255,.6)", border: "1px solid rgba(21,20,15,.1)" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-.018em" }}>{constraintLabel(c.constraint_key)}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6B6455", marginTop: 6 }}>{c.evidence_text}</div>
                </div>
                <div className="mono" style={{ display: "flex", alignItems: "baseline", gap: 9, fontSize: 15, flex: "none" }}>
                  <span style={{ color: "#A8A192", textDecoration: "line-through" }}>{c.was}</span>
                  <span style={{ color: "#C4BCAC" }}>→</span>
                  <span>{c.now}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flex: "none" }}>
                  <span
                    onClick={() => decide.mutate({ id: c.id, decision: "dismiss" })}
                    className="row-hover-border"
                    style={{ display: "inline-flex", alignItems: "center", height: 38, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Keep mine
                  </span>
                  <span
                    onClick={() => decide.mutate({ id: c.id, decision: "apply" })}
                    className="btn-accent"
                    style={{ display: "inline-flex", alignItems: "center", height: 38, padding: "0 16px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Apply
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settled.length > 0 && (
        <div style={{ ...CARD, padding: "22px 30px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>ALREADY DECIDED</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {settled.map((c) => (
              <span key={c.id} className="mono" style={{ fontSize: 10, letterSpacing: ".1em", padding: "7px 11px", borderRadius: 5, background: "rgba(21,20,15,.05)", color: "#8C8578" }}>
                {constraintLabel(c.constraint_key).toUpperCase()} · {c.applied || c.applied_at ? "APPLIED" : "KEPT"}
              </span>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ background: "#15140F", borderRadius: 12, padding: "28px 30px", marginTop: 14, boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}>
            WHAT WOULD HAVE BOUGHT THE MOST TIME
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
            {actions.map((action) => (
              <div key={action.rank} style={{ display: "flex", gap: 18 }}>
                <span className="mono" style={{ fontSize: 22, letterSpacing: "-.04em", color: "#E4622F", flex: "none", width: 34 }}>
                  {String(action.rank).padStart(2, "0")}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.022em", color: "#FBF8F2" }}>{action.name}</span>
                    <span className="mono" style={{ fontSize: 12, color: "#7CC08F" }}>
                      −{Math.round(action.projected_gain_minutes)} min
                    </span>
                  </div>
                  <p style={{ margin: "7px 0 0", maxWidth: 680, fontSize: 14, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>
                    {action.description}
                  </p>
                  {action.how_to && (
                    <p style={{ margin: "7px 0 0", maxWidth: 680, fontSize: 13, lineHeight: 1.55, color: "rgba(251,248,242,.4)" }}>
                      {action.how_to}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function PostRacePage() {
  const { data, isPending, error, refetch } = useAnalyses();
  const [openId, setOpenId] = useState<string | null>(null);
  const analyses = useMemo(() => data ?? [], [data]);
  const current = analyses.find((a) => a.id === openId) ?? analyses[0];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 500, color: "#5C574B", whiteSpace: "nowrap" }}>
            <Link href={routes.dashboard} style={{ color: "#5C574B" }}>Dashboard</Link>
            <Link href={routes.myPlans} style={{ color: "#5C574B" }}>My plans</Link>
            <Link href={routes.postRace} style={{ color: "#15140F" }}>Review</Link>
            <Link href={routes.settings} style={{ color: "#5C574B" }}>Settings</Link>
          </nav>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578" }}>
            {isPending ? "LOADING" : `${analyses.length} ANALYSED`}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>AFTER THE RACE</div>
        <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Review</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          The race you had, against the race that was planned — segment by segment, with what each
          difference cost.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0,1fr)", gap: 32, marginTop: 32, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 100 }}>
            <UploadCard />
            {analyses.length > 0 && (
              <div style={{ ...CARD, padding: "22px 24px" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>YOUR ANALYSES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 14 }}>
                  {analyses.map((a) => {
                    const on = a.id === current?.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setOpenId(a.id)}
                        className="row-hover-faint"
                        style={{ padding: "12px 13px", borderRadius: 7, cursor: "pointer", background: on ? "rgba(21,20,15,.055)" : "transparent" }}
                      >
                        <div style={{ fontSize: 14, fontWeight: on ? 600 : 500, letterSpacing: "-.015em" }}>
                          Plan v{a.plan_version}
                        </div>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 5 }}>
                          {formatLongDate(a.generated_at).toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            {error ? (
              <ApiErrorState error={error} onRetry={() => void refetch()} />
            ) : isPending ? (
              <div style={{ ...CARD, padding: 30 }}>
                <Skeleton width={280} height={20} />
                <div style={{ marginTop: 18 }}><Skeleton width="100%" height={220} /></div>
              </div>
            ) : !current ? (
              <div style={{ ...CARD, padding: "80px 40px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOTHING ANALYSED YET</div>
                <div style={{ margin: "18px auto 0", maxWidth: 440, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>
                  Upload a race file and this fills in.
                </div>
                <p style={{ margin: "12px auto 0", maxWidth: 430, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
                  You need a past race with a solved plan on one side and the file your watch
                  recorded on the other. Everything here is derived from those two.
                </p>
              </div>
            ) : (
              <AnalysisPanel analysis={current} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuardedPostRacePage() {
  return (
    <GuardedPage>
      <PostRacePage />
    </GuardedPage>
  );
}
