import { describe, expect, it } from "vitest";
import type { Bike, RiderProfile } from "@/types";
import type {
  BikeFitConstraints,
  CockpitConfiguration,
  FrameGeometry,
} from "@/types/optimisation";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import { runOptimisationPipeline } from "@/lib/optimisation/pipeline";

/**
 * The engine is pure orchestration, so these tests exercise it against the real
 * pipeline where possible and against configuration sets injected through the
 * pipeline boundary where the Constraint Generator cannot yet supply cockpit
 * component data (handlebar/hood rotation).
 */

const frame: FrameGeometry = { frameReach: 390, frameStack: 570, headTubeAngle: 73 };

const bike: Bike = {
  id: "bike-1",
  brand: "Test",
  model: "Frame",
  year: 2025,
  size: "54",
  frameStack: frame.frameStack,
  frameReach: frame.frameReach,
  headTube: null,
  wheelbase: null,
  frontCentre: null,
  chainstay: null,
  bbDrop: null,
  tyreClearance: null,
  integratedCockpit: false,
  notes: "",
  headTubeAngle: frame.headTubeAngle,
  stockStemLength: 100,
  stockStemAngle: -6,
  stockHandlebarReach: 80,
  stockHandlebarStack: 130,
  stockSpacerHeight: 20,
  maxSpacerHeight: 30,
  minimumStemLength: 80,
  maximumStemLength: 120,
};

