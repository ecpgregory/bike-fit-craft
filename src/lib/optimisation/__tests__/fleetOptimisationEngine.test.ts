import { describe, expect, it } from "vitest";
import type { Bike, RiderProfile } from "@/types";
import { bikes as productionBikes } from "@/data/bikes";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { BikeOptimisationResult } from "@/lib/optimisation/bikeOptimisationEngine";
import type { RankedConfiguration } from "@/lib/rankingEngine";

/** Sprint 8B — fleet orchestration only. */

function bike(id: string, overrides: Partial<Bike> = {}): Bike {
  return {
    id,
    brand: "Fixture",
    model: "Fleet",
    year: 2026,
    size: "54",
    frameStack: 570,
    frameReach: 390,
    headTube: null,
    wheelbase: null,
    frontCentre: null,
    chainstay: null,
    bbDrop: null,
    tyreClearance: null,
    integratedCockpit: true,
    notes: "",
    ...overrides,
  };
}

const rider: RiderProfile = {
  id: "rider-1",
  name: "Fixture Rider",
  currentBike: "Fixture Fleet",
  handlebarX: 470,
  handlebarY: 631,
  frameReach: 390,
  frameStack: 570,
  stemLength: 100,
  spacerHeight: 20,
  saddleHeight: 740,
  saddleSetback: 70,
  preferredBikeType: null,
  preferredTyreWidth: null,
  budget: null,
};

/** Stubbed single-bike engine: score keyed by bike id, null = unranked. */
function stubOptimise(scores: Record<string, number | null>, totals: Record<string, number> = {}) {
  return ((input: { bike: Bike }): BikeOptimisationResult => {
    const score = scores[input.bike.id] ?? null;
    const total = totals[input.bike.id] ?? (score === null ? 0 : 1);
    const best =
      score === null
        ? null
        : ({ candidateId: `${input.bike.id}-cfg`, overallScore: score } as RankedConfiguration);
    return {
      bikeId: input.bike.id,
      bestConfiguration: best,
      evaluatedConfigurations: best ? [best] : [],
      rejectedConfigurations: [],
      optimisationSummary: {
        totalConfigurations: total,
        solvedConfigurations: best ? 1 : 0,
        rejectedConfigurations: 0,
      },
      explanations: {},
    };
  }) as never;
}

describe("optimiseFleet", () => {
  it("ranks bikes by the existing overallScore, descending", () => {
    const result = optimiseFleet({
      bikes: [bike("a"), bike("b"), bike("c")],
      rider,
      optimise: stubOptimise({ a: 0.5, b: 0.9, c: 0.7 }),
    });

    expect(result.rankedBikes.map((r) => r.bikeId)).toEqual(["b", "c", "a"]);
    expect(result.rankedBikes.map((r) => r.overallScore)).toEqual([0.9, 0.7, 0.5]);
  });

  it("keeps a NO_CANDIDATES bike in unrankedBikes", () => {
    const result = optimiseFleet({
      bikes: [bike("none")],
      rider,
      optimise: stubOptimise({ none: null }, { none: 0 }),
    });

    expect(result.rankedBikes).toHaveLength(0);
    expect(result.unrankedBikes[0]!.outcome).toBe("NO_CANDIDATES");
  });

  it("keeps a NO_VALID_RESULT bike in unrankedBikes", () => {
    const result = optimiseFleet({
      bikes: [bike("invalid")],
      rider,
      optimise: stubOptimise({ invalid: null }, { invalid: 12 }),
    });

    expect(result.unrankedBikes[0]!.outcome).toBe("NO_VALID_RESULT");
  });

  it("accounts for every bike in a mixed fleet", () => {
    const bikes = [bike("a"), bike("b"), bike("none"), bike("invalid")];
    const result = optimiseFleet({
      bikes,
      rider,
      optimise: stubOptimise({ a: 0.4, b: 0.8, none: null, invalid: null }, { invalid: 9 }),
    });

    expect(result.totalBikes).toBe(bikes.length);
    expect(result.rankedBikes.length + result.unrankedBikes.length).toBe(result.totalBikes);
  });

  it("production fleet regression — verified SUCCESS bikes and scores", () => {
    const result = optimiseFleet({ bikes: productionBikes, rider });

    expect(result.totalBikes).toBe(productionBikes.length);
    expect(result.rankedBikes.length + result.unrankedBikes.length).toBe(result.totalBikes);

    expect(result.rankedBikes.map((r) => r.bikeId)).toEqual([
      "cannondale-supersix-evo-lab71-54",
      "cannondale-supersix-evo-lab71-56",
      "bmc-teammachine-slr01-56",
      "bmc-teammachine-slr01-54",
      "canyon-ultimate-cfr-l",
      "specialized-tarmac-sl8-2025-54",
      "colnago-v5rs-2025-510",
      "canyon-ultimate-cfr-m",
      "giant-tcr-advanced-sl-0-2025-ml",
      "specialized-tarmac-sl8-2025-52",
      "colnago-v5rs-2025-485",
      "giant-tcr-advanced-sl-0-2025-m",
    ]);

    const score = (id: string) =>
      result.rankedBikes.find((r) => r.bikeId === id)!.overallScore;

    // Sprint 9.7: scores are restated for the recalibrated positional
    // normaliser exp(-distance / 10 mm). RP3 geometry, distances, ranking
    // order and selected configurations are unchanged.
    // Sprint 9.4A regression: the original five records are unchanged.
    expect(score("specialized-tarmac-sl8-2025-54")).toBeCloseTo(0.6867, 4);
    expect(score("colnago-v5rs-2025-510")).toBeCloseTo(0.6764, 4);
    expect(score("specialized-tarmac-sl8-2025-52")).toBeCloseTo(0.6693, 4);
    expect(score("colnago-v5rs-2025-485")).toBeCloseTo(0.6686, 4);
    expect(
      result.unrankedBikes.find((u) => u.bikeId === "giant-defy-advanced-1-2014-ml")!.outcome,
    ).toBe("NO_CANDIDATES");

    // Sprint 9.4A records.
    expect(score("bmc-teammachine-slr01-56")).toBeCloseTo(0.7541, 4);
    expect(score("bmc-teammachine-slr01-54")).toBeCloseTo(0.7474, 4);
    expect(score("canyon-ultimate-cfr-l")).toBeCloseTo(0.7021, 4);
    expect(score("canyon-ultimate-cfr-m")).toBeCloseTo(0.6725, 4);
    expect(score("giant-tcr-advanced-sl-0-2025-ml")).toBeCloseTo(0.6696, 4);
    expect(score("giant-tcr-advanced-sl-0-2025-m")).toBeCloseTo(0.6676, 4);

    // Sprint 9.4B: the corrected Cannondale records now rank (SUCCESS).
    expect(score("cannondale-supersix-evo-lab71-54")).toBeCloseTo(0.8169, 4);
    expect(score("cannondale-supersix-evo-lab71-56")).toBeCloseTo(0.7755, 4);

    // Sprint 9.4B: the Cervélo stem angle remains unknown, so both S5
    // records still produce NO_CANDIDATES (no legal configuration can be
    // enumerated without a stem angle).
    expect(result.unrankedBikes.find((u) => u.bikeId === "cervelo-s5-54")!.outcome).toBe(
      "NO_CANDIDATES",
    );
    expect(result.unrankedBikes.find((u) => u.bikeId === "cervelo-s5-56")!.outcome).toBe(
      "NO_CANDIDATES",
    );
  });

});
