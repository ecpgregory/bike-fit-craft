import { bikes } from "@/data/bikes";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
for (const [x,y] of [[450,600],[460,615],[470,631],[480,640],[490,650]] as const) {
  const r = optimiseFleet({ target: { x, y } });
  console.log(`--- ${x}/${y}`);
  for (const b of r.rankedBikes) {
    const m = b.bestConfiguration.assessment.positionMetrics;
    console.log(b.bikeId, b.overallScore.toFixed(4), b.outcome, `dx=${m.deltaX.toFixed(1)} dy=${m.deltaY.toFixed(1)} d=${m.euclideanDistance.toFixed(2)}`, "cockpit:", JSON.stringify(b.bestConfiguration.assessment.cockpitMetric), "handling:", JSON.stringify(b.bestConfiguration.assessment.handlingMetric));
  }
  console.log("unranked", r.unrankedBikes?.map((u:any)=>`${u.bikeId}:${u.outcome}`).join(", "));
}
