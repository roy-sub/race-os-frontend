/**
 * What Race Mode needs when the signal goes.
 *
 * Three separate problems, deliberately kept apart:
 *
 * 1. **The page must load.** That is the service worker (`public/sw.js`),
 *    which caches the shell and nothing from the API.
 * 2. **The plan must be there.** That is `savePlan`/`loadPlan` below, an
 *    IndexedDB copy written every time a fresh payload arrives.
 * 3. **The phone must stay awake and readable.** Wake lock and the race-day
 *    display mode.
 *
 * There is no outbound queue, and that is not an omission. Race Mode issues no
 * writes — the server's own `offline.complete` says the payload is the whole
 * screen and race day makes no further requests. A queue with nothing to queue
 * would be a moving part that only ever fails.
 */

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

const DB = "raceos-offline";
const STORE = "race-mode";
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export type SavedPlan<T> = { payload: T; savedAt: string };

/**
 * Keep the last good payload for this plan.
 *
 * Every failure here is swallowed: private browsing, a full disk and a denied
 * quota all throw, and none of them is a reason to break the screen an athlete
 * is holding. The consequence of failing is that the plan is not there later,
 * which `loadPlan` already treats as a normal outcome.
 */
export async function savePlan<T>(planId: string, payload: T): Promise<void> {
  try {
    const db = await open();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ payload, savedAt: new Date().toISOString() }, planId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* see above */
  }
}

/** The saved copy, or null. Null is a normal answer, not an error. */
export async function loadPlan<T>(planId: string): Promise<SavedPlan<T> | null> {
  try {
    const db = await open();
    const row = await new Promise<SavedPlan<T> | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const get = tx.objectStore(STORE).get(planId);
      get.onsuccess = () => resolve((get.result as SavedPlan<T>) ?? null);
      get.onerror = () => reject(get.error);
    });
    db.close();
    return row;
  } catch {
    return null;
  }
}

/**
 * Hold the screen on.
 *
 * A phone that sleeps in a transition tent is a plan you cannot read with wet
 * hands. The lock is dropped by the browser whenever the page is hidden, so it
 * is re-acquired on `visibilitychange` — without that it survives exactly one
 * glance at the lock screen.
 *
 * Unsupported on some browsers, and that is fine: the hook reports it rather
 * than throwing, so the UI can say "keep your screen timeout long" instead of
 * silently promising something it did not do.
 */
export function useWakeLock(enabled: boolean) {
  const sentinel = useRef<WakeLockSentinel | null>(null);
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  /* No `held` state on purpose. Whether the lock is currently held is not
     something the screen shows — what it shows is whether the browser can do
     this at all — and keeping a flag nobody reads would mean setting state
     from inside an effect for no one's benefit. */
  const acquire = useCallback(async () => {
    if (!enabled || !supported) return;
    try {
      sentinel.current = await navigator.wakeLock.request("screen");
    } catch {
      sentinel.current = null;
    }
  }, [enabled, supported]);

  useEffect(() => {
    void acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel.current?.release().catch(() => undefined);
      sentinel.current = null;
    };
  }, [acquire]);

  return { supported };
}

const DISPLAY_KEY = "raceos:race-day-display";

/**
 * Large type and bigger targets, remembered.
 *
 * Read once on mount rather than during render: the export is static, so the
 * server render has no `localStorage` and reading it during render would
 * mismatch the hydrated markup.
 */
export function useRaceDayDisplay() {
  const big = useSyncExternalStore(subscribeDisplay, readDisplay, () => false);

  const toggle = useCallback(() => {
    try {
      localStorage.setItem(DISPLAY_KEY, readDisplay() ? "0" : "1");
    } catch {
      /* private browsing: the preference simply will not persist */
    }
    displayListeners.forEach((fn) => fn());
  }, []);

  return { big, toggle };
}

/* `useSyncExternalStore` rather than state seeded in an effect. The server
   snapshot is `false`, which is what the prerendered HTML says, so the first
   client render agrees with it and there is no hydration mismatch — and no
   setState-in-effect, which React 19 rightly flags as a cascading render. */
const displayListeners = new Set<() => void>();

function subscribeDisplay(onChange: () => void) {
  displayListeners.add(onChange);
  // `storage` fires for *other* tabs, so a phone with the plan open twice
  // stays consistent; same-tab changes go through `displayListeners`.
  window.addEventListener("storage", onChange);
  return () => {
    displayListeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readDisplay(): boolean {
  try {
    return localStorage.getItem(DISPLAY_KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether the browser currently believes it is online. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    // Assume online while prerendering: the alternative flashes an "offline"
    // badge on every first paint for everybody.
    () => true,
  );
}

const LAST_PLAN = "raceos:last-race-mode-plan";

/**
 * The plan Race Mode last showed on this device.
 *
 * Without it, opening Race Mode offline with no `?plan=` in the URL cannot
 * work at all: the id normally comes from `GET /my-plans`, which needs the
 * network, and the saved copy in IndexedDB is keyed by that id. Remembering it
 * is the difference between the cache being reachable and being merely
 * present.
 */
export function rememberLastPlan(planId: string): void {
  try {
    localStorage.setItem(LAST_PLAN, planId);
  } catch {
    /* private browsing: offline Race Mode then needs ?plan= in the URL */
  }
}

export function lastPlan(): string | null {
  try {
    return localStorage.getItem(LAST_PLAN);
  } catch {
    return null;
  }
}
