import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Ruler, Bike as BikeIcon, Target, Trophy } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fitProfile, currentBike } from "@/lib/bike-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Match your professional bike fit to high-end road bike frames. Track handlebar, reach, stack and saddle numbers in one dashboard.",
      },
      { property: "og:title", content: "Dashboard — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Match your professional bike fit to high-end road bike frames.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your fit coordinates and how they map onto candidate frames."
        action={
          <Button asChild size="sm">
            <Link to="/bikes">Open bike database</Link>
          </Button>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Panel
          title="My Fit"
          subtitle="Professional fit coordinates"
          action={<Ruler className="size-4 shrink-0 text-muted-foreground" />}
        >
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <p className="label-caps mb-1">Cockpit</p>
              <SpecRow label="Handlebar X" value={fitProfile.handlebarX} unit="mm" emphasis />
              <SpecRow label="Handlebar Y" value={fitProfile.handlebarY} unit="mm" emphasis />
              <SpecRow label="Stem" value={fitProfile.stem} unit="mm" />
              <SpecRow label="Spacer Height" value={fitProfile.spacerHeight} unit="mm" />
            </div>
            <div className="mt-4 sm:mt-0">
              <p className="label-caps mb-1">Frame &amp; Saddle</p>
              <SpecRow label="Frame Reach" value={fitProfile.frameReach} unit="mm" />
              <SpecRow label="Frame Stack" value={fitProfile.frameStack} unit="mm" />
              <SpecRow label="Saddle Height" value={fitProfile.saddleHeight} unit="mm" />
              <SpecRow label="Saddle Setback" value={fitProfile.saddleSetback} unit="mm" />
            </div>
          </div>
        </Panel>

        <Panel
          title="Current Bike"
          subtitle="Reference frame"
          action={<BikeIcon className="size-4 shrink-0 text-muted-foreground" />}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold tracking-tight">
              {currentBike.brand} {currentBike.model}
            </p>
            <Badge variant="secondary">{currentBike.year}</Badge>
          </div>
          <SpecRow label="Frame Reach" value={currentBike.frameReach} unit="mm" />
          <SpecRow label="Frame Stack" value={currentBike.frameStack} unit="mm" />
        </Panel>

        <Panel
          title="Target Bike"
          subtitle="Candidate frame"
          action={<Target className="size-4 shrink-0 text-muted-foreground" />}
        >
          <EmptyState
            title="No bike selected"
            description="Pick a frame from the database to see how it lines up against your fit."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/bikes">Select a bike</Link>
              </Button>
            }
          />
        </Panel>

        <Panel
          title="Top Matches"
          subtitle="Ranked by fit deviation"
          action={<Trophy className="size-4 shrink-0 text-muted-foreground" />}
        >
          <EmptyState
            title="No matches yet"
            description="Matches appear once frame geometry has been added to the database."
          />
        </Panel>
      </div>
    </div>
  );
}
