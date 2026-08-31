/**
 * The five downloads, and how to actually get them into a browser.
 *
 * Every export is behind the athlete's bearer token, so a plain `<a href>`
 * cannot fetch one — the browser would send an unauthenticated request and get
 * a 401. Each download is therefore fetched through the same client as
 * everything else, turned into a blob, and handed to a synthetic link.
 */

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "../env";
import { client, unwrap } from "./client";
import { apiFetch } from "./http";
import { queryKeys } from "./queryKeys";

/**
 * `GET /plans/{id}/export`, hand-typed — the endpoint is `dict[str, object]`
 * backend-side so the generated client sees nothing.
 *
 * Note what `exports` is and is not: five entries, and the bag manifests are
 * **one PDF with a page per bag**, not five files.
 */
export type ExportEntry = {
  key: string;
  label: string;
  media_type: string;
  /** Path under the API origin, already carrying any query it needs. */
  url: string;
  description: string;
};

export type ExportManifest = {
  plan_id: string;
  plan_version: number;
  course_bundle_version: string;
  attribution: string | null;
  exports: ExportEntry[];
  legs_with_geometry: string[];
  /**
   * Per-device instructions for getting a .fit course onto a head unit.
   *
   * This is the one direction that works and it stays: exporting a course file
   * *to* a device is not an integration, it is a file the athlete copies.
   * Nothing here reads from a device or connects to an account.
   */
  import_instructions: Record<string, string[]>;
};

export function useExportManifest(planId: string | null) {
  return useQuery({
    queryKey: queryKeys.plans.exports(planId ?? ""),
    enabled: Boolean(planId),
    queryFn: async (): Promise<ExportManifest> => {
      const body = await unwrap(
        client.GET("/api/v1/plans/{plan_id}/export", { params: { path: { plan_id: planId! } } }),
      );
      return body as unknown as ExportManifest;
    },
  });
}

/** Suggest a filename from the export's own URL, so the saved file is nameable. */
function filenameFor(entry: ExportEntry, planVersion: number): string {
  const last = entry.url.split("?")[0].split("/").pop() ?? "download";
  return `raceos-v${planVersion}-${last}`;
}

/**
 * Fetch one export and hand it to the browser as a download.
 *
 * Throws an `ApiError` like every other call, which is what lets a caller
 * distinguish the one failure that matters here: a **503** on either PDF means
 * the host is missing the native libraries WeasyPrint needs. The .fit, .gpx and
 * .ics exports are unaffected by that, so it degrades one row rather than the
 * feature.
 */
export async function downloadExport(entry: ExportEntry, planVersion: number): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}${entry.url}`);
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = href;
    link.download = filenameFor(entry, planVersion);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Revoking immediately can cancel the download in some browsers; a tick is
    // enough for the click to have been handed off.
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  }
}
