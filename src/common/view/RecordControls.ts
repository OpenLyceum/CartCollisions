/**
 * RecordControls.ts
 *
 * Record / Stop and Clear — Capstone's record button in miniature. Recording
 * always starts a fresh run.
 */

import { DerivedProperty } from "scenerystack/axon";
import { Circle, HBox, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import type { TLabModel } from "../model/LabModel.js";

const FONT = new PhetFont({ size: 13, weight: "bold" });

export class RecordControls extends HBox {
  public readonly recordButton: RectangularPushButton;
  public readonly clearButton: RectangularPushButton;
  private readonly disposeRecordControls: () => void;

  public constructor(model: TLabModel) {
    const labels = StringManager.getInstance().getLabels();

    const recordLabel = new DerivedProperty(
      [model.isRecordingProperty, labels.recordStringProperty, labels.stopStringProperty],
      (recording, record, stop) => (recording ? stop : record),
    );
    const dot = new Circle(6, { fill: CartCollisionsColors.redCartColorProperty });
    const square = new Rectangle(-5, -5, 10, 10, { fill: LIGHT_SURFACE_TEXT_FILL });
    const iconLink = (recording: boolean) => {
      dot.visible = !recording;
      square.visible = recording;
    };
    model.isRecordingProperty.link(iconLink);

    const recordButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new HBox({
        spacing: 6,
        children: [dot, square, new Text(recordLabel, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 80 })],
        excludeInvisibleChildrenFromBounds: true,
      }),
      enabledProperty: model.canRecordProperty,
      accessibleName: recordLabel,
      listener: () => (model.isRecordingProperty.value ? model.stop() : model.record()),
      minWidth: 100,
    });

    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.clearStringProperty, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 70 }),
      accessibleName: labels.clearStringProperty,
      listener: () => model.clear(),
    });

    super({ spacing: 8, children: [recordButton, clearButton] });
    this.recordButton = recordButton;
    this.clearButton = clearButton;

    this.disposeRecordControls = () => {
      model.isRecordingProperty.unlink(iconLink);
      recordLabel.dispose();
    };
  }

  public override dispose(): void {
    this.disposeRecordControls();
    super.dispose();
  }
}
