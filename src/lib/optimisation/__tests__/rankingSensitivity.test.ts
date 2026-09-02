import { describe, expect, it } from "vitest";

import type { RiderProfile } from "@/types";
import { riderProfile } from "@/data/rider-profile";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { FleetOptimisationResult } from "@/lib/optimisation/fleetOptimisationEngine";
import { defaultScoringWeights } from "@/lib/rankingEngine";
import { sensitivityTargets, sensitivityWidths } from "./fitTargets";

/**
 * Sprint 11B — ranking sensitivity matrix.
 *
 * Runs the whole production fleet across the five established rider-fit
 * targets and seven handlebar-width conditions (35 runs) and asserts
 * structural invariants only. Nothing here tunes the scoring model; the
 * matrix results themselves are reported in docs/SCORING_MODEL.md.
 */

function riderWith(width: number | null): RiderProfile {
  return { ...riderProfile, targetHandlebarWidth: width };
}

function runMatrix(): Array<{
  target: (typeof sensitivityTargets)[number];
  width: number | null;
  fleet: FleetOptimisationResult;
}> {
  const runs = [];
  for (const target of sensitivityTargets) {
    for (const width of sensitivityWidths) {
      runs.push({ target, width, fleet: optimiseFleet({ target, rider: riderWith(width) }) });
    }
  }
  return runs;
}

const matrix = runMatrix();

describe("Sprint 11B — ranking sensitivity matrix", () => {
  it("covers 35 fleet runs", () => {
    expect(matrix).toHaveLength(35);
  });

  it("produces finite, ordered scores in every run", () => {
    for (const { fleet } of matrix) {
      const scores = fleet.rankedBikes.map((b) => b.overallScore);
      for (const score of scores) {
        expect(Number.isFinite(score)).toBe(true);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
      }
      expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    }
  });

  it("keeps the ranked and unranked bike sets independent of the width target", () => {
    for (const target of sensitivityTargets) {
      const perWidth = sensitivityWidths.map((width) =>
        optimiseFleet({ target, rider: riderWith(width) }),
      );
      const baseline = new Set(perWidth[0]!.rankedBikes.map((b) => b.bikeId));
      for (const fleet of perWidth) {
        expect(new Set(fleet.rankedBikes.map((b) => b.bikeId))).toEqual(baseline);
        // Unrankable bikes are unrankable for data reasons, never scoring ones.
        for (const unranked of fleet.unrankedBikes) {
          expect(unranked.outcome).toBe("NO_CANDIDATES");
        }
      }
    }
  });

  it("leaves the positional component untouched by the width target", () => {
    for (const target of sensitivityTargets) {
      const positionOnly = optimiseFleet({ target, rider: riderWith(null) });
      const distances = new Map(
        positionOnly.rankedBikes.map((b) => [
          b.bikeId,
          b.bestConfiguration.assessment.positionMetrics.euclideanDistance,
        ]),
      );
      for (const width of sensitivityWidths) {
        const fleet = optimiseFleet({ target, rider: riderWith(width) });
        for (const bike of fleet.rankedBikes) {
          expect(
            bike.bestConfiguration.assessment.positionMetrics.euclideanDistance,
          ).toBeCloseTo(distances.get(bike.bikeId)!, 10);
        }
      }
    }
  });

  it("keeps the outcome classification independent of scoring", () => {
    // Outcome is a positional-envelope classification only, so it must not
    // move when a handling target is supplied.
    for (const target of sensitivityTargets) {
      const baseline = new Map(
        optimiseFleet({ target, rider: riderWith(null) }).rankedBikes.map((b) => [
          b.bikeId,
          b.outcome,
        ]),
      );
      for (const width of sensitivityWidths) {
        for (const bike of optimiseFleet({ target, rider: riderWith(width) })
          .rankedBikes) {
          expect(bike.outcome).toBe(baseline.get(bike.bikeId));
        }
      }
    }
  });

  it("scores position only when no width target is stated", () => {
    for (const { width, fleet } of matrix) {
      if (width !== null) continue;
      for (const bike of fleet.rankedBikes) {
        expect(bike.bestConfiguration.componentScores.normalised.handling).toBeNull();
        expect(bike.overallScore).toBeCloseTo(
          bike.bestConfiguration.componentScores.normalised.position,
          12,
        );
      }
    }
  });

  it("never penalises a bike for having no documented handlebar width", () => {
    for (const { fleet } of matrix) {
      for (const bike of fleet.rankedBikes) {
        const metric = bike.bestConfiguration.assessment.handlingMetric;
        if (metric.available) continue;
        expect(metric.value).toBeNull();
        expect(bike.overallScore).toBeCloseTo(
          bike.bestConfiguration.componentScores.normalised.position,
          12,
        );
      }
    }
  });

  it("responds to the width target where a width is documented", () => {
    // Cannondale LAB71 documents 360 mm: an exact match must score better
    // than a 60 mm mismatch, with identical position.
    const target = { x: 470, y: 631 };
    const id = "cannondale-supersix-evo-lab71-54";
    const exact = optimiseFleet({ target, rider: riderWith(360) }).rankedBikes.find(
      (b) => b.bikeId === id,
    )!;
    const mismatched = optimiseFleet({ target, rider: riderWith(420) }).rankedBikes.find(
      (b) => b.bikeId === id,
    )!;

    expect(exact.bestConfiguration.assessment.handlingMetric.value).toBe(0);
    expect(mismatched.bestConfiguration.assessment.handlingMetric.value).toBe(60);
    expect(exact.overallScore).toBeGreaterThan(mismatched.overallScore);
  });

  it("is deterministic across repeated identical runs", () => {
    const signature = (fleet: FleetOptimisationResult) =>
      fleet.rankedBikes.map((b) => `${b.bikeId}:${b.overallScore.toFixed(12)}`).join("|");
    for (const { target, width } of matrix) {
      const a = optimiseFleet({ target, rider: riderWith(width) });
      const b = optimiseFleet({ target, rider: riderWith(width) });
      expect(signature(a)).toBe(signature(b));
    }
  });
});

