"use client";

/**
 * Settings — the signed-in athlete's own account, and nothing else.
 *
 * Every value on this screen used to be a module constant, which meant every
 * account that signed in read one particular person's name, thresholds and
 * invoices. Nothing on it is a constant now. The profile comes from
 * `GET /auth/me`, the constraints from `GET /constraints`, the channel matrix
 * from `GET /notification-preferences` and the billing history from
 * `GET /invoices` — none of which takes a user id, because each answers for
 * whoever the access token belongs to.
 *
 * Saving is per field rather than per form. A settings screen with one Save
 * button has to decide what to do with the fields nobody touched, and the
 * usual answer — send them all — is how an emergency contact the screen does
 * not render gets wiped.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { client, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  formatDate,
  useConstraints,
  useInvoices,
  usePreferences,
  useSaveConstraint,
  useSavePreference,
  type Constraint,
  type DriftSensitivity,
  type Preference,
} from "@/lib/api/account";
import { useEntitlements, usePrices, priceFor, formatPrice } from "@/lib/api/billing";
import {
  CONF_FG,
  SENSITIVITY,
  SRC_STYLE,
  STALE_FG,
  TABS,
  TIER_LABEL,
  constraintLabel,
  notificationDescription,
  notificationName,
  sortConstraints,
  type Tab,
} from "@/lib/settings";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

/** "Saved" / "Saving…" — the state of the last write, not a timer. */
type SaveState = "idle" | "saving" | "saved" | "error";

