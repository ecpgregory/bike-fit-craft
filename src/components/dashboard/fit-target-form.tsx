import { Ruler, Search } from "lucide-react";

import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FitTargetErrors, FitTargetInput } from "@/lib/recommendations/fitTargetInput";

interface FitTargetFormProps {
  value: FitTargetInput;
  errors: FitTargetErrors;
  isRunning: boolean;
  onChange: (value: FitTargetInput) => void;
  onSubmit: () => void;
}

/** Rider input only: two measurements and the action that runs the fit engine. */
export function FitTargetForm({
  value,
  errors,
  isRunning,
  onChange,
  onSubmit,
}: FitTargetFormProps) {
  return (
    <Panel
      title="Enter your bike-fit handlebar position"
      subtitle="Measured from the bottom bracket to the centre of your handlebar clamp"
      action={<Ruler className="size-4 shrink-0 text-muted-foreground" />}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <p className="text-xs text-muted-foreground">
          Use the horizontal (X) and vertical (Y) handlebar measurements from your bike fit.
          Both are in millimetres.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="handlebarX">Handlebar X (mm)</Label>
            <Input
              id="handlebarX"
              name="handlebarX"
              inputMode="decimal"
              value={value.handlebarX}
              aria-invalid={Boolean(errors.handlebarX)}
              aria-describedby={errors.handlebarX ? "handlebarX-error" : undefined}
              onChange={(event) => onChange({ ...value, handlebarX: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Horizontal reach from the bottom bracket.
            </p>
            {errors.handlebarX ? (
              <p id="handlebarX-error" role="alert" className="text-xs text-destructive">
                {errors.handlebarX}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handlebarY">Handlebar Y (mm)</Label>
            <Input
              id="handlebarY"
              name="handlebarY"
              inputMode="decimal"
              value={value.handlebarY}
              aria-invalid={Boolean(errors.handlebarY)}
              aria-describedby={errors.handlebarY ? "handlebarY-error" : undefined}
              onChange={(event) => onChange({ ...value, handlebarY: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Vertical height above the bottom bracket.
            </p>
            {errors.handlebarY ? (
              <p id="handlebarY-error" role="alert" className="text-xs text-destructive">
                {errors.handlebarY}
              </p>
            ) : null}
          </div>
        </div>

        <Button type="submit" size="sm" disabled={isRunning}>
          <Search className="size-4" />
          {isRunning ? "Finding bikes…" : "Find My Bikes"}
        </Button>
      </form>
    </Panel>
  );
}
