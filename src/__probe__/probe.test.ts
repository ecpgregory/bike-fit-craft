import { it } from "vitest";
import { bikes } from "@/data/bikes";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
const rider:any={id:"r",name:"n",currentBike:"c",handlebarX:470,handlebarY:631,frameReach:390,frameStack:570,stemLength:100,spacerHeight:20,saddleHeight:740,saddleSetback:70,preferredBikeType:null,preferredTyreWidth:null,budget:null};
it("probe", () => {
  const r=optimiseFleet({bikes,rider});
  console.log(r.rankedBikes.map(b=>b.bikeId).join("\n"));
  for(const b of r.rankedBikes.filter(b=>b.bikeId.startsWith("factor")))
    console.log(JSON.stringify(b).slice(0,900));
});
