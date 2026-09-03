import { describe, expect, it } from "vitest";

import {
  HANDLING_DECAY_MM,
  POSITION_DECAY_MM,
  defaultScoringWeights,
  exponentialHandlingNormalisation,
  exponentialPositionNormalisation,
  reciprocalNormalisation,
  weightedGeometricMeanCombination,
  weightedMeanCombination,
} from "@/lib/rankingEngine";
import type { ScoringInputs, ScoringWeights } from "@/lib/rankingEngine";

/**
 * Sprint 11D — weighted geometric score combiner.
 *
 *   overallScore = exp( Σ wᵢ·ln(sᵢ) / Σ wᵢ )   over AVAILABLE components only
 *
 * The combiner receives weighted values (sᵢ·wᵢ) and divides the weight back
 * out, so these helpers construct inputs the same way the ranking pipeline
 * does. Nothing here tunes the model: weights, normalisers, availability rules
 * and the fit envelope are all unchanged from Sprint 11C.
 */

const EQUAL: ScoringWeights = { positionWeight: 1, cockpitWeight: 1, handlingWeight: 1 };
const ctx = { cohort: [] as ScoringInputs[] };

/** Builds the weighted input the pipeline passes to a combiner. */
function weighted(
  scores: { position: number | null; cockpit?: number | null; handling?: number | null },
  weights: ScoringWeights = EQUAL,
): ScoringInputs {
  return {
    position: (scores.position ?? 0) * weights.positionWeight,
    cockpit: scores.cockpit == null ? null : scores.cockpit * weights.cockpitWeight,
    handling: scores.handling == null ? null : scores.handling * weights.handlingWeight,
  };
}

const combine = (
  scores: Parameters<typeof weighted>[0],
  weights: ScoringWeights = EQUAL,
) => weightedGeometricMeanCombination(weighted(scores, weights), weights);

describe("Sprint 11D — weighted geometric mean, mathematical properties", () => {
  it("equal component scores return that score", () => {
    for (const s of [0.05, 0.25, 0.5, 0.9, 1]) {
      expect(combine({ position: s, cockpit: s, handling: s })).toBeCloseTo(s, 12);
    }
  });

  it("all available components = 1 gives exactly 1", () => {
    expect(combine({ position: 1, handling: 1 })).toBeCloseTo(1, 12);
    expect(combine({ position: 1, cockpit: 1, handling: 1 })).toBeCloseTo(1, 12);
  });

  it("one component = 1 creates no arithmetic-style floor", () => {
    // Arithmetic mean floors this at 0.5; the geometric mean does not.
    const arithmetic = weightedMeanCombination(
      weighted({ position: 0.0005, handling: 1 }),
      EQUAL,
    );
    const geometric = combine({ position: 0.0005, handling: 1 });
    expect(arithmetic).toBeGreaterThan(0.5);
    expect(geometric).toBeCloseTo(Math.sqrt(0.0005), 12);
    expect(geometric).toBeLessThan(0.03);
  });

  it("lowering any component lowers the overall score", () => {
    const base = combine({ position: 0.5, handling: 0.5 });
    expect(combine({ position: 0.4, handling: 0.5 })).toBeLessThan(base);
    expect(combine({ position: 0.5, handling: 0.4 })).toBeLessThan(base);
  });

  it("raising one component while holding others constant raises the score", () => {
    let previous = -Infinity;
    for (const handling of [0.1, 0.2, 0.4, 0.8, 1]) {
      const score = combine({ position: 0.3, handling });
      expect(score).toBeGreaterThan(previous);
      previous = score;
    }
  });

  it("an unavailable component has no effect at all", () => {
    const only = combine({ position: 0.42, cockpit: null, handling: null });
    expect(only).toBeCloseTo(0.42, 12);
    expect(combine({ position: 0.42, cockpit: null, handling: 0.42 })).toBeCloseTo(
      0.42,
      12,
    );
  });

  it("equal weights reduce to the ordinary geometric mean", () => {
    expect(combine({ position: 0.2, handling: 0.8 })).toBeCloseTo(
      Math.sqrt(0.2 * 0.8),
      12,
    );
    expect(combine({ position: 0.2, cockpit: 0.5, handling: 0.8 })).toBeCloseTo(
      Math.cbrt(0.2 * 0.5 * 0.8),
      12,
    );
  });

  it("honours unequal weights when supplied (production weights stay 1:1:1)", () => {
    const weights: ScoringWeights = {
      positionWeight: 3,
      cockpitWeight: 1,
      handlingWeight: 1,
    };
    const result = combine({ position: 0.2, handling: 0.8 }, weights);
    expect(result).toBeCloseTo(Math.exp((3 * Math.log(0.2) + Math.log(0.8)) / 4), 12);
    // Untouched by this test — the production weights are still equal.
    expect(defaultScoringWeights).toEqual(EQUAL);
  });

  it("is deterministic on repeated calculation", () => {
    const input = { position: 0.161613, handling: 0.367879 };
    const first = combine(input);
    for (let i = 0; i < 50; i += 1) expect(combine(input)).toBe(first);
  });

  it("returns 0 when nothing is available", () => {
    expect(
      weightedGeometricMeanCombination(
        { position: null as unknown as number, cockpit: null, handling: null },
        EQUAL,
      ),
    ).toBe(0);
  });
});

