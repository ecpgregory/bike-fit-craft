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

/**
 * Sprint 11C — handling normalisation (fix for defect D-11B-1).
 *
 * The handling metric is a handlebar-width error in MILLIMETRES, exactly like
 * the positional metric. Under the reciprocal normaliser its implicit length
 * scale was 1 mm, so an exact width match scored 1.0 while a 20 mm difference
 * scored 0.048 — a far steeper response than the 10 mm positional scale. With
 * 1:1:1 weights this let bar width overwhelm a materially better RP3
 * position (Sprint 11B matrix, 490/650 @ 420 mm).
 *
 * Fix: the same exponential form as position, with its own explicit scale,
 *
 *   handlingScore = exp(-widthError / HANDLING_DECAY_MM)
 *
 * `HANDLING_DECAY_MM` = 20 mm: road handlebars are manufactured and specified
 * in 20 mm width steps (360/380/400/420/440), so one decay length is exactly
 * one available size step — the smallest width difference a rider can
 * actually act on. Being one size out therefore costs the same score factor
 * (1/e) as being one positional reporting band (10 mm) out, which restores
 * the intended relationship: position error and width error are compared on
 * their own physically meaningful scales, and neither is inflated.
 *
 * Weights remain 1:1:1; only this length scale changed.
 */
export const HANDLING_DECAY_MM = 20;

export const exponentialHandlingNormalisation: NormalisationFunction = (value) => {
  const magnitude = Math.abs(value);
  if (!Number.isFinite(magnitude)) return 0;
  return Math.exp(-magnitude / HANDLING_DECAY_MM);
};

export const defaultNormalisationStrategy: NormalisationStrategy = {
  position: exponentialPositionNormalisation,
  cockpit: reciprocalNormalisation,
  handling: exponentialHandlingNormalisation,
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
  /** Normalised, pre-weight component scores. Null = unavailable. */
  normalised: ScoringInputs;
  /** Normalised scores multiplied by their weights. Null = unavailable. */
  weighted: ScoringInputs;
}

/** Pluggable combiner producing the single overall score. */
export type CombinationFunction = (
  weighted: ScoringInputs,
  weights: ScoringWeights,
) => number;

/**
 * Default: availability-aware weighted mean.
 *
 * Sprint 9.8 — only components whose metric is actually available contribute,
 * and only their weights enter the denominator. An unavailable component is
 * excluded from the mean rather than scored, so UNKNOWN can never masquerade
 * as a perfect 1.0 (the old placeholder behaviour, which created a hard 2/3
 * floor). Product weights are unchanged; the weighting behaviour is now
 * explicit. When only position is available the overall score equals the
 * normalised positional score, which preserves the Sprint 9.7 positional
 * ranking order exactly.
 */
export const weightedMeanCombination: CombinationFunction = (weighted, weights) => {
  const contributions: Array<[number | null, number]> = [
    [weighted.position, weights.positionWeight],
    [weighted.cockpit, weights.cockpitWeight],
    [weighted.handling, weights.handlingWeight],
  ];
  let total = 0;
  let totalWeight = 0;
  for (const [value, weight] of contributions) {
    if (value === null) continue;
    total += value;
    totalWeight += weight;
  }
  if (totalWeight === 0) return 0;
  return total / totalWeight;
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
   * It is an availability-aware weighted mean of the normalised position,
   * cockpit and handling components. Components whose metric is unavailable
   * are excluded from the mean entirely (Sprint 9.8) rather than counted as
   * perfect, so the old 2/3 floor no longer exists. Positional fit quality is
   * expressed by `assessment.positionMetrics` (deltaX / deltaY /
   * euclideanDistance) and by the OptimisationOutcome classification — never
   * by this number alone.

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
        cockpit:
          inputs.cockpit === null ? null : normalise.cockpit(inputs.cockpit, context),
        handling:
          inputs.handling === null ? null : normalise.handling(inputs.handling, context),
      };
      const weighted: ScoringInputs = {
        position: normalised.position * weights.positionWeight,
        cockpit:
          normalised.cockpit === null ? null : normalised.cockpit * weights.cockpitWeight,
        handling:
          normalised.handling === null
            ? null
            : normalised.handling * weights.handlingWeight,
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
