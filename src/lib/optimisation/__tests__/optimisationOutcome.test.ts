import { describe, expect, it } from "vitest";
import type { Bike, RiderProfile } from "@/types";
import { generateLegalConfigurations } from "@/lib/constraintGenerator";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import {
  classifyOptimisationOutcome,
  defaultAcceptableFitEnvelope,
} from "@/lib/optimisation/optimisationOutcome";
import { runOptimisationPipeline } from "@/lib/optimisation/pipeline";

/**
 * Sprint 8A.1 — the three optimisation outcomes must stay distinguishable.
 * Nothing here changes solver, scoring or ranking behaviour.
 */

function bike(overrides: Partial<Bike> = {}): Bike {
  return {
    id: "outcome-fixture",
    brand: "Fixture",
    model: "Outcome",
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

const completeCockpit: Partial<Bike> = {
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
};

const rider: RiderProfile = {
  id: "rider-1",
  name: "Fixture Rider",
  currentBike: "Fixture Outcome",
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

describe("classifyOptimisationOutcome", () => {
  it("A — reports NO_CANDIDATES when zero configurations are generated", () => {
    const noData = bike();
    // Guard: the Constraint Generator genuinely produces nothing for this bike.
    expect(generateLegalConfigurations(deriveConstraintsFromBike(noData))).toHaveLength(0);

    const result = optimiseBike({ bike: noData, rider });

    expect(result.optimisationSummary.totalConfigurations).toBe(0);
    expect(result.bestConfiguration).toBeNull();
    expect(result.rejectedConfigurations).toHaveLength(0);
    expect(classifyOptimisationOutcome(result)).toBe("NO_CANDIDATES");
  });

  it("B — reports NO_VALID_RESULT when configurations exist but all are UNSOLVED", () => {
    // Handlebar/hood data present, head tube angle missing → solver UNSOLVED.
    const partial = bike({ ...completeCockpit, headTubeAngle: null });
    const result = optimiseBike({ bike: partial, rider });

    expect(result.optimisationSummary.totalConfigurations).toBeGreaterThan(0);
    expect(result.bestConfiguration).toBeNull();
    expect(classifyOptimisationOutcome(result)).toBe("NO_VALID_RESULT");

    // Existing solver diagnostics are preserved, not replaced by the outcome.
    const rejected = result.rejectedConfigurations;
    expect(rejected.length).toBeGreaterThan(0);
    expect(rejected.every((r) => r.stage === "GEOMETRY_SOLVER")).toBe(true);
    expect(rejected[0]!.unsolvedReason).toBe("MISSING_REQUIRED_INPUTS");
    expect(rejected[0]!.rejectionReasons.some((n) => n.code === "MISSING_ENGINEERING_INPUTS")).toBe(
      true,
    );
  });

  it("C — reports NO_VALID_RESULT when downstream evaluation rejects every candidate", () => {
    const solved = bike(completeCockpit);
    // Reuse the real pipeline, then drop every ranked result the way a
    // downstream rejection would, using the existing injectable pipeline hook.
    const result = optimiseBike({
      bike: solved,
      rider,
      runPipeline: (input) => {
        const real = runOptimisationPipeline(input);
        return {
          ...real,
          ranking: {
            ...real.ranking,
            rankedConfigurations: [],
            invalidConfigurations: real.ranking.rankedConfigurations.map((ranked) => ({
              candidateId: ranked.candidateId,
              assessment: ranked.assessment,
              rejectionReasons: [
                {
                  code: "TEST_DOWNSTREAM_REJECTION",
                  severity: "error" as const,
                  message: "rejected",
                },
              ],
            })),
          },
        };
      },
    });

    expect(result.optimisationSummary.totalConfigurations).toBeGreaterThan(0);
    expect(result.bestConfiguration).toBeNull();
    expect(result.rejectedConfigurations.some((r) => r.stage === "CONSTRAINT_EVALUATION")).toBe(
      true,
    );
    expect(classifyOptimisationOutcome(result)).toBe("NO_VALID_RESULT");
  });

  it("D — reports SUCCESS when a configuration is solved and ranked", () => {
    const result = optimiseBike({ bike: bike(completeCockpit), rider });

    expect(result.bestConfiguration).not.toBeNull();
    expect(classifyOptimisationOutcome(result)).toBe("SUCCESS");
  });
});

/**
 * Sprint 12A.5 — a valid configuration is not automatically a fit match.
 * The product tolerance is axis-separated: ±5 mm X, ±20 mm Y on RP3.
 * These use synthetic result shapes only; no geometry is recalculated.
 */
describe("acceptable fit envelope", () => {
  const stub = (deltaX: number, deltaY: number) =>
    ({
      optimisationSummary: {
        totalConfigurations: 4,
        solvedConfigurations: 4,
        rejectedConfigurations: 0,
      },
      bestConfiguration: {
        candidateId: "c1",
        assessment: {
          positionMetrics: {
            deltaX,
            deltaY,
            euclideanDistance: Math.hypot(deltaX, deltaY),
          },
        },
      },
    }) as never;

  it("accepts the X boundary and rejects just outside it", () => {
    expect(classifyOptimisationOutcome(stub(5, 0))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(-5, 0))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(5.01, 0))).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(classifyOptimisationOutcome(stub(-5.01, 0))).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("accepts the Y boundary and rejects just outside it", () => {
    expect(classifyOptimisationOutcome(stub(0, 20))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(0, -20))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(0, 20.01))).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(classifyOptimisationOutcome(stub(0, -20.01))).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("requires both axes simultaneously", () => {
    expect(classifyOptimisationOutcome(stub(5, 20))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(-5, -20))).toBe("SUCCESS");
    expect(classifyOptimisationOutcome(stub(5.01, 20))).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(classifyOptimisationOutcome(stub(5, 20.01))).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("is not Euclidean: a small distance with excessive X is rejected", () => {
    // 13.2 mm total error, well inside the retired 35 mm Euclidean envelope.
    expect(classifyOptimisationOutcome(stub(13.2, 2.1))).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("honours an injected envelope rather than the production default", () => {
    expect(
      classifyOptimisationOutcome(stub(4, 0), {
        maximumHorizontalError: 3,
        maximumVerticalError: 20,
      }),
    ).toBe("OUTSIDE_FIT_ENVELOPE");
    expect(defaultAcceptableFitEnvelope).toEqual({
      maximumHorizontalError: 5,
      maximumVerticalError: 20,
    });
  });
});

