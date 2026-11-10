/**
 * CartCollisionsPreferencesModel.ts
 *
 * Preferences → Simulation. Each Property takes its initial value from the
 * matching query parameter in cartCollisionsQueryParameters. One instance is
 * built in main.ts and shared by every screen.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { Tandem } from "scenerystack/tandem";
import { MAX_ROLLING_FRICTION } from "../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../CartCollisionsNamespace.js";
import cartCollisionsQueryParameters from "./cartCollisionsQueryParameters.js";

export class CartCollisionsPreferencesModel {
  /** Virtual Smart Cart sample rate, in Hz. */
  public readonly sampleRateProperty: NumberProperty;

  /** Rolling-friction coefficient of the virtual track. */
  public readonly rollingFrictionProperty: NumberProperty;

  /** Whether the virtual blue cart reports a reversed sign until Change Sign is ticked. */
  public readonly blueCartReversedProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.sampleRateProperty = new NumberProperty(cartCollisionsQueryParameters.sampleRate, {
      units: "Hz",
      ...(tandem && { tandem: tandem.createTandem("sampleRateProperty") }),
    });
    this.rollingFrictionProperty = new NumberProperty(cartCollisionsQueryParameters.rollingFriction, {
      range: new Range(0, MAX_ROLLING_FRICTION),
      ...(tandem && { tandem: tandem.createTandem("rollingFrictionProperty") }),
    });
    this.blueCartReversedProperty = new BooleanProperty(
      cartCollisionsQueryParameters.blueCartReversed,
      tandem ? { tandem: tandem.createTandem("blueCartReversedProperty") } : undefined,
    );
  }

  public reset(): void {
    this.sampleRateProperty.reset();
    this.rollingFrictionProperty.reset();
    this.blueCartReversedProperty.reset();
  }
}

CartCollisionsNamespace.register("CartCollisionsPreferencesModel", CartCollisionsPreferencesModel);
