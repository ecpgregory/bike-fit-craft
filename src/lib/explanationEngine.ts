import type {
  CockpitPenaltyBreakdown,
  FitAssessment,
  HandlingPenaltyBreakdown,
  PositionMetrics,
} from "./errorCalculator";
import type { RankedConfiguration, RankingResult } from "./rankingEngine";

/**
 * Explanation layer — evidence only.
 *
 * Every statement produced here must be traceable to a measurement
 * (PositionMetrics), an explicit penalty component (CockpitPenaltyBreakdown,
 * HandlingPenaltyBreakdown) or ConstraintStatus. The Overall Score may be
 * reported as context (e.g. rank position) but must never on its own be the
 * evidence for a claim.
 *
 * This module reads from the evaluation and ranking layers; it does not modify
 * the geometry solver, error calculator or ranking engine.
 */

// --- Output ------------------------------------------------------------------

export type ExplanationSeverity = "info" | "caution" | "blocking";

/** A single evidence-backed statement. */
export interface ExplanationStatement {
  /** Stable machine code, e.g. POSITION_MATCH_EXCELLENT. */
  code: string;
  /** Concise engineering wording. */
  message: string;
  severity: ExplanationSeverity;
  /** Which objective source supports this statement. */
  evidence: ExplanationEvidence;
}

export type ExplanationEvidenceSource =
  | "positionMetrics"
  | "cockpitPenaltyBreakdown"
  | "handlingPenaltyBreakdown"
  | "constraintStatus";

export interface ExplanationEvidence {
  source: ExplanationEvidenceSource;
  /** The measured field(s) and values the statement is derived from. */
  measurements: Record<string, number | string>;
}

export interface RecommendationExplanation {
  candidateId: string;
  headline: string;
  summary: string;
  reasons: ExplanationStatement[];
  warnings: ExplanationStatement[];
  recommendations: ExplanationStatement[];
  explainedAt: Date;
}

// --- Extension architecture --------------------------------------------------

/**
 * Context handed to every rule. Future explanation modules (directional
 * tolerances, fit philosophy, user preferences) attach their data here via
 * `extensions` — no existing interface has to change.
 */
export interface ExplanationContext {
  assessment: FitAssessment;
  ranking: RankingResult;
  /** The ranked entry for this candidate, when it was not rejected. */
  ranked: RankedConfiguration | null;
  /** 1-based rank among valid configurations, or null when invalid. */
  rankPosition: number | null;
  /** Namespaced payloads for future modules. */
  extensions: Readonly<Record<string, unknown>>;
}

export interface ExplanationRule {
  id: string;
  /** Which output bucket produced statements belong to. */
  channel: "reasons" | "warnings" | "recommendations";
  evaluate: (context: ExplanationContext) => ExplanationStatement[];
}

export interface ExplanationOptions {
  /** Replaces the default rule set entirely. */
  rules?: ExplanationRule[];
  /** Appended to the default rule set. */
  additionalRules?: ExplanationRule[];
  /** Arbitrary namespaced data for future rules. */
  extensions?: Record<string, unknown>;
  /** Overrides for the documented reporting bands. */
  thresholds?: Partial<PositionReportingThresholds>;
}

// --- Reporting bands ---------------------------------------------------------

/**
 * Bands used purely to word a measurement, never to score it. Scoring stays in
 * the ranking engine.
 */
export interface PositionReportingThresholds {
  /** Euclidean distance (mm) at or below which the match is called excellent. */
  excellentDistance: number;
  /** Euclidean distance (mm) at or below which the match is called close. */
  closeDistance: number;
}

export const defaultPositionReportingThresholds: PositionReportingThresholds = {
  excellentDistance: 5,
  closeDistance: 10,
};

// --- Helpers -----------------------------------------------------------------

const mm = (value: number) => `${value.toFixed(1)} mm`;

function cockpitPenaltyTotal(breakdown: CockpitPenaltyBreakdown): number {
  return (
    breakdown.nonStockStem +
    breakdown.nonStockCockpit +
    breakdown.nonStockSpacerConfiguration
  );
}

function handlingPenaltyTotal(breakdown: HandlingPenaltyBreakdown): number {
  return breakdown.stemLengthPenalty + breakdown.spacerPenalty;
}

