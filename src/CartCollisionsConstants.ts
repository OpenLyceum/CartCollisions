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

export function plungerCompression(setting: number): number {
  const compression = PLUNGER_COMPRESSIONS[setting - 1];
  if (compression === undefined) {
    throw new RangeError(`Invalid plunger setting ${setting}`);
  }
  return compression;
}

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

/** Settings for common/CartCollisionsControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CART_COLLISIONS_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Cart collisions number control options scale (dimensionless). */
  CART_COLLISIONS_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  CART_COLLISIONS_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  CART_COLLISIONS_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  CART_COLLISIONS_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  CART_COLLISIONS_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/CartCollisionsPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CART_COLLISIONS_PANEL_SETTINGS = {
  OPTIONS_X_MARGIN: 12,
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/CartCollisionsScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CART_COLLISIONS_SCREEN_ICONS_SETTINGS = {
  /** Left vertical stop post x, px. */
  LEFT_STOP_X: 14, // px
  /** Vertical stop post height, px. */
  STOP_HEIGHT: 62, // px

  CART_Y_OFFSET: 14, // px
  CART_X_OFFSET: 32, // px
  BURST_Y_OFFSET: 57, // px
  WAVES_Y_OFFSET: 120, // px

  TRACK_Y: 250,
  CART_W: 150,
  CART_H: 70,
  CART_CORNER_RADIUS: 8,
  CART_RADIUS: 14,
  CART_X: 32,
  TRACK_X: 20,
  TRACK_HEIGHT: 22,
  TRACK_WIDTH: 14,
  ARROW_HEAD_HEIGHT: 26,
  ARROW_HEAD_WIDTH: 34,
  ARROW_TAIL_WIDTH: 12,
  BURST_RADIUS: 34,
  VELCRO_WIDTH: 12,
  MAGNET_WIDTH: 10,
  CREATE_SMART_CARTS_ICON_LINE_WIDTH: 12,
} as const;

/** Settings for common/model/CartCollisionsModel.ts. */
export const CART_COLLISIONS_MODEL_SETTINGS = {
  /** Largest physics interval advanced for a rendered frame (s). */
  MAX_FRAME_DT: 1 / 20,
  /** Tolerance at a sampling boundary (s). */
  SAMPLE_TIME_EPSILON: 1e-9,
  /** Below this speed a cart counts as at rest, in m/s. */
  REST_SPEED: 1e-4,
} as const;

/** Settings for common/model/GraphState.ts. */
export const GRAPH_STATE_SETTINGS = {
  /** Shortest visible time window, in s. */
  MIN_ZOOM_SPAN: 0.1,
  /** Time range max (s). */
  TIME_RANGE_MAX: 3,
  /** Fit start default (s). */
  FIT_START_DEFAULT: 0.5,
  /** Fit end default (s). */
  FIT_END_DEFAULT: 1.0,
} as const;

/** Settings for common/model/labTables.ts. */
export const LAB_TABLES_SETTINGS = {
  /** Smallest initial energy for calculating a percentage change (J). */
  MIN_INITIAL_ENERGY: 1e-12,
  /** Relative tolerance for a calculated cell — allows for rounding the inputs to 3 figures. */
  RELATIVE_TOLERANCE: 0.02,
} as const;

/** Settings for common/view/BalancePanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const BALANCE_PANEL_SETTINGS = {
  SEND_BUTTON_MAX_WIDTH_OFFSET: 40, // px

  FONT_SIZE: 12,
  SPACING: 4,
  TITLE_FONT_SIZE: 12,
} as const;

/** Settings for common/view/CartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CART_NODE_SETTINGS = {
  PLUNGER_HEIGHT: 12, // px

  LABEL_MAX_WIDTH_OFFSET: 16, // px

  BODY_HEIGHT: 30,
  WHEEL_RADIUS: 6,
  BAR_HEIGHT: 9,
  BUMPER_WIDTH: 5,
  BODY_CORNER_RADIUS: 4,
  LABEL_FONT_SIZE: 9,
  OUTLINE_LINE_WIDTH: 0.5,
  CHILDREN_LINE_WIDTH: 0.5,
  SHAPE_HEIGHT: 4,
} as const;

/** Settings for common/view/ExperimentControlPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const EXPERIMENT_CONTROL_PANEL_SETTINGS = {
  PLUNGER_SETTING_LABEL_MAX_WIDTH: 110, // px
  CHANGE_SIGN_MAX_WIDTH: 70, // px
  CHANGE_SIGN_LABEL_MAX_WIDTH: 110, // px
  SPACING: 7, // px

  ACTION_BUTTON_MAX_WIDTH_OFFSET: 20, // px

  FONT_SIZE: 12,
  TITLE_FONT_SIZE: 12,
  CREATE_MASS_MODE_RADIO_BUTTONS_SPACING: 5,
  CREATE_MASS_MODE_RADIO_BUTTONS_RADIUS: 6,
  ACTION_BUTTON_FONT_SIZE: 13,
  PLUNGER_RADIO_SPACING: 12,
  PLUNGER_RADIO_RADIUS: 6,
  CONTENT_SPACING: 8,
  /** Push speed control delta (dimensionless). */
  PUSH_SPEED_CONTROL_DELTA: 0.05,
  PUSH_SPEED_CONTROL_MAX_WIDTH: 110,
  /** Push speed control decimal places (dimensionless). */
  PUSH_SPEED_CONTROL_DECIMAL_PLACES: 2,
  CHANGE_SIGN_SPACING: 4,
} as const;

