import { AlertTriangle } from "lucide-react";

import { Panel, SpecRow } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import {
  bikeDisplayName,
  bikeSizeLabel,
  configurationSummary,
  formatSignedMm,
  round,
  type RecommendedBikeView,
} from "@/lib/recommendations/fleetRecommendations";

/** Pure presentation of one production-engine recommendation. */
export function RecommendationCard({ item }: { item: RecommendedBikeView }) {
  const name = bikeDisplayName(item.bike, item.bikeId);
  const size = bikeSizeLabel(item.bike);
  const configuration = configurationSummary(item.configuration);
  const metrics = item.positionMetrics;

  return (
    <Panel
      title={`${item.rank}. ${name}`}
      subtitle={size ?? undefined}
      action={
        <div className="text-right">
          <p className="label-caps">Fit score</p>
          <p className="tabular font-mono text-sm font-medium text-primary">
            {round(item.overallScore, 4).toFixed(4)}
          </p>
        </div>
      }
    >
      {item.explanation ? (
        <div className="mb-4">
          <p className="text-sm font-medium">{item.explanation.headline}</p>
          <p className="mt-1 text-xs text-muted-foreground">{item.explanation.summary}</p>
        </div>
      ) : null}

      <div className="grid gap-x-8 sm:grid-cols-2">
        <div>
          <p className="label-caps mb-1">Handlebar position</p>
          <SpecRow
            label="Predicted"
            value={
              item.predictedPosition
                ? `${round(item.predictedPosition.x)} × ${round(item.predictedPosition.y)}`
                : null
            }
            unit="mm"
            emphasis
          />
          <SpecRow label="Horizontal difference" value={formatSignedMm(metrics.deltaX)} />
          <SpecRow label="Vertical difference" value={formatSignedMm(metrics.deltaY)} />
          <SpecRow
            label="Total difference"
            value={`${round(metrics.euclideanDistance, 2)}`}
            unit="mm"
          />
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="label-caps mb-1">Recommended setup</p>
          <p className="py-2 text-sm">{configuration ?? "—"}</p>
        </div>
      </div>

      {item.explanation && item.explanation.reasons.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {item.explanation.reasons.map((reason) => (
            <li key={reason.code} className="text-xs text-muted-foreground">
              {reason.message}
            </li>
          ))}
        </ul>
      ) : null}

      {item.geometryWarnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {item.geometryWarnings.map((warning) => (
            <div
              key={warning.code}
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <Badge variant="secondary" className="mb-1">
                  {warning.code}
                </Badge>
                <p className="text-xs text-muted-foreground">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