function describePositionMatch(
  metrics: PositionMetrics,
  thresholds: PositionReportingThresholds,
): { code: string; message: string; severity: ExplanationSeverity } {
  const d = metrics.euclideanDistance;
  if (d <= thresholds.excellentDistance) {
    return {
      code: "POSITION_MATCH_EXCELLENT",
      message: `Excellent positional match. Predicted handlebar position is ${mm(d)} from the target.`,
      severity: "info",
    };
  }
  if (d <= thresholds.closeDistance) {
    return {
      code: "POSITION_MATCH_CLOSE",
      message: `Close positional match. Predicted handlebar position is ${mm(d)} from the target.`,
      severity: "info",
    };
  }
  return {
    code: "POSITION_MATCH_OUTSIDE_BAND",
    message: `Predicted handlebar position is ${mm(d)} from the target, beyond the ${mm(thresholds.closeDistance)} reporting band.`,
    severity: "caution",
  };
}

// --- Default rules -----------------------------------------------------------

function positionRules(
  thresholds: PositionReportingThresholds,
): ExplanationRule[] {
  return [
    {
      id: "position.match",
      channel: "reasons",
      evaluate: ({ assessment }) => {
        const m = assessment.positionMetrics;
        const band = describePositionMatch(m, thresholds);
        const statements: ExplanationStatement[] = [
          {
            ...band,
            evidence: {
              source: "positionMetrics",
              measurements: { euclideanDistance: m.euclideanDistance },
            },
          },
        ];
        if (m.absoluteDeltaX > 0 || m.absoluteDeltaY > 0) {
          statements.push({
            code: "POSITION_COMPONENT_DELTAS",
            message: `Horizontal difference ${mm(m.deltaX)}, vertical difference ${mm(m.deltaY)} relative to target.`,
            severity: "info",
            evidence: {
              source: "positionMetrics",
              measurements: { deltaX: m.deltaX, deltaY: m.deltaY },
            },
          });
        }
        return statements;
      },
    },
    {
      id: "position.outOfBand",
      channel: "warnings",
      evaluate: ({ assessment }) => {
        const m = assessment.positionMetrics;
        if (m.euclideanDistance <= thresholds.closeDistance) return [];
        return [
          {
            code: "POSITION_DEVIATION",
            message: `Positional deviation of ${mm(m.euclideanDistance)} exceeds the ${mm(thresholds.closeDistance)} reporting band.`,
            severity: "caution",
            evidence: {
              source: "positionMetrics",
              measurements: { euclideanDistance: m.euclideanDistance },
            },
          },
        ];
      },
    },
  ];
}

const cockpitRule: ExplanationRule = {
  id: "cockpit.penalties",
  channel: "reasons",
  evaluate: ({ assessment }) => {
    const c = assessment.cockpitPenaltyBreakdown;
    const measurements = { ...c } as Record<string, number>;
    if (cockpitPenaltyTotal(c) === 0) {
      return [
        {
          code: "COCKPIT_NO_PENALTIES",
          message: "No cockpit penalties identified.",
          severity: "info",
          evidence: { source: "cockpitPenaltyBreakdown", measurements },
        },
      ];
    }
    const statements: ExplanationStatement[] = [];
    if (c.nonStockStem > 0) {
      statements.push({
        code: "COCKPIT_NON_STOCK_STEM",
        message: "Uses a non-stock stem.",
        severity: "caution",
        evidence: {
          source: "cockpitPenaltyBreakdown",
          measurements: { nonStockStem: c.nonStockStem },
        },
      });
    }
    if (c.nonStockCockpit > 0) {
      statements.push({
        code: "COCKPIT_NON_STOCK_COCKPIT",
        message: "Uses a non-stock cockpit.",
        severity: "caution",
        evidence: {
          source: "cockpitPenaltyBreakdown",
          measurements: { nonStockCockpit: c.nonStockCockpit },
        },
      });
    }
    if (c.nonStockSpacerConfiguration > 0) {
      statements.push({
        code: "COCKPIT_NON_STOCK_SPACERS",
        message: "Uses a spacer stack outside the stock configuration.",
        severity: "caution",
        evidence: {
          source: "cockpitPenaltyBreakdown",
          measurements: {
            nonStockSpacerConfiguration: c.nonStockSpacerConfiguration,
          },
        },
      });
    }
    return statements;
  },
};

