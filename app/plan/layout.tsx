import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/plan/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Your plan",
  description:
    "One race, solved: pacing, fuelling, bags, transitions and cut-offs.",
  path: "/plan",
  noindex: true,
});

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
