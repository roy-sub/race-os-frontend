"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mark } from "@/components/Mark";
import { ApiErrorState } from "@/components/ApiErrorState";
import { FeasibilityVerdict } from "@/components/FeasibilityVerdict";
import { Paywall, gateFromEntitlement, gateFromPaymentRequired } from "@/components/Paywall";
import { OsmAttribution } from "@/components/OsmAttribution";
import { Skeleton } from "@/components/Skeleton";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { routes } from "@/lib/routes";
import { ApiError } from "@/lib/api/errors";
import { useCourses, useRecon, type Course } from "@/lib/api/courses";
import { useEntitlements, usePrices, findEntitlement } from "@/lib/api/billing";
import {
  CONSTRAINT_KEYS, CONSTRAINT_LABELS, CONSTRAINT_UNITS, ESTIMATORS,
  SOURCE_LABELS, SOURCE_STYLE,
  useAuthorizeCheckout, useConstraints, useCreatePlan, useCreateRace,
  useEstimateConstraint, usePlan, useSaveDraft, useSolvePlan, useWriteConstraint,
  asSolved,
  type ConstraintKey, type RiskLevel, type SolvedPlan,
} from "@/lib/api/plans";
import { elevationPath, formatClock, formatKm, formatMargin } from "@/lib/courseGeo";

const STEP_NAMES = ["Race", "Fitness", "Goal", "Feasibility", "Fuelling", "Bags", "Race card"];

const cardStyle: React.CSSProperties = {
  background: "#FBF8F2", borderRadius: 12, padding: "24px 26px",
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};
const inputBoxStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 11, height: 46, padding: "0 14px",
  border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff",
};
const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: ".15em", color: "#8C8578",
};

