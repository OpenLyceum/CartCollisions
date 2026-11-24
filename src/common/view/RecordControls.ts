import { RECORD_CONTROLS_SETTINGS } from "../../CartCollisionsConstants.js";
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

const FONT = new PhetFont({ size: RECORD_CONTROLS_SETTINGS.FONT_SIZE, weight: "bold" });

export class RecordControls extends HBox {
  public readonly recordButton: RectangularPushButton;
  public readonly clearButton: RectangularPushButton;
  private readonly disposeRecordControls: () => void;

  public constructor(model: TLabModel) {
    const labels = StringManager.getInstance().getLabels();

    const recordLabelProperty = new DerivedProperty(
      [model.isRecordingProperty, labels.recordStringProperty, labels.stopStringProperty],
      (recording, record, stop) => (recording ? stop : record),
    );
    const dot = new Circle(RECORD_CONTROLS_SETTINGS.DOT_RADIUS, { fill: CartCollisionsColors.redCartColorProperty });
    const square = new Rectangle(
      RECORD_CONTROLS_SETTINGS.SQUARE_X,
      RECORD_CONTROLS_SETTINGS.SQUARE_Y,
      RECORD_CONTROLS_SETTINGS.SQUARE_WIDTH,
      RECORD_CONTROLS_SETTINGS.SQUARE_HEIGHT,
      { fill: LIGHT_SURFACE_TEXT_FILL },
    );
    const iconLink = (recording: boolean) => {
      dot.visible = !recording;
      square.visible = recording;
    };
    model.isRecordingProperty.link(iconLink);

    const recordButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new HBox({
        spacing: RECORD_CONTROLS_SETTINGS.RECORD_BUTTON_SPACING,
        children: [
          dot,
          square,
          new Text(recordLabelProperty, {
            font: FONT,
            fill: LIGHT_SURFACE_TEXT_FILL,
            maxWidth: RECORD_CONTROLS_SETTINGS.RECORD_BUTTON_MAX_WIDTH,
          }),
        ],
        excludeInvisibleChildrenFromBounds: true,
      }),
      enabledProperty: model.canRecordProperty,
      accessibleName: recordLabelProperty,
      listener: () => (model.isRecordingProperty.value ? model.stop() : model.record()),
      minWidth: RECORD_CONTROLS_SETTINGS.RECORD_BUTTON_MIN_WIDTH,
    });

    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.clearStringProperty, {
        font: FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: RECORD_CONTROLS_SETTINGS.CLEAR_BUTTON_MAX_WIDTH,
      }),
      accessibleName: labels.clearStringProperty,
      listener: () => model.clear(),
    });

    super({ spacing: RECORD_CONTROLS_SETTINGS.SPACING, children: [recordButton, clearButton] });
    this.recordButton = recordButton;
    this.clearButton = clearButton;

    this.disposeRecordControls = () => {
      model.isRecordingProperty.unlink(iconLink);
      recordLabelProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposeRecordControls();
    super.dispose();
  }
}
