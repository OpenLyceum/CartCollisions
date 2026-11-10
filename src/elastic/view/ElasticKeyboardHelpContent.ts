/**
 * ElasticKeyboardHelpContent.ts
 *
 * Keyboard help for the Elastic screen: moving the carts and the fit interval,
 * sliders, and basic actions.
 */

import { CartCollisionsKeyboardHelpContent } from "../../common/view/CartCollisionsKeyboardHelpContent.js";

export class ElasticKeyboardHelpContent extends CartCollisionsKeyboardHelpContent {
  public constructor() {
    super({ includeCarts: true });
  }
}
