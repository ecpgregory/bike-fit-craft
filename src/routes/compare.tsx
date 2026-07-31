import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import { BikeSelect } from "@/components/compare/bike-select";
import { BikeSummaryCard } from "@/components/compare/bike-summary-card";
import { GeometryDifferenceCard } from "@/components/compare/geometry-difference-card";
import { FitAssessmentCard } from "@/components/compare/fit-assessment-card";
import { bikes } from "@/data/bikes";
import { calculateFit } from "@/lib/fitEngine";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Bikes — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Compare two road bike frames side by side: stack and reach differences plus a first-pass fit assessment.",
      },
      { property: "og:title", content: "Compare Bikes — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Side-by-side road frame geometry comparison with fit assessment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const [currentId, setCurrentId] = useState("");
  const [comparisonId, setComparisonId] = useState("");

  const result = useMemo(() => {
    const currentBike = bikes.find((b) => b.id === currentId);
    const comparisonBike = bikes.find((b) => b.id === comparisonId);
    if (!currentBike || !comparisonBike) return null;
    return calculateFit({ currentBike, comparisonBike });
  }, [currentId, comparisonId]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Compare Bikes"
        description="Put two frames head to head and read the stack and reach deltas."
      />

      <Panel title="Bike Selection" subtitle="Choose a current bike and a comparison bike">
        <div className="grid gap-4 sm:grid-cols-2">
          <BikeSelect
            label="Current Bike"
            value={currentId}
            onChange={setCurrentId}
            bikes={bikes}
          />
          <BikeSelect
            label="Comparison Bike"
            value={comparisonId}
            onChange={setComparisonId}
            bikes={bikes}
          />
        </div>
      </Panel>

      {result ? (
        <div className="grid gap-5 md:grid-cols-2">
          <BikeSummaryCard title="Current Bike" bike={result.currentBike} />
          <BikeSummaryCard title="Comparison Bike" bike={result.comparisonBike} />
          <GeometryDifferenceCard delta={result.geometry} />
          <FitAssessmentCard verdict={result.assessment} delta={result.geometry} />
        </div>
      ) : (
        <Panel title="Comparison Summary" subtitle="Geometry difference and fit assessment">
          <EmptyState
            icon={<GitCompareArrows className="size-5" />}
            title="Select two bikes to compare"
            description="Stack and reach differences appear once both a current bike and a comparison bike are chosen."
          />
          <div className="mt-5 grid gap-2 opacity-60">
            <SpecRow label="Stack Difference" />
            <SpecRow label="Reach Difference" />
          </div>
        </Panel>
      )}
    </div>
  );
}
