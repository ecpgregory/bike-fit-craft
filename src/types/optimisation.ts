/**
 * Optimisation framework types.
 *
 * These describe the *constraint* stage of the fit pipeline:
 *
 *   Rider Profile → Candidate Bike → BikeFitConstraints → Constraint Generator
 *   → Legal Cockpit Configurations → (future) Cockpit Geometry Solver
 *   → (future) Error Calculator → (future) Ranking → (future) Recommendation
 *
 * Nothing here performs geometry maths. Everything is manufacturer agnostic:
 * a bike is described only by generic geometry and constraint data.
 */

import type { Bike, Millimetres } from "./index";

/** A purchasable cockpit combination (bar, or integrated bar/stem unit). */
export interface CockpitOption {
  id: string;
  /** Human-readable name, e.g. "One-piece cockpit 380 × 100". */
  name: string;
  /** Stem length of an integrated unit; null for a separate handlebar. */
  stemLength: Millimetres | null;
  /** Degrees; null when not applicable or unknown. */
  stemAngle: number | null;
  handlebarReach: Millimetres | null;
  handlebarStack: Millimetres | null;
  /** Degrees; rotation of the handlebar about its clamp axis. Null when unknown. */
  handlebarRotation: number | null;
  hoodReach: Millimetres | null;
  hoodStack: Millimetres | null;
  /** Degrees; hood tilt relative to the handlebar. Null when unknown. */
  hoodRotation: number | null;

  /** True when this option ships as standard equipment on the bike. */
  isStock: boolean;
  /** True when bar and stem cannot be separated. */
  isIntegrated: boolean;
  /** True when the option is not sold by the frame manufacturer. */
  isAftermarket: boolean;
  notes?: string;
}

/**
 * Everything required to enumerate every legal cockpit configuration for one
 * specific bike size. Unknown data is `null` — the generator never guesses.
 */
export interface BikeFitConstraints {
  /** The bike these constraints describe, when available. */
  bikeId?: string | null;
  minimumSpacerHeight: Millimetres | null;
  maximumSpacerHeight: Millimetres | null;
  /** Discrete spacer stack heights that can actually be built, in mm. */
  availableSpacerHeights: Millimetres[];
  minimumStemLength: Millimetres | null;
  maximumStemLength: Millimetres | null;
  availableStemLengths: Millimetres[];
  /** Degrees, e.g. [-17, -6, 6, 17]. */
  allowedStemAngles: number[];
  /** True when the bike uses a one-piece / proprietary cockpit. */
  integratedCockpit: boolean | null;
  availableCockpitOptions: CockpitOption[];
  allowAftermarketStem: boolean;
  allowAftermarketHandlebar: boolean;
  /** Manufacturer-recommended (not absolute) spacer ceiling. */
  maximumRecommendedSpacerHeight: Millimetres | null;
  notes: string;
}

/** One complete, legal cockpit configuration generated for a bike. */
export interface CockpitConfiguration {
  id: string;
  stemLength: Millimetres | null;
  stemAngle: number | null;
  spacerHeight: Millimetres;
  handlebarReach: Millimetres | null;
  handlebarStack: Millimetres | null;
  usesStockComponents: boolean;
  requiresAftermarketStem: boolean;
  requiresAftermarketHandlebar: boolean;
  /** Deterministic, human-readable summary of the configuration. */
  configurationDescription: string;
  /** True when spacer height exceeds the manufacturer's recommendation. */
  exceedsRecommendedSpacerHeight: boolean;
  /** The cockpit option this configuration was built from, when applicable. */
  cockpitOptionId: string | null;

