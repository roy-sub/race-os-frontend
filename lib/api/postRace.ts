/**
 * After the race: the file, the comparison, and what it changes.
 *
 * The order is the athlete's order and it is not arbitrary. A file is uploaded
 * and **parsed on the way in**, so a file we cannot read is refused with a
 * specific reason while they are still looking at the picker. Only then is it
 * compared against a plan, and only a comparison produces calibrations — the
 * proposed changes to the constraints the next plan will be solved from.
 *
 * A calibration is a *proposal*. Nothing it suggests touches a constraint, and
 * nothing touches an already-solved plan, until the athlete applies it. That is
 * the same law the drift flow follows, for the same reason: the numbers an
 * athlete raced on must not move behind them.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../env";
import { client, unwrap } from "./client";
import { apiFetch } from "./http";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Analysis = components["schemas"]["AnalysisOut"];
export type CompareRow = components["schemas"]["CompareRowOut"];
export type Calibration = components["schemas"]["CalibrationOut"];
export type AnalysisAction = components["schemas"]["ActionOut"];
export type RaceFile = components["schemas"]["RaceFileOut"];

export function useAnalyses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.postRace.analyses(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/post-race/analyses")),
  });
}

export function useAnalysis(id: string | null) {
  return useQuery({
    queryKey: queryKeys.postRace.analysis(id ?? ""),
    enabled: Boolean(id),
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/post-race/analyses/{analysis_id}", {
          params: { path: { analysis_id: id! } },
        }),
      ),
  });
}

/**
 * Upload a race file.
 *
 * Sent as multipart through the same `apiFetch` as everything else, so it
 * carries the bearer token and goes through the one refresh path. The generated
 * client does not model multipart bodies, which is why this is written by hand
 * next to its only caller.
 */
export function useUploadRaceFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, planId }: { file: File; planId?: string | null }) => {
      const body = new FormData();
      body.append("file", file);
      if (planId) body.append("plan_id", planId);
      const response = await apiFetch(`${API_BASE_URL}/api/v1/post-race/files`, {
        method: "POST",
        body,
      });
      return (await response.json()) as RaceFile;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.postRace.all });
    },
  });
}

export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { race_file_id: string; plan_id?: string | null; race_id?: string | null }) =>
      unwrap(client.POST("/api/v1/post-race/analyses", { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.postRace.all });
    },
  });
}

/** Apply or dismiss one proposed constraint change. */
export function useCalibrationDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "apply" | "dismiss" }) =>
      decision === "apply"
        ? unwrap(
            client.POST("/api/v1/post-race/calibrations/{calibration_id}/apply", {
              params: { path: { calibration_id: id } },
            }),
          )
        : unwrap(
            client.POST("/api/v1/post-race/calibrations/{calibration_id}/dismiss", {
              params: { path: { calibration_id: id } },
            }),
          ),
    onSuccess: () => {
      // An applied calibration writes a constraint, which changes what the
      // next solve reads — so the constraints list is invalidated too.
      void queryClient.invalidateQueries({ queryKey: queryKeys.postRace.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.constraints.all });
    },
  });
}

/** Colour for a comparison row's verdict. Unstyled values stay neutral. */
export const COMPARE_COLOR: Record<string, string> = {
  good: "#3E7B55",
  ok: "#5C574B",
  warn: "#A0701A",
  bad: "#C0392B",
};

export function compareColor(state: string | null | undefined): string {
  return (state && COMPARE_COLOR[state]) || "#5C574B";
}
