import type { Bike, Millimetres } from "@/types";

/**
 * Bike Fit Engine — v1.
 *
 * Single home for all fit business logic. The UI must never inline comparison
 * maths: it loads bikes, calls `calculateFit`, and renders the result.
 *
 * Currently geometry-only (frame stack / reach). Future cockpit calculations
 * (handlebar X/Y, stem, spacers, fit confidence) are added here by extending
 * `FitInput` (optional fields) and `FitResult` (additional fields) — the public
 * API `calculateFit(input: FitInput): FitResult` does not change.
 */

export type DeltaSeverity = "close" | "moderate" | "far";

export type FitVerdict =
  | "Excellent Candidate"
  | "Good Candidate"
  | "Requires Further Analysis"
  | "Poor Candidate";

/** Frame-level comparison of two bikes. Comparison minus current, in mm. */
export interface GeometryComparison {
  stack: Millimetres | null;
  reach: Millimetres | null;
  stackSeverity: DeltaSeverity | null;
  reachSeverity: DeltaSeverity | null;
}

/** Backwards-compatible alias used by presentation components. */
export type GeometryDelta = GeometryComparison;

/** The geometry the candidate bike is measured against. */
export interface ReferenceGeometry {
  frameStack: Millimetres | null;
  frameReach: Millimetres | null;
  /** The bike the reference geometry came from, when one is known. */
  bike: Bike | null;
  /** True when the numbers came from the rider profile rather than an override bike. */
  fromRiderProfile: boolean;
}

/**
 * Everything the engine needs to produce a fit result.
 * Future sprints add optional cockpit inputs here.
 */
export interface FitInput {
  rider: RiderProfile;
  candidateBike: Bike;
  /** Optional override of the rider's current bike as the reference. */
  currentBike?: Bike | null;
}

export interface FitResult {
  rider: RiderProfile;
  /** Reference geometry used for the comparison (rider profile by default). */
  reference: ReferenceGeometry;
  currentBike: Bike | null;
  comparisonBike: Bike;
  frameReachDifference: Millimetres | null;
  frameStackDifference: Millimetres | null;
  /** Full geometry comparison including severity bands. */
  geometry: GeometryComparison;
  assessment: FitVerdict | null;
  calculatedAt: Date;
}

/** Comparison value minus current value, or null if either is missing. */
export function difference(
  current: Millimetres | null | undefined,
  comparison: Millimetres | null | undefined,
): Millimetres | null {
  if (current === null || current === undefined) return null;
  if (comparison === null || comparison === undefined) return null;
  return comparison - current;
}

/** Green ≤5 mm, amber ≤10 mm, red beyond. */
export function deltaSeverity(delta: Millimetres | null): DeltaSeverity | null {
  if (delta === null) return null;
  const magnitude = Math.abs(delta);
  if (magnitude <= 5) return "close";
  if (magnitude <= 10) return "moderate";
  return "far";
}

function compareGeometry(current: Bike, comparison: Bike): GeometryComparison {
  const stack = difference(current.frameStack, comparison.frameStack);
  const reach = difference(current.frameReach, comparison.frameReach);
  return {
    stack,
    reach,
    stackSeverity: deltaSeverity(stack),
    reachSeverity: deltaSeverity(reach),
  };
}

/**
 * TEMPORARY verdict rules — pure geometry thresholds, unchanged.
 * Will be extended by cockpit-based scoring (handlebar X/Y reachability).
 */
function assessFit(geometry: GeometryComparison): FitVerdict | null {
  if (geometry.stack === null || geometry.reach === null) return null;
  const reach = Math.abs(geometry.reach);
  const stack = Math.abs(geometry.stack);
  if (reach <= 3 && stack <= 20) return "Excellent Candidate";
  if (reach <= 5 && stack <= 35) return "Good Candidate";
  return "Requires Further Analysis";
}

/** The single public entry point of the fit engine. */
export function calculateFit(input: FitInput): FitResult {
  const { currentBike, comparisonBike } = input;
  const geometry = compareGeometry(currentBike, comparisonBike);
  return {
    currentBike,
    comparisonBike,
    frameReachDifference: geometry.reach,
    frameStackDifference: geometry.stack,
    geometry,
    assessment: assessFit(geometry),
    calculatedAt: new Date(),
  };
}

/** "+3 mm" / "-42 mm" / "—". */
export function formatDelta(delta: Millimetres | null): string {
  if (delta === null) return "—";
  const rounded = Math.round(delta * 10) / 10;
  return `${rounded > 0 ? "+" : rounded < 0 ? "" : "±"}${rounded} mm`;
}

export function bikeLabel(bike: Bike): string {
  return `${bike.brand} ${bike.model} · ${bike.size}${bike.year ? ` (${bike.year})` : ""}`;
}
