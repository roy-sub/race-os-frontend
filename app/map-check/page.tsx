"use client";

/**
 * A bare stage for the course map, and nothing else.
 *
 * It exists for one job: comparing the ported showcase map against the
 * reference implementation in `course-map-3d`, pixel for pixel, with no
 * header, no API and no page chrome in the way. `TRACKS.md` §8 is explicit
 * about why that comparison has to be against the *other* implementation
 * rather than against the maths that produced this one.
 */

import { ShowcaseMap } from "@/components/CourseMap";

export default function MapCheckPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#F5F1EA",
        padding: "12px 14px 14px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div style={{ width: "100%", maxWidth: 1440 }}>
        <ShowcaseMap />
      </div>
    </div>
  );
}
