import { Panel, SpecRow } from "@/components/panel";
import type { RiderProfile } from "@/types";

export function RiderReferenceCard({ rider }: { rider: RiderProfile }) {
  return (
    <Panel title="Rider Reference" subtitle="Saved professional fit">
      <SpecRow label="Current Bike" value={rider.currentBike} />
      <SpecRow label="Frame Stack" value={rider.frameStack} unit="mm" />
      <SpecRow label="Frame Reach" value={rider.frameReach} unit="mm" />
      <SpecRow label="Handlebar X" value={rider.handlebarX} unit="mm" />
      <SpecRow label="Handlebar Y" value={rider.handlebarY} unit="mm" />
      <SpecRow label="Stem Length" value={rider.stemLength} unit="mm" />
      <SpecRow label="Spacer Height" value={rider.spacerHeight} unit="mm" />
    </Panel>
  );
}
