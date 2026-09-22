import type { Bike } from "@/types";

/**
 * Local bike database. One row = ONE bike size.
 * Only verified, manually entered geometry. Unknown fields stay null.
 */
export const bikes: Bike[] = [
  {
    id: "giant-defy-advanced-1-2014-ml",
    brand: "Giant",
    model: "Defy Advanced 1",
    year: 2014,
    size: "M/L",
    frameStack: 586,
    frameReach: 381,
    headTube: null,
    wheelbase: null,
    frontCentre: null,
    chainstay: null,
    bbDrop: null,
    tyreClearance: null,
    integratedCockpit: null,
    notes: "Current bike",
  },
  {
    id: "specialized-tarmac-sl8-2025-52",
    brand: "Specialized",
    model: "Tarmac SL8",
    year: 2025,
    size: "52",
    frameStack: 527,
    frameReach: 380,
    headTube: null,
    wheelbase: null,
    frontCentre: null,
    chainstay: null,
    bbDrop: null,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 72.5,
    notes: "Source: Specialized official geometry data for the Tarmac SL8 (size 52 head tube angle).",
  },
  {
    id: "specialized-tarmac-sl8-2025-54",
    brand: "Specialized",
    model: "Tarmac SL8",
    year: 2025,
    size: "54",
    frameStack: 544,
    frameReach: 384,
    headTube: 137,
    wheelbase: 978,
    frontCentre: 579,
    chainstay: 410,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 73,
    seatTubeAngle: 74,
    forkOffset: 44,
    notes: "Source: Specialized official geometry data for the Tarmac SL8.",
  },
  {
    // Sprint 12C.1: 2025 S-Works Tarmac SL8, size 56. Source-backed only; no
    // value is extrapolated from size 52 or 54.
    id: "specialized-tarmac-sl8-2025-56",
    brand: "Specialized",
    model: "Tarmac SL8",
    year: 2025,
    size: "56",
    frameStack: 565,
    frameReach: 395,
    headTube: 157,
    wheelbase: 991,
    frontCentre: null,
    chainstay: 410,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 73.5,
    seatTubeAngle: 73.5,
    forkOffset: 44,
    notes:
      "Source: Specialized 2025 S-Works Tarmac SL8 official geometry and specification (size 56), supported by the published complete-bike specification. Additional published values with no matching schema field: stack to stem 573 mm, reach to stem 393 mm (recorded as manufacturerReference in the configuration record), seat tube length 494 mm, top tube length 563 mm.",
  },
  {
    // Sprint 12C.4: 2025 Tarmac SL8, size 58. Every value below is taken
    // verbatim from Specialized's own per-size geometry chart for the 2025
    // model year; nothing is interpolated from size 54 or 56.
    id: "specialized-tarmac-sl8-2025-58",
    brand: "Specialized",
    model: "Tarmac SL8",
    year: 2025,
    size: "58",
    frameStack: 591,
    frameReach: 402,
    headTube: 184,
    wheelbase: 1006,
    frontCentre: 606,
    chainstay: 410,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 73.5,
    seatTubeAngle: 73.5,
    forkOffset: 44,
    maxSpacerHeight: null,
    notes:
      "Source: Specialized official 2025 Tarmac SL8 geometry chart (size 58), published on the Specialized S-Works Tarmac SL8 product pages and reproduced by an authorised Specialized dealer. Additional published values with no matching schema field: stack to stem 599 mm, reach to stem 400 mm (recorded as manufacturerReference in the configuration record), seat tube length 515 mm, top tube length 577 mm, trail 55 mm, fork length 370 mm, standover 808 mm. Tyre clearance is published for the frame platform rather than this size and is left unknown.",
  },
  {
    id: "colnago-v5rs-2025-485",
    brand: "Colnago",
    model: "V5Rs",
    year: 2025,
    size: "485",
    frameStack: 539,
    frameReach: 384,
    headTube: null,
    wheelbase: null,
    frontCentre: null,
    chainstay: null,
    bbDrop: null,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 72.3,
    notes: "Source: Colnago official V5Rs technical specifications (size 485 head tube angle).",
  },

  {
    id: "colnago-v5rs-2025-510",
    brand: "Colnago",
    model: "V5Rs",
    year: 2025,
    size: "510",
    frameStack: 557,
    frameReach: 390,
    headTube: 146,
    wheelbase: 994,
    frontCentre: 596.5,
    chainstay: 408,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 72.5,
    seatTubeAngle: 74.5,
    forkOffset: 47,
    notes: "Source: Colnago V5Rs official white paper.",
  },

  // --- Sprint 9.4A: verified modern race-bike seed data -------------------
  // Frame geometry only. Cockpit / stem / spacer configuration lives in
  // src/data/bike-configurations.ts. Values with no matching field in the Bike
  // schema (trail, standover, top tube, crank length, handlebar width) are
  // recorded in notes rather than forced into a differently defined field.

  {
    id: "giant-tcr-advanced-sl-0-2025-m",
    brand: "Giant",
    model: "TCR Advanced SL 0",
    year: 2025,
    size: "M",
    frameStack: 545,
    frameReach: 388,
    headTube: 145,
    wheelbase: 980,
    frontCentre: null,
    chainstay: 405,
    bbDrop: 69.5,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 73.0,
    seatTubeAngle: 73.5,
    forkOffset: 45,
    // Documented spacer components exist (2.5 / 5 / 10 mm) but Giant does not
    // publish a maximum spacer height, so this stays unknown.
    maxSpacerHeight: null,
    notes:
      "Source: Giant TCR Advanced SL geometry table (size M). Additional published values with no matching schema field: trail 59 mm, standover 743 mm, supplied crank length 172.5 mm, supplied handlebar width 420 mm.",
  },
  {
    id: "giant-tcr-advanced-sl-0-2025-ml",
    brand: "Giant",
    model: "TCR Advanced SL 0",
    year: 2025,
    size: "M/L",
    frameStack: 562,
    frameReach: 393,
    headTube: 165,
    wheelbase: 991,
    frontCentre: null,
    chainstay: 405,
    bbDrop: 67,
    tyreClearance: null,
    integratedCockpit: null,
    headTubeAngle: 73.0,
    seatTubeAngle: 73.0,
    forkOffset: 45,
    maxSpacerHeight: null,
    notes:
      "Source: Giant TCR Advanced SL geometry table (size M/L). Additional published values with no matching schema field: trail 59 mm, standover 771 mm, supplied crank length 172.5 mm, supplied handlebar width 420 mm.",
  },

  {
    id: "bmc-teammachine-slr01-54",
    brand: "BMC",
    model: "Teammachine SLR01",
    year: null,
    size: "54",
    frameStack: 550,
    frameReach: 386,
    headTube: 149,
    wheelbase: 989,
    frontCentre: 589,
    chainstay: 410,
    bbDrop: 69,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 72.3,
    seatTubeAngle: 73.5,
    forkOffset: 43,
    // BMC documents a maximum ICS spacer/stack adjustment of 60 mm below the
    // stem, which matches this field's definition (below-stem spacer height).
    maxSpacerHeight: 60,
    notes:
      "Source: BMC Teammachine SLR01 geometry table (size 54). Additional published values with no matching schema field: trail 63 mm, top tube 552 mm.",
  },
  {
    id: "bmc-teammachine-slr01-56",
    brand: "BMC",
    model: "Teammachine SLR01",
    year: null,
    size: "56",
    frameStack: 565,
    frameReach: 392,
    headTube: 165,
    wheelbase: 1000,
    frontCentre: 599,
    chainstay: 410,
    bbDrop: 69,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 72.3,
    seatTubeAngle: 73.5,
    forkOffset: 43,
    maxSpacerHeight: 60,
    notes:
      "Source: BMC Teammachine SLR01 geometry table (size 56). Additional published values with no matching schema field: trail 63 mm, top tube 562 mm.",
  },

  {
    id: "cannondale-supersix-evo-lab71-54",
    brand: "Cannondale",
    model: "SuperSix EVO LAB71",
    year: null,
    size: "54",
    frameStack: 555,
    frameReach: 384,
    headTube: 154,
    wheelbase: 1010,
    frontCentre: null,
    chainstay: 410,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 71.2,
    seatTubeAngle: 73.7,
    forkOffset: 55,
    // Sprint 9.4B: Cannondale's official SuperSix EVO LAB71 specification
    // identifies the SystemBar Road integrated cockpit as 100 x 360 mm for
    // sizes 54-56.
    stockStemLength: 100,
    // Interpretation: maxSpacerHeight is consumed by deriveConstraintsFromBike
    // as a below-stem SPACER height (it is unioned with availableSpacerHeights
    // and used as maximumRecommendedSpacerHeight). It therefore means spacer
    // material only, so the documented 50 mm of spacers is used and the 5 mm
    // dust cover is NOT added.
    maxSpacerHeight: 50,
    notes:
      "Source: Cannondale SuperSix EVO LAB71 geometry table and specifications (size 54). Stock stem length from the documented SystemBar Road cockpit at 100 x 360 mm (sizes 54-56). Spacer system documented as 50 mm of spacers plus a 5 mm dust cover; maxSpacerHeight records spacer material only (50 mm) per this field's definition.",
  },
  {
    id: "cannondale-supersix-evo-lab71-56",
    brand: "Cannondale",
    model: "SuperSix EVO LAB71",
    year: null,
    size: "56",
    frameStack: 575,
    frameReach: 389,
    headTube: 165,
    wheelbase: 994,
    frontCentre: null,
    chainstay: 410,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 73.0,
    seatTubeAngle: 73.3,
    forkOffset: 45,
    // Sprint 9.4B: Cannondale's official SuperSix EVO LAB71 specification
    // identifies the SystemBar Road integrated cockpit as 100 x 360 mm for
    // sizes 54-56.
    stockStemLength: 100,
    maxSpacerHeight: 50,
    notes:
      "Source: Cannondale SuperSix EVO LAB71 geometry table and specifications (size 56). Stock stem length from the documented SystemBar Road cockpit at 100 x 360 mm (sizes 54-56). Spacer system documented as 50 mm of spacers plus a 5 mm dust cover; maxSpacerHeight records spacer material only (50 mm) per this field's definition.",
  },

  {
    id: "cervelo-s5-54",
    brand: "Cervélo",
    model: "S5",
    year: null,
    size: "54",
    frameStack: 542,
    frameReach: 384,
    headTube: 104,
    wheelbase: 975,
    frontCentre: null,
    chainstay: 405,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: false,
    headTubeAngle: 73.0,
    seatTubeAngle: 73.0,
    forkOffset: 46.5,
    // Sprint 9.4B: Cervélo documents the S5 ST35 stem supplied at 100 mm.
    // The ST35 stem angle remains UNKNOWN: Cervélo's published description of
    // the ST35/HB14 assembly being equivalent to a -6 deg virtual plane
    // describes the resulting cockpit geometry, not the geometric definition
    // required by stockStemAngle, and is not converted here.
    stockStemLength: 100,
    // Cervélo documents a maximum stem-spacer height of 30 mm below the stem.
    maxSpacerHeight: 30,
    notes:
      "Source: Cervélo S5 geometry table and ST35 stem documentation (size 54). ST35 stem documented as supplied at 100 mm. ST35/HB14 rotation adjustment of ±5 deg is an adjustment range, not a stock rotation, and is therefore not recorded as stockHandlebarRotation.",
  },
  {
    id: "cervelo-s5-56",
    brand: "Cervélo",
    model: "S5",
    year: null,
    size: "56",
    frameStack: 565,
    frameReach: 392,
    headTube: 125,
    wheelbase: 982,
    frontCentre: null,
    chainstay: 405,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: false,
    headTubeAngle: 73.5,
    seatTubeAngle: 73.0,
    forkOffset: 43.5,
    // Sprint 9.4B: Cervélo documents the S5 ST35 stem supplied at 100 mm.
    // The ST35 stem angle remains UNKNOWN: Cervélo's published description of
    // the ST35/HB14 assembly being equivalent to a -6 deg virtual plane
    // describes the resulting cockpit geometry, not the geometric definition
    // required by stockStemAngle, and is not converted here.
    stockStemLength: 100,
    maxSpacerHeight: 30,
    notes:
      "Source: Cervélo S5 geometry table and ST35 stem documentation (size 56). ST35 stem documented as supplied at 100 mm. ST35/HB14 rotation adjustment of ±5 deg is an adjustment range, not a stock rotation, and is therefore not recorded as stockHandlebarRotation.",
  },

  {
    id: "canyon-ultimate-cfr-m",
    brand: "Canyon",
    model: "Ultimate CFR",
    year: null,
    size: "M",
    frameStack: 560,
    frameReach: 393,
    headTube: 142,
    wheelbase: 988,
    frontCentre: null,
    chainstay: 410,
    bbDrop: 73,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 73.25,
    seatTubeAngle: 73.5,
    forkOffset: null,
    // The documented CP0018 vertical adjustment (15 mm) is below-stem height
    // adjustment, matching this field's definition.
    maxSpacerHeight: 15,
    notes:
      "Source: Canyon Ultimate CFR geometry table and CP0018 cockpit documentation (size M). Standover 801 mm has no matching schema field. Stock supplied stem length is not established by the source and remains unknown.",
  },
  {
    id: "canyon-ultimate-cfr-l",
    brand: "Canyon",
    model: "Ultimate CFR",
    year: null,
    size: "L",
    frameStack: 580,
    frameReach: 401,
    headTube: 162,
    wheelbase: 1003,
    frontCentre: null,
    chainstay: 413,
    bbDrop: 73,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 73.3,
    seatTubeAngle: 73.5,
    forkOffset: null,
    maxSpacerHeight: 15,
    notes:
      "Source: Canyon Ultimate CFR geometry table and CP0018 cockpit documentation (size L). Standover 828 mm has no matching schema field. Stock supplied stem length is not established by the source and remains unknown.",
  },

  // --- Sprint 12C.2: Pinarello Dogma F (current eTiCR generation, MY2025) ---
  // Geometry taken verbatim from Pinarello's official geometry table for the
  // current Dogma F. Pinarello labels sizes by seat-tube centre-centre length
  // in mm, so "540" and "550" are the manufacturer's own size codes. Pinarello
  // does not publish wheelbase or front centre for this frame, so both stay
  // unknown rather than being taken from third-party calculators. Pre-2024
  // Dogma F charts differ (43 mm rake, different head tube lengths) and are
  // not mixed in here.
  {
    id: "pinarello-dogma-f-2025-540",
    brand: "Pinarello",
    model: "Dogma F",
    year: 2025,
    size: "540",
    frameStack: 551,
    frameReach: 385.3,
    headTube: 136,
    wheelbase: null,
    frontCentre: null,
    chainstay: 408,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 72.8,
    seatTubeAngle: 73.4,
    forkOffset: 47,
    maxSpacerHeight: null,
    notes:
      "Source: Pinarello official Dogma F geometry table (size 540, current eTiCR generation). Additional published values with no matching schema field: seat tube centre-end 510 mm, seat tube centre-centre 540 mm, top tube 550 mm, fork length (axle to crown) 373 mm. Wheelbase and front centre are not published by Pinarello for this frame and remain unknown.",
  },
  {
    id: "pinarello-dogma-f-2025-550",
    brand: "Pinarello",
    model: "Dogma F",
    year: 2025,
    size: "550",
    frameStack: 561.5,
    frameReach: 389.2,
    headTube: 147,
    wheelbase: null,
    frontCentre: null,
    chainstay: 408,
    bbDrop: 72,
    tyreClearance: null,
    integratedCockpit: true,
    headTubeAngle: 72.8,
    seatTubeAngle: 73.4,
    forkOffset: 47,
    maxSpacerHeight: null,
    notes:
      "Source: Pinarello official Dogma F geometry table (size 550, current eTiCR generation). Additional published values with no matching schema field: seat tube centre-end 520 mm, seat tube centre-centre 550 mm, top tube 557 mm, fork length (axle to crown) 373 mm. Wheelbase and front centre are not published by Pinarello for this frame and remain unknown.",
  },
];


