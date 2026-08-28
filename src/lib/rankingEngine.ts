import type { AssessmentNote, FitAssessment } from "@/types/optimisation";
import { defaultPositionReportingThresholds } from "@/lib/explanationEngine";

/**
 * Ranking layer — all subjective judgement lives here.
 *
 * Consumes FitAssessment objects produced by the Error Calculator and turns
 * measurements into scores. Every stage is a pluggable function so the
 * mathematical model can change without refactoring the pipeline.
 *
 * Pipeline: transform → normalise → weight → combine.
 */

// --- Stage 1: transformation -------------------------------------------------

/**
 * Raw measurements reduced to the components that will be scored.
 *
 * Sprint 9.8: `cockpit` and `handling` are `null` when the underlying metric
 * is unavailable. Null means UNKNOWN and is excluded from scoring entirely —
 * it must never be coerced to 0 (which would score as a perfect component).
 */
export interface ScoringInputs {
  position: number;
  cockpit: number | null;
  handling: number | null;
}

/** Pluggable transformation from an assessment to scoring inputs. */
export type TransformationFunction = (assessment: FitAssessment) => ScoringInputs;

/**
 * Default transformation: Euclidean distance for position, and the
 * availability-aware cockpit/handling metrics produced by the Error
 * Calculator. Alternative metrics are supplied by passing a different
 * TransformationFunction — never by editing this one.
 */
export const euclideanTransformation: TransformationFunction = (assessment) => ({
  position: assessment.positionMetrics.euclideanDistance,
  cockpit: assessment.cockpitMetric.available ? assessment.cockpitMetric.value : null,
  handling: assessment.handlingMetric.available ? assessment.handlingMetric.value : null,
});


// --- Stage 2: normalisation --------------------------------------------------

/** Context available to a normaliser, e.g. for cohort-relative scaling. */
export interface NormalisationContext {
  /** Every scoring input in the current ranking run, in input order. */
  cohort: ScoringInputs[];
}

/** Pluggable per-component normaliser. Higher output = better. */
export type NormalisationFunction = (
  value: number,
  context: NormalisationContext,
) => number;

export interface NormalisationStrategy {
  position: NormalisationFunction;
  cockpit: NormalisationFunction;
  handling: NormalisationFunction;
}

/**
 * Bounded reciprocal, 1 / (1 + value). Non-linear by design so no
 * linear-scaling assumption is baked into the architecture. Returns 1 for a
 * perfect (zero) value and approaches 0 as error grows.
 *
 * Retained as the default for the (currently placeholder, always-zero) cockpit
 * and handling components, which are unitless counts rather than millimetres.
 */
export const reciprocalNormalisation: NormalisationFunction = (value) => {
  const magnitude = Math.abs(value);
  if (!Number.isFinite(magnitude)) return 0;
  return 1 / (1 + magnitude);
};

/**
 * Sprint 9.7 — positional normalisation.
 *
 * The reciprocal normaliser has an implicit length scale of 1 mm, so every
 * physically plausible RP3 error (5–80 mm) collapses into the bottom few
 * percent of its range: 1/(1+7.6) = 0.116 and 1/(1+76.5) = 0.013. Combined
 * with the two constant placeholder components this produced the observed
 * 0.671–0.705 compression.
 *
 * Replacement: exponential decay with an explicit millimetre length scale,
 *
 *   positionScore = exp(-distance / POSITION_DECAY_MM)
 *
 * `POSITION_DECAY_MM` reuses the existing documented outer positional
 * reporting band (`defaultPositionReportingThresholds.closeDistance`, 10 mm)
 * as its length scale rather than introducing a new tuning constant. The
 * function is strictly monotonic decreasing in distance, so ranking order and
 * configuration selection are mathematically identical to the reciprocal.
 */
export const POSITION_DECAY_MM = defaultPositionReportingThresholds.closeDistance;

export const exponentialPositionNormalisation: NormalisationFunction = (value) => {
  const magnitude = Math.abs(value);
  if (!Number.isFinite(magnitude)) return 0;
  return Math.exp(-magnitude / POSITION_DECAY_MM);
};

export const defaultNormalisationStrategy: NormalisationStrategy = {
  position: exponentialPositionNormalisation,
  cockpit: reciprocalNormalisation,
  handling: reciprocalNormalisation,
};

// --- Stage 3: weighting ------------------------------------------------------

export interface ScoringWeights {
  positionWeight: number;
  cockpitWeight: number;
  handlingWeight: number;
}

export const defaultScoringWeights: ScoringWeights = {
  positionWeight: 1,
  cockpitWeight: 1,
  handlingWeight: 1,
};

// --- Stage 4: combination ----------------------------------------------------

