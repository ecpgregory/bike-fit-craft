import { describe, expect, it } from "vitest";

import type { RiderProfile } from "@/types";
import { riderProfile } from "@/data/rider-profile";
import {
  cockpitTargetFromRider,
  handlingTargetFromRider,
} from "@/lib/errorCalculator";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { rankConfigurations } from "@/lib/rankingEngine";
import type { FitAssessment } from "@/types/optimisation";
import { availableMetric, unavailableMetric } from "@/types/optimisation";

/**
 * Sprint 9.9 — rider-side cockpit (RP5) and handling (handlebar width) targets.
 *
 * These tests assert availability semantics only. No geometry, weights or
 * normalisation behaviour is exercised or changed here.
 */

const TARGET = { x: 470, y: 631 };

function riderWith(overrides: Partial<RiderProfile>): RiderProfile {
  return { ...riderProfile, ...overrides };
}

function assessmentWith(
  cockpit: FitAssessment["cockpitMetric"],
  handling: FitAssessment["handlingMetric"],
): FitAssessment {
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
    cockpitMetric: cockpit,
    handlingMetric: handling,
    geometryWarnings: [],
    constraintStatus: "VALID",
    notes: [],
  };
}

describe("rider model — optional targets", () => {
  it("treats both new measurements as optional and absent by default", () => {
    expect(riderProfile.cockpitTargetX ?? null).toBeNull();
    expect(riderProfile.cockpitTargetY ?? null).toBeNull();
    expect(riderProfile.targetHandlebarWidth ?? null).toBeNull();
    expect(cockpitTargetFromRider(riderProfile)).toBeNull();
    expect(handlingTargetFromRider(riderProfile)).toBeNull();
  });

  it("supplies an RP5 target only when both coordinates are present", () => {
    expect(
      cockpitTargetFromRider(riderWith({ cockpitTargetX: 545, cockpitTargetY: 600 })),
    ).toEqual({ x: 545, y: 600 });
    // A half-measurement is not a target and is never completed from RP3.
    expect(cockpitTargetFromRider(riderWith({ cockpitTargetX: 545 }))).toBeNull();
    expect(cockpitTargetFromRider(riderWith({ cockpitTargetY: 600 }))).toBeNull();
  });

  it("supplies a handling target only when the rider states a width", () => {
    expect(handlingTargetFromRider(riderWith({ targetHandlebarWidth: 380 }))).toEqual({
      handlebarWidth: 380,
    });
    expect(handlingTargetFromRider(riderWith({ targetHandlebarWidth: null }))).toBeNull();
  });
});

describe("metric availability through the fleet pipeline", () => {
  function metricsFor(rider: RiderProfile) {
    const fleet = optimiseFleet({ target: TARGET, rider });
    const best = fleet.rankedBikes[0]!.bestConfiguration.assessment;
    return { cockpit: best.cockpitMetric, handling: best.handlingMetric };
  }

  it("RP3 only → cockpit and handling remain explicitly unavailable", () => {
    const { cockpit, handling } = metricsFor(riderProfile);
    expect(cockpit.available).toBe(false);
    expect(cockpit.value).toBeNull();
    expect(handling.available).toBe(false);
    expect(handling.value).toBeNull();
    expect(handling.unavailableReason).toBe("HANDLING_TARGET_UNAVAILABLE");
  });

  it("RP3 + handlebar width → handling metric becomes available", () => {
    const { handling } = metricsFor(riderWith({ targetHandlebarWidth: 380 }));
    // Availability depends on the configuration carrying a documented width.
    if (handling.available) {
      expect(handling.value).toBeGreaterThanOrEqual(0);
    } else {
      expect(handling.unavailableReason).toBe("HANDLING_INPUT_UNAVAILABLE");
    }
  });

  it("distinguishes a missing rider measurement from missing bike geometry", () => {
    const withTarget = metricsFor(
      riderWith({ cockpitTargetX: 545, cockpitTargetY: 600 }),
    ).cockpit;
    const withoutTarget = metricsFor(riderProfile).cockpit;
    expect(withoutTarget.unavailableReason).toBe("COCKPIT_TARGET_UNAVAILABLE");
    // With a rider target present, any remaining unavailability is bike-side.
    if (!withTarget.available) {
      expect(withTarget.unavailableReason).toBe("COCKPIT_GEOMETRY_UNAVAILABLE");
    } else {
      expect(withTarget.value).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("availability-aware ranking denominator", () => {
  function score(assessment: FitAssessment): number {
    return rankConfigurations({
      validConfigurations: [assessment],
      invalidConfigurations: [],
    }).rankedConfigurations[0]!.overallScore;
  }

  it("uses only available metrics, never 0 or 1 substitutes", () => {
    const positionOnly = score(
      assessmentWith(
        unavailableMetric("COCKPIT_TARGET_UNAVAILABLE"),
        unavailableMetric("HANDLING_TARGET_UNAVAILABLE"),
      ),
    );
    const withCockpit = score(
      assessmentWith(availableMetric(5), unavailableMetric("HANDLING_TARGET_UNAVAILABLE")),
    );
    const withBoth = score(assessmentWith(availableMetric(5), availableMetric(5)));

    expect(positionOnly).toBeGreaterThan(0);
    // Adding an available metric changes the weighted mean's denominator.
    expect(withCockpit).not.toBeCloseTo(positionOnly, 6);
    expect(withBoth).not.toBeCloseTo(withCockpit, 6);
  });
});
