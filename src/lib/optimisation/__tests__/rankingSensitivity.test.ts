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
 * D-11B-1 (Sprint 11B) → D-11C-1 (Sprint 11C residual) → RESOLVED Sprint 11D.
 *
 * Sprint 11C fixed the normalisation SCALE (handling now decays on an explicit
 * 20 mm scale, one manufactured handlebar size step) but the ranking inversion
 * survived because the arithmetic-mean combiner floored a perfect component at
 * 1/n. Sprint 11D replaced the combiner with a weighted geometric mean.
 *
 * Baseline re-derivation for the BMC 56 assertion below (490/650 @ 420 mm):
 *   position 18.23 mm → exp(-18.23/10) = 0.161613
 *   width error 20 mm → exp(-20/20)    = 0.367879
 *   arithmetic (11C):  (0.161613 + 0.367879)/2 = 0.264746
 *   geometric  (11D):  sqrt(0.161613 × 0.367879) = 0.243832
 * The drop is the expected conjunctive penalty, not a regression: neither
 * component score changed, only how they combine.
 */
describe("D-11C-1 — Sprint 11D geometric combiner, measured at fleet level", () => {
  const TARGET = { x: 490, y: 650 };

  it("closes the gap between better position and exact width", () => {
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

    // Sprint 11B: BMC 0.1046 vs TCR-M 0.5002 (TCR 4.8x ahead).
    // Sprint 11C: BMC 0.2647 vs TCR-M 0.5002 (TCR 1.9x ahead).
    // Sprint 11D: BMC 0.2438 vs TCR-M 0.0218 — BMC now correctly ahead.
    const n = bmc.bestConfiguration.componentScores.normalised;
    expect(bmc.overallScore).toBeCloseTo(Math.sqrt(n.position * n.handling!), 12);
    expect(bmc.overallScore).toBeCloseTo(0.2438, 4);
    expect(bmc.overallScore).toBeGreaterThan(tcr.overallScore);
  });

  it("the fleet leader is now the best-fitting bike, not the exact-width one", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderWith(420) });
    const first = fleet.rankedBikes[0]!;

    expect(first.bikeId).toBe("bmc-teammachine-slr01-56");

    // The former leader — exact width, 58 mm out of position — is demoted.
    const tcrMl = fleet.rankedBikes.find(
      (b) => b.bikeId === "giant-tcr-advanced-sl-0-2025-ml",
    )!;
    expect(tcrMl.bestConfiguration.componentScores.normalised.handling).toBe(1);
    expect(tcrMl.outcome).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(tcrMl.overallScore).toBeLessThan(first.overallScore);
    expect(
      first.bestConfiguration.assessment.positionMetrics.euclideanDistance,
    ).toBeLessThan(tcrMl.bestConfiguration.assessment.positionMetrics.euclideanDistance);
    // A perfect secondary component can lift a score only to sqrt(position).
    expect(tcrMl.overallScore).toBeCloseTo(
      Math.sqrt(tcrMl.bestConfiguration.componentScores.normalised.position),
      12,
    );
  });

  it("never lets a worse-fitting bike lead a better-fitting one on width alone", () => {
    // Sprint 12A.5: the fit envelope is a classification, not a ranking input,
    // so dominance is measured on positional error, not on outcome labels.
    for (const target of sensitivityTargets) {
      for (const width of sensitivityWidths) {
        const ranked = optimiseFleet({ target, rider: riderWith(width) }).rankedBikes;
        if (ranked.length === 0) continue;
        const leaderError =
          ranked[0]!.bestConfiguration.assessment.positionMetrics.euclideanDistance;
        const bestError = Math.min(
          ...ranked.map(
            (b) => b.bestConfiguration.assessment.positionMetrics.euclideanDistance,
          ),
        );
        expect(leaderError).toBeCloseTo(bestError, 6);
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

