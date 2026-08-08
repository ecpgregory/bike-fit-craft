import type {
  BikeFitConstraints,
  CockpitConfiguration,
  CockpitOption,
} from "@/types/optimisation";
import type { Millimetres } from "@/types";

/**
 * Constraint Generator — stage 1 of the optimisation pipeline.
 *
 * Enumerates every cockpit configuration that is physically possible for one
 * specific bike, using ONLY the supplied constraints. It never invents
 * components, never assumes compatibility, and contains no brand or model
 * logic. If constraint data is missing, fewer (or zero) configurations are
 * produced — nothing is guessed.
 *
 * No geometry maths happens here: solving handlebar coordinates is a later
 * stage.
 */

/** Ascending, de-duplicated numeric list — keeps output order deterministic. */
function sortedUnique(values: readonly number[]): number[] {
  return Array.from(new Set(values.filter((v) => Number.isFinite(v)))).sort((a, b) => a - b);
}

function withinBounds(
  value: number,
  min: number | null,
  max: number | null,
): boolean {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

/** Spacer heights that are both available and legal for this bike. */
function legalSpacerHeights(constraints: BikeFitConstraints): Millimetres[] {
  return sortedUnique(constraints.availableSpacerHeights).filter((height) =>
    withinBounds(height, constraints.minimumSpacerHeight, constraints.maximumSpacerHeight),
  );
}

/** Stem lengths that are both available and legal for this bike. */
function legalStemLengths(constraints: BikeFitConstraints): Millimetres[] {
  return sortedUnique(constraints.availableStemLengths).filter((length) =>
    withinBounds(length, constraints.minimumStemLength, constraints.maximumStemLength),
  );
}

/** Cockpit options permitted by the aftermarket policy, in a stable order. */
function legalCockpitOptions(constraints: BikeFitConstraints): CockpitOption[] {
  return [...constraints.availableCockpitOptions]
    .filter((option) => {
      if (!option.isAftermarket) return true;
      // An integrated aftermarket unit is both a bar and a stem.
      if (option.isIntegrated) {
        return constraints.allowAftermarketStem && constraints.allowAftermarketHandlebar;
      }
      return constraints.allowAftermarketHandlebar;
    })
    .filter((option) => {
      // An integrated unit's built-in stem must still respect stem limits.
      if (option.stemLength === null) return true;
      return withinBounds(
        option.stemLength,
        constraints.minimumStemLength,
        constraints.maximumStemLength,
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function formatMm(value: number | null): string {
  return value === null ? "unknown" : `${value} mm`;
}

function describe(config: Omit<CockpitConfiguration, "configurationDescription" | "id">): string {
  const parts = [
    `Stem ${formatMm(config.stemLength)}`,
    config.stemAngle === null ? "angle unknown" : `${config.stemAngle}°`,
    `${config.spacerHeight} mm spacers`,
  ];
  if (config.handlebarReach !== null || config.handlebarStack !== null) {
    parts.push(`bar reach ${formatMm(config.handlebarReach)} / stack ${formatMm(config.handlebarStack)}`);
  }
  const flags: string[] = [];
  if (config.requiresAftermarketStem) flags.push("aftermarket stem");
  if (config.requiresAftermarketHandlebar) flags.push("aftermarket bar");
  if (config.usesStockComponents) flags.push("stock");
  if (config.exceedsRecommendedSpacerHeight) flags.push("above recommended spacer height");
  return flags.length > 0 ? `${parts.join(" · ")} (${flags.join(", ")})` : parts.join(" · ");
}

function makeId(index: number, config: Omit<CockpitConfiguration, "configurationDescription" | "id">): string {
  return [
    String(index).padStart(3, "0"),
    `s${config.stemLength ?? "x"}`,
    `a${config.stemAngle ?? "x"}`,
    `h${config.spacerHeight}`,
    config.cockpitOptionId ?? "nocockpit",
  ].join("-");
}

function exceedsRecommended(height: Millimetres, constraints: BikeFitConstraints): boolean {
  const limit = constraints.maximumRecommendedSpacerHeight;
  return limit !== null && height > limit;
}

/**
 * Every legal cockpit configuration for one bike, in a deterministic order.
 *
 * Ordering: spacer height ascending → cockpit option id → stem length
 * ascending → stem angle ascending.
 */
export function generateLegalConfigurations(
  constraints: BikeFitConstraints,
): CockpitConfiguration[] {
  const spacerHeights = legalSpacerHeights(constraints);
  const stemLengths = legalStemLengths(constraints);
  const stemAngles = sortedUnique(constraints.allowedStemAngles);
  const cockpitOptions = legalCockpitOptions(constraints);

  // Without a legal spacer height there is nothing physically buildable.
  if (spacerHeights.length === 0) return [];

  const drafts: Array<Omit<CockpitConfiguration, "configurationDescription" | "id">> = [];

  for (const spacerHeight of spacerHeights) {
    const aboveRecommended = exceedsRecommended(spacerHeight, constraints);

    for (const option of cockpitOptions) {
      if (option.isIntegrated) {
        // The unit dictates stem length and angle; nothing to permute.
        drafts.push({
          stemLength: option.stemLength,
          stemAngle: option.stemAngle,
          spacerHeight,
          handlebarReach: option.handlebarReach,
          handlebarStack: option.handlebarStack,
          handlebarRotation: option.handlebarRotation,
          hoodReach: option.hoodReach,
          hoodStack: option.hoodStack,
          hoodRotation: option.hoodRotation,
          usesStockComponents: option.isStock,
          requiresAftermarketStem: option.isAftermarket,
          requiresAftermarketHandlebar: option.isAftermarket,
          exceedsRecommendedSpacerHeight: aboveRecommended,
          cockpitOptionId: option.id,
        });
        continue;
      }

      // A separate handlebar can be paired with any legal stem/angle pair.
      for (const stemLength of stemLengths) {
        for (const stemAngle of stemAngles) {
          drafts.push({
            stemLength,
            stemAngle,
            spacerHeight,
            handlebarReach: option.handlebarReach,
            handlebarStack: option.handlebarStack,
            handlebarRotation: option.handlebarRotation,
            hoodReach: option.hoodReach,
            hoodStack: option.hoodStack,
            hoodRotation: option.hoodRotation,
            usesStockComponents: option.isStock,
            requiresAftermarketStem: false,
            requiresAftermarketHandlebar: option.isAftermarket,
            exceedsRecommendedSpacerHeight: aboveRecommended,
            cockpitOptionId: option.id,
          });
        }
      }
    }

    // Stem-only permutations are legal only when the bike is not restricted to
    // an integrated cockpit and stem data exists.
    if (constraints.integratedCockpit !== true && cockpitOptions.length === 0) {
      for (const stemLength of stemLengths) {
        for (const stemAngle of stemAngles) {
          drafts.push({
            stemLength,
            stemAngle,
            spacerHeight,
            handlebarReach: null,
            handlebarStack: null,
            handlebarRotation: null,
            hoodReach: null,
            hoodStack: null,
            hoodRotation: null,
            usesStockComponents: false,
            requiresAftermarketStem: false,
            requiresAftermarketHandlebar: false,
            exceedsRecommendedSpacerHeight: aboveRecommended,
            cockpitOptionId: null,
          });
        }
      }
    }

  }

  return drafts.map((draft, index) => ({
    ...draft,
    id: makeId(index, draft),
    configurationDescription: describe(draft),
  }));
}
