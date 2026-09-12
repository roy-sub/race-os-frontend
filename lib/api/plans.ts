/**
 * Races, plans, constraints and the solve.
 *
 * The order matters and is not arbitrary: a plan is solved for a *race* —
 * this athlete, this course, this date — so a race must exist before a plan
 * can. That is why `POST /races` is step one of the builder rather than a
 * detail of it.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Race = components["schemas"]["RaceOut"];
export type PlanSummary = components["schemas"]["PlanSummary"];
export type PlanDetail = components["schemas"]["PlanDetail"];
export type PlanDraftPatch = components["schemas"]["PlanDraftPatch"];
export type Constraint = components["schemas"]["ConstraintOut"];
export type ConstraintSource = components["schemas"]["ConstraintSource"];
export type Estimate = components["schemas"]["EstimateOut"];
export type RiskLevel = components["schemas"]["RiskLevel"];
export type Split = components["schemas"]["SplitOut"];
export type Gate = components["schemas"]["GateOut"];
export type Bag = components["schemas"]["BagOut"];
export type AidAction = components["schemas"]["AidActionOut"];
export type ConstraintRef = components["schemas"]["ConstraintRefOut"];
export type Fuelling = components["schemas"]["FuellingOut"];

export type Segment = components["schemas"]["SegmentOut"];

/**
 * A plan that has actually been solved.
 *
 * `PlanDetail` types `splits`, `gates`, `bags`, `aid_actions`,
 * `constraint_refs`, `segments` and `fuelling` as optional, and that is
 * correct — a *draft* plan has none of them. Rather than optional-chaining
 * every read on a screen that only ever renders solved plans, the invariant is
 * stated once here: `asSolved` returns null for anything that is not solved,
 * and a non-null result is guaranteed to carry all of them.
 */
export type SolvedPlan = Omit<
  PlanDetail,
  "splits" | "gates" | "bags" | "aid_actions" | "constraint_refs" | "segments" | "fuelling"
> & {
  splits: Split[];
  gates: Gate[];
  bags: Bag[];
  aid_actions: AidAction[];
  constraint_refs: ConstraintRef[];
  segments: Segment[];
  fuelling: Fuelling;
};

export function asSolved(plan: PlanDetail | null | undefined): SolvedPlan | null {
  // `fuelling` is the tell: the solver produces it, so a plan carrying one has
  // been through the solver whatever its status says.
  if (!plan || plan.status === "draft" || !plan.fuelling) return null;
  return {
    ...plan,
    splits: plan.splits ?? [],
    gates: plan.gates ?? [],
    bags: plan.bags ?? [],
    aid_actions: plan.aid_actions ?? [],
    constraint_refs: plan.constraint_refs ?? [],
    segments: plan.segments ?? [],
    fuelling: plan.fuelling,
  };
}

// --- races -----------------------------------------------------------------

export function useRaces() {
  return useQuery({
    queryKey: queryKeys.races.list(),
    queryFn: () => unwrap(client.GET("/api/v1/races")),
  });
}

/**
 * Create the race, or get back the one that already exists.
 *
 * Re-posting the same course and date returns the existing race rather than a
 * duplicate, so a builder that is restarted does not litter the account with
 * near-identical races — and `plan_id` on the response is how the UI knows to
 * offer "continue" instead of "start another".
 */
export function useCreateRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: components["schemas"]["RaceCreate"]) =>
      unwrap(client.POST("/api/v1/races", { body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.races.all }),
  });
}

export type Forecast = components["schemas"]["ForecastOut"];

/**
 * The forecast for this race's start hour, **as it stands now**.
 *
 * Not the plan's `forecast_snapshot`. That one is frozen at solve time and
 * stays frozen — a plan's numbers do not change under the athlete. This is the
 * live reading to put beside it, so a plan solved against a forecast that has
 * since moved eight degrees says so instead of looking current.
 *
 * `available: false` is a normal answer, not a failure: the race may be beyond
 * the forecast horizon, or the provider may be down. Both arrive as a 200 with
 * a reason, so this query only enters its error state for a real fault.
 *
 * Refetched no more often than the backend's own cache would answer from — a
 * forecast that moves within five minutes is the provider being noisy, not the
 * weather changing.
 */
