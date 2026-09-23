import { bikes } from "@/data/bikes";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
const rider:any={id:"r",name:"n",currentBike:"c",handlebarX:470,handlebarY:631,frameReach:390,frameStack:570,stemLength:100,spacerHeight:20,saddleHeight:740,saddleSetback:70,preferredBikeType:null,preferredTyreWidth:null,budget:null};
const r=optimiseFleet({bikes,rider});
for(const b of r.rankedBikes) console.log(b.bikeId, b.overallScore?.toFixed(4), (b as any).outcome ?? '', JSON.stringify((b as any).solvedPoint ?? (b as any).achieved ?? ''));
console.log('unranked', r.unrankedBikes.map(u=>u.bikeId));
import { it } from "vitest";
it("probe", () => {});
