import { Panel, SpecRow } from "@/components/panel";
import type { Bike } from "@/types";

export function BikeSummaryCard({ title, bike }: { title: string; bike: Bike }) {
  return (
    <Panel title={title} subtitle={bike.notes || "Frame geometry"}>
      <SpecRow label="Brand" value={bike.brand} />
      <SpecRow label="Model" value={bike.model} />
      <SpecRow label="Size" value={bike.size} />
      <SpecRow label="Frame Stack" value={bike.frameStack} unit="mm" />
      <SpecRow label="Frame Reach" value={bike.frameReach} unit="mm" />
    </Panel>
  );
}
