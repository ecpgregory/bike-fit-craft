import { riderProfile } from "../src/data/rider-profile";
import { optimiseFleet } from "../src/lib/optimisation/fleetOptimisationEngine";
import { weightedMeanCombination } from "../src/lib/rankingEngine";
const targets=[{x:450,y:600},{x:460,y:615},{x:470,y:631},{x:480,y:640},{x:490,y:650}];
const widths=[null,360,380,390,400,410,420];
let runs=0,bikes=0,bad=0,rp5=0,handAvail=0,handNull=0,outcomes:Record<string,number>={},orderChanges=0,rankedTotal=0;
for(const t of targets)for(const w of widths){
 const r=optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w}});
 const r2=optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w}});
 runs++;
 if(JSON.stringify(r.rankedBikes.map(b=>[b.bikeId,b.overallScore]))!==JSON.stringify(r2.rankedBikes.map(b=>[b.bikeId,b.overallScore])))console.log('NONDET');
 bikes+=r.rankedBikes.length+r.unrankedBikes.length;
 for(const b of r.rankedBikes){
  const n=b.bestConfiguration.componentScores.normalised;
  if(!Number.isFinite(b.overallScore)||b.overallScore<=0||b.overallScore>1)bad++;
  if(n.cockpit!==null)rp5++;
  n.handling===null?handNull++:handAvail++;
  outcomes[b.outcome]=(outcomes[b.outcome]||0)+1;
 }
 for(const b of r.unrankedBikes)outcomes[b.outcome]=(outcomes[b.outcome]||0)+1;
 // ordering vs arithmetic combiner
 const arith=optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w},rankingOptions:{combination:weightedMeanCombination}} as any);
 rankedTotal++;
 if(arith.rankedBikes.length===r.rankedBikes.length){
   if(arith.rankedBikes.map(b=>b.bikeId).join()!==r.rankedBikes.map(b=>b.bikeId).join())orderChanges++;
   for(let i=0;i<r.rankedBikes.length;i++){
     const g=r.rankedBikes[i]!, a=arith.rankedBikes.find(x=>x.bikeId===g.bikeId)!;
     if(a.outcome!==g.outcome)console.log('OUTCOME DRIFT',g.bikeId);
     const gp=g.bestConfiguration.assessment.positionMetrics.euclideanDistance;
     const ap=a.bestConfiguration.assessment.positionMetrics.euclideanDistance;
     if(Math.abs(gp-ap)>1e-9)console.log('POS DRIFT',g.bikeId);
     if(g.bestConfiguration.assessment.handlingMetric.value!==a.bestConfiguration.assessment.handlingMetric.value)console.log('HAND DRIFT',g.bikeId);
   }
 } else console.log('SET SIZE DIFF');
}
console.log({runs,bikes,bad,rp5Available:rp5,handAvail,handNull,outcomes,orderChanges,rankedTotal});
// width sensitivity
const t={x:470,y:631};
console.log(widths.map(w=>optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w}}).rankedBikes[0]!.bikeId));
