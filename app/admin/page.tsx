"use client";

/**
 * Ops — the real numbers, or an honest refusal.
 *
 * Every figure on this page used to be generated: `spark(seed, up)` drew a
 * plausible growth curve, `lat()` drew a plausible latency trace, and the
 * account counts were typed in. A dashboard that invents its own metrics is
 * worse than no dashboard, because someone will make a decision on it.
 *
 * Everything is now `GET /admin/overview`, `/admin/kpis` and `/admin/health`,
 * all of which refuse anyone without an ops role. A day with no measurement
 * reports null and renders as an em dash — never as zero, which would read as
 * "we measured, and it was nothing".
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { ApiError } from "@/lib/api/errors";
import {
  useCurationQueue,
  useKpis,
  useOpsOverview,
  usePublishCourse,
  useRejectCourse,
  useRevenue,
  type CurationRow,
  type KpiRow,
} from "@/lib/api/screens";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

const STATUS_COLOR: Record<string, string> = {
  nominal: "#5C9E72",
  degraded: "#E0A33C",
  down: "#C0392B",
};

/** An absent measurement is an em dash. Never zero — that would be a claim. */
function num(value: number | null | undefined, suffix = ""): string {
  if (value == null) return "—";
  return `${Math.round(value).toLocaleString("en-GB")}${suffix}`;
}

/**
 * A sparkline over whatever days actually reported.
 *
 * Days with no measurement break the line rather than being interpolated
 * across: a gap in the data should look like a gap.
 */
