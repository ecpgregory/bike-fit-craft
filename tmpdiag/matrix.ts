import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";
const targets=[{x:450,y:600},{x:460,y:615},{x:470,y:631},{x:480,y:640},{x:490,y:650}];
const widths=[null,360,380,390,400,410,420];
let bad=0, inversions=0;
for(const t of targets)for(const w of widths){
  const f=optimiseFleet({target:t,rider:{...riderProfile,targetHandlebarWidth:w as never}});
  console.log(`\n== ${t.x}/${t.y} width ${w??"null"} ==`);
  f.rankedBikes.forEach((b,i)=>{const c=b.bestConfiguration,p=c.componentScores.normalised;
    if(!Number.isFinite(b.overallScore))bad++;
    console.log(`${(i+1+"").padStart(2)}. ${b.bikeId.padEnd(34)} s=${b.overallScore.toFixed(4)} pos=${p.position.toFixed(4)} d=${c.assessment.positionMetrics.euclideanDistance.toFixed(1)} h=${p.handling===null?"n/a":p.handling.toFixed(4)} ${b.outcome}`);});
  const bo=f.rankedBikes.find(b=>b.outcome==="OUTSIDE_FIT_ENVELOPE");
  const ws=[...f.rankedBikes].reverse().find(b=>b.outcome==="SUCCESS");
  if(bo&&ws&&bo.overallScore>ws.overallScore)inversions++;
  console.log(`   unranked: ${f.unrankedBikes.map(u=>`${u.bikeId}(${u.outcome})`).join(", ")}`);
}
console.log("\nnon-finite:",bad,"envelope inversions:",inversions);
