"use client";

import Link from "next/link";
import { Mark } from "./Mark";
import { MediaPlaceholder } from "./MediaPlaceholder";
import { routes } from "@/lib/routes";
import { useCourses } from "@/lib/api/courses";

const productLinks = [
  { href: `${routes.home}#solver`, label: "The solver" },
  { href: `${routes.home}#bags`, label: "Five bags" },
  { href: routes.dashboard, label: "Dashboard" },
  { href: routes.pricing, label: "Pricing" },
  { href: routes.raceMode, label: "Race Mode" },
];

/**
 * The Courses column, read from the directory rather than written down.
 *
 * It used to be three hardcoded names — "Tramuntana Full", "North Shore Full",
 * "Kalmar 70.3" — every one of them pointing at `/course-recon` with no course
 * on it, so all three went to the same page regardless of which you clicked.
 * Two of the three were demo courses the catalogue has since retired, and the
 * third is the showcase, which a signed-in athlete is not supposed to see at
 * all. A footer on every page of the site, naming races that are not there.
 *
 * Reading the real directory fixes all of it at once, and cannot go stale: the
 * viewer's own visibility rules already decide what comes back, so a signed-in
 * athlete gets their season and a visitor gets the showcase.
 */
function useCourseLinks(): { href: string; label: string }[] {
  const { data } = useCourses();
  const links = (data?.data ?? [])
    .filter((course) => course.availability === "available")
    .slice(0, 3)
    .map((course) => ({
      href: `${routes.courseRecon}?course=${encodeURIComponent(course.slug)}`,
      label: course.name,
    }));
  return [...links, { href: routes.races, label: "Race directory" }];
}

const athleteLinks = [
  { href: routes.guide, label: "First iron distance" },
  { href: routes.coach, label: "Coaches" },
  { href: "#", label: "Race reports" },
  { href: routes.howItWorks, label: "Method" },
];

const socials = [
  {
    href: "https://x.com/theroyprojecthq",
    label: "X",
    path: "M18.9 2H22l-6.8 7.7L23 22h-6.4l-5-6.6L5.8 22H2.7l7.2-8.2L1.6 2H8l4.7 6.2L18.9 2zm-1.1 18h1.8L6.4 3.8H4.5L17.8 20z",
  },
  {
    href: "https://www.instagram.com/roy_subhradiproy/",
    label: "Instagram",
    path: "M12 7.1a5 5 0 110 10 5 5 0 010-10zm0 1.8a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4zm5.2-2a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.23 1 .5 1.5.95.4.45.7.9.9 1.5.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.5-.5.4-.9.7-1.5.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.5-.9-.4-.5-.7-.9-.9-1.5-.2-.4-.4-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.5.5-.45.9-.72 1.5-.95.4-.17 1-.37 2.2-.42C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.07-1 .05-1.5.2-1.9.35-.4.15-.7.33-1 .63-.3.3-.5.6-.6 1-.2.4-.3.9-.4 1.9-.07 1.2-.07 1.5-.07 4s0 2.8.07 4c.1 1 .2 1.5.4 1.9.1.4.3.7.6 1 .3.3.6.5 1 .6.4.2.9.3 1.9.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1-.1 1.5-.2 1.9-.4.4-.1.7-.3 1-.6.3-.3.5-.6.6-1 .2-.4.3-.9.4-1.9.1-1.2.1-1.5.1-4s0-2.8-.1-4c-.1-1-.2-1.5-.4-1.9-.1-.4-.3-.7-.6-1-.3-.3-.6-.48-1-.63-.4-.15-.9-.3-1.9-.35C15.5 4 15.1 4 12 4z",
  },
  {
    href: "https://www.linkedin.com/in/subhradip-roy/",
    label: "LinkedIn",
    path: "M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C21.3 8.65 22 11 22 14.1V21h-4v-6.1c0-1.5-.5-2.5-1.8-2.5-1.05 0-1.7.7-1.95 1.4-.1.25-.12.6-.12.95V21h-4V9z",
  },
];

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 14, color: "#A39B8A", fontWeight: 500 }}>{title}</div>
      {links.map((l) => (
        <Link key={l.label} href={l.href} style={{ fontSize: 15.5, fontWeight: 500 }}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

type FooterProps = {
  /** Extra copyright-line suffix, e.g. " · COURSE BUNDLE v2026.2". */
  extra?: string;
};

/** Shared footer — dark media band, inset cream panel, five columns, solo-founder credit. */
export function Footer({ extra = "" }: FooterProps) {
  const courseLinks = useCourseLinks();
  return (
    <footer style={{ position: "relative", background: "#15140F", padding: 20, overflow: "hidden" }}>
      <MediaPlaceholder
        path="assets/footer/backdrop.jpg"
        background="linear-gradient(140deg,#2E271F 0%,#1A1713 55%,#100E0C 100%)"
        style={{ position: "absolute", inset: 0 }}
      />
      <div style={{ position: "relative", background: "#FBF8F2", borderRadius: 9, padding: "56px 52px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr)) 200px", gap: 40 }}>
          <FooterCol title="Product" links={productLinks} />
          <FooterCol title="Courses" links={courseLinks} />
          <FooterCol title="Athletes" links={athleteLinks} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 14, color: "#A39B8A", fontWeight: 500 }}>Company</div>
            <Link href="#" style={{ fontSize: 15.5, fontWeight: 500 }}>About</Link>
            <Link href="#" style={{ fontSize: 15.5, fontWeight: 500 }}>Changelog</Link>
            <Link href="#" style={{ fontSize: 15.5, fontWeight: 500 }}>Status</Link>
            <div style={{ fontSize: 14, color: "#A39B8A", fontWeight: 500, marginTop: 12 }}>Talk to a human</div>
            <Link href="mailto:hello@raceos.cc" style={{ fontSize: 15.5, fontWeight: 500 }}>hello@raceos.cc</Link>
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#A39B8A", fontWeight: 500, marginBottom: 16 }}>Follow</div>
            <div style={{ display: "flex", gap: 8 }}>
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="social-icon"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: "#F1EDE4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#15140F",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, marginTop: 80 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Mark width={60} height={40} />
              <span style={{ fontSize: 64, fontWeight: 600, letterSpacing: "-.055em", lineHeight: 0.9 }}>RaceOS</span>
            </div>
            <div className="mono" style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 20, fontSize: 11, letterSpacing: ".11em", color: "#8C8578" }}>
              <span>BY</span>
              <a
                href="https://theroyproject.com"
                target="_blank"
                rel="noreferrer"
                className="link-accent"
                style={{ color: "#15140F", borderBottom: "1px solid rgba(228,98,47,.45)", paddingBottom: 1 }}
              >
                THEROYPROJECT.COM
              </a>
              <span>↗</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: ".12em", color: "#A39B8A" }}>RACEOS © 2026{extra}</div>
            <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 14, fontWeight: 500 }}>
              <Link href="#">Terms</Link>
              <Link href="#">Privacy</Link>
              <Link href={routes.howItWorks}>Method</Link>
              <Link href="#">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
