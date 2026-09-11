/**
 * Adding a race the calendar does not carry yet.
 *
 * The promise is narrow and worth stating: **an athlete racing an event we have
 * not built is not blocked on our release schedule.** They already hold the
 * route files — the athlete guide's GPX, or a line they traced from the
 * published course map — and those files are enough.
 *
 * What comes out is a real course with a real bundle, validated by the same
 * rules the official calendar is held to and solved by the same solver. Two
 * things separate it, and both are honest rather than punitive: it is private
 * to the athlete who added it (they uploaded a file that may be an organiser's
 * licensed data, and republishing it is not ours to do), and its provenance is
 * ESTIMATED with an attribution saying the route came from them.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../env";
import { client, unwrap } from "./client";
import { apiFetch } from "./http";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Submission = components["schemas"]["SubmissionOut"];
export type SubmissionCreate = components["schemas"]["SubmissionCreate"];
export type SubmissionStatus = Submission["status"];
export type Leg = "SWIM" | "BIKE" | "RUN";

export const LEGS: Leg[] = ["SWIM", "BIKE", "RUN"];

export function useSubmissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.submissions.list(),
    enabled,
    queryFn: () => unwrap(client.GET("/api/v1/course-submissions")),
  });
}

export function useSubmission(id: string | null) {
  return useQuery({
    queryKey: queryKeys.submissions.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/course-submissions/{submission_id}", {
          params: { path: { submission_id: id! } },
        }),
      ),
  });
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmissionCreate) =>
      unwrap(client.POST("/api/v1/course-submissions", { body })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
    },
  });
}

/**
 * Upload one leg's route file.
 *
 * One call per leg on purpose. Three large files in one multipart body is a
 * single timeout away from having to re-pick all three, and a leg that fails
 * validation should not take the other two down with it.
 */
export function useUploadLeg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leg, file }: { id: string; leg: Leg; file: File }) => {
      const body = new FormData();
      body.append("file", file);
      const response = await apiFetch(
        `${API_BASE_URL}/api/v1/course-submissions/${id}/files/${leg}`,
        { method: "PUT", body },
      );
      return (await response.json()) as Submission;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.submissions.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions.list() });
    },
  });
}

/**
 * Build the course.
 *
 * Returns `200` whether the build succeeded or failed — a rejected submission
 * is a *state of the submission*, with its reasons attached, not a failed
 * request. The files are still there, and replacing one and re-submitting is
 * the whole recovery path.
 */
export function useSubmitCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        client.POST("/api/v1/course-submissions/{submission_id}/submit", {
          params: { path: { submission_id: id } },
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.submissions.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
      // A ready submission is a new course in the directory.
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useDeleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      unwrap(
        client.DELETE("/api/v1/course-submissions/{submission_id}", {
          params: { path: { submission_id: id } },
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.submissions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export const STATUS_COPY: Record<string, { label: string; tone: string; note: string }> = {
  draft: {
    label: "DRAFT",
    tone: "#8C8578",
    note: "Add a route file for each leg.",
  },
  queued: {
    label: "READY TO BUILD",
    tone: "#C6461B",
    note: "All three legs are in. Building takes a few seconds.",
  },
  processing: {
    label: "BUILDING",
    tone: "#C6461B",
    note: "Resampling the route and sampling terrain elevation.",
  },
  ready: {
    label: "READY",
    tone: "#3E7B55",
    note: "The course is yours to plan against, like any other.",
  },
  failed: {
    label: "NEEDS A FIX",
    tone: "#C0392B",
    note: "Nothing was built. What is wrong is listed below.",
  },
};

export function statusCopy(status: string) {
  return STATUS_COPY[status] ?? { label: status.toUpperCase(), tone: "#8C8578", note: "" };
}
