import { describe, expect, it } from "vitest";
import type { CockpitConfiguration, FrameGeometry } from "@/types/optimisation";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import { assessSolvedConfiguration } from "@/lib/errorCalculator";

/**
 * Sprint 8A.7 regression cover: the rider's saved handlebar X/Y is measured to
 * the Handlebar Clamp Centre, so positional error is measured against RP3.
 */

const frame: FrameGeometry = {
  frameReach: 390,
  frameStack: 570,
  headTubeAngle: 73,
};

function configuration(overrides: Partial<CockpitConfiguration> = {}): CockpitConfiguration {
  return {
    id: "cfg-rp3",
    stemLength: 100,
    stemAngle: -6,
    spacerHeight: 20,
    handlebarReach: 80,
    handlebarStack: 130,
    usesStockComponents: true,
    requiresAftermarketStem: false,
    requiresAftermarketHandlebar: false,
    configurationDescription: "rp3 test configuration",
    exceedsRecommendedSpacerHeight: false,
    cockpitOptionId: null,
    handlebarRotation: 0,
    hoodReach: 90,
    hoodStack: 20,
    hoodRotation: 0,
    ...overrides,
  };
}

describe("RP3 as the rider-position target", () => {
  it("calculates RP3 and measures positional error against it", () => {
    const solved = solveConfiguration(configuration(), frame);
    const rp3 = solved.rp3!;

    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-rp3",
      solved,
      target: { x: rp3.x - 6, y: rp3.y + 8 },
    })!;

    expect(assessment.positionMetrics.deltaX).toBeCloseTo(6, 6);
    expect(assessment.positionMetrics.deltaY).toBeCloseTo(-8, 6);
    expect(assessment.positionMetrics.euclideanDistance).toBeCloseTo(10, 6);
    // RP5 exists here but must not be the positional source.
    expect(solved.rp5).not.toBeNull();
    expect(assessment.positionMetrics.deltaX).not.toBeCloseTo(solved.rp5!.x - (rp3.x - 6), 6);
  });

  it("produces identical positional error regardless of RP4/RP5 geometry", () => {
    const base = solveConfiguration(configuration(), frame);
    const altered = solveConfiguration(
      configuration({ handlebarReach: 200, hoodReach: 300, hoodStack: 60 }),
      frame,
    );
    const target = { x: 470, y: 631 };

    const a = assessSolvedConfiguration({ candidateId: "a", solved: base, target })!;
    const b = assessSolvedConfiguration({ candidateId: "b", solved: altered, target })!;

    expect(a.positionMetrics).toEqual(b.positionMetrics);
    expect(a.cockpitPenaltyBreakdown).toEqual({
      nonStockStem: 0,
      nonStockCockpit: 0,
      nonStockSpacerConfiguration: 0,
    });
    expect(a.handlingPenaltyBreakdown).toEqual({ stemLengthPenalty: 0, spacerPenalty: 0 });
  });

  it("adds no RP4_RP5_UNAVAILABLE warning when the full chain solves", () => {
    const solved = solveConfiguration(configuration(), frame);
    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-rp3",
      solved,
      target: { x: 470, y: 631 },
    })!;
    const codes = assessment.geometryWarnings.map((w) => w.code);
    expect(codes).not.toContain("RP4_RP5_UNAVAILABLE");
    // Sprint 9.8: with no rider RP5 or handlebar-width target supplied, the
    // cockpit and handling metrics are reported UNAVAILABLE rather than
    // silently scored.
    expect(codes).toEqual(["COCKPIT_TARGET_UNAVAILABLE", "HANDLING_TARGET_UNAVAILABLE"]);
  });


  it("reports every missing cockpit input in the RP3-only warning", () => {
    const solved = solveConfiguration(
      configuration({ hoodReach: null, hoodStack: null, handlebarRotation: null }),
      frame,
    );
    const assessment = assessSolvedConfiguration({
      candidateId: "cfg-rp3",
      solved,
      target: { x: 470, y: 631 },
    })!;

    const warning = assessment.geometryWarnings.find(
      (w) => w.code === "RP4_RP5_UNAVAILABLE",
    )!;
    expect(warning.severity).toBe("info");
    expect(warning.message).toContain("handlebar clamp centre (RP3)");
    expect(warning.measurements!["missingInputs"]).toEqual([
      "handlebarRotation",
      "hoodReach",
      "hoodStack",
    ]);
  });

  it("returns no assessment when RP3 cannot be calculated", () => {
    const solved = solveConfiguration(configuration({ stemAngle: null }), frame);
    expect(solved.rp3).toBeNull();
    expect(
      assessSolvedConfiguration({
        candidateId: "cfg-rp3",
        solved,
        target: { x: 470, y: 631 },
      }),
    ).toBeNull();
  });
});