/** Settings for common/view/FitPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FIT_PANEL_SETTINGS = {
  READOUT_MAX_WIDTH_OFFSET: 140, // px

  FONT_SIZE: 12,
  SMALL_FONT_SIZE: 11,
  TITLE_FONT_SIZE: 12,
  BUTTON_MAX_WIDTH: 60,
  BUTTON_X_MARGIN: 5,
  BUTTON_Y_MARGIN: 2,
  GRID_X_SPACING: 6,
  GRID_Y_SPACING: 4,
  CONTENT_SPACING: 5,
} as const;

/** Settings for common/view/LabScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LAB_SCREEN_VIEW_SETTINGS = {
  FIT_PANEL_TOP_GAP: 40, // px
  LAB_TABLES_MAX_WIDTH_INSET: 30, // px
  CONTROL_COLUMN_MIN_WIDTH_INSET: 60, // px
  RECORDING_TEXT_TOP_OFFSET: 18, // px

  /** Bottom of the apparatus band, where the graph's controls begin. */
  PLAY_AREA_BOTTOM: 150,
  /** Left edge of the plotting area (room for the y axis labels). */
  GRAPH_LEFT: 78,
  /** Left edge of the plotting area (room for the y axis labels). */
  GRAPH_WIDTH: 590,
  /** Left edge of the plotting area (room for the y axis labels). */
  GRAPH_HEIGHT: 235,
  LAB_TABLES_BUTTON_FONT_SIZE: 14,
  CONTROL_COLUMN_SPACING: 10,
  RECORDING_TEXT_FONT_SIZE: 12,
} as const;

/** Settings for common/view/LabTablesDialog.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LAB_TABLES_DIALOG_SETTINGS = {
  VALUE_TEXT_MAX_WIDTH_OFFSET: 8, // px
  EXPECTED_TEXT_MAX_WIDTH_OFFSET: 8, // px
  QUESTIONS_LINE_WRAP: 800, // px

  CELL_WIDTH: 74,
  ROW_LABEL_WIDTH: 190,
  CELL_FONT_SIZE: 11,
  HEADER_FONT_SIZE: 11,
  TITLE_FONT_SIZE: 14,
  /** Largest magnitude a student may type into any cell. */
  ENTRY_LIMIT: 1000,
  EXPECTED_TEXT_FONT_SIZE: 9,
  CELL_MIN_HEIGHT: 22,
  CELL_X_MARGIN: 3,
  CELL_Y_MARGIN: 2,
  GRID_X_SPACING: 3,
  GRID_Y_SPACING: 3,
  CREATE_TABLE_SPACING: 4,
  CHECKBOX_OPTIONS_BOX_WIDTH: 14,
  CHECKBOX_MAX_WIDTH: 200,
  PUSH_BUTTON_MAX_WIDTH: 140,
  CONTROLS_SPACING: 16,
  QUESTION_FONT_SIZE: 11,
  QUESTIONS_SPACING: 3,
  TITLE_SPACING: 10,
  DIALOG_TITLE_FONT_SIZE: 18,
} as const;

