import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/plans/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Your plans",
  description:
    "Every race you have entered, every plan you have solved, and their drafts.",
  path: "/plans",
  noindex: true,
});

export default function PlansLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
