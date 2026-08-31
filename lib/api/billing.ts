/**
 * Prices and entitlements.
 *
 * Gating is driven entirely by `GET /entitlements`: it returns every gated
 * action with a verdict, a reason and the tiers that would unlock it, so no
 * screen has to encode which tier buys what. When that table changes, the UI
 * follows without a release.
 */

import { useQuery } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Entitlement = components["schemas"]["EntitlementOut"];
export type Price = components["schemas"]["PriceOut"];
export type UserTier = components["schemas"]["UserTier"];
export type Currency = components["schemas"]["Currency"];

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
