import { AlertTriangle } from "lucide-react";

import type { Point2D } from "@/types/optimisation";
import { defaultAcceptableFitEnvelope } from "@/lib/optimisation/optimisationOutcome";
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

/** Positional feasibility envelope used by the engine; displayed, never applied here. */
const FIT_ENVELOPE_X_MM = defaultAcceptableFitEnvelope.maximumHorizontalError;
const FIT_ENVELOPE_Y_MM = defaultAcceptableFitEnvelope.maximumVerticalError;

function PositionBlock({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="label-caps">{label}</p>
      <p
        className={
          emphasis
            ? "tabular mt-0.5 font-mono text-sm font-medium text-primary"
            : "tabular mt-0.5 font-mono text-sm"
        }
      >
        {value}
      </p>
    </div>
  );
}

function formatPoint(point: Point2D | null): string {
  if (!point) return "—";
  return `X ${round(point.x)} × Y ${round(point.y)} mm`;
}

/**
 * Rider-facing presentation of one production-engine recommendation.
 * Every value is read from the optimisation result; nothing is recalculated.
 */
export function RecommendationCard({
  item,
  target,
  targetHandlebarWidth,
}: {
  item: RecommendedBikeView;
  target: Point2D;
  targetHandlebarWidth?: number | null;
}) {
  const name = bikeDisplayName(item.bike, item.bikeId);
  const size = bikeSizeLabel(item.bike);
  const configuration = configurationSummary(item.configuration);
  const metrics = item.positionMetrics;
  const viable = item.outcome === "SUCCESS";
  const distance = round(metrics.euclideanDistance, 1);
  const verticalWord = metrics.deltaY < 0 ? "below" : "above";

  return (
    <Panel
      title={`${item.rank}. ${name}`}
      subtitle={size ?? undefined}
      action={
        <Badge variant={viable ? "default" : "destructive"}>
          {viable ? "Viable fit" : "Outside fit envelope"}
        </Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <PositionBlock label="Your target" value={formatPoint(target)} />
        <PositionBlock
          label="Best achievable position"
          value={formatPoint(item.predictedPosition)}
          emphasis
        />
        <PositionBlock
          label="Difference"
          value={`${formatSignedMm(metrics.deltaX)} X / ${formatSignedMm(metrics.deltaY)} Y`}
        />
      </div>

      <p className="mt-3 text-sm">
        {viable
          ? `This bike can be set up within ${FIT_ENVELOPE_X_MM} mm horizontally and ${FIT_ENVELOPE_Y_MM} mm vertically of your target handlebar position (${distance} mm total).`
          : `This bike cannot currently be set up close enough to your target position. The closest achievable position is ${distance} mm away (${round(
              Math.abs(metrics.deltaY),
            )} mm ${verticalWord} your target), outside the ${FIT_ENVELOPE_X_MM} mm horizontal / ${FIT_ENVELOPE_Y_MM} mm vertical fit envelope.`}
      </p>


      <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
        <div>
          <p className="label-caps mb-1">Frame geometry</p>
          <SpecRow label="Stack" value={item.bike?.frameStack ?? null} unit="mm" />
          <SpecRow label="Reach" value={item.bike?.frameReach ?? null} unit="mm" />
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="label-caps mb-1">Recommended setup</p>
          <p className="py-2 text-sm">{configuration ?? "—"}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Handlebar width: </span>
          {item.handlebarWidth === null || item.handlebarWidth === undefined
            ? "Not evaluated — no verified width data available for this cockpit."
            : targetHandlebarWidth
              ? `${targetHandlebarWidth} mm target → ${item.handlebarWidth} mm available${
                  targetHandlebarWidth === item.handlebarWidth
                    ? " (exact match)"
                    : ` (${formatSignedMm(item.handlebarWidth - targetHandlebarWidth)})`
                }`
              : `${item.handlebarWidth} mm available — not evaluated, you have not set a width target.`}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Hood position: </span>
          {item.cockpitMetric.available
            ? "Evaluated against your rider contact target."
            : "Not evaluated — verified hood-contact data is not currently available."}
        </p>
      </div>

      {item.geometryWarnings.length > 0 ? (
        <div className="mt-4 space-y-2">
          {item.geometryWarnings.map((warning) => (
            <div
              key={warning.code}
              className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <p className="min-w-0 text-xs text-muted-foreground">{warning.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      <details className="mt-4 rounded-lg border border-border px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium">Technical details</summary>
        <div className="mt-2">
          <SpecRow
            label="Overall fit score (ranking)"
            value={round(item.overallScore, 4).toFixed(4)}
          />
          <SpecRow label="Engine outcome" value={item.outcome} />
          <SpecRow label="Horizontal difference" value={formatSignedMm(metrics.deltaX)} />
          <SpecRow label="Vertical difference" value={formatSignedMm(metrics.deltaY)} />
          <SpecRow label="Total difference" value={`${round(metrics.euclideanDistance, 2)}`} unit="mm" />
          <SpecRow label="Stem length" value={item.configuration?.stemLength ?? null} unit="mm" />
          <SpecRow label="Stem angle" value={item.configuration?.stemAngle ?? null} unit="°" />
          <SpecRow
            label="Spacer height"
            value={item.configuration ? round(item.configuration.spacerHeight) : null}
            unit="mm"
          />
          <SpecRow label="Handlebar width" value={item.handlebarWidth ?? null} unit="mm" />
          <SpecRow label="Configuration id" value={item.candidateId} />
          {item.explanation ? (
            <ul className="mt-3 space-y-1.5">
              <li className="text-xs font-medium">{item.explanation.headline}</li>
              {item.explanation.reasons.map((reason) => (
                <li key={reason.code} className="text-xs text-muted-foreground">
                  {reason.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>
    </Panel>
  );
}
