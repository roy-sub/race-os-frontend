"use client";

/**
 * The paywall, driven entirely by the entitlement the API returned.
 *
 * Nothing here encodes which tier unlocks what. `GET /entitlements` returns
 * every gated action with `allowed`, `reason`, `required_tiers` and
 * `purchasable_per_race`, and a 402 carries the same fields in `details` — so
 * the UI can offer the *right* upgrade rather than a generic wall, and a
 * pricing change is a backend change.
 */

import type { Entitlement, Price } from "@/lib/api/billing";
import { formatPrice, priceFor } from "@/lib/api/billing";
import type { PaymentRequiredDetails } from "@/lib/api/errors";

type Gate = {
  reason: string;
  requiredTiers: string[];
  purchasablePerRace: boolean;
};

/** Both sources of truth — the entitlement row and the 402 — reduce to this. */
export function gateFromEntitlement(row: Entitlement | undefined): Gate | null {
  if (!row || row.allowed) return null;
  return {
    reason: row.reason,
    requiredTiers: row.required_tiers ?? [],
    purchasablePerRace: row.purchasable_per_race ?? false,
  };
}

export function gateFromPaymentRequired(details: PaymentRequiredDetails | null, message: string): Gate | null {
  if (!details) return null;
  return {
    reason: message,
    requiredTiers: details.required_tiers ?? [],
    purchasablePerRace: details.purchasable_per_race ?? false,
  };
}

export function Paywall({
  gate,
  prices,
  busy,
  onBuyRace,
  requestId,
}: {
  gate: Gate;
  prices: Price[] | undefined;
  busy?: boolean;
  onBuyRace: () => void;
  requestId?: string;
}) {
  const perRace = priceFor(prices, "per_race", "GBP");
  // Only the tiers the API actually named, priced from the API's own table.
  const subscriptionTiers = gate.requiredTiers
    .filter((t) => t !== "per_race")
    .map((tier) => ({ tier, price: priceFor(prices, tier as Price["tier"], "GBP") }));

  return (
    <div
      style={{
        borderRadius: 12,
        padding: "30px 32px",
        background: "rgba(79,124,147,.07)",
        border: "1px solid rgba(79,124,147,.28)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4F7C93" }} />
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#3D6478" }}>
          PAYMENT REQUIRED
        </span>
      </div>

      {/* The server's own reason. It knows what this account holds; we do not. */}
      <p style={{ margin: "15px 0 0", maxWidth: 620, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.032em" }}>
        {gate.reason}
      </p>
      <p style={{ margin: "12px 0 0", maxWidth: 560, fontSize: 15, lineHeight: 1.55, color: "#5C574B" }}>
        Everything you have entered is saved and nothing has been charged. Payment is only taken
        after a solve completes — if it fails, the hold is voided.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        {gate.purchasablePerRace && (
          <button
            type="button"
            onClick={onBuyRace}
            disabled={busy}
            className="btn-accent"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10, height: 50, padding: "0 26px",
              background: busy ? "rgba(21,20,15,.12)" : "#E4622F", color: busy ? "#A8A192" : "#fff",
              border: 0, borderRadius: 7, fontSize: 15, fontWeight: 600, cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy && (
              <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .8s linear infinite" }} />
            )}
            {busy ? "Placing the hold…" : perRace ? `Buy this race · ${formatPrice(perRace.amount_cents, perRace.currency)}` : "Buy this race"}
          </button>
        )}

        {subscriptionTiers.map(({ tier, price }) => (
          <span
            key={tier}
            className="mono"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 18px", border: "1px solid rgba(21,20,15,.18)", borderRadius: 7, fontSize: 11, letterSpacing: ".1em", color: "#5C574B" }}
          >
            {tier.toUpperCase()}
            {price ? ` · ${formatPrice(price.amount_cents, price.currency)}` : ""}
          </span>
        ))}
      </div>

      {requestId && (
        <div className="mono" style={{ marginTop: 16, fontSize: 9.5, letterSpacing: ".12em", color: "#A8A192" }}>
          REQUEST ID · {requestId}
        </div>
      )}
    </div>
  );
}
