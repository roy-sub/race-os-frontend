"use client";

import Link from "next/link";
import { clickable } from "@/lib/a11y";
import { useCallback, useState, type ReactNode } from "react";
import { Mark } from "./Mark";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { routes } from "@/lib/routes";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Skeleton } from "./Skeleton";
import { CommandPalette, usePaletteShortcut } from "./CommandPalette";

const NAV = [
  { href: routes.courseRecon, label: "Course recon", key: "courseRecon" },
  { href: routes.racePlan, label: "Race plan", key: "racePlan" },
  { href: routes.pricing, label: "Pricing", key: "pricing" },
  { href: routes.dashboard, label: "Dashboard", key: "dashboard" },
  { href: routes.myPlans, label: "My plans", key: "myPlans" },
  { href: routes.settings, label: "Settings", key: "settings" },
] as const;

export type AccountAlert = { title: string; body: string; when: string; color: string };

type AccountHeaderProps = {
  active?: (typeof NAV)[number]["key"];
  alerts?: AccountAlert[];
  /**
   * Override the line under the account name.
   *
   * Only the coach console passes this. Everywhere else it is read from the
   * account's own tier — it used to default to the literal string "RACE PLAN",
   * which told every free account, on every page, that it had bought something
   * it had not.
   */
  roleLabel?: string;
  /**
   * A page-specific control, rendered before the search box.
   *
   * Settings uses it for its save indicator. It exists so that a page needing
   * one extra affordance can have it without forking the whole header — which
   * is what Settings did before, ending up with a different nav, no
   * notifications bell, and no way to sign out at all.
   */
  aside?: ReactNode;
};

/** `users.tier` as a person would read it. */
const TIER_LABEL: Record<string, string> = {
  free: "FREE ACCOUNT",
  per_race: "RACE PLAN",
  season: "SEASON PASS",
  coach: "COACH",
};

/**
 * Sticky signed-in header shared by every app-side page: search, alerts bell,
 * account.
 *
 * The name is whoever is actually signed in, from `GET /auth/me` by way of the
 * auth context — not a prop, so no page can pass the wrong one.
 */
