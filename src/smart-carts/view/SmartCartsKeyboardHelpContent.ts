/**
 * SmartCartsKeyboardHelpContent.ts
 *
 * Keyboard help for the Smart Carts screen: there are no virtual carts to move,
 * so only the fit interval, sliders and basic actions.
 */

import { CartCollisionsKeyboardHelpContent } from "../../common/view/CartCollisionsKeyboardHelpContent.js";

export class SmartCartsKeyboardHelpContent extends CartCollisionsKeyboardHelpContent {
  public constructor() {
    super({ includeCarts: false });
  }
}
