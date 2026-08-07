import { describe, expect, it } from "vitest";
import type { CockpitConfiguration, FrameGeometry } from "@/types/optimisation";
import {
  calculateFrameReferencePoint,
  calculateHandlebarVector,
  calculateHoodOrientation,
  calculateHoodVector,
  calculateRP3,
  calculateRP4,
  calculateRP5,
  calculateSpacerTop,
  calculateSpacerVector,
  calculateStemOrientation,
  calculateStemReferenceAngle,
  calculateStemVector,
} from "@/lib/optimisation/cockpitVectors";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import { GEOMETRY_REGRESSION_TOLERANCE_MM } from "@/lib/optimisation/geometryConstants";

/**
 * Geometry Solver regression suite.
 *
 * These fixtures protect the mathematical model. They are illustrative
 * engineering values, not a production bicycle. Expected outputs are validated
 * regression values and must only change when the engineering mathematics
 * intentionally changes.
 */

/** Digits for expect.toBeCloseTo giving ±0.01 mm / ±0.01° confidence. */
const MM_PRECISION = 2;

/** Golden fixture — all quantities in millimetres and degrees. */
const GOLDEN = {
  frameReach: 390, // mm
  frameStack: 560, // mm
  headTubeAngle: 73, // degrees (θ)
  spacerHeight: 20, // mm
  stemLength: 100, // mm
  stemAngle: -6, // degrees (φ)
  handlebarReach: 80, // mm, +forwards
  handlebarStack: -15, // mm, +upwards
  handlebarRotation: 0, // degrees (ρ)
  hoodReach: 65, // mm, +forwards
  hoodStack: -25, // mm, +upwards
  hoodRotation: 0, // degrees (σ)
} as const;

const GOLDEN_EXPECTED = {
  frameReferencePoint: { x: 390.0, y: 560.0 },
  rp3: { x: 482.32, y: 598.21 },
  rp4: { x: 562.32, y: 583.21 },
  rp5: { x: 627.32, y: 558.21 },
} as const;

const goldenFrame: FrameGeometry = {
  frameReach: GOLDEN.frameReach,
  frameStack: GOLDEN.frameStack,
  headTubeAngle: GOLDEN.headTubeAngle,
};

function goldenConfiguration(
  overrides: Partial<CockpitConfiguration> = {},
): CockpitConfiguration {
  return {
    id: "golden",
    stemLength: GOLDEN.stemLength,
    stemAngle: GOLDEN.stemAngle,
    spacerHeight: GOLDEN.spacerHeight,
    handlebarReach: GOLDEN.handlebarReach,
    handlebarStack: GOLDEN.handlebarStack,
    usesStockComponents: true,
    requiresAftermarketStem: false,
    requiresAftermarketHandlebar: false,
    configurationDescription: "golden regression fixture",
    exceedsRecommendedSpacerHeight: false,
    cockpitOptionId: null,
    handlebarRotation: GOLDEN.handlebarRotation,
    hoodReach: GOLDEN.hoodReach,
    hoodStack: GOLDEN.hoodStack,
    hoodRotation: GOLDEN.hoodRotation,
    ...overrides,
  };
}

describe("calculateFrameReferencePoint", () => {
  it("places the head tube top at (frameReach, frameStack) in millimetres", () => {
    const frp = calculateFrameReferencePoint(390, 560);
    expect(frp.x).toBeCloseTo(390, MM_PRECISION);
    expect(frp.y).toBeCloseTo(560, MM_PRECISION);
  });
});

describe("calculateSpacerVector", () => {
  it("matches the 73° / 20 mm engineering fixture", () => {
    const v = calculateSpacerVector(20, 73);
    expect(v.x).toBeCloseTo(-5.85, MM_PRECISION);
    expect(v.y).toBeCloseTo(19.13, MM_PRECISION);
  });

  it("produces no displacement for a zero spacer stack", () => {
    const v = calculateSpacerVector(0, 73);
    expect(v.x).toBeCloseTo(0, MM_PRECISION);
    expect(v.y).toBeCloseTo(0, MM_PRECISION);
  });

  it("rises vertically for a 90° head tube angle", () => {
    const v = calculateSpacerVector(20, 90);
    expect(v.x).toBeCloseTo(0, MM_PRECISION);
    expect(v.y).toBeCloseTo(20, MM_PRECISION);
  });
});

