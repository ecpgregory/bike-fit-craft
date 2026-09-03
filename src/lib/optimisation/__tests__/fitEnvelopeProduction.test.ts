import { describe, expect, it } from "vitest";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { sensitivityTargets } from "./fitTargets";

/**
 * Sprint 12A.5 — the axis-separated RP3 envelope (±5 mm X, ±20 mm Y) applied
 * to the real production fleet. These protect the product decision, not the
 * implementation: they read the production optimiser's own output.
 */

const target = { x: 470, y: 631 };
const result = optimiseFleet({ target });

function ranked(bikeId: string) {
  const entry = result.rankedBikes.find((r) => r.bikeId === bikeId);
  expect(entry, `${bikeId} should be ranked`).toBeDefined();
  return entry!;
}

describe("production RP3 fit envelope at 470 / 631", () => {
  it("rejects BMC SLR01 56 — fore/aft error exceeds 5 mm despite a small total error", () => {
    const bmc56 = ranked("bmc-teammachine-slr01-56");
    const metrics = bmc56.bestConfiguration.assessment.positionMetrics;
    expect(metrics.deltaX).toBeCloseTo(13.2, 1);
    expect(metrics.deltaY).toBeCloseTo(2.1, 1);
    expect(bmc56.outcome).toBe("OUTSIDE_FIT_ENVELOPE");
  });

  it("accepts BMC SLR01 54 — both axes inside tolerance", () => {
    const bmc54 = ranked("bmc-teammachine-slr01-54");
    const metrics = bmc54.bestConfiguration.assessment.positionMetrics;
    expect(metrics.deltaX).toBeCloseTo(-2.7, 1);
    expect(metrics.deltaY).toBeCloseTo(-13.9, 1);
    expect(bmc54.outcome).toBe("SUCCESS");
  });

  it("rejects Tarmac SL8 54 — vertical error exceeds 20 mm", () => {
    const tarmac = ranked("specialized-tarmac-sl8-2025-54");
    const metrics = tarmac.bestConfiguration.assessment.positionMetrics;
    expect(Math.abs(metrics.deltaY)).toBeGreaterThan(20);
    expect(tarmac.outcome).toBe("OUTSIDE_FIT_ENVELOPE");
  });
});

describe("fleet classification totals across the established targets", () => {
  it("reports the expected viable counts per target", () => {
    const counts = sensitivityTargets.map((t) => {
      const fleet = optimiseFleet({ target: t });
      return {
        target: `${t.x}/${t.y}`,
        ranked: fleet.rankedBikes.length,
        viable: fleet.rankedBikes.filter((r) => r.outcome === "SUCCESS").length,
      };
    });

    expect(counts).toEqual([
      { target: "450/600", ranked: 12, viable: 0 },
      { target: "460/615", ranked: 12, viable: 0 },
      { target: "470/631", ranked: 12, viable: 3 },
      { target: "480/640", ranked: 12, viable: 1 },
      { target: "490/650", ranked: 12, viable: 0 },
    ]);
    expect(counts.reduce((sum, c) => sum + c.viable, 0)).toBe(4);
  });
});
