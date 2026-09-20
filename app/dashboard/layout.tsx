import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/dashboard/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Dashboard",
  description:
    "Your next race, the state of your plan, and what needs your attention.",
  path: "/dashboard",
  noindex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