describe("calculateSpacerTop", () => {
  it("adds the spacer vector to the frame reference point", () => {
    const top = calculateSpacerTop({ x: 390, y: 560 }, { x: -5.85, y: 19.13 });
    expect(top.x).toBeCloseTo(384.15, MM_PRECISION);
    expect(top.y).toBeCloseTo(579.13, MM_PRECISION);
  });
});

describe("calculateStemReferenceAngle", () => {
  it("returns β = 90° − θ", () => {
    expect(calculateStemReferenceAngle(73)).toBeCloseTo(17, MM_PRECISION);
    expect(calculateStemReferenceAngle(90)).toBeCloseTo(0, MM_PRECISION);
  });
});

describe("calculateStemOrientation", () => {
  it("gives 11° above horizontal for a 73° head tube and −6° stem", () => {
    const beta = calculateStemReferenceAngle(73);
    expect(calculateStemOrientation(beta, -6)).toBeCloseTo(11, MM_PRECISION);
  });

  it("equals β when the stem angle is zero", () => {
    expect(calculateStemOrientation(17, 0)).toBeCloseTo(17, MM_PRECISION);
  });
});

describe("calculateStemVector", () => {
  it("resolves a 100 mm stem at 11° into its components", () => {
    const v = calculateStemVector(100, 11);
    expect(v.x).toBeCloseTo(98.16, MM_PRECISION);
    expect(v.y).toBeCloseTo(19.08, MM_PRECISION);
  });

  it("is purely horizontal at 0°", () => {
    const v = calculateStemVector(100, 0);
    expect(v.x).toBeCloseTo(100, MM_PRECISION);
    expect(v.y).toBeCloseTo(0, MM_PRECISION);
  });
});

describe("calculateRP3", () => {
  it("adds the stem vector to the spacer top", () => {
    const rp3 = calculateRP3({ x: 384.15, y: 579.13 }, { x: 98.16, y: 19.08 });
    expect(rp3.x).toBeCloseTo(482.31, MM_PRECISION);
    expect(rp3.y).toBeCloseTo(598.21, MM_PRECISION);
  });
});

describe("calculateHandlebarVector", () => {
  it("passes reach/stack through unrotated at ρ = 0°", () => {
    const v = calculateHandlebarVector(80, -15, 0);
    expect(v.x).toBeCloseTo(80, MM_PRECISION);
    expect(v.y).toBeCloseTo(-15, MM_PRECISION);
  });

  it("applies a standard 2D rotation at ρ = 90° (nose up)", () => {
    const v = calculateHandlebarVector(80, -15, 90);
    expect(v.x).toBeCloseTo(15, MM_PRECISION);
    expect(v.y).toBeCloseTo(80, MM_PRECISION);
  });

  it("rotates by ρ = 10°", () => {
    const v = calculateHandlebarVector(80, -15, 10);
    expect(v.x).toBeCloseTo(81.3893, MM_PRECISION);
    expect(v.y).toBeCloseTo(-0.8803, MM_PRECISION);
  });
});

describe("calculateRP4", () => {
  it("adds the handlebar vector to RP3", () => {
    const rp4 = calculateRP4({ x: 482.32, y: 598.21 }, { x: 80, y: -15 });
    expect(rp4.x).toBeCloseTo(562.32, MM_PRECISION);
    expect(rp4.y).toBeCloseTo(583.21, MM_PRECISION);
  });
});

describe("calculateHoodOrientation", () => {
  it("sums handlebar and hood rotation: ψ = ρ + σ", () => {
    expect(calculateHoodOrientation(0, 0)).toBeCloseTo(0, MM_PRECISION);
    expect(calculateHoodOrientation(5, -3)).toBeCloseTo(2, MM_PRECISION);
  });
});

describe("calculateHoodVector", () => {
  it("passes hood reach/stack through unrotated at ψ = 0°", () => {
    const v = calculateHoodVector(65, -25, 0);
    expect(v.x).toBeCloseTo(65, MM_PRECISION);
    expect(v.y).toBeCloseTo(-25, MM_PRECISION);
  });

  it("rotates the hood offset by ψ = 10°", () => {
    const v = calculateHoodVector(65, -25, 10);
    expect(v.x).toBeCloseTo(68.3537, MM_PRECISION);
    expect(v.y).toBeCloseTo(-13.3311, MM_PRECISION);
  });
});

describe("calculateRP5", () => {
  it("adds the hood vector to RP4", () => {
    const rp5 = calculateRP5({ x: 562.32, y: 583.21 }, { x: 65, y: -25 });
    expect(rp5.x).toBeCloseTo(627.32, MM_PRECISION);
    expect(rp5.y).toBeCloseTo(558.21, MM_PRECISION);
  });
});

