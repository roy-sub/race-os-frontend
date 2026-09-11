/**
 * Course reads. Public — none of these need a token.
 *
 * Two of the backend's course responses are typed loosely in the schema and so
 * arrive here as `unknown`:
 *
 * - `GET /courses` returns `Page`, whose `data` is `list[Any]` — the rows are
 *   `CourseDetail` dumps, so that is what they are narrowed to.
 * - `GET /courses/{ref}/recon` is annotated `dict[str, object]`, so the whole
 *   payload is untyped. `Recon` below is written by hand against
 *   `course_service.course_recon` and the bundle JSON the ingest pipeline emits.
 *
 * Both are the one place in the app where a shape is asserted rather than
 * generated, so both are kept next to the call that reads them.
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthProvider";
import { client, unwrap } from "./client";
import { queryKeys } from "./queryKeys";
import type { components } from "./schema";

export type Course = components["schemas"]["CourseDetail"];
export type DistanceType = components["schemas"]["DistanceType"];
export type Difficulty = components["schemas"]["Difficulty"];
export type Leg = components["schemas"]["Leg"];

export type CoursePage = {
  data: Course[];
  meta: { total: number; limit: number; offset: number; returned: number };
};

/** One leg's geometry. `coordinates` is GeoJSON order: **longitude first**. */
export type ReconLeg = {
  leg: Leg;
  distance_m: number;
  elevation_gain_m: number;
  node_count: number;
  surface_quality: components["schemas"]["SurfaceQuality"];
  /** `[lng, lat, elevation]`, downsampled to 600 points. The real route. */
  coordinates: [number, number, number][];
};

/** A cut-off, as published. `limit_minutes_from_start` is the clock, not a duration. */
export type ReconBarrier = {
  name: string;
  leg: Leg;
  km: number;
  limit_minutes_from_start: number;
};

export type ReconAidStation = {
  name: string;
  leg: Leg;
  km: number;
  /** Tokens such as `["water", "sports_drink"]`. Format for display, never invent. */
  contents: string[];
  provenance: string;
};

export type ReconSegment = {
  ordinal: number;
  leg: Leg;
  name: string;
  from_km: number;
  to_km: number;
  elevation_gain_m: number;
  net_gradient: number;
  surface_quality: components["schemas"]["SurfaceQuality"];
  name_source: string;
};

export type ReconWaypoint = {
  name: string;
  leg: Leg;
  km: number;
  type: string;
  provenance: string;
};

/**
 * The elevation chart's real source.
 *
 * `display` is a downsample for charting only — the bundle's own note says
 * never to solve against it, and nothing here does. `gain_m` is the
 * hysteresis-filtered surveyed ascent, and is the figure to show.
 */
export type ReconElevationLeg = {
  display: { s_km: number[]; h_m: number[] };
  distance_m: number;
  gain_m: number;
  gain_m_raw_nodes: number;
  loss_m: number;
  max_m: number;
  min_m: number;
  mean_m: number;
  node_count: number;
  laps: number;
};

export type Recon = {
  course: {
    id: string;
    slug: string;
    name: string;
    place: string;
    distance_type: DistanceType;
    difficulty: Difficulty;
    timezone: string;
    lat: number;
    lng: number;
    is_fictional: boolean;
    availability: string;
    next_edition_date: string | null;
    is_user_submitted: boolean;
  };
  /**
   * Whether the caller may see the surveyed map, and why not if not.
   *
   * Sent rather than inferred: a client that guessed from an empty
   * `coordinates` array could not tell "you have not paid for this" from
   * "this course has no geometry", and those need different screens.
   */
  access: {
    map_unlocked: boolean;
    map_locked_reason: string | null;
    illustrative_map: boolean;
    illustrative_note: string | null;
  };
  bundle: {
    version: string;
    provenance: string;
    verified_at: string | null;
    elevation_source: string | null;
    /** ODbL requires this wherever the derived data is shown. Render it. */
    attribution: string | null;
  };
  legs: ReconLeg[];
  totals: {
    distance_m: number;
    elevation_gain_m: number;
    final_cutoff_minutes: number | null;
    final_cutoff_name: string | null;
  };
  barriers: ReconBarrier[];
  aid_stations: ReconAidStation[];
  waypoints: ReconWaypoint[];
  segments: ReconSegment[];
  elevation_profile: {
    authority?: string;
    note?: string;
    legs?: Partial<Record<Leg, ReconElevationLeg>>;
  };
  terrain_pmtiles_key: string | null;
};

