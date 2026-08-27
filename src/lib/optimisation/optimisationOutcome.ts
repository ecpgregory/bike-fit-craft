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
 * The positional error a bike must achieve before it is called a fit match.
 *
 * DESIGN DECISION (Sprint 9.7) — the domain model had no maximum positional
 * error for RP3. The values that did exist are:
 *
 *  - `defaultPositionReportingThresholds` in the Explanation Engine:
 *    excellent ≤ 5 mm, close ≤ 10 mm. These are documented as wording bands
 *    for a single measurement, explicitly "never to score it", and are far too
 *    tight to act as an acceptance envelope.
 *  - `assessFit()` in the Fit Engine: "Good Candidate" = frame reach within
 *    5 mm AND frame stack within 35 mm. 35 mm is the largest deviation the
 *    existing domain model still calls a candidate.
 *
 * `maximumPositionalError` therefore reuses the Fit Engine's 35 mm candidate
 * tolerance as the acceptance envelope for RP3 Euclidean error, rather than
 * inventing a round number. This is a product decision that should be
 * confirmed: it is the one threshold in this module and it is configurable.
 */
export interface AcceptableFitEnvelope {
  /** Maximum RP3 Euclidean error, in millimetres, still called SUCCESS. */
  maximumPositionalError: number;
}

export const defaultAcceptableFitEnvelope: AcceptableFitEnvelope = {
  maximumPositionalError: 35,
};

export function classifyOptimisationOutcome(
  result: Pick<BikeOptimisationResult, "optimisationSummary" | "bestConfiguration">,
  envelope: AcceptableFitEnvelope = defaultAcceptableFitEnvelope,
): OptimisationOutcome {
  if (result.optimisationSummary.totalConfigurations === 0) return "NO_CANDIDATES";
  const best = result.bestConfiguration;
  if (best === null) return "NO_VALID_RESULT";
  const distance = best.assessment?.positionMetrics?.euclideanDistance;
  if (typeof distance !== "number" || !Number.isFinite(distance)) return "SUCCESS";
  return distance <= envelope.maximumPositionalError ? "SUCCESS" : "OUTSIDE_FIT_ENVELOPE";
}
