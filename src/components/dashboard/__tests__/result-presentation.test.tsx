// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { UnavailableBikeCard } from "@/components/dashboard/unavailable-bike-card";
import {
  fitEnvelopeDescription,
  positionDifferenceDescription,
} from "@/components/dashboard/recommendation-card";

afterEach(() => cleanup());

describe("fit result explanations", () => {
  it("describes viable, X, Y, both-axis and zero-delta results", () => {
    expect(fitEnvelopeDescription("SUCCESS", -3, -14)).toBe("Within your fit envelope.");
    expect(fitEnvelopeDescription("OUTSIDE_FIT_ENVELOPE", 13, 2)).toBe(
      "Outside fit envelope — 13 mm too far forward.",
    );
    expect(fitEnvelopeDescription("OUTSIDE_FIT_ENVELOPE", 2, -28)).toBe(
      "Outside fit envelope — 28 mm too low.",
    );
    expect(fitEnvelopeDescription("OUTSIDE_FIT_ENVELOPE", -8, 24)).toBe(
      "Outside fit envelope — 8 mm too far behind and 24 mm too high.",
    );
    expect(positionDifferenceDescription(0, 0)).toBe("on target; on target.");
  });
});

describe("unavailable result states", () => {
  const bike = {
    id: "test-bike",
    brand: "Test",
    model: "Bike",
    year: null,
    size: "54",
    frameStack: null,
    frameReach: null,
    headTube: null,
    wheelbase: null,
    frontCentre: null,
    chainstay: null,
    bbDrop: null,
    tyreClearance: null,
    integratedCockpit: null,
    notes: "",
  };

  it("presents NO_CANDIDATES as missing configuration data, not a failed fit", () => {
    render(
      <UnavailableBikeCard
        item={{ bikeId: bike.id, bike, outcome: "NO_CANDIDATES", diagnostics: [], totalConfigurations: 0 }}
      />,
    );
    expect(screen.getByText("Configuration data unavailable")).toBeTruthy();
    expect(screen.getByText(/no valid configurations exist to evaluate/i)).toBeTruthy();
  });

  it("presents NO_VALID_RESULT as an evaluated run with no valid position", () => {
    render(
      <UnavailableBikeCard
        item={{ bikeId: bike.id, bike, outcome: "NO_VALID_RESULT", diagnostics: [], totalConfigurations: 2 }}
      />,
    );
    expect(screen.getByText("No valid result")).toBeTruthy();
    expect(screen.getByText(/configurations were evaluated/i)).toBeTruthy();
  });
});