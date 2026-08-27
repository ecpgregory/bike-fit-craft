import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { bikeConfigurations } from "@/data/bike-configurations";

/**
 * Sprint 9.4B — verified stock stem length corrections.
 *
 * Cannondale's official SuperSix EVO LAB71 specification identifies the
 * SystemBar Road integrated cockpit as 100 x 360 mm for sizes 54-56.
 * Cervélo documents the S5 ST35 stem as supplied at 100 mm.
 *
 * The Cervélo stem angle must remain UNKNOWN: the published "-6 deg virtual
 * plane" description refers to the resulting cockpit geometry, not the
 * geometric definition of stockStemAngle, and is not converted.
 */

function bike(id: string) {
  return bikes.find((b) => b.id === id)!;
}

function stockCockpit(bikeId: string) {
  const config = bikeConfigurations.find((c) => c.bikeId === bikeId)!;
  return config.cockpits.find((c) => c.isStock)!;
}

describe("Sprint 9.4B stock stem length corrections", () => {
  it("Cannondale SuperSix EVO LAB71 54 records a 100 mm stock stem", () => {
    expect(bike("cannondale-supersix-evo-lab71-54").stockStemLength).toBe(100);
    expect(stockCockpit("cannondale-supersix-evo-lab71-54").stemLengths).toContain(100);
  });

  it("Cannondale SuperSix EVO LAB71 56 records a 100 mm stock stem", () => {
    expect(bike("cannondale-supersix-evo-lab71-56").stockStemLength).toBe(100);
    expect(stockCockpit("cannondale-supersix-evo-lab71-56").stemLengths).toContain(100);
  });

  it("Cervélo S5 54 records a 100 mm stock stem", () => {
    expect(bike("cervelo-s5-54").stockStemLength).toBe(100);
    expect(stockCockpit("cervelo-s5-54").stemLengths).toContain(100);
  });

  it("Cervélo S5 56 records a 100 mm stock stem", () => {
    expect(bike("cervelo-s5-56").stockStemLength).toBe(100);
    expect(stockCockpit("cervelo-s5-56").stemLengths).toContain(100);
  });

  it("Cervélo S5 stem angle remains unknown (not converted from the -6 deg virtual plane)", () => {
    expect(bike("cervelo-s5-54").stockStemAngle ?? null).toBeNull();
    expect(bike("cervelo-s5-56").stockStemAngle ?? null).toBeNull();
    expect(stockCockpit("cervelo-s5-54").stemAngles).toHaveLength(0);
    expect(stockCockpit("cervelo-s5-56").stemAngles).toHaveLength(0);
  });
});
