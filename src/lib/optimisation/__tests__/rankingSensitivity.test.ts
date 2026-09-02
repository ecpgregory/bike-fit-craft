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
 * REGRESSION — defect D-11B-1 (raised Sprint 11B, fixed Sprint 11C).
 *
 * Position was normalised on a 10 mm exponential scale while handling used
 * the default reciprocal normaliser with an implicit 1 mm scale, so an exact
 * bar-width match (1.0) swamped a component carrying far more positional
 * information. Handling now uses `exp(-widthError / HANDLING_DECAY_MM)` with
 * an explicit 20 mm scale (one manufactured handlebar size step).
 *
 * These tests assert the scoring behaviour — a materially worse position
 * cannot be rescued by a one-size width advantage — not a bike-specific
 * ranking.
 */
describe("D-11B-1 regression — position is not overwhelmed by handlebar width", () => {
  const TARGET = { x: 490, y: 650 };

  it("keeps a materially better RP3 position ahead of a small width advantage", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderWith(420) });

    const tcr = fleet.rankedBikes.find((b) => b.bikeId === "giant-tcr-advanced-sl-0-2025-m")!;
    const bmc = fleet.rankedBikes.find((b) => b.bikeId === "bmc-teammachine-slr01-56")!;

    const tcrDistance = tcr.bestConfiguration.assessment.positionMetrics.euclideanDistance;
    const bmcDistance = bmc.bestConfiguration.assessment.positionMetrics.euclideanDistance;
    const tcrWidthError = tcr.bestConfiguration.assessment.handlingMetric.value!;
    const bmcWidthError = bmc.bestConfiguration.assessment.handlingMetric.value!;

    // Guard the premise: TCR matches the width exactly but fits far worse.
    expect(tcrWidthError).toBe(0);
    expect(bmcWidthError).toBe(20); // one handlebar size step
    expect(tcrDistance - bmcDistance).toBeGreaterThan(50);
    expect(tcr.outcome).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(bmc.outcome).toBe("SUCCESS");

    // The scoring model must prefer the far better position.
    expect(bmc.overallScore).toBeGreaterThan(tcr.overallScore);
    expect(fleet.rankedBikes.indexOf(bmc)).toBeLessThan(fleet.rankedBikes.indexOf(tcr));
  });

  it("never ranks an OUTSIDE_FIT_ENVELOPE bike above a SUCCESS bike on width alone", () => {
    for (const width of sensitivityWidths) {
      for (const target of sensitivityTargets) {
        const ranked = optimiseFleet({ target, rider: riderWith(width) }).rankedBikes;
        const bestOutside = ranked.find((b) => b.outcome === "OUTSIDE_FIT_ENVELOPE");
        const worstSuccess = [...ranked]
          .reverse()
          .find((b) => b.outcome === "SUCCESS");
        if (!bestOutside || !worstSuccess) continue;

        // Any inversion must be explainable by position, not by width alone.
        if (bestOutside.overallScore > worstSuccess.overallScore) {
          const outsideDistance =
            bestOutside.bestConfiguration.assessment.positionMetrics.euclideanDistance;
          const successDistance =
            worstSuccess.bestConfiguration.assessment.positionMetrics.euclideanDistance;
          expect(outsideDistance - successDistance).toBeLessThan(10);
        }
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

