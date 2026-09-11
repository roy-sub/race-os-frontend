"use client";

/**
 * A shared plan, opened by token.
 *
 * Read without an account on purpose — a share link is a capability, and the
 * coach or partner opening it may have none. What comes back is filtered
 * server-side by the link's own scope, field by field, and **no scope exposes a
 * constraint value**, `full_plan` included.
 *
 * The page it replaces showed one athlete's race to anyone who opened any link:
 * "Elena Marsh · Sunday 21 June 2026" was a module constant, and the token in
 * the URL was read by nothing.
 */

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { OsmAttribution } from "@/components/OsmAttribution";
import { routes } from "@/lib/routes";
import { ApiError } from "@/lib/api/errors";
import { useSharedPlan } from "@/lib/api/screens";
import { expiresIn, scopeCopy } from "@/lib/sharedPlan";
import { formatBarrierName, formatClock, formatMargin, LEG_COLOR } from "@/lib/courseGeo";
import { feasStyle } from "@/lib/dashboard";
import { formatLongDate } from "@/lib/api/account";

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

type Split = { leg: string; distance: string; target_pace_or_power: string; unit: string; split_minutes: number; split_label?: string | null; note?: string | null };
type Gate = { name: string; limit_minutes: number; eta_minutes: number; margin_minutes: number; margin_label?: string | null };
type Fuelling = { carb_g_per_hr: number; fluid_ml_per_hr: number; sodium_mg_per_hr: number; caffeine_mg_total: number };
type Bag = { key: string; name: string; when_label: string; item_count: number };

