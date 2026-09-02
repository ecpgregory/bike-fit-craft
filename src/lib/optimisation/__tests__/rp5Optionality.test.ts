import { describe, expect, it } from "vitest";

import type { RiderProfile } from "@/types";
import { riderProfile } from "@/data/rider-profile";
import { bikes as productionBikes } from "@/data/bikes";
import {
  calculateCockpitMetric,
  cockpitTargetFromRider,
} from "@/lib/errorCalculator";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { rankConfigurations } from "@/lib/rankingEngine";
import type { FitAssessment, SolvedConfiguration } from "@/types/optimisation";
import { availableMetric, unavailableMetric } from "@/types/optimisation";

/**
 * Sprint 11B — RP5 is an OPTIONAL metric.
 *
 * These tests prove two things and change nothing:
 *  1. the production fleet optimises and ranks with RP5 unavailable, and
 *  2. the same architecture activates the cockpit component unchanged the
 *     moment real RP5 geometry and a rider cockpit target exist.
 *
 * Any RP5 coordinates below are synthetic and confined to this file. No RP5
 * value is added to production bike data.
 */

const TARGET = { x: 470, y: 631 };

function riderWith(overrides: Partial<RiderProfile>): RiderProfile {
  return { ...riderProfile, ...overrides };
}

function assessment(overrides: Partial<FitAssessment> = {}): FitAssessment {
  return {
    candidateId: "c1",
    positionMetrics: {
      deltaX: 3,
      deltaY: 4,
      absoluteDeltaX: 3,
      absoluteDeltaY: 4,
      euclideanDistance: 5,
    },
    cockpitPenaltyBreakdown: {
      nonStockStem: 0,
      nonStockCockpit: 0,
      nonStockSpacerConfiguration: 0,
    },
    handlingPenaltyBreakdown: { stemLengthPenalty: 0, spacerPenalty: 0 },
    cockpitMetric: unavailableMetric("COCKPIT_GEOMETRY_UNAVAILABLE"),
    handlingMetric: unavailableMetric("HANDLING_TARGET_UNAVAILABLE"),
    geometryWarnings: [],
    constraintStatus: "VALID",
    notes: [],
    ...overrides,
  };
}

function finite(value: number | null): boolean {
  return value === null || Number.isFinite(value);
}

describe("Sprint 11B — the production fleet optimises with RP5 unavailable", () => {
  it("solves no RP5 anywhere in the production fleet", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderProfile });
    for (const ranked of fleet.rankedBikes) {
      expect(ranked.bestConfiguration.assessment.cockpitMetric.available).toBe(false);
      expect(ranked.bestConfiguration.assessment.cockpitMetric.value).toBeNull();
    }
  });

  it("ranks eligible bikes for a rider with a position target only", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderProfile });

    expect(fleet.totalBikes).toBe(productionBikes.length);
    expect(fleet.rankedBikes.length).toBeGreaterThan(0);

    for (const ranked of fleet.rankedBikes) {
      const scores = ranked.bestConfiguration.componentScores;
      expect(Number.isFinite(ranked.overallScore)).toBe(true);
      expect(ranked.overallScore).toBeGreaterThan(0);
      // Position only → overall score IS the normalised positional score.
      expect(ranked.overallScore).toBeCloseTo(scores.normalised.position, 12);
      expect(scores.normalised.cockpit).toBeNull();
      expect(scores.normalised.handling).toBeNull();
    }
  });

  it("ranks the same bikes when a handlebar-width target is added", () => {
    const positionOnly = optimiseFleet({ target: TARGET, rider: riderProfile });
    const withWidth = optimiseFleet({
      target: TARGET,
      rider: riderWith({ targetHandlebarWidth: 400 }),
    });

    // Adding a handling target scores differently; it must never make a
    // previously viable bike unrankable.
    expect(new Set(withWidth.rankedBikes.map((b) => b.bikeId))).toEqual(
      new Set(positionOnly.rankedBikes.map((b) => b.bikeId)),
    );
    expect(withWidth.unrankedBikes.map((b) => b.bikeId)).toEqual(
      positionOnly.unrankedBikes.map((b) => b.bikeId),
    );
  });

  it("scores bikes with and without a documented width in the same fleet", () => {
    const fleet = optimiseFleet({
      target: TARGET,
      rider: riderWith({ targetHandlebarWidth: 400 }),
    });

    const documented = fleet.rankedBikes.filter(
      (b) => b.bestConfiguration.assessment.handlingMetric.available,
    );
    const undocumented = fleet.rankedBikes.filter(
      (b) => !b.bestConfiguration.assessment.handlingMetric.available,
    );

    // The production fleet genuinely contains both kinds.
    expect(documented.length).toBeGreaterThan(0);
    expect(undocumented.length).toBeGreaterThan(0);

    for (const bike of undocumented) {
      const metric = bike.bestConfiguration.assessment.handlingMetric;
      expect(metric.value).toBeNull();
      expect(metric.unavailableReason).toBe("HANDLING_INPUT_UNAVAILABLE");
      // Excluded from the mean, not scored zero: overall === position.
      expect(bike.overallScore).toBeCloseTo(
        bike.bestConfiguration.componentScores.normalised.position,
        12,
      );
    }
  });

  it("never reports NO_CANDIDATES because RP5 is unavailable", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderProfile });
    for (const unranked of fleet.unrankedBikes) {
      for (const rejected of unranked.rejectedConfigurations) {
        expect(rejected.unsolvedReason).not.toBe("MISSING_COCKPIT_INPUTS");
      }
    }
    // Bikes lacking RP5 but with complete frame/stem data are still ranked.
    expect(fleet.rankedBikes.length).toBeGreaterThanOrEqual(12);
  });

  it("is deterministic and propagates no NaN / Infinity / undefined", () => {
    const run = () =>
      optimiseFleet({
        target: TARGET,
        rider: riderWith({ targetHandlebarWidth: 400 }),
      });
    const a = run();
    const b = run();

    expect(a.rankedBikes.map((r) => `${r.bikeId}:${r.overallScore}`)).toEqual(
      b.rankedBikes.map((r) => `${r.bikeId}:${r.overallScore}`),
    );

    for (const ranked of a.rankedBikes) {
      const { normalised, weighted } = ranked.bestConfiguration.componentScores;
      expect(Number.isFinite(ranked.overallScore)).toBe(true);
      for (const value of [
        normalised.position,
        normalised.cockpit,
        normalised.handling,
        weighted.position,
        weighted.cockpit,
        weighted.handling,
      ]) {
        expect(value).not.toBeUndefined();
        expect(finite(value)).toBe(true);
      }
    }
  });
});

