import type { RiderProfile } from "@/types";
import type {
  BikeFitConstraints,
  CockpitConfiguration,
  FitAssessment,
  FrameGeometry,
  SolvedConfiguration,
  TargetPosition,
  UnsolvedReason,
} from "@/types/optimisation";
import { generateLegalConfigurations } from "@/lib/constraintGenerator";
import { assessSolvedConfiguration, targetFromRider } from "@/lib/errorCalculator";
import { explainRanking, type RecommendationExplanation } from "@/lib/explanationEngine";
import {
  rankConfigurations,
  type RankingOptions,
  type RankingResult,
} from "@/lib/rankingEngine";
import { solveConfiguration } from "./geometrySolver";

/**
 * Optimisation pipeline orchestration.
 *
 * Data flow (each stage has exactly one responsibility):
 *
 *   BikeFitConstraints
 *     → Constraint Generator   → CockpitConfiguration[]
 *     → Geometry Solver        → SolvedConfiguration[]      (RP3 → RP4 → RP5)
 *     → Error Calculator       → FitAssessment[]            (RP5 vs rider target)
 *     → Ranking Engine         → RankingResult
 *     → Explanation Engine     → RecommendationExplanation[]
 *
 * This module wires the stages together and performs no geometry, scoring or
 * explanation logic of its own.
 */

/** A configuration the Geometry Solver could not solve. Never silently dropped. */
export interface UnsolvedCandidate {
  candidateId: string;
  configuration: CockpitConfiguration;
  solved: SolvedConfiguration;
  reason: UnsolvedReason;
  /** Engineering inputs that were unavailable. */
  missingInputs: string[];
}

export interface PipelineInput {
  constraints: BikeFitConstraints;
  frameGeometry: FrameGeometry;
  /** Rider contact-point target; supply either this or `rider`. */
  target?: TargetPosition;
  rider?: RiderProfile;
  rankingOptions?: RankingOptions;
}

export interface PipelineResult {
  configurations: CockpitConfiguration[];
  solvedConfigurations: SolvedConfiguration[];
  assessments: FitAssessment[];
  /** Retained for debugging and future diagnostics; excluded from ranking. */
  unsolvedConfigurations: UnsolvedCandidate[];
  ranking: RankingResult;
  explanations: RecommendationExplanation[];
}

/** Candidate identifier used consistently across every downstream stage. */
export function candidateIdFor(configuration: CockpitConfiguration): string {
  return configuration.id;
}

function resolveTarget(input: PipelineInput): TargetPosition {
  if (input.target) return input.target;
  if (input.rider) return targetFromRider(input.rider);
  throw new Error("PipelineInput requires either `target` or `rider`.");
}

/** Runs the full optimisation pipeline for one bike size. */
export function runOptimisationPipeline(input: PipelineInput): PipelineResult {
  const target = resolveTarget(input);

  // 1. Constraint Generator — legal cockpit configurations only.
  const configurations = generateLegalConfigurations(input.constraints);

  // 2. Geometry Solver — real RP3 → RP4 → RP5 geometry, or UNSOLVED.
  const solvedConfigurations = configurations.map((configuration) =>
    solveConfiguration(configuration, input.frameGeometry),
  );

  // 3. Error Calculator — solved RP5 measured against the rider target.
  const assessments: FitAssessment[] = [];
  const unsolvedConfigurations: UnsolvedCandidate[] = [];

  for (const solved of solvedConfigurations) {
    const candidateId = candidateIdFor(solved.configuration);
    const assessment = assessSolvedConfiguration({
      candidateId,
      solved,
      target,
      isConstraintValid: true,
    });

    if (assessment === null) {
      unsolvedConfigurations.push({
        candidateId,
        configuration: solved.configuration,
        solved,
        reason: solved.unsolvedReason ?? "NOT_IMPLEMENTED",
        missingInputs: solved.missingInputs,
      });
      continue;
    }

    assessments.push(assessment);
  }

  // 4. Ranking Engine — unchanged scoring behaviour.
  const ranking = rankConfigurations({
    validConfigurations: assessments.filter((a) => a.constraintStatus === "VALID"),
    invalidConfigurations: assessments.filter((a) => a.constraintStatus === "INVALID"),
    options: input.rankingOptions,
  });

  // 5. Explanation Engine — evidence drawn from the assessments above.
  const explanations = explainRanking(ranking);

  return {
    configurations,
    solvedConfigurations,
    assessments,
    unsolvedConfigurations,
    ranking,
    explanations,
  };
}
