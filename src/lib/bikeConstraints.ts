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
  const handlebarRotation = bike.stockHandlebarRotation ?? null;
  const hoodReach = known(bike.stockHoodReach);
  const hoodStack = known(bike.stockHoodStack);
  const hoodRotation = bike.stockHoodRotation ?? null;

  // stemAngle is intentionally excluded: it never determines on its own whether
  // a cockpit option exists.
  const hasAnyCockpitData = [
    stemLength,
    reach,
    stack,
    handlebarRotation,
    hoodReach,
    hoodStack,
    hoodRotation,
  ].some((value) => value !== null);
  if (!hasAnyCockpitData) return null;

  return {
    id: `${bike.id}-stock-cockpit`,
    name: bike.cockpitModel ?? "Stock cockpit",
    stemLength,
    stemAngle: bike.stockStemAngle ?? null,
    handlebarReach: reach,
    handlebarStack: stack,
    handlebarRotation,
    hoodReach,
    hoodStack,
    hoodRotation,
    isStock: true,
    isIntegrated: bike.integratedCockpit === true,
    isAftermarket: false,
  };
}


export function deriveConstraintsFromBike(bike: Bike): BikeFitConstraints {
  const stock = stockCockpitOption(bike);
  const stockSpacer = known(bike.stockSpacerHeight);
  const maxSpacer = known(bike.maxSpacerHeight);

  // Verified, source-backed configuration data for this exact bike, when it
  // exists. Nothing here is invented: unknown configuration values stay null.
  const configuration = getBikeConfiguration(bike.id);
  const fromConfig = configuration ? constraintInputsFromConfiguration(configuration) : null;

  const bikeSpacerHeights = [0, stockSpacer, maxSpacer].filter(
    (v): v is Millimetres => v !== null,
  );
  const availableSpacerHeights = Array.from(
    new Set([...bikeSpacerHeights, ...(fromConfig?.availableSpacerHeights ?? [])]),
  ).sort((a, b) => a - b);

  const maximumSpacerHeight = maxSpacer ?? fromConfig?.maximumSpacerHeight ?? null;
  const cockpitOptions = [...(fromConfig?.availableCockpitOptions ?? []), ...(stock ? [stock] : [])];
  const integratedCockpit = bike.integratedCockpit ?? fromConfig?.integratedCockpit ?? null;

  return {
    bikeId: bike.id,
    minimumSpacerHeight: 0,
    maximumSpacerHeight,
    // Only heights that are actually recorded for this bike.
    availableSpacerHeights,
    minimumStemLength: known(bike.minimumStemLength),
    maximumStemLength: known(bike.maximumStemLength),
    availableStemLengths: fromConfig?.availableStemLengths ?? [],
    allowedStemAngles: fromConfig?.allowedStemAngles ?? [],
    integratedCockpit,
    availableCockpitOptions: cockpitOptions,
    allowAftermarketStem: integratedCockpit !== true,
    allowAftermarketHandlebar: integratedCockpit !== true,
    maximumRecommendedSpacerHeight: maxSpacer,
    notes: bike.notes ?? "",
  };
}

