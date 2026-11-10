/**
 * CartCollisionsConstants.ts
 *
 * Every named numeric constant used across the simulation. Physics values are SI
 * (metres, seconds, kilograms, newtons); layout values are screen pixels. Colours
 * live in CartCollisionsColors.ts.
 *
 * The apparatus values describe a PASCO ME-1240 Smart Cart on a 1.2 m aluminium
 * track with ME-6757-style mass bars. They are typical, not exact: the virtual
 * balance perturbs each cart and bar slightly (see `CartCollisionsModel`) so that
 * equal-mass runs are equal only to within a few grams, as they are on a lab bench.
 */

import CartCollisionsNamespace from "./CartCollisionsNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Width of the right-hand control column. */
export const CONTROL_COLUMN_WIDTH = 250;

// ── Apparatus (SI) ────────────────────────────────────────────────────────────

/** Usable length of the track between the two end stops, in m. */
export const TRACK_LENGTH = 1.2;

/** Length of a Smart Cart body, bumper to bumper, in m. */
export const CART_LENGTH = 0.17;

/** Nominal mass of an empty Smart Cart, in kg. */
export const NOMINAL_CART_MASS = 0.25;

/** Nominal mass of one mass bar, in kg. */
export const NOMINAL_BAR_MASS = 0.25;

/** Largest random deviation of a cart or bar from its nominal mass, in kg. */
export const MASS_TOLERANCE = 0.004;

/** Mass bars placed in the blue cart for the "unequal mass" runs. */
export const UNEQUAL_MASS_BAR_COUNT = 2;

/** Where the red and blue carts' centres start for a collision run, in m from the left stop. */
export const COLLISION_RED_START = 0.2;
export const COLLISION_BLUE_START = 0.65;

/** Track centre, where the carts start an explosion touching each other, in m. */
export const TRACK_CENTER = TRACK_LENGTH / 2;

// ── Interactions (SI) ─────────────────────────────────────────────────────────

/** Physics substep, in s. Small enough for the stiffest spring below (ω ≈ 200 rad/s). */
export const PHYSICS_TIME_STEP = 0.0002;

/** Stiffness of the hard plastic contact when two cart bodies (or a cart and a stop) touch, in N/m. */
export const CONTACT_STIFFNESS = 8000;

/** Damping of that hard contact, in N·s/m. Makes a bare bump lossy, like real plastic. */
export const CONTACT_DAMPING = 6;

/**
 * Strength of the magnetic bumpers, in N·m² — the repulsion is
 * K (1/(d+d₀)² − 1/(d_c+d₀)²) for a gap d below the cutoff d_c. The constant shift
 * makes the force (and the potential) vanish smoothly at the cutoff.
 */
export const MAGNET_STRENGTH = 3e-4;

/** Softening length d₀ of the magnetic repulsion, in m. */
export const MAGNET_SOFTENING = 0.005;

/** Gap beyond which the magnets no longer act, in m. */
export const MAGNET_CUTOFF = 0.08;

/** Velcro grabs once the bumpers are this close, in m. */
export const VELCRO_ENGAGE_GAP = 0.001;

/** Stiffness and damping of the Velcro joint once it has grabbed (near-critical). */
export const VELCRO_STIFFNESS = 3000;
export const VELCRO_DAMPING = 35;

/** Plunger spring constant, in N/m. */
export const PLUNGER_STIFFNESS = 200;

/** How far the plunger extends when released from each of its three latch positions, in m. */
export const PLUNGER_COMPRESSIONS = [0.01, 0.02, 0.03] as const;

/** Default plunger setting (1-based), as in the handout ("position #2"). */
export const DEFAULT_PLUNGER_SETTING = 2;

/** Rolling-friction coefficient by default — a well-levelled track. */
export const DEFAULT_ROLLING_FRICTION = 0.002;

/** Range of the rolling-friction preference. */
export const MAX_ROLLING_FRICTION = 0.02;

/** Gravitational acceleration, in m/s². */
export const GRAVITY = 9.81;

/** Push speeds available to the student for the red cart, in m/s. */
export const MIN_PUSH_SPEED = 0.1;
export const MAX_PUSH_SPEED = 1.0;
export const DEFAULT_PUSH_SPEED = 0.4;

// ── Smart Cart sensor ─────────────────────────────────────────────────────────

/**
 * Wheel-encoder resolution, in m per count: the RotaryPos parameters of the Smart
 * Cart position sensor (PASCO sensor id 2027) are 0.09895 m of travel per 816 counts.
 */
export const ENCODER_RESOLUTION = 0.09895 / 816;

/** Sample rates the virtual Smart Cart offers, in Hz. */
export const SAMPLE_RATES = [50, 100, 250] as const;
export const DEFAULT_SAMPLE_RATE = 100;

/** Samples in the centred least-squares window that turns position into velocity. */
export const VELOCITY_WINDOW = 5;

/** A recording stops by itself after this long, in s. */
export const MAX_RECORDING_TIME = 10;

/**
 * A recording stops by itself when a cart comes this close to an end stop, in m —
 * the handout's "stop recording before either cart reaches the end of the track".
 */
export const END_STOP_MARGIN = 0.01;

/** How often a device that cannot stream is polled, in ms (test fakes only). */
export const HARDWARE_POLL_INTERVAL_MS = 20;

/** A real Smart Cart's sampling period on the Smart Carts screen, in ms (50 Hz). */
export const HARDWARE_STREAM_PERIOD_MS = 20;

CartCollisionsNamespace.register("CartCollisionsConstants", {
  SCREEN_VIEW_MARGIN,
  TRACK_LENGTH,
  CART_LENGTH,
  ENCODER_RESOLUTION,
});
