import type {
  CockpitConfiguration,
  FrameGeometry,
  Point2D,
  SolvedConfiguration,
} from "@/types/optimisation";
import {
  calculateFrameReferencePoint,
  calculateRP3,
  calculateSpacerTop,
  calculateSpacerVector,
  calculateStemOrientation,
  calculateStemReferenceAngle,
  calculateStemVector,
} from "./cockpitVectors";


/**
 * Geometry Solver — the physics layer of the Bike Fit Engine.
 *
 * Pipeline position:
 *   Constraint Generator → CockpitConfiguration → **Geometry Solver** →
 *   SolvedConfiguration → Error Calculator → Ranking Engine → Explanation Engine
 *
 * Responsibility: calculate rider position only. It never evaluates fit,
 * scores, ranks or explains.
 *
 * Engineering units used throughout this module:
 * - Frame Reach     millimetres
 * - Frame Stack     millimetres
 * - Head Tube Angle degrees (from horizontal)
 * - Stem Length     millimetres
 * - Stem Angle      degrees (relative to the steerer's perpendicular)
 * - Spacer Height   millimetres
 * - Handlebar Reach millimetres
 * - Handlebar Stack millimetres
 *
 * NOTE: no mathematics is implemented in this sprint. Reference points are
 * structural placeholders only.
 */

/** Placeholder coordinate used until the vector maths sprint lands. */
const PLACEHOLDER_POINT: Point2D = { x: 0, y: 0 };

/** Inputs the solver genuinely requires before any maths can be attempted. */
function missingRequiredInputs(
  configuration: CockpitConfiguration,
  frame: FrameGeometry,
): string[] {
  const missing: string[] = [];
  if (frame.frameReach === null) missing.push("frameReach");
  if (frame.frameStack === null) missing.push("frameStack");
  if (frame.headTubeAngle === null) missing.push("headTubeAngle");
  if (configuration.stemLength === null) missing.push("stemLength");
  if (configuration.stemAngle === null) missing.push("stemAngle");
  return missing;
}

/**
 * Solve one cockpit configuration against one frame.
 *
 * Returns an explicitly Unsolved result when required engineering inputs are
 * unavailable — no substitute values are ever invented.
 */
export function solveConfiguration(
  configuration: CockpitConfiguration,
  frameGeometry: FrameGeometry,
): SolvedConfiguration {
  const missingInputs = missingRequiredInputs(configuration, frameGeometry);

  if (missingInputs.length > 0) {
    return {
      configuration,
      frameGeometry,
      status: "UNSOLVED",
      unsolvedReason: "MISSING_REQUIRED_INPUTS",
      missingInputs,
      rp3: null,
      rp4: null,
      rp5: null,
      isPlaceholderSolution: true,
    };
  }

  // TODO(geometry-maths): compute RP3 (handlebar clamp centre) from frame
  // reach/stack, head tube angle, spacer height, stem length and stem angle.
  const rp3: Point2D = { ...PLACEHOLDER_POINT };
  // TODO(geometry-maths): compute RP4 (handlebar reference point) from RP3 and
  // handlebar reach/stack.
  const rp4: Point2D = { ...PLACEHOLDER_POINT };
  // TODO(geometry-maths): compute RP5 (rider contact point) from RP4 and the
  // handlebar's contact-point offsets once those inputs exist.
  const rp5: Point2D = { ...PLACEHOLDER_POINT };

  return {
    configuration,
    frameGeometry,
    status: "SOLVED",
    unsolvedReason: null,
    missingInputs: [],
    rp3,
    rp4,
    rp5,
    // Placeholder coordinates: downstream layers must not treat these as real.
    isPlaceholderSolution: true,
  };
}

/** Convenience: solve many configurations against the same frame. */
export function solveConfigurations(
  configurations: readonly CockpitConfiguration[],
  frameGeometry: FrameGeometry,
): SolvedConfiguration[] {
  return configurations.map((configuration) =>
    solveConfiguration(configuration, frameGeometry),
  );
}
