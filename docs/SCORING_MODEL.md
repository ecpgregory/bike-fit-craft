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

---

# Sprint 11C — handling normalisation fix (D-11B-1)

## Change

`rankingEngine.defaultNormalisationStrategy.handling` moved from
`reciprocalNormalisation` (implicit 1 mm scale) to:

```
handlingScore = exp(-|widthError| / HANDLING_DECAY_MM)      HANDLING_DECAY_MM = 20
```

**Rationale for 20 mm.** Road handlebars are manufactured and specified in
20 mm width steps (360/380/400/420/440), so one decay length is exactly one
size the rider could actually buy — the smallest actionable difference. Being
one size out costs the same 1/e factor as being one positional reporting band
(10 mm) out, so both components are measured on their own physically
meaningful millimetre scales. Weights remain 1:1:1; position normalisation,
the 35 mm envelope, RP5 handling, production data and the rider UI are
unchanged.

Curve: 0 mm → 1.000, 5 → 0.779, 10 → 0.607, 20 → 0.368, 30 → 0.223,
40 → 0.135, 60 → 0.050. Exactly 1 at 0, strictly decreasing, bounded in (0,1],
deterministic, sign-independent, underflows to 0 (never NaN or negative).

## Effect on D-11B-1

At 490/650 with a 420 mm target: BMC SLR01 56 (18.2 mm RP3 error, SUCCESS)
rose from **0.1046 → 0.2647** against Giant TCR M's unchanged 0.5002. The
score ratio fell from 4.8x to 1.9x, and a 20 mm width difference now costs
2.7x rather than 21x.

**The inversion is not fully removed** — this is reported, not worked around.

### Residual defect D-11C-1 — the arithmetic mean floors a perfect component

`weightedMeanCombination` averages available components, so an available
handling component contributes up to 0.5 of the overall score however bad the
position is. An exact width match normalises to 1.0 at *any* decay scale, so
**no value of HANDLING_DECAY_MM can fix this**: the scale needed to let BMC
overtake TCR is ≈114 mm, at which point a 60 mm width error still scores 0.59
and handling barely discriminates at all — clearly inconsistent with the
scoring intent. The evidence is pinned in
`handlingNormalisation.test.ts > D-11C-1`.

Post-fix the residual is confined to near-exact matches: a bike outside the
fit envelope can only lead when its width error is ≤ 10 mm (half a size step).
Pre-fix a 20 mm error already sufficed.

**Proposed Sprint 11D (single change):** replace the arithmetic mean with a
weighted geometric mean, `exp(Σ wᵢ ln sᵢ / Σ wᵢ)` over available components.
It keeps availability-awareness, weights and normalisers untouched, and makes
a near-zero component drag the overall score toward zero instead of being
floored at 0.5.

## Re-run of the 35-run matrix (5 targets × 7 widths × 15 bikes)

Unchanged from Sprint 11B and re-confirmed: RP5 unavailable everywhere;
unavailable handling excluded from numerator and denominator; positional
scores bit-identical to the pre-fix run; outcome classification unchanged;
12 ranked / 3 `NO_CANDIDATES` in every run; no NaN, Infinity, undefined or
negative values; all scores in (0,1]; repeated runs bit-identical; width
changes still move rankings where handling data exists.

---

# Sprint 11D — Geometric Score Combiner

## The change

`rankConfigurations` now defaults to `weightedGeometricMeanCombination`:

```
overallScore = exp( Σ wᵢ·ln(sᵢ) / Σ wᵢ )   over AVAILABLE components only
```

`weightedMeanCombination` is retained as a pluggable alternative and as the
reference implementation of the D-11C-1 defect.

Unchanged: component weights (1:1:1), position normalisation
(`exp(-mm/10)`), `HANDLING_DECAY_MM = 20`, cockpit reciprocal normalisation,
availability rules, the 35 mm positional fit envelope, outcome classification,
and all production bike/configuration data. The only runtime change is the
combiner. The stale `reciprocalNormalisation` docstring — which still called
cockpit *and* handling always-zero placeholders — was corrected to describe
cockpit only (documentation-only).