/** Settings for common/view/RecordControls.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const RECORD_CONTROLS_SETTINGS = {
  FONT_SIZE: 13,
  DOT_RADIUS: 6,
  SQUARE_X: -5,
  SQUARE_Y: -5,
  SQUARE_WIDTH: 10,
  SQUARE_HEIGHT: 10,
  RECORD_BUTTON_SPACING: 6,
  RECORD_BUTTON_MAX_WIDTH: 80,
  RECORD_BUTTON_MIN_WIDTH: 100,
  CLEAR_BUTTON_MAX_WIDTH: 70,
  SPACING: 8,
} as const;

/** Settings for common/view/TimeGraphNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TIME_GRAPH_NODE_SETTINGS = {
  FIT_LINES_LINE_DASH_DASH: 6, // px
  FIT_LINES_LINE_DASH_GAP: 3, // px
  LAYOUT_TOP_OFFSET: 18, // px

  LABEL_FONT_SIZE: 11,
  TICK_FONT_SIZE: 10,
  /** Smallest y span shown per quantity, so a cart at rest is not magnified into noise. */
  MIN_Y_SPAN: {
    position: 0.1,
    velocity: 0.2,
    force: 2,
  },
  /** Chart transform range min (in the source module’s documented units). */
  CHART_TRANSFORM_RANGE_MIN: -0.1,
  /** Chart transform range max (in the source module’s documented units). */
  CHART_TRANSFORM_RANGE_MAX: 0.1,
  GRID_OPTIONS_LINE_WIDTH: 0.5,
  ZERO_LINE_LINE_WIDTH: 0.5,
  RED_PLOT_LINE_WIDTH: 2,
  BLUE_PLOT_LINE_WIDTH: 2,
  FIT_LINES_LINE_WIDTH: 2,
  HANDLE_X: -6,
  HANDLE_WIDTH: 12,
  HANDLE_LINE_WIDTH: 2,
  HANDLE_RADIUS: 6,
  HANDLE_Y: 4,
  RADIO_LABEL_MAX_WIDTH: 90,
  QUANTITY_RADIO_BUTTONS_SPACING: 14,
  QUANTITY_RADIO_BUTTONS_RADIUS: 6,
  SMALL_BUTTON_MAX_WIDTH: 110,
  SMALL_BUTTON_X_MARGIN: 6,
  SMALL_BUTTON_Y_MARGIN: 3,
  ZOOM_BUTTONS_SPACING: 6,
  Y_AXIS_LABEL_RIGHT: -38,
  QUANTITY_RADIO_BOTTOM: -6,
} as const;

/** Settings for common/view/TrackNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TRACK_NODE_SETTINGS = {
  /** Height of the track beam, in view pixels. */
  TRACK_HEIGHT: 14,
  /** Height of the track beam, in view pixels. */
  STOP_WIDTH: 10,
  /** Height of the track beam, in view pixels. */
  STOP_HEIGHT: 34,
  BEAM_LINE_WIDTH: 0.5,
  LABEL_FONT_SIZE: 8,
  STOP_CORNER_RADIUS: 2,
} as const;

/** Settings for common/view/VirtualLabScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const VIRTUAL_LAB_SCREEN_VIEW_SETTINGS = {
  /** y of the track's top surface. */
  TRACK_TOP: 100,
} as const;

/** Settings for preferences/CartCollisionsPreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CART_COLLISIONS_PREFERENCES_NODE_SETTINGS = {
  FONT_SIZE: 14,
  HEADER_FONT_SIZE: 18,
  SAMPLE_RATE_RADIO_SPACING: 16,
  /** Friction control delta (dimensionless). */
  FRICTION_CONTROL_DELTA: 0.001,
  /** Friction control decimal places (dimensionless). */
  FRICTION_CONTROL_DECIMAL_PLACES: 3,
  REVERSED_CHECKBOX_SPACING: 8,
  SPACING: 12,
} as const;

/** Settings for smart-carts/model/BluetoothSmartCart.ts. */
export const BLUETOOTH_SMART_CART_SETTINGS = {
  /** Maximum Bluetooth connection wait (ms). */
  CONNECTION_TIMEOUT_MS: 15000,
  /** PASCO sensor ids of the cart's position and force channels (datasheets). */
  POSITION_SENSOR_ID: 2027,
  /** PASCO sensor ids of the cart's position and force channels (datasheets). */
  FORCE_SENSOR_ID: 2025,
} as const;

