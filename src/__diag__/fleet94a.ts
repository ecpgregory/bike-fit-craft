import { bikes } from "@/data/bikes";
import { riderProfile } from "@/data/rider-profile";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
const r = optimiseFleet({ bikes, rider: { ...riderProfile, handlebarX: 470, handlebarY: 631 } });
for (const b of r.rankedBikes) {
  const bike = bikes.find(x => x.id === b.bikeId)!;
  const c: any = b.bestConfiguration;
  console.log(JSON.stringify({ id: b.bikeId, size: bike.size, outcome: "SUCCESS", score: +b.overallScore.toFixed(4), cfg: c.configuration?.configurationDescription, rp3: c.assessment?.predictedPosition ?? c.predictedPosition, metrics: c.assessment?.positionMetrics }));
}
for (const u of r.unrankedBikes) console.log(JSON.stringify({ id: u.bikeId, outcome: u.outcome, total: u.result?.optimisationSummary }));