No epsilon clamp was added. Both production normalisers are strictly positive
for every finite input (verified in `geometricCombiner.test.ts`), so the
production score domain never reaches zero; a clamp would mask real signal.

Single available component returns that component's score directly rather than
`exp(ln s)`, so position-only scores stay bit-identical to Sprint 9.7.

## Why D-11C-1 is resolved

The arithmetic mean is *compensatory*: with equal weights a perfect component
floors the score at 1/n regardless of the others. The geometric mean is
*conjunctive*: a perfect secondary component can lift the score only to
`sqrt(position)`.

D-11C-1 case, 490/650 @ 420 mm — no component score changed, only the combine:

| Bike | position err | pos score | width err | handling score | 11C (arith) | 11D (geom) |
|---|---|---|---|---|---|---|
| BMC SLR01 56 (SUCCESS) | 18.23 mm | 0.161613 | 20 mm | 0.367879 | 0.264746 | **0.243832** |
| Giant TCR M | 76.5 mm | ~0.000476 | 0 mm | 1.0 | 0.500238 | **0.021837** |
| Giant TCR M/L (former leader) | 58.29 mm | 0.002941 | 0 mm | 1.0 | 0.501470 | 0.054235 |

BMC now leads the fleet; the exact-width bike 58 mm out of position is demoted.

## Baseline revalidation

Four pinned assertions changed. Each was re-derived from its own component
scores before the value was updated — never tuned until green:

1. `rankingSensitivity` BMC 56 @ 490/650 @ 420 mm: 0.2647 → 0.2438
   = sqrt(0.161613 × 0.367879).
2. `rankingSensitivity` fleet leader @ 490/650 @ 420 mm: TCR M/L
   (OUTSIDE_FIT_ENVELOPE) → BMC 56 (SUCCESS). Intentional: the defect fix.
3. `handlingNormalisation` synthetic case: `exact-width` 0.500238 →
   sqrt(exp(-7.65)) = 0.021818; `better-position` wins at
   sqrt(exp(-1.8)·exp(-1)) = 0.246642.
4. `rp5Optionality` synthetic RP5 case: (position + 0.2)/2 = 0.403265 →
   sqrt(position × 0.2) = 0.348290. Cockpit normalisation itself unchanged.

Every other pinned baseline (including the Sprint 8B / 9.x position-only
scores, e.g. `fleetRecommendations` 0.4506) is untouched, because position-only
scoring is pass-through under both combiners.

## 35-run matrix (5 targets × 7 widths × 15 bikes = 525 results)

- RP5/cockpit available: **0** of 525 — unchanged.
- Handling available 300, excluded 120 — matches the 11B/11C split exactly.
- Positional metrics and handling metrics bit-identical to the arithmetic run.
- Outcomes identical: 210 SUCCESS, 210 OUTSIDE_FIT_ENVELOPE, 105 NO_CANDIDATES.
- No NaN / Infinity / undefined; every score in (0, 1].
- Repeated runs bit-identical.
- Width still moves rankings where handling data exists (at 470/631 the leader
  moves from Cannondale LAB71 54 at 360–380 mm to BMC SLR01 56 at 390–420 mm).

**Ranking changes vs outcome changes, reported separately:** 30 of 35 runs
changed ranked ORDER; **0** runs changed any OUTCOME. The 35 mm envelope is
computed in the evaluation layer and is provably independent of the combiner.

## Findings

| Item | Result |
|---|---|
| Geometric combiner | PASS |
| D-11C-1 resolved | PASS |
| Position dominance | PASS |
| Handling discrimination | PASS |
| Availability-aware scoring | PASS |
| RP5 optionality | PASS |
| Outcome classification unchanged | PASS |
| Baseline revalidation | PASS |
| Documentation consistency | PASS |
| MVP readiness | PASS |

The scoring model is ready for MVP without RP5 data: position drives the
ranking, handbar width discriminates without masking, and the cockpit
component activates cleanly if RP5 data is ever populated.
