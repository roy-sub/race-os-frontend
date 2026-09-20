import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/race-mode/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Race mode",
  description:
    "Your plan, stripped to what you need while you are racing it.",
  path: "/race-mode",
  noindex: true,
});

export default function RaceModeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
