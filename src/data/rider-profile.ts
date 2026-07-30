import type { RiderProfile } from "@/types";

/** Default rider profile. Replace with a database-backed record later. */
export const riderProfile: RiderProfile = {
  id: "rider-default",
  name: "",
  currentBike: "Giant Defy Advanced 1 (2014)",
  handlebarX: 470,
  handlebarY: 631,
  frameReach: 381,
  frameStack: 586,
  stemLength: 100,
  spacerHeight: 0,
  saddleHeight: 916,
  saddleSetback: 62,
  preferredBikeType: "Race",
  preferredTyreWidth: null,
  budget: null,
};