/** Settings for smart-carts/model/SmartCartChannel.ts. */
export const SMART_CART_CHANNEL_SETTINGS = {
  /** Window used to report sample rate (ms). */
  RATE_WINDOW_MS: 1000,
  /** Milliseconds in one second. */
  MILLISECONDS_PER_SECOND: 1000,
  /** Consecutive failed reads after which the link is considered lost. */
  MAX_FAILURES: 5,
} as const;

/** Settings for smart-carts/model/smartCartStream.ts. */
export const SMART_CART_STREAM_SETTINGS = {
  /** Microseconds in one millisecond. */
  MICROSECONDS_PER_MILLISECOND: 1000,
  /** Raw force code at zero force (encoder counts). */
  FORCE_RAW_ZERO: 32768,
  /** Raw code at the calibration reference force (encoder counts). */
  FORCE_REFERENCE_CODE: 1000,
  /** Reference force used by the upstream Smart Cart calibration (N). */
  FORCE_REFERENCE_NEWTONS: 100,
  /** Set sample period (protocol byte). */
  SET_SAMPLE_PERIOD: 0x01,
  /** Start sampling (protocol byte). */
  START_SAMPLING: 0x06,
  /** Stop sampling (protocol byte). */
  STOP_SAMPLING: 0x07,
  /** Streamed packets carry a five-bit sequence number; anything at or above is a reply or event. */
  STREAM_SEQUENCE_MODULUS: 0x20,
  /** Acknowledge every this many packets, or the cart stops sending. */
  STREAM_ACK_INTERVAL: 8,
} as const;

/** Settings for smart-carts/view/SmartCartPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SMART_CART_PANEL_SETTINGS = {
  ITEM_1_SPACING: 10, // px
  STATUS_FONT_SIZE: 11, // px
  DIAGNOSTIC_FONT_SIZE: 10, // px

  CHANGE_SIGN_CHECKBOX_MAX_WIDTH_OFFSET: 30, // px

  FONT_SIZE: 12,
  CONNECT_BUTTON_FONT_SIZE: 13,
  CONNECT_BUTTON_MAX_WIDTH: 100,
  SPACING: 5,
  TITLE_FONT_SIZE: 14,
  TITLE_MAX_WIDTH: 110,
} as const;

/** Settings for smart-carts/view/SmartCartsScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SMART_CARTS_SCREEN_VIEW_SETTINGS = {
  PANEL_GAP: 12, // px
  HINT_TOP_GAP: 6, // px
  RADIO_LABEL_MAX_WIDTH_OFFSET: 50, // px

  FONT_SIZE: 12,
  TITLE_FONT_SIZE: 12,
  HINT_FONT_SIZE: 11,
  EXPERIMENT_RADIO_SPACING: 5,
  EXPERIMENT_RADIO_RADIUS: 6,
  RUN_PANEL_SPACING: 6,
} as const;

/** Numerical settings; units are specified per value. */
export const ACQUISITION_UNITS = {
  /** Milliseconds in one second. */
  MILLISECONDS_PER_SECOND: 1000,
} as const;

/** Numerical settings; units are specified per value. */
export const COLLISION_PHYSICS_SETTINGS = {
  /** Extra wall-contact damping relative to cart contact (dimensionless). */
  BUMPER_DAMPING_FACTOR: 4,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const CART_COLLISIONS_QUERY_PARAMETERS_SETTINGS = {
  CART_COLLISIONS_QUERY_PARAMETERS_DEFAULT_VALUE: 20, // dimensionless
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  V_RED_DECIMALS: 2, // digits
  V_BLUE_DECIMALS: 2, // digits
  TOTAL_MOMENTUM_ROUNDED_DECIMALS: 3, // digits
  TOTAL_KINETIC_ENERGY_ROUNDED_DECIMALS: 3, // digits
} as const;

CartCollisionsNamespace.register("CartCollisionsConstants", {
  SCREEN_VIEW_MARGIN,
  TRACK_LENGTH,
  CART_LENGTH,
  ENCODER_RESOLUTION,
});
