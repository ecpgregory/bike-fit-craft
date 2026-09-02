import { riderProfile } from "../src/data/rider-profile";
import { optimiseFleet } from "../src/lib/optimisation/fleetOptimisationEngine";
const target={x:490,y:650};
const f=optimiseFleet({target,rider:{...riderProfile,targetHandlebarWidth:420}});
for(const b of f.rankedBikes.slice(0,6)){
 const n=b.bestConfiguration.componentScores.normalised;
 console.log(b.bikeId,'pos',n.position.toFixed(6),'hand',n.handling,'overall',b.overallScore.toFixed(6),'geo',Math.sqrt(n.position*(n.handling??n.position)).toFixed(6),'dist',b.bestConfiguration.assessment.positionMetrics.euclideanDistance.toFixed(2),'we',b.bestConfiguration.assessment.handlingMetric.value, b.outcome);
}
const g=(id:string)=>f.rankedBikes.find(b=>b.bikeId===id)!;
const bmc=g("bmc-teammachine-slr01-56"), tcr=g("giant-tcr-advanced-sl-0-2025-m");
console.log('BMC',bmc.overallScore,'TCR',tcr.overallScore,'ratio',tcr.overallScore/bmc.overallScore);
