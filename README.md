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

A handful of responses are typed loosely backend-side (`dict[str, object]`) and
so are hand-typed next to the calls that read them. Keep the hand-written type
beside its caller rather than in a shared types file: when the backend changes
one of these, the type and the code that breaks are in the same diff.

| Endpoint | Hand-typed in |
| --- | --- |
| `GET /courses/{ref}/recon` | `lib/api/courses.ts` |
| `GET /courses/{ref}/terrain` | `components/CourseMap.tsx` |
| `GET /plans/{id}/export` | `lib/api/exports.ts` |
| `GET /plans/{id}/race-mode` | `lib/api/screens.ts` |
| `GET /admin/overview`, `GET /admin/kpis` | `lib/api/screens.ts` |

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
  unlocks what. Map gating is the one decision not taken from that matrix alone,
  because it is per-course rather than per-account: the recon payload carries
  `access.map_unlocked` and `access.map_locked_reason`, and the UI renders the
  reason the backend gives instead of composing its own.
- Every page that shows athlete data is a `GuardedPage` reading a live endpoint.
  There are no per-user fixtures left in `lib/` — the files there hold formatting
  helpers and copy only. `AuthProvider` calls `queryClient.clear()` on **both**
  sign-in and sign-out, so a cached answer for one account can never be painted
  under another.

---

## The 3D course map

The map is a port of the `course-map-3d` repository, which is the design
reference: same Three.js scene, same palette, same camera, same marker overlay.
The port is held to it by comparison against a running copy of the original, not
by inspection — see `/map-check`.

- `lib/map/engine.js` — the scene. Ported with one seam added: a venue may now
  carry a baked terrain `field` instead of the original's procedural heightmap.
- `lib/map/raster.js` — that seam. `RasterTerrain` samples the baked field
  (height, water level, signed distance to shore) and `venueFromField` turns a
  `GET /courses/{ref}/terrain` payload into the venue shape the engine expects.
- `lib/map/venues/kalmar.js` — the original procedural venue, copied unchanged.
- `components/CourseMap3D.jsx` — the ported React shell (stage, leg switcher,
  stat cards, marker layer).
- `components/CourseMap.tsx` — the only thing the app imports. It picks between
  `ShowcaseMap` (Kalmar, procedural, signed-out visitors), `SurveyedMap` (a real
  course from baked terrain) and `LockedMap` (the reason, and the way to unlock).

Two maps, and the difference is stated on the map rather than left for the
viewer to infer. The showcase is a tuned graphic whose legs disagree on scale,
so it carries a note saying it is illustrative and not to scale. A surveyed map
is built from real route geometry and real elevation, and says what it was built
from in its footer attribution.

`three` is the only heavy dependency in the app and is loaded by the map
components alone.

---

## Deploying to Cloudflare Pages

`next build` writes a static site to `out/`. `NEXT_PUBLIC_*` values are baked in
**at build time**, so the API base URL must be set for the build, not the host.

```bash
npm ci
NEXT_PUBLIC_API_BASE_URL=https://race-os-backend.onrender.com \
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...                \
NEXT_PUBLIC_SITE_URL=https://raceos.cc                        \
  npm run build

npx wrangler pages deploy out --project-name=raceos
```

Or `npm run deploy`, which runs the same two steps and reads the variables from
the environment.

If you would rather Cloudflare build it, point a Pages project at this repo with
build command `npm run build`, output directory `out`, and set the same
variables in the project's build environment.

`NEXT_PUBLIC_SITE_URL` is the site's own address, and it is baked into every
canonical tag, the sitemap and every share card. It defaults to
`https://raceos.cc`, so a production build needs nothing; set it when building
for a preview domain, or the preview will tell Google its pages are the
canonical ones. See [docs/SEO.md](docs/SEO.md) for what else a deploy has to
keep in step.

## Security headers

A static export has no server in the request path, so `headers()` in
`next.config.ts` does nothing — the site shipped with no CSP, no
`X-Frame-Options` and no HSTS at all. `scripts/security-headers.mjs` writes
`public/_headers`, which Cloudflare Pages applies to every response, and
`prebuild` regenerates it so it cannot drift from the build it describes.

It is generated rather than checked in because `connect-src` has to name the
API exactly, and the API origin is a build-time variable. The script **fails
the build** when `NEXT_PUBLIC_API_BASE_URL` is missing: the alternatives are a
policy that blocks every API call, or one wide enough to let injected script
exfiltrate anywhere, and neither is worth shipping quietly.

`js.stripe.com` is already allowed in `script-src` and `frame-src`, and
`payment=(self "https://js.stripe.com")` in `Permissions-Policy`, although
nothing loads Stripe yet. Allowing an origin that is unused costs nothing;
discovering in production that the policy blocks checkout does.

If you host somewhere other than Cloudflare Pages, that file is the thing to
port — Netlify reads the same format, most others do not.

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