describe("Sprint 11B — RP5 as an optional future metric", () => {
  const solvedWithoutRp5 = {
    rp3: { x: 470, y: 631 },
    rp4: null,
    rp5: null,
  } as unknown as SolvedConfiguration;

  const solvedWithRp5 = {
    rp3: { x: 470, y: 631 },
    rp4: { x: 540, y: 620 },
    // Synthetic, test-only RP5. Never written to production data.
    rp5: { x: 545, y: 604 },
  } as unknown as SolvedConfiguration;

  it("reports the cockpit component unavailable when RP5 is missing", () => {
    const rider = riderWith({ cockpitTargetX: 545, cockpitTargetY: 600 });
    const metric = calculateCockpitMetric(
      solvedWithoutRp5,
      cockpitTargetFromRider(rider),
    );

    expect(metric.available).toBe(false);
    expect(metric.value).toBeNull();
    expect(metric.unavailableReason).toBe("COCKPIT_GEOMETRY_UNAVAILABLE");
  });

  it("reports the cockpit component unavailable when the rider has no RP5 target", () => {
    const metric = calculateCockpitMetric(
      solvedWithRp5,
      cockpitTargetFromRider(riderProfile),
    );

    expect(metric.available).toBe(false);
    expect(metric.unavailableReason).toBe("COCKPIT_TARGET_UNAVAILABLE");
  });

  it("activates the cockpit component when RP5 and a rider target both exist", () => {
    const rider = riderWith({ cockpitTargetX: 545, cockpitTargetY: 600 });
    const metric = calculateCockpitMetric(solvedWithRp5, cockpitTargetFromRider(rider));

    expect(metric.available).toBe(true);
    // |(545,604) - (545,600)| = 4 mm.
    expect(metric.value).toBeCloseTo(4, 10);
  });

  it("omits the cockpit component from scoring until it becomes available", () => {
    const without = rankConfigurations({
      validConfigurations: [assessment()],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!;

    const withRp5 = rankConfigurations({
      validConfigurations: [assessment({ cockpitMetric: availableMetric(4) })],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!;

    // Unavailable: excluded from numerator AND denominator.
    expect(without.componentScores.normalised.cockpit).toBeNull();
    expect(without.overallScore).toBeCloseTo(
      without.componentScores.normalised.position,
      12,
    );

    // Available: participates, with no architectural change required.
    // Sprint 11D baseline re-derivation — cockpit normalisation is unchanged
    // (reciprocal, 1/(1+4) = 0.2); only the combiner changed, from
    // (position + 0.2)/2 = 0.403265 to sqrt(position × 0.2) = 0.348290.
    expect(withRp5.componentScores.normalised.cockpit).toBeCloseTo(1 / 5, 12);
    expect(withRp5.overallScore).toBeCloseTo(
      Math.sqrt(withRp5.componentScores.normalised.position * (1 / 5)),
      12,
    );
  });

  it("does not treat an unavailable cockpit metric as a perfect or zero score", () => {
    const unavailable = rankConfigurations({
      validConfigurations: [assessment()],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!;
    const perfect = rankConfigurations({
      validConfigurations: [assessment({ cockpitMetric: availableMetric(0) })],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!;
    const terrible = rankConfigurations({
      validConfigurations: [assessment({ cockpitMetric: availableMetric(100) })],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!;

    expect(unavailable.overallScore).not.toBeCloseTo(perfect.overallScore, 6);
    expect(unavailable.overallScore).not.toBeCloseTo(terrible.overallScore, 6);
  });
});
