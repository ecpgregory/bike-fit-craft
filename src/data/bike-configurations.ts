import type { BikeConfiguration } from "@/types/configuration";

/**
 * Verified, source-backed fit configuration data.
 *
 * Only bikes with manufacturer-documented configuration data appear here.
 * Anything not substantiated by a manufacturer source is recorded as unknown
 * (null / empty array), never guessed.
 */
export const bikeConfigurations: BikeConfiguration[] = [
  {
    bikeId: "specialized-tarmac-sl8-2025-52",
    cockpits: [
      {
        id: "tarmac-sl8-52-rapide-cockpit",
        name: "Roval Rapide integrated cockpit (90 mm x 400 mm)",
        kind: "integrated",
        isStock: true,
        stemLengths: [90],
        stemAngles: [-6],
        handlebarReach: 75,
        handlebarDrop: null,
        handlebarWidth: 400,
        notes:
          "Stock Tarmac SL8 size 52 ships with the Roval Rapide one-piece cockpit, 90 mm stem length, -6 deg stem angle, 400 mm bar width, 75 mm bar reach. Handlebar stack, handlebar rotation and hood reach/stack/rotation are not substantiated by Specialized documentation and remain unknown. Specialized stack-to-stem / reach-to-stem figures for size 52 were not established and are omitted rather than copied from another size.",
        sources: [
          {
            label: "Roval Rapide Cockpit",
            url: "https://www.specialized.com/au/en/roval-rapide-cockpit/p/218323",
          },
          {
            label: "S-Works Tarmac SL8 Shimano Dura-Ace Di2 (spec & geometry)",
            url: "https://www.specialized.com/au/en/s-works-tarmac-sl8-shimano-dura-ace-di2/p/4221536",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: 5,
      suppliedParts: [
        { description: "Lower transition spacer", height: 6.6, quantity: 1 },
        { description: "Spacer", height: 10, quantity: 3 },
        { description: "Spacer", height: 5, quantity: 1 },
        { description: "Upper transition spacer", height: null, quantity: 1 },
      ],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: null,
      isManufacturerStatedMaximum: false,
      notes:
        "Specialized documents a single Tarmac SL8 headset spacer + transition kit for the Rapide cockpit across the model, not per size; the same documented kit contents are recorded here. Manufacturer documents kit contents, not a maximum permitted spacer height.",
      sources: [
        {
          label: "Tarmac SL8 headset spacer + transition kit for Rapide cockpit",
          url: "https://www.specialized.com/us/en/tarmac-sl8-headset-spacer--transition-kit-for-rapide-cockpit/p/4242711",
        },
      ],
    },
    seatpost: null,
    notes:
      "Size 52 seatpost offset not established from manufacturer documentation; left unknown.",
  },
  {

    bikeId: "specialized-tarmac-sl8-2025-54",
    cockpits: [
      {
        id: "tarmac-sl8-54-rapide-cockpit",
        name: "Roval Rapide integrated cockpit (100 mm x 400 mm)",
        kind: "integrated",
        isStock: true,
        stemLengths: [100],
        stemAngles: [-6],
        handlebarReach: 75,
        handlebarDrop: null,
        handlebarWidth: 400,
        manufacturerReference: {
          // Specialized published SL8 size-54 figures. These are frame-to-stem
          // reference dimensions, NOT cockpit coordinates.
          stackToStem: 552,
          reachToStem: 381,
        },
        notes:
          "Stock S-Works Tarmac SL8 size 54 ships with the Roval Rapide one-piece cockpit, 100 mm stem length, -6 deg stem angle, 400 mm bar width, 75 mm bar reach. Handlebar stack, handlebar rotation and hood reach/stack/rotation are not substantiated by Specialized documentation and remain unknown. Roval steer-clamp height (40 mm) and Specialized stack-to-stem / reach-to-stem are distinct measurements and are not conflated with bar reach/stack.",
        sources: [
          {
            label: "Roval Rapide Cockpit",
            url: "https://www.specialized.com/au/en/roval-rapide-cockpit/p/218323",
          },
          {
            label: "S-Works Tarmac SL8 Shimano Dura-Ace Di2 (spec & geometry)",
            url: "https://www.specialized.com/au/en/s-works-tarmac-sl8-shimano-dura-ace-di2/p/4221536",
          },
          {
            label: "Specialized Tarmac SL8 frameset (FACT 10r carbon)",
            url: "https://www.specialized.com/au/en/tarmac-sl8-frameset-fact-10r-carbon/p/4221541",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: 5,
      suppliedParts: [
        { description: "Lower transition spacer", height: 6.6, quantity: 1 },
        { description: "Spacer", height: 10, quantity: 3 },
        { description: "Spacer", height: 5, quantity: 1 },
        { description: "Upper transition spacer", height: null, quantity: 1 },
      ],
      // Not summed: the transition spacers are shaped parts and the upper
      // transition spacer height is undocumented, so a single stack figure
      // cannot be derived without inventing data.
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: null,
      isManufacturerStatedMaximum: false,
      notes:
        "Contents of the Specialized headset spacer + transition kit for the Rapide cockpit (6.6 mm lower transition, 3 x 10 mm, 1 x 5 mm, upper transition of undocumented height). Specialized also documents a 7.8 mm combined lower/upper transition for the slammed Rapide configuration. Manufacturer documents the kit contents, not a maximum permitted spacer height. Specialized additionally requires 40 mm of steerer to remain above the last headset spacer for the Rapide cockpit; that requirement is recorded here only and is not converted into a spacer-height limit.",
      sources: [
        {
          label: "Tarmac SL8 headset spacer + transition kit for Rapide cockpit",
          url: "https://www.specialized.com/us/en/tarmac-sl8-headset-spacer--transition-kit-for-rapide-cockpit/p/4242711",
        },
      ],
    },
    seatpost: null,
    notes:
      "Size 54 seatpost offset not established from manufacturer documentation; left unknown.",
  },
  {
    bikeId: "colnago-v5rs-2025-510",
    cockpits: [
      {
        id: "colnago-v5rs-510-cc01",
        name: "Colnago CC.01 integrated cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [80, 90, 100, 110, 120],
        stemAngles: [],
        handlebarReach: null,
        handlebarDrop: null,
        notes:
          "CC.01 is offered in 80–120 mm stem lengths in 10 mm steps. Stem angle and bar reach/drop are not established from Colnago documentation and are left unknown.",
        sources: [
          {
            label: "Colnago CC.01 handlebar",
            url: "https://www.colnago.com/en-us/products/handlebar-cc01-wide",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: 5,
      suppliedParts: [
        { description: "Open spacer", height: 5, quantity: 5 },
        {
          description: "V5Rs-specific shaped/top spacer and headset components",
          height: null,
          quantity: 1,
        },
      ],
      suppliedSpacerCapacity: 25,
      documentedMaximumBelowStem: null,
      isManufacturerStatedMaximum: false,
      notes:
        "25 mm is the capacity of the supplied spacer kit (5 × 5 mm), not a stated maximum permitted spacer height.",
      sources: [
        {
          label: "Colnago V5Rs headset parts kit",
          url: "https://www.colnago.com/en-ph/products/v5rs-headset-parts-kit",
        },
        { label: "Colnago manuals", url: "https://www.colnago.com/en/manuals" },
      ],
    },
    seatpost: {
      offsets: [0, 15],
      notes: "V5Rs seatpost is available in 0 mm and 15 mm setback options.",
      sources: [
        { label: "Colnago manuals", url: "https://www.colnago.com/en/manuals" },
      ],
    },
    notes: "",
  },
];

/** Lookup helper. Returns null when no configuration data exists for a bike. */
export function getBikeConfiguration(bikeId: string): BikeConfiguration | null {
  return bikeConfigurations.find((c) => c.bikeId === bikeId) ?? null;
}
