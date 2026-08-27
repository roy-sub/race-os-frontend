"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mark } from "./Mark";
import { routes } from "@/lib/routes";

const NAV = [
  { href: routes.races, label: "Races" },
  { href: routes.howItWorks, label: "How it works" },
  { href: routes.pricing, label: "Pricing" },
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.myPlans, label: "My plans" },
];

type HeaderProps = {
  /** "transparent": starts see-through over a dark hero and solidifies on scroll (marketing pages with a dark hero). */
  variant?: "transparent" | "solid";
};

/** Sticky site header shared across every marketing/app page. */
export function Header({ variant = "transparent" }: HeaderProps) {
  const [scrolled, setScrolled] = useState(variant === "solid");

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const navBg = scrolled ? "rgba(241,238,232,.9)" : "rgba(12,11,10,0)";
  const navLine = scrolled ? "rgba(21,20,15,.1)" : "rgba(255,255,255,0)";
  const navFg = scrolled ? "#15140F" : "#FBF8F2";
  const navMuted = scrolled ? "#5C574B" : "rgba(255,255,255,.72)";

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        minWidth: 1320,
        zIndex: 80,
        background: navBg,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${navLine}`,
        transition: "background .4s ease, border-color .4s ease",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "0 48px",
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <Link href={routes.home} style={{ display: "flex", alignItems: "center", gap: 11, color: navFg }}>
          <Mark />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.035em" }}>RaceOS</span>
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 36, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} style={{ color: navMuted }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href={routes.login} style={{ fontSize: 14, fontWeight: 500, color: navMuted }}>
            Log in
          </Link>
          <Link
            href={routes.courseRecon}
            className="btn-accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              height: 38,
              padding: "0 18px",
              background: "#E4622F",
              color: "#fff",
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
