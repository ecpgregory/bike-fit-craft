import type { Bike, Millimetres } from "@/types";
import type { BikeFitConstraints, CockpitOption } from "@/types/optimisation";

/**
 * Translates a generic Bike record into BikeFitConstraints.
 *
 * Manufacturer agnostic by design: this reads only generic fields on the Bike
 * record. Unknown values stay null and unavailable component lists stay empty
 * so the constraint generator cannot invent parts.
 */

function known(value: Millimetres | null | undefined): Millimetres | null {
  return value === null || value === undefined ? null : value;
}

/** The bike's stock cockpit, when enough data exists to describe one. */
function stockCockpitOption(bike: Bike): CockpitOption | null {
  const stemLength = known(bike.stockStemLength);
  const reach = known(bike.stockHandlebarReach);
  const stack = known(bike.stockHandlebarStack);
  if (stemLength === null && reach === null && stack === null) return null;
  return {
    id: `${bike.id}-stock-cockpit`,
    name: bike.cockpitModel ?? "Stock cockpit",
    stemLength,
    stemAngle: bike.stockStemAngle ?? null,
    handlebarReach: reach,
    handlebarStack: stack,
    isStock: true,
    isIntegrated: bike.integratedCockpit === true,
    isAftermarket: false,
  };
}

export function deriveConstraintsFromBike(bike: Bike): BikeFitConstraints {
  const stock = stockCockpitOption(bike);
  const stockSpacer = known(bike.stockSpacerHeight);
  const maxSpacer = known(bike.maxSpacerHeight);

  return {
    bikeId: bike.id,
    minimumSpacerHeight: 0,
    maximumSpacerHeight: maxSpacer,
    // Only heights that are actually recorded for this bike.
    availableSpacerHeights: Array.from(
      new Set([0, stockSpacer, maxSpacer].filter((v): v is Millimetres => v !== null)),
    ).sort((a, b) => a - b),
    minimumStemLength: known(bike.minimumStemLength),
    maximumStemLength: known(bike.maximumStemLength),
    availableStemLengths: [],
    allowedStemAngles: [],
    integratedCockpit: bike.integratedCockpit ?? null,
    availableCockpitOptions: stock ? [stock] : [],
    allowAftermarketStem: bike.integratedCockpit !== true,
    allowAftermarketHandlebar: bike.integratedCockpit !== true,
    maximumRecommendedSpacerHeight: maxSpacer,
    notes: bike.notes ?? "",
  };
}
