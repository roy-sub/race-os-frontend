"use client";

/**
 * Race Mode — one plan, cached whole, for a phone with no signal.
 *
 * The server's promise is `offline.complete`: everything this screen renders is
 * in the one payload, so race day makes no network requests. That is why it is
 * fetched once with an infinite stale time and never refetched on focus — a
 * phone in a transition bag must not wake up and try to re-download a plan.
 *
 * What was here before was a set of hand-written phone screens describing one
 * fictional athlete's race. Every number below is from that athlete's own
 * solved plan.
 */

import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { lastPlan, loadPlan, rememberLastPlan, savePlan, useOnline, useRaceDayDisplay, useWakeLock, type SavedPlan } from "@/lib/raceMode";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mark } from "@/components/Mark";
import { Skeleton } from "@/components/Skeleton";
import { ApiErrorState } from "@/components/ApiErrorState";
import { routes } from "@/lib/routes";
import { GuardedPage } from "@/lib/auth/GuardedPage";
import { formatLongDate, useMyPlans } from "@/lib/api/account";
import { useRaceMode, type RaceModePayload } from "@/lib/api/screens";
import { formatBarrierName, formatClock, formatMargin, LEG_COLOR } from "@/lib/courseGeo";

const PHONE_W = 372;

const CARD: React.CSSProperties = {
  background: "#FBF8F2",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(21,20,15,.04), 0 12px 32px -24px rgba(21,20,15,.18)",
};

