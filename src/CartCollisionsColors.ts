/**
 * CartCollisionsColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import CartCollisionsColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import CartCollisionsColors from "../../CartCollisionsColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: CartCollisionsColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the CartCollisionsColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import CartCollisionsNamespace from "./CartCollisionsNamespace.js";

const CartCollisionsColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
  // ── Apparatus and graph ──────────────────────────────────────────────────────

  /** Red Smart Cart body and its graph trace. */
  redCartColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "redCart", {
    default: "#ef5350",
    projector: "#c62828",
  }),

  /** Blue Smart Cart body and its graph trace. */
  blueCartColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "blueCart", {
    default: "#42a5f5",
    projector: "#1565c0",
  }),

  /** Cart wheels, plunger rod, end stops. */
  hardwareColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "hardware", {
    default: "#263238",
    projector: "#263238",
  }),

  /** Aluminium track. */
  trackColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "track", {
    default: "#b0bec5",
    projector: "#90a4ae",
  }),

  /** Track ruler ticks and labels. */
  rulerColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "ruler", {
    default: "#37474f",
    projector: "#37474f",
  }),

  /** Mass bar on a cart. */
  massBarColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "massBar", {
    default: "#9e9e9e",
    projector: "#757575",
  }),

  /** Velcro pad. */
  velcroColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "velcro", {
    default: "#212121",
    projector: "#212121",
  }),

  /** Magnetic bumper. */
  magnetColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "magnet", {
    default: "#e0e0e0",
    projector: "#bdbdbd",
  }),

  /** Graph plotting area. */
  chartBackgroundColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "chartBackground", {
    default: "#0d1b2a",
    projector: "#ffffff",
  }),

  /** Graph grid lines. */
  chartGridColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "chartGrid", {
    default: "#2c3e50",
    projector: "#dddddd",
  }),

  /** Shaded fit interval on the graph. */
  fitIntervalColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "fitInterval", {
    default: "rgba(255,235,59,0.18)",
    projector: "rgba(255,193,7,0.25)",
  }),

  /** Edges of the fit interval and the fitted lines. */
  fitLineColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "fitLine", {
    default: "#ffeb3b",
    projector: "#ef6c00",
  }),

  /** A calculated table cell that matches the expected value. */
  correctColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "correct", {
    default: "#c8e6c9",
    projector: "#c8e6c9",
  }),

  /** A calculated table cell that does not match. */
  incorrectColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "incorrect", {
    default: "#ffcdd2",
    projector: "#ffcdd2",
  }),

  /** Error text on panels. */
  warningColorProperty: new ProfileColorProperty(CartCollisionsNamespace, "warning", {
    default: "#ffb74d",
    projector: "#e65100",
  }),
};

export default CartCollisionsColors;
