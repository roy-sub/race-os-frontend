import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/signup/`.
 *
 * This layout exists only to carry it. The page is a Server Component and
 * could export `metadata` itself, but it is kept here so that every route in
 * the app declares its metadata the same way — and so no existing page file
 * had to be edited to add SEO.
 */
export const metadata: Metadata = pageMetadata({
  title: "Create an account",
  description:
    "Create a RaceOS account to enter a race and get pacing, fuelling, bags and every cut-off solved against the real course.",
  path: "/signup",
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
