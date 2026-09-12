/**
 * Everything a signed-in athlete's own screens read.
 *
 * Every query here is **scoped to the caller by the server**, not by a
 * parameter this client sends: `/dashboard`, `/my-plans`, `/constraints`,
 * `/invoices` and the rest take no user id at all and answer for whoever the
 * access token belongs to. That is what makes it impossible for one athlete's
 * screen to render another's data by passing the wrong id — there is no id to
 * pass.
 *
 * The cache is the other half of that guarantee, and it is handled in
 * `AuthProvider`: the whole query cache is dropped on both sign-in and
 * sign-out, so nothing fetched as one user can survive into another's session.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Dashboard = components["schemas"]["DashboardOut"];
export type MyPlans = components["schemas"]["MyPlansOut"];
export type RaceCard = components["schemas"]["RaceCardOut"];
export type Race = components["schemas"]["RaceOut"];
export type Constraint = components["schemas"]["ConstraintOut"];
export type Preference = components["schemas"]["PreferenceOut"];
export type NotificationItem = components["schemas"]["NotificationOut"];
export type NotificationPage = components["schemas"]["NotificationPage"];
export type NotificationType = components["schemas"]["NotificationType"];
export type DriftSensitivity = components["schemas"]["DriftSensitivity"];
export type Invoice = components["schemas"]["InvoiceOut"];
export type UnitSystem = components["schemas"]["UnitSystem"];
export type ErasureImpact = components["schemas"]["ErasureImpactOut"];

// ---------------------------------------------------------------------------
// Dashboard and plans
// ---------------------------------------------------------------------------

export function useDashboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/dashboard")),
  });
}

export function useMyPlans(enabled = true) {
  return useQuery({
    queryKey: queryKeys.plans.mine(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/my-plans")),
  });
}

export function useRaces(enabled = true) {
  return useQuery({
    queryKey: queryKeys.races.list(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/races")),
  });
}

export function useDeleteRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (raceId: string) =>
      unwrap(client.DELETE("/api/v1/races/{race_id}", { params: { path: { race_id: raceId } } })),
    onSuccess: () => {
      // A race leaving changes the dashboard, My Plans and the race list at
      // once, so all three are invalidated rather than one patched by hand.
      void queryClient.invalidateQueries({ queryKey: queryKeys.races.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

export function useEnterRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      course_ref: string;
      event_date: string;
      start_time_local: string;
      bib?: string | null;
    }) => unwrap(client.POST("/api/v1/races", { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.races.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

export function useConstraints(enabled = true) {
  return useQuery({
    queryKey: queryKeys.constraints.list(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/constraints")),
  });
}

/**
 * Write one constraint.
 *
 * The source is always `manual` from this screen, because that is what it is:
 * the athlete typed it. Sending `measured` for a typed number would put a
 * confidence on it that nothing earned, and every screen downstream reads that
 * source to decide how much to trust the value.
 */
export function useSaveConstraint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: number }) =>
      unwrap(
        client.PUT("/api/v1/constraints/{key}", {
          params: { path: { key } },
          // The unit is the server's to decide: a constraint key has exactly
          // one, and letting a client send a different one is how a threshold
          // in watts becomes a threshold in something else.
          body: { value, source: "manual" },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.constraints.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export function useNotifications(
  params: { unread?: boolean; limit?: number; offset?: number } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    enabled,
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/notifications", {
          params: {
            query: {
              unread: params.unread ?? false,
              limit: params.limit ?? 25,
              offset: params.offset ?? 0,
            },
          },
        }),
      ),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        client.POST("/api/v1/notifications/{notification_id}/read", {
          params: { path: { notification_id: id } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(client.POST("/api/v1/notifications/read-all")),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function usePreferences(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/notification-preferences")),
  });
}

/**
 * Change one row of the channel matrix.
 *
 * In-app delivery for a critical type is **clamped by the server, not
 * rejected**, and the response carries the clamped value — so this writes back
 * what the server decided rather than what was asked for, and the toggle tells
 * the truth about what will actually happen.
 */
export function useSavePreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      typeKey,
      ...body
    }: {
      typeKey: NotificationType;
      channel_email?: boolean;
      channel_push?: boolean;
      channel_inapp?: boolean;
      drift_sensitivity?: DriftSensitivity;
    }) =>
      unwrap(
        client.PATCH("/api/v1/notification-preferences/{type_key}", {
          params: { path: { type_key: typeKey } },
          body,
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData<Preference[]>(queryKeys.notifications.preferences(), (rows) =>
        rows?.map((row) => (row.type_key === updated.type_key ? updated : row)),
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export function useInvoices(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.invoices(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/invoices")),
  });
}

// ---------------------------------------------------------------------------
// Formatting shared across the account screens
// ---------------------------------------------------------------------------

/** `2026-06-21` → `21 Jun 2026`. Absent stays absent; nothing is invented. */
// ---------------------------------------------------------------------------
// Deleting the account
// ---------------------------------------------------------------------------

/** The exact words the server demands. A boolean can be sent by mistake. */
export const ERASURE_CONFIRMATION = "DELETE MY ACCOUNT";

/**
 * What deleting this account would destroy, counted before anything is.
 *
 * Read separately from the delete so the numbers can be shown *in* the
 * confirmation rather than after it. "This removes 4 plans and 2 races" is a
 * decision someone can make; "are you sure?" is not.
 */
export function useErasureImpact(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.erasureImpact(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/auth/me/erasure-impact")),
    // Never served from cache: the figures are the whole basis of the
    // decision, and a stale count here understates what is about to go.
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * Erase this account.
 *
 * Irreversible, and the server refuses while a subscription is live — cancel
 * first, so nobody deletes their way into a charge they cannot see a receipt
 * for. The caller must send the exact confirmation string; this hook does not
 * fill it in, because a client that supplies its own confirmation defeats the
 * point of asking for one.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: ({ confirmation, reason }: { confirmation: string; reason?: string }) =>
      unwrap(
        client.DELETE("/api/v1/auth/me", {
          body: { confirmation, reason: reason || null },
        }),
      ),
  });
}

/**
 * The guided estimator: two questions in, one stamped estimate out.
 *
 * The server applies the result to the constraint and stamps it `ESTIMATED`
 * with a confidence and an evidence note. That provenance travels with the
 * number to the finish line — an estimate never becomes a measurement by
 * being saved, and nothing here lets a caller claim otherwise.
 */
export function useEstimateConstraint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, answers }: { key: string; answers: Record<string, number | boolean> }) =>
      unwrap(
        client.POST("/api/v1/constraints/{key}/estimate", {
          params: { path: { key } },
          // `answers` is `object` on the wire because each estimator asks
          // something different, so the generated type is `Record<string,
          // never>` and cannot be satisfied. The field names that matter are
          // pinned in `lib/estimator.ts` against the server's own reads.
          body: { answers } as unknown as { answers: Record<string, never> },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.constraints.all });
    },
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "—";
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** `07:10:00` → `07:10`. Seconds are noise on a start time. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  return value.slice(0, 5);
}

/** A countdown that reads the way an athlete says it: `6d`, `TODAY`, `RACED`. */
export function formatDaysAway(days: number | null | undefined): string {
  if (days == null) return "—";
  if (days === 0) return "TODAY";
  if (days < 0) return "RACED";
  return `${days}d`;
}
