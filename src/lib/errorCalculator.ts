import type { RiderProfile } from "@/types";
import type {
  AssessmentNote,
  CockpitConfiguration,
  CockpitPenaltyBreakdown,
  ConstraintStatus,
  FitAssessment,
  GeometryWarning,
  HandlingPenaltyBreakdown,
  Point2D,
  PositionMetrics,
  PredictedPosition,
  SolvedConfiguration,
  TargetPosition,
} from "@/types/optimisation";

/**
 * Evaluation layer — objective measurement only.
 *
 * Data flow into this stage:
 *   Geometry Solver → SolvedConfiguration → **Error Calculator** → FitAssessment
 *
 * The positional source of truth is the solved RP5 (rider contact point). No
 * position is ever constructed here: an UNSOLVED configuration is not
 * evaluated at all.
 *
 * The Error Calculator measures. It never judges, ranks or recommends.
 * Penalty functions exist for structure only and currently return zero.
 *
 * All shared domain interfaces live in `src/types/optimisation.ts`; they are
 * re-exported here for backwards compatibility with existing imports.
 */

export type {
  AssessmentNote,
  CockpitPenaltyBreakdown,
  ConstraintStatus,
  FitAssessment,
  GeometryWarning,
  HandlingPenaltyBreakdown,
  Point2D,
  PositionMetrics,
  PredictedPosition,
  SolvedConfiguration,
  TargetPosition,
};

/** Input to the evaluation layer: one solved configuration plus its target. */
export interface ErrorCalculatorInput {
  candidateId: string;
  /** Produced by the Geometry Solver; RP5 supplies the predicted position. */
  solved: SolvedConfiguration;
  target: TargetPosition;
  /** Whether upstream stages consider this configuration legal. */
  isConstraintValid?: boolean;
  /** Notes carried through from earlier pipeline stages. */
  notes?: AssessmentNote[];
  /** Structured observations carried through from earlier pipeline stages. */
  geometryWarnings?: GeometryWarning[];
}

/** Reads the rider's stored fit coordinates as a target position. */
export function targetFromRider(rider: RiderProfile): TargetPosition {
  return { x: rider.handlebarX, y: rider.handlebarY };
}

export function calculatePositionMetrics(
  predicted: PredictedPosition,
  target: TargetPosition,
): PositionMetrics {
  const deltaX = predicted.x - target.x;
  const deltaY = predicted.y - target.y;
  return {
    deltaX,
    deltaY,
    absoluteDeltaX: Math.abs(deltaX),
    absoluteDeltaY: Math.abs(deltaY),
    euclideanDistance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
  };
}

/**
 * The rider contact point of a solved configuration, or null when the
 * configuration could not be solved. The only supported position source.
 */
export function predictedPositionFromSolved(
  solved: SolvedConfiguration,
): PredictedPosition | null {
  return solved.status === "SOLVED" ? solved.rp5 : null;
}

/**
 * TODO: engineering thresholds for component-origin penalties (stock vs
 * aftermarket stem, cockpit and spacer stacks) will be defined in a future
 * sprint. Until then every component returns zero — no invented assumptions.
 */
export function calculateCockpitPenalties(
  _configuration?: CockpitConfiguration | null,
): CockpitPenaltyBreakdown {
  return {
    nonStockStem: 0,
    nonStockCockpit: 0,
    nonStockSpacerConfiguration: 0,
  };
}

/**
 * TODO: handling thresholds (acceptable stem length range, maximum spacer
 * height) are not yet defined. They will be specified in a future sprint;
 * this function must not assume them.
 */
export function calculateHandlingPenalties(
  _configuration?: CockpitConfiguration | null,
): HandlingPenaltyBreakdown {
  return {
    stemLengthPenalty: 0,
    spacerPenalty: 0,
  };
}

/** Reports, but does not enforce, the constraint status of a candidate. */
export function resolveConstraintStatus(
  isConstraintValid: boolean | undefined,
): ConstraintStatus {
  return isConstraintValid === false ? "INVALID" : "VALID";
}

/**
 * The single public entry point of the evaluation layer.
 *
 * Returns `null` when the configuration is UNSOLVED: position metrics and
 * penalties are not calculated for geometry that does not exist. The caller
 * (see `src/lib/optimisation/pipeline.ts`) preserves the unsolved reason.
 */
export function assessSolvedConfiguration(
  input: ErrorCalculatorInput,
): FitAssessment | null {
  const { candidateId, solved, target, isConstraintValid, notes, geometryWarnings } =
    input;

  const predicted = predictedPositionFromSolved(solved);
  if (predicted === null) return null;

  return {
    candidateId,
    positionMetrics: calculatePositionMetrics(predicted, target),
    cockpitPenaltyBreakdown: calculateCockpitPenalties(solved.configuration),
    handlingPenaltyBreakdown: calculateHandlingPenalties(solved.configuration),
    // No logic populates geometry warnings yet — structure only.
    geometryWarnings: geometryWarnings ?? [],
    constraintStatus: resolveConstraintStatus(isConstraintValid),
    notes: notes ?? [],
  };
}
