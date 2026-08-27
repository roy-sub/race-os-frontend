"use client";

import { bootLoaderMarkup } from "@/lib/bootLoaderMarkup";

/**
 * Two-stage page-entry animation, shown once per page load:
 *  1. `#om-boot` — a full-bleed black shutter carrying the 24-frame
 *     Muybridge-style running-gait filmstrip, visible for ~1.85s.
 *  2. `[data-loader]` — the RaceOS wordmark + progress bar on paper,
 *     underneath the shutter, fading out at ~2.15s to reveal the page.
 * Markup is verbatim from the design handoff (see lib/bootLoaderMarkup.ts).
 */
export function BootLoader() {
  return <div dangerouslySetInnerHTML={{ __html: bootLoaderMarkup }} />;
}
