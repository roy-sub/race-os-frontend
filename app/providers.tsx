"use client";

/**
 * Every provider the client tree needs, in one place.
 *
 * The `QueryClient` is created inside `useState` rather than at module scope so
 * that each browser session gets its own cache. A module-level client is shared
 * across requests when this file is evaluated on the server, which on a
 * multi-tenant page means one user can be served another's cached plan.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError } from "@/lib/api/errors";
import { AuthProvider } from "@/lib/auth/AuthProvider";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server state that a solve can change; a minute is long enough to stop
        // refetch storms and short enough that a drift check is not stale.
        staleTime: 60_000,
        retry(failureCount, error) {
          // A 4xx is an answer, not a hiccup. Retrying a 402 or a 422 just
          // delays the paywall or the validation message the user needs to see.
          if (error instanceof ApiError) {
            if (error.status >= 400 && error.status < 500) return false;
            return failureCount < 2;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        // A mutation is a deliberate act. Replaying it silently could double a
        // charge or create a second race, so retries are the caller's choice.
        retry: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
