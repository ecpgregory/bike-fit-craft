import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import { riderProfile } from "@/data/rider-profile";
import { bikes } from "@/data/bikes";

const targets = [
  { x: 450, y: 600 },
  { x: 460, y: 615 },
  { x: 470, y: 631 },
  { x: 480, y: 640 },
  { x: 490, y: 650 },
];
const widths = [null, 360, 380, 390, 400, 410, 420];
const name = (id: string) => id;
let bad = 0;
for (const t of targets) {
  for (const w of widths) {
    const rider = { ...riderProfile, targetHandlebarWidth: w };
    const f = optimiseFleet({ target: t, rider });
    console.log(`\n== target ${t.x}/${t.y}  width ${w ?? "null"} ==`);
    f.rankedBikes.forEach((b, i) => {
      const c = b.bestConfiguration;
      const pos = c.componentScores.normalised.position;
      const hand = c.componentScores.normalised.handling;
      const cock = c.componentScores.normalised.cockpit;
      for (const v of [b.overallScore, pos]) if (!Number.isFinite(v)) bad++;
      console.log(
        `${(i + 1).toString().padStart(2)}. ${name(b.bikeId).padEnd(34)} score=${b.overallScore.toFixed(4)} pos=${pos.toFixed(4)} dist=${c.assessment.positionMetrics.euclideanDistance.toFixed(1)} hand=${hand === null ? "n/a" : hand.toFixed(4)} cockpit=${cock === null ? "n/a" : cock.toFixed(4)} ${b.outcome}`,
      );
    });
    console.log(`   unranked: ${f.unrankedBikes.map((u) => `${u.bikeId}(${u.outcome})`).join(", ")}`);
  }
}
console.log("\nnon-finite scores:", bad);
