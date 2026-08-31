"use client";

/**
 * Social login providers, read from the API rather than hardcoded.
 *
 * `GET /auth/providers` returns `{"providers": []}` — an object wrapping an
 * empty array — and there is no OAuth code behind it. Rendering buttons *from*
 * that array is the whole point: V1 shows none, and the day a provider is added
 * backend-side the buttons appear with no frontend release.
 */

import { useQuery } from "@tanstack/react-query";
import { client, unwrap } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/queryKeys";

export type AuthProviderRow = {
  /** e.g. "google". Used for the callback URL and as the React key. */
  id: string;
  /** e.g. "Continue with Google". */
  name: string;
  /** Swatch colour, when the backend supplies one. */
  tone?: string;
};

export function useAuthProviders() {
  return useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: async (): Promise<AuthProviderRow[]> => {
      const body = await unwrap(client.GET("/api/v1/auth/providers"));
      const rows = (body as { providers?: unknown }).providers;
      if (!Array.isArray(rows)) return [];
      // Tolerant of both a bare id and a full row, so adding a provider backend
      // side does not require the two to be released together.
      return rows.map((row): AuthProviderRow => {
        if (typeof row === "string") return { id: row, name: `Continue with ${row}` };
        const r = row as Partial<AuthProviderRow>;
        return {
          id: String(r.id ?? r.name ?? ""),
          name: String(r.name ?? r.id ?? ""),
          tone: typeof r.tone === "string" ? r.tone : undefined,
        };
      });
    },
    staleTime: Infinity,
  });
}
