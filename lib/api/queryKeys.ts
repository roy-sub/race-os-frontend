/**
 * Query keys, namespaced per resource.
 *
 * Every key starts with its resource name so a mutation can invalidate a whole
 * resource (`["plans"]`) or one row (`["plans", "detail", id]`) without knowing
 * which screens are mounted. Keys are built here rather than inline at call
 * sites so an invalidation and a query cannot drift apart.
 */

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
    providers: () => [...queryKeys.auth.all, "providers"] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: (params: { dist?: string | null; q?: string | null } = {}) =>
      [...queryKeys.courses.all, "list", params] as const,
    detail: (ref: string) => [...queryKeys.courses.all, "detail", ref] as const,
    recon: (ref: string) => [...queryKeys.courses.all, "recon", ref] as const,
  },
  races: {
    all: ["races"] as const,
    list: () => [...queryKeys.races.all, "list"] as const,
    detail: (id: string) => [...queryKeys.races.all, "detail", id] as const,
    forecast: (id: string) => [...queryKeys.races.all, "forecast", id] as const,
  },
  plans: {
    all: ["plans"] as const,
    list: () => [...queryKeys.plans.all, "list"] as const,
    mine: () => [...queryKeys.plans.all, "mine"] as const,
    detail: (id: string) => [...queryKeys.plans.all, "detail", id] as const,
    exports: (id: string) => [...queryKeys.plans.all, "exports", id] as const,
  },
  constraints: {
    all: ["constraints"] as const,
    list: () => [...queryKeys.constraints.all, "list"] as const,
    history: (key: string) => [...queryKeys.constraints.all, "history", key] as const,
  },
  billing: {
    all: ["billing"] as const,
    entitlements: (raceId?: string | null) =>
      [...queryKeys.billing.all, "entitlements", raceId ?? null] as const,
    prices: () => [...queryKeys.billing.all, "prices"] as const,
    invoices: () => [...queryKeys.billing.all, "invoices"] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: { unread?: boolean; limit?: number; offset?: number } = {}) =>
      [...queryKeys.notifications.all, "list", params] as const,
    preferences: () => [...queryKeys.notifications.all, "preferences"] as const,
  },
  postRace: {
    all: ["post-race"] as const,
    analyses: () => [...queryKeys.postRace.all, "analyses"] as const,
    analysis: (id: string) => [...queryKeys.postRace.all, "analysis", id] as const,
  },
  coach: {
    all: ["coach"] as const,
    board: () => [...queryKeys.coach.all, "board"] as const,
    athletes: () => [...queryKeys.coach.all, "athletes"] as const,
  },
  admin: {
    all: ["admin"] as const,
    overview: () => [...queryKeys.admin.all, "overview"] as const,
    kpis: () => [...queryKeys.admin.all, "kpis"] as const,
    health: () => [...queryKeys.admin.all, "health"] as const,
    incidents: () => [...queryKeys.admin.all, "incidents"] as const,
  },
  shared: {
    all: ["shared"] as const,
    plan: (token: string) => [...queryKeys.shared.all, "plan", token] as const,
  },
  submissions: {
    all: ["course-submissions"] as const,
    list: () => [...queryKeys.submissions.all, "list"] as const,
    detail: (id: string) => [...queryKeys.submissions.all, "detail", id] as const,
  },
} as const;
