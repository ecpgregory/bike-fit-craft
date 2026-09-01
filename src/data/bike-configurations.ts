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
        handlebarDrop: 127,
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
        handlebarDrop: 127,
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
    bikeId: "colnago-v5rs-2025-485",
    cockpits: [
      {
        id: "colnago-v5rs-485-cc01-regular",
        name: "Colnago CC.01 Regular integrated cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [80, 90, 100, 110, 120, 130],
        stemAngles: [-8],
        handlebarReach: null,
        handlebarDrop: null,
        handlebarWidth: 390,
        notes:
          "Colnago's official V5Rs technical specification identifies the stock cockpit as the CC.01 integrated cockpit, regular geometry, with configurations documented from 80 mm through 130 mm stem length and an 82 deg stem angle (recorded here as -8 deg under this application's 90 deg-perpendicular convention). Sprint 10: the documented stock handlebar width for size 485 is 390 mm (centre-to-centre at the hoods). The CC.01 Wide is not standard on the V5Rs and is not represented. Handlebar reach/drop/stack, handlebar rotation and hood reach/stack/rotation (RP5 geometry) are not established by Colnago documentation and remain unknown.",
        sources: [
          {
            label: "Colnago V5Rs (official product page, stock cockpit)",
            url: "https://www.colnago.com/en-us/products/v5rs",
          },
          {
            label: "Colnago V5Rs technical specifications",
            url: "https://www.colnago.com/en-us/products/v5rs#technical-specifications",
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
        "V5Rs headset system (1 1/8 and 1 1/4, SLT treated bearings) and the V5Rs headset parts kit are documented by Colnago at model level, not per size, so the same documented kit contents are recorded here. 25 mm is the capacity of the supplied spacer kit (5 x 5 mm), not a stated maximum permitted spacer height.",
      sources: [
        {
          label: "Colnago V5Rs headset parts kit",
          url: "https://www.colnago.com/en-ph/products/v5rs-headset-parts-kit",
        },
        {
          label: "Colnago V5Rs technical specifications (headset system)",
          url: "https://www.colnago.com/en-us/products/v5rs#technical-specifications",
        },
        { label: "Colnago manuals", url: "https://www.colnago.com/en/manuals" },
      ],
    },
    seatpost: {
      offsets: [0, 15],
      notes:
        "V5Rs seatpost is documented at model level in 0 mm and 15 mm setback options.",
      sources: [
        { label: "Colnago manuals", url: "https://www.colnago.com/en/manuals" },
      ],
    },
    notes:
      "Size 485 configuration uses model-level V5Rs headset and seatpost documentation. No size-specific cockpit geometry copied from size 510.",
  },
  {
    bikeId: "colnago-v5rs-2025-510",
    cockpits: [
      {
        id: "colnago-v5rs-510-cc01-regular",
        name: "Colnago CC.01 Regular integrated cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [80, 90, 100, 110, 120, 130],
        stemAngles: [-8],
        handlebarReach: null,
        handlebarDrop: null,
        notes:
          "Colnago's official V5Rs technical specification identifies the stock cockpit as the CC.01 integrated cockpit, regular geometry, documented from 80 mm through 130 mm stem length with an 82 deg stem angle (recorded here as -8 deg under this application's 90 deg-perpendicular convention). 140 mm is not established by the V5Rs-specific specification and is not listed. The CC.01 Wide is a separately orderable option, not stock, and is not cited for Regular values. Handlebar reach/drop/stack, handlebar rotation and hood geometry remain unknown.",
        sources: [
          {
            label: "Colnago V5Rs (official product page, stock cockpit)",
            url: "https://www.colnago.com/en-us/products/v5rs",
          },
          {
            label: "Colnago V5Rs technical specifications",
            url: "https://www.colnago.com/en-us/products/v5rs#technical-specifications",
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

  // --- Sprint 9.4A: verified configuration data for the new race fleet -----
  // Hood reach / hood stack / hood rotation and handlebar rotation are not
  // documented by any of these manufacturers and remain unknown throughout.

  {
    bikeId: "giant-tcr-advanced-sl-0-2025-m",
    cockpits: [
      {
        id: "giant-tcr-sl-m-contact-slr-aerolight",
        name: "Giant Contact SLR AeroLight stem + handlebar",
        kind: "stem-and-handlebar",
        isStock: true,
        stemLengths: [100],
        stemAngles: [-10],
        handlebarReach: 72,
        handlebarDrop: 125,
        handlebarWidth: 420,
        notes:
          "Giant documents the size M TCR Advanced SL 0 as supplied with a 100 mm Contact SLR AeroLight stem at -10 deg and a 420 mm Contact SLR AeroLight bar with 72 mm reach. Handlebar stack, handlebar rotation and hood reach/stack/rotation are not documented and remain unknown.",
        sources: [
          {
            label: "Giant TCR Advanced SL 0 specifications and geometry",
            url: "https://www.giant-bicycles.com/global/tcr-advanced-sl-0",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: 2.5,
      suppliedParts: [
        { description: "Spacer", height: 2.5, quantity: 1 },
        { description: "Spacer", height: 5, quantity: 1 },
        { description: "Spacer", height: 10, quantity: 1 },
      ],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: null,
      isManufacturerStatedMaximum: false,
      notes:
        "Giant documents 2.5 / 5 / 10 mm spacer components for the Contact SLR AeroLight system. Supplied quantities are not documented (recorded as one each) and Giant states no maximum spacer height, so the maximum remains unknown.",
      sources: [
        {
          label: "Giant Contact SLR AeroLight cockpit / TCR service documentation",
          url: "https://www.giant-bicycles.com/global/tcr-advanced-sl-0",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
  {
    bikeId: "giant-tcr-advanced-sl-0-2025-ml",
    cockpits: [
      {
        id: "giant-tcr-sl-ml-contact-slr-aerolight",
        name: "Giant Contact SLR AeroLight stem + handlebar",
        kind: "stem-and-handlebar",
        isStock: true,
        stemLengths: [110],
        stemAngles: [-10],
        handlebarReach: 72,
        handlebarDrop: 125,
        handlebarWidth: 420,
        notes:
          "Giant documents the size M/L TCR Advanced SL 0 as supplied with a 110 mm Contact SLR AeroLight stem at -10 deg and a 420 mm Contact SLR AeroLight bar with 72 mm reach. Handlebar stack, handlebar rotation and hood geometry remain unknown.",
        sources: [
          {
            label: "Giant TCR Advanced SL 0 specifications and geometry",
            url: "https://www.giant-bicycles.com/global/tcr-advanced-sl-0",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: 2.5,
      suppliedParts: [
        { description: "Spacer", height: 2.5, quantity: 1 },
        { description: "Spacer", height: 5, quantity: 1 },
        { description: "Spacer", height: 10, quantity: 1 },
      ],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: null,
      isManufacturerStatedMaximum: false,
      notes:
        "Documented spacer components only (2.5 / 5 / 10 mm). No manufacturer-stated maximum spacer height.",
      sources: [
        {
          label: "Giant Contact SLR AeroLight cockpit / TCR service documentation",
          url: "https://www.giant-bicycles.com/global/tcr-advanced-sl-0",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },

  {
    bikeId: "bmc-teammachine-slr01-54",
    cockpits: [
      {
        id: "bmc-slr01-54-ics",
        name: "BMC ICS integrated cockpit (100 mm x 400/436 mm)",
        kind: "integrated",
        isStock: true,
        stemLengths: [100],
        stemAngles: [-12],
        handlebarReach: 68,
        handlebarDrop: 128,
        handlebarWidth: 400,
        notes:
          "BMC documents the size 54 Teammachine SLR01 ICS cockpit as 100 mm stem at -12 deg, 70 mm bar reach, 127 mm drop, 400 mm at the hoods flaring to 436 mm at the drops. Handlebar stack, handlebar rotation and hood reach/stack/rotation are not documented and remain unknown.",
        sources: [
          {
            label: "BMC Teammachine SLR01 specifications and geometry",
            url: "https://www.bmc-switzerland.com/en-au/teammachine-slr",
          },
          {
            label: "BMC ICS cockpit technical documentation",
            url: "https://www.bmc-switzerland.com/en-au/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 60,
      isManufacturerStatedMaximum: true,
      notes:
        "BMC documents a maximum ICS spacer/stack adjustment of 60 mm. Individual spacer component heights are not re-derived into a different maximum. Intermediate buildable heights are not documented and are therefore not enumerated here.",
      sources: [
        {
          label: "BMC ICS cockpit technical documentation",
          url: "https://www.bmc-switzerland.com/en-au/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
  {
    bikeId: "bmc-teammachine-slr01-56",
    cockpits: [
      {
        id: "bmc-slr01-56-ics",
        name: "BMC ICS integrated cockpit (110 mm x 400/436 mm)",
        kind: "integrated",
        isStock: true,
        stemLengths: [110],
        stemAngles: [-12],
        handlebarReach: 68,
        handlebarDrop: 128,
        handlebarWidth: 400,
        notes:
          "BMC documents the size 56 Teammachine SLR01 ICS cockpit as 110 mm stem at -12 deg, 70 mm bar reach, 127 mm drop, 400 mm at the hoods flaring to 436 mm at the drops. Handlebar stack, handlebar rotation and hood geometry remain unknown.",
        sources: [
          {
            label: "BMC Teammachine SLR01 specifications and geometry",
            url: "https://www.bmc-switzerland.com/en-au/teammachine-slr",
          },
          {
            label: "BMC ICS cockpit technical documentation",
            url: "https://www.bmc-switzerland.com/en-au/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 60,
      isManufacturerStatedMaximum: true,
      notes:
        "BMC documents a maximum ICS spacer/stack adjustment of 60 mm. Intermediate buildable heights are not documented and are not enumerated.",
      sources: [
        {
          label: "BMC ICS cockpit technical documentation",
          url: "https://www.bmc-switzerland.com/en-au/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },

  {
    bikeId: "cannondale-supersix-evo-lab71-54",
    cockpits: [
      {
        id: "cannondale-lab71-54-systembar-r-one",
        name: "Cannondale SystemBar R-One integrated cockpit",
        kind: "integrated",
        isStock: true,
        // Sprint 9.4B: Cannondale's official SuperSix EVO LAB71 specification
        // identifies the SystemBar Road integrated cockpit as 100 x 360 mm
        // for sizes 54-56, establishing the supplied stem length.
        stemLengths: [100],
        stemAngles: [-6],
        handlebarReach: 80,
        handlebarDrop: 130,
        handlebarWidth: 360,
        notes:
          "Cannondale documents the SystemBar R-One at -6 deg with 80 mm reach and 130 mm drop. The official SuperSix EVO LAB71 specification identifies the SystemBar Road cockpit as 100 x 360 mm for sizes 54-56, establishing the 100 mm supplied stem length. Handlebar stack, handlebar rotation and hood reach/stack/rotation are not documented.",
        sources: [
          {
            label: "Cannondale SuperSix EVO LAB71 specifications and geometry",
            url: "https://www.cannondale.com/en-au/bikes/road/race/supersix-evo",
          },
          {
            label: "Cannondale SystemBar R-One owner's manual supplement",
            url: "https://www.cannondale.com/en-au/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 50,
      isManufacturerStatedMaximum: true,
      notes:
        "Cannondale documents a maximum of 50 mm of spacers plus a 5 mm dust cover. The documented maximum recorded here is spacer material only (50 mm), matching this schema's below-stem spacer definition; the dust cover is not added.",
      sources: [
        {
          label: "Cannondale SystemBar R-One owner's manual supplement",
          url: "https://www.cannondale.com/en-au/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
  {
    bikeId: "cannondale-supersix-evo-lab71-56",
    cockpits: [
      {
        id: "cannondale-lab71-56-systembar-r-one",
        name: "Cannondale SystemBar R-One integrated cockpit",
        kind: "integrated",
        isStock: true,
        // Sprint 9.4B: Cannondale's official SuperSix EVO LAB71 specification
        // identifies the SystemBar Road integrated cockpit as 100 x 360 mm
        // for sizes 54-56, establishing the supplied stem length.
        stemLengths: [100],
        stemAngles: [-6],
        handlebarReach: 80,
        handlebarDrop: 130,
        handlebarWidth: 360,
        notes:
          "Cannondale documents the SystemBar R-One at -6 deg with 80 mm reach and 130 mm drop. The official SuperSix EVO LAB71 specification identifies the SystemBar Road cockpit as 100 x 360 mm for sizes 54-56, establishing the 100 mm supplied stem length. Handlebar stack, handlebar rotation and hood geometry remain unknown.",
        sources: [
          {
            label: "Cannondale SuperSix EVO LAB71 specifications and geometry",
            url: "https://www.cannondale.com/en-au/bikes/road/race/supersix-evo",
          },
          {
            label: "Cannondale SystemBar R-One owner's manual supplement",
            url: "https://www.cannondale.com/en-au/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 50,
      isManufacturerStatedMaximum: true,
      notes:
        "Documented maximum of 50 mm of spacers (plus a separate 5 mm dust cover, not included in the spacer figure).",
      sources: [
        {
          label: "Cannondale SystemBar R-One owner's manual supplement",
          url: "https://www.cannondale.com/en-au/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },

  {
    bikeId: "cervelo-s5-54",
    cockpits: [
      {
        id: "cervelo-s5-54-st35-hb14",
        name: "Cervélo ST35 stem + HB14 handlebar",
        kind: "stem-and-handlebar",
        isStock: true,
        stemLengths: [80, 90, 100, 110, 120, 130],
        // ST35 stem angle is not published by Cervélo; left unknown.
        stemAngles: [],
        handlebarReach: null,
        handlebarDrop: null,
        handlebarWidth: null,
        notes:
          "Cervélo documents the S5 ST35 stem in 80-130 mm lengths, supplied at 100 mm, with the HB14 handlebar. Stem angle, handlebar reach/stack/drop and hood geometry are not published. The documented ±5 deg rotation is an adjustment range, not a stock orientation, so handlebar rotation remains unknown.",
        sources: [
          {
            label: "Cervélo S5 specifications and geometry",
            url: "https://www.cervelo.com/en-AU/bikes/s5",
          },
          {
            label: "Cervélo ST35 stem / HB14 handlebar technical documentation",
            url: "https://www.cervelo.com/en-AU/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 30,
      isManufacturerStatedMaximum: true,
      notes:
        "Cervélo documents a maximum stem-spacer height of 30 mm for the ST35 system. Individual spacer component heights are not published, so intermediate buildable heights are not enumerated.",
      sources: [
        {
          label: "Cervélo ST35 stem technical documentation",
          url: "https://www.cervelo.com/en-AU/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
  {
    bikeId: "cervelo-s5-56",
    cockpits: [
      {
        id: "cervelo-s5-56-st35-hb14",
        name: "Cervélo ST35 stem + HB14 handlebar",
        kind: "stem-and-handlebar",
        isStock: true,
        stemLengths: [80, 90, 100, 110, 120, 130],
        stemAngles: [],
        handlebarReach: null,
        handlebarDrop: null,
        handlebarWidth: null,
        notes:
          "Cervélo documents the S5 ST35 stem in 80-130 mm lengths, supplied at 100 mm, with the HB14 handlebar. Stem angle, handlebar geometry and hood geometry are not published. The ±5 deg rotation figure is an adjustment range, not stock rotation.",
        sources: [
          {
            label: "Cervélo S5 specifications and geometry",
            url: "https://www.cervelo.com/en-AU/bikes/s5",
          },
          {
            label: "Cervélo ST35 stem / HB14 handlebar technical documentation",
            url: "https://www.cervelo.com/en-AU/support/manuals",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 30,
      isManufacturerStatedMaximum: true,
      notes:
        "Documented maximum stem-spacer height of 30 mm. Component heights are not published.",
      sources: [
        {
          label: "Cervélo ST35 stem technical documentation",
          url: "https://www.cervelo.com/en-AU/support/manuals",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },

  {
    bikeId: "canyon-ultimate-cfr-m",
    cockpits: [
      {
        id: "canyon-ultimate-cfr-m-cp0018",
        name: "Canyon CP0018 integrated cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [70, 80, 90, 100, 110, 120, 130],
        stemAngles: [-6],
        handlebarReach: null,
        handlebarDrop: null,
        handlebarWidth: null,
        notes:
          "Canyon documents the CP0018 cockpit at -6 deg in 70-130 mm stem lengths. The stem length supplied on the size M Ultimate CFR is not explicitly established and is not assumed. Handlebar reach/stack/drop, handlebar rotation and hood geometry are not documented.",
        sources: [
          {
            label: "Canyon Ultimate CFR specifications and geometry",
            url: "https://www.canyon.com/en-au/road-bikes/race-bikes/ultimate/cfr/",
          },
          {
            label: "Canyon CP0018 cockpit technical documentation",
            url: "https://www.canyon.com/en-au/service/manuals.html",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 15,
      isManufacturerStatedMaximum: true,
      notes:
        "Canyon documents 15 mm of vertical adjustment below the CP0018 cockpit, which matches this schema's below-stem spacer height definition. Intermediate component heights are not published.",
      sources: [
        {
          label: "Canyon CP0018 cockpit technical documentation",
          url: "https://www.canyon.com/en-au/service/manuals.html",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
  {
    bikeId: "canyon-ultimate-cfr-l",
    cockpits: [
      {
        id: "canyon-ultimate-cfr-l-cp0018",
        name: "Canyon CP0018 integrated cockpit",
        kind: "integrated",
        isStock: true,
        stemLengths: [70, 80, 90, 100, 110, 120, 130],
        stemAngles: [-6],
        handlebarReach: null,
        handlebarDrop: null,
        handlebarWidth: null,
        notes:
          "Canyon documents the CP0018 cockpit at -6 deg in 70-130 mm stem lengths. The stem length supplied on the size L Ultimate CFR is not explicitly established and is not assumed. Handlebar and hood geometry are not documented.",
        sources: [
          {
            label: "Canyon Ultimate CFR specifications and geometry",
            url: "https://www.canyon.com/en-au/road-bikes/race-bikes/ultimate/cfr/",
          },
          {
            label: "Canyon CP0018 cockpit technical documentation",
            url: "https://www.canyon.com/en-au/service/manuals.html",
          },
        ],
      },
    ],
    headset: {
      spacerIncrement: null,
      suppliedParts: [],
      suppliedSpacerCapacity: null,
      documentedMaximumBelowStem: 15,
      isManufacturerStatedMaximum: true,
      notes:
        "Documented 15 mm of vertical adjustment below the CP0018 cockpit. Component heights are not published.",
      sources: [
        {
          label: "Canyon CP0018 cockpit technical documentation",
          url: "https://www.canyon.com/en-au/service/manuals.html",
        },
      ],
    },
    seatpost: null,
    notes: "Seatpost offset options not established; left unknown.",
  },
];


/** Lookup helper. Returns null when no configuration data exists for a bike. */
export function getBikeConfiguration(bikeId: string): BikeConfiguration | null {
  return bikeConfigurations.find((c) => c.bikeId === bikeId) ?? null;
}
