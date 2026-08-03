import type { RiderProfile } from "@/types";
import type {
  AssessmentNote,
  CockpitConfiguration,
  CockpitPenaltyBreakdown,
  ConstraintStatus,
  FitAssessment,
  GeometryWarning,
  HandlingPenaltyBreakdown,
  PositionMetrics,
  PredictedPosition,
  TargetPosition,
} from "@/types/optimisation";

/**
 * Evaluation layer — objective measurement only.
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
  PositionMetrics,
  PredictedPosition,
  TargetPosition,
};

export interface ErrorCalculatorInput {
  candidateId: string;
  predicted: PredictedPosition;
  target: TargetPosition;
  /** Optional: the configuration the prediction came from. */
  configuration?: CockpitConfiguration | null;
  /** Whether upstream stages consider this configuration legal. */
  isConstraintValid?: boolean;
  /** Notes carried through from earlier pipeline stages. */
  notes?: AssessmentNote[];
  /** Structured observations carried through from earlier pipeline stages. */
  geometryWarnings?: GeometryWarning[];
}

/** Reads the rider's stored fit coordinates as a target position. */
export function targetFromRider(rider: RiderProfile): TargetPosition {
  return { handlebarX: rider.handlebarX, handlebarY: rider.handlebarY };
}

export function calculatePositionMetrics(
  predicted: PredictedPosition,
  target: TargetPosition,
): PositionMetrics {
  const deltaX = predicted.handlebarX - target.handlebarX;
  const deltaY = predicted.handlebarY - target.handlebarY;
  return {
    deltaX,
    deltaY,
    absoluteDeltaX: Math.abs(deltaX),
    absoluteDeltaY: Math.abs(deltaY),
    euclideanDistance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
  };
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

/** The single public entry point of the evaluation layer. */
export function assessFitCandidate(input: ErrorCalculatorInput): FitAssessment {
  const {
    candidateId,
    predicted,
    target,
    configuration,
    isConstraintValid,
    notes,
    geometryWarnings,
  } = input;
  return {
    candidateId,
    positionMetrics: calculatePositionMetrics(predicted, target),
    cockpitPenaltyBreakdown: calculateCockpitPenalties(configuration),
    handlingPenaltyBreakdown: calculateHandlingPenalties(configuration),
    // No logic populates geometry warnings yet — structure only.
    geometryWarnings: geometryWarnings ?? [],
    constraintStatus: resolveConstraintStatus(isConstraintValid),
    notes: notes ?? [],
  };
}
