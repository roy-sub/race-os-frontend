"use client";

/**
 * The dashboard — this athlete's season, and nobody else's.
 *
 * What was here before was a prototype: four named races, a week of tasks,
 * five bags and a procedurally generated course, all as module constants. Every
 * account that signed in read the same four races, which is the bug this
 * screen existed to demonstrate.
 *
 * Everything below now comes from `GET /dashboard`, which takes no user id and
 * answers for whoever the access token belongs to, and from
 * `GET /plans/{id}` for the race in view. The course drawn is the real one,
 * through the same renderer the marketing map uses.
 *
 * Three things this screen will not do, all for the same reason — a number
 * nobody solved is worse than no number:
 *
 * - It does not simulate "what if I lose 20 minutes". That is a re-solve, and
 *   a re-solve is the solver's job.
 * - It does not write course notes. There is no source for "headwind in eight
 *   of eleven editions", so there is no such line.
 * - It does not invent a packing checklist. Bags come from a solved plan.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountHeader, type AccountAlert } from "@/components/AccountHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { SurveyedMap } from "@/components/CourseMap";
import { routes, courseReconHref } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import {
  formatLongDate,
  formatTime,
  useDashboard,
  useNotifications,
  type RaceCard,
} from "@/lib/api/account";
import { usePlan, asSolved } from "@/lib/api/plans";
import { feasStyle, fmtClock, planStatusLabel, shortName } from "@/lib/dashboard";
import { formatBarrierName, formatMargin } from "@/lib/courseGeo";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -22px rgba(21,20,15,.2)",
};

// ---------------------------------------------------------------------------
// The empty state — the screen a brand-new account actually sees
// ---------------------------------------------------------------------------

function NoRacesYet() {
  return (
    <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 0" }}>
      <Reveal style={{ ...CARD, padding: "76px 40px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
          NO RACES YET
        </div>
        <h1 style={{ margin: "18px auto 0", maxWidth: 520, fontSize: 40, lineHeight: 1.08, fontWeight: 600, letterSpacing: "-.042em" }}>
          Your season starts with a race.
        </h1>
        <p style={{ margin: "14px auto 0", maxWidth: 460, fontSize: 15.5, lineHeight: 1.6, color: "#6B6455" }}>
          Pick one from the calendar and the builder asks for what it needs — six minutes of
          questions, then pacing, fuelling, bags and every cut-off margin. Nothing appears here
          until you have entered one.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28 }}>
          <Link
            href={routes.races}
            className="btn-accent"
            style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
          >
            Browse the calendar
          </Link>
          <Link
            href={routes.addRace}
            className="btn-outline-dark2"
            style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
          >
            Add a race we don&apos;t have
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The cut-off ladder, from the solved plan's own gates
// ---------------------------------------------------------------------------

function CutoffLadder({ planId }: { planId: string }) {
  const { data, isPending, error } = usePlan(planId);
  const plan = asSolved(data);

  if (error) return null;
  if (isPending) {
    return (
      <div style={{ ...CARD, padding: "26px 30px" }}>
        <Skeleton width={180} height={14} />
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={44} />)}
        </div>
      </div>
    );
  }
  if (!plan || plan.gates.length === 0) return null;

  return (
    <div style={{ ...CARD, padding: "26px 30px 28px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20 }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>CUT-OFF LADDER</div>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A8A192" }}>
          SOLVED V{plan.version}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        {plan.gates.map((gate) => {
          const margin = gate.margin_minutes;
          const colour = margin < 0 ? "#C0392B" : margin < 20 ? "#C98A1F" : "#5C9E72";
          const background = margin < 0 ? "rgba(192,57,43,.07)" : margin < 20 ? "rgba(224,163,60,.09)" : "rgba(124,192,143,.09)";
          const border = margin < 0 ? "rgba(192,57,43,.32)" : margin < 20 ? "rgba(224,163,60,.36)" : "rgba(124,192,143,.36)";
          const used = gate.limit_minutes > 0 ? Math.max(3, Math.min(100, (gate.eta_minutes / gate.limit_minutes) * 100)) : 0;
          return (
            <div key={gate.name} style={{ padding: "14px 16px", borderRadius: 9, background, border: `1px solid ${border}` }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                <span style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>
                  {formatBarrierName(gate.name)}
                </span>
                <span className="mono" style={{ fontSize: 14, color: colour }}>{formatMargin(margin)}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", marginTop: 11, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${used}%`, background: colour, borderRadius: 2 }} />
              </div>
              <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, letterSpacing: ".1em", color: "#8C8578", marginTop: 9 }}>
                <span>YOU {fmtClock(gate.eta_minutes)}</span>
                <span>LIMIT {fmtClock(gate.limit_minutes)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function DashboardPage() {
  const { data, isPending, error, refetch } = useDashboard();
  const notifications = useNotifications({ unread: true, limit: 5 });
  /* Which race the athlete has clicked, if any. Derived rather than
     synchronised: the default is the API's own `next_race`, so the header and
     the switcher cannot disagree about which race is next — that disagreement
     is how a dashboard ends up showing two of them. A selection that no longer
     matches a race (the race was deleted) simply falls through to the
     default. */
  const [picked, setPicked] = useState<string | null>(null);

  const races = useMemo(() => data?.races ?? [], [data]);
  const race: RaceCard | undefined =
    races.find((r) => r.race_id === picked) ?? data?.next_race ?? races[0];

  const alerts: AccountAlert[] = (notifications.data?.data ?? []).map((n) => ({
    title: n.title,
    body: n.body,
    when: (n.tag ?? formatLongDate(n.created_at)).toUpperCase(),
    color: n.severity === "bad" ? "#C0392B" : n.severity === "warn" ? "#E0A33C" : "#8C8578",
  }));

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="dashboard" />
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px" }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </section>
      </div>
    );
  }

  if (isPending) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="dashboard" />
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px", display: "flex", flexDirection: "column", gap: 22 }}>
          <Skeleton width={340} height={18} />
          <Skeleton width={620} height={62} />
          <Skeleton width="100%" height={120} />
          <Skeleton width="100%" height={420} />
        </section>
      </div>
    );
  }

  if (!race) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="dashboard" alerts={alerts} />
        <NoRacesYet />
        <div style={{ marginTop: 88 }}><Footer /></div>
      </div>
    );
  }

  const feas = feasStyle(race.feasibility);
  const solved = race.plan_id != null && race.plan_status !== "draft" && race.plan_status !== "none";
  const counts = data.counts;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="dashboard" alerts={alerts} />

      {/* ---------------- Race switcher ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 60, background: "rgba(241,238,232,.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.09)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, minWidth: 0 }}>
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578", flex: "none" }}>MY RACES</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto" }}>
              {races.map((r) => {
                const on = r.race_id === race.race_id;
                const style = feasStyle(r.feasibility);
                return (
                  <div
                    key={r.race_id}
                    onClick={() => setPicked(r.race_id)}
                    className="row-hover-border"
                    style={{
                      display: "flex", alignItems: "center", gap: 8, height: 32, padding: "0 13px", borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                      background: on ? "#FBF8F2" : "rgba(255,255,255,.42)",
                      border: `1px solid ${on ? "rgba(21,20,15,.22)" : "rgba(21,20,15,.09)"}`,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: style.dot, flex: "none" }} />
                    <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-.01em", color: on ? "#15140F" : "#6B6455" }}>{shortName(r.course_name)}</span>
                    <span className="mono" style={{ fontSize: 9.5, color: on ? "#A8A192" : "#B8B1A2" }}>
                      {r.days_away >= 0 ? `${r.days_away}d` : "raced"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <Link
            href={routes.races}
            className="btn-dark-to-accent"
            style={{ display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", height: 34, padding: "0 15px", background: "#15140F", color: "#F1EEE8", borderRadius: 6, fontSize: 13, fontWeight: 600, flex: "none" }}
          >
            <span className="mono" style={{ fontSize: 13, lineHeight: 1 }}>+</span>New race plan
          </Link>
        </div>
      </div>

      {/* ---------------- Race header ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 56, alignItems: "end" }}>
          <div style={{ minWidth: 0 }}>
            <Reveal style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid ${feas.border}`, borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: feas.fg }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: feas.dot, animation: "breathe 2.6s ease-in-out infinite" }} />
                {planStatusLabel(race)}
              </span>
              {race.bundle_version && (
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>
                  COURSE {race.bundle_version.toUpperCase()}
                </span>
              )}
              {race.is_race_week && (
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#C6461B" }}>RACE WEEK</span>
              )}
            </Reveal>
            <Reveal as="h1" delay={0.05} style={{ margin: 0, fontSize: 68, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>
              {race.course_name}
            </Reveal>
            <Reveal delay={0.1} style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 15.5, color: "#5C574B", flexWrap: "wrap" }}>
              <span>{formatLongDate(race.event_date)}</span>
              <span style={{ color: "#C4BCAC" }}>·</span>
              <span>{race.course_place}</span>
              <span style={{ color: "#C4BCAC" }}>·</span>
              <span>{formatTime(race.start_time_local)} start</span>
            </Reveal>
          </div>
          <Reveal delay={0.14} style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 88, lineHeight: 0.82, letterSpacing: "-.055em" }}>
              {Math.max(0, race.days_away)}
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#8C8578", marginTop: 12 }}>
              {race.days_away < 0 ? "RACED" : race.days_away === 1 ? "DAY OUT" : "DAYS OUT"}
            </div>
          </Reveal>
        </div>

        {solved ? (
          <Reveal style={{ ...CARD, marginTop: 40, padding: "30px 34px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: feas.dot }} />
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: feas.fg }}>{feas.note}</span>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 32, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.035em" }}>
                  {race.projected_label
                    ? `Projected ${race.projected_label}${race.margin_label ? `, ${race.margin_label} on the tightest cut-off.` : "."}`
                    : "Solved."}
                </p>
                {race.readiness_note && (
                  <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>{race.readiness_note}</p>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flex: "none" }}>
                <Link href={`${routes.racePlan}?plan=${race.plan_id}`} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 22px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>
                  View full plan
                </Link>
                <Link href={courseReconHref(race.course_slug)} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 46, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14.5, fontWeight: 600 }}>
                  Course recon
                </Link>
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal style={{ ...CARD, marginTop: 40, padding: "52px 34px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>{planStatusLabel(race)}</div>
            <p style={{ margin: "16px auto 0", maxWidth: 430, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>
              This race has a course but no plan yet.
            </p>
            <p style={{ margin: "12px auto 0", maxWidth: 400, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
              Six minutes of questions and the solver produces pacing, fuelling, bags and every
              cut-off margin.
            </p>
            <Link
              href={race.next_action_href || routes.planBuilder}
              className="btn-dark-to-accent"
              style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 15, fontWeight: 600 }}
            >
              {race.next_action || "Build this plan"}
            </Link>
          </Reveal>
        )}
      </section>

      {/* ---------------- Drift ---------------- */}
      {race.has_pending_drift && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 56px 0" }}>
          <Reveal style={{ position: "relative", background: "#191713", borderRadius: 12, padding: "28px 30px 26px", overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div style={{ position: "absolute", right: -90, top: -120, width: 420, height: 420, background: "radial-gradient(closest-side,rgba(224,163,60,.16),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 44, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C", animation: "breathe 2.6s ease-in-out infinite" }} />
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#E0A33C" }}>
                    PLAN DRIFT · {(race.drift_severity ?? "REVIEW").toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.032em", marginTop: 13, color: "#FBF8F2", maxWidth: 640 }}>
                  {race.drift_summary ?? "Something this plan depends on has moved."}
                </div>
                <p style={{ margin: "9px 0 0", maxWidth: 600, fontSize: 14.5, lineHeight: 1.55, color: "rgba(251,248,242,.55)" }}>
                  Your plan is untouched until you apply this. Open it to see exactly what would
                  change, side by side.
                </p>
              </div>
              <Link
                href={`${routes.racePlan}?plan=${race.plan_id}`}
                className="btn-drift-apply"
                style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 20px", background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13.5, fontWeight: 600, flex: "none" }}
              >
                Review the change
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------------- Season counts ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 56px 0" }}>
        <Reveal style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "rgba(21,20,15,.1)", borderRadius: 12, overflow: "hidden" }}>
          {[
            { k: "UPCOMING", v: counts.upcoming },
            { k: "NOT SOLVED", v: counts.unsolved },
            { k: "NEEDS REVIEW", v: counts.needs_review },
            { k: "UNREAD", v: counts.unread_notifications },
          ].map((stat) => (
            <div key={stat.k} style={{ background: "#FBF8F2", padding: "20px 24px" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>{stat.k}</div>
              <div className="mono" style={{ fontSize: 28, letterSpacing: "-.04em", marginTop: 10 }}>{stat.v}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------------- The course ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 56px 0" }}>
        <Reveal>
          <SurveyedMap
            courseRef={race.course_slug}
            courseName={race.course_name}
            height="min(68vh,720px)"
            onUnlock={
              <Link
                href={race.next_action_href || routes.planBuilder}
                className="btn-accent"
                style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
              >
                {race.next_action || "Build this plan"}
              </Link>
            }
          />
        </Reveal>
      </section>

      {/* ---------------- Cut-offs and readiness ---------------- */}
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "16px 56px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: 14, alignItems: "start" }}>
          {race.plan_id && solved ? <CutoffLadder planId={race.plan_id} /> : <div />}

          <div style={{ ...CARD, padding: "26px 30px 28px" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#8C8578" }}>RACE READINESS</div>
            {race.readiness_fraction == null ? (
              <p style={{ margin: "18px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                Readiness is tracked once a plan is solved — it counts the things the plan asks you
                to do before the start.
              </p>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 16 }}>
                  <span className="mono" style={{ fontSize: 40, letterSpacing: "-.045em" }}>
                    {Math.round(race.readiness_fraction * 100)}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "#8C8578" }}>%</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(21,20,15,.09)", marginTop: 16, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round(race.readiness_fraction * 100)}%`, background: "#5C9E72", borderRadius: 3 }} />
                </div>
                {race.readiness_note && (
                  <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 14 }}>{race.readiness_note}</div>
                )}
              </>
            )}

            {race.goal_label && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(21,20,15,.1)", borderRadius: 9, overflow: "hidden", marginTop: 24 }}>
                <div style={{ background: "#FBF8F2", padding: "14px 16px" }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "#A8A192" }}>GOAL</div>
                  <div className="mono" style={{ fontSize: 18, letterSpacing: "-.03em", marginTop: 8 }}>{race.goal_label}</div>
                </div>
                <div style={{ background: "#FBF8F2", padding: "14px 16px" }}>
                  <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "#A8A192" }}>PROJECTED</div>
                  <div className="mono" style={{ fontSize: 18, letterSpacing: "-.03em", marginTop: 8 }}>{race.projected_label ?? "—"}</div>
                </div>
              </div>
            )}

            <Link
              href={routes.myPlans}
              className="mono link-accent"
              style={{ display: "inline-block", fontSize: 9.5, letterSpacing: ".13em", color: "#C6461B", marginTop: 22 }}
            >
              ALL MY PLANS →
            </Link>
          </div>
        </div>
      </section>

      <div style={{ marginTop: 88 }}>
        <Footer />
      </div>
    </div>
  );
}

export default function GuardedDashboardPage() {
  return (
    <GuardedPage>
      <DashboardPage />
    </GuardedPage>
  );
}
