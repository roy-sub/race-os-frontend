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
  return value.trim().replace(/\/+$/, "");
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
