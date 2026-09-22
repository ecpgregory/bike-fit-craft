import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { bikeConfigurations } from "@/data/bike-configurations";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import type { RiderProfile } from "@/types";

/**
 * Sprint 12C.5 — Cervélo S5 rankability recovery (evidence outcome: NOT recovered).
 *
 * The blocker confirmed against the current code is the stem angle: both S5
 * configurations record `stemAngles: []`, so the constraint generator produces
 * no candidate with a stem angle and the fleet optimiser reports NO_CANDIDATES.
 * Every other rankability-critical input (frame stack, frame reach, head tube
 * angle, stem length) IS present.
 *
 * The primary source — Cervélo's 2023 S5 Retailer Assembly Manual v3.1, "Stack
 * Adjustment" — documents only a positional equivalence:
 *   "Base position for the S5 stem and handlebar matches that of the 2022 S5,
 *    and also that of the 2018 S5 with a 6˚ stem and a 5mm bearing cover."
 * That equates the assembled position against a DIFFERENT frame generation; it
 * does not publish the ST35's own angle relative to this frame's steerer. The
 * only other degree figures Cervélo publishes for this cockpit (0-5˚ rise /
 * ±5˚ rotation) are adjustment ranges, not a stock angle.
 *
 * These tests therefore lock in the honest state: identity preserved, no
 * fabricated angle, no unsupported stock designation, records correctly
 * unrankable rather than forced into results.
 */

const S5_IDS = ["cervelo-s5-54", "cervelo-s5-56"] as const;

function bike(id: string) {
  return bikes.find((b) => b.id === id)!;
}

function configuration(bikeId: string) {
  return bikeConfigurations.find((c) => c.bikeId === bikeId)!;
}

const rider: RiderProfile = {
  id: "sprint-12c5-rider",
  name: "Sprint 12C.5 reference rider",
  handlebarX: 470,
  handlebarY: 631,
};

describe("Sprint 12C.5 — Cervélo S5 rankability", () => {
  it("preserves the existing S5 record and configuration identities", () => {
    expect(bike("cervelo-s5-54")).toMatchObject({
      brand: "Cervélo",
      model: "S5",
      size: "54",
      frameStack: 542,
      frameReach: 384,
      headTubeAngle: 73.0,
    });
    expect(bike("cervelo-s5-56")).toMatchObject({
      brand: "Cervélo",
      model: "S5",
      size: "56",
      frameStack: 565,
      frameReach: 392,
      headTubeAngle: 73.5,
    });
    expect(configuration("cervelo-s5-54").cockpits[0]!.id).toBe("cervelo-s5-54-st35-hb14");
    expect(configuration("cervelo-s5-56").cockpits[0]!.id).toBe("cervelo-s5-56-st35-hb14");
  });

  it("records every rankability-critical input except the stem angle", () => {
    for (const id of S5_IDS) {
      const record = bike(id);
      expect(record.frameStack).not.toBeNull();
      expect(record.frameReach).not.toBeNull();
      expect(record.headTubeAngle).not.toBeNull();

      const constraints = deriveConstraintsFromBike(record);
      expect(constraints.availableStemLengths).toContain(100);
      // The sole missing required input.
      expect(constraints.allowedStemAngles).toHaveLength(0);
    }
  });

  it("introduces no fabricated stem angle and no unsupported stock designation", () => {
    for (const id of S5_IDS) {
      expect(bike(id).stockStemAngle ?? null).toBeNull();
      const cockpit = configuration(id).cockpits[0]!;
      expect(cockpit.stemAngles).toEqual([]);
      // Stock designation is supported: Cervélo documents the ST35/HB14 as the
      // supplied cockpit at 100 mm. Unverified dimensions stay unknown.
      expect(cockpit.isStock).toBe(true);
      expect(cockpit.handlebarReach).toBeNull();
      expect(cockpit.handlebarDrop).toBeNull();
      expect(cockpit.handlebarWidth ?? null).toBeNull();
    }
  });

  it("cites the primary Cervélo assembly manual as the evidence examined", () => {
    for (const id of S5_IDS) {
      const cockpit = configuration(id).cockpits[0]!;
      expect(cockpit.sources.some((s) => s.url.includes("S5_2023_manual_v3.1_web.pdf"))).toBe(true);
      expect(cockpit.notes).toContain("6 deg stem");
    }
  });

  it("leaves both records correctly unrankable rather than forcing them into results", () => {
    const result = optimiseFleet({ bikes, rider });
    for (const id of S5_IDS) {
      expect(result.rankedBikes.some((r) => r.bikeId === id)).toBe(false);
      expect(result.unrankedBikes.find((u) => u.bikeId === id)!.outcome).toBe("NO_CANDIDATES");
    }
  });
});
