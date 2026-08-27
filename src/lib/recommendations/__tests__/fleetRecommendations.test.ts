import { describe, expect, it, vi } from "vitest";
import { bikes } from "@/data/bikes";
import { riderProfile } from "@/data/rider-profile";
import { targetFromRider } from "@/lib/errorCalculator";
import * as fleet from "@/lib/optimisation/fleetOptimisationEngine";
import * as fitEngine from "@/lib/fitEngine";
import { buildFleetRecommendations } from "@/lib/recommendations/fleetRecommendations";

/** Sprint 9.2 — product integration: production engine drives recommendations. */

describe("rider target", () => {
  it("resolves to the established rider fit", () => {
    expect(targetFromRider(riderProfile)).toEqual({ x: 470, y: 631 });
  });
});

describe("recommendation flow", () => {
  const result = fleet.optimiseFleet({ rider: riderProfile });
  const view = buildFleetRecommendations(result, bikes);

  it("uses the production fleet engine, not the legacy fit engine", () => {
    const legacy = vi.spyOn(fitEngine, "calculateFit");
    const spy = vi.spyOn(fleet, "optimiseFleet");
    buildFleetRecommendations(fleet.optimiseFleet({ rider: riderProfile }), bikes);
    expect(spy).toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
    spy.mockRestore();
    legacy.mockRestore();
  });

  it("renders a mixed fleet without discarding bikes", () => {
    expect(view.recommendations.length + view.unavailable.length).toBe(view.totalBikes);
    expect(view.totalBikes).toBe(bikes.length);
  });

  it("preserves the engine's order and scores exactly", () => {
    expect(view.recommendations.map((r) => r.bikeId)).toEqual(
      result.rankedBikes.map((r) => r.bikeId),
    );
    expect(view.recommendations.map((r) => r.overallScore)).toEqual(
      result.rankedBikes.map((r) => r.bestConfiguration.overallScore),
    );
    expect(view.recommendations.map((r) => r.rank)).toEqual(
      view.recommendations.map((_, i) => i + 1),
    );
  });

  it("resolves brand, model and size by bikeId lookup for the verified SUCCESS bikes", () => {
    expect(view.recommendations.map((r) => r.bikeId)).toEqual([
      "bmc-teammachine-slr01-56",
      "bmc-teammachine-slr01-54",
      "canyon-ultimate-cfr-l",
      "specialized-tarmac-sl8-2025-54",
      "colnago-v5rs-2025-510",
      "canyon-ultimate-cfr-m",
      "giant-tcr-advanced-sl-0-2025-ml",
      "specialized-tarmac-sl8-2025-52",
      "colnago-v5rs-2025-485",
      "giant-tcr-advanced-sl-0-2025-m",
    ]);
    const top = view.recommendations[0]!;
    expect(top.bike?.brand).toBe("BMC");
    expect(top.bike?.model).toBe("Teammachine SLR01");
    expect(top.bike?.size).toBe("56");
    expect(top.overallScore).toBeCloseTo(0.6899, 4);
  });


  it("keeps the Giant Defy NO_CANDIDATES result visible as unranked", () => {
    const defy = view.unavailable.find((u) => u.bikeId === "giant-defy-advanced-1-2014-ml");
    expect(defy).toBeDefined();
    expect(defy!.outcome).toBe("NO_CANDIDATES");
    expect(defy!.bike?.model).toBe("Defy Advanced 1");
    expect(defy).not.toHaveProperty("overallScore");
  });

  it("keeps RP4_RP5_UNAVAILABLE as a warning on a valid recommendation", () => {
    const top = view.recommendations[0]!;
    expect(top.geometryWarnings.map((w) => w.code)).toContain("RP4_RP5_UNAVAILABLE");
  });

  it("retrieves the explanation for the recommended configuration", () => {
    const top = view.recommendations[0]!;
    const summary = result.rankedBikes[0]!;
    expect(top.explanation).toBe(
      summary.result.explanations[summary.bestConfiguration.candidateId],
    );
    expect(top.explanation?.headline).toBeTruthy();
    expect(top.explanation?.summary).toBeTruthy();
  });

  it("exposes the solved RP3 and configuration for the recommended candidate", () => {
    const top = view.recommendations[0]!;
    expect(top.predictedPosition?.x).toBeCloseTo(470, 1);
    expect(top.configuration?.stemLength).toBe(100);
  });
});