  // --- Cockpit Model 1.0 Stage 2 engineering inputs -------------------------
  // These quantities exist structurally so the Geometry Solver can express the
  // full RP3 → RP4 → RP5 chain. The optimisation layer does not yet supply
  // them; when absent the solver returns UNSOLVED rather than substituting a
  // value.
  /**
   * Degrees. Rotation of the handlebar about its clamp axis, positive = bar
   * rotated upwards (nose up) in the sagittal plane.
   * TODO(cockpit-model-1.1): supplied by the Constraint Generator once
   * handlebar rotation becomes an optimisation variable. Never default to 0.
   */
  handlebarRotation?: number | null;
  /**
   * Millimetres. Horizontal displacement from RP4 to the hood contact point,
   * measured in the unrotated handlebar frame.
   * TODO(cockpit-model-1.1): supplied by cockpit/hood component data.
   */
  hoodReach?: Millimetres | null;
  /**
   * Millimetres. Vertical displacement from RP4 to the hood contact point,
   * measured in the unrotated handlebar frame. Positive = upwards.
   * TODO(cockpit-model-1.1): supplied by cockpit/hood component data.
   */
  hoodStack?: Millimetres | null;
  /**
   * Degrees. Additional rotation of the hood relative to the handlebar
   * (hood tilt / shims), positive = upwards.
   * TODO(cockpit-model-1.1): supplied by cockpit/hood component data.
   */
  hoodRotation?: number | null;
}

/**
 * One candidate bike plus every legal configuration for it.
 * Later pipeline stages attach solved geometry, errors and scores.
 */
export interface FitCandidate {
  bike: Bike;
  constraints: BikeFitConstraints;
  configurations: CockpitConfiguration[];
}

/**
 * Output of the full optimisation pipeline. Only the constraint stage is
 * implemented in this sprint; later stages populate `bestConfiguration`.
 */
export interface OptimisationResult {
  candidates: FitCandidate[];
  /** Populated by the future ranking engine. */
  bestConfiguration: CockpitConfiguration | null;
  /** Populated by the future ranking engine. */
  bestCandidate: FitCandidate | null;
  generatedAt: Date;
  /** Human-readable reasons why data was insufficient, if any. */
  warnings: string[];
}

// --- Shared severity ---------------------------------------------------------

/**
 * The single severity vocabulary for the whole optimisation domain.
 * Legacy values map as: caution → "warning", blocking → "error".
 */
export type Severity = "info" | "warning" | "error";

// --- Evaluation domain -------------------------------------------------------

/** A structured, machine-readable note attached to an assessment. */
export interface AssessmentNote {
  code: string;
  severity: Severity;
  message: string;
}

/** Codes for observations about the geometry/cockpit of a configuration. */
export type GeometryWarningCode =
  | "NEAR_MAXIMUM_SPACER_STACK"
  | "INTEGRATED_COCKPIT"
  | "AFTERMARKET_COCKPIT"
  | "MANUFACTURER_LIMITATION"
  | "RP4_RP5_UNAVAILABLE";

/**
 * An observation only — never a judgement, score or recommendation.
 * No logic populates these yet; this is the shared domain model.
 */
