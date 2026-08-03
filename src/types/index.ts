/**
 * Core domain entities for Bike Fit Finder.
 *
 * These interfaces are the single source of truth for the app and are shaped so
 * they can map directly onto future database tables (one row per object).
 * No geometry values are hardcoded in React components.
 */

/** Millimetres. */
export type Millimetres = number;

export type BikeType = "Race" | "Endurance" | "All-Road" | "Gravel" | "Time Trial";

export type FitConfidence = "high" | "medium" | "low";

/** A single rider's professional fit coordinates and preferences. */
export interface RiderProfile {
  id: string;
  name: string;
  /** Free-text description of the bike currently ridden, e.g. "Giant Defy Advanced 1 (2014)". */
  currentBike: string;
  handlebarX: Millimetres;
  handlebarY: Millimetres;
  frameReach: Millimetres;
  frameStack: Millimetres;
  stemLength: Millimetres;
  spacerHeight: Millimetres;
  saddleHeight: Millimetres;
  saddleSetback: Millimetres;
  preferredBikeType: BikeType | null;
  /** Preferred tyre width in millimetres. */
  preferredTyreWidth: Millimetres | null;
  /** Budget ceiling in the user's currency. */
  budget: number | null;

  // --- Cockpit preferences (optional; used by future cockpit calculations) ---
  preferredStemLength?: Millimetres | null;
  /** Degrees. */
  preferredStemAngle?: number | null;
  preferredHandlebarReach?: Millimetres | null;
  preferredHandlebarStack?: Millimetres | null;
  preferredCrankLength?: Millimetres | null;
}

/** One row = ONE bike size. */
export interface Bike {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  size: string;
  frameStack: Millimetres | null;
  frameReach: Millimetres | null;
  headTube: Millimetres | null;
  wheelbase: Millimetres | null;
  frontCentre: Millimetres | null;
  chainstay: Millimetres | null;
  bbDrop: Millimetres | null;
  tyreClearance: Millimetres | null;
  integratedCockpit: boolean | null;
  notes: string;

  // --- Advanced / cockpit geometry (optional; not used in calculations yet) ---
  /** Degrees. */
  headTubeAngle?: number | null;
  /** Degrees. */
  seatTubeAngle?: number | null;
  forkOffset?: Millimetres | null;
  stockStemLength?: Millimetres | null;
  /** Degrees. */
  stockStemAngle?: number | null;
  stockHandlebarReach?: Millimetres | null;
  stockHandlebarStack?: Millimetres | null;
  stockSpacerHeight?: Millimetres | null;
  headsetTopCapHeight?: Millimetres | null;
  stockCrankLength?: Millimetres | null;
  maxSpacerHeight?: Millimetres | null;
  minimumStemLength?: Millimetres | null;
  maximumStemLength?: Millimetres | null;
  cockpitModel?: string | null;
}


/** Result of evaluating one bike size against a rider profile. */
export interface FitResult {
  id: string;
  /** The evaluated bike size. */
  bike: Bike;
  size: string;
  estimatedHandlebarX: Millimetres | null;
  estimatedHandlebarY: Millimetres | null;
  /** Estimated handlebar X minus the rider's target X. */
  xError: Millimetres | null;
  /** Estimated handlebar Y minus the rider's target Y. */
  yError: Millimetres | null;
  stemRequired: Millimetres | null;
  spacerRequired: Millimetres | null;
  fitConfidence: FitConfidence | null;
  notes: string;
}

// --- Optimisation framework (constraints, cockpit configurations) ---
export type {
  BikeFitConstraints,
  CockpitOption,
  CockpitConfiguration,
  FitCandidate,
  OptimisationResult,
  Severity,
  AssessmentNote,
  GeometryWarning,
  GeometryWarningCode,
  PositionMetrics,
  CockpitPenaltyBreakdown,
  HandlingPenaltyBreakdown,
  ConstraintStatus,
  Point2D,
  PredictedPosition,
  TargetPosition,
  FitAssessment as CandidateFitAssessment,
} from "./optimisation";