describe("Golden Geometry Solver regression (FRP → RP3 → RP4 → RP5)", () => {
  it(`reproduces the validated fixture within ±${GEOMETRY_REGRESSION_TOLERANCE_MM} mm`, () => {
    const solved = solveConfiguration(goldenConfiguration(), goldenFrame);

    expect(solved.status).toBe("SOLVED");
    expect(solved.isPlaceholderSolution).toBe(false);

    const frp = calculateFrameReferencePoint(GOLDEN.frameReach, GOLDEN.frameStack);
    expect(frp.x).toBeCloseTo(GOLDEN_EXPECTED.frameReferencePoint.x, MM_PRECISION);
    expect(frp.y).toBeCloseTo(GOLDEN_EXPECTED.frameReferencePoint.y, MM_PRECISION);

    expect(solved.rp3!.x).toBeCloseTo(GOLDEN_EXPECTED.rp3.x, MM_PRECISION);
    expect(solved.rp3!.y).toBeCloseTo(GOLDEN_EXPECTED.rp3.y, MM_PRECISION);
    expect(solved.rp4!.x).toBeCloseTo(GOLDEN_EXPECTED.rp4.x, MM_PRECISION);
    expect(solved.rp4!.y).toBeCloseTo(GOLDEN_EXPECTED.rp4.y, MM_PRECISION);
    expect(solved.rp5!.x).toBeCloseTo(GOLDEN_EXPECTED.rp5.x, MM_PRECISION);
    expect(solved.rp5!.y).toBeCloseTo(GOLDEN_EXPECTED.rp5.y, MM_PRECISION);
  });
});

describe("Solver status handling — no engineering defaults are substituted", () => {
  it("is UNSOLVED when the head tube angle is missing", () => {
    const solved = solveConfiguration(goldenConfiguration(), {
      ...goldenFrame,
      headTubeAngle: null,
    });
    expect(solved.status).toBe("UNSOLVED");
    expect(solved.unsolvedReason).toBe("MISSING_REQUIRED_INPUTS");
    expect(solved.missingInputs).toContain("headTubeAngle");
    expect(solved.rp3).toBeNull();
    expect(solved.rp4).toBeNull();
    expect(solved.rp5).toBeNull();
  });

  it("is UNSOLVED when frame reach or stack is missing", () => {
    expect(
      solveConfiguration(goldenConfiguration(), { ...goldenFrame, frameReach: null })
        .missingInputs,
    ).toContain("frameReach");
    expect(
      solveConfiguration(goldenConfiguration(), { ...goldenFrame, frameStack: null })
        .missingInputs,
    ).toContain("frameStack");
  });

  it("is UNSOLVED when the stem length is missing", () => {
    const solved = solveConfiguration(
      goldenConfiguration({ stemLength: null }),
      goldenFrame,
    );
    expect(solved.status).toBe("UNSOLVED");
    expect(solved.unsolvedReason).toBe("MISSING_REQUIRED_INPUTS");
    expect(solved.missingInputs).toContain("stemLength");
  });

  it("is UNSOLVED when the stem angle is missing", () => {
    const solved = solveConfiguration(
      goldenConfiguration({ stemAngle: null }),
      goldenFrame,
    );
    expect(solved.status).toBe("UNSOLVED");
    expect(solved.missingInputs).toContain("stemAngle");
  });

  it.each([
    ["handlebarReach"],
    ["handlebarStack"],
    ["handlebarRotation"],
  ] as const)("is UNSOLVED when %s is missing", (field) => {
    const solved = solveConfiguration(
      goldenConfiguration({ [field]: null } as Partial<CockpitConfiguration>),
      goldenFrame,
    );
    expect(solved.status).toBe("UNSOLVED");
    expect(solved.unsolvedReason).toBe("MISSING_COCKPIT_INPUTS");
    expect(solved.missingInputs).toContain(field);
    expect(solved.rp3).toBeNull();
    expect(solved.rp5).toBeNull();
  });

  it.each([["hoodReach"], ["hoodStack"], ["hoodRotation"]] as const)(
    "is UNSOLVED when %s is missing",
    (field) => {
      const solved = solveConfiguration(
        goldenConfiguration({ [field]: null } as Partial<CockpitConfiguration>),
        goldenFrame,
      );
      expect(solved.status).toBe("UNSOLVED");
      expect(solved.unsolvedReason).toBe("MISSING_COCKPIT_INPUTS");
      expect(solved.missingInputs).toContain(field);
    },
  );
});
