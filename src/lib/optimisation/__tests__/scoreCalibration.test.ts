import { describe, expect, it } from "vitest";
import type { FitAssessment } from "@/types/optimisation";
import {
  POSITION_DECAY_MM,
  exponentialPositionNormalisation,
  rankConfigurations,
} from "@/lib/rankingEngine";
import { defaultPositionReportingThresholds } from "@/lib/explanationEngine";

/**
 * Sprint 9.7 — the ranking score must respond materially to positional error.
 * Cockpit and handling penalties remain placeholders at zero.
 */

function assessment(candidateId: string, distance: number): FitAssessment {
  return {
    candidateId,
    positionMetrics: {
      deltaX: distance,
      deltaY: 0,
      absoluteDeltaX: distance,
      absoluteDeltaY: 0,
      euclideanDistance: distance,
    },
    cockpitPenaltyBreakdown: {
      nonStockStem: 0,
      nonStockCockpit: 0,
      nonStockSpacerConfiguration: 0,
    },
    handlingPenaltyBreakdown: { stemLengthPenalty: 0, spacerPenalty: 0 },
    geometryWarnings: [],
    constraintStatus: "VALID",
    notes: [],
  };
}

describe("positional score calibration", () => {
  it("uses the documented positional reporting band as its length scale", () => {
    expect(POSITION_DECAY_MM).toBe(defaultPositionReportingThresholds.closeDistance);
    expect(exponentialPositionNormalisation(0, { cohort: [] })).toBe(1);
    expect(exponentialPositionNormalisation(POSITION_DECAY_MM, { cohort: [] })).toBeCloseTo(
      Math.exp(-1),
      10,
    );
  });

  it("orders small, moderate and large positional errors by physical fit quality", () => {
    const ranked = rankConfigurations({
      validConfigurations: [
        assessment("large", 76.5),
        assessment("small", 7.6),
        assessment("moderate", 35),
      ],
      invalidConfigurations: [],
    }).rankedConfigurations;

    expect(ranked.map((r) => r.candidateId)).toEqual(["small", "moderate", "large"]);
  });

  it("separates a small from a large positional error materially", () => {
    const [small, large] = rankConfigurations({
      validConfigurations: [assessment("small", 7.6), assessment("large", 76.5)],
      invalidConfigurations: [],
    }).rankedConfigurations;

    // Pre-calibration this gap was ~0.006 for a 10x change in error.
    expect(small!.overallScore - large!.overallScore).toBeGreaterThan(0.1);
  });
});
