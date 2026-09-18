# Sprint 12B — Fit Results UX

## Goal
Make every ranked bike result understandable at a glance while consuming the optimiser’s existing outcome, RP3 position, configuration, and ordering unchanged.

## Result card redesign
- Rework each ranked card header to show rank as secondary context, bike brand/model and size as the identity, and the existing outcome as the prominent `Viable fit` or `Outside fit envelope` status.
- Present three clearly separated RP3 readings: rider target, best achievable position, and signed X/Y differences, rounded to whole millimetres.
- Add value-derived plain-language direction copy for forward/behind, above/below, and on-target values.
- Show the fixed product envelope as `Horizontal ±5 mm` and `Vertical ±20 mm`, sourced from the existing shared envelope constant.
- For viable results, state that the achieved position is within the envelope. For outside results, explain which dimension exceeds tolerance and in which direction; mention both dimensions when both exceed it.
- Keep frame stack/reach visibly grouped under `Frame geometry`, separate from `Achieved cockpit position`, so frame dimensions cannot be mistaken for RP3 coordinates.

## Cockpit and secondary information
- Extend the read-only recommendation presentation adapter with source-backed cockpit display metadata resolved by bike/configuration ID: concise cockpit name, selected stem/angle, spacer height, handlebar reach/width, and whether the chosen stem was one of several documented options or the only documented option.
- Describe fixed BMC size-specific ICS stems as `only documented option`; use `selected from available options` only when the source record actually lists multiple choices.
- Show known bar width as secondary information and clearly omit or mark unavailable fields without inference.
- Keep hood/RP5 availability messaging secondary and preserve the existing unknown-data policy.

## Expandable technical details
- Move score and configuration identifiers out of the primary hierarchy.
- Expand the existing `Technical details` section with available frame stack/reach, head tube angle, stem length/angle, handlebar reach/width, spacer height, RP3 X/Y, signed deltas, total positional difference, score, outcome, and existing explanation evidence.
- Omit unavailable optional measurements rather than manufacturing values.

## Empty and summary states
- Preserve the Dashboard’s existing engine order and viability totals.
- Refine unavailable-bike cards with user-facing labels and distinct explanations for `NO_CANDIDATES` and `NO_VALID_RESULT`, keeping diagnostics as supporting data/configuration information rather than fit judgements.
- Remove any wording that implies the highest-scoring bike is automatically “recommended” or that an unevaluable bike does not fit.

## Tests and verification
- Add focused presentation tests for direction wording and limiting-dimension explanations: viable, outside X, outside Y, outside both, and zero delta.
- Add component/adapter coverage for known cockpit data, the BMC only-documented-option wording, and missing optional cockpit/handling data.
- Cover both unavailable outcomes without re-testing or duplicating the optimiser’s envelope classifier.
- Run the full Vitest suite and the TypeScript-only typecheck, then inspect the rendered Dashboard at desktop and narrow mobile widths for hierarchy, wrapping, and expandable details.

## Scope protection
- Do not edit optimisation outcome classification, scoring, ranking, geometry, cockpit enumeration, production bike/configuration data, or rider-input behaviour.
- The card will read `item.outcome` as the sole viability result; UI helpers will explain deltas but will not create a second classifier.