function useSaveIndicator() {
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return {
    state,
    saving: () => setState("saving"),
    saved: () => {
      setState("saved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setState("idle"), 2200);
    },
    failed: () => setState("error"),
  };
}

function SaveLabel({ state }: { state: SaveState }) {
  const copy =
    state === "saving"
      ? "SAVING…"
      : state === "saved"
        ? "SAVED"
        : state === "error"
          ? "NOT SAVED"
          : "ALL CHANGES SAVED";
  const color = state === "error" ? "#C0392B" : state === "saving" ? "#C6461B" : "#8C8578";
  return (
    <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color, whiteSpace: "nowrap" }}>
      {copy}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

type ProfileField = {
  key: "name" | "date_of_birth" | "country" | "emergency_contact_name" | "emergency_contact_phone";
  label: string;
  type?: "text" | "date";
  placeholder: string;
  hint?: string;
};

/**
 * The fields an athlete may change about themselves.
 *
 * Email is not among them, and that is deliberate: changing it is an identity
 * change that needs re-verification to be one, so it is shown as a fact with
 * its verification state rather than as an input that would quietly move
 * somebody's sign-in.
 */
const PROFILE_FIELDS: ProfileField[] = [
  { key: "name", label: "FULL NAME", placeholder: "Your name" },
  { key: "date_of_birth", label: "DATE OF BIRTH", type: "date", placeholder: "", hint: "Used for age-group cut-offs only." },
  { key: "country", label: "COUNTRY", placeholder: "Two-letter code, e.g. GB" },
  { key: "emergency_contact_name", label: "EMERGENCY CONTACT", placeholder: "Who to call" },
  { key: "emergency_contact_phone", label: "EMERGENCY PHONE", placeholder: "+44 …" },
];

function ProfileTab({ indicator }: { indicator: ReturnType<typeof useSaveIndicator> }) {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      unwrap(client.PATCH("/api/v1/auth/me", { body })),
    onMutate: () => indicator.saving(),
    onSuccess: async () => {
      await refresh();
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });
      indicator.saved();
    },
    onError: () => indicator.failed(),
  });

  if (!user) return <TabSkeleton />;

  /** Fires on blur, and only when the value actually moved. */
  function commit(key: ProfileField["key"], value: string) {
    const next = value.trim();
    const current = (user?.[key] as string | null | undefined) ?? "";
    if (next === current) return;
    save.mutate({ [key]: next || null });
  }

  return (
    <div className="om-rise">
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Profile</div>
      <p style={{ margin: "11px 0 0", maxWidth: 560, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
        Who you are, and how the solver talks to you. Each field saves when you leave it.
      </p>

      <div style={{ ...CARD, padding: "28px 30px", marginTop: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, paddingBottom: 24, borderBottom: "1px solid rgba(21,20,15,.08)" }}>
          <div
            aria-hidden
            style={{
              width: 66, height: 66, borderRadius: "50%", flex: "none", background: "#D8D0C2",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 600, color: "#5C574B", letterSpacing: "-.02em",
            }}
          >
            {(user.name?.trim() || user.email).slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.026em" }}>
              {user.name?.trim() || "No name set"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 5 }}>
              <span style={{ fontSize: 13.5, color: "#8C8578" }}>{user.email}</span>
              <span
                className="mono"
                style={{
                  fontSize: 8, letterSpacing: ".12em", padding: "2px 6px", borderRadius: 3,
                  background: user.email_verified_at ? "rgba(124,192,143,.18)" : "rgba(224,163,60,.18)",
                  color: user.email_verified_at ? "#3E7B55" : "#A0701A",
                }}
              >
                {user.email_verified_at ? "VERIFIED" : "UNVERIFIED"}
              </span>
            </div>
            {user.created_at && (
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".13em", color: "#A8A192", marginTop: 7 }}>
                MEMBER SINCE {formatDate(user.created_at).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "22px 26px", marginTop: 24 }}>
          {PROFILE_FIELDS.map((f) => (
            <div key={f.key}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{f.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, height: 46, marginTop: 10, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 8, background: "#fff" }}>
                <input
                  type={f.type ?? "text"}
                  defaultValue={(user[f.key] as string | null | undefined) ?? ""}
                  placeholder={f.placeholder}
                  onBlur={(e) => commit(f.key, e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontSize: 15, color: "#15140F", padding: 0, outline: "none" }}
                />
              </div>
              {f.hint && <div style={{ fontSize: 12, color: "#A8A192", marginTop: 7 }}>{f.hint}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginTop: 14 }}>
        <Choice
          label="UNITS"
          options={[
            { value: "metric", name: "Metric" },
            { value: "imperial", name: "Imperial" },
          ]}
          value={user.units}
          onChange={(units) => save.mutate({ units })}
        />
        <Choice
          label="EXPERIENCE"
          options={[
            { value: "first", name: "First one" },
            { value: "improver", name: "Improver" },
            { value: "experienced", name: "Experienced" },
          ]}
          value={user.level}
          onChange={(level) => save.mutate({ level })}
        />
      </div>
    </div>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; name: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div style={{ ...CARD, padding: "24px 26px" }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>{label}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <div
              key={o.value}
              onClick={() => !on && onChange(o.value)}
              className="seg-btn"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 42,
                borderRadius: 7, cursor: on ? "default" : "pointer",
                background: on ? "#15140F" : "#fff",
                border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.14)"}`,
                fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B", whiteSpace: "nowrap",
              }}
            >
              {o.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Constraints
// ---------------------------------------------------------------------------

/**
 * Confidence, as a bar.
 *
 * `confidence_pct` is the server's own figure where it has one. Where it does
 * not, the bar is empty rather than filled with a guess — an invented
 * confidence is worse than a visibly absent one, because it is believed.
 */
function ConstraintRow({
  row,
  onSave,
  indicator,
}: {
  row: Constraint;
  onSave: (key: string, value: number) => void;
  indicator: ReturnType<typeof useSaveIndicator>;
}) {
  const style = SRC_STYLE[row.source];
  const confidence = row.confidence_pct;
  const barColor = row.stale ? STALE_FG : CONF_FG[row.source];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1.5fr 132px", gap: 20, padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: barColor, flex: "none" }} />
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-.018em" }}>{constraintLabel(row.key)}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", height: 38, padding: "0 12px", border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, background: "#fff" }}>
        <input
          type="number"
          step="any"
          defaultValue={row.value}
          onBlur={(e) => {
            const next = Number(e.target.value);
            if (!Number.isFinite(next) || next === row.value) return;
            indicator.saving();
            onSave(row.key, next);
          }}
          style={{ flex: 1, minWidth: 0, border: 0, background: "transparent", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#15140F", padding: 0, outline: "none" }}
        />
        <span className="mono" style={{ fontSize: 10, color: "#A8A192", whiteSpace: "nowrap" }}>{row.unit}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(21,20,15,.09)", position: "relative", overflow: "hidden" }}>
          {confidence != null && (
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${confidence}%`, background: barColor, borderRadius: 2 }} />
          )}
        </span>
        <span className="mono" style={{ fontSize: 9, letterSpacing: ".11em", color: barColor, whiteSpace: "nowrap" }}>
          {row.stale
            ? "STALE"
            : confidence != null
              ? `${confidence}%`
              : row.measured_at
                ? `MEASURED ${formatDate(row.measured_at).toUpperCase()}`
                : "NO CONFIDENCE"}
        </span>
      </span>
      <span style={{ textAlign: "right" }}>
        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", padding: "4px 8px", borderRadius: 4, background: style.bg, color: style.fg, whiteSpace: "nowrap" }}>
          {style.label}
        </span>
      </span>
    </div>
  );
}

function ConstraintsTab({ indicator }: { indicator: ReturnType<typeof useSaveIndicator> }) {
  const { data, isPending, error, refetch } = useConstraints();
  const save = useSaveConstraint();
  const rows = useMemo(() => sortConstraints(data ?? []), [data]);

  return (
    <div className="om-rise">
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Constraints</div>
      <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
        The numbers every plan is solved against. Measured values come from races you have uploaded —
        you can override any of them, and the override is marked.
      </p>

      {error ? (
        <div style={{ marginTop: 26 }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </div>
      ) : (
        <div style={{ ...CARD, padding: "8px 30px 26px", marginTop: 26 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr .9fr 1.5fr 132px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
            <span>CONSTRAINT</span><span>VALUE</span><span>CONFIDENCE</span><span style={{ textAlign: "right" }}>SOURCE</span>
          </div>

          {isPending ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 20, padding: "18px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                <Skeleton width={190} height={16} /><Skeleton width={110} height={16} /><Skeleton width={200} height={16} />
              </div>
            ))
          ) : rows.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.026em" }}>Nothing measured yet.</div>
              <p style={{ margin: "10px auto 0", maxWidth: 420, fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                The plan builder asks for what it needs the first time you solve a race, and estimates
                the rest with the reason shown. Values you set here are used from then on.
              </p>
              <Link
                href={routes.planBuilder}
                className="btn-accent"
                style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", marginTop: 22, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}
              >
                Build a plan
              </Link>
            </div>
          ) : (
            rows.map((row) => (
              <ConstraintRow
                key={row.key}
                row={row}
                indicator={indicator}
                onSave={(key, value) =>
                  save.mutate({ key, value }, { onSuccess: indicator.saved, onError: indicator.failed })
                }
              />
            ))
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 22, padding: "16px 18px", borderRadius: 9, background: "rgba(228,98,47,.07)", border: "1px solid rgba(228,98,47,.28)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E4622F", flex: "none" }} />
            <span style={{ fontSize: 14.5, lineHeight: 1.45, color: "#3D3A31" }}>
              Changing a constraint does not change plans you have already solved. Each affected plan will offer a re-solve.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

function Toggle({
  on,
  locked,
  onChange,
}: {
  on: boolean;
  locked?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-disabled={locked}
      onClick={() => !locked && onChange(!on)}
      title={locked ? "This one cannot be switched off — you choose the channel, not whether the warning exists." : undefined}
      style={{
        justifySelf: "center", display: "flex", alignItems: "center", width: 40, height: 24, borderRadius: 12,
        cursor: locked ? "not-allowed" : "pointer",
        background: on ? "#E4622F" : "rgba(21,20,15,.16)",
        padding: 3, justifyContent: on ? "flex-end" : "flex-start", opacity: locked ? 0.55 : 1,
      }}
    >
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(21,20,15,.3)" }} />
    </span>
  );
}

function NotificationsTab({ indicator }: { indicator: ReturnType<typeof useSaveIndicator> }) {
  const { data, isPending, error, refetch } = usePreferences();
  const save = useSavePreference();

  function write(row: Preference, patch: Partial<Preference>) {
    indicator.saving();
    save.mutate(
      { typeKey: row.type_key, ...patch },
      { onSuccess: indicator.saved, onError: indicator.failed },
    );
  }

  /* Drift sensitivity lives on the drift row server-side, so the card below
     reads and writes that row rather than a separate setting. */
  const driftRow = data?.find((row) => row.type_key === "drift");

  return (
    <div className="om-rise">
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Notifications</div>
      <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
        We send few things, and everything we send is actionable. Nothing here is marketing.
      </p>

      {error ? (
        <div style={{ marginTop: 26 }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </div>
      ) : (
        <>
          <div style={{ ...CARD, padding: "8px 30px 20px", marginTop: 26 }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px 92px 92px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
              <span>EVENT</span><span style={{ textAlign: "center" }}>EMAIL</span><span style={{ textAlign: "center" }}>PUSH</span><span style={{ textAlign: "center" }}>IN-APP</span>
            </div>
            {isPending
              ? [0, 1, 2].map((i) => (
                  <div key={i} style={{ padding: "18px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
                    <Skeleton width={260} height={16} />
                  </div>
                ))
              : (data ?? []).map((row) => (
                  <div key={row.type_key} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 92px 92px 92px", gap: 20, padding: "17px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 15.5, fontWeight: 500, letterSpacing: "-.018em" }}>{notificationName(row.type_key)}</span>
                        {row.inapp_locked && (
                          <span className="mono" style={{ fontSize: 8, letterSpacing: ".11em", padding: "2px 6px", borderRadius: 3, background: "rgba(228,98,47,.16)", color: "#C6461B", whiteSpace: "nowrap" }}>
                            ALWAYS ON
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, color: "#8C8578", marginTop: 5 }}>{notificationDescription(row.type_key)}</div>
                    </div>
                    <Toggle on={row.channel_email} onChange={(channel_email) => write(row, { channel_email })} />
                    <Toggle on={row.channel_push} onChange={(channel_push) => write(row, { channel_push })} />
                    <Toggle on={row.channel_inapp} locked={row.inapp_locked} onChange={(channel_inapp) => write(row, { channel_inapp })} />
                  </div>
                ))}
          </div>

          {driftRow && (
            <div style={{ ...CARD, padding: "24px 26px", marginTop: 14 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>DRIFT SENSITIVITY</div>
              <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                {SENSITIVITY.map((sv) => {
                  const on = driftRow.drift_sensitivity === sv.k;
                  return (
                    <div
                      key={sv.k}
                      onClick={() => !on && write(driftRow, { drift_sensitivity: sv.k as DriftSensitivity })}
                      className="seg-btn"
                      style={{ flex: 1, padding: "12px 13px", borderRadius: 7, cursor: on ? "default" : "pointer", background: on ? "#15140F" : "#fff", border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.14)"}` }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-.018em", color: on ? "#FBF8F2" : "#15140F" }}>{sv.name}</div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.35, color: on ? "rgba(251,248,242,.5)" : "#8C8578", marginTop: 5 }}>{sv.d}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

function BillingTab() {
  const { user } = useAuth();
  const invoices = useInvoices();
  const prices = usePrices();
  const entitlements = useEntitlements();

  const tier = user?.tier ?? "free";
  const tierName = TIER_LABEL[tier] ?? tier;
  const price = priceFor(prices.data, tier === "free" ? "season" : tier, user?.currency ?? "GBP");
  const rows = invoices.data ?? [];

  /**
   * Entitlements are the honest statement of what this account can do, and
   * they come from the server's own decision table — so a developer account
   * with full access, an athlete on a season pass and an athlete who bought
   * one race all read correctly here without the screen knowing why.
   */
  const unlocked = (entitlements.data ?? []).filter((e) => e.allowed).length;
  const total = (entitlements.data ?? []).length;

  return (
    <div className="om-rise">
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.035em" }}>Billing</div>
      <p style={{ margin: "11px 0 0", maxWidth: 600, fontSize: 15.5, lineHeight: 1.55, color: "#5C574B" }}>
        Cancel any time. Every plan you have already solved stays yours at full function.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, marginTop: 26 }}>
        <div style={{ background: "#15140F", borderRadius: 12, padding: "28px 30px", boxShadow: "0 20px 50px -30px rgba(21,20,15,.5)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "rgba(251,248,242,.4)" }}>CURRENT PLAN</span>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".13em", color: tier === "free" ? "rgba(251,248,242,.5)" : "#7CC08F" }}>
              <span className="om-breathe" style={{ width: 5, height: 5, borderRadius: "50%", background: tier === "free" ? "#8C8578" : "#7CC08F" }} />
              {tier === "free" ? "NO SUBSCRIPTION" : "ACTIVE"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 16 }}>
            <span style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-.038em", color: "#FBF8F2" }}>{tierName}</span>
            {price && (
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 19, color: "rgba(251,248,242,.5)" }}>
                {formatPrice(price.amount_cents, price.currency)}
                {tier === "free" ? " to upgrade" : ""}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(251,248,242,.1)", borderRadius: 9, overflow: "hidden", marginTop: 24 }}>
            <div style={{ background: "#15140F", padding: "16px 18px" }}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: ".13em", color: "rgba(251,248,242,.35)" }}>FEATURES UNLOCKED</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 9 }}>
                {entitlements.isPending ? "—" : `${unlocked} of ${total}`}
              </div>
            </div>
            <div style={{ background: "#15140F", padding: "16px 18px" }}>
              <div className="mono" style={{ fontSize: 8, letterSpacing: ".13em", color: "rgba(251,248,242,.35)" }}>INVOICES</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 9 }}>
                {invoices.isPending ? "—" : rows.length}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <Link href={routes.pricing} className="btn-dark-to-accent" style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", height: 42, padding: "0 18px", background: "#FBF8F2", color: "#15140F", borderRadius: 6, fontSize: 13.5, fontWeight: 600 }}>
              {tier === "free" ? "See the plans" : "Change plan"}
            </Link>
          </div>
        </div>

        <div style={{ ...CARD, padding: "26px 28px" }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578" }}>BILLING EMAIL</div>
          <div style={{ display: "flex", alignItems: "center", height: 44, marginTop: 10, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff" }}>
            <span style={{ fontSize: 14.5 }}>{user?.email ?? "—"}</span>
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#8C8578", marginTop: 24 }}>CURRENCY</div>
          <div style={{ display: "flex", alignItems: "center", height: 44, marginTop: 10, padding: "0 14px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 7, background: "#fff" }}>
            <span className="mono" style={{ fontSize: 14 }}>{user?.currency ?? "—"}</span>
          </div>
          {/* No stored card is shown. Cards live at the payment provider and
              this app never sees one, so a "VISA ···· 4242" row here would be
              a drawing rather than a fact. */}
          <p style={{ margin: "18px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "#A8A192" }}>
            Card details are held by our payment provider and never by RaceOS. You will be sent to
            them to change one.
          </p>
        </div>
      </div>

      <div style={{ ...CARD, padding: "8px 30px 22px", marginTop: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 130px 100px", gap: 20, padding: "20px 0 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
          <span>DATE</span><span>DESCRIPTION</span><span>INVOICE</span><span style={{ textAlign: "right" }}>AMOUNT</span>
        </div>
        {invoices.isPending ? (
          [0, 1].map((i) => (
            <div key={i} style={{ padding: "16px 0", borderBottom: "1px solid rgba(21,20,15,.07)" }}>
              <Skeleton width={320} height={15} />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 14.5, color: "#8C8578" }}>
            No invoices yet. One is written the first time a solve is captured.
          </div>
        ) : (
          rows.map((invoice) => (
            <div key={invoice.id} className="row-hover-faint" style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 130px 100px", gap: 20, padding: "15px 0", borderBottom: "1px solid rgba(21,20,15,.07)", alignItems: "center" }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#5C574B" }}>{formatDate(invoice.issued_at)}</span>
              <span style={{ fontSize: 14.5 }}>{invoice.description}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: "#8C8578" }}>{invoice.invoice_number}</span>
              <span style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
                {formatPrice(invoice.amount_cents, invoice.currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Skeleton width={200} height={30} />
      <Skeleton width={420} height={16} />
      <div style={{ ...CARD, padding: 30, marginTop: 10 }}>
        <Skeleton width="100%" height={120} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const indicator = useSaveIndicator();
  const { user } = useAuth();
  const tierName = TIER_LABEL[user?.tier ?? "free"] ?? user?.tier ?? "—";

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 14, fontWeight: 500, color: "#5C574B", whiteSpace: "nowrap" }}>
            <Link href={routes.dashboard} style={{ color: "#5C574B" }}>Dashboard</Link>
            <Link href={routes.myPlans} style={{ color: "#5C574B" }}>My plans</Link>
            <Link href={routes.postRace} style={{ color: "#5C574B" }}>Review</Link>
            <Link href={routes.settings} style={{ color: "#15140F" }}>Settings</Link>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <SaveLabel state={indicator.state} />
            <div
              aria-hidden
              style={{
                width: 30, height: 30, borderRadius: "50%", flex: "none", background: "#D8D0C2",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12.5, fontWeight: 600, color: "#5C574B",
              }}
            >
              {(user?.name?.trim() || user?.email || "?").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <h1 style={{ margin: 0, fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Settings</h1>

        <div style={{ display: "grid", gridTemplateColumns: "246px minmax(0,1fr)", gap: 40, marginTop: 34, alignItems: "start" }}>
          <div style={{ position: "sticky", top: 112, display: "flex", flexDirection: "column", gap: 2 }}>
            {TABS.map((t) => (
              <div key={t.k} onClick={() => setTab(t.k)} className="row-hover-faint" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 8, cursor: "pointer", background: tab === t.k ? "#FBF8F2" : "transparent" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: tab === t.k ? "#E4622F" : "transparent", flex: "none" }} />
                <span style={{ fontSize: 15, fontWeight: tab === t.k ? 600 : 500, letterSpacing: "-.018em", color: tab === t.k ? "#15140F" : "#5C574B", whiteSpace: "nowrap" }}>{t.name}</span>
              </div>
            ))}
            <div style={{ marginTop: 22, padding: "18px 20px", borderRadius: 10, background: "rgba(21,20,15,.045)" }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>PLAN</div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.022em", marginTop: 9 }}>{tierName}</div>
              <Link href={routes.pricing} className="mono link-accent" style={{ display: "inline-block", fontSize: 9.5, letterSpacing: ".12em", color: "#C6461B", marginTop: 8 }}>
                {user?.tier === "free" ? "SEE THE PLANS →" : "CHANGE PLAN →"}
              </Link>
            </div>
          </div>

          <div>
            {tab === "profile" && <ProfileTab indicator={indicator} />}
            {tab === "constraints" && <ConstraintsTab indicator={indicator} />}
            {tab === "notifs" && <NotificationsTab indicator={indicator} />}
            {tab === "billing" && <BillingTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Signed-in only. Anonymous visitors are sent to log in and returned here after. */
export default function GuardedSettingsPage() {
  return (
    <GuardedPage>
      <SettingsPage />
    </GuardedPage>
  );
}
