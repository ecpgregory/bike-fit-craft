import type { OptimisationOutcome } from "@/types/optimisation";
import type { BikeOptimisationResult } from "./bikeOptimisationEngine";

/**
 * Pure classifier for the high-level optimisation outcome.
 *
 * It stores nothing and derives everything from the existing optimisation
 * result: `optimisationSummary.totalConfigurations` (how many candidate
 * configurations the Constraint Generator produced), `bestConfiguration`
 * (whether any candidate survived the pipeline to become a ranked result) and
 * the already-calculated RP3 positional error of that best configuration.
 *
 * Detailed solver and rejection diagnostics are untouched and remain the
 * explanation for WHY a run produced NO_VALID_RESULT.
 */

/**
 * The RP3 acceptance envelope: how far the best achievable handlebar clamp
 * position may sit from the rider's target before the bike stops being called
 * a viable fit.
 *
 * PRODUCT DECISION (Sprint 12A.4/12A.5) — the envelope is axis-separated, not
 * Euclidean: ±5 mm horizontally (X, fore/aft) and ±20 mm vertically (Y).
 * Vertical position is more readily adjusted (spacers, stem angle) than
 * fore/aft, so the two axes carry different tolerances.
 *
 * This is the Bike Fit Finder product tolerance for rider-target RP3 position.
 * It is not a universal biomechanical standard, and it is deliberately NOT
 * derived from the historical frame-comparison rules in `fitEngine.ts`, which
 * compare two frames rather than a rider target.
 *
 * The envelope affects classification only. Scoring, ranking and the selected
 * configuration are unaffected by it.
 */
export interface AcceptableFitEnvelope {
  /** Maximum |RP3 deltaX| (mm, fore/aft) still called SUCCESS. */
  maximumHorizontalError: number;
  /** Maximum |RP3 deltaY| (mm, vertical) still called SUCCESS. */
  maximumVerticalError: number;
}

export const defaultAcceptableFitEnvelope: AcceptableFitEnvelope = {
  maximumHorizontalError: 5,
  maximumVerticalError: 20,
};

export function classifyOptimisationOutcome(
  result: Pick<BikeOptimisationResult, "optimisationSummary" | "bestConfiguration">,
  envelope: AcceptableFitEnvelope = defaultAcceptableFitEnvelope,
): OptimisationOutcome {
  if (result.optimisationSummary.totalConfigurations === 0) return "NO_CANDIDATES";
  const best = result.bestConfiguration;
  if (best === null) return "NO_VALID_RESULT";
  const metrics = best.assessment?.positionMetrics;
  const deltaX = metrics?.deltaX;
  const deltaY = metrics?.deltaY;
  // Missing or non-finite deltas: no evidence to reject a valid ranked result.
  if (
    typeof deltaX !== "number" ||
    !Number.isFinite(deltaX) ||
    typeof deltaY !== "number" ||
    !Number.isFinite(deltaY)
  ) {
    return "SUCCESS";
  }
  return Math.abs(deltaX) <= envelope.maximumHorizontalError &&
    Math.abs(deltaY) <= envelope.maximumVerticalError
    ? "SUCCESS"
    : "OUTSIDE_FIT_ENVELOPE";
}

