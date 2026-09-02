import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { buildFleetRecommendations } from "@/lib/recommendations/fleetRecommendations";
import { bikes } from "@/data/bikes";
import { riderProfile } from "@/data/rider-profile";
const targets = [[450,600],[460,610],[470,631],[480,640],[490,650]] as const;
for (const width of [null, 400]) {
for (const [x,y] of targets) {
  const rider = { ...riderProfile, cockpitTargetX: null, cockpitTargetY: null, targetHandlebarWidth: width };
  const r = optimiseFleet({ target: { x, y }, rider });
  const v = buildFleetRecommendations(r, bikes);
  const t = v.recommendations[0];
  const s = r.rankedBikes[0];
  const a = s?.bestConfiguration.assessment;
  console.log(JSON.stringify({width,x,y,top:t?.bikeId,score:+t?.overallScore.toFixed(4),
    dist:+(t?.positionMetrics.euclideanDistance ?? NaN).toFixed(2),dx:+t?.positionMetrics.deltaX.toFixed(1),dy:+t?.positionMetrics.deltaY.toFixed(1),
    outcome:t?.outcome, handling:a?.handlingPenaltyBreakdown, cockpit:a?.cockpitPenaltyBreakdown,
    warn:t?.geometryWarnings.map(w=>w.code), ranked:v.recommendations.length, unavail:v.unavailable.length}));
}}
