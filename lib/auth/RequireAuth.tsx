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

  useEffect(() => {
    if (status === "anonymous") router.replace(loginHref(pathname));
  }, [status, router, pathname]);

  if (status === "authenticated") return <>{children}</>;
  return <>{fallback}</>;
}