/**
 * D-11B-1 (raised Sprint 11B) — Sprint 11C PARTIAL fix.
 *
 * Position is normalised on a 10 mm exponential scale; handling now uses
 * `exp(-widthError / HANDLING_DECAY_MM)` with an explicit 20 mm scale (one
 * manufactured handlebar size step) instead of the reciprocal's implicit
 * 1 mm scale. That removes the scale mismatch and roughly halves the
 * advantage a width match confers.
 *
 * It does NOT fully resolve the ranking inversion, because the residual
 * mechanism is the arithmetic-mean combiner rather than the scale — see
 * D-11C-1 in handlingNormalisation.test.ts and docs/SCORING_MODEL.md. These
 * tests measure the improvement and lock the residual honestly.
 */
describe("D-11B-1 — Sprint 11C normalisation fix, measured at fleet level", () => {
  const TARGET = { x: 490, y: 650 };

  it("materially closes the gap between better position and exact width", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderWith(420) });

    const tcr = fleet.rankedBikes.find(
      (b) => b.bikeId === "giant-tcr-advanced-sl-0-2025-m",
    )!;
    const bmc = fleet.rankedBikes.find((b) => b.bikeId === "bmc-teammachine-slr01-56")!;

    // Premise: TCR matches the width exactly but fits far worse.
    expect(tcr.bestConfiguration.assessment.handlingMetric.value).toBe(0);
    expect(bmc.bestConfiguration.assessment.handlingMetric.value).toBe(20);
    expect(
      tcr.bestConfiguration.assessment.positionMetrics.euclideanDistance -
        bmc.bestConfiguration.assessment.positionMetrics.euclideanDistance,
    ).toBeGreaterThan(50);

    // Sprint 11B: BMC scored 0.1046 against TCR-M's 0.5002 (4.8x).
    // Sprint 11C: BMC scores 0.2647 against an unchanged 0.5002 (1.9x).
    expect(bmc.overallScore).toBeCloseTo(0.2647, 4);
    expect(tcr.overallScore / bmc.overallScore).toBeLessThan(2);
  });

  it("RESIDUAL D-11C-1 — the mean still floors an exact width match at 0.5", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderWith(420) });
    const first = fleet.rankedBikes[0]!;

    // Locked, not endorsed: an exact-width bike 58 mm out still leads.
    expect(first.bikeId).toBe("giant-tcr-advanced-sl-0-2025-ml");
    expect(first.overallScore).toBeGreaterThan(0.5);
    expect(first.bestConfiguration.componentScores.normalised.handling).toBe(1);
    expect(first.outcome).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("leaves rankings correct wherever no bike matches the width exactly", () => {
    for (const target of sensitivityTargets) {
      for (const width of sensitivityWidths) {
        const ranked = optimiseFleet({ target, rider: riderWith(width) }).rankedBikes;
        const exactMatchPresent = ranked.some(
          (b) => b.bestConfiguration.assessment.handlingMetric.value === 0,
        );
        if (exactMatchPresent) continue;

        // With no perfect component to floor the mean, the leader is always
        // a bike inside the fit envelope when one exists.
        const anySuccess = ranked.some((b) => b.outcome === "SUCCESS");
        if (anySuccess) expect(ranked[0]!.outcome).toBe("SUCCESS");
      }
    }
  });


  it("weights remain 1:1:1 — the fix is entirely in normalisation", () => {
    expect(defaultScoringWeights).toEqual({
      positionWeight: 1,
      cockpitWeight: 1,
      handlingWeight: 1,
    });
  });

});

