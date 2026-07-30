import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Ruler, Bike as BikeIcon, Target, Trophy } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel, SpecRow, EmptyState } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { riderProfile } from "@/data/rider-profile";

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
