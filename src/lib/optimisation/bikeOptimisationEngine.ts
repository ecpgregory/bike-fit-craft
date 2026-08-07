import type { Bike, RiderProfile } from "@/types";
import type {
  AssessmentNote,
  BikeFitConstraints,
  CockpitConfiguration,
  SolvedConfiguration,
  UnsolvedReason,
} from "@/types/optimisation";
import type { RecommendationExplanation } from "@/lib/explanationEngine";
import type {
  RankedConfiguration,
  RankingOptions,
  RejectedConfiguration,
} from "@/lib/rankingEngine";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { frameGeometryFromBike } from "./frameGeometry";
import { runOptimisationPipeline } from "./pipeline";

/**
 * Bike Optimisation Engine — orchestration only.
 *
 * Evaluates every legal cockpit configuration for ONE bike by coordinating the
 * existing pipeline stages:
 *
 *   Bike → Constraint Generator → Geometry Solver → Error Calculator
 *        → Ranking Engine → Explanation Engine → BikeOptimisationResult
 *
 * This module contains no geometry, scoring or explanation logic. It never
 * recalculates a configuration: the pipeline runs exactly once per bike and
 * every configuration is processed exactly once. Behaviour is deterministic.
 */

/** Stage at which a configuration left the pipeline. */
export type RejectionStage = "GEOMETRY_SOLVER" | "CONSTRAINT_EVALUATION";

/**
 * A configuration that was not ranked. Structurally a superset of the ranking
 * layer's RejectedConfiguration: `assessment` is null when the Geometry Solver
 * could not solve the configuration, so no assessment could ever exist.
 */
export interface BikeRejectedConfiguration
  extends Omit<RejectedConfiguration, "assessment"> {
  assessment: RejectedConfiguration["assessment"] | null;
  configuration: CockpitConfiguration;
  stage: RejectionStage;
  /** Populated when the rejection came from the Geometry Solver. */
  solved: SolvedConfiguration | null;
  unsolvedReason: UnsolvedReason | null;
}

export interface BikeOptimisationResult {
  bikeId: string;
  /** Null only when no configuration could be ranked. */
  bestConfiguration: RankedConfiguration | null;
  /** Every ranked configuration, best first. Nothing is discarded. */
  evaluatedConfigurations: RankedConfiguration[];
  rejectedConfigurations: BikeRejectedConfiguration[];
  optimisationSummary: {
    totalConfigurations: number;
    solvedConfigurations: number;
    rejectedConfigurations: number;
  };
  /** Explanations keyed by candidateId, produced by the Explanation Engine. */
  explanations: Record<string, RecommendationExplanation>;
}

export interface BikeOptimisationInput {
  bike: Bike;
  rider: RiderProfile;
  /** Optional override; defaults to constraints derived from the bike. */
  constraints?: BikeFitConstraints;
  rankingOptions?: RankingOptions;
  /**
   * Pipeline implementation, injectable for testing. Defaults to the real
   * optimisation pipeline; the engine never contains engineering logic itself.
   */
  runPipeline?: typeof runOptimisationPipeline;
}

const SOLVER_REJECTION: AssessmentNote = {
  code: "GEOMETRY_UNSOLVED",
  severity: "error",
  message: "Geometry Solver could not solve this configuration.",
};

function solverRejectionReasons(
  reason: UnsolvedReason | null,
  missingInputs: string[],
): AssessmentNote[] {
  const notes: AssessmentNote[] = [
    { ...SOLVER_REJECTION, message: `${SOLVER_REJECTION.message} Reason: ${reason ?? "UNKNOWN"}.` },
  ];
  if (missingInputs.length > 0) {
    notes.push({
      code: "MISSING_ENGINEERING_INPUTS",
      severity: "error",
      message: `Missing engineering inputs: ${missingInputs.join(", ")}.`,
    });
  }
  return notes;
}

/** Optimises one bike against one rider profile. Single public entry point. */
export function optimiseBike(input: BikeOptimisationInput): BikeOptimisationResult {
  const { bike, rider } = input;

  const constraints = input.constraints ?? deriveConstraintsFromBike(bike);
  const frameGeometry = frameGeometryFromBike(bike);

  const runPipeline = input.runPipeline ?? runOptimisationPipeline;

  const pipeline = runPipeline({
    constraints,
    frameGeometry,
    rider,
    rankingOptions: input.rankingOptions,
  });

  // Ranked configurations are already sorted best-first by the Ranking Engine.
  const evaluatedConfigurations = pipeline.ranking.rankedConfigurations;

  const rejectedConfigurations: BikeRejectedConfiguration[] = [
    ...pipeline.unsolvedConfigurations.map((candidate) => ({
      candidateId: candidate.candidateId,
      configuration: candidate.configuration,
      assessment: null,
      rejectionReasons: solverRejectionReasons(candidate.reason, candidate.missingInputs),
      stage: "GEOMETRY_SOLVER" as const,
      solved: candidate.solved,
      unsolvedReason: candidate.reason,
    })),
    ...pipeline.ranking.invalidConfigurations.map((rejected) => {
      const solved = pipeline.solvedConfigurations.find(
        (s) => s.configuration.id === rejected.candidateId,
      );
      return {
        candidateId: rejected.candidateId,
        configuration: solved!.configuration,
        assessment: rejected.assessment,
        rejectionReasons: rejected.rejectionReasons,
        stage: "CONSTRAINT_EVALUATION" as const,
        solved: solved ?? null,
        unsolvedReason: null,
      };
    }),
  ];

  const explanations: Record<string, RecommendationExplanation> = {};
  for (const explanation of pipeline.explanations) {
    explanations[explanation.candidateId] = explanation;
  }

  return {
    bikeId: bike.id,
    bestConfiguration: evaluatedConfigurations[0] ?? null,
    evaluatedConfigurations,
    rejectedConfigurations,
    optimisationSummary: {
      totalConfigurations: pipeline.configurations.length,
      solvedConfigurations: pipeline.solvedConfigurations.filter(
        (s) => s.status === "SOLVED",
      ).length,
      rejectedConfigurations: rejectedConfigurations.length,
    },
    explanations,
  };
}
