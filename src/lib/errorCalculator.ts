import type { Millimetres, RiderProfile } from "@/types";
import type { CockpitConfiguration } from "@/types/optimisation";

/**
 * Evaluation layer — objective measurement only.
 *
 * The Error Calculator measures. It never judges, ranks or recommends.
 * Penalty functions exist for structure only and currently return zero.
 */

export interface AssessmentNote {
  code: string;
  message: string;
}

export interface CockpitPenaltyBreakdown {
  nonStockStem: number;
  nonStockCockpit: number;
  nonStockSpacerConfiguration: number;
}

export interface HandlingPenaltyBreakdown {
  stemLengthPenalty: number;
  spacerPenalty: number;
}

export interface PositionMetrics {
  deltaX: number;
  deltaY: number;
  absoluteDeltaX: number;
  absoluteDeltaY: number;
  euclideanDistance: number;
}

export interface FitAssessment {
  candidateId: string;
  positionMetrics: PositionMetrics;
  cockpitPenaltyBreakdown: CockpitPenaltyBreakdown;
  handlingPenaltyBreakdown: HandlingPenaltyBreakdown;
  constraintStatus: "VALID" | "INVALID";
  notes: AssessmentNote[];
}

/** A predicted contact point, produced by the (future) geometry solver. */
export interface PredictedPosition {
  handlebarX: Millimetres;
  handlebarY: Millimetres;
}

/** The rider's target contact point. */
export interface TargetPosition {
  handlebarX: Millimetres;
  handlebarY: Millimetres;
}

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
): "VALID" | "INVALID" {
  return isConstraintValid === false ? "INVALID" : "VALID";
}

/** The single public entry point of the evaluation layer. */
export function assessFitCandidate(input: ErrorCalculatorInput): FitAssessment {
  const { candidateId, predicted, target, configuration, isConstraintValid, notes } =
    input;
  return {
    candidateId,
    positionMetrics: calculatePositionMetrics(predicted, target),
    cockpitPenaltyBreakdown: calculateCockpitPenalties(configuration),
    handlingPenaltyBreakdown: calculateHandlingPenalties(configuration),
    constraintStatus: resolveConstraintStatus(isConstraintValid),
    notes: notes ?? [],
  };
}
