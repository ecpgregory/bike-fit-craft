import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";
const targets=[{x:450,y:600},{x:460,y:615},{x:470,y:631},{x:480,y:640},{x:490,y:650}];
const widths=[null,360,380,390,400,410,420];
let worst=0;
for(const t of targets)for(const w of widths){
  const r=optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w as never}}).rankedBikes;
  if(!r.some(b=>b.outcome==="SUCCESS"))continue;
  const lead=r[0]!;
  if(lead.outcome!=="SUCCESS"){
    const h=lead.bestConfiguration.assessment.handlingMetric.value;
    console.log(t.x,w,lead.bikeId,"widthErr",h,"h",lead.bestConfiguration.componentScores.normalised.handling?.toFixed(3));
    worst=Math.max(worst,h??0);
  }
}
console.log("max width error of an inverting leader:",worst);
