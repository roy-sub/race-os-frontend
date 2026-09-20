import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/onboarding/`.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Set up your account",
  description:
    "Tell RaceOS what you are training for, so the first plan starts in the right place.",
  path: "/onboarding",
  noindex: true,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
