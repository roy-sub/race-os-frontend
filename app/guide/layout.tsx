import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/guide/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Guide",
  description:
    "How to read a RaceOS plan: pacing, fuelling, the five bags, the cut-off ladder, and what to do when the forecast moves.",
  path: "/guide",
});

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
