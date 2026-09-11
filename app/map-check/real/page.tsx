"use client";

/**
 * The surveyed-venue path, against a real baked field.
 *
 * Same job as `/map-check`, on the other half of the map system: the terrain
 * here is measured elevation around Cervia, the routes are the real IRONMAN
 * 70.3 Italy Emilia-Romagna legs at one shared scale, and the renderer is the
 * same one the showcase uses. The field is fetched from a static file rather
 * than the API so the comparison does not need a database behind it.
 */

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { venueFromField } from "@/lib/map/raster.js";

const CourseMap3D = dynamic(() => import("@/components/CourseMap3D.jsx"), { ssr: false });

export default function RealMapCheckPage() {
  const [venue, setVenue] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    void fetch("/__field-check.json")
      .then((r) => r.json())
      .then((payload) => setVenue(venueFromField(payload)));
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#F5F1EA", padding: "12px 14px 14px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 1440 }}>
        {venue ? (
          <CourseMap3D
            venue={venue}
            note="Surveyed terrain. Distances and gradients are true; the vertical is exaggerated so the relief reads."
            attribution="© OpenStreetMap contributors, ODbL 1.0 · AWS Terrain Tiles"
          />
        ) : null}
      </div>
    </div>
  );
}
