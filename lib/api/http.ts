/**
 * The one fetch every request in the app goes through.
 *
 * It is installed as `openapi-fetch`'s `fetch` option rather than layered on top
 * as middleware, so there is exactly one place that knows about tokens, refresh
 * and the error envelope, and no typed call can accidentally bypass it.
 *
 * Responsibilities, in order:
 *
 * 1. Attach the in-memory access token.
 * 2. Send credentials, so the httpOnly refresh cookie rides along.
 * 3. On a 401, refresh **once** — collapsed across concurrent callers — and
 *    replay the original request. A second 401 signs the user out rather than
 *    looping.
 * 4. Turn every non-2xx into an `ApiError` carrying `code` and `request_id`.
 */

import { API_BASE_URL } from "../env";
import { ApiError, NetworkError, toApiError } from "./errors";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStore";

const REQUEST_ID_HEADER = "X-Request-ID";
const REFRESH_PATH = "/api/v1/auth/refresh";

/**
 * Proof to the API that a request came from our own client.
 *
 * `/auth/refresh` is authenticated by the httpOnly cookie alone, and that
 * cookie is `SameSite=None` in production because the site and the API sit on
 * different registrable domains. A POST carrying only safelisted headers is a
 * CORS "simple request", so any page could have made it with the athlete's
 * cookie attached: it could not read the reply, but the rotated `Set-Cookie`
 * still landed, and the next real refresh tripped the backend's token-reuse
 * detection and signed the athlete out everywhere.
 *
 * This header is not on the CORS safelist, so sending it forces a preflight,
 * and the preflight is answered against the API's origin allowlist. The
 * backend requires it on that route.
 */
const CLIENT_HEADER = "X-RaceOS-Client";

/** Paths where a 401 is the answer, not a stale token — refreshing would be noise. */
const NO_REFRESH_PATHS = [
  "/api/v1/auth/refresh",
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/logout",
];

/** Called when refresh fails, so the app can drop its user and redirect. */
type SignOutHandler = () => void;
let onSignedOut: SignOutHandler = () => {};

export function setSignOutHandler(handler: SignOutHandler): void {
  onSignedOut = handler;
}

/**
 * The in-flight refresh, if any.
 *
 * Single-flight matters: a screen that fires five queries on mount would
 * otherwise send five refreshes, and since the backend *rotates* the refresh
 * token, four of them would present a token that had just been consumed and the
 * user would be signed out by their own parallelism.
 */
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Whether the last refresh failed because the network was unreachable, as
 * opposed to being refused.
 *
 * The distinction is the whole point. "The server said no" means the session
 * is over; "I could not reach the server" means nothing about the session at
 * all, and treating the two alike signed an athlete out of their own cached
 * plan the moment they lost signal — which is precisely race morning.
 */
export function refreshFailedOffline(): boolean {
  return lastRefreshOffline;
}

let lastRefreshOffline = false;

export function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json", [CLIENT_HEADER]: "web" },
      });
      lastRefreshOffline = false;
      if (!response.ok) return null;
      const body = (await response.json()) as { access_token?: unknown };
      const token = typeof body.access_token === "string" ? body.access_token : null;
      setAccessToken(token);
      return token;
    } catch {
      // A network failure is not proof the session is dead, so it does not sign
      // the user out here — the caller's replay will surface the real error.
      lastRefreshOffline = true;
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function pathOf(url: string): string {
  try {
    return new URL(url, API_BASE_URL).pathname;
  } catch {
    return url;
  }
}

async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    return undefined;
  }
}

async function send(request: Request): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(request.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  // `include` is what carries the httpOnly refresh cookie cross-origin. It is
  // paired with an explicit CORS_ALLOWED_ORIGINS entry on the backend; a
  // wildcard origin and credentials are mutually exclusive by spec.
  return fetch(new Request(request, { headers, credentials: "include" }));
}

export async function apiFetch(input: Request | string, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : new Request(input, init);
  const path = pathOf(request.url);

  let response: Response;
  try {
    // The body of a Request is a single-use stream, so a replay needs its own
    // clone taken before the first attempt consumes it.
    const replay = NO_REFRESH_PATHS.includes(path) ? null : request.clone();
    response = await send(request);

    if (response.status === 401 && replay) {
      const token = await refreshAccessToken();
      if (token) {
        response = await send(replay);
      } else {
        clearAccessToken();
        onSignedOut();
      }
    }
  } catch (cause) {
    throw new NetworkError(cause);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
      onSignedOut();
    }
    throw toApiError(
      response.status,
      await readErrorBody(response),
      response.headers.get(REQUEST_ID_HEADER) ?? undefined,
    );
  }

  return response;
}

export { ApiError };
