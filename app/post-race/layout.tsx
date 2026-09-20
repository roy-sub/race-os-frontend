import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/post-race/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Race review",
  description:
    "What actually happened against what was planned, and what it changes next time.",
  path: "/post-race",
  noindex: true,
});

export default function PostRaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
