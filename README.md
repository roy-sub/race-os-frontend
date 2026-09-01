# RaceOS — frontend

The Next.js client for the RaceOS API. Every screen reads from the backend at
runtime, in the browser, with the athlete's own token; there is nothing for a
server to render here, so the app is a **fully static export** and deploys as
plain files.

---

## Getting started

```bash
npm install
cp .env.example .env.local     # then set NEXT_PUBLIC_API_BASE_URL
npm run dev                    # http://localhost:3000
```

`NEXT_PUBLIC_API_BASE_URL` is asserted at import time. A missing value fails
loudly rather than firing every request at a relative path.

---

## The API contract

`openapi/openapi.json` is the backend's own schema, committed so that a build is
reproducible and does not depend on the API being up. `lib/api/schema.d.ts` is
generated from it — **do not hand-edit that file**.

```bash
npm run api:pull     # refresh openapi/openapi.json from a running backend
npm run api:types    # regenerate lib/api/schema.d.ts from it
npm run api:sync     # both
```

Note the path: the schema is served under the `/api/v1` prefix, not at the root,
and interactive docs are disabled in production.

Two responses are typed loosely backend-side (`dict[str, object]`) and so are
hand-typed next to the calls that read them: `GET /courses/{ref}/recon` in
`lib/api/courses.ts`, and `GET /plans/{id}/export` in `lib/api/exports.ts`.

---

## How data flows

- `lib/api/http.ts` is the single `fetch`. It attaches the in-memory access
  token, sends credentials so the httpOnly refresh cookie rides along, refreshes
  **once** on a 401 and replays the request, and turns every non-2xx into an
  `ApiError` carrying `code` and `request_id`. The refresh is single-flight,
  because the backend rotates refresh tokens and parallel refreshes would sign
  the user out.
- The access token lives in memory only (`lib/api/tokenStore.ts`). Never
  `localStorage`.
- `lib/errorCopy.ts` maps all 17 error codes to copy. `INFEASIBLE` is a verdict
  with its own component, and `PAYMENT_REQUIRED` drives the paywall.
- Gating is read from `GET /entitlements`. Nothing in the UI encodes which tier
  unlocks what.

---

## Deploying to Cloudflare Pages

`next build` writes a static site to `out/`. `NEXT_PUBLIC_*` values are baked in
**at build time**, so the API base URL must be set for the build, not the host.

```bash
npm ci
NEXT_PUBLIC_API_BASE_URL=https://race-os-backend.onrender.com \
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...                \
  npm run build

npx wrangler pages deploy out --project-name=raceos
```

Or `npm run deploy`, which runs the same two steps and reads both variables from
the environment.

If you would rather Cloudflare build it, point a Pages project at this repo with
build command `npm run build`, output directory `out`, and set the same two
variables in the project's build environment.

### Two things the backend must be told

Both are backend environment or configuration changes. Neither has a frontend
workaround, and a proxy is not one — it would only hide the problem.

1. **`CORS_ALLOWED_ORIGINS` must list the deployed origin.** The backend rejects
   a wildcard outside development, and credentials plus a wildcard origin are
   mutually exclusive by spec, so the exact origin has to be named.

2. **The refresh cookie must be `SameSite=None`.**
   `backend/raceos/api/routers/auth.py` sets the session cookie with
   `samesite="lax"`. The frontend and API are on different registrable domains,
   so every API call is cross-site, and browsers do not send `Lax` cookies on
   cross-site requests. `POST /auth/refresh` would therefore never see the
   cookie: sessions would die after the 15-minute access-token TTL and would not
   survive a page reload. `SameSite=None` requires `Secure`, which is already
   set in production.

---

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Static export to `out/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run api:sync` | Refresh the schema and regenerate the client |
| `npm run deploy` | Build, then `wrangler pages deploy out` |