export interface GeometryWarning {
  code: GeometryWarningCode | string;
  severity: Severity;
  message: string;
  /** Objective values supporting the observation, when available. */
  measurements?: Record<string, number | string | string[]>;
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

export type ConstraintStatus = "VALID" | "INVALID";

/**
 * The single coordinate representation of the optimisation/evaluation
 * pipeline. Sagittal-plane millimetres: `x` horizontal, `y` vertical.
 *
 * Future reference points (RP0–RP5 produced by the Geometry Solver) all share
 * this shape. UI-facing models (RiderProfile, Bike) keep their own field names
 * and are deliberately not migrated.
 */
export interface Point2D {
  x: Millimetres;
  y: Millimetres;
}

/** A predicted contact point, produced by the (future) geometry solver. */
export type PredictedPosition = Point2D;

/** The rider's target contact point. */
export type TargetPosition = Point2D;

// --- Optimisation outcome ----------------------------------------------------

/**
 * High-level, machine-readable state of one bike's optimisation run.
 *
 * Derived from existing optimisation state — never stored as duplicate,
 * mutable state. Detailed solver/rejection diagnostics remain the source of
 * truth for WHY an outcome occurred.
 *
 * - NO_CANDIDATES:   the Constraint Generator produced zero configurations, so
 *                    the Geometry Solver never ran.
 * - NO_VALID_RESULT: configurations existed but none survived the solver,
 *                    constraint or evaluation stages.
 * - SUCCESS:         at least one configuration produced a ranked result.
 */
export type OptimisationOutcome = "NO_CANDIDATES" | "NO_VALID_RESULT" | "SUCCESS";

/** A configuration dimension the Constraint Generator requires. */
export type ConstraintDimension =
  | "spacerHeight"
  | "stemLength"
  | "stemAngle"
  | "cockpitOption";

/**
 * Machine-readable explanation of why the Constraint Generator could not
 * enumerate any legal configuration. This is a *data availability* statement,
 * never a geometry failure: nothing is inferred and no value is invented.
 */
export interface ConstraintDiagnostic extends AssessmentNote {
  code: "CONSTRAINT_DIMENSION_UNAVAILABLE";
  /** Dimensions that are undocumented for this bike. */
  missing: ConstraintDimension[];
  /** Dimensions that are documented, for contrast. */
  documented: ConstraintDimension[];
}

// --- Geometry Solver (physics layer) ----------------------------------------

/**
 * Minimal frame geometry required by the Geometry Solver.
 * Extracted from the Bike model so the physics layer never sees app data.
 *
 * Units: frameReach/frameStack in millimetres, headTubeAngle in degrees.
 */
export interface FrameGeometry {
  frameReach: Millimetres | null;
  frameStack: Millimetres | null;
  /** Degrees from horizontal. */
  headTubeAngle: number | null;
}

/** Whether the Geometry Solver produced a position for a configuration. */
export type SolverStatus = "SOLVED" | "UNSOLVED";

/** Why a configuration could not be solved. */
export type UnsolvedReason =
  | "MISSING_REQUIRED_INPUTS"
  | "MISSING_COCKPIT_INPUTS"
  | "NOT_IMPLEMENTED";

/**
 * Output of the Geometry Solver for one cockpit configuration.
 * RP3/RP4/RP5 are millimetre coordinates in the sagittal plane (Point2D).
 * RP3 is null whenever `status` is "UNSOLVED". RP4/RP5 are independently
 * conditional: a SOLVED configuration may carry a valid RP3 with null RP4/RP5
 * when the handlebar/hood inputs are unavailable, in which case those missing
 * inputs are listed in `missingInputs`.
 */
export interface SolvedConfiguration {
  configuration: CockpitConfiguration;
  frameGeometry: FrameGeometry;
  status: SolverStatus;
  unsolvedReason: UnsolvedReason | null;
  /** Names of the engineering inputs that were unavailable. */
  missingInputs: string[];
  /** RP3 — handlebar clamp centre. */
  rp3: Point2D | null;
  /** RP4 — handlebar reference point. */
  rp4: Point2D | null;
  /** RP5 — rider contact point. */
  rp5: Point2D | null;
  /** True while the solver returns placeholder coordinates. */
  isPlaceholderSolution: boolean;
}



/**
 * Objective measurement of one candidate configuration.
 *
 * Extension points (deliberately NOT implemented in this sprint):
 * - `positionRating`: banded rating for positionMetrics, to be added once
 *   engineering thresholds are defined.
 * - `overallRating`: banded rating combining position, cockpit and handling,
 *   to be added by the ranking layer once thresholds exist.
 * Neither may be invented here; no thresholds are assumed.
 */
export interface FitAssessment {
  candidateId: string;
  positionMetrics: PositionMetrics;
  cockpitPenaltyBreakdown: CockpitPenaltyBreakdown;
  handlingPenaltyBreakdown: HandlingPenaltyBreakdown;
  /** Structured observations; populated by a future sprint. */
  geometryWarnings: GeometryWarning[];
  constraintStatus: ConstraintStatus;
  notes: AssessmentNote[];
}
