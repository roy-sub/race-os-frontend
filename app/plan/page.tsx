"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AccountHeader } from "@/components/AccountHeader";
import { Reveal } from "@/components/Reveal";
import { ApiErrorState } from "@/components/ApiErrorState";
import { OsmAttribution } from "@/components/OsmAttribution";
import { SurveyedMap } from "@/components/CourseMap";
import { Skeleton } from "@/components/Skeleton";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { ApiError } from "@/lib/api/errors";
import { client, unwrap } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { useRecon } from "@/lib/api/courses";
import { asSolved, usePlan, useRaceForecast, type SolvedPlan } from "@/lib/api/plans";
import { downloadExport, useExportManifest, type ExportEntry } from "@/lib/api/exports";
import {
  LEG_COLOR, elevationPath, formatClock, formatKm, formatMargin, formatMetres, sortLegs,
} from "@/lib/courseGeo";

const TABS = [
  { key: "feas", name: "Feasibility" },
  { key: "pacing", name: "Pacing" },
  { key: "fuel", name: "Fuelling" },
  { key: "bags", name: "Bags" },
  { key: "course", name: "Course" },
  { key: "cond", name: "Conditions" },
  { key: "exports", name: "Exports" },
] as const;

const LEG_TINT: Record<string, string> = {
  SWIM: "rgba(79,124,147,.13)",
  BIKE: "rgba(228,98,47,.13)",
  RUN: "rgba(100,112,122,.13)",
};

/** The clock an athlete reads, from the plan's own start time. Never 06:40. */
/** Mirrors `exports/tokens.py` STATE_GLYPHS, so screen and paper agree. */
const GATE_GLYPH: Record<string, string> = { clear: "OK", tight: "!", bad: "X" };

/** What each glyph means, for a screen reader and for a print legend. */
const GATE_STATE_LABEL: Record<string, string> = {
  clear: "Clears this cut-off",
  tight: "Tight against this cut-off",
  bad: "Misses this cut-off",
};

