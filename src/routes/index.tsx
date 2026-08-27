import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike as BikeIcon, Trophy, TriangleAlert } from "lucide-react";

import type { TargetPosition } from "@/types/optimisation";
import { FitTargetForm } from "@/components/dashboard/fit-target-form";
import {
  DEFAULT_FIT_TARGET_INPUT,
  parseFitTargetInput,
  type FitTargetErrors,
  type FitTargetInput,
} from "@/lib/recommendations/fitTargetInput";


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
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; view: FleetRecommendationsView }
  | { status: "error"; message: string };

function Dashboard() {
  const [input, setInput] = useState<FitTargetInput>(DEFAULT_FIT_TARGET_INPUT);
  const [errors, setErrors] = useState<FitTargetErrors>({});
  const [state, setState] = useState<CalculationState>({ status: "idle" });
  const [pendingTarget, setPendingTarget] = useState<TargetPosition | null>(null);

  const runSearch = useCallback(() => {
    const parsed = parseFitTargetInput(input);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      // Validation failed: no optimisation is run and stale results are cleared.
      setState({ status: "idle" });
      setPendingTarget(null);
      return;
    }
    setErrors({});
    setState({ status: "loading" });
    setPendingTarget(parsed.target);
  }, [input]);

  // The optimisation runs off the render path so the loading state is visible.
  useEffect(() => {
    if (!pendingTarget) return;
    let cancelled = false;
    const id = setTimeout(() => {
      if (cancelled) return;
      try {
        // Single authoritative recommendation path: the production fleet engine.
        const result = optimiseFleet({ target: pendingTarget, rider: riderProfile });
        setState({ status: "ready", view: buildFleetRecommendations(result, bikes) });
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown calculation error.",
        });
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [pendingTarget]);

  // Run once with the demonstration defaults so the page is not empty.
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <FitTargetForm
          value={input}
          errors={errors}
          isRunning={state.status === "loading"}
          onChange={setInput}
          onSubmit={runSearch}
        />

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
