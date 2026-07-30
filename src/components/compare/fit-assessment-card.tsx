import { Panel } from "@/components/panel";
import { cn } from "@/lib/utils";
import { formatDelta, type FitVerdict, type GeometryDelta } from "@/lib/fit-engine";

const verdictStyle: Record<FitVerdict, string> = {
  "Excellent Candidate": "border-success/30 bg-success/10 text-success",
  "Good Candidate": "border-success/20 bg-success/5 text-success",
  "Requires Further Analysis": "border-warning/30 bg-warning/10 text-warning",
  "Poor Candidate": "border-destructive/30 bg-destructive/10 text-destructive",
};

export function FitAssessmentCard({
  verdict,
  delta,
}: {
  verdict: FitVerdict | null;
  delta: GeometryDelta;
}) {
  return (
    <Panel title="Fit Assessment" subtitle="Provisional — geometry only, no cockpit maths yet">
      <div
        className={cn(
          "rounded-lg border px-4 py-5 text-center",
          verdict ? verdictStyle[verdict] : "border-dashed border-border text-muted-foreground",
        )}
      >
        <p className="text-base font-semibold tracking-tight">
          {verdict ?? "Insufficient geometry"}
        </p>
        <p className="mt-1 font-mono text-xs opacity-80">
          Reach {formatDelta(delta.reach)} · Stack {formatDelta(delta.stack)}
        </p>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Excellent: reach ≤3 mm and stack ≤20 mm. Good: reach ≤5 mm and stack ≤35 mm. Otherwise
        further analysis is required.
      </p>
    </Panel>
  );
}