function Spark({ rows, pick }: { rows: KpiRow[]; pick: (row: KpiRow) => number | null }) {
  const path = useMemo(() => {
    const values = rows.map(pick);
    const present = values.filter((v): v is number => v != null);
    if (present.length < 2) return null;
    const min = Math.min(...present);
    const max = Math.max(...present);
    const span = max - min || 1;
    let d = "";
    let pen = false;
    values.forEach((value, index) => {
      if (value == null) {
        pen = false;
        return;
      }
      const x = (index / Math.max(1, values.length - 1)) * 220;
      const y = 36 - ((value - min) / span) * 30;
      d += `${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  }, [rows, pick]);

  if (!path) {
    return (
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#B8B1A2", marginTop: 12 }}>
        NOT ENOUGH DATA
      </div>
    );
  }
  return (
    <svg width="220" height="40" viewBox="0 0 220 40" style={{ display: "block", marginTop: 10 }}>
      <path d={path} fill="none" stroke="#E4622F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/**
 * Money, in its own currency.
 *
 * There is deliberately no "total" formatter anywhere on this page. The server
 * stores no exchange rate, so adding GBP to EUR would produce a number with no
 * unit — and a plausible-looking one, which is the dangerous kind.
 */
function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** A rate that could not be computed is an em dash, never 0%. */
function pct(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${value.toFixed(1)}%`;
}

/**
 * One submitted course, and the two things a reviewer can do with it.
 *
 * Rejecting requires a reason because the submitter reads it — the button
 * stays disabled until there is one, rather than sending an empty string and
 * letting the server refuse.
 */
function CurationCard({ row }: { row: CurationRow }) {
  const [note, setNote] = useState("");
  const publish = usePublishCourse();
  const reject = useRejectCourse();
  const busy = publish.isPending || reject.isPending;
  const incomplete = row.leg_count < 3;

  return (
    <div style={{ padding: "18px 20px", borderRadius: 9, background: "rgba(255,255,255,.6)", border: "1px solid rgba(21,20,15,.08)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-.02em" }}>{row.name}</span>
        <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192" }}>
          {row.distance_type.toUpperCase()}
          {row.place ? ` · ${row.place.toUpperCase()}` : ""}
        </span>
        {incomplete && (
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#C0392B" }}>
            {row.leg_count}/3 LEGS
          </span>
        )}
      </div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#8C8578", marginTop: 8 }}>
        {row.submitted_by_email} · {new Date(row.submitted_at).toLocaleDateString("en-GB")}
      </div>

      <label style={{ display: "block", marginTop: 14 }}>
        <span className="sr-only">Reason, which the submitter will read</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why — the submitter reads this"
          disabled={busy}
          style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 7, border: "1px solid rgba(21,20,15,.16)", background: "#fff", fontSize: 14 }}
        />
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => publish.mutate({ courseId: row.course_id, note: note || undefined })}
          style={{ height: 38, padding: "0 18px", borderRadius: 7, border: "none", background: "#E4622F", color: "#fff", fontSize: 14, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
        >
          {publish.isPending ? "Publishing…" : "Publish to the catalogue"}
        </button>
        <button
          type="button"
          disabled={busy || !note.trim()}
          onClick={() => reject.mutate({ courseId: row.course_id, note })}
          title={note.trim() ? undefined : "A rejection needs a reason"}
          style={{ height: 38, padding: "0 18px", borderRadius: 7, border: "1px solid rgba(21,20,15,.18)", background: "transparent", fontSize: 14, fontWeight: 500, color: note.trim() ? "#302C24" : "#A8A192", cursor: busy || !note.trim() ? "default" : "pointer" }}
        >
          {reject.isPending ? "Declining…" : "Decline"}
        </button>
      </div>

      {(publish.error || reject.error) && (
        <div style={{ marginTop: 12 }}>
          <ApiErrorState error={publish.error ?? reject.error} />
        </div>
      )}
    </div>
  );
}

function AdminPage() {
  const overview = useOpsOverview();
  const kpis = useKpis(30);
  const revenue = useRevenue(30);
  const curation = useCurationQueue("unreviewed");

  const forbidden =
    overview.error instanceof ApiError &&
    (overview.error.code === "FORBIDDEN" || overview.error.code === "UNAUTHENTICATED");

  const latest = kpis.data?.[kpis.data.length - 1];

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.94)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#302C24" }}>OPS</span>
            {/* Admin-only on the far side. Shown to every ops user rather than
                hidden by role, because a link that refuses with a reason beats
                a page that silently has one fewer thing on it — and the page
                itself says which role it needs. */}
            <Link href={routes.adminAccounts} className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>ACCOUNTS</Link>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>INTERNAL</div>
        <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Ops</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          Every figure below is aggregated from real rows. A day with no measurement reports nothing
          rather than zero.
        </p>

        {forbidden ? (
          <div style={{ ...CARD, padding: "72px 40px", marginTop: 32, textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOT YOUR AREA</div>
            <div style={{ margin: "18px auto 0", maxWidth: 460, fontSize: 28, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.032em" }}>
              This page needs an ops role.
            </div>
            <p style={{ margin: "12px auto 0", maxWidth: 440, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
              Access is by role rather than by a flag, so a support account cannot see the refunds
              workspace or the bundle publish controls either. Nothing here is hidden by the page —
              the server refuses the request.
            </p>
            <Link href={routes.dashboard} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
              Back to the dashboard
            </Link>
          </div>
        ) : overview.error ? (
          <div style={{ marginTop: 32 }}>
            <ApiErrorState error={overview.error} onRetry={() => void overview.refetch()} />
          </div>
        ) : overview.isPending ? (
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ ...CARD, padding: 24 }}><Skeleton width="100%" height={64} /></div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 32 }}>
              {[
                { k: "SOLVER P50", v: num(overview.data.solver?.p50_ms, " ms") },
                { k: "SOLVER P95", v: num(overview.data.solver?.p95_ms, " ms") },
                { k: "SLA BREACHES · 30D", v: num(overview.data.sla_breaches_30d) },
                { k: "PUBLISHED BUNDLES", v: num(overview.data.published_bundles) },
              ].map((tile) => (
                <div key={tile.k} style={{ ...CARD, padding: "22px 24px" }}>
                  <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>{tile.k}</div>
                  <div className="mono" style={{ fontSize: 28, letterSpacing: "-.04em", marginTop: 12 }}>{tile.v}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr)", gap: 14, marginTop: 14, alignItems: "start" }}>
              <div style={{ ...CARD, padding: "26px 30px 28px" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>LAST 30 DAYS</div>
                {kpis.isPending ? (
                  <div style={{ marginTop: 20 }}><Skeleton width="100%" height={120} /></div>
                ) : (kpis.data?.length ?? 0) === 0 ? (
                  <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                    No KPI snapshots have been written yet. They are produced by the daily job, so
                    a new deployment has none until the first run.
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, marginTop: 18 }}>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>PLANS SOLVED</div>
                      <div className="mono" style={{ fontSize: 24, letterSpacing: "-.04em", marginTop: 8 }}>
                        {num(latest?.plans_solved)}
                      </div>
                      <Spark rows={kpis.data ?? []} pick={(r) => r.plans_solved} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>ACCOUNTS</div>
                      <div className="mono" style={{ fontSize: 24, letterSpacing: "-.04em", marginTop: 8 }}>
                        {num(latest?.total_accounts)}
                      </div>
                      <Spark rows={kpis.data ?? []} pick={(r) => r.total_accounts} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>PAYING</div>
                      <div className="mono" style={{ fontSize: 24, letterSpacing: "-.04em", marginTop: 8 }}>
                        {num(latest?.paying_count)}
                      </div>
                      <Spark rows={kpis.data ?? []} pick={(r) => r.paying_count} />
                    </div>
                    <div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>SOLVER P95</div>
                      <div className="mono" style={{ fontSize: 24, letterSpacing: "-.04em", marginTop: 8 }}>
                        {num(latest?.solver_p95_ms, " ms")}
                      </div>
                      <Spark rows={kpis.data ?? []} pick={(r) => r.solver_p95_ms} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ ...CARD, padding: "26px 30px 28px" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>SERVICES</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                  {(overview.data.services ?? []).map((service) => (
                    <div key={service.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,.6)", border: "1px solid rgba(21,20,15,.08)" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLOR[service.status] ?? "#8C8578", flex: "none" }} />
                      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-.014em" }}>{service.name}</span>
                      <span className="mono" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".12em", color: STATUS_COLOR[service.status] ?? "#8C8578" }}>
                        {service.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(21,20,15,.1)", borderRadius: 9, overflow: "hidden", marginTop: 20 }}>
                  <div style={{ background: "#FBF8F2", padding: "14px 16px" }}>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "#A8A192" }}>CROWD REPORTS</div>
                    <div className="mono" style={{ fontSize: 18, marginTop: 8 }}>{num(overview.data.pending_crowd_reports)}</div>
                  </div>
                  <div style={{ background: "#FBF8F2", padding: "14px 16px" }}>
                    <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "#A8A192" }}>SUPPORT GRANTS</div>
                    <div className="mono" style={{ fontSize: 18, marginTop: 8 }}>{num(overview.data.open_support_grants)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>REVENUE · 30D</div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".1em", color: "#B8B1A2" }}>
                  PER CURRENCY · NEVER SUMMED
                </div>
              </div>

              {revenue.error ? (
                <div style={{ marginTop: 18 }}>
                  <ApiErrorState error={revenue.error} onRetry={() => void revenue.refetch()} />
                </div>
              ) : revenue.isPending ? (
                <div style={{ marginTop: 18 }}><Skeleton width="100%" height={72} /></div>
              ) : revenue.data.currencies.length === 0 ? (
                <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                  Nothing was invoiced in the last 30 days. A currency with no activity is absent
                  rather than shown as zero — “nobody paid in euros” and “we do not sell in euros”
                  are different facts.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 34, marginTop: 18 }}>
                  {revenue.data.currencies.map((row) => (
                    <div key={row.currency}>
                      <div className="mono" style={{ fontSize: 26, letterSpacing: "-.04em" }}>
                        {money(row.net_cents, row.currency)}
                      </div>
                      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>
                        {row.currency} NET · {row.invoice_count} INVOICE{row.invoice_count === 1 ? "" : "S"}
                      </div>
                      {row.refunded_cents > 0 && (
                        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#C0392B", marginTop: 5 }}>
                          −{money(row.refunded_cents, row.currency)} REFUNDED
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ borderLeft: "1px solid rgba(21,20,15,.1)", paddingLeft: 34 }}>
                    <div className="mono" style={{ fontSize: 26, letterSpacing: "-.04em" }}>
                      {pct(revenue.data.churn.churn_pct)}
                    </div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>
                      CHURN · {revenue.data.churn.subscriptions_lost}/
                      {revenue.data.churn.subscriptions_at_risk}
                    </div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#B8B1A2", marginTop: 5 }}>
                      {revenue.data.churn.active_now} ACTIVE NOW
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>
                COURSES AWAITING REVIEW
              </div>
              <p style={{ margin: "12px 0 0", maxWidth: 620, fontSize: 14, lineHeight: 1.55, color: "#6B6455" }}>
                A course an athlete added is private to them until it is published here. Declining
                takes nothing away — it stays theirs to plan on, with the reason attached.
              </p>

              {curation.error ? (
                <div style={{ marginTop: 18 }}>
                  <ApiErrorState error={curation.error} onRetry={() => void curation.refetch()} />
                </div>
              ) : curation.isPending ? (
                <div style={{ marginTop: 18 }}><Skeleton width="100%" height={96} /></div>
              ) : curation.data.results.length === 0 ? (
                <p style={{ margin: "16px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "#6B6455" }}>
                  Nothing is waiting.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
                  {curation.data.results.map((row) => (
                    <CurationCard key={row.course_id} row={row} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ ...CARD, padding: "26px 30px", marginTop: 14 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>ACCOUNTS BY TIER</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 28, marginTop: 18 }}>
                {Object.entries(overview.data.accounts ?? {}).map(([tier, count]) => (
                  <div key={tier}>
                    <div className="mono" style={{ fontSize: 26, letterSpacing: "-.04em" }}>{num(count)}</div>
                    <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192", marginTop: 7 }}>
                      {tier.replace(/_/g, " ").toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function GuardedAdminPage() {
  return (
    <GuardedPage>
      <AdminPage />
    </GuardedPage>
  );
}
