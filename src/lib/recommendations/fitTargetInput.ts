import type {
  CockpitTargetPosition,
  HandlingTarget,
  TargetPosition,
} from "@/types/optimisation";

/**
 * Rider input → TargetPosition.
 *
 * This module owns nothing but parsing and validation of the two numbers the
 * rider types. It does not optimise, score or rank, and it does not invent a
 * parallel target representation: it returns the existing `TargetPosition`
 * (x = handlebar X, y = handlebar Y, both millimetres, measured from the
 * bottom bracket to the handlebar clamp centre / RP3).
 */

export interface FitTargetInput {
  handlebarX: string;
  handlebarY: string;
  /** Optional rider contact point (RP5) X, mm from the bottom bracket. */
  cockpitTargetX?: string;
  /** Optional rider contact point (RP5) Y, mm above the bottom bracket. */
  cockpitTargetY?: string;
  /** Optional rider target handlebar width, mm. */
  handlebarWidth?: string;
}

export interface FitTargetErrors {
  handlebarX?: string;
  handlebarY?: string;
  cockpitTargetX?: string;
  cockpitTargetY?: string;
  handlebarWidth?: string;
}

export type FitTargetParseResult =
  | {
      ok: true;
      target: TargetPosition;
      /** Null when the rider left the RP5 measurements blank. */
      cockpitTarget: CockpitTargetPosition | null;
      /** Null when the rider stated no handlebar-width target. */
      handlingTarget: HandlingTarget | null;
    }
  | { ok: false; errors: FitTargetErrors };

/** Demonstration defaults only — never read by the optimisation engine. */
export const DEFAULT_FIT_TARGET_INPUT: FitTargetInput = {
  handlebarX: "470",
  handlebarY: "631",
  cockpitTargetX: "",
  cockpitTargetY: "",
  handlebarWidth: "",
};

function validateField(raw: string, label: string): { value: number } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { error: `${label} is required (in millimetres).` };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: `${label} must be a number in millimetres.` };
  if (value <= 0) return { error: `${label} must be greater than zero.` };
  return { value };
}

/** Optional field: blank means "not measured" — never a default value. */
function validateOptionalField(
  raw: string | undefined,
  label: string,
): { value: number | null } | { error: string } {
  const trimmed = (raw ?? "").trim();
  if (trimmed === "") return { value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: `${label} must be a number in millimetres.` };
  if (value <= 0) return { error: `${label} must be greater than zero.` };
  return { value };
}

export function parseFitTargetInput(input: FitTargetInput): FitTargetParseResult {
  const x = validateField(input.handlebarX, "Handlebar X");
  const y = validateField(input.handlebarY, "Handlebar Y");
  const cx = validateOptionalField(input.cockpitTargetX, "Rider contact X");
  const cy = validateOptionalField(input.cockpitTargetY, "Rider contact Y");
  const width = validateOptionalField(input.handlebarWidth, "Handlebar width");

  const errors: FitTargetErrors = {};
  if ("error" in x) errors.handlebarX = x.error;
  if ("error" in y) errors.handlebarY = y.error;
  if ("error" in cx) errors.cockpitTargetX = cx.error;
  if ("error" in cy) errors.cockpitTargetY = cy.error;
  if ("error" in width) errors.handlebarWidth = width.error;

  // A cockpit target is a coordinate pair: half a measurement is not a target.
  if (!("error" in cx) && !("error" in cy)) {
    if (cx.value !== null && cy.value === null)
      errors.cockpitTargetY = "Enter both rider contact X and Y, or leave both blank.";
    if (cy.value !== null && cx.value === null)
      errors.cockpitTargetX = "Enter both rider contact X and Y, or leave both blank.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const cxv = (cx as { value: number | null }).value;
  const cyv = (cy as { value: number | null }).value;
  const widthValue = (width as { value: number | null }).value;

  return {
    ok: true,
    target: { x: (x as { value: number }).value, y: (y as { value: number }).value },
    cockpitTarget: cxv !== null && cyv !== null ? { x: cxv, y: cyv } : null,
    handlingTarget: widthValue !== null ? { handlebarWidth: widthValue } : null,
  };
}