function wallClock(startTimeLocal: string | null | undefined, elapsedMinutes: number): string {
  if (!startTimeLocal) return "—";
  const [h, m] = startTimeLocal.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  const t = (h * 60 + m + elapsedMinutes) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.round(t % 60)).padStart(2, "0")}`;
}

function daysUntil(eventDate: string | null | undefined): number | null {
  if (!eventDate) return null;
  const then = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  return Math.ceil((then.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
}

/** Pending drift on this plan. Real endpoint, real deltas — nothing invented. */
type DriftDelta = { key: string; label: string; from: string; to: string; delta_minutes?: number };
type DriftEvent = {
  id: string;
  cause: string;
  severity: string;
  status: string;
  detected_at: string;
  field_deltas: DriftDelta[];
  summary?: string | null;
};

function useDrift(planId: string | null) {
  return useQuery({
    queryKey: ["plans", "drift", planId],
    enabled: Boolean(planId),
    queryFn: async (): Promise<DriftEvent[]> => {
      const rows = await unwrap(
        client.GET("/api/v1/plans/{plan_id}/drift", { params: { path: { plan_id: planId! } } }),
      );
      return rows as unknown as DriftEvent[];
    },
  });
}

function PlanScreen() {
  const params = useSearchParams();
  const planId = params.get("plan");

  const { data, isPending, error, refetch } = usePlan(planId);
  const plan = asSolved(data);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("feas");

  if (!planId) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="racePlan" />
        <div style={{ maxWidth: 640, margin: "90px auto", padding: "0 56px", textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NO PLAN SELECTED</div>
          <h1 style={{ margin: "18px 0 0", fontSize: 34, lineHeight: 1.14, fontWeight: 500, letterSpacing: "-.032em" }}>Pick a plan to open.</h1>
          <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.55, color: "#6B6455" }}>
            Your solved plans are on My Plans. If you have not built one yet, it takes about six minutes.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26 }}>
            <Link href={routes.myPlans} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>My plans</Link>
            <Link href={routes.planBuilder} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 22px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>Build a plan</Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="racePlan" />
        <div style={{ maxWidth: 720, margin: "80px auto", padding: "0 56px" }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </div>
      </div>
    );
  }

  if (isPending || !data) return <PlanSkeleton />;

  if (!plan) {
    // A draft carries no splits, gates, bags or fuelling — there is nothing to
    // show, and inventing placeholders would hide that it was never solved.
    return (
      <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
        <AccountHeader active="racePlan" />
        <div style={{ maxWidth: 640, margin: "90px auto", padding: "0 56px", textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOT SOLVED</div>
          <h1 style={{ margin: "18px 0 0", fontSize: 34, lineHeight: 1.14, fontWeight: 500, letterSpacing: "-.032em" }}>This plan is still a draft.</h1>
          <p style={{ margin: "12px 0 0", fontSize: 15.5, lineHeight: 1.55, color: "#6B6455" }}>
            Nothing has been solved for {data.course_name ?? "it"} yet, so there are no splits, gates or bags to show.
          </p>
          <Link href={`${routes.planBuilder}?plan=${data.id}`} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 24px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
            Finish this plan
          </Link>
        </div>
      </div>
    );
  }

  return <PlanBody plan={plan} tab={tab} setTab={setTab} />;
}

function PlanBody({
  plan, tab, setTab,
}: {
  plan: SolvedPlan;
  tab: (typeof TABS)[number]["key"];
  setTab: (t: (typeof TABS)[number]["key"]) => void;
}) {
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [bagIdx, setBagIdx] = useState(0);
  const [packed, setPacked] = useState<Record<string, boolean>>({});

  const recon = useRecon(plan.course_slug ?? null);
  const drift = useDrift(plan.id);
  const pendingDrift = (drift.data ?? []).filter((d) => d.status === "pending");

  const days = daysUntil(plan.event_date);
  const gates = plan.gates;
  const tightest = gates.length ? gates.reduce((a, b) => (a.margin_minutes < b.margin_minutes ? a : b)) : null;

  const feasColor = plan.feasibility === "CLEAR" ? "#3E7B55" : plan.feasibility === "TIGHT" ? "#A0701A" : "#8C8578";
  const bindingCount = plan.constraint_refs.filter((c) => c.binding).length;

  // Segments arrive flat; grouping by leg is presentation, not derivation.
  const segments = plan.segments;
  const segmentsByLeg = useMemo(() => {
    const map = new Map<string, typeof segments>();
    for (const s of segments) {
      const rows = map.get(s.leg) ?? [];
      rows.push(s);
      map.set(s.leg, rows);
    }
    return map;
  }, [segments]);

  const maxCumCarb = plan.aid_actions.length
    ? plan.aid_actions[plan.aid_actions.length - 1].cumulative_carb_g
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="racePlan" />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "34px 56px 0" }}>
        <div className="mono" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", marginBottom: 26 }}>
          <Link href={routes.dashboard} style={{ color: "#8C8578" }}>DASHBOARD</Link><span>/</span>
          <Link href={routes.myPlans} style={{ color: "#8C8578" }}>MY PLANS</Link><span>/</span>
          <span style={{ color: "#15140F" }}>{(plan.course_name ?? "PLAN").toUpperCase()}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 56, alignItems: "end" }}>
          <div>
            <Reveal style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid ${feasColor}66`, borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: feasColor }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: feasColor, animation: "breathe 2.6s ease-in-out infinite" }} />{plan.feasibility}
              </span>
              <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>
                v{plan.version}
                {plan.solved_at ? ` · SOLVED ${new Date(plan.solved_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()}` : ""}
                {plan.bundle_version ? ` · BUNDLE ${plan.bundle_version}` : ""}
              </span>
            </Reveal>
            <Reveal as="h1" delay={0.05} style={{ whiteSpace: "nowrap", margin: 0, fontSize: 72, lineHeight: 0.9, fontWeight: 600, letterSpacing: "-.05em" }}>{plan.course_name}</Reveal>
            <Reveal delay={0.1} style={{ display: "flex", gap: 20, marginTop: 20, fontSize: 15.5, color: "#5C574B", whiteSpace: "nowrap" }}>
              {plan.event_date && <span>{new Date(`${plan.event_date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>}
              <span style={{ color: "#C4BCAC" }}>·</span><span>{plan.course_place}</span>
              {plan.start_time_local && <><span style={{ color: "#C4BCAC" }}>·</span><span>{plan.start_time_local} start</span></>}
            </Reveal>
          </div>
          <Reveal delay={0.14} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 20 }}>
            {days !== null && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span className="mono" style={{ fontSize: 64, lineHeight: 0.82, letterSpacing: "-.05em" }}>{Math.abs(days)}</span>
                <span className="mono" style={{ fontSize: 10, letterSpacing: ".18em", color: "#8C8578" }}>{days >= 0 ? "DAYS OUT" : "DAYS AGO"}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <span onClick={() => setTab("exports")} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", background: "#E4622F", color: "#fff", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Race card</span>
              <span onClick={() => setTab("exports")} className="btn-outline-dark2" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 16px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Export</span>
            </div>
          </Reveal>
        </div>

        {/* Drift: real pending events with the solver's own before/after deltas. */}
        {pendingDrift.length > 0 && (
          <Reveal style={{ position: "relative", background: "#191713", borderRadius: 12, padding: "24px 28px", marginTop: 36, overflow: "hidden", boxShadow: "0 20px 50px -30px rgba(21,20,15,.55)" }}>
            <div style={{ position: "absolute", right: -90, top: -120, width: 400, height: 400, background: "radial-gradient(closest-side,rgba(224,163,60,.16),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E0A33C", animation: "breathe 2.6s ease-in-out infinite" }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#E0A33C" }}>
                  NEEDS REVIEW · {pendingDrift[0].field_deltas.length} {pendingDrift[0].field_deltas.length === 1 ? "VALUE" : "VALUES"} MOVED
                </span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.03em", marginTop: 12, color: "#FBF8F2" }}>
                {pendingDrift[0].summary ?? `Something behind this plan changed: ${pendingDrift[0].cause.replace(/_/g, " ")}.`}
              </div>
              <div className="mono" style={{ display: "flex", flexWrap: "wrap", gap: 26, marginTop: 14, fontSize: 12.5, color: "rgba(251,248,242,.5)" }}>
                {pendingDrift[0].field_deltas.slice(0, 4).map((d) => (
                  <span key={d.key}>
                    {d.label.toUpperCase()} <span style={{ textDecoration: "line-through" }}>{d.from}</span> → <span style={{ color: "#E0A33C" }}>{d.to}</span>
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 16, fontSize: 13, color: "rgba(251,248,242,.45)" }}>
                Your plan is untouched. This is what a re-solve <em>would</em> change.
              </div>
            </div>
          </Reveal>
        )}
      </section>

      {/* ---------------- Tabs ---------------- */}
      <div style={{ position: "sticky", top: 68, zIndex: 60, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.09)", marginTop: 40 }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
          {/* Buttons in a tablist, not clickable divs.
              A div with onClick is unreachable by keyboard and announces
              nothing to a screen reader: the whole plan was navigable by mouse
              only. `aria-selected` carries which panel is open, so the state
              is not conveyed by the orange underline alone. */}
          <div role="tablist" aria-label="Plan sections" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => { setTab(t.key); setDrawerKey(null); }}
                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, height: 54, padding: "0 15px", cursor: "pointer", whiteSpace: "nowrap", background: "none", border: "none", font: "inherit" }}
                >
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, letterSpacing: "-.015em", color: active ? "#15140F" : "#6B6455" }}>{t.name}</span>
                  <span aria-hidden="true" style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 2, background: active ? "#E4622F" : "transparent" }} />
                </button>
              );
            })}
          </div>
          <div className="mono" style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578", whiteSpace: "nowrap" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: feasColor }} />
            {plan.goal_minutes ? `GOAL ${formatClock(plan.goal_minutes)}` : "NO GOAL SET"} · PROJECTED {plan.projected_label}
          </div>
        </div>
      </div>

      {/* ---------------- Feasibility ---------------- */}
      {tab === "feas" && (
        <section style={{ padding: "80px 0 88px", background: "#EAE3D6", backgroundImage: "radial-gradient(rgba(21,20,15,.07) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 420px", gap: 26, alignItems: "start" }}>
              <Reveal style={{ background: "rgba(255,255,255,.34)", borderRadius: 16, padding: 26, backdropFilter: "blur(24px) saturate(140%)", boxShadow: "0 50px 100px -50px rgba(21,20,15,.4)" }}>
                <div style={{ background: "#FBF8F2", borderRadius: 11, padding: "34px 36px 30px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: feasColor }} />
                    <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: feasColor }}>{plan.feasibility}</span>
                  </div>
                  <p style={{ margin: "16px 0 0", maxWidth: 560, fontSize: 34, lineHeight: 1.14, fontWeight: 500, letterSpacing: "-.038em" }}>
                    {tightest
                      ? `You clear the ${tightest.name.replace(/_/g, " ")} with ${formatClock(tightest.margin_minutes)} in hand. It is the barrier that binds first.`
                      : `Projected finish ${plan.projected_label}.`}
                  </p>

                  <div style={{ marginTop: 36 }}>
                    {gates.map((g) => {
                      const color = g.state === "bad" ? "#C0392B" : g.state === "tight" ? "#E0A33C" : "#7CC08F";
                      const isTightest = tightest?.name === g.name;
                      return (
                        <div key={g.name} style={{ display: "grid", gridTemplateColumns: "118px 40px minmax(0,1fr)", alignItems: "start", padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                          <div style={{ textAlign: "right" }}>
                            <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192" }}>{wallClock(plan.start_time_local, g.eta_minutes)}</div>
                            <div className="mono" style={{ fontSize: 16, marginTop: 3 }}>{formatClock(g.eta_minutes)}</div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "center", paddingTop: 3 }}>
                            {/* The glyph, not just the colour. This is printed on
                                whatever machine is in the house and read at hour
                                nine through a wet sleeve; a state carried by hue
                                alone is gone in greyscale and invisible to a
                                colour-blind reader. Same three marks the PDF
                                uses — see `exports/tokens.py` STATE_GLYPHS. */}
                            <span
                              className="mono"
                              title={GATE_STATE_LABEL[g.state] ?? g.state}
                              style={{ minWidth: 18, height: 18, borderRadius: 9, background: color, color: "#fff", fontSize: 9, fontWeight: 700, lineHeight: "18px", textAlign: "center", padding: "0 4px" }}
                            >
                              {GATE_GLYPH[g.state] ?? "—"}
                            </span>
                            <span className="sr-only">
                              {GATE_STATE_LABEL[g.state] ?? g.state}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 16.5, fontWeight: 500, letterSpacing: "-.022em" }}>{g.name.replace(/_/g, " ")}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
                              <span className="mono" style={{ fontSize: 11, color: "#A8A192" }}>LIMIT {formatClock(g.limit_minutes)}</span>
                              <span className="mono" style={{ fontSize: 13, color }}>{g.margin_label ?? formatMargin(g.margin_minutes)} in hand</span>
                              <span className="mono" style={{ fontSize: 10, color: "#A8A192" }}>{Math.round(g.load_pct)}% OF THE LIMIT USED</span>
                              {isTightest && <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", padding: "3px 7px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#5C574B" }}>BINDS FIRST</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {plan.worst_margin_minutes != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, paddingTop: 22, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                      <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>CONTINGENCY BUDGET</span>
                      <span style={{ fontSize: 15, color: "#3D3A31" }}>
                        You can lose <span className="mono">{formatClock(plan.worst_margin_minutes)}</span> to punctures, transitions and bad patches before anything fails.
                      </span>
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "#8C8578" }}>CONSTRAINTS</span>
                  <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192" }}>{bindingCount} BINDING · {plan.constraint_refs.length - bindingCount} SLACK</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[...plan.constraint_refs].sort((a, b) => Number(b.binding) - Number(a.binding)).map((c) => (
                    <div
                      key={c.key}
                      onClick={() => setDrawerKey(drawerKey === c.key ? null : c.key)}
                      className="row-hover-border"
                      style={{ background: c.binding ? "rgba(228,98,47,.06)" : "#FBF8F2", border: `1px solid ${c.binding ? "rgba(228,98,47,.3)" : "rgba(21,20,15,.1)"}`, borderRadius: 10, padding: "16px 18px", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.binding ? "#E4622F" : "#C4BCAC", flex: "none" }} />
                        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{c.name}</span>
                        <span className="mono" style={{ marginLeft: "auto", fontSize: 13.5, color: "#15140F", whiteSpace: "nowrap" }}>{c.value} {c.unit}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 9, paddingLeft: 15 }}>
                        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192" }}>{c.source_label.toUpperCase()}</span>
                        <span className="mono" style={{ marginLeft: "auto", fontSize: 8.5, letterSpacing: ".13em", color: c.binding ? "#C6461B" : "#A8A192" }}>{c.binding ? "BINDING" : "SLACK"}</span>
                      </div>

                      {/*
                        The "Why this?" drawer.

                        `description`, `affects_text` and `override_text` come
                        back null for every constraint — the solver writes them
                        as empty strings — so the drawer shows what the API
                        actually carries and says so, rather than inventing the
                        prose the prototype had.
                      */}
                      {drawerKey === c.key && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(21,20,15,.09)", paddingLeft: 15 }}>
                          {c.description && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "#3D3A31" }}>{c.description}</p>}
                          {c.affects_text && <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#6B6455" }}>{c.affects_text}</p>}
                          {c.override_text && <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "#6B6455" }}>{c.override_text}</p>}
                          <div style={{ fontSize: 13, lineHeight: 1.55, color: "#6B6455", marginTop: c.description ? 10 : 0 }}>
                            {c.binding
                              ? "This value is binding: it is one of the constraints setting the limit on this plan."
                              : "This value has slack — it is not what is limiting this plan."}
                            {plan.binding_constraint_key === c.key ? " It is the single binding constraint on the projected finish." : ""}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: "0 4px", fontSize: 13, lineHeight: 1.5, color: "#6B6455" }}>
                  Tap any constraint to see how it entered this plan. Every solved number traces back to one of these.
                </div>
                {plan.assumed_fields && plan.assumed_fields.length > 0 && (
                  <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 9, background: "rgba(224,163,60,.1)", border: "1px solid rgba(224,163,60,.3)" }}>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A0701A" }}>ASSUMED, NOT GIVEN</div>
                    <div style={{ fontSize: 13, lineHeight: 1.55, color: "#3D3A31", marginTop: 8 }}>
                      {plan.assumed_fields.map((f) => f.replace(/[._]/g, " ")).join(" · ")}
                    </div>
                    {plan.readiness_note && (
                      <div style={{ fontSize: 12.5, color: "#6B6455", marginTop: 8 }}>{plan.readiness_note}</div>
                    )}
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Pacing ---------------- */}
      {tab === "pacing" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              {plan.segments.length} segments, one race.
            </Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>
              PROJECTED {plan.projected_label}
            </Reveal>
          </div>

          {/*
            Three legs. There is no T1 or T2 row: `leg` is only SWIM|BIKE|RUN,
            and while the total transition time is recoverable from
            projected_minutes minus the splits, the split between them is not
            serialised — so it is reported as one figure, not invented as two.
          */}
          {sortLegs(plan.splits).map((split) => {
            const rows = segmentsByLeg.get(split.leg) ?? [];
            let elapsed = plan.splits
              .slice(0, plan.splits.findIndex((s) => s.leg === split.leg))
              .reduce((a, b) => a + b.split_minutes, 0);
            return (
              <Reveal key={split.leg} style={{ marginBottom: 16, background: "#FBF8F2", borderRadius: 12, padding: "26px 30px 22px", boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40, paddingBottom: 18, borderBottom: "1px solid rgba(21,20,15,.09)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 24, height: 24, borderRadius: 6, background: LEG_TINT[split.leg], display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <span style={{ width: 9, height: 9, borderRadius: 2, background: LEG_COLOR[split.leg] }} />
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-.032em" }}>{split.leg.charAt(0) + split.leg.slice(1).toLowerCase()}</span>
                    <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{split.distance.toFixed(1)} KM</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
                    <span className="mono" style={{ fontSize: 16 }}>{split.target_pace_or_power}<span style={{ fontSize: 11, color: "#8C8578" }}>{split.unit}</span></span>
                    <span className="mono" style={{ fontSize: 24, letterSpacing: "-.03em" }}>{split.split_label}</span>
                  </div>
                </div>
                {split.note && <div style={{ fontSize: 13.5, color: "#6B6455", marginTop: 14 }}>{split.note}</div>}
                {rows.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {rows.map((s) => {
                      elapsed += s.target_minutes;
                      return (
                        <div key={s.ordinal} style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 1fr 1fr 90px 80px", gap: 16, alignItems: "baseline", padding: "12px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                          <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{s.name}</span>
                          <span className="mono" style={{ fontSize: 12, color: "#8C8578" }}>{s.from_km.toFixed(1)}–{s.to_km.toFixed(1)} km</span>
                          <span style={{ fontSize: 13.5, color: "#6B6455" }}>{s.terrain_desc}</span>
                          <span className="mono" style={{ fontSize: 14, textAlign: "right" }}>
                            {s.target_watts != null ? `${s.target_watts} w` : s.target_pace_sec_per_km != null ? `${formatClock(s.target_pace_sec_per_km / 60)}/km` : "—"}
                          </span>
                          <span className="mono" style={{ fontSize: 13, textAlign: "right", color: "#8C8578" }}>{formatClock(elapsed)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Reveal>
            );
          })}

          {/* The transitions, as one honest figure rather than two invented ones. */}
          {(() => {
            const legTotal = plan.splits.reduce((a, b) => a + b.split_minutes, 0);
            const transitions = (plan.projected_minutes ?? 0) - legTotal;
            if (transitions <= 0.05) return null;
            return (
              <div style={{ padding: "18px 22px", borderRadius: 10, background: "rgba(21,20,15,.04)", fontSize: 14, lineHeight: 1.55, color: "#5C574B" }}>
                <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>TRANSITIONS</span>
                <span style={{ marginLeft: 14 }}>
                  <span className="mono" style={{ fontSize: 15, color: "#15140F" }}>{formatClock(transitions)}</span> across both, from the projected finish less the three legs.
                  The plan does not split T1 from T2, so neither does this.
                </span>
              </div>
            );
          })()}
        </section>
      )}

      {/* ---------------- Fuelling ---------------- */}
      {tab === "fuel" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
              {plan.fuelling.total_carb_g} g, and where each of it goes in.
            </Reveal>
            {plan.fuelling.overridden && (
              <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#A0701A", paddingBottom: 6 }}>CARRIES AN OVERRIDE</Reveal>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[
              { label: "CARB / HR", value: `${plan.fuelling.carb_g_per_hr} g`, key: plan.fuelling.binding_carb_key },
              { label: "FLUID / HR", value: `${plan.fuelling.fluid_ml_per_hr} ml`, key: plan.fuelling.binding_fluid_key },
              { label: "SODIUM / HR", value: `${plan.fuelling.sodium_mg_per_hr} mg`, key: plan.fuelling.binding_sodium_key },
              { label: "CAFFEINE, TOTAL", value: `${plan.fuelling.caffeine_mg_total} mg`, key: plan.fuelling.binding_caffeine_key },
            ].map((c) => (
              <div key={c.label} style={{ background: "#FBF8F2", borderRadius: 12, padding: "24px 26px", boxShadow: "0 1px 2px rgba(21,20,15,.04)" }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>{c.label}</div>
                <div className="mono" style={{ fontSize: 30, marginTop: 10 }}>{c.value}</div>
                <div className="mono" style={{ fontSize: 9, color: "#8C8578", marginTop: 8 }}>{(c.key ?? "").replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>

          {plan.fuelling.requires_multiple_transportable && (
            <div style={{ marginTop: 14, padding: "16px 20px", borderRadius: 9, background: "rgba(79,124,147,.07)", border: "1px solid rgba(79,124,147,.26)", fontSize: 14.5, color: "#3D3A31" }}>
              This rate needs more than one transportable carbohydrate. A single-source product will not absorb fast enough.
            </div>
          )}

          {/* buildFuelBars() survives — derived from the real cumulative totals. */}
          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px", marginTop: 16 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>CARBOHYDRATE IN, ACROSS THE DAY</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 150, marginTop: 20 }}>
              {plan.aid_actions.map((a) => (
                <div
                  key={a.ordinal}
                  title={`${a.station_name} · ${Math.round(a.cumulative_carb_g)} g by km ${a.at_km}`}
                  style={{ flex: 1, height: `${maxCumCarb ? (a.cumulative_carb_g / maxCumCarb) * 100 : 0}%`, background: LEG_COLOR[a.leg], opacity: 0.85, borderRadius: "2px 2px 0 0", minWidth: 3 }}
                />
              ))}
            </div>
            <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#A8A192", marginTop: 8 }}>
              <span>0 g</span><span>{Math.round(maxCumCarb)} g</span>
            </div>
          </div>

          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "10px 30px 22px", marginTop: 16 }}>
            {plan.aid_actions.map((a) => (
              <div key={a.ordinal} style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr) 90px", gap: 18, alignItems: "baseline", padding: "14px 0", borderBottom: "1px solid rgba(21,20,15,.06)" }}>
                <span className="mono" style={{ fontSize: 12.5, color: "#8C8578" }}>
                  {wallClock(plan.start_time_local, a.at_clock_minutes)} · km {a.at_km}
                </span>
                <span>
                  <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{a.station_name}</span>
                  <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 3 }}>{a.action_text}</span>
                </span>
                <span className="mono" style={{ fontSize: 13.5, textAlign: "right" }}>{Math.round(a.cumulative_carb_g)} g</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------- Bags ---------------- */}
      {tab === "bags" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <Reveal as="h2" style={{ margin: "0 0 34px", fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
            {plan.bags.length} bags, every item with a reason.
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr)", gap: 20, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.bags.map((b, i) => {
                const on = i === bagIdx;
                return (
                  <div key={b.key} onClick={() => setBagIdx(i)} style={{ padding: "16px 18px", borderRadius: 10, cursor: "pointer", background: on ? "#15140F" : "#FBF8F2", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.1)"}` }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.02em", color: on ? "#FBF8F2" : "#15140F" }}>{b.name}</div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: on ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 6 }}>{b.item_count} ITEMS · {b.when_label.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px" }}>
              {(plan.bags[bagIdx]?.items ?? []).map((item) => {
                const id = `${plan.bags[bagIdx].key}:${item.ordinal}`;
                const done = packed[id];
                return (
                  <div key={item.ordinal} onClick={() => setPacked((p) => ({ ...p, [id]: !p[id] }))} style={{ display: "grid", gridTemplateColumns: "22px minmax(0,1fr) 70px", gap: 16, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.06)", cursor: "pointer" }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: 4, marginTop: 2, background: done ? "#5C9E72" : "transparent", border: `1px solid ${done ? "#5C9E72" : "rgba(21,20,15,.22)"}` }}>
                      {done && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em", color: done ? "#A8A192" : "#15140F", textDecoration: done ? "line-through" : undefined }}>
                        {item.name}
                        {item.is_user_added && <span className="mono" style={{ marginLeft: 10, fontSize: 8.5, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3, background: "rgba(21,20,15,.07)", color: "#5C574B" }}>ADDED BY YOU</span>}
                      </div>
                      {item.note && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 4 }}>{item.note}</div>}
                      {item.reason_text && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#6B6455", marginTop: 4 }}>{item.reason_text}</div>}
                      {item.reason_constraint_key && (
                        <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#A8A192", marginTop: 5 }}>{item.reason_constraint_key.replace(/_/g, " ")}</div>
                      )}
                    </div>
                    <span className="mono" style={{ fontSize: 15, textAlign: "right" }}>{item.qty ?? ""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------------- Course ---------------- */}
      {tab === "course" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <Reveal as="h2" style={{ margin: "0 0 34px", fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>The course you solved against.</Reveal>
          {recon.isPending && <Skeleton width="100%" height={420} radius={12} />}
          {recon.error && <ApiErrorState error={recon.error} onRetry={() => void recon.refetch()} />}
          {recon.data && (() => {
            const legs = sortLegs(recon.data.legs);
            const bike = recon.data.elevation_profile?.legs?.BIKE;
            const chart = bike ? elevationPath(bike, { width: 1180, top: 8, bottom: 120 }) : null;
            return (
              <>
                {/* The same renderer as everywhere else. An athlete looking at
                    the course they solved against should be looking at the same
                    map they chose it from. */}
                <SurveyedMap
                  courseRef={recon.data.course.slug}
                  courseName={plan.course_name ?? undefined}
                  height="min(66vh,700px)"
                />
                {chart && (
                  <div style={{ background: "#15140F", borderRadius: 12, padding: "20px 24px 18px", marginTop: 14 }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}>
                      BIKE ELEVATION
                    </div>
                    <svg viewBox="0 0 1180 128" style={{ display: "block", width: "100%", marginTop: 12 }} role="img" aria-label={`Bike elevation profile for ${plan.course_name}`}>
                      <defs>
                        <linearGradient id="pl-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E4622F" stopOpacity={0.26} />
                          <stop offset="100%" stopColor="#E4622F" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <path d={chart.area} fill="url(#pl-fill)" />
                      <path d={chart.line} fill="none" stroke="#E4622F" strokeWidth={1.7} strokeLinejoin="round" />
                    </svg>
                    <OsmAttribution attribution={recon.data.bundle.attribution} tone="dark" style={{ marginTop: 10 }} />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${legs.length},1fr)`, gap: 14, marginTop: 16 }}>
                  {legs.map((l) => (
                    <div key={l.leg} style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 24px" }}>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{l.leg}</div>
                      <div className="mono" style={{ fontSize: 26, marginTop: 10 }}>{formatKm(l.distance_m)}<span style={{ fontSize: 13, color: "#8C8578" }}> km</span></div>
                      <div style={{ fontSize: 13.5, color: "#5C574B", marginTop: 8 }}>{formatMetres(l.elevation_gain_m)} m gain · {l.surface_quality.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </section>
      )}

      {/* ---------------- Conditions ---------------- */}
      {tab === "cond" && (
        <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginBottom: 34 }}>
            <Reveal as="h2" style={{ margin: 0, fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>What this plan assumed.</Reveal>
            <Reveal as="span" className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578", paddingBottom: 6 }}>THE SNAPSHOT THE SOLVE USED</Reveal>
          </div>
          {plan.forecast_snapshot ? (
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
              <Reveal style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>FORECAST AT SOLVE TIME</div>
                {(() => {
                  const f = plan.forecast_snapshot as Record<string, number | string | null>;
                  const temp = typeof f.temp_c === "number" ? f.temp_c : null;
                  const rows: { l: string; v: string }[] = [];
                  if (typeof f.wind_speed_ms === "number") rows.push({ l: "WIND", v: `${(f.wind_speed_ms * 3.6).toFixed(0)} km/h` });
                  if (typeof f.humidity === "number") rows.push({ l: "HUMIDITY", v: `${f.humidity}%` });
                  if (typeof f.water_temp_c === "number") rows.push({ l: "WATER", v: `${f.water_temp_c}°C` });
                  if (typeof f.conditions === "string") rows.push({ l: "CONDITIONS", v: f.conditions.replace(/_/g, " ") });
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 20 }}>
                        <span className="mono" style={{ fontSize: 62, lineHeight: 0.85, letterSpacing: "-.05em" }}>{temp == null ? "—" : `${temp}°`}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px 26px", marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                        {rows.map((s) => (
                          <div key={s.l}>
                            <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{s.l}</div>
                            <div className="mono" style={{ fontSize: 18, marginTop: 7 }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </Reveal>
              <LiveForecastCard plan={plan} />
              <Reveal delay={0.08} style={{ gridColumn: "1 / -1", background: "#FBF8F2", borderRadius: 12, padding: "28px 30px" }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>READINESS</div>
                <div className="mono" style={{ fontSize: 44, marginTop: 18 }}>
                  {plan.readiness_fraction == null ? "—" : `${Math.round(plan.readiness_fraction * 100)}%`}
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: "#5C574B", marginTop: 12 }}>
                  {plan.readiness_note ?? "How much of this plan rests on values you gave rather than values we assumed."}
                </div>
                {plan.assumed_fields && plan.assumed_fields.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(21,20,15,.08)" }}>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A0701A" }}>ASSUMED</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "#6B6455", marginTop: 8 }}>
                      {plan.assumed_fields.map((f) => f.replace(/[._]/g, " ")).join(" · ")}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          ) : (
            /*
              No before/after heat table: nothing serves it. The prototype's
              HEAT_ROWS were invented, as were the median air temperature, the
              wetsuit likelihood and "nine of eleven editions".
            */
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16 }}>
              <div style={{ padding: "40px 34px", background: "#FBF8F2", border: "1px dashed rgba(21,20,15,.2)", borderRadius: 12 }}>
                <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NO SNAPSHOT</div>
                <p style={{ margin: "14px 0 0", maxWidth: 560, fontSize: 16, lineHeight: 1.55, color: "#5C574B" }}>
                  This plan was solved without a forecast attached. A forecast is an improvement to a
                  plan, not a precondition for one — it is picked up on the next re-solve.
                </p>
              </div>
              {/* The plan has no snapshot, but the race still has a date and a
                  place, so the live reading is exactly what this case needs. */}
              <LiveForecastCard plan={plan} />
            </div>
          )}
        </section>
      )}

      {/* ---------------- Exports ---------------- */}
      {tab === "exports" && <ExportsTab plan={plan} />}
    </div>
  );
}

/**
 * The forecast as it stands now, beside the one the plan was solved on.
 *
 * The snapshot the plan carries is frozen at solve time and stays frozen — a
 * plan's numbers do not change under the athlete. That is the right behaviour
 * and it leaves a gap this card fills: without it, a plan solved a fortnight
 * ago against a 19 °C forecast shows 19 °C on race week and looks current.
 *
 * `available: false` arrives as a 200 with a reason, because "no forecast" has
 * several ordinary causes and each wants different words. Nothing here invents
 * a number: when there is no live reading, the card says why and stops.
 */
function LiveForecastCard({ plan }: { plan: SolvedPlan }) {
  const { data, isPending, error } = useRaceForecast(plan.race_id);
  const snapshot = (plan.forecast_snapshot ?? {}) as Record<string, number | string | null>;

  const shift = (key: "temp_c" | "wind_speed_ms" | "water_temp_c"): number | null => {
    const then = snapshot[key];
    const now = data?.[key];
    if (typeof then !== "number" || typeof now !== "number") return null;
    return now - then;
  };

  const tempShift = shift("temp_c");

  return (
    <Reveal delay={0.04} style={{ background: "#FBF8F2", borderRadius: 12, padding: "28px 30px" }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8C8578" }}>
        FORECAST NOW
      </div>

      {isPending && <Skeleton style={{ height: 150, marginTop: 20, borderRadius: 8 }} />}

      {/* A live forecast is an improvement, never a precondition. A fault
          fetching it must not take the tab down with it. */}
      {!isPending && error && (
        <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
          The current forecast could not be read just now. The plan above is unaffected —
          it carries its own snapshot.
        </p>
      )}

      {!isPending && !error && data && !data.available && (
        <p style={{ margin: "20px 0 0", fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
          {data.unavailable_reason === "beyond_horizon"
            ? `Race day is ${data.days_away} days out. A forecast that far ahead is noise, so we do not show one — it arrives about ${Math.round((data.horizon_hours ?? 0) / 24)} days before the start.`
            : "No current forecast is reachable right now. Your plan is unaffected — it carries the snapshot it was solved on."}
        </p>
      )}

      {!isPending && !error && data?.available && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 20 }}>
            <span className="mono" style={{ fontSize: 62, lineHeight: 0.85, letterSpacing: "-.05em" }}>
              {typeof data.temp_c === "number" ? `${data.temp_c}°` : "—"}
            </span>
            {tempShift !== null && Math.abs(tempShift) >= 0.5 && (
              <span
                className="mono"
                style={{ fontSize: 15, color: Math.abs(tempShift) >= 3 ? "#E4622F" : "#8C8578" }}
              >
                {tempShift > 0 ? "+" : "−"}
                {Math.abs(tempShift).toFixed(1)}° vs the plan
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px 26px", marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(21,20,15,.08)" }}>
            {[
              typeof data.wind_speed_ms === "number"
                ? { l: "WIND", v: `${(data.wind_speed_ms * 3.6).toFixed(0)} km/h` }
                : null,
              typeof data.humidity === "number" ? { l: "HUMIDITY", v: `${data.humidity}%` } : null,
              typeof data.water_temp_c === "number" ? { l: "WATER", v: `${data.water_temp_c}°C` } : null,
              typeof data.conditions === "string"
                ? { l: "CONDITIONS", v: data.conditions.replace(/_/g, " ") }
                : null,
            ]
              .filter((row): row is { l: string; v: string } => row !== null)
              .map((row) => (
                <div key={row.l}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#8C8578" }}>{row.l}</div>
                  <div className="mono" style={{ fontSize: 18, marginTop: 7 }}>{row.v}</div>
                </div>
              ))}
          </div>

          {data.for_local_time && (
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A8A192", marginTop: 22 }}>
              FOR THE START HOUR · {data.for_local_time}
            </div>
          )}

          {/* The plan is not re-solved from here. Drift decides whether a
              move is large enough to be worth a new version, and says what it
              costs; a card that silently re-solved would be Law 3 broken. */}
          {tempShift !== null && Math.abs(tempShift) >= 3 && (
            <p style={{ margin: "16px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#6B6455" }}>
              This plan was solved against a different day. Re-solving picks up the current
              forecast; your existing version stays readable either way.
            </p>
          )}
        </>
      )}
    </Reveal>
  );
}

/**
 * The five downloads.
 *
 * A 503 on either PDF means the host lacks the native libraries WeasyPrint
 * needs. That degrades one row — .fit, .gpx and .ics are unaffected — so it is
 * caught per-row rather than failing the tab.
 */
function ExportsTab({ plan }: { plan: SolvedPlan }) {
  const manifest = useExportManifest(plan.id);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [failures, setFailures] = useState<Record<string, ApiError>>({});

  const run = async (entry: ExportEntry) => {
    setBusyKey(entry.key);
    setFailures((f) => {
      const next = { ...f };
      delete next[entry.key];
      return next;
    });
    try {
      await downloadExport(entry, manifest.data?.plan_version ?? plan.version);
    } catch (caught) {
      if (caught instanceof ApiError) setFailures((f) => ({ ...f, [entry.key]: caught }));
      else throw caught;
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section style={{ maxWidth: 1360, margin: "0 auto", padding: "72px 56px 88px" }}>
      <Reveal as="h2" style={{ margin: "0 0 12px", fontSize: 44, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>Take it with you.</Reveal>
      <p style={{ margin: "0 0 34px", maxWidth: 620, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
        The bag manifests are one PDF with a page per bag, not five files.
      </p>

      {manifest.isPending && <Skeleton width="100%" height={280} radius={12} />}
      {manifest.error && <ApiErrorState error={manifest.error} onRetry={() => void manifest.refetch()} />}

      {manifest.data && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {manifest.data.exports.map((entry) => {
              const failure = failures[entry.key];
              const degraded = failure?.code === "SERVICE_UNAVAILABLE" || failure?.status === 503;
              return (
                <div key={entry.key} style={{ background: "#FBF8F2", borderRadius: 12, padding: "22px 26px", border: `1px solid ${degraded ? "rgba(224,163,60,.4)" : "rgba(21,20,15,.1)"}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.024em" }}>{entry.label}</div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "#6B6455", marginTop: 5 }}>{entry.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void run(entry)}
                      disabled={busyKey === entry.key}
                      className="btn-outline-dark2"
                      style={{ flex: "none", height: 44, padding: "0 20px", border: "1px solid rgba(21,20,15,.18)", background: "transparent", borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: busyKey === entry.key ? "wait" : "pointer" }}
                    >
                      {busyKey === entry.key ? "Preparing…" : "Download"}
                    </button>
                  </div>
                  {failure && (
                    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 8, background: degraded ? "rgba(224,163,60,.1)" : "rgba(192,57,43,.07)", border: `1px solid ${degraded ? "rgba(224,163,60,.34)" : "rgba(192,57,43,.28)"}` }}>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: degraded ? "#A0701A" : "#A03227" }}>
                        {degraded ? "UNAVAILABLE ON THIS HOST" : "DOWNLOAD FAILED"}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#3D3A31", marginTop: 7 }}>
                        {degraded
                          ? "PDF rendering is not available on the server right now. The .fit, .gpx and .ics exports are unaffected and still work."
                          : failure.message}
                      </div>
                      {failure.requestId && (
                        <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 7 }}>REQUEST ID · {failure.requestId}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/*
            Getting a course file onto a head unit. This direction works and
            stays: it is a file the athlete copies, not an integration — nothing
            reads from a device or connects to an account.
          */}
          <div style={{ background: "#FBF8F2", borderRadius: 12, padding: "26px 30px", marginTop: 20 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>GETTING THE COURSE ONTO YOUR HEAD UNIT</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(Object.keys(manifest.data.import_instructions).length, 1)},1fr)`, gap: 22, marginTop: 18 }}>
              {Object.entries(manifest.data.import_instructions).map(([device, steps]) => (
                <div key={device}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#A8A192" }}>{device.toUpperCase()}</div>
                  <ol style={{ margin: "10px 0 0", paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "#5C574B" }}>
                    {steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          <OsmAttribution attribution={manifest.data.attribution} style={{ marginTop: 18 }} />
        </>
      )}
    </section>
  );
}

function PlanSkeleton() {
  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="racePlan" />
      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "34px 56px 0" }}>
        <Skeleton width={320} height={10} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 26 }}>
          <Skeleton width={180} height={22} />
          <Skeleton width={620} height={70} />
          <Skeleton width={460} height={16} />
        </div>
        <Skeleton width="100%" height={120} radius={12} style={{ marginTop: 36 }} />
        <Skeleton width="100%" height={420} radius={12} style={{ marginTop: 40 }} />
      </section>
    </div>
  );
}

export default function RacePlanPage() {
  return (
    <GuardedPage>
      <Suspense fallback={<PlanSkeleton />}>
        <PlanScreen />
      </Suspense>
    </GuardedPage>
  );
}
