import { bikes } from "@/data/bikes";
import { riderProfile } from "@/data/rider-profile";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";

const ids = ["specialized-tarmac-sl8-2025-52","specialized-tarmac-sl8-2025-54","colnago-v5rs-2025-485","colnago-v5rs-2025-510"];
const rider = { ...riderProfile, handlebarX: 470, handlebarY: 631 } as any;
for (const id of ids) {
  const bike = bikes.find(b => b.id === id); if(!bike){console.log("MISSING",id);continue;}
  const r: any = optimiseBike(bike, rider);
  console.log("\n===", id);
  console.log(JSON.stringify(r.optimisationSummary ?? {}, null, 1));
  console.log("outcome", r.outcome ?? r.optimisationSummary?.outcome);
  const best = r.bestConfiguration;
  if (!best) { console.log("no best"); console.log("sample rejection", JSON.stringify(r.rejectedConfigurations?.[0], null, 1)); continue; }
  console.log("best keys", Object.keys(best));
  console.log(JSON.stringify(best, null, 1).slice(0, 2500));
}
