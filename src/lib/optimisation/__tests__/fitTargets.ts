import type { TargetPosition } from "@/types/optimisation";

/**
 * The five rider-fit targets used by the optimisation diagnostics since
 * Sprint 9.5/9.6 (450/600 → 490/650). Shared so the sensitivity matrix and
 * the regression suites exercise exactly the same points.
 */
export const sensitivityTargets: readonly TargetPosition[] = [
  { x: 450, y: 600 },
  { x: 460, y: 615 },
  { x: 470, y: 631 },
  { x: 480, y: 640 },
  { x: 490, y: 650 },
];

/**
 * Handlebar-width conditions for the sensitivity matrix. `null` means the
 * rider stated no width target, so the handling component must be
 * unavailable. Every other value is a real width present in, or adjacent to,
 * the documented production data — no bike widths are invented here.
 */
export const sensitivityWidths: readonly (number | null)[] = [
  null,
  360,
  380,
  390,
  400,
  410,
  420,
];
