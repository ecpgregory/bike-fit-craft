import { bikes } from "@/data/bikes";
import { deriveConstraintsFromBike } from "@/lib/bikeConstraints";
import { generateLegalConfigurations } from "@/lib/constraintGenerator";
for (const b of bikes) {
  const c = deriveConstraintsFromBike(b);
  const cfg = generateLegalConfigurations(c);
  console.log(b.id, "| spacers", JSON.stringify(c.availableSpacerHeights), "| stems", JSON.stringify(c.availableStemLengths), "| angles", JSON.stringify(c.allowedStemAngles), "| opts", c.availableCockpitOptions.map(o=>`${o.id}:${o.stemLength}/${o.stemAngle}`).join(","), "| n=", cfg.length);
}
