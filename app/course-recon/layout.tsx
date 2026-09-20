import type { Metadata } from "next";

import { pageMetadata } from "@/lib/seo/pageMetadata";

/**
 * Metadata for `/course-recon/`.
 *
 * The older address for a course page, kept working for anyone holding the link.
 * `/races/<slug>/` is the indexable version, and two addresses for one course
 * would only compete with each other.
 *
 * This layout exists only to carry it. The page itself is a Client Component,
 * and a Client Component cannot export `metadata` — so the title, description
 * and canonical URL live in a Server Component beside it that renders its
 * children untouched.
 */
export const metadata: Metadata = pageMetadata({
  title: "Course recon",
  description:
    "The full read of a course: elevation, surface, exposure and every cut-off.",
  path: "/course-recon",
  noindex: true,
});

export default function CourseReconLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
