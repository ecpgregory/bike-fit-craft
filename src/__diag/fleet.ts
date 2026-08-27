import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";
import { bikes } from "@/data/bikes";
import { optimiseBike } from "@/lib/optimisation/bikeOptimisationEngine";
import { classifyOptimisationOutcome } from "@/lib/optimisation/optimisationOutcome";

const targets = [[450,600],[460,615],[470,631],[480,640],[490,650]];
for (const [handlebarX, handlebarY] of targets) {
  const target = { handlebarX, handlebarY } as any;
  const res: any = optimiseFleet({ bikes, rider: riderProfile, target });
  console.log(`\n=== TARGET ${handlebarX}/${handlebarY} ===`);
  for (const r of (res.rankedBikes ?? res.results ?? [])) {
    const b: any = r.bestConfiguration ?? r.result?.bestConfiguration;
    const br: any = r.result ?? r;
    const solved = (br.solvedConfigurations ?? []).find((s:any)=>s.configuration.id===b?.candidateId);
    console.log(
      r.bikeId ?? br.bikeId,
      classifyOptimisationOutcome(br),
      b ? b.overallScore.toFixed(4) : "-",
      b ? b.candidateId : "",
      solved?.rp3 ? `RP3 ${solved.rp3.x.toFixed(2)}/${solved.rp3.y.toFixed(2)}` : "",
      `n=${br.optimisationSummary.totalConfigurations}`,
      br.constraintDiagnostic ? `| ${br.constraintDiagnostic.missing.join("+")}` : "",
    );
  }
}
