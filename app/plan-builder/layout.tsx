import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/plan-builder/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Build a plan",
  description:
    "Answer what you can hold, and the solver does the rest against your real course.",
  path: "/plan-builder",
  noindex: true,
});

export default function PlanBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
