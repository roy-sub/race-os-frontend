"use client";

import Link from "next/link";
import { Mark } from "./Mark";
import { routes } from "@/lib/routes";
import { useAuth } from "@/lib/auth/AuthProvider";

const NAV = [
  { href: routes.races, label: "Races", key: "races" },
  { href: routes.courseRecon, label: "Course recon", key: "courseRecon" },
  { href: routes.howItWorks, label: "How it works", key: "howItWorks" },
  { href: routes.pricing, label: "Pricing", key: "pricing" },
  { href: routes.dashboard, label: "Dashboard", key: "dashboard" },
  { href: routes.racePlan, label: "My plan", key: "racePlan" },
] as const;

type AppHeaderProps = {
  /** Which nav item to show as the active (dark) entry. */
  active?: (typeof NAV)[number]["key"];
  ctaLabel?: string;
  ctaHref?: string;
  /** Sticks below this header (e.g. a page-local sub-nav) — offsets its own top. */
  top?: number;
};

/** Sticky, always-opaque header shared by every interior/product page (Landing keeps its own transparent-on-scroll variant). */
export function AppHeader({ active, ctaLabel = "Build your plan", ctaHref = "#convert", top = 0 }: AppHeaderProps) {
  /**
   * This header is shared by the public pages *and* by signed-in ones that are
   * not part of the account shell — the race directory, course recon, and the
   * add-a-race form, which is guarded and therefore only ever seen by someone
   * who is already signed in.
   *
   * It used to render "Log in" unconditionally, so a signed-in athlete browsing
   * the directory was invited to sign in, and had no route back to their own
   * account from any of those pages. It now shows whoever is signed in.
   */
  const { status, user } = useAuth();
  const signedIn = status === "authenticated";
  const firstName = user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "Account";

  return (
    <header
      style={{
        position: "sticky",
        top,
        zIndex: 60,
        background: "rgba(241,238,232,.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(21,20,15,.10)",
      }}
    >
      <div
        style={{
          maxWidth: 1360,
          margin: "0 auto",
          padding: "0 56px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
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
          {signedIn ? (
            <Link
              href={routes.dashboard}
              style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14, fontWeight: 500, color: "#5C574B", whiteSpace: "nowrap" }}
            >
              <span
                aria-hidden
                style={{ width: 26, height: 26, borderRadius: "50%", background: "#D9D2C4", flex: "none" }}
              />
              {firstName}
            </Link>
          ) : (
            <Link href={routes.login} style={{ fontSize: 14, fontWeight: 500, color: "#5C574B" }}>
              Log in
            </Link>
          )}
          <a
            href={ctaHref}
            className="btn-dark-to-accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              height: 38,
              padding: "0 20px",
              background: "#15140F",
              color: "#F1EEE8",
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </header>
  );
}