function SharedPlanBody() {
  const params = useSearchParams();
  const token = params.get("token");
  const { data, isPending, error } = useSharedPlan(token);

  if (!token) {
    return (
      <Notice
        title="This link is incomplete."
        body="A share link carries a token in its address. Ask whoever sent it to send the whole link."
      />
    );
  }
  if (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "That link could not be opened. It may have expired or been revoked.";
    return <Notice title="This link is not open." body={message} />;
  }
  if (isPending || !data) {
    return (
      <div style={{ ...CARD, padding: 34 }}>
        <Skeleton width={260} height={22} />
        <div style={{ marginTop: 18 }}><Skeleton width="100%" height={240} /></div>
      </div>
    );
  }

  const scope = scopeCopy(data.scope);
  const feas = feasStyle(data.feasibility);
  const splits = (data.splits ?? []) as unknown as Split[];
  const gates = (data.gates ?? []) as unknown as Gate[];
  const fuelling = data.fuelling as unknown as Fuelling | null;
  const bags = (data.bags ?? []) as unknown as Bag[];

  return (
    <>
      <div style={{ ...CARD, padding: "34px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 10px", border: `1px solid ${feas.border}`, borderRadius: 4, fontSize: 9.5, letterSpacing: ".14em", color: feas.fg }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: feas.dot }} />
            {data.feasibility}
          </span>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#8C8578" }}>
            PLAN V{data.plan_version} · {scope.name.toUpperCase()}
          </span>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: ".14em", color: "#A8A192" }}>
            {expiresIn(data.expires_at).toUpperCase()}
          </span>
        </div>

        <h1 style={{ margin: "20px 0 0", fontSize: 46, lineHeight: 1, fontWeight: 600, letterSpacing: "-.045em" }}>
          {data.course_name ?? "Race plan"}
        </h1>
        <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 15, color: "#5C574B", flexWrap: "wrap" }}>
          {data.shared_by && <span>Shared by {data.shared_by}</span>}
          {data.event_date && (<><span style={{ color: "#C4BCAC" }}>·</span><span>{formatLongDate(data.event_date)}</span></>)}
          {data.start_time_local && (<><span style={{ color: "#C4BCAC" }}>·</span><span>{data.start_time_local.slice(0, 5)} start</span></>)}
          {data.course_place && (<><span style={{ color: "#C4BCAC" }}>·</span><span>{data.course_place}</span></>)}
        </div>
        {data.projected_label && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 22 }}>
            <span className="mono" style={{ fontSize: 40, letterSpacing: "-.05em" }}>{data.projected_label}</span>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", color: "#8C8578" }}>PROJECTED FINISH</span>
          </div>
        )}
      </div>

      {splits.length > 0 && (
        <div style={{ ...CARD, padding: "26px 30px 28px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>PACING</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(3, splits.length)},1fr)`, gap: 14, marginTop: 18 }}>
            {splits.map((split) => (
              <div key={split.leg} style={{ padding: "18px 20px", borderRadius: 10, background: "rgba(255,255,255,.65)", border: "1px solid rgba(21,20,15,.08)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: LEG_COLOR[split.leg as keyof typeof LEG_COLOR] ?? "#8C8578" }}>{split.leg}</span>
                  <span className="mono" style={{ fontSize: 10, color: "#A8A192" }}>{split.distance}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 14 }}>
                  <span className="mono" style={{ fontSize: 28, letterSpacing: "-.045em" }}>{split.target_pace_or_power}</span>
                  <span className="mono" style={{ fontSize: 11, color: "#8C8578" }}>{split.unit}</span>
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".1em", color: "#8C8578", marginTop: 11 }}>
                  {split.split_label ?? formatClock(split.split_minutes)}
                  {split.note ? ` · ${split.note}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gates.length > 0 && (
        <div style={{ ...CARD, padding: "26px 30px 28px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>CUT-OFF MARGINS</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(4, gates.length)},1fr)`, gap: 12, marginTop: 18 }}>
            {gates.map((gate) => {
              const colour = gate.margin_minutes < 0 ? "#C0392B" : gate.margin_minutes < 20 ? "#A0701A" : "#3E7B55";
              return (
                <div key={gate.name} style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,.65)", border: "1px solid rgba(21,20,15,.08)" }}>
                  <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>
                    {formatBarrierName(gate.name).toUpperCase()}
                  </div>
                  <div className="mono" style={{ fontSize: 20, letterSpacing: "-.035em", color: colour, marginTop: 10 }}>
                    {gate.margin_label ?? formatMargin(gate.margin_minutes)}
                  </div>
                  <div className="mono" style={{ fontSize: 9.5, color: "#8C8578", marginTop: 8 }}>
                    {formatClock(gate.eta_minutes)} / {formatClock(gate.limit_minutes)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {fuelling && (
        <div style={{ ...CARD, padding: "26px 30px 28px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>FUELLING</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginTop: 18 }}>
            {[
              { k: "CARB / HR", v: Math.round(fuelling.carb_g_per_hr), u: "g" },
              { k: "FLUID / HR", v: Math.round(fuelling.fluid_ml_per_hr), u: "ml" },
              { k: "SODIUM / HR", v: Math.round(fuelling.sodium_mg_per_hr), u: "mg" },
              { k: "CAFFEINE", v: Math.round(fuelling.caffeine_mg_total), u: "mg" },
            ].map((tile) => (
              <div key={tile.k} style={{ padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,.65)", border: "1px solid rgba(21,20,15,.08)" }}>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".14em", color: "#A8A192" }}>{tile.k}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <span className="mono" style={{ fontSize: 22, letterSpacing: "-.04em" }}>{tile.v}</span>
                  <span className="mono" style={{ fontSize: 10, color: "#8C8578" }}>{tile.u}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bags.length > 0 && (
        <div style={{ ...CARD, padding: "26px 30px 28px", marginTop: 14 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>BAGS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}>
            {bags.map((bag) => (
              <div key={bag.key} style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,.65)", border: "1px solid rgba(21,20,15,.08)", minWidth: 160 }}>
                <div style={{ fontSize: 14.5, fontWeight: 500, letterSpacing: "-.015em" }}>{bag.name}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#A8A192", marginTop: 7 }}>
                  {bag.when_label.toUpperCase()} · {bag.item_count} ITEMS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ ...CARD, padding: "24px 30px", marginTop: 14 }}>
        <div className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>WHAT THIS LINK SHOWS</div>
        <p style={{ margin: "12px 0 0", maxWidth: 700, fontSize: 14.5, lineHeight: 1.6, color: "#5C574B" }}>
          {scope.blurb} Nothing about the account is shared, and no scope — this one included —
          shares the athlete&apos;s constraint values: the thresholds, the sweat rate, the gut
          ceiling. Those stay theirs.
        </p>
        {data.attribution && (
          <div style={{ marginTop: 16 }}>
            <OsmAttribution attribution={data.attribution} />
          </div>
        )}
      </div>
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ ...CARD, padding: "72px 40px", textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>SHARED PLAN</div>
      <div style={{ margin: "18px auto 0", maxWidth: 460, fontSize: 28, lineHeight: 1.18, fontWeight: 500, letterSpacing: "-.032em" }}>
        {title}
      </div>
      <p style={{ margin: "12px auto 0", maxWidth: 440, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>{body}</p>
      <Link href={routes.home} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", marginTop: 24, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
        What is RaceOS?
      </Link>
    </div>
  );
}

export default function SharedPlanPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#F1EEE8" }}>
      <header style={{ borderBottom: "1px solid rgba(21,20,15,.1)" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 40px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Mark width={27} height={18} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
          </Link>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>READ ONLY</span>
        </div>
      </header>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "44px 40px 96px" }}>
        <Suspense fallback={null}>
          <SharedPlanBody />
        </Suspense>
      </div>
    </div>
  );
}
