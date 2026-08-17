import { describe, it } from "vitest";
import { bikes } from "@/data/bikes";
import { riderProfile } from "@/data/rider-profile";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
describe("diag", () => { it("sl8", () => {
  const b = bikes.find((x) => x.id === "specialized-tarmac-sl8-2025-54")!;
  const res: any = optimiseBike({ bike: b, rider: riderProfile });
  console.log("evaluated", res.evaluatedConfigurations?.length, "rejected", res.rejectedConfigurations?.length, "best", !!res.bestConfiguration);
  console.log(JSON.stringify(res.optimisationSummary, null, 2));
  console.log(JSON.stringify(res.rejectedConfigurations?.slice(0, 2), null, 2));
}); });
