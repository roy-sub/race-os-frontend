/**
 * Prices and entitlements.
 *
 * Gating is driven entirely by `GET /entitlements`: it returns every gated
 * action with a verdict, a reason and the tiers that would unlock it, so no
 * screen has to encode which tier buys what. When that table changes, the UI
 * follows without a release.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Entitlement = components["schemas"]["EntitlementOut"];
export type Price = components["schemas"]["PriceOut"];
export type UserTier = components["schemas"]["UserTier"];
export type Currency = components["schemas"]["Currency"];
export type Subscription = components["schemas"]["SubscriptionOut"];

export function usePrices() {
  return useQuery({
    queryKey: queryKeys.billing.prices(),
    queryFn: () => unwrap(client.GET("/api/v1/prices")),
    staleTime: Infinity,
  });
}

export function useEntitlements(raceId?: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.entitlements(raceId),
    enabled,
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/entitlements", {
          params: { query: { race_id: raceId ?? undefined } },
        }),
      ),
  });
}

/** Look one action up by name. Absent means the API did not mention it. */
export function findEntitlement(rows: Entitlement[] | undefined, action: string): Entitlement | undefined {
  return rows?.find((r) => r.action === action);
}

const CURRENCY_SYMBOL: Record<string, string> = { GBP: "£", USD: "$", EUR: "€" };

/** `1500, "GBP" -> "£15"`. Whole units where the price is whole, as the API's are. */
export function formatPrice(amountCents: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const units = amountCents / 100;
  return `${symbol}${Number.isInteger(units) ? units : units.toFixed(2)}`;
}

/** The price for one tier in the currency the user's account bills in. */
export function priceFor(
  prices: Price[] | undefined,
  tier: UserTier,
  currency: Currency = "GBP",
): Price | undefined {
  return (
    prices?.find((p) => p.tier === tier && p.currency === currency) ??
    prices?.find((p) => p.tier === tier)
  );
}


// --- subscriptions ---------------------------------------------------------

/**
 * Every agreement this account has had, newest first.
 *
 * Cancelled ones are included deliberately: a past subscription is history the
 * billing page has to be able to show, and hiding it would make an athlete
 * who cancelled last month look like one who never subscribed.
 */
export function useSubscriptions() {
  return useQuery({
    queryKey: queryKeys.billing.subscriptions(),
    queryFn: () => unwrap(client.GET("/api/v1/subscriptions")),
  });
}

/** The live one, if there is one. */
export function activeSubscription(rows: Subscription[] | undefined): Subscription | undefined {
  return rows?.find((row) => row.status === "active" || row.status === "past_due");
}

/**
 * Buy a season pass or a coach seat.
 *
 * Not the two-phase flow a race plan uses. A plan is authorised and only
 * charged once the solve succeeds, because the athlete might not get what they
 * paid for; a subscription is to a service that is available the moment it
 * starts. `client_secret` comes back when the provider needs a card confirmed
 * first, and is absent — successfully — for a returning customer.
 *
 * Invalidates entitlements as well as subscriptions: what this purchase is
 * *for* is the actions it unlocks, and the screen has to show them unlocked.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tier: UserTier) =>
      unwrap(client.POST("/api/v1/subscriptions", { body: { tier } })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

/**
 * Stop renewing. **Nothing already paid for is taken away.**
 *
 * The agreement stays active until the period the athlete has paid for ends,
 * and every race they were charged for stays theirs permanently regardless —
 * that one is a purchase, not a subscription.
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      unwrap(
        client.POST("/api/v1/subscriptions/{subscription_id}/cancel", {
          params: { path: { subscription_id: subscriptionId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}

/** Undo a cancellation that has not taken effect yet. */
export function useResumeSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      unwrap(
        client.POST("/api/v1/subscriptions/{subscription_id}/resume", {
          params: { path: { subscription_id: subscriptionId } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
    },
  });
}
