import { describe, expect, it } from "vitest";

import type { RiderProfile } from "@/types";
import { riderProfile } from "@/data/rider-profile";
import { bikeConfigurations, getBikeConfiguration } from "@/data/bike-configurations";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";

/**
 * Sprint 10 — verified handlebar-width data and handling-metric activation.
 *
 * Data provenance only: no geometry, weights, normalisation or enumeration
 * behaviour is exercised or changed here.
 */

const TARGET = { x: 470, y: 631 };

function stockWidth(bikeId: string): number | null | undefined {
  const config = getBikeConfiguration(bikeId);
  const stock = config?.cockpits.find((c) => c.isStock) ?? config?.cockpits[0];
  return stock?.handlebarWidth ?? null;
}

function riderWith(overrides: Partial<RiderProfile>): RiderProfile {
  return { ...riderProfile, ...overrides };
}

describe("Sprint 10 — documented handlebar widths", () => {
  it.each([
    ["specialized-tarmac-sl8-2025-52", 400],
    ["specialized-tarmac-sl8-2025-54", 400],
    ["colnago-v5rs-2025-485", 390],
    ["colnago-v5rs-2025-510", 410],
    ["giant-tcr-advanced-sl-0-2025-m", 420],
    ["giant-tcr-advanced-sl-0-2025-ml", 420],
    ["bmc-teammachine-slr01-54", 400],
    ["bmc-teammachine-slr01-56", 400],
    ["cannondale-supersix-evo-lab71-54", 360],
    ["cannondale-supersix-evo-lab71-56", 360],
  ])("%s documents %i mm", (bikeId, width) => {
    expect(stockWidth(bikeId as string)).toBe(width);
  });

  it("uses the nominal hood width for BMC, never the 436 mm drop width", () => {
    for (const id of ["bmc-teammachine-slr01-54", "bmc-teammachine-slr01-56"]) {
      expect(stockWidth(id)).toBe(400);
      expect(stockWidth(id)).not.toBe(436);
    }
  });

  it.each([
    "cervelo-s5-54",
    "cervelo-s5-56",
    "canyon-ultimate-cfr-m",
    "canyon-ultimate-cfr-l",
  ])("%s handlebar width remains unestablished", (bikeId) => {
    expect(stockWidth(bikeId)).toBeNull();
  });

  it("creates no configuration record for the Giant Defy", () => {
    expect(
      bikeConfigurations.some((c) => c.bikeId.startsWith("giant-defy-advanced-1")),
    ).toBe(false);
  });

  it("never populates hood/RP5 geometry from bar reach or drop", () => {
    for (const config of bikeConfigurations) {
      for (const cockpit of config.cockpits) {
        // The schema carries no hood fields at all; bar reach/drop stay bar
        // dimensions. Assert they are not silently mirrored anywhere.
        expect(Object.keys(cockpit)).not.toContain("hoodReach");
        expect(Object.keys(cockpit)).not.toContain("hoodStack");
        expect(Object.keys(cockpit)).not.toContain("hoodRotation");
      }
    }
  });
});

describe("Sprint 10 — handling metric activation", () => {
  function metricsFor(rider: RiderProfile, bikeId: string) {
    const fleet = optimiseFleet({ target: TARGET, rider });
    const ranked = fleet.rankedBikes.find((r) => r.bikeId === bikeId);
    return ranked?.bestConfiguration.assessment ?? null;
  }

  it("documented width + rider target → handling available, cockpit unavailable", () => {
    const rider = riderWith({ targetHandlebarWidth: 400 });
    const assessment = metricsFor(rider, "cannondale-supersix-evo-lab71-54")!;
    expect(assessment.handlingMetric.available).toBe(true);
    // 360 mm documented vs 400 mm target.
    expect(assessment.handlingMetric.value).toBeCloseTo(40, 6);
    // Bar reach/drop alone must never make RP5 solvable.
    expect(assessment.cockpitMetric.available).toBe(false);
    expect(assessment.cockpitMetric.unavailableReason).toBe(
      "COCKPIT_GEOMETRY_UNAVAILABLE",
    );
  });

  it("no rider target width → handling stays unavailable (Sprint 9.9 behaviour)", () => {
    const assessment = metricsFor(riderProfile, "cannondale-supersix-evo-lab71-54")!;
    expect(assessment.handlingMetric.available).toBe(false);
    expect(assessment.handlingMetric.unavailableReason).toBe(
      "HANDLING_TARGET_UNAVAILABLE",
    );
  });

  it("no documented width → handling stays unavailable even with a rider target", () => {
    const rider = riderWith({ targetHandlebarWidth: 400 });
    const assessment = metricsFor(rider, "canyon-ultimate-cfr-l")!;
    expect(assessment.handlingMetric.available).toBe(false);
    expect(assessment.handlingMetric.unavailableReason).toBe(
      "HANDLING_INPUT_UNAVAILABLE",
    );
  });

  it("Giant Defy remains NO_CANDIDATES", () => {
    const fleet = optimiseFleet({ target: TARGET, rider: riderProfile });
    const defy = fleet.unrankedBikes.find((u) =>
      u.bikeId.startsWith("giant-defy-advanced-1"),
    )!;
    expect(defy.outcome).toBe("NO_CANDIDATES");
  });

  it("populating widths alone does not change geometry, selection or scores", () => {
    const base = optimiseFleet({ target: TARGET, rider: riderProfile });
    const withWidth = optimiseFleet({
      target: TARGET,
      rider: riderWith({ targetHandlebarWidth: 400 }),
    });

    for (const ranked of base.rankedBikes) {
      const other = withWidth.rankedBikes.find((r) => r.bikeId === ranked.bikeId)!;
      expect(other.bestConfiguration.candidateId).toBe(
        ranked.bestConfiguration.candidateId,
      );
      expect(other.bestConfiguration.assessment.positionMetrics).toEqual(
        ranked.bestConfiguration.assessment.positionMetrics,
      );
      expect(other.outcome).toBe(ranked.outcome);
    }
    expect(withWidth.unrankedBikes.map((u) => u.bikeId).sort()).toEqual(
      base.unrankedBikes.map((u) => u.bikeId).sort(),
    );
  });

  it("an unavailable metric's weight stays out of the ranking denominator", () => {
    // Matching width → zero handling penalty → a perfect handling component.
    // If handling were excluded, the score would equal the no-target score.
    const matched = optimiseFleet({
      target: TARGET,
      rider: riderWith({ targetHandlebarWidth: 360 }),
    }).rankedBikes.find((r) => r.bikeId === "cannondale-supersix-evo-lab71-54")!;
    const none = optimiseFleet({ target: TARGET, rider: riderProfile }).rankedBikes.find(
      (r) => r.bikeId === "cannondale-supersix-evo-lab71-54",
    )!;
    expect(matched.overallScore).toBeGreaterThan(none.overallScore);

    // A materially different target penalises the same configuration.
    const far = optimiseFleet({
      target: TARGET,
      rider: riderWith({ targetHandlebarWidth: 460 }),
    }).rankedBikes.find((r) => r.bikeId === "cannondale-supersix-evo-lab71-54")!;
    expect(far.overallScore).toBeLessThan(matched.overallScore);
  });
});
