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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
// Revenue and churn
// ---------------------------------------------------------------------------

/**
 * Money is reported **per currency and never summed**.
 *
 * The backend stores no exchange rate, so there is no honest single total to
 * show and this type deliberately offers none. A screen that wants one figure
 * has to pick a currency; it cannot add GBP to EUR by accident because there
 * is no field to add.
 */
export type CurrencyRevenue = {
  currency: string;
  invoiced_cents: number;
  refunded_cents: number;
  net_cents: number;
  invoice_count: number;
  refund_count: number;
};

export type Churn = {
  window_days: number;
  subscriptions_at_risk: number;
  subscriptions_lost: number;
  /** Null when nothing could churn. Undefined, not zero — never render 0%. */
  churn_pct: number | null;
  lost_by_tier: Record<string, number>;
  active_now: number;
};

export type RevenuePayload = {
  window_days: number;
  note: string;
  currencies: CurrencyRevenue[];
  churn: Churn;
};

export function useRevenue(days = 30, enabled = true) {
  return useQuery<RevenuePayload>({
    queryKey: queryKeys.admin.revenue(days),
    enabled,
    queryFn: async () =>
      (await unwrap(
        client.GET("/api/v1/admin/revenue", { params: { query: { days } } }),
      )) as unknown as RevenuePayload,
  });
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

/**
 * What the account-administration screen may know.
 *
 * There is no plan, race, constraint or physiology field here, and that is the
 * point rather than an omission: athlete content is reachable only through a
 * support-access grant the athlete approved, and every read of it is logged
 * back to them. This screen needs no consent to open, so it must not carry
 * anything that does.
 */
export type AccountRow = {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  account_state: string;
  is_coach: boolean;
  email_verified: boolean;
  roles: string[];
  created_at: string;
  subscription_status: string | null;
};

export type AccountPage = {
  /** Everything matching, not what fits on the page. */
  total: number;
  limit: number;
  offset: number;
  results: AccountRow[];
};

export type AccountDetail = AccountRow & {
  subscriptions: {
    id: string;
    tier: string;
    status: string;
    renews_at: string | null;
    cancel_at: string | null;
  }[];
  invoiced: { currency: string; amount_cents: number; count: number }[];
  plan_count: number;
  support_grant_count: number;
  /** The server's own sentence about what is deliberately not here. */
  athlete_data: string;
};

export type AdminRole = components["schemas"]["AdminRole"];
export type AccountState = components["schemas"]["AccountState"];
export type CurationStatus = components["schemas"]["CurationStatus"];
export type AccountTier = components["schemas"]["UserTier"];

export type AccountQuery = {
  q?: string | null;
  tier?: AccountTier | null;
  role?: AdminRole | null;
  state?: AccountState | null;
  limit?: number;
  offset?: number;
};

export function useAccounts(params: AccountQuery, enabled = true) {
  return useQuery<AccountPage>({
    queryKey: queryKeys.admin.users(params),
    enabled,
    queryFn: async () =>
      (await unwrap(
        client.GET("/api/v1/admin/users", {
          params: {
            query: {
              q: params.q || undefined,
              tier: params.tier || undefined,
              role: params.role || undefined,
              state: params.state || undefined,
              limit: params.limit,
              offset: params.offset,
            },
          },
        }),
      )) as unknown as AccountPage,
  });
}

export function useAccount(userId: string | null) {
  return useQuery<AccountDetail>({
    queryKey: queryKeys.admin.user(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: async () =>
      (await unwrap(
        client.GET("/api/v1/admin/users/{user_id}", {
          params: { path: { user_id: userId as string } },
        }),
      )) as unknown as AccountDetail,
  });
}

// ---------------------------------------------------------------------------
// Course curation
// ---------------------------------------------------------------------------

/**
 * A course an athlete submitted, awaiting or having had a decision.
 *
 * Publishing lists it to everyone; rejecting takes nothing away — it stays
 * usable by the athlete who added it, with a reason attached. Neither action
 * removes the submitter from the row, so a published course still reports
 * `is_user_submitted` in the directory.
 */
export type CurationRow = {
  course_id: string;
  slug: string;
  name: string;
  place: string | null;
  distance_type: string;
  event_date: string | null;
  submitted_by: string;
  submitted_by_email: string;
  submitted_at: string;
  curation_status: string;
  curation_note: string | null;
  curated_at: string | null;
  /** How many of the three legs built. Less than 3 is an incomplete course. */
  leg_count: number;
};

export type CurationPage = {
  total: number;
  limit: number;
  offset: number;
  results: CurationRow[];
};

export function useCurationQueue(
  status: CurationStatus | null = "unreviewed",
  enabled = true,
) {
  return useQuery<CurationPage>({
    queryKey: queryKeys.admin.curation(status),
    enabled,
    queryFn: async () =>
      (await unwrap(
        client.GET("/api/v1/admin/courses/submitted", {
          params: { query: { curation_status: status || undefined } },
        }),
      )) as unknown as CurationPage,
  });
}

export function usePublishCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, note }: { courseId: string; note?: string }) =>
      unwrap(
        client.POST("/api/v1/admin/courses/{course_id}/publish", {
          params: { path: { course_id: courseId } },
          body: { note: note || null },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      // The directory changed for everyone, not just this screen.
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useRejectCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, note }: { courseId: string; note: string }) =>
      unwrap(
        client.POST("/api/v1/admin/courses/{course_id}/reject", {
          params: { path: { course_id: courseId } },
          body: { note },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
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
