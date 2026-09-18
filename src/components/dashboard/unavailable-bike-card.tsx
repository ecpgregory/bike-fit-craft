import { Badge } from "@/components/ui/badge";
import {
  bikeDisplayName,
  bikeSizeLabel,
  type UnavailableBikeView,
} from "@/lib/recommendations/fleetRecommendations";

const OUTCOME_COPY: Record<UnavailableBikeView["outcome"], string> = {
  NO_CANDIDATES:
    "No valid configurations exist to evaluate because required frame or cockpit data is unavailable.",
  NO_VALID_RESULT:
    "Configurations were evaluated, but none produced a valid handlebar clamp position.",
};

const OUTCOME_LABEL: Record<UnavailableBikeView["outcome"], string> = {
  NO_CANDIDATES: "Configuration data unavailable",
  NO_VALID_RESULT: "No valid result",
};

/** Bikes the engine could not evaluate. Never shown with a fit score. */
export function UnavailableBikeCard({ item }: { item: UnavailableBikeView }) {
  const size = bikeSizeLabel(item.bike);
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{bikeDisplayName(item.bike, item.bikeId)}</p>
        {size ? <span className="text-xs text-muted-foreground">{size}</span> : null}
        <Badge variant="secondary">{OUTCOME_LABEL[item.outcome]}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{OUTCOME_COPY[item.outcome]}</p>
      {item.diagnostics.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {item.diagnostics.slice(0, 3).map((message) => (
            <li key={message} className="text-xs text-muted-foreground/80">
              {message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
