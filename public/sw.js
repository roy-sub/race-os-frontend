/*
 * Race Mode's service worker.
 *
 * The job is narrow and worth stating precisely: make the app *shell* load
 * with no network, so an athlete standing in a field with one bar can still
 * open the page. The plan itself is not cached here — it lives in IndexedDB
 * (see `lib/offline.ts`), because a race plan is per-athlete data and a shared
 * HTTP cache is the wrong place for it.
 *
 * What this deliberately does NOT do is cache API responses. A stale plan that
 * looks live is worse than an honest "showing the copy saved at 06:40": the
 * whole product is that every number is current and says where it came from.
 * The IndexedDB copy is timestamped, and the UI says so.
 */

const SHELL = "raceos-shell-v1";

/* What an athlete can open on race morning, plus the page they land on if they
 * reach for anything that was never opened. */
const SHELL_URLS = ["/race-mode/", "/plan/", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_URLS))
      // A missing route must not wedge the install: this worker is an
      // improvement on race morning, never a prerequisite for the site.
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never touch the API. See above: a cached plan that looks live is the one
  // failure this product cannot have.
  if (url.pathname.startsWith("/api/")) return;
  if (url.origin !== self.location.origin) return;

  // Network first, so a connected athlete always gets the current build and
  // the cache is only ever a fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(SHELL).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((hit) => hit || (request.mode === "navigate" ? caches.match("/offline.html") : undefined)),
      ),
  );
});
