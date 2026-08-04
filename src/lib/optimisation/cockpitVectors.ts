import type { Point2D } from "@/types/optimisation";

/**
 * Cockpit Model 1.0 — Stage 1 vector mathematics.
 *
 * Vector chain implemented here:
 *
 *   Frame Reference Point → Spacer Vector → Spacer Top → Stem Vector → RP3
 *
 * Coordinate system: origin at the Bottom Bracket, +X forwards, +Y upwards.
 * All lengths in millimetres, all angles in degrees unless stated otherwise.
 *
 * This module is pure mathematics: no null handling, no defaults, no clamping,
 * no tolerances. Missing-input handling lives in the Geometry Solver.
 */

/** Degrees → radians. */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Frame Reference Point — top of the head tube.
 * Origin: Bottom Bracket. Destination: head tube top.
 *
 * @param frameReach millimetres
 * @param frameStack millimetres
 */
export function calculateFrameReferencePoint(
  frameReach: number,
  frameStack: number,
): Point2D {
  return { x: frameReach, y: frameStack };
}

/**
 * Spacer Vector — displacement along the physical steerer axis.
 * Origin: Frame Reference Point. Destination: Spacer Top.
 *
 * ΔX = -SpacerHeight × cos(θ)
 * ΔY =  SpacerHeight × sin(θ)
 *
 * The X component is negative because the steerer axis leans back towards the
 * Bottom Bracket as it rises. The physical head tube angle is used directly:
 * no effective angle, no fork rake or offset compensation.
 *
 * @param spacerHeight millimetres
 * @param headTubeAngle degrees, measured from horizontal (θ)
 */
export function calculateSpacerVector(
  spacerHeight: number,
  headTubeAngle: number,
): Point2D {
  const theta = toRadians(headTubeAngle);
  return {
    x: -spacerHeight * Math.cos(theta),
    y: spacerHeight * Math.sin(theta),
  };
}

/**
 * Spacer Top — top of the spacer stack / stem clamp base.
 * Spacer Top = Frame Reference Point + Spacer Vector.
 */
export function calculateSpacerTop(
  frameReferencePoint: Point2D,
  spacerVector: Point2D,
): Point2D {
  return {
    x: frameReferencePoint.x + spacerVector.x,
    y: frameReferencePoint.y + spacerVector.y,
  };
}

/**
 * Stem Reference Angle β — orientation of a zero-degree stem.
 * A stem is mounted perpendicular to the steerer axis, therefore:
 *
 *   β = 90° − θ
 *
 * @param headTubeAngle degrees (θ)
 * @returns degrees (β)
 */
export function calculateStemReferenceAngle(headTubeAngle: number): number {
  return 90 - headTubeAngle;
}

/**
 * Stem Orientation α — actual orientation of the stem in the sagittal plane.
 *
 *   α = β + φ
 *
 * @param stemReferenceAngle degrees (β)
 * @param stemAngle degrees (φ), the manufacturer's published stem angle
 * @returns degrees (α)
 */
export function calculateStemOrientation(
  stemReferenceAngle: number,
  stemAngle: number,
): number {
  return stemReferenceAngle + stemAngle;
}

/**
 * Stem Vector — displacement along the stem.
 * Origin: Spacer Top. Destination: RP3 (handlebar clamp centre).
 *
 * ΔX = StemLength × cos(α)
 * ΔY = StemLength × sin(α)
 *
 * @param stemLength millimetres
 * @param stemOrientation degrees (α)
 */
export function calculateStemVector(
  stemLength: number,
  stemOrientation: number,
): Point2D {
  const alpha = toRadians(stemOrientation);
  return {
    x: stemLength * Math.cos(alpha),
    y: stemLength * Math.sin(alpha),
  };
}

/**
 * RP3 — Handlebar Clamp Centre.
 * RP3 = Spacer Top + Stem Vector.
 *
 * TODO(cockpit-model-1.1): headset top cap height is a real engineering input
 * between the Frame Reference Point and the spacer stack; it is deliberately
 * NOT modelled here because this sprint's input set is fixed.
 */
export function calculateRP3(spacerTop: Point2D, stemVector: Point2D): Point2D {
  return {
    x: spacerTop.x + stemVector.x,
    y: spacerTop.y + stemVector.y,
  };
}
