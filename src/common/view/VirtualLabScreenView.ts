/**
 * VirtualLabScreenView.ts
 *
 * The Explosions, Inelastic and Elastic screens: a track with two carts above the
 * shared graph, bench controls and the balance in the right column.
 */

import { Node } from "scenerystack/scenery";
import { SCREEN_VIEW_MARGIN, TRACK_LENGTH } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { CartCollisionsModel } from "../model/CartCollisionsModel.js";
import { BalancePanel } from "./BalancePanel.js";
import { CartNode } from "./CartNode.js";
import { ExperimentControlPanel } from "./ExperimentControlPanel.js";
import { LabScreenView, type LabScreenViewOptions } from "./LabScreenView.js";
import { TrackNode } from "./TrackNode.js";
import { TrackTransform } from "./TrackTransform.js";

/** y of the track's top surface. */
const TRACK_TOP = 100;

export class VirtualLabScreenView extends LabScreenView {
  public constructor(model: CartCollisionsModel, options: LabScreenViewOptions) {
    super(model, options);
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();

    const transform = new TrackTransform(
      SCREEN_VIEW_MARGIN + 14,
      this.leftAreaRight - SCREEN_VIEW_MARGIN - 28,
      TRACK_LENGTH,
    );
    const track = new TrackNode(transform, TRACK_TOP);

    const redCart = new CartNode({
      color: "red",
      bumper: model.bumper,
      transform,
      positionProperty: model.redPositionProperty,
      plungerReleasedProperty: model.plungerReleasedProperty,
      plungerSettingProperty: model.plungerSettingProperty,
      drag: (x) => model.dragCart("red", x),
      accessibleName: labels.redCartStringProperty,
      accessibleHelpText: a11y.redCartHelpStringProperty,
    });
    const blueCart = new CartNode({
      color: "blue",
      bumper: model.bumper,
      transform,
      positionProperty: model.bluePositionProperty,
      barCountProperty: model.blueBarCountProperty,
      drag: (x) => model.dragCart("blue", x),
      accessibleName: labels.blueCartStringProperty,
      accessibleHelpText: a11y.blueCartHelpStringProperty,
    });
    redCart.y = TRACK_TOP;
    blueCart.y = TRACK_TOP;

    const apparatus = new Node({ children: [track, redCart, blueCart] });
    this.addChild(apparatus);
    apparatus.moveToBack();

    const experimentPanel = new ExperimentControlPanel(model);
    const balancePanel = new BalancePanel(model);
    this.controlColumn.insertChild(0, experimentPanel);
    this.controlColumn.insertChild(1, balancePanel);

    this.setTraversalOrder([redCart, blueCart], [...experimentPanel.traversal, balancePanel.sendButton]);
  }
}