/** The clock the athlete will actually read, from the plan's own start time. */
function wallClockFrom(startTimeLocal: string | null | undefined, elapsedMinutes: number): string {
  if (!startTimeLocal) return "—";
  const [h, m] = startTimeLocal.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  const total = (h * 60 + m + elapsedMinutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(Math.round(total % 60)).padStart(2, "0")}`;
}

/** Today plus a margin, so the date field never defaults into the past. */
function defaultEventDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 42);
  return d.toISOString().slice(0, 10);
}

function BuilderScreen() {
  const router = useRouter();
  const params = useSearchParams();

  // --- step 1 state: the race -----------------------------------------------
  const courses = useCourses();
  const [courseSlug, setCourseSlug] = useState<string | null>(params.get("course"));
  const [eventDate, setEventDate] = useState(defaultEventDate);
  const [startTime, setStartTime] = useState("06:40");
  const [bib, setBib] = useState("");
  const [courseQuery, setCourseQuery] = useState("");

  const selectedCourse: Course | undefined = courses.data?.data.find((c) => c.slug === courseSlug);
  const recon = useRecon(courseSlug);

  // --- plan identity --------------------------------------------------------
  const [raceId, setRaceId] = useState<string | null>(params.get("race"));
  const [planId, setPlanId] = useState<string | null>(params.get("plan"));

  const createRace = useCreateRace();
  const createPlan = useCreatePlan();
  const saveDraft = useSaveDraft(planId);
  const solve = useSolvePlan(planId);
  const authorize = useAuthorizeCheckout();
  const plan = usePlan(planId);

  // --- step 2 state: constraints -------------------------------------------
  const constraints = useConstraints();
  const writeConstraint = useWriteConstraint();
  const estimate = useEstimateConstraint();
  const constraintRows = constraints.data;
  const byKey = useMemo(() => {
    const map = new Map<string, NonNullable<typeof constraintRows>[number]>();
    for (const row of constraintRows ?? []) map.set(row.key, row);
    return map;
  }, [constraintRows]);

  // --- step 3 state: the goal ----------------------------------------------
  const [goalMinutes, setGoalMinutes] = useState<number | null>(null);
  const [risk, setRisk] = useState<RiskLevel>("balanced");
  const [nightFlag, setNightFlag] = useState(false);

  // --- step 5 state: the carb override -------------------------------------
  const [carbOverride, setCarbOverride] = useState<number | null>(null);

  const [step, setStep] = useState(1);
  const [error, setError] = useState<ApiError | null>(null);
  const [editingConstraint, setEditingConstraint] = useState<ConstraintKey | null>(null);
  const [estimatorFor, setEstimatorFor] = useState<ConstraintKey | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});

  const solved: SolvedPlan | null = asSolved(plan.data);
  const entitlements = useEntitlements(raceId, Boolean(raceId));
  const prices = usePrices();
  const solveEntitlement = findEntitlement(entitlements.data, "solve_plan");
  const gate = gateFromEntitlement(solveEntitlement);

  const paymentGate = error?.code === "PAYMENT_REQUIRED"
    ? gateFromPaymentRequired(error.paymentRequired, error.message)
    : null;
  const infeasible = error?.infeasible ?? null;

  // The barriers this course actually publishes, for the goal slider's bounds.
  const finishLimit = useMemo(() => {
    const limits = recon.data?.barriers.map((b) => b.limit_minutes_from_start) ?? [];
    return limits.length ? Math.max(...limits) : 960;
  }, [recon.data]);

  /**
   * The goal, defaulted from the course's own finish limit.
   *
   * Derived rather than written into state from an effect: the slider only
   * needs a value to show, and seeding state would fight the athlete if the
   * course changed under it.
   */
  const effectiveGoal = goalMinutes ?? Math.round(finishLimit * 0.78);

  /** Keep the URL carrying the ids, so a reload resumes rather than restarts. */
  useEffect(() => {
    if (!planId && !raceId) return;
    const next = new URLSearchParams();
    if (courseSlug) next.set("course", courseSlug);
    if (raceId) next.set("race", raceId);
    if (planId) next.set("plan", planId);
    router.replace(`${routes.planBuilder}?${next.toString()}`, { scroll: false });
  }, [courseSlug, raceId, planId, router]);

  const busy =
    createRace.isPending || createPlan.isPending || saveDraft.isPending ||
    solve.isPending || authorize.isPending;

  /**
   * Step 1 → 2. A plan is solved for a race, so the race is created first and
   * the plan hung off it. Re-posting the same course and date returns the
   * existing race, so going back and forward does not create duplicates.
   */
  const startPlan = async () => {
    if (!courseSlug || busy) return;
    setError(null);
    try {
      const race = await createRace.mutateAsync({
        course_ref: courseSlug,
        event_date: eventDate,
        start_time_local: startTime,
        bib: bib.trim() || null,
      });
      setRaceId(race.id);
      // The race already knows whether a plan exists for it, so an interrupted
      // builder resumes its own plan instead of starting a second one.
      const id = race.plan_id ?? (await createPlan.mutateAsync(race.id)).id;
      setPlanId(id);
      setStep(2);
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught);
      else throw caught;
    }
  };

  const saveGoalAndSolve = async () => {
    if (!planId || busy) return;
    setError(null);
    try {
      await saveDraft.mutateAsync({
        goal_minutes: effectiveGoal,
        risk,
        night_flag: nightFlag,
      });
      setStep(4);
      await runSolve();
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught);
      else throw caught;
    }
  };

  /**
   * Solve — and stop at the paywall rather than through it.
   *
   * Entitlements are re-read first, and a gated action renders the paywall
   * instead of quietly placing a hold. Authorizing money is the athlete's act,
   * not a side effect of pressing "solve": `buyThenSolve` below is the only
   * path that calls checkout, and it runs from an explicit click.
   *
   * A 402 from the solve itself is caught for the same reason — it carries
   * `required_tiers` and `purchasable_per_race` in `details`, so the paywall it
   * renders offers the right upgrade rather than a generic wall.
   */
  const runSolve = async (opts: { carbOverride?: number | null; force?: boolean } = {}) => {
    if (!planId) return;
    setError(null);
    try {
      const rows = await entitlements.refetch();
      const current = findEntitlement(rows.data, "solve_plan");
      if (current && !current.allowed) return; // the paywall renders from `gate`
      await solve.mutateAsync({
        carb_override: opts.carbOverride ?? null,
        force: opts.force ?? false,
      });
      await plan.refetch();
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught);
      else throw caught;
    } finally {
      await entitlements.refetch();
    }
  };

  /**
   * The only place a hold is placed, and only from a click on the paywall.
   *
   * Two-phase: authorize puts a hold on the card, the solve captures it, and a
   * solve that fails or comes back infeasible voids it instead. Nothing is
   * charged for a plan that did not arrive.
   */
  const buyThenSolve = async () => {
    if (!planId) return;
    setError(null);
    try {
      await authorize.mutateAsync({ planId });
      await solve.mutateAsync({ carb_override: carbOverride, force: false });
      await plan.refetch();
    } catch (caught) {
      if (caught instanceof ApiError) setError(caught);
      else throw caught;
    } finally {
      // The purchase happened even if the solve came back infeasible, so the
      // entitlement table has moved on either way and the paywall must not
      // linger over the verdict.
      await entitlements.refetch();
    }
  };

  const canReach = (n: number) => n <= step || (n <= 4 && Boolean(planId)) || (n > 4 && Boolean(solved));

  const filteredCourses = (courses.data?.data ?? []).filter((c) =>
    courseQuery.trim() ? `${c.name} ${c.place}`.toLowerCase().includes(courseQuery.trim().toLowerCase()) : true,
  );

  // --- the right-hand panel -------------------------------------------------
  const panelSplits = solved?.splits ?? [];
  const panelGates = solved?.gates ?? [];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 48px", height: 66, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
          <Link href={routes.dashboard} style={{ display: "flex", alignItems: "center", gap: 11, flex: "none" }}>
            <Mark width={26} height={17} />
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", flex: 1, justifyContent: "center" }}>
            {STEP_NAMES.map((name, i) => {
              const n = i + 1;
              const done = n < step;
              const cur = n === step;
              const reachable = canReach(n);
              return (
                <div key={name} onClick={() => reachable && setStep(n)} style={{ display: "flex", alignItems: "center", cursor: reachable ? "pointer" : "not-allowed" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 12px" }}>
                    <span className="mono" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: "50%", flex: "none", background: cur ? "#E4622F" : done ? "#15140F" : "transparent", border: `1px solid ${cur ? "#E4622F" : done ? "#15140F" : "rgba(21,20,15,.24)"}`, fontSize: 9.5, color: cur || done ? "#FBF8F2" : "#A8A192" }}>
                      {done ? "✓" : n}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: cur ? 600 : 500, letterSpacing: "-.012em", color: cur ? "#15140F" : done ? "#5C574B" : "#A8A192", whiteSpace: "nowrap" }}>{name}</span>
                  </div>
                  {n < 7 && <span style={{ width: 18, height: 1, background: done ? "rgba(21,20,15,.3)" : "rgba(21,20,15,.14)", flex: "none" }} />}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
            {/* Real save state — the draft is a PATCH, not a timer. */}
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>
              {saveDraft.isPending ? "SAVING…" : planId ? "DRAFT SAVED" : "NOT STARTED"}
            </span>
            <Link href={routes.dashboard} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 36, padding: "0 15px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
              Save and exit
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "44px 48px 96px", display: "grid", gridTemplateColumns: "minmax(0,1fr) 356px", gap: 40, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}>
          {/* An error that is not a verdict and not the paywall renders here. */}
          {error && !infeasible && !paymentGate && (
            <div style={{ marginBottom: 24 }}>
              <ApiErrorState error={error} onRetry={() => setError(null)} />
            </div>
          )}

          {/* ---------------- Step 1: Race ---------------- */}
          {step === 1 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 1 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Which race?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                Pick the course and tell us when you are racing it. You inherit its real route,
                cut-offs and aid stations.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, marginTop: 34 }}>
                <div style={cardStyle}>
                  <div style={labelStyle}>COURSE</div>
                  <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flex: "none" }}><circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth={1.5} /><path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth={1.5} strokeLinecap="round" /></svg>
                    <input
                      type="text"
                      value={courseQuery}
                      onChange={(e) => setCourseQuery(e.target.value)}
                      placeholder={courses.data ? `Search ${courses.data.meta.total} ${courses.data.meta.total === 1 ? "course" : "courses"}` : "Loading courses…"}
                      style={{ flex: 1, border: 0, background: "transparent", fontSize: 15.5, color: "#15140F", padding: 0, outline: "none" }}
                    />
                    {selectedCourse && <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "3px 7px", borderRadius: 3, background: "rgba(124,192,143,.18)", color: "#3E7B55", whiteSpace: "nowrap" }}>SELECTED</span>}
                  </div>

                  <div style={{ marginTop: 8, border: "1px solid rgba(21,20,15,.12)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    {courses.isPending && [0, 1, 2].map((i) => (
                      <div key={i} style={{ padding: "13px 15px", borderBottom: "1px solid rgba(21,20,15,.07)" }}><Skeleton width="70%" height={15} /></div>
                    ))}
                    {courses.error && <div style={{ padding: 14 }}><ApiErrorState error={courses.error} onRetry={() => void courses.refetch()} compact /></div>}
                    {filteredCourses.map((c) => {
                      const on = c.slug === courseSlug;
                      return (
                        <div
                          key={c.id}
                          onClick={() => { setCourseSlug(c.slug); setCourseQuery(""); }}
                          className="result-row"
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", borderBottom: "1px solid rgba(21,20,15,.07)", cursor: "pointer", background: on ? "rgba(228,98,47,.07)" : undefined }}
                        >
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: on ? "#E4622F" : "#C4BCAC", flex: "none" }} />
                          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{c.name}</span>
                          <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{c.distance_type}</span>
                          {/* Provenance as returned; no course claims OFFICIAL. */}
                          <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192", whiteSpace: "nowrap" }}>{c.provenance ?? "UNVERIFIED"}</span>
                        </div>
                      );
                    })}
                    {!courses.isPending && filteredCourses.length === 0 && (
                      <div style={{ padding: "18px 15px", fontSize: 14, color: "#8C8578" }}>
                        Nothing matches that. <Link href={routes.races} style={{ color: "#C6461B" }}>Browse the directory</Link>.
                      </div>
                    )}
                  </div>

                  <div style={{ ...labelStyle, marginTop: 26 }}>RACE DATE</div>
                  <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
                    <div>
                      <div style={labelStyle}>START TIME</div>
                      <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }} />
                      </div>
                    </div>
                    <div>
                      <div style={labelStyle}>BIB · OPTIONAL</div>
                      <div style={{ ...inputBoxStyle, marginTop: 12 }}>
                        <input type="text" value={bib} onChange={(e) => setBib(e.target.value)} placeholder="1421" style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Course preview: the real elevation profile of the selected course. */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={labelStyle}>COURSE PREVIEW</span>
                      {selectedCourse && (
                        <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 8.5, letterSpacing: ".13em", color: "#A0701A" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#E0A33C" }} />{selectedCourse.provenance ?? "UNVERIFIED"}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const bike = recon.data?.elevation_profile?.legs?.BIKE;
                      const chart = bike ? elevationPath(bike, { width: 420, top: 10, bottom: 84 }) : null;
                      if (!courseSlug) return <div style={{ marginTop: 16, fontSize: 14, color: "#8C8578" }}>Pick a course and its real profile appears here.</div>;
                      if (recon.isPending) return <Skeleton width="100%" height={92} style={{ marginTop: 16 }} />;
                      if (!chart) return <div style={{ marginTop: 16, fontSize: 14, color: "#8C8578" }}>No bike profile in this bundle.</div>;
                      return (
                        <svg viewBox="0 0 420 92" style={{ display: "block", width: "100%", marginTop: 16 }} role="img" aria-label="Bike elevation profile">
                          <path d={chart.area} fill="rgba(228,98,47,.13)" />
                          <path d={chart.line} fill="none" stroke="#E4622F" strokeWidth={1.6} strokeLinejoin="round" />
                          <line x1={0} y1={86} x2={420} y2={86} stroke="rgba(21,20,15,.14)" strokeWidth={1} />
                        </svg>
                      );
                    })()}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                      {(["SWIM", "BIKE", "RUN"] as const).map((leg) => {
                        const row = recon.data?.legs.find((l) => l.leg === leg);
                        return (
                          <div key={leg}>
                            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{leg}</div>
                            <div className="mono" style={{ fontSize: 16, marginTop: 6 }}>
                              {row ? `${formatKm(row.distance_m)} km` : recon.isPending && courseSlug ? <Skeleton width="6ch" height={16} /> : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <OsmAttribution attribution={recon.data?.bundle.attribution} style={{ marginTop: 14 }} />
                  </div>

                  {/* The forecast comes with the solved plan, not before it. */}
                  <div style={cardStyle}>
                    <div style={labelStyle}>CUT-OFFS ON THIS COURSE</div>
                    {recon.data ? (
                      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                        {recon.data.barriers.map((b) => (
                          <div key={b.name} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 14, color: "#3D3A31" }}>{b.name.replace(/_/g, " ")}</span>
                            <span className="mono" style={{ fontSize: 14 }}>{formatClock(b.limit_minutes_from_start)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 14, fontSize: 14, color: "#8C8578" }}>
                        {courseSlug ? "Loading the bundle…" : "Pick a course to see its barriers."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <StepFooter
                onNext={startPlan}
                nextLabel={busy ? "Starting…" : "Start this plan"}
                nextDisabled={!courseSlug || busy}
              />
            </div>
          )}

          {/* ---------------- Step 2: Fitness ---------------- */}
          {step === 2 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 2 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What can you hold?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                Every field takes a number you already trust, or two plain questions. Nothing is
                required, and nothing is gated behind connecting an account.
              </p>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "8px 28px 24px", marginTop: 34, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div className="mono" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.1fr 150px", gap: 18, padding: "20px 0 12px", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
                  <span>METRIC</span><span>VALUE</span><span>SOURCE</span><span style={{ textAlign: "right" }}>IF YOU DO NOT KNOW</span>
                </div>

                {/* All eight. The prototype showed six — sodium_loss and
                    caffeine_tolerance were missing entirely. */}
                {CONSTRAINT_KEYS.map((key) => {
                  const row = byKey.get(key);
                  const source = row?.source;
                  const style = source ? SOURCE_STYLE[source] : { bg: "rgba(21,20,15,.05)", fg: "#A8A192" };
                  const hasEstimator = Boolean(ESTIMATORS[key]);
                  return (
                    <div key={key}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.1fr 150px", gap: 18, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: row ? "#E4622F" : "#C4BCAC", flex: "none" }} />
                          <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{CONSTRAINT_LABELS[key]}</span>
                          {row?.stale && <span className="mono" style={{ fontSize: 8, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3, background: "rgba(224,163,60,.18)", color: "#A0701A" }}>STALE</span>}
                        </span>
                        <span
                          onClick={() => { setEditingConstraint(key); setManualValue(row ? String(row.value) : ""); setEstimatorFor(null); }}
                          style={{ display: "flex", alignItems: "baseline", gap: 5, cursor: "pointer" }}
                        >
                          {constraints.isPending ? (
                            <Skeleton width="4ch" height={18} />
                          ) : (
                            <>
                              <span className="mono" style={{ fontSize: 18, letterSpacing: "-.02em", color: row ? "#15140F" : "#C4BCAC" }}>{row ? row.value : "—"}</span>
                              <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{row?.unit ?? CONSTRAINT_UNITS[key]}</span>
                            </>
                          )}
                        </span>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "4px 8px", borderRadius: 4, justifySelf: "start", whiteSpace: "nowrap", background: style.bg, color: style.fg }}>
                          {source ? SOURCE_LABELS[source] : "NOT SET"}
                        </span>
                        <span style={{ textAlign: "right", display: "flex", gap: 14, justifyContent: "flex-end" }}>
                          <span
                            onClick={() => { setEditingConstraint(key); setManualValue(row ? String(row.value) : ""); setEstimatorFor(null); }}
                            className="mono link-accent"
                            style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578", cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            ENTER →
                          </span>
                          {hasEstimator && (
                            <span
                              onClick={() => { setEstimatorFor(key); setEditingConstraint(null); setAnswers({}); }}
                              className="mono link-accent"
                              style={{ fontSize: 9, letterSpacing: ".12em", color: "#C6461B", cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              ESTIMATE IT →
                            </span>
                          )}
                        </span>
                      </div>

                      {editingConstraint === key && (
                        <ManualEntry
                          unit={row?.unit ?? CONSTRAINT_UNITS[key]}
                          value={manualValue}
                          onChange={setManualValue}
                          busy={writeConstraint.isPending}
                          onCancel={() => setEditingConstraint(null)}
                          onSave={async () => {
                            const value = Number(manualValue);
                            if (!Number.isFinite(value)) return;
                            setError(null);
                            try {
                              // `manual` — a number the athlete already trusts.
                              // `measured` comes only from post-race calibration.
                              await writeConstraint.mutateAsync({ key, value, source: "manual" });
                              setEditingConstraint(null);
                            } catch (caught) {
                              if (caught instanceof ApiError) setError(caught);
                              else throw caught;
                            }
                          }}
                        />
                      )}

                      {estimatorFor === key && (
                        <Estimator
                          fields={ESTIMATORS[key] ?? []}
                          answers={answers}
                          onChange={setAnswers}
                          busy={estimate.isPending}
                          onCancel={() => setEstimatorFor(null)}
                          onSubmit={async () => {
                            setError(null);
                            const payload: Record<string, unknown> = {};
                            for (const f of ESTIMATORS[key] ?? []) {
                              const raw = answers[f.name];
                              payload[f.name] = f.type === "boolean" ? Boolean(raw) : Number(raw);
                            }
                            try {
                              await estimate.mutateAsync({ key, answers: payload });
                              setEstimatorFor(null);
                            } catch (caught) {
                              if (caught instanceof ApiError) setError(caught);
                              else throw caught;
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, borderRadius: 12, padding: "24px 28px", background: "#FBF8F2", border: "1px solid rgba(21,20,15,.1)" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>WHERE A NUMBER CAN COME FROM</div>
                <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.028em", marginTop: 11 }}>Enter a number you already trust</div>
                <p style={{ margin: "8px 0 0", maxWidth: 640, fontSize: 14.5, lineHeight: 1.55, color: "#5C574B" }}>
                  A value you tested, or one another tool gave you and you believe, is entered by
                  hand and marked <span className="mono" style={{ fontSize: 12 }}>MANUAL</span> — it carries full
                  weight in the solver. There is no pre-race file upload:
                  <span className="mono" style={{ fontSize: 12 }}> MEASURED</span> is reserved for values
                  calibrated from a race file after you have raced.
                </p>
              </div>

              <StepFooter onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Set the goal" />
            </div>
          )}

          {/* ---------------- Step 3: Goal ---------------- */}
          {step === 3 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 3 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What are you racing for?</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 520, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                This changes what the solver protects. Finishing safely and chasing a personal best
                are different problems.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 34 }}>
                {([
                  { k: "conservative" as RiskLevel, kicker: "CONSERVATIVE", name: "Finish safely", desc: "Wider margins. The solver protects every cut-off first." },
                  { k: "balanced" as RiskLevel, kicker: "BALANCED", name: "Time target", desc: "The default for most athletes: a target held honestly." },
                  { k: "aggressive" as RiskLevel, kicker: "AGGRESSIVE", name: "Personal best", desc: "Maximum sustainable effort, with margins deliberately thinner." },
                ]).map((g) => {
                  const on = risk === g.k;
                  return (
                    <div key={g.k} onClick={() => setRisk(g.k)} style={{ borderRadius: 12, padding: "24px 26px 26px", cursor: "pointer", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.1)"}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: on ? "#E4622F" : "#8C8578" }}>{g.kicker}</span>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${on ? "#E4622F" : "rgba(21,20,15,.24)"}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                          {on && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E4622F" }} />}
                        </span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 14, color: on ? "#FBF8F2" : "#15140F" }}>{g.name}</div>
                      <p style={{ margin: "9px 0 0", fontSize: 14, lineHeight: 1.5, color: on ? "rgba(251,248,242,.55)" : "#5C574B" }}>{g.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px", marginTop: 16, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={labelStyle}>GOAL FINISH TIME</span>
                  <span className="mono" style={{ fontSize: 38, letterSpacing: "-.04em" }}>{formatClock(effectiveGoal)}:00</span>
                </div>
                {/* Bounds from the course's own barriers, not a guessed range. */}
                <input
                  type="range"
                  min={Math.round(finishLimit * 0.45)}
                  max={Math.round(finishLimit * 1.1)}
                  step={5}
                  value={effectiveGoal}
                  onChange={(e) => setGoalMinutes(+e.target.value)}
                  aria-label="Goal finish time in minutes"
                  style={{ width: "100%", margin: "20px 0 8px", height: 18 }}
                />
                <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, letterSpacing: ".11em", color: "#A8A192" }}>
                  <span>{formatClock(Math.round(finishLimit * 0.45))}</span>
                  <span style={{ color: "#C0392B" }}>{formatClock(finishLimit)} FINISH CUT-OFF</span>
                  <span>{formatClock(Math.round(finishLimit * 1.1))}</span>
                </div>
                <p style={{ margin: "22px 0 0", fontSize: 14.5, lineHeight: 1.5, color: "#6B6455" }}>
                  Nothing is judged here. The next step solves this goal against the real course and
                  your own numbers, and tells you whether it holds.
                </p>
              </div>

              <div onClick={() => setNightFlag((n) => !n)} style={{ borderRadius: 12, padding: "26px 28px", marginTop: 16, cursor: "pointer", background: nightFlag ? "rgba(228,98,47,.07)" : "#FBF8F2", border: `1px solid ${nightFlag ? "rgba(228,98,47,.36)" : "rgba(21,20,15,.1)"}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>FINISHING IN THE DARK</div>
                    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.025em", marginTop: 11 }}>Plan for a night finish</div>
                    <p style={{ margin: "7px 0 0", maxWidth: 520, fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>
                      Adds the kit a finish after dusk needs to the run bags.
                    </p>
                  </div>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: nightFlag ? "flex-end" : "flex-start", width: 44, height: 26, borderRadius: 13, flex: "none", background: nightFlag ? "#E4622F" : "rgba(21,20,15,.16)", padding: 3 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
                  </span>
                </div>
              </div>

              <StepFooter
                onBack={() => setStep(2)}
                onNext={saveGoalAndSolve}
                nextLabel={busy ? "Solving…" : "Solve this plan"}
                nextDisabled={busy}
              />
            </div>
          )}

          {/* ---------------- Step 4: Feasibility ---------------- */}
          {step === 4 && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 4 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
                {solve.isPending ? "Solving." : infeasible ? "Not at this goal." : paymentGate || gate ? "One step first." : solved ? "It holds." : "Ready to solve."}
              </h1>

              {/*
                An indeterminate spinner, because the solve is synchronous and
                returns the finished plan. The prototype showed seven named
                stages on a setTimeout; the backend has no per-stage progress to
                report, so inventing one would be theatre.
              */}
              {solve.isPending && (
                <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "36px 38px", marginTop: 30, boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ display: "block", width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(228,98,47,.25)", borderTopColor: "#E4622F", animation: "spin .8s linear infinite", flex: "none" }} />
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578" }}>SOLVING</span>
                  </div>
                  <p style={{ margin: "20px 0 0", maxWidth: 520, fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>
                    The solver runs the whole plan at once and returns it finished. Nothing is
                    charged until it succeeds.
                  </p>
                </div>
              )}

              {!solve.isPending && infeasible && error && (
                <div style={{ marginTop: 26 }}>
                  <FeasibilityVerdict
                    details={infeasible}
                    message={error.message}
                    requestId={error.requestId}
                    onAdjustGoal={() => { setError(null); setStep(3); }}
                  />
                </div>
              )}

              {!solve.isPending && !infeasible && (paymentGate || (gate && !solved)) && (
                <div style={{ marginTop: 26 }}>
                  <Paywall
                    gate={(paymentGate ?? gate)!}
                    prices={prices.data}
                    busy={authorize.isPending || solve.isPending}
                    onBuyRace={buyThenSolve}
                    requestId={error?.requestId}
                  />
                </div>
              )}

              {!solve.isPending && solved && !infeasible && (
                <SolvedSummary plan={solved} onContinue={() => setStep(5)} />
              )}

              {!solve.isPending && !solved && !infeasible && !paymentGate && !gate && (
                <div style={{ marginTop: 26 }}>
                  <button
                    type="button"
                    onClick={() => void runSolve()}
                    className="btn-accent"
                    style={{ height: 52, padding: "0 28px", background: "#E4622F", color: "#fff", border: 0, borderRadius: 7, fontSize: 15.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    Solve this plan
                  </button>
                </div>
              )}

              <StepFooter
                onBack={() => setStep(3)}
                onNext={solved ? () => setStep(5) : undefined}
                nextLabel="Fuelling"
                nextDisabled={!solved}
              />
            </div>
          )}

          {/* ---------------- Step 5: Fuelling ---------------- */}
          {step === 5 && solved && (
            <FuellingStep
              plan={solved}
              gutCeiling={byKey.get("gut_carb_ceiling")?.value ?? null}
              carbOverride={carbOverride}
              setCarbOverride={setCarbOverride}
              busy={solve.isPending}
              onApply={(value) => void runSolve({ carbOverride: value, force: true })}
              onBack={() => setStep(4)}
              onNext={() => setStep(6)}
            />
          )}

          {/* ---------------- Step 6: Bags ---------------- */}
          {step === 6 && solved && (
            <BagsStep plan={solved} onBack={() => setStep(5)} onNext={() => setStep(7)} />
          )}

          {/* ---------------- Step 7: Race card ---------------- */}
          {step === 7 && solved && (
            <div>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 7 OF 7</div>
              <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Your race card.</h1>
              <p style={{ margin: "14px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
                Solved against {solved.course_name} on bundle {solved.bundle_version}. Every number
                traces to the constraint that produced it.
              </p>
              <div style={{ ...cardStyle, marginTop: 30 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
                  {solved.splits.map((s) => (
                    <div key={s.leg}>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>{s.leg} {formatKm((s.distance ?? 0) * 1000)} KM</div>
                      <div className="mono" style={{ fontSize: 20, marginTop: 8 }}>{s.split_label}</div>
                      <div className="mono" style={{ fontSize: 12, color: "#8C8578", marginTop: 5 }}>{s.target_pace_or_power} {s.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 26 }}>
                <Link href={`${routes.racePlan}?plan=${solved.id}`} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 52, padding: "0 28px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15.5, fontWeight: 600 }}>
                  Open the full plan
                </Link>
                <button type="button" onClick={() => setStep(6)} className="btn-outline-dark2" style={{ height: 52, padding: "0 24px", border: "1px solid rgba(21,20,15,.18)", background: "transparent", borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  Back
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- The running panel ---------------- */}
        <aside style={{ position: "sticky", top: 90, ...cardStyle }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={labelStyle}>THIS PLAN</span>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: solved ? "#3E7B55" : "#8C8578" }}>
              {solved ? solved.feasibility : "NOT SOLVED"}
            </span>
          </div>

          <div className="mono" style={{ fontSize: 34, letterSpacing: "-.04em", marginTop: 16 }}>
            {solved?.projected_label ?? (plan.isFetching ? <Skeleton width="5ch" height={34} /> : "—")}
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192", marginTop: 6 }}>PROJECTED FINISH</div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
            {/* Three legs. T1 and T2 are not serialised — the total transition
                time is recoverable, the split is not, so it is not invented. */}
            {panelSplits.length === 0 && (
              <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#8C8578" }}>
                The panel fills in when the plan solves. Nothing here is a projection.
              </div>
            )}
            {panelSplits.map((s) => (
              <div key={s.leg} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                <span style={{ fontSize: 14, color: "#3D3A31" }}>{s.leg.charAt(0) + s.leg.slice(1).toLowerCase()}</span>
                <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span className="mono" style={{ fontSize: 10.5, color: "#A39B8A" }}>{s.target_pace_or_power}{s.unit}</span>
                  <span className="mono" style={{ fontSize: 14, minWidth: 48, textAlign: "right" }}>{s.split_label}</span>
                </span>
              </div>
            ))}
          </div>

          {panelGates.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
              <div style={labelStyle}>CUT-OFF MARGINS</div>
              {panelGates.map((g) => {
                const color = g.state === "bad" ? "#C0392B" : g.state === "tight" ? "#A0701A" : "#3E7B55";
                return (
                  <div key={g.name} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                    <span style={{ fontSize: 13.5, color: "#3D3A31" }}>{g.name.replace(/_/g, " ")}</span>
                    <span className="mono" style={{ fontSize: 13, color }}>{g.margin_label ?? formatMargin(g.margin_minutes)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {solved && (
            <p style={{ margin: "18px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#8C8578" }}>
              Every number here came out of the solver and can be traced to the constraint that
              produced it.
            </p>
          )}
          <OsmAttribution attribution={solved?.attribution} style={{ marginTop: 14 }} />
        </aside>
      </div>
    </div>
  );
}

// --- small pieces ------------------------------------------------------------

function StepFooter({
  onBack, onNext, nextLabel, nextDisabled,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
      {onBack && (
        <button type="button" onClick={onBack} className="btn-outline-dark2" style={{ height: 50, padding: "0 22px", border: "1px solid rgba(21,20,15,.18)", background: "transparent", borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          Back
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn-accent"
          style={{ height: 50, padding: "0 26px", background: nextDisabled ? "rgba(21,20,15,.1)" : "#E4622F", color: nextDisabled ? "#A8A192" : "#fff", border: 0, borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: nextDisabled ? "not-allowed" : "pointer" }}
        >
          {nextLabel ?? "Continue"}
        </button>
      )}
    </div>
  );
}

function ManualEntry({
  unit, value, onChange, onSave, onCancel, busy,
}: {
  unit: string; value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; busy: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0 20px", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
      <div style={{ ...inputBoxStyle, width: 200 }}>
        <input
          autoFocus
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 16, color: "#15140F", padding: 0, outline: "none" }}
        />
        <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{unit}</span>
      </div>
      <button type="button" onClick={onSave} disabled={busy} style={{ height: 46, padding: "0 18px", background: "#15140F", color: "#F1EEE8", border: 0, borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
        {busy ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onCancel} style={{ height: 46, padding: "0 14px", background: "transparent", border: 0, color: "#8C8578", fontSize: 14, cursor: "pointer" }}>Cancel</button>
      <span style={{ fontSize: 12.5, color: "#8C8578" }}>Saved as MANUAL — a number you already trust.</span>
    </div>
  );
}

function Estimator({
  fields, answers, onChange, onSubmit, onCancel, busy,
}: {
  fields: { name: string; label: string; suffix?: string; type: "number" | "boolean"; placeholder?: string }[];
  answers: Record<string, string | boolean>;
  onChange: (a: Record<string, string | boolean>) => void;
  onSubmit: () => void; onCancel: () => void; busy: boolean;
}) {
  const ready = fields.every((f) => f.type === "boolean" || String(answers[f.name] ?? "").trim() !== "");
  return (
    <div style={{ padding: "18px 20px 20px", margin: "6px 0 14px", borderRadius: 9, background: "rgba(228,98,47,.05)", border: "1px solid rgba(228,98,47,.24)" }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#C6461B" }}>ESTIMATE IT</div>
      <p style={{ margin: "8px 0 16px", maxWidth: 560, fontSize: 13.5, lineHeight: 1.5, color: "#6B6455" }}>
        An estimated value carries full weight in the solver — the estimator&rsquo;s job is to find your
        real number, not a cautious one.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {fields.map((f) =>
          f.type === "boolean" ? (
            <label key={f.name} style={{ display: "flex", alignItems: "center", gap: 10, height: 46, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 14 }}>
              <input type="checkbox" checked={Boolean(answers[f.name])} onChange={(e) => onChange({ ...answers, [f.name]: e.target.checked })} />
              {f.label}
            </label>
          ) : (
            <div key={f.name}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#8C8578", marginBottom: 7 }}>{f.label.toUpperCase()}</div>
              <div style={{ ...inputBoxStyle, width: 190 }}>
                <input
                  type="number"
                  value={String(answers[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange({ ...answers, [f.name]: e.target.value })}
                  style={{ flex: 1, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 15, color: "#15140F", padding: 0, outline: "none", minWidth: 0 }}
                />
                {f.suffix && <span className="mono" style={{ fontSize: 10.5, color: "#8C8578" }}>{f.suffix}</span>}
              </div>
            </div>
          ),
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
        <button type="button" onClick={onSubmit} disabled={!ready || busy} style={{ height: 44, padding: "0 18px", background: ready && !busy ? "#E4622F" : "rgba(21,20,15,.1)", color: ready && !busy ? "#fff" : "#A8A192", border: 0, borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: ready && !busy ? "pointer" : "not-allowed" }}>
          {busy ? "Estimating…" : "Use this estimate"}
        </button>
        <button type="button" onClick={onCancel} style={{ height: 44, padding: "0 14px", background: "transparent", border: 0, color: "#8C8578", fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function SolvedSummary({ plan, onContinue }: { plan: SolvedPlan; onContinue: () => void }) {
  const tone = plan.feasibility === "CLEAR" ? "clear" : plan.feasibility === "TIGHT" ? "tight" : "clear";
  const col = tone === "clear" ? "#3E7B55" : "#A0701A";
  const worst = plan.gates.length
    ? plan.gates.reduce((a, b) => (a.margin_minutes < b.margin_minutes ? a : b))
    : null;

  return (
    <div style={{ marginTop: 26 }}>
      <div style={{ borderRadius: 12, padding: "30px 32px", background: tone === "clear" ? "rgba(124,192,143,.1)" : "rgba(224,163,60,.11)", border: `1px solid ${tone === "clear" ? "rgba(124,192,143,.4)" : "rgba(224,163,60,.4)"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: col }}>{plan.feasibility}</span>
        </div>
        <p style={{ margin: "15px 0 0", maxWidth: 640, fontSize: 30, lineHeight: 1.16, fontWeight: 500, letterSpacing: "-.035em" }}>
          {worst
            ? `You clear the ${worst.name.replace(/_/g, " ")} with ${formatClock(worst.margin_minutes)} in hand.`
            : `Projected finish ${plan.projected_label}.`}
        </p>
        <p style={{ margin: "12px 0 0", maxWidth: 620, fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>
          Solved against {plan.course_name} on bundle {plan.bundle_version}.
          {plan.binding_constraint_key ? ` The binding constraint is ${plan.binding_constraint_key.replace(/_/g, " ")}.` : ""}
          {plan.readiness_note ? ` ${plan.readiness_note}` : ""}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(plan.gates.length, 1)},1fr)`, gap: 14, marginTop: 14 }}>
        {plan.gates.map((g) => {
          const color = g.state === "bad" ? "#C0392B" : g.state === "tight" ? "#A0701A" : "#3E7B55";
          const bg = g.state === "bad" ? "rgba(192,57,43,.07)" : g.state === "tight" ? "rgba(224,163,60,.1)" : "rgba(124,192,143,.1)";
          return (
            <div key={g.name} style={{ borderRadius: 10, padding: "18px 20px", background: bg, border: `1px solid ${color}44` }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#8C8578" }}>{g.name.replace(/_/g, " ").toUpperCase()}</div>
              <div className="mono" style={{ fontSize: 20, marginTop: 9, color }}>{g.margin_label ?? formatMargin(g.margin_minutes)}</div>
              <div className="mono" style={{ fontSize: 10, color: "#8C8578", marginTop: 6 }}>ETA {formatClock(g.eta_minutes)} · LIMIT {formatClock(g.limit_minutes)}</div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={onContinue} className="btn-accent" style={{ height: 52, padding: "0 28px", marginTop: 22, background: "#E4622F", color: "#fff", border: 0, borderRadius: 7, fontSize: 15.5, fontWeight: 600, cursor: "pointer" }}>
        See the fuelling
      </button>
    </div>
  );
}

function FuellingStep({
  plan, gutCeiling, carbOverride, setCarbOverride, busy, onApply, onBack, onNext,
}: {
  plan: SolvedPlan;
  gutCeiling: number | null;
  carbOverride: number | null;
  setCarbOverride: (v: number | null) => void;
  busy: boolean;
  onApply: (v: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const f = plan.fuelling;
  const requested = carbOverride ?? f.carb_g_per_hr;
  // The warning is derived from the athlete's own measured ceiling — the
  // backend defines an OVER_CEILING code but never raises it, so the check
  // that makes an override deliberate rather than silent lives here.
  const overCeiling = gutCeiling != null && requested > gutCeiling;

  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 5 OF 7</div>
      <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What goes in.</h1>
      <p style={{ margin: "14px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
        {f.total_carb_g} g of carbohydrate across the day, and the aid stations where each of it goes in.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 30 }}>
        {[
          { label: "CARB / HR", value: `${f.carb_g_per_hr} g`, key: f.binding_carb_key },
          { label: "FLUID / HR", value: `${f.fluid_ml_per_hr} ml`, key: f.binding_fluid_key },
          { label: "SODIUM / HR", value: `${f.sodium_mg_per_hr} mg`, key: f.binding_sodium_key },
          { label: "CAFFEINE, TOTAL", value: `${f.caffeine_mg_total} mg`, key: f.binding_caffeine_key },
        ].map((c) => (
          <div key={c.label} style={cardStyle}>
            <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>{c.label}</div>
            <div className="mono" style={{ fontSize: 26, marginTop: 10 }}>{c.value}</div>
            {/* Every value names the constraint that produced it. */}
            <div className="mono" style={{ fontSize: 9, color: "#8C8578", marginTop: 8 }}>{(c.key ?? "").replace(/_/g, " ")}</div>
          </div>
        ))}
      </div>

      {f.overridden && (
        <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: 9, background: "rgba(224,163,60,.1)", border: "1px solid rgba(224,163,60,.34)", fontSize: 14, color: "#3D3A31" }}>
          This fuelling carries an override. It is recorded against the plan and shown wherever the
          number appears.
        </div>
      )}
      {f.requires_multiple_transportable && (
        <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: 9, background: "rgba(79,124,147,.07)", border: "1px solid rgba(79,124,147,.26)", fontSize: 14, color: "#3D3A31" }}>
          This rate needs more than one transportable carbohydrate — a single-source product will not
          absorb fast enough.
        </div>
      )}

      {/* The real fuel bars: cumulative carb from the aid actions themselves. */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={labelStyle}>CARBOHYDRATE IN, ACROSS THE DAY</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120, marginTop: 18 }}>
          {plan.aid_actions.map((a) => {
            const maxCum = plan.aid_actions[plan.aid_actions.length - 1]?.cumulative_carb_g || 1;
            return (
              <div
                key={a.ordinal}
                title={`${a.station_name} · ${Math.round(a.cumulative_carb_g)} g by km ${a.at_km}`}
                style={{ flex: 1, height: `${(a.cumulative_carb_g / maxCum) * 100}%`, background: a.leg === "RUN" ? "#64707A" : "#E4622F", opacity: 0.85, borderRadius: "2px 2px 0 0", minWidth: 3 }}
              />
            );
          })}
        </div>
        <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#A8A192", marginTop: 8 }}>
          <span>0 g</span>
          <span>{Math.round(plan.aid_actions[plan.aid_actions.length - 1]?.cumulative_carb_g ?? 0)} g</span>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={labelStyle}>OVERRIDE THE CARB RATE</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
          <input
            type="range"
            min={40}
            max={120}
            step={1}
            value={requested}
            onChange={(e) => setCarbOverride(+e.target.value)}
            aria-label="Carbohydrate grams per hour"
            style={{ flex: 1, height: 18 }}
          />
          <span className="mono" style={{ fontSize: 24, minWidth: "5ch", textAlign: "right" }}>{requested} g</span>
        </div>
        {overCeiling && (
          <div style={{ marginTop: 14, padding: "14px 18px", borderRadius: 9, background: "rgba(224,163,60,.1)", border: "1px solid rgba(224,163,60,.34)", fontSize: 14, lineHeight: 1.5, color: "#3D3A31" }}>
            {requested} g/hr is above your gut ceiling of {gutCeiling}. Available, but not silently —
            the override is recorded against the plan.
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <button
            type="button"
            onClick={() => onApply(requested)}
            disabled={busy || requested === f.carb_g_per_hr}
            style={{ height: 46, padding: "0 20px", background: busy || requested === f.carb_g_per_hr ? "rgba(21,20,15,.1)" : "#15140F", color: busy || requested === f.carb_g_per_hr ? "#A8A192" : "#F1EEE8", border: 0, borderRadius: 7, fontSize: 14.5, fontWeight: 600, cursor: busy ? "wait" : "pointer" }}
          >
            {busy ? "Re-solving…" : overCeiling ? "Override anyway" : "Re-solve at this rate"}
          </button>
          {carbOverride != null && (
            <button type="button" onClick={() => setCarbOverride(null)} style={{ height: 46, padding: "0 14px", background: "transparent", border: 0, color: "#8C8578", fontSize: 14, cursor: "pointer" }}>Reset</button>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 16, padding: 0 }}>
        <div style={{ padding: "22px 26px 8px", ...labelStyle }}>THE AID-STATION TIMELINE</div>
        <div style={{ padding: "0 26px 22px" }}>
          {plan.aid_actions.map((a) => (
            <div key={a.ordinal} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 90px", gap: 18, alignItems: "baseline", padding: "13px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
              <span className="mono" style={{ fontSize: 12.5, color: "#8C8578" }}>
                {wallClockFrom(plan.start_time_local, a.at_clock_minutes)} · km {a.at_km}
              </span>
              <span>
                <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{a.station_name}</span>
                <span style={{ display: "block", fontSize: 13.5, color: "#6B6455", marginTop: 3 }}>{a.action_text}</span>
              </span>
              <span className="mono" style={{ fontSize: 13, textAlign: "right" }}>{Math.round(a.cumulative_carb_g)} g</span>
            </div>
          ))}
        </div>
      </div>

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="Pack the bags" />
    </div>
  );
}

function BagsStep({ plan, onBack, onNext }: { plan: SolvedPlan; onBack: () => void; onNext: () => void }) {
  const [active, setActive] = useState(0);
  const bag = plan.bags[active];

  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>STEP 6 OF 7</div>
      <h1 style={{ margin: "14px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
        {plan.bags.length} bags, packed.
      </h1>
      <p style={{ margin: "14px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
        Every item carries the reason it is there. Nothing is in a bag because it usually is.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 30, flexWrap: "wrap" }}>
        {plan.bags.map((b, i) => {
          const on = i === active;
          return (
            <div key={b.key} onClick={() => setActive(i)} style={{ padding: "12px 16px", borderRadius: 8, cursor: "pointer", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}` }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.018em", color: on ? "#FBF8F2" : "#15140F" }}>{b.name}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: on ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 5 }}>{b.item_count} ITEMS</div>
            </div>
          );
        })}
      </div>

      {bag && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em" }}>{bag.name}</span>
            <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>{bag.when_label.toUpperCase()}</span>
          </div>
          <div style={{ marginTop: 18 }}>
            {(bag.items ?? []).map((item) => (
              <div key={item.ordinal} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 60px", gap: 18, padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>
                    {item.name}
                    {item.is_user_added && <span className="mono" style={{ marginLeft: 10, fontSize: 8.5, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#5C574B" }}>ADDED BY YOU</span>}
                  </div>
                  {/* The reason, and the constraint it came from. */}
                  {item.reason_text && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 4 }}>{item.reason_text}</div>}
                  {item.reason_constraint_key && (
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#A8A192", marginTop: 5 }}>{item.reason_constraint_key.replace(/_/g, " ")}</div>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 15, textAlign: "right" }}>{item.qty ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StepFooter onBack={onBack} onNext={onNext} nextLabel="See the race card" />
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320, padding: "110px 48px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) 356px", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Skeleton width={110} height={10} /><Skeleton width={420} height={46} /><Skeleton width={520} height={16} />
          <Skeleton width="100%" height={320} radius={12} style={{ marginTop: 18 }} />
        </div>
        <Skeleton width="100%" height={380} radius={12} />
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function PlanBuilderPage() {
  return (
    <GuardedPage>
      <Suspense fallback={<BuilderSkeleton />}>
        <BuilderScreen />
      </Suspense>
    </GuardedPage>
  );
}
