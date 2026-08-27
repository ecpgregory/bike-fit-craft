import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { bikes } from "@/data/bikes";

for (const [x, y] of [[450,600],[460,615],[470,631],[480,640],[490,650]]) {
  const res = optimiseFleet({ bikes, target: { x, y } });
  console.log(`\n=== TARGET ${x}/${y} ===`);
  for (const r of res.rankedBikes) {
    const b = r.bestConfiguration;
    const solved = (r.result.solvedConfigurations ?? []).find((s) => s.configuration.id === b.candidateId);
    const pm = b.assessment.positionMetrics as any;
    console.log(r.bikeId, b.overallScore.toFixed(4), b.candidateId,
      solved?.rp3 ? `RP3 ${solved.rp3.x.toFixed(2)}/${solved.rp3.y.toFixed(2)}` : "",
      `dX=${pm.deltaX?.toFixed(2)} dY=${pm.deltaY?.toFixed(2)} d=${pm.euclideanDistance?.toFixed(2)}`,
      `n=${r.result.optimisationSummary.totalConfigurations}`);
  }
  for (const u of res.unrankedBikes) {
    console.log(u.bikeId, u.outcome, `n=${u.result.optimisationSummary.totalConfigurations}`,
      u.result.constraintDiagnostic ? `missing=${u.result.constraintDiagnostic.missing.join("+")} :: ${u.result.constraintDiagnostic.message}` : "");
  }
}
