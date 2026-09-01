"use client";

/**
 * Who is signed in, and the three acts that change it.
 *
 * The access token is held in `tokenStore` (memory only), so a page reload
 * starts with no token even for a signed-in athlete. The refresh cookie is
 * still there though, so boot does one silent `POST /auth/refresh`: if it
 * succeeds the session is restored before anything renders a signed-out state,
 * and if it fails the user is simply anonymous. That single call is why
 * `status` starts at `"loading"` rather than `"anonymous"` — rendering a signed
 * out header for a moment and then swapping it is worse than waiting a beat.
 */

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { client, unwrap } from "@/lib/api/client";
import { refreshAccessToken, setSignOutHandler } from "@/lib/api/http";
import type { components } from "@/lib/api/schema";
import { clearAccessToken, setAccessToken } from "@/lib/api/tokenStore";

export type User = components["schemas"]["UserOut"];

export type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  signIn: (input: { email: string; password: string }) => Promise<User>;
  signUp: (input: { email: string; password: string; name?: string }) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const forgetSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setStatus("anonymous");
    // Anything cached was fetched as the previous user. Dropping it is not an
    // optimisation — leaving it would show one athlete another's plans.
    queryClient.clear();
  }, [queryClient]);

  // The fetch wrapper cannot import this module (it would be a cycle, and it is
  // not a React module), so it is handed the sign-out callback instead.
  useEffect(() => {
    setSignOutHandler(forgetSession);
    return () => setSignOutHandler(() => {});
  }, [forgetSession]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        setStatus("anonymous");
        return;
      }
      try {
        const me = await unwrap(client.GET("/api/v1/auth/me"));
        if (cancelled) return;
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (!cancelled) forgetSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forgetSession]);

  const adopt = useCallback((auth: components["schemas"]["AuthResponse"]) => {
    setAccessToken(auth.access_token);
    setUser(auth.user);
    setStatus("authenticated");
    return auth.user;
  }, []);

  const signIn = useCallback<AuthContextValue["signIn"]>(
    async (body) => adopt(await unwrap(client.POST("/api/v1/auth/login", { body }))),
    [adopt],
  );

  const signUp = useCallback<AuthContextValue["signUp"]>(
    async ({ email, password, name }) =>
      adopt(
        await unwrap(
          client.POST("/api/v1/auth/signup", { body: { email, password, name: name ?? null } }),
        ),
      ),
    [adopt],
  );

  const signOut = useCallback(async () => {
    try {
      await client.POST("/api/v1/auth/logout");
    } catch {
      // The server-side session may already be gone. Either way the local one
      // ends here — a failed logout must never leave the user looking signed in.
    }
    forgetSession();
  }, [forgetSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
