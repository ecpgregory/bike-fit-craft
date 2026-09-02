# Scoring & Ranking Model — validated state (Sprint 11B)

This document records the **current, unmodified** behaviour of the
optimisation scoring model and the results of the Sprint 11B validation. No
scoring behaviour, weight, normaliser or production data value was changed by
this sprint.

## 1. Current behaviour

### Positional score

- Metric: RP3 Euclidean error, `sqrt(dx² + dy²)` (`errorCalculator.calculatePositionMetrics`).
- Normalisation: `exp(-distance / 10)` (`exponentialPositionNormalisation`),
  where 10 mm is `defaultPositionReportingThresholds.closeDistance`.
- Always available for any solved configuration; it is the core dimension.

### Handling score

- Metric: `|documented handlebar width − rider target width|`, in mm.
- Unavailable (`HANDLING_TARGET_UNAVAILABLE`) when the rider states no target,
  and (`HANDLING_INPUT_UNAVAILABLE`) when the configuration has no documented
  width. Rider equipment is never used as a hidden default.
- Normalisation: `1 / (1 + value)` (`reciprocalNormalisation`).

### Cockpit / RP5 score

- Metric: Euclidean error between solved RP5 and the rider's cockpit target.
- Unavailable when RP5 could not be solved (`COCKPIT_GEOMETRY_UNAVAILABLE`) or
  when the rider has no RP5 target (`COCKPIT_TARGET_UNAVAILABLE`). RP3 is never
  reused as an RP5 target.
- No production bike currently solves RP5, so the component is unavailable
  fleet-wide. No placeholder or fallback RP5 value exists anywhere.

### Weighting, denominator and normalisation

- Weights are `1 : 1 : 1` (`defaultScoringWeights`).
- `weightedMeanCombination` skips any component whose metric is `null`
  (unavailable) — it enters **neither** the numerator nor the denominator.
- Consequence: with position only, `overallScore === normalised position`.

### Outcome classification and ranking

- `classifyOptimisationOutcome` is purely positional: `NO_CANDIDATES`,
  `NO_VALID_RESULT`, `SUCCESS` (RP3 error ≤ 35 mm) or `OUTSIDE_FIT_ENVELOPE`.
  It is independent of the ranking score.
- `optimiseFleet` sorts by `overallScore` descending; ties break by candidate id.

All six confirmations requested in Sprint 11B §1 hold as described, and are
now locked by `rp5Optionality.test.ts` and `rankingSensitivity.test.ts`.

## 2. Ranking sensitivity matrix

Five established targets (450/600, 460/615, 470/631, 480/640, 490/650) × seven
width conditions (null, 360, 380, 390, 400, 410, 420) = 35 fleet runs over all
15 production bikes.

Invariant across all 35 runs:

- 12 bikes ranked, 3 unranked — Giant Defy Advanced 1 and both Cervélo S5
  sizes, all `NO_CANDIDATES` for documented data reasons (no configuration
  record / unknown integrated stem angle). Never because RP5 is missing.
- Cockpit/RP5 availability: `false` for every bike in every run.
- Positional score and outcome classification are identical regardless of the
  width condition.
- No NaN, Infinity, undefined or negative score; every score in (0, 1].
- Repeated runs are bit-identical.

Representative rows (score / position / handling / distance mm / outcome):

`470/631, width = null` — position only:

| # | Bike | score | dist |
|---|------|-------|------|
| 1 | cannondale-lab71-54 | 0.8169 | 2.0 |
| 2 | cannondale-lab71-56 | 0.7755 | 2.5 |
| 3 | bmc-slr01-56 | 0.7541 | 2.8 |

`450/600, width = 360`:

| # | Bike | score | pos | hand | dist |
|---|------|-------|-----|------|------|
| 1 | cannondale-lab71-54 | 0.5277 | 0.0554 | 1.0000 | 28.9 |
| 2 | cannondale-lab71-56 | 0.5116 | 0.0232 | 1.0000 | 37.6 |
| 3 | canyon-ultimate-cfr-m | 0.2318 | 0.2318 | n/a | 14.6 |
| 5 | colnago-v5rs-510 | 0.1482 | 0.2767 | 0.0196 | 12.8 |

`490/650, width = 420`:

| # | Bike | score | pos | hand | dist | outcome |
|---|------|-------|-----|------|------|---------|
| 1 | giant-tcr-ml | 0.5015 | 0.0029 | 1.0000 | 58.3 | OUTSIDE_FIT_ENVELOPE |
| 2 | giant-tcr-m | 0.5002 | 0.0005 | 1.0000 | 76.5 | OUTSIDE_FIT_ENVELOPE |
| 3 | bmc-slr01-56 | 0.1046 | 0.1616 | 0.0476 | 18.2 | SUCCESS |

## 3. Assessment

- **A. RP5 absence** — sensible degradation. The component is reported
  unavailable, excluded from the mean, and the overall score collapses exactly
  onto the positional score. No artificial penalty.
- **B. Handling availability** — a bike with no documented width is scored on
  position alone; it is neither zeroed nor advantaged.
- **C. Width sensitivity** — changing the target width changes rankings in the
  expected direction (an exact match improves, a mismatch worsens).
- **D. Score compression** — no compression; the position-only spread across
  the fleet is roughly 0.008–0.82.
- **E. Position dominance** — **VIOLATED**. See defect D-11B-1.

### Defect D-11B-1 — handling/position normalisation scale mismatch

Position is normalised with a 10 mm length scale (`exp(-d/10)`); handling still
uses the default reciprocal normaliser, whose implicit length scale is 1 mm.
With equal weights an exact width match scores 1.0 while a 20 mm width
difference scores 0.048. Handling therefore swamps position: at 490/650 with a
420 mm target, Giant TCR M (76.5 mm RP3 error, OUTSIDE_FIT_ENVELOPE) outranks
BMC SLR01 56 (18.2 mm error, SUCCESS) purely on an exact bar-width match.

This is a normalisation defect, not a weighting decision: the weights are 1:1:1
as designed. It is locked by a regression test rather than silently fixed.

**Proposed follow-up — Sprint 11C (single change):** give the handling
normaliser an explicit millimetre length scale, e.g.
`exp(-widthError / HANDLING_DECAY_MM)` with `HANDLING_DECAY_MM` derived from a
documented bar-width sizing step (commonly 20 mm), so a one-size width
difference costs about as much as one positional decay length. No weight
changes, no data changes, no architectural changes.
