import type { RiderProfile } from "@/types";
import { missingCockpitInputs } from "@/lib/optimisation/geometrySolver";
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
 * The positional source of truth is the solved RP3 (handlebar clamp centre),
 * matching the rider's saved handlebar X/Y measurement convention. No
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
 * The rider-position source is RP3 — the Handlebar Clamp Centre — because the
 * rider's saved fit (handlebarX / handlebarY) is measured to that point.
 * RP4/RP5 remain retained geometry points but are not used here.
 * Returns null when RP3 could not be calculated.
 */
export function predictedPositionFromSolved(
  solved: SolvedConfiguration,
): PredictedPosition | null {
  return solved.rp3;
}

/**
 * TODO: engineering thresholds for component-origin penalties (stock vs
 * aftermarket stem, cockpit and spacer stacks) will be defined in a future
 * sprint. Until then every component returns zero — no invented assumptions.
 *
 * NOTE (Sprint 9.8): these breakdowns are *component-origin* bookkeeping and
 * are no longer used by the ranking model. Cockpit fit quality is expressed by
 * `FitAssessment.cockpitMetric`, which is availability-aware.
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

/**
 * Sprint 9.8 — cockpit fit metric.
 *
 * The cockpit metric is the Euclidean error between the solved rider contact
 * point (RP5) and the rider's cockpit contact target, using the same error
 * model as the positional metric. It exists only when BOTH inputs are real:
 *
 *  - RP5 was solved (hood geometry documented), otherwise
 *    COCKPIT_GEOMETRY_UNAVAILABLE;
 *  - the rider has an explicit cockpit contact target, otherwise
 *    COCKPIT_TARGET_UNAVAILABLE. The RP3 handlebar target is NOT reused: RP3
 *    and RP5 are different physical points.
 *
 * Unknown is returned as an unavailable metric — never as zero penalty.
 */
export function calculateCockpitMetric(
  solved: SolvedConfiguration,
  cockpitTarget: CockpitTargetPosition | null | undefined,
): PenaltyMetric {
  if (solved.rp5 === null) return unavailableMetric("COCKPIT_GEOMETRY_UNAVAILABLE");
  if (!cockpitTarget) return unavailableMetric("COCKPIT_TARGET_UNAVAILABLE");
  return availableMetric(
    calculatePositionMetrics(solved.rp5, cockpitTarget).euclideanDistance,
  );
}

/**
 * Sprint 9.8 — handling metric.
 *
 * The only handling characteristic the domain model represents objectively is
 * handlebar width. A penalty is therefore calculated ONLY when the rider has
 * stated a handlebar-width target AND the configuration carries a verified
 * width. The rider's current equipment is never used as a hidden default, and
 * no preference for wider or narrower bars is assumed: the penalty is the
 * absolute deviation from the rider's own stated target, in millimetres.
 */
export function calculateHandlingMetric(
  configuration: CockpitConfiguration,
  handlingTarget: HandlingTarget | null | undefined,
): PenaltyMetric {
  if (!handlingTarget) return unavailableMetric("HANDLING_TARGET_UNAVAILABLE");
  const width = configuration.handlebarWidth;
  if (width === null || width === undefined)
    return unavailableMetric("HANDLING_INPUT_UNAVAILABLE");
  return availableMetric(Math.abs(width - handlingTarget.handlebarWidth));
}

const METRIC_DIAGNOSTICS: Record<MetricUnavailableCode, string> = {
  COCKPIT_GEOMETRY_UNAVAILABLE:
    "Cockpit fit not scored — RP5 could not be solved from documented hood geometry.",
  COCKPIT_TARGET_UNAVAILABLE:
    "Cockpit fit not scored — the rider profile defines no cockpit contact target.",
  HANDLING_TARGET_UNAVAILABLE:
    "Handling not scored — the rider profile defines no handling target.",
  HANDLING_INPUT_UNAVAILABLE:
    "Handling not scored — this configuration has no documented handlebar width.",
};

function metricWarning(metric: PenaltyMetric): GeometryWarning | null {
  if (metric.available || metric.unavailableReason === null) return null;
  return {
    code: metric.unavailableReason,
    severity: "info",
    message: METRIC_DIAGNOSTICS[metric.unavailableReason],
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
 * Returns `null` when RP3 is unavailable: position metrics and
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

  const warnings: GeometryWarning[] = [...(geometryWarnings ?? [])];
  const missingCockpit = missingCockpitInputs(solved.configuration);
  if (missingCockpit.length > 0) {
    warnings.push({
      code: "RP4_RP5_UNAVAILABLE",
      severity: "info",
      message:
        "Hood/handlebar geometry unavailable — position matched to handlebar clamp centre (RP3) only.",
      measurements: { missingInputs: missingCockpit },
    });
  }

  const cockpitMetric = calculateCockpitMetric(solved, input.cockpitTarget);
  const handlingMetric = calculateHandlingMetric(
    solved.configuration,
    input.handlingTarget,
  );
  for (const metric of [cockpitMetric, handlingMetric]) {
    const warning = metricWarning(metric);
    if (warning) warnings.push(warning);
  }

  return {
    candidateId,
    positionMetrics: calculatePositionMetrics(predicted, target),
    cockpitPenaltyBreakdown: calculateCockpitPenalties(solved.configuration),
    handlingPenaltyBreakdown: calculateHandlingPenalties(solved.configuration),
    cockpitMetric,
    handlingMetric,
    geometryWarnings: warnings,
    constraintStatus: resolveConstraintStatus(isConstraintValid),
    notes: notes ?? [],
  };
}

