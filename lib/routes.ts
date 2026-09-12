/** Central route map so every page's nav/footer links point at the same real paths. */
export const routes = {
  home: "/",
  races: "/races",
  addRace: "/races/add",
  howItWorks: "/how-it-works",
  pricing: "/pricing",
  dashboard: "/dashboard",
  myPlans: "/plans",
  courseRecon: "/course-recon",
  racePlan: "/plan",
  planBuilder: "/plan-builder",
  login: "/login",
  signup: "/signup",
  resetPassword: "/reset-password",
  onboarding: "/onboarding",
  raceMode: "/race-mode",
  postRace: "/post-race",
  settings: "/settings",
  notifications: "/notifications",
  coach: "/coach",
  admin: "/admin",
  adminAccounts: "/admin/accounts",
  guide: "/guide",
  sharedPlan: "/shared",
} as const;

/**
 * A course's recon page.
 *
 * The slug travels as a query parameter rather than a path segment because the
 * site is a static export: a dynamic segment would have to be enumerable at
 * build time, and the only way to enumerate courses is to ask the backend —
 * which would make every build depend on it being up, and would mean hardcoding
 * the slug list the day it is not.
 */
export function courseReconHref(slug: string): string {
  return `${routes.courseRecon}?course=${encodeURIComponent(slug)}`;
}
