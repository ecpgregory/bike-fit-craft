import { describe, expect, it } from "vitest";
import type {
  BikeFitConstraints,
  CockpitConfiguration,
  FrameGeometry,
} from "@/types/optimisation";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import { runOptimisationPipeline } from "@/lib/optimisation/pipeline";
import { assessSolvedConfiguration } from "@/lib/errorCalculator";
import { rankConfigurations } from "@/lib/rankingEngine";
import { explainRanking } from "@/lib/explanationEngine";

const frame: FrameGeometry = {
  frameReach: 390,
  frameStack: 570,
  headTubeAngle: 73,
};

function configuration(overrides: Partial<CockpitConfiguration> = {}): CockpitConfiguration {
  return {
    id: "cfg-1",
    stemLength: 100,
    stemAngle: -6,
    spacerHeight: 20,
    handlebarReach: 80,
    handlebarStack: 130,
    usesStockComponents: true,
    requiresAftermarketStem: false,
    requiresAftermarketHandlebar: false,
    configurationDescription: "test configuration",
    exceedsRecommendedSpacerHeight: false,
    cockpitOptionId: null,
    handlebarRotation: 0,
    hoodReach: 90,
    hoodStack: 20,
    hoodRotation: 0,
    ...overrides,
  };
}

const constraints: BikeFitConstraints = {
  bikeId: "bike-1",
  minimumSpacerHeight: 0,
  maximumSpacerHeight: 20,
  availableSpacerHeights: [20],
  minimumStemLength: 100,
  maximumStemLength: 100,
  availableStemLengths: [100],
  allowedStemAngles: [-6],
  integratedCockpit: false,
  availableCockpitOptions: [
    {
      id: "bar-1",
      name: "Test bar 400",
      stemLength: null,
      stemAngle: null,
      handlebarReach: 80,
      handlebarStack: 130,
      handlebarRotation: null,
      hoodReach: null,
      hoodStack: null,
      hoodRotation: null,

      isStock: true,
      isIntegrated: false,
      isAftermarket: false,
    },
  ],
  allowAftermarketStem: false,
  allowAftermarketHandlebar: false,
  maximumRecommendedSpacerHeight: 30,
  notes: "",
};

describe("Geometry Solver integration", () => {
  it("solves a fully specified configuration and produces RP5", () => {
    const solved = solveConfiguration(configuration(), frame);
    expect(solved.status).toBe("SOLVED");
    expect(solved.rp3).not.toBeNull();
    expect(solved.rp4).not.toBeNull();
    expect(solved.rp5).not.toBeNull();
  });

  it("flows the solved RP5 into the Error Calculator position metrics", () => {
    const solved = solveConfiguration(configuration(), frame);
    const rp5 = solved.rp5!;
    const target = { x: rp5.x - 3, y: rp5.y + 4 };

    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-1",
      solved,
      target,
    })!;

    expect(assessment.positionMetrics.deltaX).toBeCloseTo(3, 6);
    expect(assessment.positionMetrics.deltaY).toBeCloseTo(-4, 6);
    expect(assessment.positionMetrics.euclideanDistance).toBeCloseTo(5, 6);
  });

  it("does not evaluate UNSOLVED configurations", () => {
    const solved = solveConfiguration(configuration({ hoodReach: null }), frame);
    expect(solved.status).toBe("UNSOLVED");
    expect(solved.unsolvedReason).toBe("MISSING_COCKPIT_INPUTS");

    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-1",
      solved,
      target: { x: 0, y: 0 },
    });
    expect(assessment).toBeNull();
  });
});

describe("Ranking Engine behaviour", () => {
  it("ranks valid assessments best-first and rejects invalid ones", () => {
    const solved = solveConfiguration(configuration(), frame);
    const rp5 = solved.rp5!;

    const near = assessSolvedConfiguration({
      candidateId: "near",
      solved,
      target: { x: rp5.x, y: rp5.y },
    })!;
    const far = assessSolvedConfiguration({
      candidateId: "far",
      solved,
      target: { x: rp5.x - 50, y: rp5.y },
    })!;
    const invalid = assessSolvedConfiguration({
      candidateId: "invalid",
      solved,
      target: { x: rp5.x, y: rp5.y },
      isConstraintValid: false,
    })!;

    const ranking = rankConfigurations({
      validConfigurations: [far, near],
      invalidConfigurations: [invalid],
    });

    expect(ranking.rankedConfigurations.map((r) => r.candidateId)).toEqual([
      "near",
      "far",
    ]);
    expect(ranking.invalidConfigurations.map((r) => r.candidateId)).toEqual(["invalid"]);
    expect(ranking.invalidConfigurations[0]!.rejectionReasons.length).toBeGreaterThan(0);
  });
});

describe("Explanation Engine", () => {
  it("explains assessments produced from solved geometry", () => {
    const solved = solveConfiguration(configuration(), frame);
    const rp5 = solved.rp5!;
    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-1",
      solved,
      target: { x: rp5.x, y: rp5.y },
    })!;
    const ranking = rankConfigurations({
      validConfigurations: [assessment],
      invalidConfigurations: [],
    });

    const explanations = explainRanking(ranking);
    expect(explanations).toHaveLength(1);
    expect(explanations[0]!.candidateId).toBe("cfg-1");
    expect(explanations[0]!.reasons.length).toBeGreaterThan(0);
  });
});

describe("runOptimisationPipeline", () => {
  it("preserves unsolved configurations instead of dropping them", () => {
    const result = runOptimisationPipeline({
      constraints,
      frameGeometry: frame,
      target: { x: 470, y: 631 },
    });

    expect(result.configurations.length).toBeGreaterThan(0);
    // Cockpit rotation/hood data is not supplied by the constraint layer yet.
    expect(result.unsolvedConfigurations.length).toBe(result.configurations.length);
    expect(result.assessments).toHaveLength(0);
    expect(result.ranking.rankedConfigurations).toHaveLength(0);
    expect(result.unsolvedConfigurations[0]!.reason).toBe("MISSING_COCKPIT_INPUTS");
    expect(result.unsolvedConfigurations[0]!.missingInputs.length).toBeGreaterThan(0);
  });

  it("ranks and explains solvable configurations end to end", () => {
    const result = runOptimisationPipeline({
      constraints: {
        ...constraints,
        availableCockpitOptions: [],
      },
      frameGeometry: frame,
      target: { x: 470, y: 631 },
    });
    // Stem-only configurations still lack handlebar data → unsolved, retained.
    expect(result.solvedConfigurations.length).toBe(result.configurations.length);
    expect(
      result.solvedConfigurations.every((s) => s.status === "UNSOLVED"),
    ).toBe(true);
    expect(result.explanations).toHaveLength(0);
  });
});
