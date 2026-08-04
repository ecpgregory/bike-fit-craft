import type { Bike } from "@/types";
import type { FrameGeometry } from "@/types/optimisation";

/**
 * Extracts the minimal engineering geometry the Geometry Solver needs from an
 * application Bike record. Unknown values stay null — nothing is estimated.
 *
 * Units: frameReach/frameStack millimetres, headTubeAngle degrees.
 */
export function frameGeometryFromBike(bike: Bike): FrameGeometry {
  return {
    frameReach: bike.frameReach ?? null,
    frameStack: bike.frameStack ?? null,
    headTubeAngle: bike.headTubeAngle ?? null,
  };
}
