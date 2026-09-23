import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { getBikeConfiguration } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { RiderProfile } from "@/types";

/** Sprint 12D.1 — source-backed fleet expansion: Factor OSTRO VAM + O2 VAM, sizes 54 / 56. */

const OSTRO_54 = "factor-ostro-vam-2024-54";
const OSTRO_56 = "factor-ostro-vam-2024-56";
const O2_54 = "factor-o2-vam-2023-54";
const O2_56 = "factor-o2-vam-2023-56";
const FACTOR_IDS = [OSTRO_54, OSTRO_56, O2_54, O2_56];

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

const byId = (id: string) => bikes.find((b) => b.id === id)!;

describe("Factor OSTRO VAM / O2 VAM production records", () => {
  it("records the official OSTRO VAM geometry for sizes 54 and 56", () => {
    const b54 = byId(OSTRO_54);
    expect(b54.brand).toBe("Factor");
    expect(b54.model).toBe("OSTRO VAM");
    expect(b54.year).toBe(2024);
    expect(b54.size).toBe("54");
    expect(b54.frameStack).toBe(542);
    expect(b54.frameReach).toBe(384);
    expect(b54.headTubeAngle).toBe(72.5);
    expect(b54.seatTubeAngle).toBe(74);
    expect(b54.chainstay).toBe(405);
    expect(b54.wheelbase).toBe(985);
    expect(b54.bbDrop).toBe(70);
    expect(b54.forkOffset).toBe(48);

    const b56 = byId(OSTRO_56);
    expect(b56.size).toBe("56");
    expect(b56.frameStack).toBe(565);
    expect(b56.frameReach).toBe(392);
    expect(b56.headTubeAngle).toBe(73.3);
    expect(b56.seatTubeAngle).toBe(73.5);
    expect(b56.chainstay).toBe(405);
    expect(b56.wheelbase).toBe(987);
    expect(b56.bbDrop).toBe(70);
    expect(b56.forkOffset).toBe(43);
  });

  it("records the official O2 VAM v2 geometry for sizes 54 and 56", () => {
    const b54 = byId(O2_54);
    expect(b54.brand).toBe("Factor");
    expect(b54.model).toBe("O2 VAM");
    expect(b54.year).toBe(2023);
    expect(b54.frameStack).toBe(552);
    expect(b54.frameReach).toBe(381);
    expect(b54.headTubeAngle).toBe(72.5);
    expect(b54.seatTubeAngle).toBe(74);
    expect(b54.chainstay).toBe(405);
    expect(b54.wheelbase).toBe(985);
    expect(b54.bbDrop).toBe(70);
    expect(b54.forkOffset).toBe(48);

    const b56 = byId(O2_56);
    expect(b56.frameStack).toBe(574);
    expect(b56.frameReach).toBe(389);
    expect(b56.headTubeAngle).toBe(73.3);
    expect(b56.seatTubeAngle).toBe(73.5);
    expect(b56.wheelbase).toBe(987);
    expect(b56.forkOffset).toBe(43);
  });

  it("keeps unpublished frame values unknown", () => {
    for (const id of FACTOR_IDS) {
      const bike = byId(id);
      // Factor publishes neither head tube length nor front centre for these frames.
      expect(bike.headTube).toBeNull();
      expect(bike.frontCentre).toBeNull();
    }
  });

  it("links each size to its own cockpit configuration record", () => {
    for (const id of FACTOR_IDS) {
      const config = getBikeConfiguration(id)!;
      expect(config.bikeId).toBe(id);
      expect(config.cockpits).toHaveLength(1);
    }
  });

  it("records the AB02 aero barstem for the OSTRO VAM and the non-aero barstem for the O2 VAM", () => {
    for (const id of [OSTRO_54, OSTRO_56]) {
      const cockpit = getBikeConfiguration(id)!.cockpits[0]!;
      expect(cockpit.name).toContain("AB02");
      expect(cockpit.kind).toBe("integrated");
      expect(cockpit.stemLengths).toEqual([80, 90, 100, 110, 120, 130, 140]);
      expect(cockpit.stemAngles).toEqual([-6]);
      expect(cockpit.handlebarReach).toBe(80);
      expect(cockpit.handlebarDrop).toBe(120);
    }

    for (const id of [O2_54, O2_56]) {
      const cockpit = getBikeConfiguration(id)!.cockpits[0]!;
      expect(cockpit.name).toBe("Black Inc Integrated Barstem");
      expect(cockpit.stemLengths).toEqual([90, 100, 110, 120, 130]);
      expect(cockpit.stemAngles).toEqual([-6]);
      expect(cockpit.handlebarReach).toBe(80);
      expect(cockpit.handlebarDrop).toBe(120);
    }
  });

  it("claims no stock designation and no invented cockpit values", () => {
    for (const id of FACTOR_IDS) {
      const cockpit = getBikeConfiguration(id)!.cockpits[0]!;
      // Factor builds to order; no size-specific stock width/length is published.
      expect(cockpit.isStock).toBe(false);
      expect(cockpit.handlebarWidth ?? null).toBeNull();
      expect(cockpit.manufacturerReference).toBeUndefined();

      for (const option of deriveConstraintsFromBike(byId(id)).availableCockpitOptions) {
        expect(option.handlebarStack).toBeNull();
        expect(option.handlebarRotation).toBeNull();
        expect(option.hoodReach).toBeNull();
        expect(option.hoodStack).toBeNull();
        expect(option.hoodRotation).toBeNull();
        expect(option.handlebarWidth ?? null).toBeNull();
      }
    }
  });

  it("respects Factor's stated 40 mm spacer maximum in the spacer enumeration", () => {
    for (const id of FACTOR_IDS) {
      const headset = getBikeConfiguration(id)!.headset!;
      // Supplied part quantities are not published, so none are recorded.
      expect(headset.suppliedParts).toEqual([]);
      expect(headset.spacerIncrement).toBe(5);
      expect(headset.documentedMaximumBelowStem).toBe(40);
      expect(headset.isManufacturerStatedMaximum).toBe(true);

      const constraints = deriveConstraintsFromBike(byId(id));
      expect(constraints.availableSpacerHeights).toEqual([
        0, 5, 10, 15, 20, 25, 30, 35, 40,
      ]);
      expect(constraints.maximumSpacerHeight).toBe(40);
    }
  });

  it("evaluates all four records with the existing production optimiser", () => {
    const result = optimiseFleet({ bikes, rider });
    const accounted = [...result.rankedBikes, ...result.unrankedBikes].map((r) => r.bikeId);
    for (const id of FACTOR_IDS) expect(accounted).toContain(id);
  });

  it("leaves the existing Specialized Tarmac SL8 records untouched", () => {
    const sl8_54 = byId("specialized-tarmac-sl8-2025-54");
    expect(sl8_54.frameStack).toBe(544);
    expect(sl8_54.frameReach).toBe(384);
    const sl8_56 = byId("specialized-tarmac-sl8-2025-56");
    expect(sl8_56.frameStack).toBe(565);
    expect(sl8_56.frameReach).toBe(395);
  });
});
