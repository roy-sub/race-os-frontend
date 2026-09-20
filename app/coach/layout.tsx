import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/coach/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Coach board",
  description:
    "Your athletes, their races and the plans they are working from.",
  path: "/coach",
  noindex: true,
});

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
