/**
 * The four screens whose payloads the backend types loosely.
 *
 * `GET /plans/{id}/race-mode`, `GET /admin/overview`, `GET /admin/kpis` and
 * `GET /admin/health` are annotated `dict[str, object]` server-side, so the
 * generated client sees nothing useful. Their shapes are asserted here, next to
 * the only calls that read them — the same treatment `GET /courses/{ref}/recon`
 * already gets, and for the same reason: an asserted shape belongs beside its
 * assertion, not scattered across the screens that trust it.
 *
 * Everything here is still scoped by the server. Race Mode is one plan's own
 * payload and the admin reads refuse anyone without the role.
 */

import { useQuery } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Split = components["schemas"]["SplitOut"];
export type Gate = components["schemas"]["GateOut"];
export type Bag = components["schemas"]["BagOut"];
export type AidAction = components["schemas"]["AidActionOut"];
export type Fuelling = components["schemas"]["FuellingOut"];
export type ConstraintRef = components["schemas"]["ConstraintRefOut"];
export type BoardRow = components["schemas"]["BoardRowOut"];
export type SharedPlan = components["schemas"]["SharedPlanOut"];

// ---------------------------------------------------------------------------
// Race Mode
// ---------------------------------------------------------------------------

/**
 * Everything race day needs, in one response.
 *
 * `offline.complete` is the server's own promise that this payload is the
 * whole screen — race day makes no further requests. That is why it is fetched
 * once with an infinite stale time rather than refetched on focus: a phone in
 * a transition bag should not be re-downloading a plan.
 */
export type RaceModePayload = {
  cached_at: string;
  plan: {
    id: string;
    version: number;
    solved_at: string;
    projected_label: string | null;
    feasibility: string;
    splits: Split[];
    gates: Gate[];
    fuelling: Fuelling | null;
    aid_actions: AidAction[];
    bags: Bag[];
    constraint_refs: ConstraintRef[];
    assumed_fields: string[];
  };
  race: {
    id: string;
    event_date: string;
    start_time_local: string;
    bib: string | null;
    timezone: string;
  };
  course: { id: string; name: string; place: string; distance_type: string; lat: number; lng: number };
  bundle: {
    version: string;
    provenance: string;
    attribution: string;
    barriers: { name: string; leg: string; km: number; limit_minutes_from_start: number }[];
    aid_stations: { name: string; leg: string; km: number; contents: string[] }[];
    waypoints: { name: string; leg: string; km: number; type: string }[];
  };
  forecast: Record<string, unknown>;
  pending_drift: { id: string; cause: string; severity: string; detected_at: string }[];
  offline: { complete: boolean; note: string };
};

export function useRaceMode(planId: string | null) {
  return useQuery<RaceModePayload>({
    queryKey: ["race-mode", planId ?? null],
    enabled: Boolean(planId),
    // The bundle is immutable and a solved version never changes, so there is
    // nothing to refetch — and a phone on a start line should not try.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const body = await unwrap(
        client.GET("/api/v1/plans/{plan_id}/race-mode", {
          params: { path: { plan_id: planId! } },
        }),
      );
      return body as unknown as RaceModePayload;
    },
  });
}

// ---------------------------------------------------------------------------
// Coach
// ---------------------------------------------------------------------------

export function useCoachBoard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.coach.board(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/coach/board")),
  });
}

export function useCoachAthletes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.coach.athletes(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/coach/athletes")),
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export type OpsOverview = {
  solver: { p50_ms: number | null; p95_ms: number | null; p99_ms: number | null; count?: number };
  sla_breaches_30d: number;
  accounts: Record<string, number>;
  published_bundles: number;
  pending_crowd_reports: number;
  open_support_grants: number;
  services: { name: string; status: string; note: string | null }[];
  phrasing_boundary: Record<string, unknown>;
};

export type KpiRow = {
  date: string;
  plans_solved: number | null;
  solver_p50_ms: number | null;
  solver_p95_ms: number | null;
  solver_p99_ms: number | null;
  total_accounts: number | null;
  paying_count: number | null;
  season_count: number | null;
  coach_seat_count: number | null;
  free_to_paid_pct: number | null;
};

export function useOpsOverview(enabled = true) {
  return useQuery<OpsOverview>({
    queryKey: queryKeys.admin.overview(),
    enabled,
    queryFn: async () =>
      (await unwrap(client.GET("/api/v1/admin/overview"))) as unknown as OpsOverview,
  });
}

export function useKpis(days = 30, enabled = true) {
  return useQuery<KpiRow[]>({
    queryKey: [...queryKeys.admin.kpis(), days],
    enabled,
    queryFn: async () =>
      (await unwrap(
        client.GET("/api/v1/admin/kpis", { params: { query: { days } } }),
      )) as unknown as KpiRow[],
  });
}

// ---------------------------------------------------------------------------
// A shared plan, by token
// ---------------------------------------------------------------------------

/**
 * Read a share link.
 *
 * Deliberately **not** authenticated: a share link is a capability, and the
 * person opening it may have no account at all. What comes back is filtered
 * server-side by the link's scope, field by field — no scope, including
 * `full_plan`, exposes a constraint value or anything about the account.
 */
export function useSharedPlan(token: string | null) {
  return useQuery<SharedPlan>({
    queryKey: queryKeys.shared.plan(token ?? ""),
    enabled: Boolean(token),
    retry: false,
    queryFn: () =>
      unwrap(client.GET("/api/v1/shared/{token}", { params: { path: { token: token! } } })),
  });
}
