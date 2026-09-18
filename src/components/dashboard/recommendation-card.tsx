import { AlertTriangle, CheckCircle2, CircleX } from "lucide-react";

import type { Point2D } from "@/types/optimisation";
import { defaultAcceptableFitEnvelope } from "@/lib/optimisation/optimisationOutcome";
import { Panel, SpecRow } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import {
  bikeDisplayName,
  bikeSizeLabel,
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
  return `${round(point.x)} × ${round(point.y)} mm`;
}

function axisDirection(value: number, positive: string, negative: string): string {
  const rounded = round(value);
  if (rounded === 0) return "on target";
  return `${Math.abs(rounded)} mm ${rounded > 0 ? positive : negative}`;
}

export function positionDifferenceDescription(deltaX: number, deltaY: number): string {
  const horizontal = axisDirection(deltaX, "forward of target", "behind target");
  const vertical = axisDirection(deltaY, "above target", "below target");
  return `${horizontal}; ${vertical}.`;
}

export function fitEnvelopeDescription(
  outcome: RecommendedBikeView["outcome"],
  deltaX: number,
  deltaY: number,
): string {
  if (outcome === "SUCCESS") return "Within your fit envelope.";
  const limits: string[] = [];
  if (Math.abs(deltaX) > FIT_ENVELOPE_X_MM) {
    limits.push(axisDirection(deltaX, "too far forward", "too far behind"));
  }
  if (Math.abs(deltaY) > FIT_ENVELOPE_Y_MM) {
    limits.push(axisDirection(deltaY, "too high", "too low"));
  }
  return limits.length > 0
    ? `Outside fit envelope — ${limits.join(" and ")}.`
    : "Outside fit envelope.";
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
  const size = item.bike?.size ?? null;
  const year = item.bike?.year ?? null;
  const metrics = item.positionMetrics;
  const viable = item.outcome === "SUCCESS";
  const positionCopy = positionDifferenceDescription(metrics.deltaX, metrics.deltaY);
  const envelopeCopy = fitEnvelopeDescription(item.outcome, metrics.deltaX, metrics.deltaY);
  const cockpitChoice =
    item.cockpit?.stemChoice === "only-documented-option"
      ? "only documented option"
      : item.cockpit?.stemChoice === "selected-from-options"
        ? "selected from available options"
        : null;

  return (
    <Panel
      title={`${name}${size ? ` — ${size}` : ""}`}
      subtitle={`Rank ${item.rank}${year ? ` · ${year}` : ""}`}
      action={
        <Badge
          variant={viable ? "default" : "destructive"}
          className={viable ? "bg-success text-success-foreground hover:bg-success/90" : undefined}
        >
          {viable ? <CheckCircle2 className="mr-1 size-3.5" /> : <CircleX className="mr-1 size-3.5" />}
          {viable ? "Viable fit" : "Outside fit envelope"}
        </Badge>
      }
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <PositionBlock label="Your target · RP3" value={formatPoint(target)} />
        <PositionBlock
          label="Best achievable · RP3"
          value={formatPoint(item.predictedPosition)}
          emphasis
        />
        <PositionBlock
          label="Difference · RP3"
          value={`ΔX ${formatSignedMm(metrics.deltaX)} · ΔY ${formatSignedMm(metrics.deltaY)}`}
        />
      </div>

      <div className="mt-3 border-l-2 border-border pl-3">
        <p className="text-sm font-medium">{envelopeCopy}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{positionCopy}</p>
      </div>

      <div className="mt-5 grid gap-x-8 sm:grid-cols-2">
        <div>
          <p className="label-caps mb-1">Frame geometry</p>
          <SpecRow label="Stack" value={item.bike?.frameStack ?? null} unit="mm" />
          <SpecRow label="Reach" value={item.bike?.frameReach ?? null} unit="mm" />
        </div>
        <div className="mt-4 sm:mt-0">
          <p className="label-caps mb-1">Achieved cockpit position</p>
          <SpecRow label="RP3 X" value={item.predictedPosition ? round(item.predictedPosition.x) : null} unit="mm" />
          <SpecRow label="RP3 Y" value={item.predictedPosition ? round(item.predictedPosition.y) : null} unit="mm" />
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="label-caps mb-2">Cockpit</p>
        <p className="text-sm">
          {item.cockpit?.name ?? "Cockpit model not available"}
          {item.configuration?.stemLength !== null && item.configuration?.stemLength !== undefined
            ? ` · ${item.configuration.stemLength} mm stem`
            : ""}
          {item.configuration?.stemAngle !== null && item.configuration?.stemAngle !== undefined
            ? ` · ${item.configuration.stemAngle}°`
            : ""}
          {cockpitChoice ? ` — ${cockpitChoice}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Spacers: {item.configuration ? `${round(item.configuration.spacerHeight)} mm` : "Not available"}
        </p>
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-muted/30 px-3 py-3 sm:grid-cols-2">
        <div>
          <p className="label-caps">Fit envelope</p>
          <p className="mt-1 text-sm">Horizontal ±{FIT_ENVELOPE_X_MM} mm · Vertical ±{FIT_ENVELOPE_Y_MM} mm</p>
        </div>
        <div className="space-y-1 sm:text-right">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Bar width: </span>
          {item.handlebarWidth === null || item.handlebarWidth === undefined
            ? "Not available"
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
          <SpecRow label="Frame stack" value={item.bike?.frameStack ?? null} unit="mm" />
          <SpecRow label="Frame reach" value={item.bike?.frameReach ?? null} unit="mm" />
          <SpecRow label="Head tube angle" value={item.bike?.headTubeAngle ?? null} unit="°" />
          <SpecRow label="Handlebar reach" value={item.cockpit?.handlebarReach ?? null} unit="mm" />
          <SpecRow label="RP3 X" value={item.predictedPosition ? round(item.predictedPosition.x) : null} unit="mm" />
          <SpecRow label="RP3 Y" value={item.predictedPosition ? round(item.predictedPosition.y) : null} unit="mm" />
          <SpecRow
            label="Ranking score"
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
