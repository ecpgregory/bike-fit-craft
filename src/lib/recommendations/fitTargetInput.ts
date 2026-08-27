import type { TargetPosition } from "@/types/optimisation";

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
}

export interface FitTargetErrors {
  handlebarX?: string;
  handlebarY?: string;
}

export type FitTargetParseResult =
  | { ok: true; target: TargetPosition }
  | { ok: false; errors: FitTargetErrors };

/** Demonstration defaults only — never read by the optimisation engine. */
export const DEFAULT_FIT_TARGET_INPUT: FitTargetInput = {
  handlebarX: "470",
  handlebarY: "631",
};

function validateField(raw: string, label: string): { value: number } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { error: `${label} is required (in millimetres).` };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { error: `${label} must be a number in millimetres.` };
  if (value <= 0) return { error: `${label} must be greater than zero.` };
  return { value };
}

export function parseFitTargetInput(input: FitTargetInput): FitTargetParseResult {
  const x = validateField(input.handlebarX, "Handlebar X");
  const y = validateField(input.handlebarY, "Handlebar Y");

  if ("error" in x || "error" in y) {
    const errors: FitTargetErrors = {};
    if ("error" in x) errors.handlebarX = x.error;
    if ("error" in y) errors.handlebarY = y.error;
    return { ok: false, errors };
  }

  return { ok: true, target: { x: x.value, y: y.value } };
}
