import { CART_COLLISIONS_PREFERENCES_NODE_SETTINGS } from "../CartCollisionsConstants.js";
/**
 * CartCollisionsPreferencesNode.ts
 *
 * Preferences → Simulation: the virtual Smart Cart's sample rate, the track's
 * rolling friction, and whether the blue cart reports a reversed sign.
 */

import { Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { SAMPLE_RATES } from "../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../CartCollisionsNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { CartCollisionsPreferencesModel } from "./CartCollisionsPreferencesModel.js";

export class CartCollisionsPreferencesNode extends VBox {
  public constructor(preferencesModel: CartCollisionsPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface" text color.
    const fill = CartCollisionsColors.controlSurfaceTextColorProperty;
    const font = new PhetFont(CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.FONT_SIZE);

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.HEADER_FONT_SIZE, weight: "bold" }),
      fill,
    });

    const sampleRateRadio = new AquaRadioButtonGroup<number>(
      preferencesModel.sampleRateProperty,
      SAMPLE_RATES.map((rate) => ({
        value: rate,
        createNode: () => new Text(`${rate} Hz`, { font, fill }),
        options: { accessibleName: `${rate} Hz` },
      })),
      {
        orientation: "horizontal",
        spacing: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.SAMPLE_RATE_RADIO_SPACING,
        accessibleName: prefStrings.sampleRateStringProperty,
      },
    );

    const frictionControl = new NumberControl(
      prefStrings.rollingFrictionStringProperty,
      preferencesModel.rollingFrictionProperty,
      preferencesModel.rollingFrictionProperty.range,
      {
        delta: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.FRICTION_CONTROL_DELTA,
        titleNodeOptions: { font, fill },
        numberDisplayOptions: {
          decimalPlaces: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.FRICTION_CONTROL_DECIMAL_PLACES,
        },
        ...(tandem && { tandem: tandem.createTandem("rollingFrictionControl") }),
      },
    );

    const reversedCheckbox = new Checkbox(
      preferencesModel.blueCartReversedProperty,
      new Text(prefStrings.blueCartReversedStringProperty, { font, fill }),
      {
        checkboxColor: fill,
        checkboxColorBackground: CartCollisionsColors.controlSurfaceColorProperty,
        spacing: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.REVERSED_CHECKBOX_SPACING,
        accessibleName: prefStrings.blueCartReversedStringProperty,
        ...(tandem && { tandem: tandem.createTandem("blueCartReversedCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: CART_COLLISIONS_PREFERENCES_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        header,
        new Text(prefStrings.sampleRateStringProperty, { font, fill }),
        sampleRateRadio,
        frictionControl,
        reversedCheckbox,
      ],
    });
  }
}

CartCollisionsNamespace.register("CartCollisionsPreferencesNode", CartCollisionsPreferencesNode);
