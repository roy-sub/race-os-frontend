"use client";

import { useEffect } from "react";

function fmt(v: number, dec: number) {
  return dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US");
}

function tick(el: Element) {
  const e = el as HTMLElement & { __counted?: boolean };
  if (e.__counted) return;
  e.__counted = true;
  const end = parseFloat(e.getAttribute("data-count") || "0");
  const dec = parseInt(e.getAttribute("data-dec") || "0", 10);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    e.textContent = fmt(end, dec);
    return;
  }
  const t0 = performance.now();
  const dur = 1600;
  const step = (t: number) => {
    const p = Math.min(1, (t - t0) / dur);
    e.textContent = fmt(end * (1 - Math.pow(1 - p, 3)), dec);
    if (p < 1) requestAnimationFrame(step);
    else e.textContent = fmt(end, dec);
  };
  requestAnimationFrame(step);
}

/**
 * Site-wide scroll-triggered reveal system — a single IntersectionObserver
 * flips `data-reveal`/`data-lines`/`data-zoom` from "out" to "in" and ticks
 * any `data-count` stat spans, with a 2.6s safety pass so nothing can be
 * stranded invisible off-screen. Mounted once at the root layout; mirrors
 * the per-page runtime the design prototype used on every one of its pages.
 */
export function ScrollFx() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const t = entry.target;
          ["data-lines", "data-zoom", "data-reveal"].forEach((a) => {
            if (t.hasAttribute(a)) t.setAttribute(a, "in");
          });
          t.querySelectorAll("[data-count]").forEach(tick);
          if (t.hasAttribute("data-count")) tick(t);
          io.unobserve(t);
        });
      },
      { threshold: 0.12, rootMargin: "0px 4000px -6% 4000px" }
    );

    const scan = () => {
      document
        .querySelectorAll('[data-reveal="out"],[data-lines="out"],[data-zoom="out"],[data-count]')
        .forEach((el) => {
          const e = el as HTMLElement & { __obs?: boolean };
          if (reduce) {
            ["data-reveal", "data-lines", "data-zoom"].forEach((a) => {
              if (e.hasAttribute(a)) e.setAttribute(a, "in");
            });
            if (e.hasAttribute("data-count")) tick(e);
            return;
          }
          if (e.__obs) return;
          e.__obs = true;
          io.observe(e);
        });
    };

    scan();
    // Re-scan on DOM mutation so client-rendered sections downstream still get observed.
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    const safety = setTimeout(() => {
      document.querySelectorAll('[data-reveal="out"],[data-lines="out"],[data-zoom="out"]').forEach((el) => {
        ["data-reveal", "data-lines", "data-zoom"].forEach((k) => {
          if (el.hasAttribute(k)) el.setAttribute(k, "in");
        });
      });
      document.querySelectorAll("[data-count]").forEach(tick);
    }, 2600);

    return () => {
      clearTimeout(safety);
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
