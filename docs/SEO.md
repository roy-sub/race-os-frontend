# SEO: what is done, what you do, and what to redo when something changes

This is the whole picture in one file. It has three parts:

- **Part 1 — Already built.** What is in the code now, so you know what you are
  not responsible for.
- **Part 2 — Your one-time setup.** Seven things only you can do, in order,
  with what to click. Do these once.
- **Part 3 — The maintenance table.** Every kind of change you might make in
  future, and which step it triggers. This is the part to come back to.

No prior SEO knowledge is assumed. Where a term matters it is explained the
first time it appears.

---

## Part 1 — Already built (nothing for you to do here)

Search engines send a program — a *crawler* — to read your pages. It only sees
what is in the raw HTML file. Everything below exists so that what it reads is
correct and complete.

| What | Where it lives | What it does |
| --- | --- | --- |
| `robots.txt` | `app/robots.ts` | Tells crawlers which parts of the site to read and which to skip. |
| `sitemap.xml` | `app/sitemap.ts` | Lists all 15 public addresses so Google does not have to guess. |
| One official address | `lib/seo/site.ts` | Every link the site publishes about itself points at `https://raceosapp.com`. |
| Canonical tags | `lib/seo/pageMetadata.ts` | Each page states its own real address, so two addresses for one page never compete. |
| Unique titles and descriptions | one `layout.tsx` per route | What people actually read in a search result. All 32 pages are now distinct. |
| Share image | `public/assets/og/raceos-share.png` | The preview card when a link is pasted into WhatsApp, Slack or X. |
| Private pages hidden | the same layouts, plus `robots.txt` | Dashboard, settings, plans, admin and shared links are marked "do not index". |
| **A page per race** | `app/races/[slug]/page.tsx` | Eight real pages — `/races/malaga-703/` and so on — each with the race's name, date, place and distances in the HTML. |
| Structured data | `lib/seo/JsonLd.tsx` | Machine-readable facts that let Google show a race's date and location in the result. |
| An automatic check | `scripts/seo-check.mjs` | Runs after every build and **fails the build** if any of the above breaks. |

Two things worth knowing about the design:

**The race list is committed, not fetched.** `lib/seo/races.ts` is a plain file
holding the eight races. The site is a *static export* — every page is written
to disk at build time — so the build has to know every address before it starts.
Asking the backend during the build would mean a deploy while the API was down
would silently ship a site with no race pages. So the list is committed and
refreshed with one command. **This is the single most important thing to
remember**, and Part 3 is mostly about it.

**The old course address still works.** `/course-recon?course=malaga-703` is
unchanged; nothing you have linked anywhere will break. It is simply marked
"do not index" now, so it does not compete with the new `/races/malaga-703/`
page, which links to it.

---

## Part 2 — Your one-time setup

Do these in order. Steps 1–2 take about ten minutes; the rest are five minutes
each. You need nothing from a developer.

### Step 1 — Confirm the domain

The site's official address is set to **`https://raceosapp.com`**, which is
where the site is served. Nothing to do unless that changes.

Note that this is deliberately *not* `raceos.cc`, the contact address in the
footer. An email domain and a web domain are separate things, and an earlier
version of this setup inferred one from the other and got it wrong. If you ever
do move the site to `raceos.cc`, it is one build variable —
`NEXT_PUBLIC_SITE_URL` — or the default in `lib/seo/site.ts`, plus a new
Search Console property (Step 2) and a fresh sitemap submission (Step 4).

Getting this wrong is quiet and expensive: every page would tell Google that
the real version lives at an address that does not serve it, and the pages you
want ranked get suppressed rather than moved.

Also decide **with or without `www.`** and stick to it. In Cloudflare, under
your Pages project → **Custom domains**, add both and set one to redirect to
the other. Google treats `www.raceosapp.com` and `raceosapp.com` as two
different sites otherwise, and they compete with each other.

### Step 2 — Create a Google Search Console account

Search Console is Google's free dashboard showing how your site appears in
search: which pages are indexed, what people searched to find you, and what is
broken.

