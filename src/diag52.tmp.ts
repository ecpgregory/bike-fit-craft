import { bikes } from "@/data/bikes";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";

const rider = { ...riderProfile, handlebarX: 470, handlebarY: 631 } as any;
for (const id of ["specialized-tarmac-sl8-2025-52","specialized-tarmac-sl8-2025-54"]) {
  const bike = bikes.find(b=>b.id===id)!;
  const r: any = optimiseBike({ bike, rider });
  console.log("====", id);
  console.log(JSON.stringify(r.optimisationSummary ?? r.summary, null, 1));
  console.log("outcome", r.outcome);
  console.log("counts", r.evaluatedConfigurations?.length, r.rejectedConfigurations?.length);
  const best:any = r.bestConfiguration;
  console.log("BEST", JSON.stringify(best, null, 1).slice(0,4000));
  console.log("REJ", JSON.stringify((r.rejectedConfigurations||[]).slice(0,1), null, 1).slice(0,1200));
}
