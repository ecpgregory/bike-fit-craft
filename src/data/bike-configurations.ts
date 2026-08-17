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
    bikeId: "specialized-tarmac-sl8-2025-54",
    cockpits: [
      {
        id: "tarmac-sl8-54-rapide-cockpit",
        name: "Roval Rapide one-piece cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [],
        stemAngles: [],
        handlebarReach: null,
        handlebarDrop: null,
        notes:
          "Tarmac SL8 uses the Roval Rapide one-piece cockpit interface. Per-size stem length, stem angle and bar reach/drop are not established from manufacturer documentation and are left unknown.",
        sources: [
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
        "Contents of the Specialized headset spacer + transition kit for the Rapide cockpit. Manufacturer documents the kit contents, not a maximum permitted spacer height.",
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
