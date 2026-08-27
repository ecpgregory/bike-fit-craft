import { describe, expect, it } from "vitest";
import { bikes } from "@/data/bikes";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import {
  diagnoseConfigurationSpace,
  generateLegalConfigurations,
} from "@/lib/constraintGenerator";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import { classifyOptimisationOutcome } from "@/lib/optimisation/optimisationOutcome";
import type { BikeFitConstraints, CockpitOption } from "@/types/optimisation";

function integratedOption(id: string, stemAngle: number | null): CockpitOption {
  return {
    id,
    name: id,
    stemLength: 100,
    stemAngle,
    handlebarReach: 80,
    handlebarStack: null,
    handlebarRotation: null,
    hoodReach: null,
    hoodStack: null,
    hoodRotation: null,
    isStock: true,
    isIntegrated: true,
    isAftermarket: false,
  };
}

function constraintsWith(options: CockpitOption[]): BikeFitConstraints {
  return {
    bikeId: "test-bike",
    minimumSpacerHeight: 0,
    maximumSpacerHeight: null,
    availableSpacerHeights: [0, 50],
    minimumStemLength: null,
    maximumStemLength: null,
    availableStemLengths: [],
    allowedStemAngles: [],
    integratedCockpit: true,
    availableCockpitOptions: options,
    allowAftermarketStem: false,
    allowAftermarketHandlebar: false,
    maximumRecommendedSpacerHeight: null,
    notes: "",
  };
}

describe("unknown stem angles are never enumerated as configuration values", () => {
  it("uses only the documented angle when a known and an unknown angle exist", () => {
    const configurations = generateLegalConfigurations(
      constraintsWith([integratedOption("known--6deg", -6), integratedOption("unknown", null)]),
    );

    expect(configurations).toHaveLength(2);
    expect(configurations.map((c) => c.stemAngle)).toEqual([-6, -6]);
    expect(configurations.map((c) => c.spacerHeight).sort((a, b) => a - b)).toEqual([0, 50]);
    expect(configurations.every((c) => c.stemLength === 100)).toBe(true);
  });

  it("produces no candidates when every angle is unknown", () => {
    const constraints = constraintsWith([integratedOption("unknown", null)]);
    expect(generateLegalConfigurations(constraints)).toHaveLength(0);

    const diagnostic = diagnoseConfigurationSpace(constraints);
    expect(diagnostic?.code).toBe("CONSTRAINT_DIMENSION_UNAVAILABLE");
    expect(diagnostic?.missing).toContain("stemAngle");
  });
});

describe("NO_CANDIDATES diagnostics", () => {
  it("Cervelo S5 reports documented stem lengths with an unavailable stem angle", () => {
    const bike = bikes.find((b) => b.id === "cervelo-s5-54")!;
    const result = optimiseBike({ bike, target: { x: 470, y: 631 } });

    expect(classifyOptimisationOutcome(result)).toBe("NO_CANDIDATES");
    const diagnostic = result.constraintDiagnostic;
    expect(diagnostic).not.toBeNull();
    expect(diagnostic!.code).toBe("CONSTRAINT_DIMENSION_UNAVAILABLE");
    expect(diagnostic!.missing).toEqual(["stemAngle"]);
    expect(diagnostic!.documented).toContain("stemLength");
    expect(diagnostic!.message).toContain("stemAngle");
  });

  it("carries no diagnostic when configurations exist", () => {
    const bike = bikes.find((b) => b.id === "cannondale-supersix-evo-lab71-54")!;
    const result = optimiseBike({ bike, target: { x: 470, y: 631 } });
    expect(result.constraintDiagnostic).toBeNull();
  });
});

describe("generated configuration counts", () => {
  const expected: Record<string, number> = {
    "canyon-ultimate-cfr-m": 14,
    "canyon-ultimate-cfr-l": 14,
    "colnago-v5rs-2025-485": 36,
    "colnago-v5rs-2025-510": 36,
    "cannondale-supersix-evo-lab71-54": 2,
    "cannondale-supersix-evo-lab71-56": 2,
    "bmc-teammachine-slr01-54": 2,
    "bmc-teammachine-slr01-56": 2,
    "specialized-tarmac-sl8-2025-52": 16,
    "specialized-tarmac-sl8-2025-54": 16,
    "giant-tcr-advanced-sl-0-2025-m": 8,
    "giant-tcr-advanced-sl-0-2025-ml": 8,
    "cervelo-s5-54": 0,
    "cervelo-s5-56": 0,
    "giant-defy-advanced-1-2014-ml": 0,
  };

  for (const [bikeId, count] of Object.entries(expected)) {
    it(`${bikeId} enumerates ${count} configurations`, () => {
      const bike = bikes.find((b) => b.id === bikeId)!;
      const configurations = generateLegalConfigurations(deriveConstraintsFromBike(bike));
      expect(configurations).toHaveLength(count);
    });
  }
});
