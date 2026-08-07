import type { Point2D } from "@/types/optimisation";
import { RADIANS_PER_DEGREE, RIGHT_ANGLE_DEGREES } from "./geometryConstants";

/**
 * Cockpit Model 1.0 — Stage 1 vector mathematics.
 *
 * Vector chain implemented here:
 *
 *   Frame Reference Point → Spacer Vector → Spacer Top → Stem Vector → RP3
 *
 * Coordinate system and angle conventions are documented once, in
 * ./geometryConstants.ts. Summary: origin at the Bottom Bracket, +X forwards,
 * +Y upwards, all lengths in millimetres and all angles in degrees unless
 * stated otherwise.
 *
 * This module is pure mathematics: no null handling, no defaults, no clamping,
 * no tolerances. Missing-input handling lives in the Geometry Solver.
 */

/** Degrees → radians. */
function toRadians(degrees: number): number {
  return degrees * RADIANS_PER_DEGREE;
}


/**
 * Frame Reference Point (FRP) — top of the head tube.
 *
 * Origin: Bottom Bracket. Destination: head tube top.
 * Convention: +X forwards, +Y upwards, millimetres.
 * Purpose: the datum from which the whole cockpit chain is built.
 *
 * @param frameReach millimetres
 * @param frameStack millimetres
 * @returns Point2D, millimetres
 */
export function calculateFrameReferencePoint(
  frameReach: number,
  frameStack: number,
): Point2D {
  return { x: frameReach, y: frameStack };
}

/**
 * Spacer Vector — displacement along the physical steerer axis.
 *
 * Origin: Frame Reference Point. Destination: Spacer Top.
 * Convention: +X forwards, +Y upwards, millimetres.
 * Purpose: raise the stem clamp along the steerer by the spacer stack.
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
 * @returns Point2D displacement, millimetres
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
 *
 * Origin: Bottom Bracket (absolute point). Convention: millimetres, +X
 * forwards, +Y upwards. Purpose: the mounting location of the stem.
 *
 * Spacer Top = Frame Reference Point + Spacer Vector.
 *
 * @param frameReferencePoint Point2D, millimetres
 * @param spacerVector Point2D displacement, millimetres
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
 * @returns degrees (β), measured from horizontal
 */
export function calculateStemReferenceAngle(headTubeAngle: number): number {
  return RIGHT_ANGLE_DEGREES - headTubeAngle;
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

/* ---------------------------------------------------------------------------
 * Cockpit Model 1.0 — Stage 2: RP3 → RP4 → RP5
 *
 * Why the reference points are separated rather than calculated in one step:
 * each of RP3, RP4 and RP5 is a physically meaningful, independently
 * measurable location on the bike. Separating them means each transformation
 * can be tested, debugged and replaced on its own — a manufacturer-specific
 * handlebar model or a hood-shim model can be swapped in without touching the
 * frame/stem mathematics or the Geometry Solver.
 *
 *   RP3  Handlebar Clamp Centre — centre of the bar clamp on the stem face.
 *   RP4  Handlebar Reference Point — the chosen engineering datum on the bar
 *        (bar-end/drop datum), located from RP3 by handlebar reach/stack.
 *   RP5  Rider Contact Point — where the hand rests on the hood, located from
 *        RP4 by the hood's own reach/stack and rotation.
 * ------------------------------------------------------------------------ */

/**
 * Handlebar Vector — displacement along the handlebar geometry.
 * Origin: RP3 (Handlebar Clamp Centre). Destination: RP4 (Handlebar Reference
 * Point).
 *
 * Sign convention for the handlebar inputs, in the unrotated bar frame:
 *   Handlebar Reach — millimetres, positive FORWARDS (+X).
 *   Handlebar Stack — millimetres, positive UPWARDS (+Y). This is the field
 *     already exposed by CockpitConfiguration and is used exactly as given.
 *     It is NOT handlebar drop: drop is conventionally a positive downwards
 *     quantity. If a future engineering model needs drop it must be derived
 *     explicitly (e.g. drop = -handlebarStack for datums below the clamp),
 *     never treated as interchangeable with stack.
 *
 * Handlebar Rotation ρ rotates the bar about the clamp axis, positive = nose
 * up, applied as a standard 2D rotation of the (reach, stack) offset:
 *
 *   ΔX = reach × cos(ρ) − stack × sin(ρ)
 *   ΔY = reach × sin(ρ) + stack × cos(ρ)
 *
 * @param handlebarReach millimetres
 * @param handlebarStack millimetres
 * @param handlebarRotation degrees (ρ)
 */
export function calculateHandlebarVector(
  handlebarReach: number,
  handlebarStack: number,
  handlebarRotation: number,
): Point2D {
  const rho = toRadians(handlebarRotation);
  return {
    x: handlebarReach * Math.cos(rho) - handlebarStack * Math.sin(rho),
    y: handlebarReach * Math.sin(rho) + handlebarStack * Math.cos(rho),
  };
}

/**
 * RP4 — Handlebar Reference Point.
 * RP4 = RP3 + Handlebar Vector.
 */
export function calculateRP4(rp3: Point2D, handlebarVector: Point2D): Point2D {
  return {
    x: rp3.x + handlebarVector.x,
    y: rp3.y + handlebarVector.y,
  };
}

/**
 * Hood Vector — displacement along the hood geometry.
 * Origin: RP4 (Handlebar Reference Point). Destination: RP5 (Rider Contact
 * Point).
 *
 * Sign convention, in the unrotated handlebar frame:
 *   Hood Reach — millimetres, positive FORWARDS (+X).
 *   Hood Stack — millimetres, positive UPWARDS (+Y).
 *
 * The hood offset is rotated by the TOTAL rotation applied to the hood: the
 * handlebar rotation ρ carries the hood with it, and hood rotation σ (tilt /
 * shims) adds on top. The caller supplies the already-summed angle so this
 * function performs exactly one transformation:
 *
 *   ΔX = hoodReach × cos(ψ) − hoodStack × sin(ψ)
 *   ΔY = hoodReach × sin(ψ) + hoodStack × cos(ψ)
 *
 * @param hoodReach millimetres
 * @param hoodStack millimetres
 * @param hoodOrientation degrees (ψ), total rotation of the hood frame
 */
export function calculateHoodVector(
  hoodReach: number,
  hoodStack: number,
  hoodOrientation: number,
): Point2D {
  const psi = toRadians(hoodOrientation);
  return {
    x: hoodReach * Math.cos(psi) - hoodStack * Math.sin(psi),
    y: hoodReach * Math.sin(psi) + hoodStack * Math.cos(psi),
  };
}

/**
 * Hood Orientation ψ — total rotation of the hood in the sagittal plane.
 *
 *   ψ = ρ + σ
 *
 * @param handlebarRotation degrees (ρ)
 * @param hoodRotation degrees (σ)
 * @returns degrees (ψ)
 */
export function calculateHoodOrientation(
  handlebarRotation: number,
  hoodRotation: number,
): number {
  return handlebarRotation + hoodRotation;
}

/**
 * RP5 — Rider Contact Point.
 * RP5 = RP4 + Hood Vector.
 */
export function calculateRP5(rp4: Point2D, hoodVector: Point2D): Point2D {
  return {
    x: rp4.x + hoodVector.x,
    y: rp4.y + hoodVector.y,
  };
}
