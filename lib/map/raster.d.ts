/** Types for the raster-terrain provider. See `raster.js` for the reasoning. */

import type { Venue } from "@/components/CourseMap3D";

export declare class RasterTerrain {
  constructor(field: unknown, world: unknown);
  baseHeight(x: number, z: number): number;
  waterAt(x: number, z: number): number | null;
  shoreDistance(x: number, z: number): number;
  maxHeight(): number;
  readonly hasWater: boolean;
  readonly metresPerUnit: number;
}

export declare const SHORE_TEXTURE_RANGE: number;

/** Build a venue object from the backend's baked terrain field. */
export declare function venueFromField(
  payload: unknown,
  overrides?: {
    title?: string;
    subtitle?: string;
    stats?: unknown;
    markers?: unknown;
  },
): Venue;
