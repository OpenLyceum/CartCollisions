/**
 * cartCollisionsQueryParameters.ts
 *
 * Sim-specific startup query parameters — the single place where each one is
 * declared and documented. Each also seeds a Preferences → Simulation control.
 *
 * Usage: append e.g. `?sampleRate=250&rollingFriction=0` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import {
  DEFAULT_ROLLING_FRICTION,
  DEFAULT_SAMPLE_RATE,
  MAX_ROLLING_FRICTION,
  SAMPLE_RATES,
} from "../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../CartCollisionsNamespace.js";

const cartCollisionsQueryParameters = QueryStringMachine.getAll({
  /** Virtual Smart Cart sample rate, in Hz (50, 100 or 250). */
  sampleRate: {
    type: "number",
    defaultValue: DEFAULT_SAMPLE_RATE,
    validValues: [...SAMPLE_RATES],
    public: true,
  },

  /** Rolling-friction coefficient of the virtual track (0 = frictionless). */
  rollingFriction: {
    type: "number",
    defaultValue: DEFAULT_ROLLING_FRICTION,
    isValidValue: (value: number) => value >= 0 && value <= MAX_ROLLING_FRICTION,
    public: true,
  },

  /**
   * Whether the virtual blue cart, which faces the red one, reports positions with
   * the opposite sign until Change Sign is ticked — as a real Smart Cart does.
   */
  blueCartReversed: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },
});

CartCollisionsNamespace.register("cartCollisionsQueryParameters", cartCollisionsQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default cartCollisionsQueryParameters;