/** The phone frame the design puts every race-day screen inside. */
function Phone({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "none" }}>
      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".16em", color: "#A8A192" }}>{label}</div>
      <div
        style={{
          width: PHONE_W, borderRadius: 26, background: "#0F0E0C", padding: 10,
          boxShadow: "0 30px 70px -34px rgba(12,9,6,.65)",
        }}
      >
        <div style={{ borderRadius: 18, background: "#15140F", overflow: "hidden", minHeight: 560, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PhoneHeader({ payload }: { payload: RaceModePayload }) {
  return (
    <div style={{ padding: "18px 20px 16px", borderBottom: "1px solid rgba(251,248,242,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".16em", color: "rgba(251,248,242,.4)" }}>
          {payload.race.start_time_local} START
        </span>
        <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#7CC08F" }}>
          CACHED · OFFLINE
        </span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.026em", color: "#FBF8F2", marginTop: 12 }}>
        {payload.course.name}
      </div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".12em", color: "rgba(251,248,242,.38)", marginTop: 7 }}>
        {payload.race.bib ? `BIB ${payload.race.bib} · ` : ""}PLAN V{payload.plan.version}
      </div>
    </div>
  );
}

function SplitsScreen({ payload }: { payload: RaceModePayload }) {
  return (
    <>
      <PhoneHeader payload={payload} />
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {payload.plan.splits.map((split) => (
          <div key={split.leg} style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(251,248,242,.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: LEG_COLOR[split.leg] ?? "#8C8578" }}>
                {split.leg}
              </span>
              <span className="mono" style={{ fontSize: 10, color: "rgba(251,248,242,.38)" }}>{split.distance}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 12 }}>
              <span className="mono" style={{ fontSize: 30, letterSpacing: "-.045em", color: "#FBF8F2" }}>
                {split.target_pace_or_power}
              </span>
              <span className="mono" style={{ fontSize: 12, color: "rgba(251,248,242,.45)" }}>{split.unit}</span>
            </div>
            <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, letterSpacing: ".1em", color: "rgba(251,248,242,.34)", marginTop: 10 }}>
              <span>{split.split_label ?? formatClock(split.split_minutes)}</span>
              {split.note && <span>{split.note.toUpperCase()}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function GatesScreen({ payload }: { payload: RaceModePayload }) {
  return (
    <>
      <PhoneHeader payload={payload} />
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {payload.plan.gates.map((gate) => {
          const colour = gate.margin_minutes < 0 ? "#E4622F" : gate.margin_minutes < 20 ? "#E0A33C" : "#7CC08F";
          return (
            <div key={gate.name} style={{ padding: "13px 15px", borderRadius: 10, background: "rgba(251,248,242,.05)" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 14, color: "#FBF8F2", letterSpacing: "-.012em" }}>{formatBarrierName(gate.name)}</span>
                <span className="mono" style={{ fontSize: 14, color: colour }}>
                  {gate.margin_label ?? formatMargin(gate.margin_minutes)}
                </span>
              </div>
              <div className="mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, letterSpacing: ".1em", color: "rgba(251,248,242,.34)", marginTop: 9 }}>
                <span>YOU {formatClock(gate.eta_minutes)}</span>
                <span>LIMIT {formatClock(gate.limit_minutes)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FuellingScreen({ payload }: { payload: RaceModePayload }) {
  const fuelling = payload.plan.fuelling;
  return (
    <>
      <PhoneHeader payload={payload} />
      <div style={{ padding: "18px 20px", flex: 1 }}>
        {fuelling ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 1, background: "rgba(251,248,242,.09)", borderRadius: 10, overflow: "hidden" }}>
            {[
              { k: "CARB / HR", v: `${Math.round(fuelling.carb_g_per_hr)}`, u: "g" },
              { k: "FLUID / HR", v: `${Math.round(fuelling.fluid_ml_per_hr)}`, u: "ml" },
              { k: "SODIUM / HR", v: `${Math.round(fuelling.sodium_mg_per_hr)}`, u: "mg" },
              { k: "CAFFEINE", v: `${Math.round(fuelling.caffeine_mg_total)}`, u: "mg total" },
            ].map((tile) => (
              <div key={tile.k} style={{ background: "#15140F", padding: "16px 16px 15px" }}>
                <div className="mono" style={{ fontSize: 8, letterSpacing: ".14em", color: "rgba(251,248,242,.34)" }}>{tile.k}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
                  <span className="mono" style={{ fontSize: 24, letterSpacing: "-.04em", color: "#FBF8F2" }}>{tile.v}</span>
                  <span className="mono" style={{ fontSize: 10, color: "rgba(251,248,242,.4)" }}>{tile.u}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".16em", color: "rgba(251,248,242,.34)", marginTop: 20 }}>
          AID STATIONS · ONE ACTION EACH
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
          {payload.plan.aid_actions.slice(0, 8).map((action) => (
            <div key={action.ordinal} style={{ padding: "11px 13px", borderRadius: 9, background: "rgba(251,248,242,.05)" }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "rgba(251,248,242,.38)" }}>
                {action.leg} KM {action.at_km.toFixed(1)} · {formatClock(action.at_clock_minutes)}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#FBF8F2", marginTop: 6 }}>{action.action_text}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BagsScreen({ payload }: { payload: RaceModePayload }) {
  return (
    <>
      <PhoneHeader payload={payload} />
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {payload.plan.bags.map((bag) => (
          <div key={bag.key} style={{ padding: "13px 15px", borderRadius: 10, background: "rgba(251,248,242,.05)" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <span style={{ fontSize: 14.5, color: "#FBF8F2", letterSpacing: "-.014em" }}>{bag.name}</span>
              <span className="mono" style={{ fontSize: 12, color: "rgba(251,248,242,.4)" }}>{bag.item_count}</span>
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "rgba(251,248,242,.34)", marginTop: 7 }}>
              {bag.when_label.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RaceModeBody({ planId }: { planId: string | null }) {
  const plans = useMyPlans(!planId);
  const fallback = (plans.data?.active ?? []).find((card) => card.plan_id)?.plan_id ?? null;
  /* `lastPlan()` is the offline path: with no `?plan=` and no network,
     `my-plans` cannot answer, and the saved copy is keyed by the id it would
     have returned. Read once on mount so the first render already has it. */
  const remembered = useSyncExternalStore(
    // Nothing changes it during a session, so the subscription is a no-op; the
    // server snapshot is null because the export prerenders without storage.
    () => () => {},
    lastPlan,
    () => null,
  );
  const id = planId ?? fallback ?? remembered;
  const live = useRaceMode(id);
  const online = useOnline();
  const display = useRaceDayDisplay();
  const wake = useWakeLock(true);

  /* The last good payload, kept on the device. Read once when the screen
     opens so it is already in hand if the signal goes mid-race, and written
     every time a fresh one arrives. */
  const [saved, setSaved] = useState<SavedPlan<RaceModePayload> | null>(null);
  useEffect(() => {
    if (!id) return;
    void loadPlan<RaceModePayload>(id).then(setSaved);
  }, [id]);
  useEffect(() => {
    if (id && live.data) {
      void savePlan(id, live.data);
      rememberLastPlan(id);
    }
  }, [id, live.data]);

  /* Live wins whenever it exists. The saved copy is a fallback, never a
     preference — a stale plan that looks current is the one thing this
     product must not do. */
  const data = live.data ?? saved?.payload ?? null;
  const showingSaved = !live.data && saved != null;
  const isPending = live.isPending && !data;
  const error = data ? null : live.error;

  const pendingDrift = useMemo(() => data?.pending_drift ?? [], [data]);

  if (!id && !plans.isPending) {
    return (
      <div style={{ ...CARD, padding: "80px 40px", border: "1px dashed rgba(21,20,15,.2)", textAlign: "center", boxShadow: "none" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>NOTHING TO TAKE TO THE LINE</div>
        <div style={{ margin: "18px auto 0", maxWidth: 440, fontSize: 26, lineHeight: 1.2, fontWeight: 500, letterSpacing: "-.03em" }}>
          Race Mode opens once a plan is solved.
        </div>
        <p style={{ margin: "12px auto 0", maxWidth: 420, fontSize: 15, lineHeight: 1.55, color: "#6B6455" }}>
          It is the whole plan cached on your phone — splits, cut-offs, fuelling and bags — so race
          day makes no network requests at all.
        </p>
        <Link href={routes.myPlans} className="btn-accent" style={{ display: "inline-flex", alignItems: "center", height: 46, padding: "0 24px", marginTop: 24, background: "#E4622F", color: "#fff", borderRadius: 7, fontSize: 15, fontWeight: 600 }}>
          My plans
        </Link>
      </div>
    );
  }

  if (error) return <ApiErrorState error={error} />;
  if (isPending || !data) {
    return (
      <div style={{ display: "flex", gap: 20 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} width={PHONE_W} height={580} radius={26} />)}
      </div>
    );
  }

  return (
    /* `data-race-display` drives the type and target sizes in globals.css,
       so one attribute scales the whole screen rather than every component
       growing its own idea of "large". */
    <div data-race-display={display.big ? "large" : undefined}>
      <div style={{ ...CARD, padding: "22px 26px", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.026em" }}>{data.course.name}</div>
            <div style={{ fontSize: 13.5, color: "#8C8578", marginTop: 5 }}>
              {formatLongDate(data.race.event_date)} · {data.course.place} · {data.race.start_time_local} start
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {/* Big type and bigger targets. A race plan is read with wet hands,
                in daylight, at heart rate — the default type is a desk size. */}
            <button
              type="button"
              onClick={display.toggle}
              aria-pressed={display.big}
              className="mono"
              style={{ minHeight: 44, padding: "0 14px", borderRadius: 7, border: "1px solid rgba(21,20,15,.18)", background: display.big ? "#15140F" : "transparent", color: display.big ? "#FBF8F2" : "#302C24", fontSize: 9.5, letterSpacing: ".13em", cursor: "pointer" }}
            >
              {display.big ? "LARGE TYPE ON" : "LARGE TYPE"}
            </button>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", whiteSpace: "nowrap", color: showingSaved ? "#A0701A" : "#3E7B55" }}>
              {/* Never "cached in full" while showing a saved copy: the athlete
                  needs to know which of the two they are looking at, and when
                  it was taken. */}
              {showingSaved
                ? `SAVED COPY · ${new Date(saved!.savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                : data.offline.complete
                  ? "CACHED IN FULL · NO REQUESTS ON RACE DAY"
                  : "PARTIAL CACHE"}
            </div>
            {!online && (
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#A0701A" }}>OFFLINE</span>
            )}
            {!wake.supported && (
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578" }}>
                SET YOUR SCREEN TIMEOUT LONG
              </span>
            )}
          </div>
        </div>
        {pendingDrift.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 18, padding: "13px 15px", borderRadius: 9, background: "rgba(224,163,60,.09)", border: "1px solid rgba(224,163,60,.36)" }}>
            <span className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#A0701A", flex: "none" }}>DRIFT OUTSTANDING</span>
            <span style={{ fontSize: 14, lineHeight: 1.45, color: "#3D3A31" }}>
              This copy predates a change you have not applied. Review it before you cache for the
              start line — finding out at kilometre ninety is the thing this warning exists to
              prevent.
            </span>
          </div>
        )}
        {data.plan.assumed_fields.length > 0 && (
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6B6455", marginTop: 14 }}>
            Assumed, because nothing measured was available:{" "}
            {data.plan.assumed_fields.join(", ")}.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 26, overflowX: "auto", paddingBottom: 8 }}>
        <Phone label="SPLITS"><SplitsScreen payload={data} /></Phone>
        <Phone label="CUT-OFFS"><GatesScreen payload={data} /></Phone>
        <Phone label="FUELLING"><FuellingScreen payload={data} /></Phone>
        <Phone label="BAGS"><BagsScreen payload={data} /></Phone>
      </div>

      <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".13em", color: "#B8B1A2", marginTop: 20 }}>
        {data.bundle.attribution.toUpperCase()}
      </div>
    </div>
  );
}

function RaceModeScreen() {
  const params = useSearchParams();
  const [planId] = useState<string | null>(params.get("plan"));

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
            <Link href={routes.raceMode} style={{ color: "#15140F" }}>Race mode</Link>
          </nav>
          <span className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#8C8578" }}>OFFLINE READY</span>
        </div>
      </header>

      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "44px 56px 96px" }}>
        <div className="mono" style={{ fontSize: 9.5, letterSpacing: ".17em", color: "#A8A192" }}>RACE DAY</div>
        <h1 style={{ margin: "16px 0 0", fontSize: 56, lineHeight: 0.96, fontWeight: 600, letterSpacing: "-.05em" }}>Race mode</h1>
        <p style={{ margin: "15px 0 0", maxWidth: 560, fontSize: 16.5, lineHeight: 1.5, color: "#5C574B" }}>
          Your whole plan, cached on the phone. No signal needed at the start line, in transition or
          on the far side of the bike loop.
        </p>

        <div style={{ marginTop: 32 }}>
          <RaceModeBody planId={planId} />
        </div>
      </div>
    </div>
  );
}

export default function GuardedRaceModePage() {
  return (
    <GuardedPage>
      <Suspense fallback={null}>
        <RaceModeScreen />
      </Suspense>
    </GuardedPage>
  );
}
