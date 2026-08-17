import { describe, expect, it } from "vitest";
import type { Bike, RiderProfile } from "@/types";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { generateLegalConfigurations } from "@/lib/constraintGenerator";
import { frameGeometryFromBike } from "@/lib/optimisation/frameGeometry";
import { solveConfiguration } from "@/lib/optimisation/geometrySolver";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";

/**
 * Proves the production data path:
 *
 *   Bike → deriveConstraintsFromBike() → stockCockpitOption() → CockpitOption
 *        → BikeFitConstraints → generateLegalConfigurations()
 *        → CockpitConfiguration → Geometry Solver → Error Calculator
 *        → Ranking Engine → bestConfiguration
 *
 * No pipeline is mocked and no configuration is hand-constructed. The fixture
 * bike carries complete engineering values purely to exercise the real path.
 */

/** Test-only fixture with complete cockpit geometry. */
function completeBike(overrides: Partial<Bike> = {}): Bike {
  return {
    id: "fixture-bike",
    brand: "Fixture",
    model: "Complete Cockpit",
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
    // Integrated so the stock cockpit option fully defines stem length/angle.
    integratedCockpit: true,
    notes: "",
    headTubeAngle: 73,
    stockStemLength: 100,
    stockStemAngle: -6,
    stockHandlebarReach: 80,
    stockHandlebarStack: 130,
    stockHandlebarRotation: 0,
    stockHoodReach: 90,
    stockHoodStack: 20,
    stockHoodRotation: 0,
    stockSpacerHeight: 20,
    maxSpacerHeight: 30,
    minimumStemLength: 80,
    maximumStemLength: 120,
    ...overrides,
  };
}

const rider: RiderProfile = {
  id: "rider-1",
  name: "Fixture Rider",
  currentBike: "Fixture Complete Cockpit",
  handlebarX: 480,
  handlebarY: 640,
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

describe("cockpit geometry data path", () => {
  it("threads stock cockpit geometry from Bike into CockpitOption", () => {
    const constraints = deriveConstraintsFromBike(completeBike());
    const option = constraints.availableCockpitOptions[0]!;

    expect(option.handlebarReach).toBe(80);
    expect(option.handlebarStack).toBe(130);
    expect(option.handlebarRotation).toBe(0);
    expect(option.hoodReach).toBe(90);
    expect(option.hoodStack).toBe(20);
    expect(option.hoodRotation).toBe(0);
  });

  it("creates a cockpit option when only hood data is available", () => {
    const constraints = deriveConstraintsFromBike(
      completeBike({
        stockStemLength: null,
        stockStemAngle: null,
        stockHandlebarReach: null,
        stockHandlebarStack: null,
        stockHandlebarRotation: null,
        stockHoodReach: 90,
        stockHoodStack: 20,
        stockHoodRotation: null,
      }),
    );

    expect(constraints.availableCockpitOptions).toHaveLength(1);
    expect(constraints.availableCockpitOptions[0]!.hoodReach).toBe(90);
  });

  it("creates no cockpit option when all seven cockpit fields are null", () => {
    const constraints = deriveConstraintsFromBike(
      completeBike({
        stockStemLength: null,
        stockHandlebarReach: null,
        stockHandlebarStack: null,
        stockHandlebarRotation: null,
        stockHoodReach: null,
        stockHoodStack: null,
        stockHoodRotation: null,
      }),
    );

    expect(constraints.availableCockpitOptions).toHaveLength(0);
  });

  it("carries the cockpit geometry into every generated configuration", () => {
    const constraints = deriveConstraintsFromBike(completeBike());
    const configurations = generateLegalConfigurations(constraints);

    expect(configurations.length).toBeGreaterThan(0);
    for (const configuration of configurations) {
      expect(configuration.handlebarRotation).toBe(0);
      expect(configuration.hoodReach).toBe(90);
      expect(configuration.hoodStack).toBe(20);
      expect(configuration.hoodRotation).toBe(0);
    }
  });

  it("solves RP5 and produces a non-null bestConfiguration through the real pipeline", () => {
    const bike = completeBike();
    const constraints = deriveConstraintsFromBike(bike);
    const configurations = generateLegalConfigurations(constraints);
    const solved = solveConfiguration(configurations[0]!, frameGeometryFromBike(bike));

    expect(solved.status).toBe("SOLVED");
    expect(solved.rp5).not.toBeNull();

    const result = optimiseBike({ bike, rider });

    expect(result.evaluatedConfigurations.length).toBeGreaterThan(0);
    expect(result.bestConfiguration).not.toBeNull();
    expect(result.bestConfiguration!.assessment.positionMetrics).toBeDefined();
    expect(result.optimisationSummary.solvedConfigurations).toBeGreaterThan(0);
  });
});

describe("incomplete cockpit data is preserved, not filtered", () => {
  const cases: Array<[string, Partial<Bike>, string]> = [
    ["missing hoodReach", { stockHoodReach: null }, "hoodReach"],
    ["missing hoodStack", { stockHoodStack: null }, "hoodStack"],
    ["missing hoodRotation", { stockHoodRotation: null }, "hoodRotation"],
    ["missing handlebarRotation", { stockHandlebarRotation: null }, "handlebarRotation"],
  ];

  for (const [name, overrides, missingInput] of cases) {
    it(`${name}: configuration is generated and solved to RP3 only`, () => {
      const bike = completeBike(overrides);
      const constraints = deriveConstraintsFromBike(bike);
      const configurations = generateLegalConfigurations(constraints);

      // Not treated as an illegal configuration.
      expect(configurations.length).toBeGreaterThan(0);

      const solved = solveConfiguration(configurations[0]!, frameGeometryFromBike(bike));
      expect(solved.status).toBe("SOLVED");
      expect(solved.rp3).not.toBeNull();
      expect(solved.rp4).toBeNull();
      expect(solved.rp5).toBeNull();
      expect(solved.missingInputs).toContain(missingInput);

      const result = optimiseBike({ bike, rider });
      expect(result.bestConfiguration).not.toBeNull();
      const warning = result.bestConfiguration!.assessment.geometryWarnings.find(
        (w) => w.code === "RP4_RP5_UNAVAILABLE",
      )!;
      expect(warning.measurements!["missingInputs"]).toContain(missingInput);
    });
  }

  it("generates the same number of configurations with or without hood data", () => {
    const withHood = generateLegalConfigurations(
      deriveConstraintsFromBike(completeBike()),
    );
    const withoutHood = generateLegalConfigurations(
      deriveConstraintsFromBike(
        completeBike({ stockHoodReach: null, stockHoodStack: null, stockHoodRotation: null }),
      ),
    );

    expect(withoutHood).toHaveLength(withHood.length);
  });
});
