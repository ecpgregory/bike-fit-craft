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
  | "MANUFACTURER_LIMITATION";

/**
 * An observation only — never a judgement, score or recommendation.
 * No logic populates these yet; this is the shared domain model.
 */
export interface GeometryWarning {
  code: GeometryWarningCode | string;
  severity: Severity;
  message: string;
  /** Objective values supporting the observation, when available. */
  measurements?: Record<string, number | string>;
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
