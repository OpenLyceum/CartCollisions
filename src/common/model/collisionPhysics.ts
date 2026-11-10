/**
 * collisionPhysics.ts
 *
 * The two-cart track as a pure function of state: no SceneryStack, so it is cheap
 * to unit-test and to run thousands of substeps per frame.
 *
 * Coordinates are along the track, in metres from the left end stop, positive to
 * the right. The red cart is always on the left and the blue cart on the right;
 * `x` is a cart's centre. The gap between the bumpers that face each other is
 * `xBlue − xRed − CART_LENGTH`.
 *
 * Every interaction is a force law rather than an instantaneous velocity swap, so
 * velocities change over the few tens of milliseconds a real collision takes — that
 * is what the student sees in Smart Cart data, and what makes "find the velocity just
 * before and just after" a question about choosing a fit interval. Each force between
 * the carts is applied equal and opposite, so momentum is conserved to rounding
 * whenever friction and the end stops are not involved.
 */

import {
  CART_LENGTH,
  CONTACT_DAMPING,
  CONTACT_STIFFNESS,
  GRAVITY,
  MAGNET_CUTOFF,
  MAGNET_SOFTENING,
  MAGNET_STRENGTH,
  PLUNGER_STIFFNESS,
  TRACK_LENGTH,
  VELCRO_DAMPING,
  VELCRO_ENGAGE_GAP,
  VELCRO_STIFFNESS,
} from "../../CartCollisionsConstants.js";

/** What faces the other cart. */
export const Bumper = {
  /** Spring plunger (red cart) — explosions. Bare plastic contact otherwise. */
  PLUNGER: "plunger",
  VELCRO: "velcro",
  MAGNET: "magnet",
} as const;

export type BumperValue = (typeof Bumper)[keyof typeof Bumper];

export type CartsState = {
  xRed: number;
  vRed: number;
  xBlue: number;
  vBlue: number;
  /** True once the Velcro has grabbed. Never lets go. */
  stuck: boolean;
  /** True once the plunger trigger has been tapped. */
  plungerReleased: boolean;
};

export type CartsParameters = {
  readonly massRed: number;
  readonly massBlue: number;
  readonly bumper: BumperValue;
  /** How far the released plunger reaches past the red cart's bumper, in m. */
  readonly plungerExtension: number;
  /** Rolling-friction coefficient (dimensionless). */
  readonly rollingFriction: number;
};

/** The force the carts exert on each other, by kind, so the virtual load cells can report it. */
export type InteractionForces = {
  /** Force on the blue cart, in N (positive pushes it right). The red cart feels the opposite. */
  readonly onBlue: number;
  /** Force from the left end stop on the red cart, in N. */
  readonly leftStopOnRed: number;
  /** Force from the right end stop on the blue cart, in N. */
  readonly rightStopOnBlue: number;
};

export function gapBetween(state: Readonly<CartsState>): number {
  return state.xBlue - state.xRed - CART_LENGTH;
}

/**
 * Magnetic repulsion between the bumpers for a gap `gap` (m), in N. Shifted so it
 * reaches zero at the cutoff instead of jumping there; still a conservative force.
 */
export function magnetForce(gap: number): number {
  if (gap >= MAGNET_CUTOFF) {
    return 0;
  }
  const d = Math.max(gap, 0) + MAGNET_SOFTENING;
  const dc = MAGNET_CUTOFF + MAGNET_SOFTENING;
  return MAGNET_STRENGTH * (1 / (d * d) - 1 / (dc * dc));
}

/** The forces acting between the carts and from the stops, for the current state. */
export function interactionForces(state: Readonly<CartsState>, parameters: CartsParameters): InteractionForces {
  const gap = gapBetween(state);
  const closingSpeed = state.vRed - state.vBlue; // > 0 when the carts approach
  let onBlue = 0;

  if (state.stuck) {
    // The Velcro joint: a stiff, near-critically damped spring about zero gap.
    onBlue = -VELCRO_STIFFNESS * gap + VELCRO_DAMPING * closingSpeed;
  } else {
    if (gap < 0) {
      // Bare plastic on plastic. Damping only while pressing in, so it never pulls.
      onBlue += Math.max(0, CONTACT_STIFFNESS * -gap + CONTACT_DAMPING * closingSpeed);
    }
    if (parameters.bumper === Bumper.MAGNET) {
      onBlue += magnetForce(gap);
    } else if (parameters.bumper === Bumper.PLUNGER && state.plungerReleased && gap < parameters.plungerExtension) {
      onBlue += PLUNGER_STIFFNESS * (parameters.plungerExtension - Math.max(gap, 0));
    }
  }

  const redLeftEdge = state.xRed - CART_LENGTH / 2;
  const blueRightEdge = state.xBlue + CART_LENGTH / 2;
  const leftStopOnRed =
    redLeftEdge < 0 ? Math.max(0, CONTACT_STIFFNESS * -redLeftEdge - CONTACT_DAMPING * 4 * state.vRed) : 0;
  const rightOverlap = blueRightEdge - TRACK_LENGTH;
  const rightStopOnBlue =
    rightOverlap > 0 ? Math.min(0, -CONTACT_STIFFNESS * rightOverlap - CONTACT_DAMPING * 4 * state.vBlue) : 0;

  return { onBlue, leftStopOnRed, rightStopOnBlue };
}

/**
 * Rolling friction as a velocity change over `dt`: opposes motion and never
 * reverses it, so a cart coasting to a stop stays stopped.
 */
function applyFriction(velocity: number, rollingFriction: number, dt: number): number {
  const dv = rollingFriction * GRAVITY * dt;
  if (Math.abs(velocity) <= dv) {
    return 0;
  }
  return velocity - Math.sign(velocity) * dv;
}

/**
 * Advances `state` in place by one substep `dt` (semi-implicit Euler) and returns
 * the forces that acted. Velcro engages here when the bumpers meet.
 */
export function stepCarts(state: CartsState, parameters: CartsParameters, dt: number): InteractionForces {
  if (
    parameters.bumper === Bumper.VELCRO &&
    !state.stuck &&
    gapBetween(state) <= VELCRO_ENGAGE_GAP &&
    state.vRed > state.vBlue
  ) {
    state.stuck = true;
  }

  const forces = interactionForces(state, parameters);
  const forceOnRed = -forces.onBlue + forces.leftStopOnRed;
  const forceOnBlue = forces.onBlue + forces.rightStopOnBlue;

  state.vRed = applyFriction(state.vRed + (forceOnRed / parameters.massRed) * dt, parameters.rollingFriction, dt);
  state.vBlue = applyFriction(state.vBlue + (forceOnBlue / parameters.massBlue) * dt, parameters.rollingFriction, dt);
  state.xRed += state.vRed * dt;
  state.xBlue += state.vBlue * dt;

  return forces;
}

/** Total momentum of the two carts, in kg·m/s. */
export function totalMomentum(state: Readonly<CartsState>, parameters: CartsParameters): number {
  return parameters.massRed * state.vRed + parameters.massBlue * state.vBlue;
}

/** Total translational kinetic energy of the two carts, in J. */
export function totalKineticEnergy(state: Readonly<CartsState>, parameters: CartsParameters): number {
  return 0.5 * parameters.massRed * state.vRed ** 2 + 0.5 * parameters.massBlue * state.vBlue ** 2;
}

/** Energy stored in a released-from-setting plunger, in J (½ k x²). */
export function plungerEnergy(extension: number): number {
  return 0.5 * PLUNGER_STIFFNESS * extension * extension;
}
