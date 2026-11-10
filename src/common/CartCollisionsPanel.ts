/**
 * CartCollisionsPanel.ts
 *
 * A pre-themed Panel that automatically uses CartCollisionsColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { CartCollisionsPanel } from "../../common/CartCollisionsPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new CartCollisionsPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new CartCollisionsPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new CartCollisionsPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { PANEL_CORNER_RADIUS } from "../CartCollisionsConstants.js";

export type CartCollisionsPanelOptions = PanelOptions;

export class CartCollisionsPanel extends Panel {
  public constructor(content: Node, providedOptions?: CartCollisionsPanelOptions) {
    const options = optionize<CartCollisionsPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: CartCollisionsColors.panelBackgroundColorProperty,
        stroke: CartCollisionsColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