1. Go to **https://search.google.com/search-console** and sign in with any
   Google account.
2. Choose **Add property** → **Domain** (the left-hand option, not URL prefix).
   The Domain option covers `www`, non-`www` and both `http`/`https` at once.
3. Enter `raceosapp.com` — just the domain, no `https://`.

### Step 3 — Prove you own the domain

Google will show you a **TXT record** — a line of text starting with
`google-site-verification=`.

1. Copy it.
2. In Cloudflare, open your domain → **DNS** → **Add record**.
3. Type: `TXT`. Name: `@`. Content: paste the line. Save.
4. Back in Search Console, click **Verify**. If it fails, wait five minutes and
   try again — DNS takes a moment to propagate.

Nothing in the code needs to change for this. (Google also offers an HTML file
or meta-tag method; ignore both — the DNS method is the one that keeps working
across redeploys.)

### Step 4 — Submit your sitemap

This is how you formally ask Google to read your pages.

1. In Search Console, click **Sitemaps** in the left sidebar.
2. Enter `sitemap.xml` in the box and click **Submit**.
3. Within a day it should read **Success** with **15 discovered URLs**.

If it says 0 URLs, the site has not been redeployed since the SEO work — deploy
first, then resubmit.

### Step 5 — Nudge Google to visit sooner

Left alone, Google may take weeks to find a new site. You can skip the queue for
a handful of pages.

1. In Search Console, paste an address into the **URL Inspection** bar at the
   top.
2. Click **Request indexing**.
3. Do this for these five, which is the daily limit's worth of the ones that
   matter:
   - `https://raceosapp.com/`
   - `https://raceosapp.com/races/`
   - `https://raceosapp.com/pricing/`
   - `https://raceosapp.com/how-it-works/`
   - `https://raceosapp.com/races/malaga-703/`

The race pages link to each other, so Google will find the remaining seven on
its own from that one.

### Step 6 — Add Bing (two minutes, covers three search engines)

Bing powers Bing, Yahoo and DuckDuckGo.

1. Go to **https://www.bing.com/webmasters**.
2. Sign in and choose **Import from Google Search Console**.
3. Authorise it. Your site and sitemap are copied across; there is nothing
   further to configure.

### Step 7 — Turn on analytics

So you can tell whether any of this is working.

1. In Cloudflare, open your Pages project → **Analytics** → **Web Analytics**
   → **Enable**.
2. That is all — Cloudflare Pages injects it for you. It is free, needs no
   cookie banner, and no code change.

### After a week

Come back to Search Console and open **Pages** (under *Indexing*). You want to
see your pages under **Indexed**. Anything under **Not indexed** shows a reason
next to it; the common ones are "Crawled – currently not indexed" (normal for a
new site, means wait) and "Excluded by 'noindex' tag" (correct and expected for
`/dashboard/`, `/settings/` and the rest of the private screens).

---

## Part 3 — The maintenance table

**Read this the way you would a checklist, not a manual.** Find the change you
made in the left column; do what the right column says.

The rule underneath all of it is one sentence: **the frontend holds a committed
copy of the race list, so any backend change to which races exist means running
one command and redeploying the frontend.**

### Backend changes

| What you changed in the backend | What you must do |
| --- | --- |
| **Added a race** to the catalogue | Run `npm run seo:races` in the frontend, commit the changed `lib/seo/races.ts`, rebuild and redeploy. Then in Search Console, **URL Inspection → Request indexing** on the new `/races/<slug>/` address. |
| **Removed or retired a race** | Same command, commit, rebuild, redeploy. The page and its sitemap entry disappear together. Nothing to do in Search Console — Google drops it on its next visit. |
| **Renamed a race**, or changed its **slug** | Same command, commit, rebuild, redeploy. A changed slug means a new address and the old one starts returning 404; if the old address had been indexed, request indexing on the new one. |
| **Changed a race's date, place, difficulty or distance** | Same command, commit, rebuild, redeploy. These appear in the page's visible text, its description and its structured data, so a stale copy is a wrong date in a search result. |
| **Changed course geometry, elevation, cut-offs, aid stations, pricing logic, or anything behind the paywall** | Nothing. None of it appears in a prerendered page — by design, since those files are public. |
| **Changed the `/api/v1/courses` response shape** | `scripts/pull-races.mjs` reads specific field names and will need updating to match. It refuses to write an empty list rather than wiping the race pages, so a mismatch fails loudly instead of quietly. |
| **Deployed the backend to a new URL** | Set `NEXT_PUBLIC_API_BASE_URL` to the new origin for the frontend build. This is not an SEO setting, but it is baked in at build time, so the frontend needs rebuilding too. |

