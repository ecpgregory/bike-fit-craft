import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { getBikeConfiguration } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { RiderProfile } from "@/types";

/** Sprint 12C.2 — source-backed fleet expansion: Pinarello Dogma F 540 / 550. */

const ID_540 = "pinarello-dogma-f-2025-540";
const ID_550 = "pinarello-dogma-f-2025-550";

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

describe("Pinarello Dogma F production records", () => {
  const b540 = bikes.find((b) => b.id === ID_540)!;
  const b550 = bikes.find((b) => b.id === ID_550)!;

  it("records size 540 with the official Pinarello geometry", () => {
    expect(b540).toBeDefined();
    expect(b540.brand).toBe("Pinarello");
    expect(b540.model).toBe("Dogma F");
    expect(b540.size).toBe("540");
    expect(b540.frameStack).toBe(551);
    expect(b540.frameReach).toBe(385.3);
    expect(b540.headTube).toBe(136);
    expect(b540.headTubeAngle).toBe(72.8);
    expect(b540.seatTubeAngle).toBe(73.4);
    expect(b540.chainstay).toBe(408);
    expect(b540.bbDrop).toBe(72);
    expect(b540.forkOffset).toBe(47);
  });

  it("records size 550 with the official Pinarello geometry", () => {
    expect(b550.size).toBe("550");
    expect(b550.frameStack).toBe(561.5);
    expect(b550.frameReach).toBe(389.2);
    expect(b550.headTube).toBe(147);
    expect(b550.headTubeAngle).toBe(72.8);
    expect(b550.seatTubeAngle).toBe(73.4);
    expect(b550.chainstay).toBe(408);
    expect(b550.bbDrop).toBe(72);
    expect(b550.forkOffset).toBe(47);
  });

  it("leaves unpublished frame values unknown for both sizes", () => {
    for (const bike of [b540, b550]) {
      expect(bike.wheelbase).toBeNull();
      expect(bike.frontCentre).toBeNull();
      expect(bike.tyreClearance).toBeNull();
      expect(bike.maxSpacerHeight).toBeNull();
    }
  });

  it("records the documented Talon Ultra Fast cockpit without a stock SKU", () => {
    for (const id of [ID_540, ID_550]) {
      const cockpit = getBikeConfiguration(id)!.cockpits[0]!;
      expect(cockpit.name).toContain("Talon Ultra Fast");
      expect(cockpit.kind).toBe("integrated");
      // Which SKU ships on this frame size is not published.
      expect(cockpit.isStock).toBe(false);
      expect(cockpit.handlebarWidth).toBeNull();
      expect(cockpit.stemLengths).toEqual([80, 90, 100, 110, 120, 130, 140]);
      expect(cockpit.stemAngles).toEqual([-8]);
      expect(cockpit.handlebarReach).toBe(80);
      expect(cockpit.handlebarDrop).toBe(125);
      expect(cockpit.manufacturerReference).toBeUndefined();
    }
  });

  it("keeps unsubstantiated cockpit values unknown", () => {
    for (const bike of [b540, b550]) {
      const options = deriveConstraintsFromBike(bike).availableCockpitOptions;
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        expect(option.handlebarStack).toBeNull();
        expect(option.handlebarRotation).toBeNull();
        expect(option.hoodReach).toBeNull();
        expect(option.hoodStack).toBeNull();
        expect(option.hoodRotation).toBeNull();
        expect(option.handlebarWidth ?? null).toBeNull();
      }
    }
  });

  it("enumerates only spacer heights buildable from the documented eTiCR kit", () => {
    for (const bike of [b540, b550]) {
      const headset = getBikeConfiguration(bike.id)!.headset!;
      expect(headset.suppliedParts).toEqual([
        { description: "Flatback headset spacer", height: 5, quantity: 2 },
        { description: "Flatback headset spacer", height: 10, quantity: 2 },
      ]);
      // Kit capacity is never reinterpreted as a manufacturer-stated maximum.
      expect(headset.documentedMaximumBelowStem).toBeNull();
      expect(headset.isManufacturerStatedMaximum).toBe(false);

      const heights = deriveConstraintsFromBike(bike).availableSpacerHeights;
      expect(heights).toEqual([0, 5, 10, 15, 20, 25, 30]);
      expect(Math.max(...heights)).toBe(30);
    }
  });

  it("passes both records through the existing production optimiser", () => {
    const result = optimiseFleet({ bikes, rider });
    const accounted = [...result.rankedBikes, ...result.unrankedBikes].map((r) => r.bikeId);
    expect(accounted).toContain(ID_540);
    expect(accounted).toContain(ID_550);
  });
});
