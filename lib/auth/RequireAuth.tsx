"use client";

/**
 * The route guard.
 *
 * Three states, and the middle one matters: while `status` is `"loading"` the
 * boot refresh has not answered yet, so redirecting would bounce a signed-in
 * athlete to the login screen on every reload. It waits instead.
 *
 * Where a redirect does happen it carries `?next=` so the user lands back on the
 * page they asked for. `next` is deliberately restricted to a same-origin path:
 * accepting an absolute URL here would turn the login screen into an open
 * redirect, which is a phishing primitive.
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/lib/routes";
import { useAuth } from "./AuthProvider";

/** Only a path on this site. Anything else — `//evil.com`, `https://…` — is dropped. */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function useIntendedPath(): string {
  const params = useSearchParams();
  return safeNextPath(params.get("next")) ?? routes.dashboard;
}

/** Build the login URL that returns here afterwards. */
export function loginHref(intended: string): string {
  return `${routes.login}?next=${encodeURIComponent(intended)}`;
}

export function RequireAuth({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    if (status !== "anonymous") return;
    // The query string is part of where they were going, not decoration:
    // /plan/?plan=<id> without its query is just an empty plan page. This is
    // built from `pathname` plus `search` rather than `location.href` so it
    // stays a same-origin path by construction.
    const query = search.toString();
    router.replace(loginHref(query ? `${pathname}?${query}` : pathname));
  }, [status, router, pathname, search]);

  if (status === "authenticated") return <>{children}</>;
  return <>{fallback}</>;
}
