/**
 * SmartCartsScreenView.ts
 *
 * The Smart Carts screen: two connection panels where the virtual screens have
 * their track, the shared graph and fit panel below, and in the right column the
 * choice of which run this is — so the fits go to the right table row.
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { CONTROL_COLUMN_WIDTH, SCREEN_VIEW_MARGIN } from "../../CartCollisionsConstants.js";
import { CartCollisionsPanel } from "../../common/CartCollisionsPanel.js";
import { Experiment, type ExperimentValue } from "../../common/model/LabModel.js";
import { createMassModeRadioButtons } from "../../common/view/ExperimentControlPanel.js";
import { LabScreenView } from "../../common/view/LabScreenView.js";
import { StringManager } from "../../i18n/StringManager.js";
import { BluetoothStatus, getBluetoothStatus } from "../model/bluetoothSupport.js";
import type { SmartCartsModel } from "../model/SmartCartsModel.js";
import { SmartCartPanel } from "./SmartCartPanel.js";
import { SmartCartsScreenSummaryContent } from "./SmartCartsScreenSummaryContent.js";

const FONT = new PhetFont(12);
const TITLE_FONT = new PhetFont({ size: 12, weight: "bold" });

export class SmartCartsScreenView extends LabScreenView {
  public constructor(model: SmartCartsModel, options: ScreenViewOptions) {
    super(model, { ...options, screenSummaryContent: new SmartCartsScreenSummaryContent(model) });
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();

    const status = getBluetoothStatus();
    const bluetoothAvailable = status === BluetoothStatus.AVAILABLE;
    const panelWidth = (this.leftAreaRight - 2 * SCREEN_VIEW_MARGIN - 12) / 2;

    const redPanel = new SmartCartPanel(model.red, {
      title: labels.redCartStringProperty,
      titleFill: CartCollisionsColors.redCartColorProperty,
      connectAccessibleName: a11y.connectRedStringProperty,
      changeSignAccessibleName: a11y.redChangeSignStringProperty,
      bluetoothAvailable,
      width: panelWidth,
    });
    const bluePanel = new SmartCartPanel(model.blue, {
      title: labels.blueCartStringProperty,
      titleFill: CartCollisionsColors.blueCartColorProperty,
      connectAccessibleName: a11y.connectBlueStringProperty,
      changeSignAccessibleName: a11y.blueChangeSignStringProperty,
      bluetoothAvailable,
      width: panelWidth,
    });
    redPanel.left = SCREEN_VIEW_MARGIN;
    redPanel.top = SCREEN_VIEW_MARGIN;
    bluePanel.left = redPanel.right + 12;
    bluePanel.top = SCREEN_VIEW_MARGIN;

    const hint = new Text(
      status === BluetoothStatus.INSECURE_CONTEXT
        ? labels.bluetoothInsecureStringProperty
        : bluetoothAvailable || status === BluetoothStatus.NO_BROWSER
          ? labels.smartCartHintStringProperty
          : labels.bluetoothUnsupportedStringProperty,
      {
        font: new PhetFont(11),
        fill: bluetoothAvailable ? CartCollisionsColors.textColorProperty : CartCollisionsColors.warningColorProperty,
        maxWidth: this.leftAreaRight - 2 * SCREEN_VIEW_MARGIN,
        left: SCREEN_VIEW_MARGIN,
      },
    );
    hint.top = Math.max(redPanel.bottom, bluePanel.bottom) + 6;

    this.addChild(redPanel);
    this.addChild(bluePanel);
    this.addChild(hint);

    // Which run this is.
    const radioLabel = (string: typeof labels.explosionStringProperty) =>
      new Text(string, {
        font: FONT,
        fill: CartCollisionsColors.textColorProperty,
        maxWidth: CONTROL_COLUMN_WIDTH - 50,
      });
    const experimentRadio = new AquaRadioButtonGroup<ExperimentValue>(
      model.experimentProperty,
      [
        {
          value: Experiment.EXPLOSION,
          createNode: () => radioLabel(labels.explosionStringProperty),
          options: { accessibleName: labels.explosionStringProperty },
        },
        {
          value: Experiment.INELASTIC,
          createNode: () => radioLabel(labels.inelasticStringProperty),
          options: { accessibleName: labels.inelasticStringProperty },
        },
        {
          value: Experiment.ELASTIC,
          createNode: () => radioLabel(labels.elasticStringProperty),
          options: { accessibleName: labels.elasticStringProperty },
        },
      ],
      { spacing: 5, radioButtonOptions: { radius: 6 }, accessibleName: labels.experimentStringProperty },
    );
    const massRadio = createMassModeRadioButtons(model.massModeProperty);
    const runPanel = new CartCollisionsPanel(
      new VBox({
        align: "left",
        spacing: 6,
        children: [
          new Text(labels.experimentStringProperty, { font: TITLE_FONT, fill: CartCollisionsColors.textColorProperty }),
          experimentRadio,
          new Text(labels.massSetupStringProperty, { font: TITLE_FONT, fill: CartCollisionsColors.textColorProperty }),
          massRadio,
        ],
      }),
      { minWidth: CONTROL_COLUMN_WIDTH, maxWidth: CONTROL_COLUMN_WIDTH },
    );
    this.controlColumn.insertChild(0, runPanel);

    this.setTraversalOrder(
      [redPanel.connectButton, redPanel.changeSignCheckbox, bluePanel.connectButton, bluePanel.changeSignCheckbox],
      [experimentRadio, massRadio],
    );
  }
}
