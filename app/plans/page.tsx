"use client";

/**
 * My Plans — every race this athlete has entered, grouped as the API groups it.
 *
 * The grouping is the server's, not this screen's: `GET /my-plans` returns
 * `active`, `draft` and `past` already separated, so the tab counts and the
 * rows beneath them cannot disagree. Five hard-coded plans used to live in
 * `lib/myPlans.ts` and every account read the same five; nothing here is a
 * constant now.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AccountHeader } from "@/components/AccountHeader";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes, courseReconHref } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { formatDate, useMyPlans, type RaceCard } from "@/lib/api/account";
import { EXPORTS, MARGIN_COLOR, PLAN_GROUPS, isSolved, marginState, type PlanGroup } from "@/lib/myPlans";
import { feasStyle, planStatusLabel } from "@/lib/dashboard";
import { downloadExport, useExportManifest } from "@/lib/api/exports";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

/**
 * The export row, from the plan's own manifest.
 *
 * The manifest is what the server says this plan can produce, so a plan whose
 * bike leg has no geometry does not offer a .fit for it. Offering a download
 * that 404s is worse than not offering it.
 */
function ExportRow({ planId }: { planId: string }) {
  const { data, isPending } = useExportManifest(planId);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  if (isPending) {
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        {EXPORTS.slice(0, 4).map((e) => <Skeleton key={e.kind} width={120} height={34} />)}
      </div>
    );
  }
  const entries = data?.exports ?? [];
  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: 18 }}>
      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".15em", color: "#A8A192" }}>EXPORTS</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        {entries.map((entry) => (
          <span
            key={entry.key}
            onClick={async () => {
              setFailed(null);
              setBusy(entry.key);
              try {
                await downloadExport(entry, data?.plan_version ?? 1);
              } catch {
                setFailed(entry.key);
              } finally {
                setBusy(null);
              }
            }}
            className="row-hover-border"
            title={entry.description}
            style={{
              display: "inline-flex", alignItems: "center", gap: 9, height: 34, padding: "0 13px",
              border: `1px solid ${failed === entry.key ? "rgba(192,57,43,.4)" : "rgba(21,20,15,.14)"}`,
              borderRadius: 6, cursor: busy ? "progress" : "pointer", background: "#fff",
              fontSize: 13, color: failed === entry.key ? "#A03227" : "#15140F", whiteSpace: "nowrap",
            }}
          >
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".1em", color: "#A8A192" }}>
              {entry.key.split(".").pop()?.toUpperCase() ?? "FILE"}
            </span>
            {busy === entry.key ? "Preparing…" : failed === entry.key ? "Failed — retry" : entry.label}
          </span>
        ))}
      </div>
      {data?.attribution && (
        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#B8B1A2", marginTop: 12 }}>
          {data.attribution.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function PlanCard({ card, expanded, onToggle }: { card: RaceCard; expanded: boolean; onToggle: () => void }) {
  const feas = feasStyle(card.feasibility);
  const solved = isSolved(card);
  const margin = marginState(card.worst_margin_minutes);

  return (
    <div style={{ ...CARD, padding: "26px 30px 28px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3, 120px) auto", gap: 26, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: feas.dot, flex: "none" }} />
            <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: feas.fg, whiteSpace: "nowrap" }}>
              {planStatusLabel(card)}
            </span>
          </div>
          <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.03em", marginTop: 9 }}>{card.course_name}</div>
          <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 6 }}>
            {formatDate(card.event_date)} · {card.course_place}
            {card.solved_at ? ` · solved ${formatDate(card.solved_at)}` : ""}
          </div>
        </div>

        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>GOAL</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 8 }}>{card.goal_label ?? "—"}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>PROJECTED</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 8 }}>{card.projected_label ?? "—"}</div>
        </div>
        <div>
          <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>MARGIN</div>
          <div className="mono" style={{ fontSize: 16, marginTop: 8, color: MARGIN_COLOR[margin] }}>
            {card.margin_label ?? "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 9, flex: "none" }}>
          {solved && (
            <span
              onClick={onToggle}
              className="row-hover-border"
              style={{ display: "inline-flex", alignItems: "center", height: 42, padding: "0 16px", border: "1px solid rgba(21,20,15,.16)", borderRadius: 6, fontSize: 13.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {expanded ? "Hide files" : "Files"}
            </span>
          )}
          <Link
            href={card.next_action_href || (card.plan_id ? `${routes.racePlan}?plan=${card.plan_id}` : routes.planBuilder)}
            className="btn-dark-to-accent"
            style={{ display: "inline-flex", alignItems: "center", height: 42, padding: "0 18px", background: solved ? "#15140F" : "#E4622F", color: solved ? "#F1EEE8" : "#fff", borderRadius: 6, fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap" }}
          >
            {card.next_action || (solved ? "Open plan" : "Build it")}
          </Link>
        </div>
      </div>

      {card.has_pending_drift && (
        <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 20, padding: "14px 16px", borderRadius: 9, background: "rgba(224,163,60,.09)", border: "1px solid rgba(224,163,60,.36)" }}>
          <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A0701A", flex: "none" }}>DRIFT</span>
          <span style={{ fontSize: 14, lineHeight: 1.45, color: "#3D3A31", minWidth: 0 }}>
            {card.drift_summary ?? "Something this plan depends on has moved. Your plan is untouched until you apply it."}
          </span>
          {card.plan_id && (
            <Link href={`${routes.racePlan}?plan=${card.plan_id}`} className="mono link-accent" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".12em", color: "#C6461B", flex: "none" }}>
              REVIEW →
            </Link>
          )}
        </div>
      )}

      {expanded && card.plan_id && <ExportRow planId={card.plan_id} />}

      <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
        <Link href={courseReconHref(card.course_slug)} className="mono link-accent" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578" }}>
          COURSE RECON →
        </Link>
        {card.shared && (
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#8C8578" }}>SHARED</span>
        )}
      </div>
    </div>
  );
}

