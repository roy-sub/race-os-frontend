import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/reset-password/`.
 *
 * Reached from a one-time emailed link; there is nothing here to index.
 *
 * This layout exists only to carry it. The page is a Server Component and
 * could export `metadata` itself, but it is kept here so that every route in
 * the app declares its metadata the same way — and so no existing page file
 * had to be edited to add SEO.
 */
export const metadata: Metadata = pageMetadata({
  title: "Reset your password",
  description:
    "Choose a new password for your RaceOS account.",
  path: "/reset-password",
  noindex: true,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