export function useRaceForecast(raceId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.races.forecast(raceId ?? ""),
    enabled: Boolean(raceId),
    staleTime: 5 * 60 * 1000,
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/races/{race_id}/forecast", {
          params: { path: { race_id: raceId! } },
        }),
      ),
  });
}

// --- plans -----------------------------------------------------------------

export function usePlan(planId: string | null) {
  return useQuery({
    queryKey: queryKeys.plans.detail(planId ?? ""),
    enabled: Boolean(planId),
    queryFn: () =>
      unwrap(client.GET("/api/v1/plans/{plan_id}", { params: { path: { plan_id: planId! } } })),
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (raceId: string) =>
      unwrap(client.POST("/api/v1/plans", { body: { race_id: raceId } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.plans.all }),
  });
}

/** One PATCH per builder step, so a half-finished plan survives a closed tab. */
export function useSaveDraft(planId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanDraftPatch) =>
      unwrap(
        client.PATCH("/api/v1/plans/{plan_id}/draft", {
          params: { path: { plan_id: planId! } },
          body,
        }),
      ),
    onSuccess: () => {
      if (planId) queryClient.invalidateQueries({ queryKey: queryKeys.plans.detail(planId) });
    },
  });
}

/**
 * The solve.
 *
 * Synchronous: it returns the finished plan, not a job to poll. An `INFEASIBLE`
 * result arrives as a 422 and is therefore *thrown* — the caller must catch it
 * and render a verdict, because it is an answer, not a fault.
 *
 * `force` bypasses the identical-input cache (the backend returns the previous
 * version byte-for-byte when nothing changed). It is not an override of
 * anything, so it is only passed when the athlete deliberately re-solves.
 */
export function useSolvePlan(planId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { carb_override?: number | null; force?: boolean } = {}) =>
      unwrap(
        client.POST("/api/v1/plans/{plan_id}/solve", {
          params: { path: { plan_id: planId! } },
          body: { carb_override: body.carb_override ?? null, force: body.force ?? false },
        }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    },
  });
}

// --- constraints -----------------------------------------------------------

/**
 * The eight canonical keys, in the order the builder shows them.
 *
 * `GET /constraints` returns only what an athlete has *set*, which for a new
 * account is nothing at all — so the list of keys has to come from somewhere,
 * and this is the frontend's copy of `raceos.domain.enums.CONSTRAINT_KEYS`.
 * The units come from the API with each value; these labels are presentation.
 */
export const CONSTRAINT_KEYS = [
  "swim_threshold_pace",
  "bike_threshold_power",
  "run_threshold_pace",
  "weight",
  "sweat_rate",
  "sodium_loss",
  "gut_carb_ceiling",
  "caffeine_tolerance",
] as const;

export type ConstraintKey = (typeof CONSTRAINT_KEYS)[number];

export const CONSTRAINT_LABELS: Record<ConstraintKey, string> = {
  swim_threshold_pace: "Swim threshold pace",
  bike_threshold_power: "Bike threshold power",
  run_threshold_pace: "Run threshold pace",
  weight: "Weight",
  sweat_rate: "Sweat rate",
  sodium_loss: "Sodium loss",
  gut_carb_ceiling: "Gut carbohydrate ceiling",
  caffeine_tolerance: "Caffeine tolerance",
};

/** The unit each key is displayed in, matching `CONSTRAINT_UNITS` backend-side. */
export const CONSTRAINT_UNITS: Record<ConstraintKey, string> = {
  swim_threshold_pace: "/100m",
  bike_threshold_power: "w",
  run_threshold_pace: "/km",
  weight: "kg",
  sweat_rate: "L/hr",
  sodium_loss: "mg/L",
  gut_carb_ceiling: "g/hr",
  caffeine_tolerance: "mg",
};

/**
 * What each estimator asks, mirroring the branches in
 * `POST /constraints/{key}/estimate`.
 *
 * Two questions at most, by design — the estimator's job is to produce the
 * athlete's real number as well as two questions can, and an estimated value
 * carries full numeric weight in the solver rather than a cautious discount.
 */
export type EstimatorField = {
  name: string;
  label: string;
  suffix?: string;
  type: "number" | "boolean";
  placeholder?: string;
};

