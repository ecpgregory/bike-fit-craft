import type { OptimisationOutcome } from "@/types/optimisation";
import type { BikeOptimisationResult } from "./bikeOptimisationEngine";

/**
 * Pure classifier for the high-level optimisation outcome.
 *
 * It stores nothing and derives everything from the existing optimisation
 * result: `optimisationSummary.totalConfigurations` (how many candidate
 * configurations the Constraint Generator produced) and `bestConfiguration`
 * (whether any candidate survived the pipeline to become a ranked result).
 *
 * Detailed solver and rejection diagnostics are untouched and remain the
 * explanation for WHY a run produced NO_VALID_RESULT.
 */
export function classifyOptimisationOutcome(
  result: Pick<BikeOptimisationResult, "optimisationSummary" | "bestConfiguration">,
): OptimisationOutcome {
  if (result.optimisationSummary.totalConfigurations === 0) return "NO_CANDIDATES";
  return result.bestConfiguration === null ? "NO_VALID_RESULT" : "SUCCESS";
}