function EmptyGroup({ group }: { group: PlanGroup }) {
  const copy: Record<PlanGroup, { title: string; body: string; cta?: { href: string; label: string } }> = {
    active: {
      title: "Nothing active.",
      body: "A race becomes active the moment you enter it — before any plan is solved.",
      cta: { href: routes.races, label: "Browse the calendar" },
    },
    draft: {
      title: "No drafts.",
      body: "A draft is a race you have entered but not yet solved a plan for.",
    },
    past: {
      title: "No past races here yet.",
      body: "After a race, its plan stays exactly as it was and moves to this list.",
    },
  };
  const { title, body, cta } = copy[group];
  return (
    <div style={{ ...CARD, padding: "64px 40px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
      <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-.03em" }}>{title}</div>
      <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>{body}</p>
      {cta && (
        <Link href={cta.href} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", marginTop: 24, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function MyPlansPage() {
  const { data, isPending, error, refetch } = useMyPlans();
  const [group, setGroup] = useState<PlanGroup>("active");
  const [expanded, setExpanded] = useState<string | null>(null);

  const groups = useMemo(
    () => ({ active: data?.active ?? [], draft: data?.draft ?? [], past: data?.past ?? [] }),
    [data],
  );
  const rows = groups[group];
  const totalEntered = groups.active.length + groups.draft.length + groups.past.length;

  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8", minWidth: 1320 }}>
      <AccountHeader active="myPlans" />

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "52px 56px 0" }}>
        <Reveal className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>
          {isPending ? "LOADING YOUR PLANS" : `${totalEntered} ${totalEntered === 1 ? "RACE" : "RACES"} ENTERED`}
        </Reveal>
        <Reveal as="h1" delay={0.05} style={{ margin: "16px 0 0", fontSize: 66, lineHeight: 0.94, fontWeight: 600, letterSpacing: "-.05em" }}>
          My plans
        </Reveal>
        <Reveal as="p" delay={0.1} style={{ margin: "15px 0 0", maxWidth: 540, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          Every race you have entered. A solved plan keeps its numbers exactly as they were until
          you ask for a re-solve.
        </Reveal>

        <Reveal delay={0.14} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 30 }}>
          {PLAN_GROUPS.map((g) => {
            const on = group === g.key;
            const count = groups[g.key].length;
            return (
              <div
                key={g.key}
                onClick={() => { setGroup(g.key); setExpanded(null); }}
                className="row-hover-border"
                style={{
                  display: "flex", alignItems: "center", gap: 9, height: 38, padding: "0 15px", borderRadius: 7, cursor: "pointer", whiteSpace: "nowrap",
                  background: on ? "#15140F" : "#FBF8F2",
                  border: `1px solid ${on ? "#15140F" : "rgba(21,20,15,.12)"}`,
                  fontSize: 13.5, fontWeight: on ? 600 : 500, color: on ? "#FBF8F2" : "#5C574B",
                }}
              >
                {g.name}
                <span className="mono" style={{ fontSize: 10, color: on ? "rgba(251,248,242,.55)" : "#A8A192" }}>
                  {isPending ? "—" : count}
                </span>
              </div>
            );
          })}
          <span style={{ marginLeft: "auto", fontSize: 13.5, color: "#8C8578" }}>
            {PLAN_GROUPS.find((g) => g.key === group)?.blurb}
          </span>
        </Reveal>
      </section>

      <section style={{ maxWidth: 1360, margin: "0 auto", padding: "24px 56px 0" }}>
        {error ? (
          <ApiErrorState error={error} onRetry={() => void refetch()} />
        ) : isPending ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ ...CARD, padding: "26px 30px" }}>
                <Skeleton width={240} height={22} />
                <div style={{ marginTop: 14 }}><Skeleton width={360} height={14} /></div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyGroup group={group} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((card) => (
              <PlanCard
                key={card.race_id}
                card={card}
                expanded={expanded === card.race_id}
                onToggle={() => setExpanded((current) => (current === card.race_id ? null : card.race_id))}
              />
            ))}
          </div>
        )}
      </section>

      <div style={{ marginTop: 88 }}>
        <Footer />
      </div>
    </div>
  );
}

export default function GuardedMyPlansPage() {
  return (
    <GuardedPage>
      <MyPlansPage />
    </GuardedPage>
  );
}
