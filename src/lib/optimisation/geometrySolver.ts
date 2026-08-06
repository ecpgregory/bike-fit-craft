import type {
  CockpitConfiguration,
  FrameGeometry,
  Point2D,
  SolvedConfiguration,
} from "@/types/optimisation";
import {
  calculateFrameReferencePoint,
  calculateHandlebarVector,
  calculateHoodOrientation,
  calculateHoodVector,
  calculateRP3,
  calculateRP4,
  calculateRP5,
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
 * NOTE: Cockpit Model 1.0 (Stage 1) implements RP3 only. RP4 and RP5 remain
 * structural placeholders until the next sprint.
 */

/** Placeholder coordinate used until RP4/RP5 mathematics lands. */
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

  // Narrowed above by missingRequiredInputs; no defaults are substituted.
  const frameReach = frameGeometry.frameReach as number; // mm
  const frameStack = frameGeometry.frameStack as number; // mm
  const headTubeAngle = frameGeometry.headTubeAngle as number; // degrees (θ)
  const stemLength = configuration.stemLength as number; // mm
  const stemAngle = configuration.stemAngle as number; // degrees (φ)
  const spacerHeight = configuration.spacerHeight; // mm

  // Frame Reference Point → Spacer Vector → Spacer Top → Stem Vector → RP3.
  const frameReferencePoint = calculateFrameReferencePoint(frameReach, frameStack);
  const spacerVector = calculateSpacerVector(spacerHeight, headTubeAngle);
  const spacerTop = calculateSpacerTop(frameReferencePoint, spacerVector);
  const stemReferenceAngle = calculateStemReferenceAngle(headTubeAngle); // β
  const stemOrientation = calculateStemOrientation(stemReferenceAngle, stemAngle); // α
  const stemVector = calculateStemVector(stemLength, stemOrientation);
  const rp3 = calculateRP3(spacerTop, stemVector);

  // TODO(cockpit-model-stage-2): compute RP4 (handlebar reference point) from
  // RP3 and handlebar reach/stack.
  const rp4: Point2D = { ...PLACEHOLDER_POINT };
  // TODO(cockpit-model-stage-2): compute RP5 (rider contact point) from RP4 and
  // the handlebar's contact-point offsets once those inputs exist.
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
    // RP3 is real; RP4/RP5 are still placeholders.
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
