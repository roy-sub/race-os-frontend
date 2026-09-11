"use client";

/**
 * The one place a course map is rendered.
 *
 * Every map on the site comes through here, so the design cannot drift between
 * screens: the recon page, the plan and the landing hero all get the same
 * renderer, the same palette and the same controls. What differs is the venue
 * it is handed, and there are exactly two kinds:
 *
 * **The showcase.** Kalmar 70.3, shown to signed-out visitors only. Its
 * terrain is generated rather than surveyed and its three legs are drawn at
 * different scales — that is what makes it read as a composition, and it is
 * why the card carries a plain note saying so. It renders byte-identically to
 * `course-map-3d`, which is a requirement rather than a nicety: it is
 * signed-off artwork (`TRACKS.md` §1).
 *
 * **A surveyed venue.** Real elevation, real routes, one horizontal scale
 * across all three legs, and a vertical exaggeration computed per venue and
 * printed on the card. The field is baked by the backend — the browser does no
 * geography — and arrives from `GET /courses/{ref}/terrain`.
 *
 * The map is loaded on demand rather than bundled: Three.js and a 600 KB
 * terrain field have no business in the first paint of a page that may never
 * scroll to a map.
 */

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { API_BASE_URL } from "@/lib/env";
import { apiFetch } from "@/lib/api/http";
import { ApiError } from "@/lib/api/errors";
import { Skeleton } from "@/components/Skeleton";
import { venueFromField } from "@/lib/map/raster.js";
import kalmarVenue from "@/lib/map/venues/kalmar.js";

const CourseMap3D = dynamic(() => import("@/components/CourseMap3D.jsx"), {
  ssr: false,
  loading: () => <MapFrame>{null}</MapFrame>,
});

/**
 * The line under the showcase map.
 *
 * It has one job a disclaimer usually does not: it has to stay honest *and*
 * make the real thing sound worth having. The old wording did the first half
 * only — "stylised terrain, not to scale. Surveyed, true-scale maps built from
 * real course and terrain data open with a race plan" is accurate, and it reads
 * like a legal note apologising for the page it sits on.
 *
 * This says the same two facts — this one is a drawing, the real ones are
 * surveyed — in the order that makes the second one the point rather than the
 * caveat.
 */
export const ILLUSTRATIVE_NOTE =
  "A taste of it — hand-drawn, and not to scale. Your race gets the real thing: every metre surveyed from the course itself.";

export type TerrainField = {
  schema_version: number;
  course: { slug: string; name: string; place: string; distance_type: string };
  bundle_version: string;
  attribution: string;
  world: {
    width: number;
    depth: number;
    metres_per_unit: number;
    metres_per_unit_vertical: number;
    vertical_exaggeration: number;
    water_level: number;
    has_water: boolean;
    datum_m: number;
    relief_m: number;
  };
  field: { nx: number; nz: number; heights: number[]; water: number[]; shore_distance: number[] };
  routes: Record<string, [number, number][]>;
  legs: Record<string, { distance_m: number; elevation_gain_m: number }>;
  barriers: { name: string; leg: string; km: number; limit_minutes_from_start: number }[];
  aid_stations: { name: string; leg: string; km: number; contents: string[] }[];
  waypoints: { name: string; leg: string; km: number; type: string }[];
};

/**
 * The terrain field for one course.
 *
 * Not part of the generated client: the endpoint is typed `dict[str, object]`
 * backend-side, so its shape is asserted here, next to the only call that
 * reads it — the same treatment `GET /courses/{ref}/recon` already gets.
 */
export function useTerrainField(courseRef: string | null | undefined, enabled = true) {
  return useQuery<TerrainField>({
    queryKey: ["courses", "terrain", courseRef ?? null],
    enabled: Boolean(courseRef) && enabled,
    // A published bundle is immutable, so its field is too. Refetching it
    // would be 600 KB spent to learn nothing.
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: (count, error) => !(error instanceof ApiError) && count < 2,
    queryFn: async () => {
      const response = await apiFetch(
        `${API_BASE_URL}/api/v1/courses/${encodeURIComponent(courseRef!)}/terrain`,
      );
      return (await response.json()) as TerrainField;
    },
  });
}

function MapFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        background: "#FFFFFF",
        border: "1px solid rgba(23,19,15,.09)",
        borderRadius: 14,
        boxShadow: "0 1px 2px rgba(23,19,15,.04),0 26px 56px -44px rgba(23,19,15,.45)",
        overflow: "hidden",
      }}
    >
      {children ?? (
        <>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(23,19,15,.08)" }}>
            <Skeleton width={220} height={22} />
          </div>
          <div
            style={{
              height: "min(calc(100vh - 96px),900px)",
              minHeight: 420,
              background: "radial-gradient(122% 96% at 52% 10%,#241F1A 0%,#171412 48%,#0D0C0B 100%)",
            }}
          />
        </>
      )}
    </div>
  );
}

/** The signed-out hero. Always the showcase venue, always with its note. */
export function ShowcaseMap({ height }: { height?: string }) {
  return (
    <CourseMap3D
      venue={kalmarVenue}
      note={ILLUSTRATIVE_NOTE}
      attribution="RaceOS illustrative course map"
      height={height}
    />
  );
}

/**
 * A real race's map, from its baked terrain field.
 *
 * `locked` is what a signed-out visitor or an athlete without an entitlement
 * sees: the same frame, the same proportions, and a plain statement of what
 * opens it — rather than a blank space that reads as a broken page.
 */
export function SurveyedMap({
  courseRef,
  courseName,
  locked = false,
  lockedReason,
  onUnlock,
  height,
}: {
  courseRef: string;
  courseName?: string;
  locked?: boolean;
  lockedReason?: string | null;
  onUnlock?: React.ReactNode;
  height?: string;
}) {
  const { data, isPending, error } = useTerrainField(courseRef, !locked);

  const venue = useMemo(() => (data ? venueFromField(data) : null), [data]);

  if (locked) {
    return (
      <LockedMap
        courseName={courseName}
        reason={lockedReason}
        action={onUnlock}
        height={height}
      />
    );
  }
  if (error) {
    return (
      <LockedMap
        courseName={courseName}
        reason={
          error instanceof ApiError
            ? error.message
            : "The map could not be loaded. The course data may still be building."
        }
        action={onUnlock}
        height={height}
      />
    );
  }
  if (isPending || !venue) return <MapFrame>{null}</MapFrame>;

  return (
    <CourseMap3D
      venue={venue}
      note={`Surveyed terrain at ${data!.world.vertical_exaggeration}× vertical exaggeration — chosen so the relief reads, and stated rather than assumed. Distances and gradients are true.`}
      attribution={data!.attribution}
      height={height}
    />
  );
}

function LockedMap({
  courseName,
  reason,
  action,
  height = "min(calc(100vh - 96px),900px)",
}: {
  courseName?: string;
  reason?: string | null;
  action?: React.ReactNode;
  height?: string;
}) {
  return (
    <MapFrame>
      <>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 12,
            padding: "14px 18px 14px 20px",
            borderBottom: "1px solid rgba(23,19,15,.08)",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.025em" }}>
            {courseName ?? "Course map"}
          </div>
          <div
            className="mono"
            style={{ fontSize: 9.5, letterSpacing: ".15em", color: "#8A8177" }}
          >
            SURVEYED MAP · LOCKED
          </div>
        </div>
        <div
          style={{
            position: "relative",
            height,
            minHeight: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            textAlign: "center",
            background:
              "radial-gradient(122% 96% at 52% 10%,#241F1A 0%,#171412 48%,#0D0C0B 100%)",
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <div
              className="mono"
              style={{ fontSize: 9, letterSpacing: ".2em", color: "rgba(251,248,242,.4)" }}
            >
              PART OF THE RACE PLAN
            </div>
            <div
              style={{
                margin: "16px 0 0",
                fontSize: 26,
                lineHeight: 1.2,
                fontWeight: 500,
                letterSpacing: "-.03em",
                color: "#FBF8F2",
              }}
            >
              The surveyed map opens with the plan.
            </div>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14.5,
                lineHeight: 1.55,
                color: "rgba(251,248,242,.6)",
              }}
            >
              {reason ??
                "Real elevation, the full cut-off ladder and every aid station, at true scale."}
            </p>
            {action ? <div style={{ marginTop: 22 }}>{action}</div> : null}
          </div>
        </div>
      </>
    </MapFrame>
  );
}
