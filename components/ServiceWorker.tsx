"use client";

/**
 * Registers the Race Mode service worker.
 *
 * Registration is deliberately late and deliberately quiet: it waits for
 * `load` so it never competes with the first paint, and every failure is
 * swallowed. The worker makes race morning better; it is not allowed to make
 * any other morning worse.
 */

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