> A convenient habit: run `npm run seo:races` whenever you have just changed the
> catalogue, before you have moved on. It prints how many races it wrote, and
> the git diff shows you exactly what moved.

### Frontend changes

| What you changed in the frontend | What you must do |
| --- | --- |
| **Added a new page** (a new folder under `app/`) | Add a `layout.tsx` beside its `page.tsx` using `pageMetadata({ title, description, path })` — copy any existing one. If it is public, add it to `app/sitemap.ts`; if it is private, pass `noindex: true` **and** add it to the disallow list in `app/robots.ts` and to `PRIVATE_ROUTES` in `scripts/seo-check.mjs`. The build fails until a page has a title, a description and a canonical, so you cannot forget this silently. |
| **Deleted a page** | Remove its entry from `app/sitemap.ts` if it was listed. The build check will tell you if you forget — it fails when the sitemap names an address that was not built. |
| **Moved or renamed a page's address** | Update `app/sitemap.ts`, and update `lib/routes.ts` if the route is linked from anywhere. The old address will 404; if it was indexed, request indexing on the new one. |
| **Changed a page's wording, layout or design** | Nothing. Titles and descriptions live in the layout, not the page. |
| **Changed a title or description** | Nothing beyond redeploying. Google picks it up on its next visit, usually within days. |
| **Changed the domain** | Set `NEXT_PUBLIC_SITE_URL` (or the default in `lib/seo/site.ts`), rebuild, redeploy, then add the new domain as a new property in Search Console and resubmit the sitemap. |
| **Added a new photo or asset** | Nothing. `prebuild` regenerates the asset manifest. |
| **Nothing at all — just redeploying** | Nothing. |

### Every deploy, automatically

You do not have to remember any of the above to catch a mistake. `npm run
build` runs `scripts/seo-check.mjs` afterwards, which reads the real `out/`
directory and fails the build if:

- any page has no title, no description, or no canonical URL;
- two pages share a title;
- a private page is missing its `noindex`, or a public one has it by mistake;
- a race in `lib/seo/races.ts` has no page, or no structured data;
- the sitemap names a page that was not built, or lists a private one;
- `robots.txt` is missing or does not point at the sitemap.

A red build here is never cosmetic: every one of those failures is something
that would otherwise cost ranking quietly for weeks.

### The deploy itself

```bash
npm ci
NEXT_PUBLIC_API_BASE_URL=https://race-os-backend.onrender.com \
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...                \
  npm run build

npx wrangler pages deploy out --project-name=raceos
```

`NEXT_PUBLIC_SITE_URL` is only needed if you are building for a domain other
than `raceosapp.com`.

---

## What is deliberately not done

Two items from the original plan are left for you to decide on, because they
are judgement calls rather than tasks:

**Writing content.** Once the technical setup is in place, what actually moves
rankings is genuinely useful writing — race guides, course breakdowns, "what to
expect at 70.3 Málaga". The help library at `/guide` already renders articles
from the backend, so it is the natural home for this and needs no new code.
Whether it is worth your time is a business call.

**Linking race pages from the race directory.** `/races/` builds its list of
races in the browser from the API, which means its links are invisible to a
crawler; the new race pages are found through the sitemap and through each
other instead, which works. Making the directory link to them in the HTML as
well would strengthen them, but it means changing a working page, so it was
left alone. Worth revisiting if the race pages are slow to rank.

**A custom 404 page.** Next's default is used, which is marked `noindex`
correctly but has the site's generic title. Harmless; a nicety if you ever want
it.
