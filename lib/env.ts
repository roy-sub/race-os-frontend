/**
 * Environment, asserted at module load.
 *
 * A missing API base URL is not a condition the app can degrade through — every
 * screen reads from the backend — so it fails loudly at import time rather than
 * producing a page full of silent fetch errors against a relative path.
 */

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill it in. ` +
        `The app cannot start without it — there is no default and no fallback origin.`,
    );
  }
  return upgradeToPageProtocol(name, value.trim().replace(/\/+$/, ""));
}

/**
 * An `http://` API on an `https://` page cannot work, so upgrade it.
 *
 * The browser blocks that request as mixed content *before it leaves*, which
 * reaches the app as a failed fetch and reads on screen as "the request never
 * reached RaceOS" — indistinguishable from the backend being down. Since the
 * plain-http call had no chance of succeeding, rewriting it to https is the
 * only outcome that can work, and the warning says plainly what to correct.
 *
 * Guarded on `window` because this module is also evaluated during the static
 * build, where there is no page protocol to compare against.
 */
function upgradeToPageProtocol(name: string, url: string): string {
  if (typeof window === "undefined") return url;
  if (window.location.protocol !== "https:" || !url.startsWith("http://")) return url;

  const upgraded = `https://${url.slice("http://".length)}`;
  console.warn(
    `[RaceOS] ${name} is set to ${url}, but this page is served over https. ` +
      `A browser blocks that call as mixed content, so it has been upgraded to ` +
      `${upgraded}. Fix the value at build time to remove this warning.`,
  );
  return upgraded;
}

/** Backend origin, e.g. https://race-os-backend.onrender.com — no trailing slash, no /api/v1. */
export const API_BASE_URL = required(
  "NEXT_PUBLIC_API_BASE_URL",
  process.env.NEXT_PUBLIC_API_BASE_URL,
);

/** Where the versioned API actually lives. Every path in the schema already carries this. */
export const API_PREFIX = "/api/v1";

/**
 * Stripe publishable key. Optional: only the checkout step needs it, and the rest
 * of the product must stay usable while it is unset, so this one does not throw.
 */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
