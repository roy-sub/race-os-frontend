/**
 * The typed client. Every server call in the app starts here.
 *
 * Types in `schema.d.ts` are generated from the backend's own
 * `/api/v1/openapi.json` (`npm run api:types`), so a route that changes shape
 * breaks the build rather than the page. Do not hand-edit that file.
 *
 * `apiFetch` does the auth, refresh and error work, which means these helpers
 * *throw* an `ApiError` instead of returning `openapi-fetch`'s `{ data, error }`
 * pair. That is what TanStack Query wants, and it keeps error handling in one
 * shape across the app.
 */

import createClient from "openapi-fetch";
import { API_BASE_URL } from "../env";
import { apiFetch } from "./http";
import type { paths } from "./schema";

export const client = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: apiFetch,
  credentials: "include",
  headers: { Accept: "application/json" },
});

/**
 * Take the body out of an `openapi-fetch` result.
 *
 * The `error` branch is unreachable — `apiFetch` has already thrown — so this
 * only has to cope with a 204, where there is no body and `undefined` is right.
 */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data } = await call;
  return data as T;
}

export type { paths };
export * from "./errors";
