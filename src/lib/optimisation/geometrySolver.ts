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
 * NOTE: Cockpit Model 1.0 (Stage 2) implements the full RP3 → RP4 → RP5 chain.
 * Each reference point is produced by its own vector function.
 */

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
 * Cockpit inputs required for the RP3 → RP4 → RP5 chain.
 *
 * TODO(cockpit-model-1.1): handlebarRotation, hoodReach, hoodStack and
 * hoodRotation are not yet produced by the Constraint Generator. Until they
 * are, configurations lacking them are reported UNSOLVED — no zero rotation
 * and no component dimensions are assumed.
 */
function missingCockpitInputs(configuration: CockpitConfiguration): string[] {
  const missing: string[] = [];
  if (configuration.handlebarReach === null) missing.push("handlebarReach");
  if (configuration.handlebarStack === null) missing.push("handlebarStack");
  if (configuration.handlebarRotation === null || configuration.handlebarRotation === undefined)
    missing.push("handlebarRotation");
  if (configuration.hoodReach === null || configuration.hoodReach === undefined)
    missing.push("hoodReach");
  if (configuration.hoodStack === null || configuration.hoodStack === undefined)
    missing.push("hoodStack");
  if (configuration.hoodRotation === null || configuration.hoodRotation === undefined)
    missing.push("hoodRotation");
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
      isPlaceholderSolution: false,
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

  // The RP3 → RP4 → RP5 chain requires the cockpit component quantities. If any
  // is unavailable the whole configuration is UNSOLVED: partial positions must
  // never be reported as a solution.
  const missingCockpit = missingCockpitInputs(configuration);
  if (missingCockpit.length > 0) {
    return {
      configuration,
      frameGeometry,
      status: "UNSOLVED",
      unsolvedReason: "MISSING_COCKPIT_INPUTS",
      missingInputs: missingCockpit,
      rp3: null,
      rp4: null,
      rp5: null,
      isPlaceholderSolution: false,
    };
  }

  const handlebarReach = configuration.handlebarReach as number; // mm, +forwards
  const handlebarStack = configuration.handlebarStack as number; // mm, +upwards
  const handlebarRotation = configuration.handlebarRotation as number; // degrees (ρ)
  const hoodReach = configuration.hoodReach as number; // mm, +forwards
  const hoodStack = configuration.hoodStack as number; // mm, +upwards
  const hoodRotation = configuration.hoodRotation as number; // degrees (σ)

  // RP3 → Handlebar Vector → RP4.
  const handlebarVector = calculateHandlebarVector(
    handlebarReach,
    handlebarStack,
    handlebarRotation,
  );
  const rp4: Point2D = calculateRP4(rp3, handlebarVector);

  // RP4 → Hood Vector → RP5.
  const hoodOrientation = calculateHoodOrientation(handlebarRotation, hoodRotation); // ψ
  const hoodVector = calculateHoodVector(hoodReach, hoodStack, hoodOrientation);
  const rp5: Point2D = calculateRP5(rp4, hoodVector);

  return {
    configuration,
    frameGeometry,
    status: "SOLVED",
    unsolvedReason: null,
    missingInputs: [],
    rp3,
    rp4,
    rp5,
    // Cockpit Model 1.0 is complete: RP3, RP4 and RP5 are all real geometry.
    isPlaceholderSolution: false,
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
