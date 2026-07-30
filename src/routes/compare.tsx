import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bikes } from "@/data/bikes";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Bikes — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Compare two road bike frames side by side: reach, stack, head tube, wheelbase and cockpit deltas.",
      },
      { property: "og:title", content: "Compare Bikes — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Side-by-side road frame geometry comparison.",
      },
    ],
  }),
  component: ComparePage,
});

const specs = [
  "Frame Reach",
  "Frame Stack",
  "Head Tube",
  "Wheelbase",
  "Front Centre",
  "BB Drop",
  "Tyre Clearance",
  "Weight",
  "Stem",
] as const;

function BikeSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="label-caps">{label}</p>
      <Select value={value} onValueChange={onChange} disabled={bikes.length === 0}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder={bikes.length === 0 ? "No bikes available" : "Select a bike"} />
        </SelectTrigger>
        <SelectContent>
          {bikes.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.brand} {b.model} · {b.size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ComparePage() {
  const [bikeA, setBikeA] = useState("");
  const [bikeB, setBikeB] = useState("");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Compare Bikes"
        description="Put two frames head to head and read the geometry deltas."
      />

      <Panel title="Selection" subtitle="Choose two frames to compare">
        <div className="grid gap-4 sm:grid-cols-2">
          <BikeSelect label="Bike A" value={bikeA} onChange={setBikeA} />
          <BikeSelect label="Bike B" value={bikeB} onChange={setBikeB} />
        </div>
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        {(["Bike A", "Bike B"] as const).map((title) => (
          <Panel key={title} title={title} subtitle="Geometry">
            {specs.map((spec) => (
              <SpecRow key={spec} label={spec} />
            ))}
          </Panel>
        ))}
      </div>

      <Panel title="Delta" subtitle="Bike B relative to Bike A">
        <EmptyState
          icon={<GitCompareArrows className="size-5" />}
          title="Nothing to compare yet"
          description="Deltas are calculated once both frames are selected and geometry data exists."
        />
      </Panel>
    </div>
  );
}
