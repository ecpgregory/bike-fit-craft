import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Ruler, Bike as BikeIcon, Trophy, TriangleAlert } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendationCard } from "@/components/dashboard/recommendation-card";
import { UnavailableBikeCard } from "@/components/dashboard/unavailable-bike-card";
import { riderProfile } from "@/data/rider-profile";
import { bikes } from "@/data/bikes";
import { optimiseFleet } from "@/lib/optimisation/fleetOptimisationEngine";
import {
  buildFleetRecommendations,
  type FleetRecommendationsView,
} from "@/lib/recommendations/fleetRecommendations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bike Matches — Bike Fit Finder" },
      {
        name: "description",
        content:
          "See which high-end road frames reproduce your professional fit, ranked by the production fit engine with recommended stem, angle and spacer setup.",
      },
      { property: "og:title", content: "Bike Matches — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Ranked road bike recommendations generated from your professional fit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

type CalculationState =
  | { status: "loading" }
  | { status: "ready"; view: FleetRecommendationsView }
  | { status: "error"; message: string };

function Dashboard() {
  const [state, setState] = useState<CalculationState>({ status: "loading" });

  const calculation = useMemo<CalculationState>(() => {
    try {
      // Single authoritative recommendation path: the production fleet engine.
      const result = optimiseFleet({ rider: riderProfile });
      return { status: "ready", view: buildFleetRecommendations(result, bikes) };
    } catch (error) {
      return {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown calculation error.",
      };
    }
  }, []);

  useEffect(() => setState(calculation), [calculation]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Your Bike Matches"
        description="Frames ranked by how closely they reproduce your fitted handlebar position."
        action={
          <Button asChild size="sm">
            <Link to="/bikes">Open bike database</Link>
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Panel
          title="Your Fit"
          subtitle="Professional fit coordinates"
          action={<Ruler className="size-4 shrink-0 text-muted-foreground" />}
        >
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <p className="label-caps mb-1">Handlebar position</p>
              <SpecRow label="Handlebar X" value={riderProfile.handlebarX} unit="mm" emphasis />
              <SpecRow label="Handlebar Y" value={riderProfile.handlebarY} unit="mm" emphasis />
              <SpecRow label="Stem" value={riderProfile.stemLength} unit="mm" />
              <SpecRow label="Spacer Height" value={riderProfile.spacerHeight} unit="mm" />
            </div>
            <div className="mt-4 sm:mt-0">
              <p className="label-caps mb-1">Frame &amp; Saddle</p>
              <SpecRow label="Frame Reach" value={riderProfile.frameReach} unit="mm" />
              <SpecRow label="Frame Stack" value={riderProfile.frameStack} unit="mm" />
              <SpecRow label="Saddle Height" value={riderProfile.saddleHeight} unit="mm" />
              <SpecRow label="Saddle Setback" value={riderProfile.saddleSetback} unit="mm" />
            </div>
          </div>
        </Panel>

        <Panel
          title="Current Bike"
          subtitle="Reference frame"
          action={<BikeIcon className="size-4 shrink-0 text-muted-foreground" />}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold tracking-tight">{riderProfile.currentBike}</p>
            {riderProfile.preferredBikeType ? (
              <Badge variant="secondary">{riderProfile.preferredBikeType}</Badge>
            ) : null}
          </div>
          <SpecRow label="Frame Reach" value={riderProfile.frameReach} unit="mm" />
          <SpecRow label="Frame Stack" value={riderProfile.frameStack} unit="mm" />
        </Panel>
      </div>

      {state.status === "loading" ? (
        <Panel title="Best Matches" subtitle="Calculating">
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Panel>
      ) : null}

      {state.status === "error" ? (
        <Panel title="Best Matches" subtitle="Calculation failed">
          <EmptyState
            icon={<TriangleAlert className="size-5" />}
            title="The fit calculation could not be completed"
            description={state.message}
          />
        </Panel>
      ) : null}

      {state.status === "ready" ? (
        <>
          <Panel
            title="Your Best Bike Matches"
            subtitle={`${state.view.recommendations.length} of ${state.view.totalBikes} frames could be evaluated`}
            action={<Trophy className="size-4 shrink-0 text-muted-foreground" />}
          >
            {state.view.recommendations.length === 0 ? (
              <EmptyState
                title="No bikes could be evaluated"
                description="None of the frames in the database currently have the geometry and cockpit data required to reproduce your fit."
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                Ranked by the fit engine against your handlebar position of{" "}
                {state.view.target.x} × {state.view.target.y} mm.
              </p>
            )}
          </Panel>

          {state.view.recommendations.map((item) => (
            <RecommendationCard key={item.bikeId} item={item} />
          ))}

          {state.view.unavailable.length > 0 ? (
            <Panel title="Unable to Evaluate" subtitle="No fit score is produced for these frames">
              <div className="space-y-3">
                {state.view.unavailable.map((item) => (
                  <UnavailableBikeCard key={item.bikeId} item={item} />
                ))}
              </div>
            </Panel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
