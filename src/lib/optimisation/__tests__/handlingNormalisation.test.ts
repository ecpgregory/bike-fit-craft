import { describe, expect, it } from "vitest";

import {
  HANDLING_DECAY_MM,
  POSITION_DECAY_MM,
  defaultNormalisationStrategy,
  exponentialHandlingNormalisation,
  rankConfigurations,
} from "@/lib/rankingEngine";
import type { FitAssessment } from "@/types/optimisation";
import { availableMetric, unavailableMetric } from "@/types/optimisation";

/**
 * Sprint 11C — handling-score normalisation scale.
 *
 * The handling metric is a handlebar-width error in millimetres, so it is
 * normalised with the same exponential form as position but its own explicit
 * length scale. 20 mm is the manufactured road-handlebar width step
 * (360/380/400/420/440): one decay length = one size the rider could actually
 * buy. These tests pin the constant, the shape and the numerical behaviour.
 */

const context = { cohort: [] };
const n = (mm: number) => exponentialHandlingNormalisation(mm, context);

function assessment(
  candidateId: string,
  distance: number,
  widthError: number | null,
): FitAssessment {
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
    cockpitMetric: unavailableMetric("COCKPIT_GEOMETRY_UNAVAILABLE"),
    handlingMetric:
      widthError === null
        ? unavailableMetric("HANDLING_TARGET_UNAVAILABLE")
        : availableMetric(widthError),
    geometryWarnings: [],
    constraintStatus: "VALID",
    notes: [],
  };
}

describe("Sprint 11C — handling decay scale", () => {
  it("uses a single named 20 mm constant, wired into the default strategy", () => {
    expect(HANDLING_DECAY_MM).toBe(20);
    expect(defaultNormalisationStrategy.handling).toBe(exponentialHandlingNormalisation);
  });

  it("scores exactly 1 at zero width error", () => {
    expect(n(0)).toBe(1);
  });

  it("produces the documented curve at representative errors", () => {
    const expected: Array<[number, number]> = [
      [0, 1],
      [5, Math.exp(-0.25)], // 0.7788
      [10, Math.exp(-0.5)], // 0.6065
      [20, Math.exp(-1)], // 0.3679 — one handlebar size step
      [30, Math.exp(-1.5)], // 0.2231
      [40, Math.exp(-2)], // 0.1353 — two size steps
      [60, Math.exp(-3)], // 0.0498
    ];
    for (const [mm, value] of expected) expect(n(mm)).toBeCloseTo(value, 12);
  });

  it("is monotonically decreasing and bounded in (0, 1]", () => {
    const errors = [0, 5, 10, 20, 30, 40, 60];
    const scores = errors.map(n);
    for (const score of scores) {
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    }
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i]!).toBeLessThan(scores[i - 1]!);
    }
  });

  it("is deterministic and numerically stable at extremes", () => {
    for (const mm of [0, 5, 20, 60]) expect(n(mm)).toBe(n(mm));
    expect(n(-20)).toBe(n(20)); // sign-independent: it is an absolute error
    expect(n(1e6)).toBe(0); // underflows to 0, never negative or NaN
    expect(Number.isNaN(n(Number.NaN))).toBe(false);
    expect(n(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("keeps handling one step per size while position stays one band per 10 mm", () => {
    // Both components now decay by 1/e over one physically meaningful unit.
    expect(POSITION_DECAY_MM).toBe(10);
    expect(HANDLING_DECAY_MM / POSITION_DECAY_MM).toBe(2);
  });

  it("greatly reduces the score a one-size width difference gives away", () => {
    // Pre-fix (reciprocal, 1 mm scale) a 20 mm difference scored 1/21 = 0.048,
    // i.e. an exact match was ~21x better. It is now ~2.7x better.
    expect(n(20)).toBeCloseTo(0.3679, 4);
    expect(1 / n(20)).toBeLessThan(3);
  });

  it("still lets width decide between closely matched positions", () => {
    const [first] = rankConfigurations({
      validConfigurations: [
        assessment("same-position-wrong-width", 18, 40),
        assessment("same-position-right-width", 18, 0),
      ],
      invalidConfigurations: [],
    }).rankedConfigurations;

    expect(first!.candidateId).toBe("same-position-right-width");
  });
});

/**
 * D-11C-1 — RESOLVED in Sprint 11D by the combiner, not by the scale.
 *
 * Sprint 11C established that the 20 mm decay scale is correct but not
 * sufficient: under the arithmetic mean an available handling component
 * contributed up to 1/n of the overall score no matter how bad the position
 * score was, and an exact width match scores 1.0 at ANY decay scale, so no
 * value of HANDLING_DECAY_MM could remove the floor (second test below).
 *
 * Sprint 11D replaced the combiner with a weighted geometric mean, which is
 * conjunctive rather than compensatory. The synthetic case below is the
 * original defect case, now asserting the fixed behaviour:
 *
 *   better-position: exp(-18/10)=0.165299, exp(-20/20)=0.367879
 *                    → sqrt(0.165299 × 0.367879) = 0.246642
 *   exact-width:     exp(-76.5/10)=0.000476, exp(-0/20)=1
 *                    → sqrt(0.000476 × 1) = 0.021818
 *
 * The perfect secondary component no longer creates a floor: it can at best
 * lift the score to sqrt(position), which for a hopeless position is still
 * hopeless.
 */
describe("D-11C-1 — resolved: the geometric mean removes the perfect-component floor", () => {
  it("no longer lets an exact width match outrank a far better position", () => {
    const [first, second] = rankConfigurations({
      validConfigurations: [
        assessment("better-position", 18, 20),
        assessment("exact-width", 76.5, 0),
      ],
      invalidConfigurations: [],
    }).rankedConfigurations;

    expect(first!.candidateId).toBe("better-position");
    expect(first!.overallScore).toBeCloseTo(
      Math.sqrt(Math.exp(-1.8) * Math.exp(-1)),
      12,
    );
    expect(second!.candidateId).toBe("exact-width");
    // Ceiling of a perfect secondary component is sqrt(position), not 0.5.
    expect(second!.overallScore).toBeCloseTo(Math.sqrt(Math.exp(-7.65)), 12);
    expect(second!.overallScore).toBeLessThan(0.5);
  });

  it("shows no handling decay scale could have removed the arithmetic floor", () => {
    // An exact match normalises to 1 for every possible decay length.
    for (const decay of [1, 20, 100, 10_000]) {
      expect(Math.exp(-0 / decay)).toBe(1);
    }
    // The scale that would be needed makes handling almost flat: at ~114 mm a
    // 60 mm width error still scores 0.59, so width would barely discriminate.
    const requiredDecay = 20 / Math.log(1 / (1.0005 - 0.1616));
    expect(requiredDecay).toBeGreaterThan(110);
    expect(Math.exp(-60 / requiredDecay)).toBeGreaterThan(0.5);
  });
});

