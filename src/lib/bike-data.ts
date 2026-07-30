export type BikeRecord = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  size: string;
  frameReach: number | null;
  frameStack: number | null;
  headTube: number | null;
  wheelbase: number | null;
  frontCentre: number | null;
  bbDrop: number | null;
  tyreClearance: number | null;
  weight: number | null;
  stem: number | null;
  integratedCockpit: boolean | null;
  notes: string;
};

/** Intentionally empty — no placeholder geometry data. */
export const bikes: BikeRecord[] = [];

export const fitProfile = {
  handlebarX: 470,
  handlebarY: 631,
  frameReach: 381,
  frameStack: 586,
  stem: 100,
  spacerHeight: 0,
  saddleHeight: 916,
  saddleSetback: 62,
};

export const currentBike = {
  brand: "Giant",
  model: "Defy Advanced 1",
  year: 2014,
  frameReach: 381,
  frameStack: 586,
};