const handlingRule: ExplanationRule = {
  id: "handling.penalties",
  channel: "reasons",
  evaluate: ({ assessment }) => {
    const h = assessment.handlingPenaltyBreakdown;
    const measurements = { ...h } as Record<string, number>;
    if (handlingPenaltyTotal(h) === 0) {
      return [
        {
          code: "HANDLING_NO_PENALTIES",
          message: "No handling penalties identified.",
          severity: "info",
          evidence: { source: "handlingPenaltyBreakdown", measurements },
        },
      ];
    }
    const statements: ExplanationStatement[] = [];
    if (h.stemLengthPenalty > 0) {
      statements.push({
        code: "HANDLING_STEM_LENGTH",
        message: "Stem length contributes a handling penalty.",
        severity: "caution",
        evidence: {
          source: "handlingPenaltyBreakdown",
          measurements: { stemLengthPenalty: h.stemLengthPenalty },
        },
      });
    }
    if (h.spacerPenalty > 0) {
      statements.push({
        code: "HANDLING_SPACER_STACK",
        message: "Spacer stack height contributes a handling penalty.",
        severity: "caution",
        evidence: {
          source: "handlingPenaltyBreakdown",
          measurements: { spacerPenalty: h.spacerPenalty },
        },
      });
    }
    return statements;
  },
};

const constraintRule: ExplanationRule = {
  id: "constraint.status",
  channel: "reasons",
  evaluate: ({ assessment }) => [
    assessment.constraintStatus === "VALID"
      ? {
          code: "CONSTRAINT_VALID",
          message: "Configuration is within the recorded manufacturer constraints.",
          severity: "info" as const,
          evidence: {
            source: "constraintStatus" as const,
            measurements: { constraintStatus: assessment.constraintStatus },
          },
        }
      : {
          code: "CONSTRAINT_INVALID",
          message: "Configuration is outside the recorded manufacturer constraints.",
          severity: "blocking" as const,
          evidence: {
            source: "constraintStatus" as const,
            measurements: { constraintStatus: assessment.constraintStatus },
          },
        },
  ],
};

const constraintWarningRule: ExplanationRule = {
  id: "constraint.warning",
  channel: "warnings",
  evaluate: ({ assessment }) => {
    if (assessment.constraintStatus === "VALID") return [];
    const notes = assessment.notes.map<ExplanationStatement>((note) => ({
      code: note.code,
      message: note.message,
      severity: "blocking",
      evidence: {
        source: "constraintStatus",
        measurements: { constraintStatus: assessment.constraintStatus },
      },
    }));
    return notes.length > 0
      ? notes
      : [
          {
            code: "CONSTRAINT_INVALID",
            message: "Configuration was reported INVALID by the evaluation layer.",
            severity: "blocking",
            evidence: {
              source: "constraintStatus",
              measurements: { constraintStatus: assessment.constraintStatus },
            },
          },
        ];
  },
};

/**
 * Recommendations are restricted to actions implied directly by a recorded
 * penalty component or constraint status. No advice is generated for a
 * condition that has not been measured.
 */
const recommendationRule: ExplanationRule = {
  id: "recommendations.fromEvidence",
  channel: "recommendations",
  evaluate: ({ assessment }) => {
    const statements: ExplanationStatement[] = [];
    if (assessment.constraintStatus === "INVALID") {
      statements.push({
        code: "RECOMMEND_ALTERNATIVE_CONFIGURATION",
        message:
          "Select an alternative configuration; this one is outside the recorded constraints.",
        severity: "blocking",
        evidence: {
          source: "constraintStatus",
          measurements: { constraintStatus: assessment.constraintStatus },
        },
      });
    }
    const c = assessment.cockpitPenaltyBreakdown;
    if (c.nonStockStem > 0 || c.nonStockCockpit > 0) {
      statements.push({
        code: "RECOMMEND_COMPONENT_SOURCING",
        message:
          "Account for sourcing non-stock cockpit components when costing this build.",
        severity: "info",
        evidence: {
          source: "cockpitPenaltyBreakdown",
          measurements: {
            nonStockStem: c.nonStockStem,
            nonStockCockpit: c.nonStockCockpit,
          },
        },
      });
    }
    return statements;
  },
};

