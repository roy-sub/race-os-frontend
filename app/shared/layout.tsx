import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/shared/`.
 *
 * Opened with a token in the address. Indexing it would publish whatever the
 * crawler happened to be handed.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Shared plan",
  description:
    "A plan someone shared with you.",
  path: "/shared",
  noindex: true,
});

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
