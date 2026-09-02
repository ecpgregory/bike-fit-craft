import { describe, expect, it } from "vitest";

import type { RiderProfile } from "@/types";
import { riderProfile } from "@/data/rider-profile";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { FleetOptimisationResult } from "@/lib/optimisation/fleetOptimisationEngine";
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
 * FINDING (Sprint 11B, defect D-11B-1) — handling can outrank position.
 *
 * The positional component is normalised with an exponential whose length
 * scale is 10 mm, while the handling component still uses the default
 * reciprocal normaliser whose implicit length scale is 1 mm. With equal
 * weights, an exact width match scores 1.0 while a 20 mm width difference
 * scores 0.048, so handling can dominate a component with far more
 * positional information.
 *
 * The test below LOCKS the observed behaviour rather than asserting the
 * desired behaviour. It is documentation of a demonstrated defect, not an
 * endorsement: see docs/SCORING_MODEL.md for the proposed follow-up.
 */
describe("Sprint 11B — demonstrated defect: handling/position scale mismatch", () => {
  it("lets an exact width match outrank a materially better RP3 position", () => {
    const fleet = optimiseFleet({
      target: { x: 490, y: 650 },
      rider: riderWith(420),
    });

    const first = fleet.rankedBikes[0]!;
    const bmc = fleet.rankedBikes.find((b) => b.bikeId === "bmc-teammachine-slr01-56")!;

    // Giant TCR: 420 mm bars (exact match) but ~58 mm of RP3 error.
    expect(first.bikeId).toBe("giant-tcr-advanced-sl-0-2025-ml");
    expect(
      first.bestConfiguration.assessment.positionMetrics.euclideanDistance,
    ).toBeGreaterThan(50);
    expect(first.outcome).toBe("OUTSIDE_FIT_ENVELOPE");

    // BMC: 18 mm of RP3 error and inside the fit envelope, yet ranked below.
    expect(
      bmc.bestConfiguration.assessment.positionMetrics.euclideanDistance,
    ).toBeLessThan(20);
    expect(bmc.outcome).toBe("SUCCESS");
    expect(bmc.overallScore).toBeLessThan(first.overallScore);
  });

  it("shows the scale mismatch is in normalisation, not in the weights", () => {
    const fleet = optimiseFleet({
      target: { x: 490, y: 650 },
      rider: riderWith(420),
    });
    const tcr = fleet.rankedBikes[0]!.bestConfiguration.componentScores.normalised;

    // Weights are 1:1:1 by design; the disparity is entirely normalisation.
    expect(tcr.handling).toBeCloseTo(1, 10);
    expect(tcr.position).toBeLessThan(0.01);
  });
});
