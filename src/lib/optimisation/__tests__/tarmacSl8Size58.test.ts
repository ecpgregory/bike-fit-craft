import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { getBikeConfiguration } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { RiderProfile } from "@/types";

/** Sprint 12C.4 — source-backed fleet expansion: SL8 size 58 (tall stack). */

const ID = "specialized-tarmac-sl8-2025-58";

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

describe("Tarmac SL8 size 58 production record", () => {
  const bike = bikes.find((b) => b.id === ID)!;

  it("exists in the production fleet with the correct model-year identity", () => {
    expect(bike).toBeDefined();
    expect(bike.brand).toBe("Specialized");
    expect(bike.model).toBe("Tarmac SL8");
    expect(bike.year).toBe(2025);
    expect(bike.size).toBe("58");
  });

  it("matches the verified manufacturer geometry chart", () => {
    expect(bike.frameStack).toBe(591);
    expect(bike.frameReach).toBe(402);
    expect(bike.headTube).toBe(184);
    expect(bike.headTubeAngle).toBe(73.5);
    expect(bike.seatTubeAngle).toBe(73.5);
    expect(bike.chainstay).toBe(410);
    expect(bike.wheelbase).toBe(1006);
    expect(bike.frontCentre).toBe(606);
    expect(bike.bbDrop).toBe(72);
    expect(bike.forkOffset).toBe(44);
  });

  it("links the size-58 cockpit configuration to the bike", () => {
    const config = getBikeConfiguration(ID)!;
    expect(config.bikeId).toBe(ID);
    const cockpit = config.cockpits[0]!;
    expect(cockpit.id).toBe("tarmac-sl8-58-rapide-cockpit");
    expect(cockpit.name).toContain("Roval Rapide");
    expect(cockpit.stemLengths).toEqual([110]);
    expect(cockpit.stemAngles).toEqual([-6]);
    expect(cockpit.handlebarWidth).toBe(420);
    expect(cockpit.manufacturerReference).toEqual({ stackToStem: 599, reachToStem: 400 });
    expect(cockpit.sources.length).toBeGreaterThan(0);
  });

  it("only designates the cockpit as stock on verified size-specific evidence", () => {
    const cockpit = getBikeConfiguration(ID)!.cockpits[0]!;
    // Specialized publishes 110 mm / 420 mm for size 58 specifically.
    expect(cockpit.isStock).toBe(true);
    expect(cockpit.stemLengths).not.toEqual([100]);
  });

  it("supplies every optimiser-required input", () => {
    expect(bike.frameStack).not.toBeNull();
    expect(bike.frameReach).not.toBeNull();
    expect(bike.headTubeAngle).not.toBeNull();
    const options = deriveConstraintsFromBike(bike).availableCockpitOptions;
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.stemLength).toBe(110);
      expect(option.stemAngle).toBe(-6);
    }
  });

  it("keeps unsubstantiated values unknown", () => {
    expect(bike.tyreClearance).toBeNull();
    expect(bike.maxSpacerHeight).toBeNull();
    expect(getBikeConfiguration(ID)!.seatpost).toBeNull();
    for (const option of deriveConstraintsFromBike(bike).availableCockpitOptions) {
      expect(option.handlebarStack).toBeNull();
      expect(option.handlebarRotation).toBeNull();
      expect(option.hoodReach).toBeNull();
      expect(option.hoodStack).toBeNull();
      expect(option.hoodRotation).toBeNull();
    }
  });

  it("enumerates only spacer heights buildable from the documented kit", () => {
    const headset = getBikeConfiguration(ID)!.headset!;
    expect(headset.documentedMaximumBelowStem).toBeNull();
    expect(headset.isManufacturerStatedMaximum).toBe(false);

    const heights = deriveConstraintsFromBike(bike).availableSpacerHeights;
    const documentedMaximum = 3 * 10 + 5 + 6.6;
    expect(heights).toContain(0);
    expect(Math.max(...heights)).toBeCloseTo(documentedMaximum, 6);
    // The undocumented upper transition spacer invents no height, and the
    // 6.6 mm transition cover is never counted twice.
    expect(heights.filter((h) => Math.abs(h - 13.2) < 1e-9)).toHaveLength(0);
  });

  it("is evaluated by the existing production optimiser", () => {
    const result = optimiseFleet({ bikes, rider });
    const accounted = [...result.rankedBikes, ...result.unrankedBikes].map((r) => r.bikeId);
    expect(accounted).toContain(ID);
  });

  it("leaves the existing size 52, 54 and 56 records unchanged", () => {
    const b52 = bikes.find((b) => b.id === "specialized-tarmac-sl8-2025-52")!;
    const b54 = bikes.find((b) => b.id === "specialized-tarmac-sl8-2025-54")!;
    const b56 = bikes.find((b) => b.id === "specialized-tarmac-sl8-2025-56")!;
    expect([b52.frameStack, b52.frameReach]).toEqual([527, 380]);
    expect([b54.frameStack, b54.frameReach]).toEqual([544, 384]);
    expect([b56.frameStack, b56.frameReach]).toEqual([565, 395]);
    expect(getBikeConfiguration("specialized-tarmac-sl8-2025-56")!.cockpits[0]!.stemLengths).toEqual(
      [100],
    );
  });
});
