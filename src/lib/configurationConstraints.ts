import type { Millimetres } from "@/types";
import type { CockpitOption } from "@/types/optimisation";
import type {
  BikeConfiguration,
  CockpitConfigurationSpec,
  HeadsetSpacerConfiguration,
} from "@/types/configuration";

/**
 * Adapter: verified BikeConfiguration records → optimisation constraint inputs.
 *
 * This module performs NO engineering maths and invents NO values. Anything the
 * configuration data records as unknown (null / empty array) is passed through
 * as unknown so the existing Geometry Solver reports it, rather than being
 * silently defaulted.
 */

/** Ascending, de-duplicated list. */
function sortedUnique(values: readonly number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

/**
 * Buildable below-stem spacer heights, derived only from documented parts.
 *
 * Preference order:
 * 1. Subset sums of the supplied parts whose heights are documented.
 * 2. Multiples of the documented spacer increment up to the documented
 *    supplied kit capacity.
 * Otherwise only 0 mm (no spacers) is known to be buildable.
 */
export function spacerHeightsFromHeadset(
  headset: HeadsetSpacerConfiguration | null,
): Millimetres[] {
  if (!headset) return [0];

  const parts: Millimetres[] = [];
  for (const part of headset.suppliedParts) {
    if (part.height === null) continue;
    for (let i = 0; i < part.quantity; i += 1) parts.push(part.height);
  }

  if (parts.length > 0) {
    let sums = new Set<number>([0]);
    for (const height of parts) {
      const next = new Set<number>(sums);
      for (const sum of sums) next.add(sum + height);
      sums = next;
    }
    return sortedUnique([...sums]);
  }

  const { spacerIncrement, suppliedSpacerCapacity } = headset;
  if (spacerIncrement !== null && spacerIncrement > 0 && suppliedSpacerCapacity !== null) {
    const heights: Millimetres[] = [];
    for (let h = 0; h <= suppliedSpacerCapacity; h += spacerIncrement) heights.push(h);
    return heights;
  }

  return [0];
}

/** Manufacturer-stated maximum only; kit capacity is never reinterpreted as a limit. */
export function maximumSpacerHeightFromHeadset(
  headset: HeadsetSpacerConfiguration | null,
): Millimetres | null {
  if (!headset) return null;
  return headset.isManufacturerStatedMaximum ? headset.documentedMaximumBelowStem : null;
}

/**
 * One CockpitOption per documented stem length (integrated cockpits are sold as
 * a discrete unit per length). When no stem length is documented, a single
 * option with unknown stem length is produced.
 */
export function cockpitOptionsFromSpec(spec: CockpitConfigurationSpec): CockpitOption[] {
  const isIntegrated = spec.kind === "integrated";
  const angles: Array<number | null> = spec.stemAngles.length > 0 ? spec.stemAngles : [null];
  const lengths: Array<Millimetres | null> =
    spec.stemLengths.length > 0 ? sortedUnique(spec.stemLengths) : [null];

  const options: CockpitOption[] = [];
  for (const stemLength of lengths) {
    for (const stemAngle of angles) {
      const suffix = [
        stemLength === null ? null : `${stemLength}mm`,
        stemAngle === null ? null : `${stemAngle}deg`,
      ]
        .filter((v): v is string => v !== null)
        .join("-");

      options.push({
        id: suffix ? `${spec.id}-${suffix}` : spec.id,
        name: suffix ? `${spec.name} (${suffix.replace("-", " / ")})` : spec.name,
        // Only an integrated unit dictates its own stem length.
        stemLength: isIntegrated ? stemLength : null,
        stemAngle: isIntegrated ? stemAngle : null,
        handlebarReach: spec.handlebarReach,
        // Unknown in the configuration model — never defaulted here.
        handlebarStack: null,
        handlebarRotation: null,
        hoodReach: null,
        hoodStack: null,
        hoodRotation: null,
        isStock: spec.isStock,
        isIntegrated,
        isAftermarket: false,
        notes: spec.notes,
      });
    }
  }
  return options;
}

export interface ConfigurationDerivedConstraints {
  availableSpacerHeights: Millimetres[];
  maximumSpacerHeight: Millimetres | null;
  availableStemLengths: Millimetres[];
  allowedStemAngles: number[];
  availableCockpitOptions: CockpitOption[];
  integratedCockpit: boolean | null;
}

/** Convert one verified configuration record into constraint inputs. */
export function constraintInputsFromConfiguration(
  configuration: BikeConfiguration,
): ConfigurationDerivedConstraints {
  const cockpitOptions = configuration.cockpits.flatMap(cockpitOptionsFromSpec);
  const separateStemLengths = configuration.cockpits
    .filter((c) => c.kind !== "integrated")
    .flatMap((c) => c.stemLengths);
  const separateStemAngles = configuration.cockpits
    .filter((c) => c.kind !== "integrated")
    .flatMap((c) => c.stemAngles);

  const anyIntegrated = configuration.cockpits.some((c) => c.kind === "integrated");

  return {
    availableSpacerHeights: spacerHeightsFromHeadset(configuration.headset),
    maximumSpacerHeight: maximumSpacerHeightFromHeadset(configuration.headset),
    availableStemLengths: sortedUnique(separateStemLengths),
    allowedStemAngles: sortedUnique(separateStemAngles),
    availableCockpitOptions: cockpitOptions,
    integratedCockpit: configuration.cockpits.length === 0 ? null : anyIntegrated,
  };
}