export function defaultExplanationRules(
  thresholds: PositionReportingThresholds = defaultPositionReportingThresholds,
): ExplanationRule[] {
  return [
    ...positionRules(thresholds),
    cockpitRule,
    handlingRule,
    constraintRule,
    constraintWarningRule,
    recommendationRule,
  ];
}

// --- Headline & summary ------------------------------------------------------

function buildHeadline(context: ExplanationContext, reasons: ExplanationStatement[]) {
  if (context.assessment.constraintStatus === "INVALID") {
    return "Configuration rejected: outside recorded constraints.";
  }
  const positional = reasons.find((r) => r.code.startsWith("POSITION_MATCH_"));
  const distance = context.assessment.positionMetrics.euclideanDistance;
  const label =
    positional?.code === "POSITION_MATCH_EXCELLENT"
      ? "Excellent positional match"
      : positional?.code === "POSITION_MATCH_CLOSE"
        ? "Close positional match"
        : "Positional deviation outside reporting band";
  return `${label} (${mm(distance)} from target).`;
}

function buildSummary(
  context: ExplanationContext,
  warnings: ExplanationStatement[],
): string {
  const { assessment, rankPosition, ranking } = context;
  const parts: string[] = [];
  if (rankPosition !== null) {
    parts.push(
      `Ranked ${rankPosition} of ${ranking.rankedConfigurations.length} valid configurations.`,
    );
  } else {
    parts.push("Not ranked; reported INVALID by the evaluation layer.");
  }
  parts.push(
    `Position error ${mm(assessment.positionMetrics.euclideanDistance)} (X ${mm(assessment.positionMetrics.deltaX)}, Y ${mm(assessment.positionMetrics.deltaY)}).`,
  );
  const cockpit = cockpitPenaltyTotal(assessment.cockpitPenaltyBreakdown);
  const handling = handlingPenaltyTotal(assessment.handlingPenaltyBreakdown);
  parts.push(
    `Cockpit penalty total ${cockpit}, handling penalty total ${handling}.`,
  );
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning(s) recorded.`);
  }
  return parts.join(" ");
}

// --- Public API --------------------------------------------------------------

export interface ExplanationInput {
  assessment: FitAssessment;
  ranking: RankingResult;
  options?: ExplanationOptions;
}

/** The single public entry point of the explanation layer. */
export function explainRecommendation(
  input: ExplanationInput,
): RecommendationExplanation {
  const { assessment, ranking, options } = input;

  const thresholds: PositionReportingThresholds = {
    ...defaultPositionReportingThresholds,
    ...options?.thresholds,
  };

  const rankedIndex = ranking.rankedConfigurations.findIndex(
    (entry) => entry.candidateId === assessment.candidateId,
  );
  const context: ExplanationContext = {
    assessment,
    ranking,
    ranked: rankedIndex >= 0 ? ranking.rankedConfigurations[rankedIndex]! : null,
    rankPosition: rankedIndex >= 0 ? rankedIndex + 1 : null,
    extensions: options?.extensions ?? {},
  };

  const rules = [
    ...(options?.rules ?? defaultExplanationRules(thresholds)),
    ...(options?.additionalRules ?? []),
  ];

  const reasons: ExplanationStatement[] = [];
  const warnings: ExplanationStatement[] = [];
  const recommendations: ExplanationStatement[] = [];

  for (const rule of rules) {
    const produced = rule.evaluate(context);
    const target =
      rule.channel === "reasons"
        ? reasons
        : rule.channel === "warnings"
          ? warnings
          : recommendations;
    target.push(...produced);
  }

  return {
    candidateId: assessment.candidateId,
    headline: buildHeadline(context, reasons),
    summary: buildSummary(context, warnings),
    reasons,
    warnings,
    recommendations,
    explainedAt: new Date(),
  };
}

/** Convenience: explain every configuration in a ranking result. */
export function explainRanking(
  ranking: RankingResult,
  options?: ExplanationOptions,
): RecommendationExplanation[] {
  const assessments = [
    ...ranking.rankedConfigurations.map((entry) => entry.assessment),
    ...ranking.invalidConfigurations.map((entry) => entry.assessment),
  ];
  return assessments.map((assessment) =>
    explainRecommendation({ assessment, ranking, options }),
  );
}
