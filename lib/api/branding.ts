/**
 * A coach's mark on the documents their athletes carry to a race.
 *
 * Deliberately small: a display name, one accent colour, an optional logo and
 * one footer line. It is not a theme, and this client offers no way to make it
 * one — there is no layout field, no font field, and no way to replace the
 * provenance footer. A coach's note is appended after the house footer, never
 * instead of it, because every number on the page has to keep saying where it
 * came from.
 *
 * Two rules the server enforces and this module surfaces rather than
 * duplicates:
 *
 * * The accent must clear a WCAG contrast ratio against the paper colour the
 *   PDF actually uses. A colour that fails comes back as `INVALID_INPUT` with
 *   the measured ratio in `details`, so the coach learns how far off they are
 *   rather than just being told no.
 * * Logos are sniffed by magic number, capped, and SVG is refused outright —
 *   it can carry script and external references and the file is rendered on
 *   our own server. The accept attribute below matches, but it is a courtesy
 *   to the file picker, not the check.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { client, unwrap } from "./client";
import { apiFetch } from "./http";
import { API_BASE_URL } from "@/lib/env";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Branding = components["schemas"]["BrandingOut"];
export type BrandingUpdate = components["schemas"]["BrandingUpdate"];

/** What the file picker should offer. The server decides what it accepts. */
export const LOGO_ACCEPT = "image/png,image/jpeg,image/webp";

/** Matches `branding_service.MAX_LOGO_BYTES`, for a message before the upload. */
export const MAX_LOGO_BYTES = 512 * 1024;

export function useBranding(enabled = true) {
  return useQuery({
    queryKey: queryKeys.coach.branding(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/coach/branding")),
  });
}

/**
 * Absent means unchanged, so callers send only the fields they are changing.
 *
 * `clear_accent` carries its server-side default here rather than at every
 * call site: the generated type marks it required because it has one, but
 * "leave the accent alone" is the overwhelmingly common case and making each
 * caller restate it invites one of them to send `true` by copy-paste and
 * silently wipe a colour it never meant to touch.
 */
export function useSaveBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BrandingUpdate>) =>
      unwrap(
        client.PATCH("/api/v1/coach/branding", {
          body: { clear_accent: false, ...body },
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.coach.branding(), updated);
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const response = await apiFetch(`${API_BASE_URL}/api/v1/coach/branding/logo`, {
        method: "PUT",
        body,
      });
      return (await response.json()) as Branding;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.coach.branding(), updated);
    },
  });
}

export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(client.DELETE("/api/v1/coach/branding/logo")),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coach.branding() });
    },
  });
}
