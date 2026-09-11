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
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api/tokenStore";

export type User = components["schemas"]["UserOut"];

export type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  signIn: (input: { email: string; password: string }) => Promise<User>;
  signUp: (input: { email: string; password: string; name?: string }) => Promise<User>;
  signOut: () => Promise<void>;
  /** Re-read `GET /auth/me`, after a change to the athlete's own record. */
  refresh: () => Promise<void>;
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
        // Dropped *before* the status flips, for the same reason `adopt` does
        // it: anything already cached was fetched during the moment between
        // this page loading and the refresh landing — that is, as nobody. The
        // directory is the case that bites, because what it returns depends on
        // who is asking: fetched anonymously it carries the marketing showcase,
        // which a signed-in athlete must never be shown. Without this, one
        // unlucky race between a query and a token left that on screen for the
        // rest of the session, because nothing would ever refetch it.
        queryClient.clear();
        setUser(me);
        setStatus("authenticated");
      } catch {
        if (!cancelled) forgetSession();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forgetSession, queryClient]);

  const adopt = useCallback(
    (auth: components["schemas"]["AuthResponse"]) => {
      // Cleared on the way *in* as well as on the way out.
      //
      // Sign-out already drops the cache, but that is not enough on its own:
      // a signed-out visitor browses the public directory and fills the cache
      // as nobody, and a second athlete signing in on a shared machine after
      // the first has closed the tab — or after a refresh that failed — would
      // otherwise render whatever the previous session left behind for the
      // instant before the refetch lands. Dropping it here means no query can
      // outlive the identity it was fetched under.
      queryClient.clear();
      setAccessToken(auth.access_token);
      setUser(auth.user);
      setStatus("authenticated");
      return auth.user;
    },
    [queryClient],
  );

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

  const refresh = useCallback(async () => {
    // Only when someone is already signed in: calling it while anonymous
    // would 401 and sign the (nobody) out, which is noise at best.
    if (!getAccessToken()) return;
    try {
      setUser(await unwrap(client.GET("/api/v1/auth/me")));
    } catch {
      // A failed re-read is not evidence the session is gone — the 401 path
      // in `apiFetch` handles that. Keep what we have rather than blanking a
      // header mid-edit.
    }
  }, []);

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
    () => ({ user, status, signIn, signUp, signOut, refresh }),
    [user, status, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>.");
  return value;
}
