/**
 * Geometry Solver — shared engineering constants and conventions.
 *
 * This module is the single place where the Geometry Solver's coordinate
 * system, angle conventions and engineering constants are recorded. It exists
 * so that constants are never duplicated across the vector mathematics, the
 * solver, or the tests.
 *
 * It deliberately contains NO engineering approximations and NO invented
 * component dimensions. Unknown future values are recorded as TODOs only.
 *
 * ---------------------------------------------------------------------------
 * COORDINATE SYSTEM
 * ---------------------------------------------------------------------------
 * Sagittal (side-on) plane, two-dimensional.
 *
 *   Origin        Bottom Bracket centre.
 *   +X            Forwards, towards the front wheel.        millimetres
 *   +Y            Upwards, away from the ground.            millimetres
 *
 * Every reference point (FRP, Spacer Top, RP3, RP4, RP5) is expressed in this
 * frame as a `Point2D` in millimetres.
 *
 * ---------------------------------------------------------------------------
 * ANGLE CONVENTIONS
 * ---------------------------------------------------------------------------
 * All angles are DEGREES unless a function explicitly states radians.
 *
 *   θ  Head Tube Angle      measured from horizontal, e.g. 73°.
 *   β  Stem Reference Angle orientation of a 0° stem = 90° − θ.
 *   φ  Stem Angle           manufacturer's published angle, relative to β.
 *                           Negative = slammed/downwards, e.g. −6°.
 *   α  Stem Orientation     α = β + φ, measured from horizontal.
 *   ρ  Handlebar Rotation   rotation of the bar about the clamp axis,
 *                           positive = nose up.
 *   σ  Hood Rotation        additional hood tilt relative to the bar,
 *                           positive = nose up.
 *   ψ  Hood Orientation     ψ = ρ + σ, total rotation of the hood frame.
 *
 * Positive rotation is anticlockwise in the +X/+Y plane (standard 2D rotation).
 *
 * ---------------------------------------------------------------------------
 * ENGINEERING UNITS
 * ---------------------------------------------------------------------------
 *   Frame Reach        millimetres
 *   Frame Stack        millimetres
 *   Head Tube Angle    degrees
 *   Spacer Height      millimetres
 *   Stem Length        millimetres
 *   Stem Angle         degrees
 *   Handlebar Reach    millimetres, positive forwards
 *   Handlebar Stack    millimetres, positive upwards
 *   Handlebar Rotation degrees
 *   Hood Reach         millimetres, positive forwards
 *   Hood Stack         millimetres, positive upwards
 *   Hood Rotation      degrees
 */

/** Degrees in a right angle. Used to derive the Stem Reference Angle β. */
export const RIGHT_ANGLE_DEGREES = 90;

/** Radians per degree. Sole conversion factor used by the vector mathematics. */
export const RADIANS_PER_DEGREE = Math.PI / 180;

/**
 * Tolerance used by engineering regression tests when comparing millimetre
 * coordinates. This is a TEST tolerance only — the solver itself never clamps,
 * rounds or snaps any value.
 */
export const GEOMETRY_REGRESSION_TOLERANCE_MM = 0.01;

/* ---------------------------------------------------------------------------
 * FUTURE CONSTANTS — deliberately not implemented.
 *
 * TODO(cockpit-model-1.1): headset top cap height (mm). A real displacement
 *   between the Frame Reference Point and the base of the spacer stack. Value
 *   is manufacturer-specific and is not currently an input.
 * TODO(cockpit-model-1.1): hood shim / lever body datum offsets (mm). Required
 *   before hood geometry can be derived from a lever part number rather than
 *   supplied directly.
 * TODO(cockpit-model-1.1): handlebar drop and bar-datum definitions. Drop is
 *   conventionally positive downwards and must never be treated as
 *   interchangeable with handlebar stack.
 * TODO(cockpit-model-1.1): fork rake / offset. Not used: the physical head tube
 *   angle drives the steerer axis directly in Cockpit Model 1.0.
 * ------------------------------------------------------------------------ */
