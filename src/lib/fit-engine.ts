import type { Bike, Millimetres } from "@/types";

/**
 * Bike Fit Engine — v1.
 *
 * Pure, reusable comparison utilities. Deliberately geometry-only: no cockpit
 * (stem / spacer / handlebar) maths yet. These functions are the seam where the
 * real cockpit calculations will be plugged in later, so UI code must never
 * inline comparison logic.
 */

export type DeltaSeverity = "close" | "moderate" | "far";

export type FitVerdict =
  | "Excellent Candidate"
  | "Good Candidate"
  | "Requires Further Analysis"
  | "Poor Candidate";

export interface GeometryDelta {
  /** Comparison minus current, in mm. Null when either value is unknown. */
  stack: Millimetres | null;
  reach: Millimetres | null;
  stackSeverity: DeltaSeverity | null;
  reachSeverity: DeltaSeverity | null;
}

export interface BikeComparison {
  current: Bike;
  comparison: Bike;
  delta: GeometryDelta;
  verdict: FitVerdict | null;
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

export function geometryDelta(current: Bike, comparison: Bike): GeometryDelta {
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
 * TEMPORARY verdict rules — pure geometry thresholds.
 * Will be replaced by cockpit-based scoring (handlebar X/Y reachability).
 */
export function assessFit(delta: GeometryDelta): FitVerdict | null {
  if (delta.stack === null || delta.reach === null) return null;
  const reach = Math.abs(delta.reach);
  const stack = Math.abs(delta.stack);
  if (reach <= 3 && stack <= 20) return "Excellent Candidate";
  if (reach <= 5 && stack <= 35) return "Good Candidate";
  return "Requires Further Analysis";
}

export function compareBikes(current: Bike, comparison: Bike): BikeComparison {
  const delta = geometryDelta(current, comparison);
  return { current, comparison, delta, verdict: assessFit(delta) };
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
