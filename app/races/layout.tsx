import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/races/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Races",
  description:
    "Every race RaceOS has solved — the swim, the climbs, the cut-offs and the conditions for each. Open any course and read it for free.",
  path: "/races",
  hasNestedRoutes: true,
});

export default function RacesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
