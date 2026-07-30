import { Panel } from "@/components/panel";
import { cn } from "@/lib/utils";
import { formatDelta, type DeltaSeverity, type GeometryDelta } from "@/lib/fit-engine";

const severityClass: Record<DeltaSeverity, string> = {
  close: "text-success",
  moderate: "text-warning",
  far: "text-destructive",
};

const severityBadge: Record<DeltaSeverity, string> = {
  close: "bg-success/10 text-success",
  moderate: "bg-warning/15 text-warning",
  far: "bg-destructive/10 text-destructive",
};

const severityLabel: Record<DeltaSeverity, string> = {
  close: "within ±5 mm",
  moderate: "within ±10 mm",
  far: "beyond ±10 mm",
};

function DeltaRow({
  label,
  value,
  severity,
}: {
  label: string;
  value: number | null;
  severity: DeltaSeverity | null;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {severity && (
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              severityBadge[severity],
            )}
          >
            {severityLabel[severity]}
          </span>
        )}
      </div>
      <span
        className={cn(
          "tabular font-mono text-lg font-medium",
          severity ? severityClass[severity] : "text-muted-foreground/60",
        )}
      >
        {formatDelta(value)}
      </span>
    </div>
  );
}

export function GeometryDifferenceCard({ delta }: { delta: GeometryDelta }) {
  return (
    <Panel title="Geometry Difference" subtitle="Comparison bike relative to current bike">
      <DeltaRow label="Stack" value={delta.stack} severity={delta.stackSeverity} />
      <DeltaRow label="Reach" value={delta.reach} severity={delta.reachSeverity} />
    </Panel>
  );
}
