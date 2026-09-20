import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/map-check/`.
 *
 * A developer tool.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Map check",
  description:
    "An internal check of a course's geometry against its map tiles.",
  path: "/map-check",
  noindex: true,
});

export default function MapCheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
