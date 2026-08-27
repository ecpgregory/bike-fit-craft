import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { bikes } from "@/data/bikes";
const targets=[[450,600],[460,615],[470,631],[480,640],[490,650]];
for(const [x,y] of targets){
  const r=optimiseFleet({target:{x,y}});
  console.log(`\n=== ${x}/${y}`);
  for(const b of r.rankedBikes){
    const m=b.bestConfiguration.assessment.positionMetrics;
    const bike=bikes.find(k=>k.id===b.bikeId)!;
    console.log(`${bike.brand} ${bike.model} ${bike.size}`.padEnd(42), b.overallScore.toFixed(4), "d=",m.euclideanDistance.toFixed(1),"dx=",m.deltaX.toFixed(1),"dy=",m.deltaY.toFixed(1));
  }
  for(const b of r.unrankedBikes) console.log("UNRANKED", b.bikeId, b.outcome);
}
