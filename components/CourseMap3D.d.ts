/**
 * Types for the ported map component.
 *
 * `CourseMap3D.jsx` is kept as JavaScript on purpose: it is a near-verbatim
 * port of the signed-off design in `course-map-3d`, and a translation to TSX
 * would be a diff nobody could review against the original. The contract it
 * exposes is small, so it is declared here instead — the callers get real
 * types, the port stays comparable line for line.
 */

/** A venue object. Its shape is documented in `course-map-3d/VENUES.md`. */
export type Venue = Record<string, unknown>;

export type CourseMap3DProps = {
  venue?: Venue;
  /** Amplitude of the generated landform. Ignored by a surveyed venue. */
  relief?: number;
  contours?: boolean;
  autoOrbit?: boolean;
  /** A plain sentence under the map: what this drawing is and is not. */
  note?: string | null;
  /** Data attribution. ODbL obliges it wherever derived data is displayed. */
  attribution?: string | null;
  /** CSS height of the stage. */
  height?: string;
};

declare const CourseMap3D: (props: CourseMap3DProps) => JSX.Element;
export default CourseMap3D;

export declare const DISCIPLINE_COLORS: Record<"Swim" | "Bicycle" | "Run", string>;
