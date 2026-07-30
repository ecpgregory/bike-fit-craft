import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Bike Fit Finder" },
      {
        name: "description",
        content:
          "Configure units, matching tolerance and rider profile defaults for Bike Fit Finder.",
      },
      { property: "og:title", content: "Settings — Bike Fit Finder" },
      {
        property: "og:description",
        content: "Units, tolerances and rider profile preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border/60 py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Preferences for units, matching and your profile." />

      <Panel title="Measurement" subtitle="How values are displayed">
        <Row title="Units" description="Millimetres or inches across the app.">
          <Select defaultValue="mm">
            <SelectTrigger className="w-36" aria-label="Units">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mm">Millimetres</SelectItem>
              <SelectItem value="in">Inches</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row title="Weight unit" description="Frame and build weight display.">
          <Select defaultValue="kg">
            <SelectTrigger className="w-36" aria-label="Weight unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilograms</SelectItem>
              <SelectItem value="lb">Pounds</SelectItem>
            </SelectContent>
          </Select>
        </Row>
      </Panel>

      <Panel title="Matching" subtitle="Tolerances used when ranking frames">
        <Row title="Reach tolerance" description="Maximum acceptable deviation in mm.">
          <Input defaultValue="" placeholder="—" className="tabular w-24 font-mono" aria-label="Reach tolerance" />
        </Row>
        <Row title="Stack tolerance" description="Maximum acceptable deviation in mm.">
          <Input defaultValue="" placeholder="—" className="tabular w-24 font-mono" aria-label="Stack tolerance" />
        </Row>
        <Row title="Allow stem compensation" description="Let stem length offset reach differences.">
          <Switch defaultChecked aria-label="Allow stem compensation" />
        </Row>
        <Row title="Exclude integrated cockpits" description="Hide frames with non-adjustable cockpits.">
          <Switch aria-label="Exclude integrated cockpits" />
        </Row>
      </Panel>

      <Panel title="Rider Profile" subtitle="Used as defaults across calculations">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rider-name" className="text-xs text-muted-foreground">
              Rider name
            </Label>
            <Input id="rider-name" placeholder="—" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fitter" className="text-xs text-muted-foreground">
              Fitter / studio
            </Label>
            <Input id="fitter" placeholder="—" />
          </div>
        </div>
        <div className="mt-5">
          <Button size="sm" disabled>
            Save preferences
          </Button>
        </div>
      </Panel>
    </div>
  );
}