describe("Sprint 11D — one-component behaviour is exactly pass-through", () => {
  it("position only", () => {
    for (const s of [0.001, 0.1, 0.5, 1]) {
      expect(combine({ position: s })).toBe(s);
    }
  });

  it("position + handling collapses to position when handling is unavailable", () => {
    for (const s of [0.001, 0.1, 0.5, 1]) {
      expect(combine({ position: s, handling: null })).toBe(s);
    }
  });
});

/**
 * The sprint brief forbids a defensive epsilon clamp unless the production
 * score domain actually requires one. These tests establish that it does not:
 * both production normalisers are strictly positive for every realistic
 * input, so a finite realistic configuration can never combine to zero.
 */
describe("Sprint 11D — no realistic input can reach an exact zero", () => {
  it("handling exponential normalisation is strictly positive across 0–60 mm", () => {
    expect(HANDLING_DECAY_MM).toBe(20);
    for (let mm = 0; mm <= 60; mm += 1) {
      const s = exponentialHandlingNormalisation(mm, ctx);
      expect(s).toBeGreaterThan(0);
      expect(Number.isFinite(s)).toBe(true);
    }
    // Even an absurd width error stays above zero.
    expect(exponentialHandlingNormalisation(400, ctx)).toBeGreaterThan(0);
  });

  it("position exponential normalisation is strictly positive across 0–200 mm", () => {
    expect(POSITION_DECAY_MM).toBe(10);
    for (let mm = 0; mm <= 200; mm += 1) {
      expect(exponentialPositionNormalisation(mm, ctx)).toBeGreaterThan(0);
    }
  });

  it("cockpit reciprocal normalisation is strictly positive at realistic magnitudes", () => {
    for (const mm of [0, 1, 5, 20, 100, 500]) {
      expect(reciprocalNormalisation(mm, ctx)).toBeGreaterThan(0);
    }
  });

  it("combines the worst realistic component pair to a finite non-zero score", () => {
    const worst = combine({
      position: exponentialPositionNormalisation(200, ctx),
      handling: exponentialHandlingNormalisation(60, ctx),
    });
    expect(Number.isFinite(worst)).toBe(true);
    expect(worst).toBeGreaterThan(0);
    expect(worst).toBeLessThan(1);
  });
});

/**
 * Synthetic D-11C-1 regression, expressed purely in the scoring algebra so it
 * cannot drift with production data.
 */
describe("Sprint 11D — synthetic D-11C-1 regression", () => {
  const veryPoorPosition = exponentialPositionNormalisation(76.5, ctx); // 0.000476
  const goodPosition = exponentialPositionNormalisation(18, ctx); // 0.165299
  const perfectHandling = exponentialHandlingNormalisation(0, ctx); // 1
  const imperfectHandling = exponentialHandlingNormalisation(20, ctx); // 0.367879

  it("the arithmetic mean ranked perfect handling above a far better position", () => {
    const masking = weightedMeanCombination(
      weighted({ position: veryPoorPosition, handling: perfectHandling }),
      EQUAL,
    );
    const honest = weightedMeanCombination(
      weighted({ position: goodPosition, handling: imperfectHandling }),
      EQUAL,
    );
    expect(masking).toBeGreaterThan(honest); // the defect, reproduced
    expect(masking).toBeGreaterThan(0.5); // the 1/n floor
  });

  it("the geometric mean reverses it and removes the floor", () => {
    const masking = combine({ position: veryPoorPosition, handling: perfectHandling });
    const honest = combine({ position: goodPosition, handling: imperfectHandling });
    expect(honest).toBeGreaterThan(masking);
    expect(masking).toBeCloseTo(Math.sqrt(veryPoorPosition), 12);
    expect(masking).toBeLessThan(0.05);
  });
});