export const ESTIMATORS: Partial<Record<ConstraintKey, EstimatorField[]>> = {
  swim_threshold_pace: [
    { name: "t400_seconds", label: "Your 400 m time", suffix: "seconds", type: "number", placeholder: "390" },
    { name: "t200_seconds", label: "Your 200 m time", suffix: "seconds", type: "number", placeholder: "185" },
  ],
  bike_threshold_power: [
    { name: "weight_kg", label: "Your weight", suffix: "kg", type: "number", placeholder: "72" },
  ],
  run_threshold_pace: [
    { name: "race_km", label: "A recent race distance", suffix: "km", type: "number", placeholder: "10" },
    { name: "race_seconds", label: "Your time for it", suffix: "seconds", type: "number", placeholder: "2700" },
  ],
  weight: [{ name: "weight_kg", label: "Your weight", suffix: "kg", type: "number", placeholder: "72" }],
  sweat_rate: [
    { name: "weight_before_kg", label: "Weight before a session", suffix: "kg", type: "number", placeholder: "72" },
    { name: "weight_after_kg", label: "Weight after it", suffix: "kg", type: "number", placeholder: "70.6" },
    { name: "fluid_ml", label: "Fluid drunk during it", suffix: "ml", type: "number", placeholder: "900" },
    { name: "minutes", label: "How long it was", suffix: "minutes", type: "number", placeholder: "90" },
  ],
  sodium_loss: [
    { name: "salty_sweater", label: "Do you finish sessions with salt on your skin?", type: "boolean" },
  ],
  gut_carb_ceiling: [
    { name: "trained_gut", label: "Have you practised high-carb fuelling in training?", type: "boolean" },
  ],
  caffeine_tolerance: [
    { name: "daily_cups", label: "Coffees on a normal day", suffix: "cups", type: "number", placeholder: "2" },
    { name: "weight_kg", label: "Your weight", suffix: "kg", type: "number", placeholder: "72" },
  ],
};

/**
 * The four sources, and nothing else.
 *
 * There is no FILE, no CALIBRATED and no IMPORTED: `measured` comes only from
 * post-race calibration, so before a race the honest options are a number the
 * athlete trusts (`manual`), a number from a test (`tested`), or the
 * estimator (`estimated`).
 */
export const SOURCE_LABELS: Record<ConstraintSource, string> = {
  measured: "MEASURED",
  tested: "TESTED",
  manual: "MANUAL",
  estimated: "ESTIMATED",
};

export const SOURCE_STYLE: Record<ConstraintSource, { bg: string; fg: string }> = {
  measured: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55" },
  tested: { bg: "rgba(124,192,143,.16)", fg: "#3E7B55" },
  manual: { bg: "rgba(21,20,15,.07)", fg: "#5C574B" },
  estimated: { bg: "rgba(224,163,60,.18)", fg: "#A0701A" },
};

export function useConstraints() {
  return useQuery({
    queryKey: queryKeys.constraints.list(),
    queryFn: () => unwrap(client.GET("/api/v1/constraints")),
  });
}

export function useWriteConstraint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, source }: { key: string; value: number; source: ConstraintSource }) =>
      unwrap(
        client.PUT("/api/v1/constraints/{key}", {
          params: { path: { key } },
          body: { value, source },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.constraints.all }),
  });
}

/** Writes the estimated value as well as returning it — `applied` says so. */
export function useEstimateConstraint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, answers }: { key: string; answers: Record<string, unknown> }) =>
      unwrap(
        client.POST("/api/v1/constraints/{key}/estimate", {
          params: { path: { key } },
          // `answers` is `dict[str, Any]` backend-side, which the generated
          // types render as an empty object; the real shape is per-estimator
          // and lives in ESTIMATORS above.
          body: { answers } as { answers: Record<string, never> },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.constraints.all }),
  });
}

// --- checkout --------------------------------------------------------------

/**
 * Place the hold. The capture happens inside the solve, on success only.
 *
 * A failed solve voids the authorization rather than capturing it, so nothing
 * is charged for a plan that did not come back — the backend has a test to
 * that effect, and `GET /invoices` stays empty after an INFEASIBLE.
 */
export function useAuthorizeCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, currency }: { planId: string; currency?: components["schemas"]["Currency"] }) =>
      unwrap(
        client.POST("/api/v1/checkout/authorize", {
          body: { plan_id: planId, currency: currency ?? "GBP" },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.billing.all }),
  });
}
