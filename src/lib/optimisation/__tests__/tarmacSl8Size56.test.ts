import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { getBikeConfiguration } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { RiderProfile } from "@/types";

/** Sprint 12C.1 — source-backed fleet expansion: SL8 size 56. */

const ID = "specialized-tarmac-sl8-2025-56";

const rider: RiderProfile = {
  id: "rider-1",
  name: "Fixture Rider",
  currentBike: "Fixture",
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

describe("Tarmac SL8 size 56 production record", () => {
  const bike = bikes.find((b) => b.id === ID)!;

  it("exists in the production fleet with source-backed geometry", () => {
    expect(bike).toBeDefined();
    expect(bike.brand).toBe("Specialized");
    expect(bike.model).toBe("Tarmac SL8");
    expect(bike.year).toBe(2025);
    expect(bike.size).toBe("56");
    expect(bike.frameStack).toBe(565);
    expect(bike.frameReach).toBe(395);
    expect(bike.headTube).toBe(157);
    expect(bike.headTubeAngle).toBe(73.5);
    expect(bike.seatTubeAngle).toBe(73.5);
    expect(bike.chainstay).toBe(410);
    expect(bike.wheelbase).toBe(991);
    expect(bike.bbDrop).toBe(72);
    expect(bike.forkOffset).toBe(44);
  });

  it("records the documented cockpit: Rapide, 100 mm stem, 420 mm width", () => {
    const cockpit = getBikeConfiguration(ID)!.cockpits[0]!;
    expect(cockpit.name).toContain("Roval Rapide");
    expect(cockpit.stemLengths).toEqual([100]);
    expect(cockpit.handlebarWidth).toBe(420);
    expect(cockpit.manufacturerReference).toEqual({ stackToStem: 573, reachToStem: 393 });
  });

  it("keeps unsubstantiated cockpit values unknown", () => {
    const options = deriveConstraintsFromBike(bike).availableCockpitOptions;
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.handlebarStack).toBeNull();
      expect(option.handlebarRotation).toBeNull();
      expect(option.hoodReach).toBeNull();
      expect(option.hoodStack).toBeNull();
      expect(option.hoodRotation).toBeNull();
    }
  });

  it("enumerates only spacer heights buildable from the documented kit", () => {
    const headset = getBikeConfiguration(ID)!.headset!;
    expect(headset.suppliedParts).toEqual([
      { description: "Lower transition cover", height: 6.6, quantity: 1 },
      { description: "Aero spacer", height: 10, quantity: 3 },
      { description: "Aero spacer", height: 5, quantity: 1 },
      { description: "Upper stem transition spacer", height: null, quantity: 1 },
    ]);
    // No manufacturer-stated numeric maximum exists; kit capacity is never
    // reinterpreted as one.
    expect(headset.documentedMaximumBelowStem).toBeNull();
    expect(headset.isManufacturerStatedMaximum).toBe(false);

    const heights = deriveConstraintsFromBike(bike).availableSpacerHeights;
    // Documented aero spacers plus the single lower transition cover.
    const documentedMaximum = 3 * 10 + 5 + 6.6;
    expect(Math.max(...heights)).toBeCloseTo(documentedMaximum, 6);
    expect(heights).toContain(0);
    // The undocumented upper transition spacer adds no invented height, and the
    // 6.6 mm transition cover is counted at most once.
    expect(heights.filter((h) => Math.abs(h - 13.2) < 1e-9)).toHaveLength(0);
  });

  it("is evaluated by the existing production optimiser", () => {
    const result = optimiseFleet({ bikes, rider });
    const accounted = [...result.rankedBikes, ...result.unrankedBikes].map((r) => r.bikeId);
    expect(accounted).toContain(ID);
  });

  it("leaves the existing size 52 and 54 records unchanged", () => {
    const b52 = bikes.find((b) => b.id === "specialized-tarmac-sl8-2025-52")!;
    const b54 = bikes.find((b) => b.id === "specialized-tarmac-sl8-2025-54")!;
    expect([b52.frameStack, b52.frameReach]).toEqual([527, 380]);
    expect([b54.frameStack, b54.frameReach]).toEqual([544, 384]);
    expect(getBikeConfiguration("specialized-tarmac-sl8-2025-52")!.cockpits[0]!.stemLengths).toEqual(
      [90],
    );
    expect(getBikeConfiguration("specialized-tarmac-sl8-2025-54")!.cockpits[0]!.stemLengths).toEqual(
      [100],
    );
  });
});