/**
 * The free cut-off calculator's answer.
 *
 * Hand-typed for the same reason as `Recon`: the endpoint is annotated
 * `dict[str, object]` backend-side, so the generated client sees nothing.
 *
 * This is **not** a solve, and `basis` says so in the API's own words — it is
 * straight-line arithmetic over the published limits, which is the right answer
 * to "am I near a cut-off?" for someone deciding whether to enter.
 */
export type CutoffBarrier = {
  name: string;
  leg: Leg;
  limit_minutes: number;
  estimated_eta_minutes: number;
  margin_minutes: number;
  at_risk: boolean;
  basis: string;
};

export type CutoffCheck = {
  course_ref: string;
  bundle_version: string;
  projected_minutes: number;
  barriers: CutoffBarrier[];
  at_risk_count: number;
};

export function useCourses(params: { dist?: DistanceType | null; q?: string | null } = {}) {
  /**
   * Held until the session is known.
   *
   * `GET /courses` answers differently depending on who asks — a signed-out
   * visitor gets the marketing showcase, a signed-in athlete gets the real
   * season without it. Firing this during the moment between page load and the
   * refresh token landing asks it as nobody, and the anonymous answer then sits
   * in the cache with nothing to invalidate it.
   *
   * The provider also clears the cache when it resolves, so this is belt and
   * braces — but it is the half that prevents the wrong list ever being
   * painted, rather than only correcting it afterwards.
   */
  const { status } = useAuth();
  return useQuery({
    enabled: status !== "loading",
    queryKey: queryKeys.courses.list({ dist: params.dist ?? null, q: params.q ?? null }),
    queryFn: async (): Promise<CoursePage> => {
      const page = await unwrap(
        client.GET("/api/v1/courses", {
          params: {
            query: {
              dist: params.dist ?? undefined,
              q: params.q?.trim() ? params.q.trim() : undefined,
              // There are three courses. 100 is the cap and leaves room to grow
              // without the directory needing pagination it does not yet earn.
              limit: 100,
            },
          },
        }),
      );
      return page as unknown as CoursePage;
    },
    // The directory changes when a bundle is published, which is rare — but
    // it also changes shape with *who is asking* (a signed-in athlete is not
    // shown the marketing showcase), and that is handled by the auth provider
    // clearing the whole cache on sign-in rather than by a shorter staleness
    // window here.
    staleTime: 5 * 60_000,
  });
}

export function useCourse(ref: string | null) {
  return useQuery({
    queryKey: queryKeys.courses.detail(ref ?? ""),
    enabled: Boolean(ref),
    queryFn: () =>
      unwrap(
        client.GET("/api/v1/courses/{course_ref}", { params: { path: { course_ref: ref! } } }),
      ),
    staleTime: 5 * 60_000,
  });
}

export function useRecon(ref: string | null) {
  /**
   * Held until the session is known, like the directory above — and here the
   * cost of not doing so is worse. The recon payload carries `access`, so asked
   * anonymously it comes back locked; an athlete who has paid for this course
   * and opens its page directly would be shown the paywall for their own map.
   */
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.courses.recon(ref ?? ""),
    enabled: Boolean(ref) && status !== "loading",
    queryFn: async (): Promise<Recon> => {
      const recon = await unwrap(
        client.GET("/api/v1/courses/{course_ref}/recon", {
          params: { path: { course_ref: ref! } },
        }),
      );
      return recon as unknown as Recon;
    },
    staleTime: 5 * 60_000,
  });
}
