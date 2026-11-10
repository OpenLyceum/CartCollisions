/**
 * InelasticKeyboardHelpContent.ts
 *
 * Keyboard help for the Inelastic screen: moving the carts and the fit interval,
 * sliders, and basic actions.
 */

import { CartCollisionsKeyboardHelpContent } from "../../common/view/CartCollisionsKeyboardHelpContent.js";

export class InelasticKeyboardHelpContent extends CartCollisionsKeyboardHelpContent {
  public constructor() {
    super({ includeCarts: true });
  }
}
