import type { Bike, RiderProfile } from "@/types";
import type { OptimisationOutcome, TargetPosition } from "@/types/optimisation";
import type { RankedConfiguration, RankingOptions } from "@/lib/rankingEngine";
import { targetFromRider } from "@/lib/errorCalculator";
import { bikes as productionBikes } from "@/data/bikes";
import {
  optimiseBike,
  type BikeOptimisationResult,
} from "./bikeOptimisationEngine";
import { classifyOptimisationOutcome } from "./optimisationOutcome";

/**
 * Fleet Optimisation Engine — orchestration only (Sprint 8B).
 *
 * Calls the existing, verified single-bike engine once per bike and collates
 * the results. It contains no geometry, scoring, ranking or outcome logic of
 * its own: scores are read from the RankedConfiguration produced by
 * optimiseBike(), and outcomes come from classifyOptimisationOutcome().
 */

export interface RankedBikeSummary {
  bikeId: string;
  outcome: "SUCCESS";
  /** Convenience mirror of `bestConfiguration.overallScore`; never recomputed. */
  overallScore: number;
  bestConfiguration: RankedConfiguration;
  /** Untouched single-bike result, including all diagnostics. */
  result: BikeOptimisationResult;
}

export interface UnrankedBikeSummary {
  bikeId: string;
  outcome: "NO_CANDIDATES" | "NO_VALID_RESULT";
  /** Existing rejection diagnostics returned by optimiseBike(). */
  rejectedConfigurations: BikeOptimisationResult["rejectedConfigurations"];
  result: BikeOptimisationResult;
}

export interface FleetOptimisationResult {
  target: TargetPosition;
  rankedBikes: RankedBikeSummary[];
  unrankedBikes: UnrankedBikeSummary[];
  totalBikes: number;
}

export interface FleetOptimisationInput {
  /** Injectable; defaults to the production dataset. */
  bikes?: Bike[];
  /** Supply either `target` or `rider`, mirroring the pipeline's rules. */
  target?: TargetPosition;
  rider?: RiderProfile;
  rankingOptions?: RankingOptions;
  /** Injectable single-bike engine, for testing only. */
  optimise?: typeof optimiseBike;
}

function resolveTarget(input: FleetOptimisationInput): TargetPosition {
  if (input.target) return input.target;
  if (input.rider) return targetFromRider(input.rider);
  throw new Error("FleetOptimisationInput requires either `target` or `rider`.");
}

export function optimiseFleet(input: FleetOptimisationInput): FleetOptimisationResult {
  const bikes = input.bikes ?? productionBikes;
  const target = resolveTarget(input);
  const optimise = input.optimise ?? optimiseBike;

  const rankedBikes: RankedBikeSummary[] = [];
  const unrankedBikes: UnrankedBikeSummary[] = [];

  for (const bike of bikes) {
    const result = optimise({
      bike,
      rider: input.rider!,
      target: input.target,
      rankingOptions: input.rankingOptions,
    });

    const outcome: OptimisationOutcome = classifyOptimisationOutcome(result);

    if (outcome === "SUCCESS" && result.bestConfiguration !== null) {
      rankedBikes.push({
        bikeId: result.bikeId,
        outcome: "SUCCESS",
        overallScore: result.bestConfiguration.overallScore,
        bestConfiguration: result.bestConfiguration,
        result,
      });
      continue;
    }

    unrankedBikes.push({
      bikeId: result.bikeId,
      outcome: outcome === "NO_CANDIDATES" ? "NO_CANDIDATES" : "NO_VALID_RESULT",
      rejectedConfigurations: result.rejectedConfigurations,
      result,
    });
  }

  // Existing scores only; no fleet-specific scoring.
  rankedBikes.sort((a, b) => b.overallScore - a.overallScore);

  return {
    target,
    rankedBikes,
    unrankedBikes,
    totalBikes: bikes.length,
  };
}
