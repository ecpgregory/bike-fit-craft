import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { getBikeConfiguration } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { generateLegalConfigurations } from "@/lib/constraintGenerator";
import { frameGeometryFromBike } from "@/lib/optimisation/frameGeometry";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import {
  spacerHeightsFromHeadset,
  maximumSpacerHeightFromHeadset,
} from "@/lib/configurationConstraints";

const targets = ["specialized-tarmac-sl8-2025-54", "colnago-v5rs-2025-510"];

describe("verified configuration data reaches the constraint generator", () => {
  for (const bikeId of targets) {
    it(`${bikeId}: produces real CockpitConfiguration objects`, () => {
      const bike = bikes.find((b) => b.id === bikeId)!;
      expect(getBikeConfiguration(bikeId)).not.toBeNull();

      const constraints = deriveConstraintsFromBike(bike);
      expect(constraints.availableCockpitOptions.length).toBeGreaterThan(0);
      expect(constraints.availableSpacerHeights.length).toBeGreaterThan(1);

      const configurations = generateLegalConfigurations(constraints);
      expect(configurations.length).toBeGreaterThan(0);

      // Unknown cockpit geometry must stay unknown, never defaulted.
      for (const configuration of configurations) {
        expect(configuration.handlebarRotation).toBeNull();
        expect(configuration.hoodReach).toBeNull();
        expect(configuration.hoodStack).toBeNull();
        expect(configuration.hoodRotation).toBeNull();
      }

      // Configurations reach the solver; missing cockpit data is reported there.
      const solved = solveConfiguration(configurations[0]!, frameGeometryFromBike(bike));
      expect(solved.status).toBe("UNSOLVED");
      expect(solved.unsolvedReason).toBe("MISSING_COCKPIT_INPUTS");
    });
  }

  it("V5Rs 510 exposes the documented CC.01 stem lengths as cockpit options", () => {
    const bike = bikes.find((b) => b.id === "colnago-v5rs-2025-510")!;
    const lengths = deriveConstraintsFromBike(bike)
      .availableCockpitOptions.map((o) => o.stemLength)
      .sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(lengths).toEqual([80, 90, 100, 110, 120]);
  });
});

describe("headset spacer adapter", () => {
  it("derives buildable heights from documented parts only", () => {
    expect(
      spacerHeightsFromHeadset({
        spacerIncrement: 5,
        suppliedParts: [{ description: "Spacer", height: 5, quantity: 2 }],
        suppliedSpacerCapacity: 10,
        documentedMaximumBelowStem: null,
        isManufacturerStatedMaximum: false,
        notes: "",
        sources: [],
      }),
    ).toEqual([0, 5, 10]);
  });

  it("falls back to increments when part heights are undocumented", () => {
    expect(
      spacerHeightsFromHeadset({
        spacerIncrement: 5,
        suppliedParts: [{ description: "Spacer", height: null, quantity: 3 }],
        suppliedSpacerCapacity: 15,
        documentedMaximumBelowStem: null,
        isManufacturerStatedMaximum: false,
        notes: "",
        sources: [],
      }),
    ).toEqual([0, 5, 10, 15]);
  });

  it("never treats kit capacity as a maximum", () => {
    expect(
      maximumSpacerHeightFromHeadset({
        spacerIncrement: 5,
        suppliedParts: [],
        suppliedSpacerCapacity: 25,
        documentedMaximumBelowStem: null,
        isManufacturerStatedMaximum: false,
        notes: "",
        sources: [],
      }),
    ).toBeNull();
  });
});
