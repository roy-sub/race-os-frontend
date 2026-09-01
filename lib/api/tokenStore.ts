/**
 * The access token lives here and nowhere else.
 *
 * **In memory only.** Not `localStorage`, not `sessionStorage`, not a
 * non-httpOnly cookie: any of those is readable by every script on the page,
 * which makes an XSS into a stolen session. The long-lived half of the pair is
 * the backend's httpOnly `raceos_refresh` cookie, which JavaScript cannot read
 * by design — so the cost of keeping the access token in memory is that a page
 * reload starts with nothing, and the fix for that is a silent refresh at boot,
 * not persistence.
 */

type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  if (accessToken === token) return;
  accessToken = token;
  for (const listener of listeners) listener(accessToken);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

/** Subscribe to sign-in/sign-out. Returns the unsubscribe function. */
export function subscribeToAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