export interface ComponentScores {
  /** Normalised, pre-weight component scores. */
  normalised: ScoringInputs;
  /** Normalised scores multiplied by their weights. */
  weighted: ScoringInputs;
}

/** Pluggable combiner producing the single overall score. */
export type CombinationFunction = (
  weighted: ScoringInputs,
  weights: ScoringWeights,
) => number;

/** Default: weighted mean, so overallScore stays comparable across weightings. */
export const weightedMeanCombination: CombinationFunction = (weighted, weights) => {
  const totalWeight =
    weights.positionWeight + weights.cockpitWeight + weights.handlingWeight;
  if (totalWeight === 0) return 0;
  return (weighted.position + weighted.cockpit + weighted.handling) / totalWeight;
};

// --- Results -----------------------------------------------------------------

export interface RankedConfiguration {
  candidateId: string;
  assessment: FitAssessment;
  scoringInputs: ScoringInputs;
  componentScores: ComponentScores;
  /**
   * Ranking metric only — NOT a human-facing measure of fit quality.
   *
   * It is a weighted mean of normalised position, cockpit and handling
   * components; the cockpit and handling components are placeholders fixed at
   * zero penalty (normalised 1.0), so overallScore currently has a hard floor
   * of 2/3. Positional fit quality is expressed by
   * `assessment.positionMetrics` (deltaX / deltaY / euclideanDistance) and by
   * the OptimisationOutcome classification — never by this number alone.
   *
   * Numerical only. Rating bands are deliberately not implemented.
   *
   * Extension point: `positionRating` and `overallRating` bands will be added
   * here once engineering thresholds are defined. No thresholds are assumed.
   */
  overallScore: number;
}

export interface RejectedConfiguration {
  candidateId: string;
  assessment: FitAssessment;
  /** Structured reasons; never discarded silently. */
  rejectionReasons: AssessmentNote[];
}

export interface RankingResult {
  /** Ranked best first by overallScore, ties broken by candidateId. */
  rankedConfigurations: RankedConfiguration[];
  invalidConfigurations: RejectedConfiguration[];
  weights: ScoringWeights;
  rankedAt: Date;
}

export interface RankingOptions {
  weights?: Partial<ScoringWeights>;
  transformation?: TransformationFunction;
  normalisation?: Partial<NormalisationStrategy>;
  combination?: CombinationFunction;
}

export interface RankingInput {
  validConfigurations: FitAssessment[];
  invalidConfigurations: FitAssessment[];
  options?: RankingOptions;
}

const CONSTRAINT_REJECTION: AssessmentNote = {
  code: "CONSTRAINT_INVALID",
  severity: "error",
  message: "Configuration was reported INVALID by the evaluation layer.",
};

function rejectionReasons(assessment: FitAssessment): AssessmentNote[] {
  return assessment.notes.length > 0 ? assessment.notes : [CONSTRAINT_REJECTION];
}

/** The single public entry point of the ranking layer. */
export function rankConfigurations(input: RankingInput): RankingResult {
  const { validConfigurations, invalidConfigurations, options } = input;

  const weights: ScoringWeights = { ...defaultScoringWeights, ...options?.weights };
  const transform = options?.transformation ?? euclideanTransformation;
  const normalise: NormalisationStrategy = {
    ...defaultNormalisationStrategy,
    ...options?.normalisation,
  };
  const combine = options?.combination ?? weightedMeanCombination;

  const scoringInputs = validConfigurations.map(transform);
  const context: NormalisationContext = { cohort: scoringInputs };

  const rankedConfigurations: RankedConfiguration[] = validConfigurations
    .map((assessment, index) => {
      const inputs = scoringInputs[index]!;
      const normalised: ScoringInputs = {
        position: normalise.position(inputs.position, context),
        cockpit: normalise.cockpit(inputs.cockpit, context),
        handling: normalise.handling(inputs.handling, context),
      };
      const weighted: ScoringInputs = {
        position: normalised.position * weights.positionWeight,
        cockpit: normalised.cockpit * weights.cockpitWeight,
        handling: normalised.handling * weights.handlingWeight,
      };
      return {
        candidateId: assessment.candidateId,
        assessment,
        scoringInputs: inputs,
        componentScores: { normalised, weighted },
        overallScore: combine(weighted, weights),
      };
    })
    .sort(
      (a, b) =>
        b.overallScore - a.overallScore || a.candidateId.localeCompare(b.candidateId),
    );

  return {
    rankedConfigurations,
    invalidConfigurations: invalidConfigurations.map((assessment) => ({
      candidateId: assessment.candidateId,
      assessment,
      rejectionReasons: rejectionReasons(assessment),
    })),
    weights,
    rankedAt: new Date(),
  };
}
