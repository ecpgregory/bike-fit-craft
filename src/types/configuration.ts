/**
 * Bike fit *configuration* data.
 *
 * Deliberately kept separate from frame geometry (`Bike` in ./index):
 * geometry describes the frame, configuration describes the manufacturer
 * supported build options that materially affect rider position.
 *
 * Nothing here performs calculations. Unknown values are `null` and must be
 * treated as "not established", never as "impossible".
 */

import type { Millimetres } from "./index";

/** Where a source came from, so provenance survives future migrations. */
export interface SourceReference {
  label: string;
  url: string;
}

export type CockpitKind = "integrated" | "stem-and-handlebar";

/** A manufacturer supported cockpit build option for one bike size. */
export interface CockpitConfigurationSpec {
  id: string;
  name: string;
  kind: CockpitKind;
  /** True when supplied/approved as the standard configuration for this size. */
  isStock: boolean;
  /** Documented stem lengths, mm. Empty array = not established. */
  stemLengths: Millimetres[];
  /** Documented stem angles, degrees. Empty array = not established. */
  stemAngles: number[];
  handlebarReach: Millimetres | null;
  handlebarDrop: Millimetres | null;
  /** Documented handlebar width (centre-to-centre at the hoods), mm. */
  handlebarWidth?: Millimetres | null;
  /**
   * Manufacturer-published reference figures for this frame + cockpit pairing.
   * Recorded verbatim for provenance; NOT cockpit coordinates and never used
   * as handlebarStack / handlebarReach substitutes.
   */
  manufacturerReference?: {
    /** Published "stack to stem" figure, mm. */
    stackToStem: Millimetres | null;
    /** Published "reach to stem" figure, mm. */
    reachToStem: Millimetres | null;
  };
  notes: string;
  sources: SourceReference[];
}

/** One discrete spacer or transition part documented for the headset stack. */
export interface SpacerPart {
  /** e.g. "lower transition spacer", "spacer", "upper transition spacer". */
  description: string;
  /** Height in mm; null when the part height is not documented. */
  height: Millimetres | null;
  quantity: number;
}

/**
 * The documented headset/spacer configuration.
 *
 * `documentedMaximumBelowStem` is only populated when the manufacturer
 * explicitly states a maximum. The supplied kit capacity is recorded
 * separately and must not be reinterpreted as a limit.
 */
export interface HeadsetSpacerConfiguration {
  /** Smallest documented adjustment step, mm. Null when not established. */
  spacerIncrement: Millimetres | null;
  /** Individual documented parts as supplied. */
  suppliedParts: SpacerPart[];
  /** Total below-stem spacer height achievable with the supplied kit, mm. */
  suppliedSpacerCapacity: Millimetres | null;
  /** Manufacturer stated maximum below-stem spacer height, mm. Null = unknown. */
  documentedMaximumBelowStem: Millimetres | null;
  /** True only when the manufacturer documents the above as a maximum. */
  isManufacturerStatedMaximum: boolean;
  notes: string;
  sources: SourceReference[];
}

/** Seatpost offset options that can move the saddle fore/aft. */
export interface SeatpostConfiguration {
  /** Documented setback options, mm. Empty array = not established. */
  offsets: Millimetres[];
  notes: string;
  sources: SourceReference[];
}

/** All configuration data for one bike size. */
export interface BikeConfiguration {
  /** Matches `Bike.id`. */
  bikeId: string;
  cockpits: CockpitConfigurationSpec[];
  headset: HeadsetSpacerConfiguration | null;
  seatpost: SeatpostConfiguration | null;
  notes: string;
}
