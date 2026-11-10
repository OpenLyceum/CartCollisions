/**
 * ExplosionsKeyboardHelpContent.ts
 *
 * Keyboard help for the Explosions screen: moving the carts and the fit interval,
 * sliders, and basic actions.
 */

import { CartCollisionsKeyboardHelpContent } from "../../common/view/CartCollisionsKeyboardHelpContent.js";

export class ExplosionsKeyboardHelpContent extends CartCollisionsKeyboardHelpContent {
  public constructor() {
    super({ includeCarts: true });
  }
}
