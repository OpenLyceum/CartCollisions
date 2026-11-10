/**
 * BalancePanel.ts
 *
 * The lab balance: what each cart weighs as set up now (cart plus any mass bars),
 * to 0.1 g, and a button that copies both into the active table row.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { CONTROL_COLUMN_WIDTH } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import { CartCollisionsPanel } from "../CartCollisionsPanel.js";
import type { CartCollisionsModel } from "../model/CartCollisionsModel.js";

const FONT = new PhetFont(12);

export class BalancePanel extends CartCollisionsPanel {
  public readonly sendButton: RectangularPushButton;

  public constructor(model: CartCollisionsModel) {
    const labels = StringManager.getInstance().getLabels();

    const reading = (cart: TReadOnlyProperty<string>, mass: TReadOnlyProperty<number>) =>
      new DerivedProperty([cart, mass, labels.massPatternStringProperty], (cartName, m, pattern) =>
        StringUtils.fillIn(pattern, { cart: cartName, mass: toFixed(m, 4) }),
      );

    const sendButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.sendMassesStringProperty, {
        font: FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: CONTROL_COLUMN_WIDTH - 40,
      }),
      accessibleName: labels.sendMassesStringProperty,
      listener: () => {
        const row = model.notebook.rows[model.activeRowProperty.value];
        row.cells.massRed.value = Number(toFixed(model.massRedProperty.value, 4));
        row.cells.massBlue.value = Number(toFixed(model.massBlueProperty.value, 4));
      },
    });

    super(
      new VBox({
        align: "left",
        spacing: 4,
        children: [
          new Text(labels.balanceStringProperty, {
            font: new PhetFont({ size: 12, weight: "bold" }),
            fill: CartCollisionsColors.textColorProperty,
          }),
          new Text(reading(labels.redCartStringProperty, model.massRedProperty), {
            font: FONT,
            fill: CartCollisionsColors.redCartColorProperty,
          }),
          new Text(reading(labels.blueCartStringProperty, model.massBlueProperty), {
            font: FONT,
            fill: CartCollisionsColors.blueCartColorProperty,
          }),
          sendButton,
        ],
      }),
      { minWidth: CONTROL_COLUMN_WIDTH, maxWidth: CONTROL_COLUMN_WIDTH },
    );
    this.sendButton = sendButton;
  }
}
