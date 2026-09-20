import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/login/`.
 *
 * Indexable, unlike the screens behind it: people search for a product's sign-in
 * page by name, and this is the only door. It carries no data of its own.
 *
 * This layout exists only to carry it. The page is a Server Component and
 * could export `metadata` itself, but it is kept here so that every route in
 * the app declares its metadata the same way — and so no existing page file
 * had to be edited to add SEO.
 */
export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  description:
    "Sign in to RaceOS to open your races, your plans and your race-day cards.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
