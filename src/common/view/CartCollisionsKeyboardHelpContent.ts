/**
 * CartCollisionsKeyboardHelpContent.ts
 *
 * Keyboard-help dialog content shared by every screen. Carts and the fit-interval
 * edges are moved with a KeyboardDragListener restricted to left/right, so these
 * rows document exactly the keys that listener binds (pattern from TheRamp).
 */

import { HotkeyData } from "scenerystack/scenery";
import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export type CartCollisionsKeyboardHelpContentOptions = {
  /** False on the Smart Carts screen, which has no carts to move. */
  readonly includeCarts: boolean;
};

export class CartCollisionsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor(options: CartCollisionsKeyboardHelpContentOptions) {
    const strings = StringManager.getInstance().getA11yStrings().keyboardHelp;

    const moveRow = (label: typeof strings.moveCartStringProperty) =>
      KeyboardHelpSectionRow.fromHotkeyData(
        new HotkeyData({
          keys: ["arrowLeft", "arrowRight", "a", "d"],
          repoName: "cart-collisions",
          keyboardHelpDialogLabelStringProperty: label,
        }),
      );
    const fineRow = (label: typeof strings.moveCartSlowlyStringProperty) =>
      KeyboardHelpSectionRow.fromHotkeyData(
        new HotkeyData({
          keys: ["shift+arrowLeft", "shift+arrowRight", "shift+a", "shift+d"],
          repoName: "cart-collisions",
          keyboardHelpDialogLabelStringProperty: label,
        }),
      );

    const fitSection = new KeyboardHelpSection(strings.fitTitleStringProperty, [
      moveRow(strings.moveFitEdgeStringProperty),
      fineRow(strings.moveCartSlowlyStringProperty),
    ]);
    const leftColumn = options.includeCarts
      ? [
          new KeyboardHelpSection(strings.cartsTitleStringProperty, [
            moveRow(strings.moveCartStringProperty),
            fineRow(strings.moveCartSlowlyStringProperty),
          ]),
          fitSection,
        ]
      : [fitSection];

    super(leftColumn, [new SliderControlsKeyboardHelpSection(), new BasicActionsKeyboardHelpSection()]);
  }
}
