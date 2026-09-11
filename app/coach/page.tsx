"use client";

/**
 * The coach board — the athletes who have linked to *this* coach.
 *
 * Four named athletes with full splits, gates and coaching notes used to be
 * module constants here, which meant anyone opening the page read four people's
 * race plans. The board is now `GET /coach/board`, which takes no coach id and
 * answers for the token's own user.
 *
 * The important behaviour is what the server does with an athlete who has *not*
 * granted plan access: the row still appears, with its numbers withheld and a
 * reason attached. Hiding them would make a coach think the invite failed, and
 * filling them in would be showing a coach numbers the athlete did not share.
 * This screen renders `withheld_reason` rather than papering over it.
 */

import Link from "next/link";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/api/account";
import { useCoachBoard, type BoardRow } from "@/lib/api/screens";
import { feasStyle } from "@/lib/dashboard";
import { marginState, MARGIN_COLOR } from "@/lib/myPlans";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

function AthleteRow({ row }: { row: BoardRow }) {
  const feas = feasStyle(row.feasibility);
  const margin = marginState(row.worst_margin_minutes);
  const withheld = Boolean(row.withheld_reason);

  return (
    <div style={{ ...CARD, padding: "24px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(0,1fr) 110px 110px 110px", gap: 24, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span
              aria-hidden
              style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: "#D8D0C2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#5C574B" }}
            >
              {(row.athlete_name ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-.022em" }}>
                {row.athlete_name ?? "Athlete"}
              </div>
              <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A8A192", marginTop: 4 }}>
                {[
                  row.can_view_plans ? "PLANS" : null,
                  row.can_build ? "BUILD" : null,
                  row.can_view_analysis ? "ANALYSIS" : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "NO ACCESS GRANTED"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>NEXT RACE</div>
          <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em", marginTop: 8 }}>
            {row.course_name ?? "None entered"}
          </div>
          {row.event_date && (
            <div className="mono" style={{ fontSize: 10, color: "#8C8578", marginTop: 5 }}>
              {formatDate(row.event_date).toUpperCase()}
              {row.days_away != null ? ` · ${row.days_away}D` : ""}
            </div>
          )}
        </div>

        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>PROJECTED</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 8 }}>{row.projected_label ?? "—"}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>MARGIN</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 8, color: MARGIN_COLOR[margin] }}>
            {row.margin_label ?? "—"}
          </div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>VERDICT</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: feas.dot, flex: "none" }} />
            <span className="mono" style={{ fontSize: 10, color: feas.fg, whiteSpace: "nowrap" }}>
              {row.feasibility ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {withheld && (
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 18, padding: "13px 15px", borderRadius: 9, background: "rgba(21,20,15,.04)", border: "1px solid rgba(21,20,15,.1)" }}>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#8C8578", flex: "none" }}>WITHHELD</span>
          <span style={{ fontSize: 14, lineHeight: 1.45, color: "#5C574B" }}>{row.withheld_reason}</span>
        </div>
      )}

      {row.has_pending_drift && (
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 12, padding: "13px 15px", borderRadius: 9, background: "rgba(224,163,60,.09)", border: "1px solid rgba(224,163,60,.36)" }}>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A0701A", flex: "none" }}>DRIFT</span>
          <span style={{ fontSize: 14, lineHeight: 1.45, color: "#3D3A31" }}>
            This athlete has an outstanding drift on their plan. Only they can apply it.
          </span>
        </div>
      )}
    </div>
  );
}

function CoachPage() {
  const { user } = useAuth();
  const { data, isPending, error, refetch } = useCoachBoard();

  // A refusal here is not an error state: it is the honest answer that the
  // board is a coach-tier feature and this account is not on it. Branched on
  // `code` rather than the status, because the taxonomy is what the backend
  // actually promises to keep stable.
  const needsUpgrade = error instanceof ApiError && error.code === "PAYMENT_REQUIRED";
  const rows = data ?? [];

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
            <Link href={routes.coach} style={{ color: "#15140F" }}>Coach</Link>
            <Link href={routes.settings} style={{ color: "#5C574B" }}>Settings</Link>
          </nav>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578" }}>
            {user?.email ?? ""}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
          {isPending ? "LOADING THE BOARD" : `${rows.length} ${rows.length === 1 ? "ATHLETE" : "ATHLETES"}`}
        </div>
        <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Coach board</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 600, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          Race week across everyone linked to you. An athlete decides what you can see, and can
          change or revoke that at any moment — including on a page you already have open.
        </p>

        <div style={{ marginTop: 32 }}>
          {needsUpgrade ? (
            <div style={{ ...CARD, padding: "72px 40px", textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>COACH TIER</div>
              <div style={{ margin: "18px auto 0", maxWidth: 460, fontSize: 28, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.032em" }}>
                The board is part of the coach plan.
              </div>
              <p style={{ margin: "12px auto 0", maxWidth: 440, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
                {(error as ApiError).message}
              </p>
              <Link href={routes.pricing} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", marginTop: 26, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
                See the plans
              </Link>
            </div>
          ) : error ? (
            <ApiErrorState error={error} onRetry={() => void refetch()} />
          ) : isPending ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ ...CARD, padding: "24px 28px" }}><Skeleton width="100%" height={60} /></div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div style={{ ...CARD, padding: "72px 40px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOBODY LINKED YET</div>
              <div style={{ margin: "18px auto 0", maxWidth: 440, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>
                Invite an athlete and they appear here.
              </div>
              <p style={{ margin: "12px auto 0", maxWidth: 440, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
                They accept the invite and choose what you may see. Nothing about an athlete reaches
                this board until they have said so — not their plans, and never their constraint
                values.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rows.map((row) => <AthleteRow key={row.link_id} row={row} />)}
            </div>
          )}
        </div>

        <div style={{ ...CARD, padding: "26px 30px", marginTop: 24 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>WHAT A COACH CANNOT DO</div>
          <p style={{ margin: "12px 0 0", maxWidth: 760, fontSize: 14.5, lineHeight: 1.6, color: "#5C574B" }}>
            Write an athlete&apos;s constraints. Not at full permission, not with their agreement,
            not through any endpoint — there is no column for it and no code path that could. A
            coach can build a plan *for* an athlete to approve, and the athlete approves it. That is
            the whole of the write access a coach has.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GuardedCoachPage() {
  return (
    <GuardedPage>
      <CoachPage />
    </GuardedPage>
  );
}
