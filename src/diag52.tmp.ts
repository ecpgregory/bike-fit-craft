import { bikes } from "@/data/bikes";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";

const rider = { ...riderProfile, handlebarX: 470, handlebarY: 631 } as any;
for (const id of ["specialized-tarmac-sl8-2025-52","specialized-tarmac-sl8-2025-54"]) {
  const bike = bikes.find(b=>b.id===id)!;
  const r: any = optimiseBike(bike, rider);
  console.log("====", id, JSON.stringify({outcome:r.outcome ?? r.optimisationSummary?.outcome, summary:r.optimisationSummary}, null, 1));
  const best:any = r.bestConfiguration;
  if (best) console.log("BEST", JSON.stringify(best, null, 1).slice(0,3000));
  const rej = (r.rejectedConfigurations||[]).slice(0,2);
  console.log("REJ sample", JSON.stringify(rej, null, 1).slice(0,1500));
}