const rider: RiderProfile = {
  id: "rider-1",
  name: "Test Rider",
  currentBike: "Test Frame",
  handlebarX: 480,
  handlebarY: 640,
  frameReach: 390,
  frameStack: 570,
  stemLength: 100,
  spacerHeight: 20,
  saddleHeight: 740,
  saddleSetback: 70,
  preferredBikeType: null,
  preferredTyreWidth: null,
  budget: null,
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

import { assessSolvedConfiguration, targetFromRider } from "@/lib/errorCalculator";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import { rankConfigurations } from "@/lib/rankingEngine";
import { explainRanking } from "@/lib/explanationEngine";
import type { PipelineResult, UnsolvedCandidate } from "@/lib/optimisation/pipeline";
import type { FitAssessment } from "@/types/optimisation";

function realPipelineOverConfigurations(
  configurations: CockpitConfiguration[],
  input: Parameters<typeof runOptimisationPipeline>[0],
): PipelineResult {
  const target = input.target ?? targetFromRider(input.rider!);
  const solvedConfigurations = configurations.map((c) =>
    solveConfiguration(c, input.frameGeometry),
  );
  const assessments: FitAssessment[] = [];
  const unsolvedConfigurations: UnsolvedCandidate[] = [];

  for (const solved of solvedConfigurations) {
    const candidateId = solved.configuration.id;
    const assessment = assessSolvedConfiguration({
      candidateId,
      solved,
      target,
      isConstraintValid: !solved.configuration.exceedsRecommendedSpacerHeight,
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

  const ranking = rankConfigurations({
    validConfigurations: assessments.filter((a) => a.constraintStatus === "VALID"),
    invalidConfigurations: assessments.filter((a) => a.constraintStatus === "INVALID"),
    options: input.rankingOptions,
  });

  return {
    configurations,
    solvedConfigurations,
    assessments,
    unsolvedConfigurations,
    ranking,
    explanations: explainRanking(ranking),
  };
}

function optimiseWith(configurations: CockpitConfiguration[]) {
  return optimiseBike({
    bike,
    rider,
    runPipeline: (input) => realPipelineOverConfigurations(configurations, input),
  });
}

describe("optimiseBike", () => {
  it("optimises a bike with one valid configuration", () => {
    const result = optimiseWith([configuration()]);

    expect(result.bikeId).toBe("bike-1");
    expect(result.evaluatedConfigurations).toHaveLength(1);
    expect(result.bestConfiguration?.candidateId).toBe("cfg-1");
    expect(result.rejectedConfigurations).toHaveLength(0);
    expect(result.optimisationSummary).toEqual({
      totalConfigurations: 1,
      solvedConfigurations: 1,
      rejectedConfigurations: 0,
    });
  });

  it("optimises a bike with multiple valid configurations and sorts them", () => {
    const result = optimiseWith([
      configuration({ id: "cfg-a", stemLength: 80 }),
      configuration({ id: "cfg-b", stemLength: 100 }),
      configuration({ id: "cfg-c", stemLength: 120 }),
    ]);

    expect(result.evaluatedConfigurations).toHaveLength(3);
    const scores = result.evaluatedConfigurations.map((c) => c.overallScore);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(result.bestConfiguration).toBe(result.evaluatedConfigurations[0]);
    expect(result.optimisationSummary.solvedConfigurations).toBe(3);
  });

  it("preserves UNSOLVED configurations with their rejection reason", () => {
    const result = optimiseWith([
      configuration({ id: "cfg-ok" }),
      configuration({ id: "cfg-unsolved", hoodReach: null }),
    ]);

    expect(result.evaluatedConfigurations.map((c) => c.candidateId)).toEqual(["cfg-ok"]);
    expect(result.rejectedConfigurations).toHaveLength(1);

    const rejected = result.rejectedConfigurations[0]!;
    expect(rejected.candidateId).toBe("cfg-unsolved");
    expect(rejected.stage).toBe("GEOMETRY_SOLVER");
    expect(rejected.unsolvedReason).toBe("MISSING_COCKPIT_INPUTS");
    expect(rejected.assessment).toBeNull();
    expect(rejected.rejectionReasons.some((r) => r.message.includes("hoodReach"))).toBe(true);
    expect(result.optimisationSummary).toEqual({
      totalConfigurations: 2,
      solvedConfigurations: 1,
      rejectedConfigurations: 1,
    });
  });

  it("preserves INVALID configurations with their rejection reasons", () => {
    const result = optimiseWith([
      configuration({ id: "cfg-ok" }),
      configuration({ id: "cfg-invalid", exceedsRecommendedSpacerHeight: true }),
    ]);

    expect(result.evaluatedConfigurations.map((c) => c.candidateId)).toEqual(["cfg-ok"]);

    const rejected = result.rejectedConfigurations.find(
      (r) => r.candidateId === "cfg-invalid",
    )!;
    expect(rejected.stage).toBe("CONSTRAINT_EVALUATION");
    expect(rejected.assessment).not.toBeNull();
    expect(rejected.rejectionReasons.length).toBeGreaterThan(0);
    expect(rejected.configuration.id).toBe("cfg-invalid");
  });

  it("bestConfiguration is the highest scoring evaluated configuration", () => {
    const result = optimiseWith([
      configuration({ id: "cfg-a", stemLength: 80 }),
      configuration({ id: "cfg-b", stemLength: 100 }),
      configuration({ id: "cfg-c", stemLength: 120 }),
    ]);

    const maxScore = Math.max(...result.evaluatedConfigurations.map((c) => c.overallScore));
    expect(result.bestConfiguration!.overallScore).toBe(maxScore);
  });

  it("returns a null bestConfiguration when nothing can be evaluated", () => {
    const result = optimiseWith([configuration({ id: "cfg-x", hoodStack: null })]);

    expect(result.bestConfiguration).toBeNull();
    expect(result.evaluatedConfigurations).toHaveLength(0);
    expect(result.rejectedConfigurations).toHaveLength(1);
  });

  it("is deterministic across repeated runs", () => {
    const configs = [
      configuration({ id: "cfg-a", stemLength: 80 }),
      configuration({ id: "cfg-b", stemLength: 100 }),
    ];
    const a = optimiseWith(configs).evaluatedConfigurations.map((c) => c.candidateId);
    const b = optimiseWith(configs).evaluatedConfigurations.map((c) => c.candidateId);
    expect(a).toEqual(b);
  });

  it("runs the real pipeline for a bike and preserves every configuration", () => {
    const result = optimiseBike({ bike, rider });

    const summary = result.optimisationSummary;
    expect(summary.totalConfigurations).toBeGreaterThanOrEqual(0);
    expect(result.evaluatedConfigurations.length + result.rejectedConfigurations.length).toBe(
      summary.totalConfigurations,
    );
  });
});