export function AccountHeader({ active, alerts = [], roleLabel, aside }: AccountHeaderProps) {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { user, status, signOut } = useAuth();

  // Listening from the header rather than from inside the palette: the palette
  // is not mounted until it opens, so something has to be listening while it
  // is closed.
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  usePaletteShortcut(openPalette);

  // An account with no display name is normal — `name` is optional at signup —
  // so the email is the fallback rather than an invented placeholder.
  const displayName = user?.name?.trim() || user?.email || null;

  // The caller's label wins where one is given; otherwise the account's own
  // tier, and nothing at all until it has loaded — a guess that is corrected a
  // moment later is worse than a blank line.
  const label = roleLabel ?? (user ? (TIER_LABEL[user.tier] ?? user.tier.toUpperCase()) : "");

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 70, background: "rgba(241,238,232,.92)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(21,20,15,.10)" }}>
      <div style={{ maxWidth: 1360, margin: "0 auto", padding: "0 56px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 40 }}>
        <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Mark />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 34, fontSize: 14, fontWeight: 500, color: "#5C574B", whiteSpace: "nowrap" }}>
          {NAV.map((item) => (
            <Link key={item.key} href={item.href} style={{ color: item.key === active ? "#15140F" : "#5C574B" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {aside}
          {/* A button, not an input. It used to be a text field wired to
              nothing — a box inviting a query the product could not answer,
              and one a keyboard user could tab into and type a whole sentence
              in for no result. It opens the palette, which is where the
              typing actually happens. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-haspopup="dialog"
            aria-label="Search races, plans, courses and help. Shortcut: Command K"
            style={{ display: "flex", alignItems: "center", gap: 9, height: 34, padding: "0 12px", border: "1px solid rgba(21,20,15,.14)", borderRadius: 6, width: 196, background: "rgba(255,255,255,.5)", cursor: "pointer", textAlign: "left" }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flex: "none" }}>
              <circle cx="7" cy="7" r="4.6" stroke="#8C8578" strokeWidth="1.5" />
              <path d="M10.6 10.6 14 14" stroke="#8C8578" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#8C8578", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Search
            </span>
            <kbd className="mono" style={{ fontSize: 9.5, letterSpacing: ".08em", color: "#A8A192", flex: "none" }}>⌘K</kbd>
          </button>
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setAlertsOpen((o) => !o)}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                border: `1px solid ${alertsOpen ? "rgba(21,20,15,.3)" : "rgba(21,20,15,.14)"}`,
                borderRadius: 6,
                cursor: "pointer",
                background: alertsOpen ? "rgba(21,20,15,.06)" : "rgba(255,255,255,.5)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M4 6.5a4 4 0 0 1 8 0c0 3 .9 4.3 1.4 4.8.3.3.1.7-.3.7H2.9c-.4 0-.6-.4-.3-.7C3.1 10.8 4 9.5 4 6.5Z" stroke="#5C574B" strokeWidth="1.4" />
                <path d="M6.6 14a1.6 1.6 0 0 0 2.8 0" stroke="#5C574B" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {alerts.length > 0 && (
                <span
                  className="mono"
                  style={{
                    position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8,
                    background: "#E4622F", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #F1EEE8",
                  }}
                >
                  {alerts.length}
                </span>
              )}
            </div>
            {alertsOpen && (
              <div style={{ position: "absolute", top: 44, right: 0, width: 330, background: "#FBF8F2", border: "1px solid rgba(21,20,15,.1)", borderRadius: 10, boxShadow: "0 24px 60px -28px rgba(21,20,15,.4)", overflow: "hidden", zIndex: 90 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid rgba(21,20,15,.08)" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".16em", color: "#8C8578" }}>ALERTS</span>
                  <span {...clickable(() => setAlertsOpen(false))} className="mono link-accent" style={{ fontSize: 14, color: "#A8A192", cursor: "pointer", lineHeight: 1 }}>×</span>
                </div>
                {alerts.map((a) => (
                  <div key={a.title} className="row-hover-faint" style={{ display: "flex", gap: 12, padding: "16px 18px", borderBottom: "1px solid rgba(21,20,15,.06)", cursor: "pointer" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, marginTop: 6, flex: "none" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-.015em" }}>{a.title}</div>
                      <div style={{ fontSize: 12.5, lineHeight: 1.45, color: "#8C8578", marginTop: 4 }}>{a.body}</div>
                      <div className="mono" style={{ fontSize: 9, letterSpacing: ".13em", color: "#B8B1A2", marginTop: 7 }}>{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative", paddingLeft: 16, borderLeft: "1px solid rgba(21,20,15,.12)" }}>
            <div
              onClick={() => displayName && setMenuOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: displayName ? "pointer" : "default" }}
            >
              {/* `assets/account/avatar.jpg` never existed, so this asked for
                  five files and drew a grey disc anyway. The athlete's own
                  `avatar_url` is the only avatar this app has; without one the
                  disc is the honest answer, and costs no requests. */}
              <MediaPlaceholder
                path={user?.avatar_url ?? ""}
                alt=""
                background="#D8D0C2"
                style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }}
              />
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-.01em" }}>
                  {displayName ?? (status === "loading" ? <Skeleton width={96} height={12} /> : "Signed out")}
                </div>
                <div className="mono" style={{ fontSize: 8.5, letterSpacing: ".12em", color: "#8C8578", marginTop: 2 }}>{label}</div>
              </div>
            </div>
            {menuOpen && (
              <div style={{ position: "absolute", top: 46, right: 0, minWidth: 180, background: "#FBF8F2", border: "1px solid rgba(21,20,15,.1)", borderRadius: 10, boxShadow: "0 24px 60px -28px rgba(21,20,15,.4)", overflow: "hidden", zIndex: 90 }}>
                <Link href={routes.settings} onClick={() => setMenuOpen(false)} className="row-hover-faint" style={{ display: "block", padding: "12px 16px", fontSize: 13.5, color: "#15140F" }}>Settings</Link>
                <div
                  onClick={() => { setMenuOpen(false); void signOut(); }}
                  className="row-hover-faint"
                  style={{ padding: "12px 16px", fontSize: 13.5, color: "#15140F", cursor: "pointer", borderTop: "1px solid rgba(21,20,15,.06)" }}
                >
                  Sign out
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </header>
  );
}
