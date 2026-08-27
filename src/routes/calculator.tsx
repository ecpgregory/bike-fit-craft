import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "Fit Calculator — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Enter target handlebar, stem, spacer and saddle values to derive the frame reach and stack window that fits you.",
      },
      { property: "og:title", content: "Fit Calculator — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Derive required frame reach and stack from your target fit numbers.",
      },
    ],
  }),
  component: FitCalculator,
});

const fields = [
  { key: "handlebarX", label: "Target Handlebar X", unit: "mm" },
  { key: "handlebarY", label: "Target Handlebar Y", unit: "mm" },
  { key: "stem", label: "Target Stem Length", unit: "mm" },
  { key: "spacer", label: "Target Spacer Height", unit: "mm" },
  { key: "saddleHeight", label: "Target Saddle Height", unit: "mm" },
  { key: "saddleSetback", label: "Target Saddle Setback", unit: "mm" },
] as const;

type FieldKey = (typeof fields)[number]["key"];

function FitCalculator() {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    handlebarX: "",
    handlebarY: "",
    stem: "",
    spacer: "",
    saddleHeight: "",
    saddleSetback: "",
  });

  const update = (key: FieldKey, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Fit Calculator"
        description="Enter target cockpit and saddle values to derive the frame window they imply."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Target Inputs" subtitle="All values in millimetres">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="min-w-0 space-y-1.5">
                <Label htmlFor={field.key} className="text-xs text-muted-foreground">
                  {field.label}
                </Label>
                <div className="relative">
                  <Input
                    id={field.key}
                    inputMode="decimal"
                    value={values[field.key]}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder="—"
                    className="tabular pr-10 font-mono"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" disabled>
              Calculate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setValues({
                  handlebarX: "",
                  handlebarY: "",
                  stem: "",
                  spacer: "",
                  saddleHeight: "",
                  saddleSetback: "",
                })
              }
            >
              Reset
            </Button>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Derived Frame Window" subtitle="Calculated outputs">
            <SpecRow label="Required Frame Reach" />
            <SpecRow label="Required Frame Stack" />
            <SpecRow label="Effective Stack-to-Reach" />
            <SpecRow label="Saddle-to-Bar Drop" />
          </Panel>

          <Panel title="Notes">
            <EmptyState
              icon={<Calculator className="size-5" />}
              title="Calculations not enabled yet"
              description="This page does not produce recommendations. Your live bike matches are generated from your saved fit on the dashboard."
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/">View your bike matches</Link>
                </Button>
              }
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
