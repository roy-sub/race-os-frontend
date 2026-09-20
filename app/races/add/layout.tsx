import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/races/add/`.
 *
 * A signed-in submission form.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Add a race",
  description:
    "Submit a course for review so RaceOS can solve it.",
  path: "/races/add",
  noindex: true,
});

export default function RacesAddLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
