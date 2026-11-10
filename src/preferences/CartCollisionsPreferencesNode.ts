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
    const font = new PhetFont(14);

    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill,
    });

    const sampleRateRadio = new AquaRadioButtonGroup<number>(
      preferencesModel.sampleRateProperty,
      SAMPLE_RATES.map((rate) => ({
        value: rate,
        createNode: () => new Text(`${rate} Hz`, { font, fill }),
        options: { accessibleName: `${rate} Hz` },
      })),
      { orientation: "horizontal", spacing: 16, accessibleName: prefStrings.sampleRateStringProperty },
    );

    const frictionControl = new NumberControl(
      prefStrings.rollingFrictionStringProperty,
      preferencesModel.rollingFrictionProperty,
      preferencesModel.rollingFrictionProperty.range,
      {
        delta: 0.001,
        titleNodeOptions: { font, fill },
        numberDisplayOptions: { decimalPlaces: 3 },
        ...(tandem && { tandem: tandem.createTandem("rollingFrictionControl") }),
      },
    );

    const reversedCheckbox = new Checkbox(
      preferencesModel.blueCartReversedProperty,
      new Text(prefStrings.blueCartReversedStringProperty, { font, fill }),
      {
        checkboxColor: fill,
        checkboxColorBackground: CartCollisionsColors.controlSurfaceColorProperty,
        spacing: 8,
        accessibleName: prefStrings.blueCartReversedStringProperty,
        ...(tandem && { tandem: tandem.createTandem("blueCartReversedCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: 12,
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
