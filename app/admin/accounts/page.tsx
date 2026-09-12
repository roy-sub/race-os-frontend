"use client";

/**
 * Account administration.
 *
 * Its own route rather than a panel on the ops page, because it is a different
 * role. Ops can read revenue, health and the curation queue; only `admin` can
 * open this. A support agent holds neither — and that is the point of the
 * whole page.
 *
 * **What this screen may not show.** Athlete content — plans, races,
 * constraints, physiology, next of kin — is reachable only through a
 * support-access grant the athlete approved, for an hour, with every read
 * appended to a log they can open. This screen needs no consent to open, so it
 * carries account facts and counts and nothing else. The server enforces that;
 * the page does not have to be trusted to. `test_admin_accounts.py` tries the
 * forbidden thing and asserts it is not there.
 */

import { useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { ApiError } from "@/lib/api/errors";
import {
  useAccount,
  useAccounts,
  type AccountRow,
  type AccountState,
  type AccountTier,
  type AdminRole,
} from "@/lib/api/screens";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

const PAGE_SIZE = 50;

const TIERS: AccountTier[] = ["free", "per_race", "season", "coach"];
const ROLES: AdminRole[] = ["support", "ops", "admin"];
const STATES: AccountState[] = ["active", "dormant", "erased"];

const SUBSCRIPTION_COLOR: Record<string, string> = {
  active: "#5C9E72",
  past_due: "#E0A33C",
  cancelled: "#8C8578",
};

function label(value: string): string {
  return value.replace(/_/g, " ").toUpperCase();
}

/** A currency amount, in its own currency. Nothing here is ever summed. */
function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function Chip({ children, color = "#8C8578" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="mono"
      style={{ fontSize: 8, letterSpacing: ".12em", color, border: `1px solid ${color}33`, borderRadius: 4, padding: "3px 6px" }}
    >
      {children}
    </span>
  );
}

/** One account, expanded. Counts, never contents. */
function Detail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isPending, error, refetch } = useAccount(userId);

  return (
    <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>ACCOUNT</div>
        <button
          type="button"
          onClick={onClose}
          className="mono"
          style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 9, letterSpacing: ".13em", color: "#C6461B", cursor: "pointer" }}
        >
          CLOSE
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 18 }}>
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        </div>
      ) : isPending ? (
        <div style={{ marginTop: 18 }}><Skeleton width="100%" height={120} /></div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-.028em" }}>
              {data.name ?? data.email}
            </span>
            <span className="mono" style={{ fontSize: 10, color: "#8C8578" }}>{data.email}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 30, marginTop: 20 }}>
            <div>
              <div className="mono" style={{ fontSize: 22, letterSpacing: "-.04em" }}>{data.plan_count}</div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 6 }}>PLANS</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, letterSpacing: "-.04em" }}>{data.support_grant_count}</div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 6 }}>SUPPORT GRANTS</div>
            </div>
            {data.invoiced.map((row) => (
              <div key={row.currency}>
                <div className="mono" style={{ fontSize: 22, letterSpacing: "-.04em" }}>
                  {money(row.amount_cents, row.currency)}
                </div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 6 }}>
                  INVOICED · {row.count}
                </div>
              </div>
            ))}
          </div>

          {data.subscriptions.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>SUBSCRIPTIONS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {data.subscriptions.map((row) => (
                  <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,.6)", border: "1px solid rgba(21,20,15,.08)" }}>
                    <Chip color={SUBSCRIPTION_COLOR[row.status] ?? "#8C8578"}>{label(row.status)}</Chip>
                    <span style={{ fontSize: 14 }}>{label(row.tier)}</span>
                    {row.renews_at && (
                      <span className="mono" style={{ marginLeft: "auto", fontSize: 9, color: "#8C8578" }}>
                        RENEWS {new Date(row.renews_at).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* The server says this, not the page. An operator who read an empty
              plan count as an empty account would otherwise go looking for a
              screen that shows them what is deliberately not here. */}
          <p style={{ margin: "24px 0 0", maxWidth: 560, fontSize: 13.5, lineHeight: 1.55, color: "#6B6455" }}>
            {data.athlete_data}
          </p>
        </>
      )}
    </div>
  );
}

function Row({ row, onOpen }: { row: AccountRow; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="row-hover-faint"
      style={{ display: "grid", gridTemplateColumns: "minmax(0,2fr) 110px 120px minmax(0,1fr) 110px", alignItems: "center", gap: 16, width: "100%", textAlign: "left", padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(21,20,15,.08)", background: "rgba(255,255,255,.6)", cursor: "pointer" }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 500, letterSpacing: "-.018em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.name ?? row.email}
        </span>
        <span className="mono" style={{ display: "block", fontSize: 9, color: "#8C8578", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.email}
        </span>
      </span>
      <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#5C574B" }}>{label(row.tier)}</span>
      <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: SUBSCRIPTION_COLOR[row.subscription_status ?? ""] ?? "#B8B1A2" }}>
        {row.subscription_status ? label(row.subscription_status) : "—"}
      </span>
      <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {row.roles.map((role) => (
          <Chip key={role} color="#C6461B">{role.toUpperCase()}</Chip>
        ))}
        {!row.email_verified && <Chip color="#E0A33C">UNVERIFIED</Chip>}
        {row.account_state !== "active" && <Chip>{label(row.account_state)}</Chip>}
      </span>
      <span className="mono" style={{ fontSize: 9, color: "#A8A192" }}>
        {new Date(row.created_at).toLocaleDateString("en-GB")}
      </span>
    </button>
  );
}

function AccountsPage() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<AccountTier | "">("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [state, setState] = useState<AccountState | "">("");
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const accounts = useAccounts({
    q: q || null,
    tier: tier || null,
    role: role || null,
    state: state || null,
    limit: PAGE_SIZE,
    offset,
  });

  const forbidden =
    accounts.error instanceof ApiError &&
    (accounts.error.code === "FORBIDDEN" || accounts.error.code === "UNAUTHENTICATED");

  /** Any filter change starts the result set again; page 3 of the old query
   *  is not page 3 of the new one. */
  function refine<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setOffset(0);
      setOpen(null);
    };
  }

  const selectStyle: React.CSSProperties = {
    height: 40,
    padding: "0 12px",
    borderRadius: 7,
    border: "1px solid rgba(21,20,15,.16)",
    background: "#fff",
    fontSize: 14,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Link href={routes.admin} className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>OPS</Link>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#302C24" }}>ACCOUNTS</span>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>INTERNAL</div>
        <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Accounts</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          Who holds an account, what they pay and what roles they hold. Nothing an athlete told us
          for racing appears here — that needs a grant they approved, and it is logged to them.
        </p>

        {forbidden ? (
          <div style={{ ...CARD, padding: "72px 40px", marginTop: 32, textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOT YOUR AREA</div>
            <div style={{ margin: "18px auto 0", maxWidth: 500, fontSize: 28, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.032em" }}>
              This page needs the admin role.
            </div>
            <p style={{ margin: "12px auto 0", maxWidth: 460, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
              Ops and support cannot open it. An agent who could list every account and read its
              billing would have walked around the consent an athlete gives before anyone reads
              their data — so the server refuses, rather than the page hiding a button.
            </p>
            <Link href={routes.admin} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
              Back to ops
            </Link>
          </div>
        ) : (
          <>
            <div style={{ ...CARD, padding: "22px 24px", marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ flex: "1 1 280px", minWidth: 0 }}>
                <span className="sr-only">Search by email or name</span>
                <input
                  value={q}
                  onChange={(event) => refine(setQ)(event.target.value)}
                  placeholder="Email or name"
                  style={{ ...selectStyle, width: "100%" }}
                />
              </label>
              <label>
                <span className="sr-only">Filter by tier</span>
                <select value={tier} onChange={(e) => refine(setTier)(e.target.value as AccountTier | "")} style={selectStyle}>
                  <option value="">Any tier</option>
                  {TIERS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by role</span>
                <select value={role} onChange={(e) => refine(setRole)(e.target.value as AdminRole | "")} style={selectStyle}>
                  <option value="">Any role</option>
                  {ROLES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter by account state</span>
                <select value={state} onChange={(e) => refine(setState)(e.target.value as AccountState | "")} style={selectStyle}>
                  <option value="">Any state</option>
                  {STATES.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                </select>
              </label>
            </div>

            {accounts.error ? (
              <div style={{ marginTop: 14 }}>
                <ApiErrorState error={accounts.error} onRetry={() => void accounts.refetch()} />
              </div>
            ) : accounts.isPending ? (
              <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
                <Skeleton width="100%" height={200} />
              </div>
            ) : (
              <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
                {/* The true total, not the page length: "three results" and
                    "the first three of nine hundred" are different facts. */}
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>
                  {accounts.data.total} ACCOUNT{accounts.data.total === 1 ? "" : "S"}
                  {accounts.data.total > PAGE_SIZE &&
                    ` · SHOWING ${offset + 1}–${Math.min(offset + PAGE_SIZE, accounts.data.total)}`}
                </div>

                {accounts.data.results.length === 0 ? (
                  <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                    Nothing matches.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                    {accounts.data.results.map((row) => (
                      <Row
                        key={row.id}
                        row={row}
                        onOpen={() => setOpen(open === row.id ? null : row.id)}
                      />
                    ))}
                  </div>
                )}

                {accounts.data.total > PAGE_SIZE && (
                  <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                    <button
                      type="button"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                      style={{ height: 38, padding: "0 18px", borderRadius: 7, border: "1px solid rgba(21,20,15,.18)", background: "transparent", fontSize: 14, color: offset === 0 ? "#B8B1A2" : "#302C24", cursor: offset === 0 ? "default" : "pointer" }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={offset + PAGE_SIZE >= accounts.data.total}
                      onClick={() => setOffset(offset + PAGE_SIZE)}
                      style={{ height: 38, padding: "0 18px", borderRadius: 7, border: "1px solid rgba(21,20,15,.18)", background: "transparent", fontSize: 14, color: offset + PAGE_SIZE >= accounts.data.total ? "#B8B1A2" : "#302C24", cursor: offset + PAGE_SIZE >= accounts.data.total ? "default" : "pointer" }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}

            {open && <Detail userId={open} onClose={() => setOpen(null)} />}
          </>
        )}
      </div>
    </div>
  );
}

export default function GuardedAccountsPage() {
  return (
    <GuardedPage>
      <AccountsPage />
    </GuardedPage>
  );
}
