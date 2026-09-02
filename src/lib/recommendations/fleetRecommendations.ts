import type { Bike } from "@/types";
import type {
  CockpitConfiguration,
  GeometryWarning,
  Point2D,
  PositionMetrics,
  TargetPosition,
} from "@/types/optimisation";
import type { RecommendationExplanation } from "@/lib/explanationEngine";
import type {
  FleetOptimisationResult,
  RankedBikeSummary,
  UnrankedBikeSummary,
} from "@/lib/optimisation/fleetOptimisationEngine";

/**
 * Presentation adapter — read-only.
 *
 * Turns a FleetOptimisationResult into view models the rider-facing UI can
 * render. It performs no optimisation, scoring, ranking, filtering or sorting:
 * every value here is read straight out of the production result, and bikes
 * are resolved by bikeId against the same dataset the engine used.
 */

export interface RecommendedBikeView {
  /** 1-based position in the order supplied by the engine. */
  rank: number;
  bikeId: string;
  bike: Bike | null;
  /** Engine classification: SUCCESS or OUTSIDE_FIT_ENVELOPE. Read, not derived. */
  outcome: RankedBikeSummary["outcome"];
  /** Mirror of bestConfiguration.overallScore; never recalculated. */
  overallScore: number;
  candidateId: string;
  positionMetrics: PositionMetrics;
  /** Solved RP3 for the recommended configuration, when available. */
  predictedPosition: Point2D | null;
  configuration: CockpitConfiguration | null;
  explanation: RecommendationExplanation | null;
  geometryWarnings: GeometryWarning[];
  /** Mirror of the assessment's availability-aware cockpit (RP5) metric. */
  cockpitMetric: PenaltyMetric;
  /** Mirror of the assessment's availability-aware handling metric. */
  handlingMetric: PenaltyMetric;
  /** Verified handlebar width of the recommended configuration; never inferred. */
  handlebarWidth: number | null;
}

export interface UnavailableBikeView {
  bikeId: string;
  bike: Bike | null;
  outcome: UnrankedBikeSummary["outcome"];
  /** Distinct diagnostic messages already produced by the engine. */
  diagnostics: string[];
  totalConfigurations: number;
}

export interface FleetRecommendationsView {
  target: TargetPosition;
  recommendations: RecommendedBikeView[];
  unavailable: UnavailableBikeView[];
  totalBikes: number;
}

function findBike(bikes: Bike[], bikeId: string): Bike | null {
  return bikes.find((bike) => bike.id === bikeId) ?? null;
}

function solvedFor(summary: RankedBikeSummary, candidateId: string) {
  return (
    summary.result.solvedConfigurations?.find(
      (solved) => solved.configuration.id === candidateId,
    ) ?? null
  );
}

function toRecommendation(
  summary: RankedBikeSummary,
  index: number,
  bikes: Bike[],
): RecommendedBikeView {
  const best = summary.bestConfiguration;
  const solved = solvedFor(summary, best.candidateId);
  return {
    rank: index + 1,
    bikeId: summary.bikeId,
    bike: findBike(bikes, summary.bikeId),
    outcome: summary.outcome,
    overallScore: best.overallScore,
    candidateId: best.candidateId,
    positionMetrics: best.assessment.positionMetrics,
    predictedPosition: solved?.rp3 ?? null,
    configuration: solved?.configuration ?? null,
    explanation: summary.result.explanations[best.candidateId] ?? null,
    geometryWarnings: best.assessment.geometryWarnings,
  };
}

function toUnavailable(summary: UnrankedBikeSummary, bikes: Bike[]): UnavailableBikeView {
  const diagnostics = new Set<string>();
  for (const rejected of summary.rejectedConfigurations) {
    for (const reason of rejected.rejectionReasons) diagnostics.add(reason.message);
  }
  return {
    bikeId: summary.bikeId,
    bike: findBike(bikes, summary.bikeId),
    outcome: summary.outcome,
    diagnostics: [...diagnostics],
    totalConfigurations: summary.result.optimisationSummary.totalConfigurations,
  };
}

/** Adapts a fleet result for rendering. Order is preserved exactly. */
export function buildFleetRecommendations(
  result: FleetOptimisationResult,
  bikes: Bike[],
): FleetRecommendationsView {
  return {
    target: result.target,
    recommendations: result.rankedBikes.map((summary, index) =>
      toRecommendation(summary, index, bikes),
    ),
    unavailable: result.unrankedBikes.map((summary) => toUnavailable(summary, bikes)),
    totalBikes: result.totalBikes,
  };
}

/** "Specialized Tarmac SL8 · 54 (2025)" or the raw id when unresolved. */
export function bikeDisplayName(bike: Bike | null, bikeId: string): string {
  if (!bike) return bikeId;
  return `${bike.brand} ${bike.model}`;
}

export function bikeSizeLabel(bike: Bike | null): string | null {
  if (!bike) return null;
  return bike.year ? `Size ${bike.size} · ${bike.year}` : `Size ${bike.size}`;
}

/** Rider-readable summary of a configuration, e.g. "100 mm stem, −6°, 41.6 mm spacers". */
export function configurationSummary(
  configuration: CockpitConfiguration | null,
): string | null {
  if (!configuration) return null;
  const parts: string[] = [];
  if (configuration.stemLength !== null) parts.push(`${configuration.stemLength} mm stem`);
  if (configuration.stemAngle !== null)
    parts.push(`${configuration.stemAngle}° stem angle`);
  parts.push(`${round(configuration.spacerHeight)} mm spacers`);
  return parts.join(", ");
}

export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** "+5 mm" / "−28 mm" / "0 mm". */
export function formatSignedMm(value: number): string {
  const rounded = round(value);
  if (rounded === 0) return "0 mm";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded)} mm`;
}
