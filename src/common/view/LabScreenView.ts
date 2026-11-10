/**
 * LabScreenView.ts
 *
 * What every screen shares: the time graph, the fit panel, the record controls,
 * the Lab Tables button and dialog, and Reset All. The virtual screens add the
 * track and carts above the graph; the Smart Carts screen adds connection panels
 * in the same place. Neither forks the graph or the tables, so a student who
 * learned one screen recognises the others (MotionSensor's "one view" rule).
 *
 * Layout (1024 × 618 layout bounds):
 *   top band (y < PLAY_AREA_BOTTOM)  apparatus, owned by the subclass
 *   left, below                      graph, then fit panel
 *   right column                     subclass controls, record, Lab Tables, Reset All
 */

import { type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { CONTROL_COLUMN_WIDTH, SCREEN_VIEW_MARGIN } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../CartCollisionsButtonOptions.js";
import type { TLabModel } from "../model/LabModel.js";
import { FitPanel } from "./FitPanel.js";
import { LabTablesDialog } from "./LabTablesDialog.js";
import { RecordControls } from "./RecordControls.js";
import { TimeGraphNode } from "./TimeGraphNode.js";

/** Bottom of the apparatus band, where the graph's controls begin. */
export const PLAY_AREA_BOTTOM = 150;

/** Left edge of the plotting area (room for the y axis labels). */
const GRAPH_LEFT = 78;
const GRAPH_TOP = PLAY_AREA_BOTTOM + 32;
const GRAPH_WIDTH = 590;
const GRAPH_HEIGHT = 235;

export type LabScreenViewOptions = ScreenViewOptions;

export class LabScreenView extends ScreenView {
  protected readonly graphNode: TimeGraphNode;
  protected readonly fitPanel: FitPanel;
  protected readonly recordControls: RecordControls;
  protected readonly labTablesButton: Node;
  protected readonly resetAllButton: Node;

  /** Right-hand column; subclasses put their controls above the record controls. */
  protected readonly controlColumn: VBox;

  /** Right edge of the left (graph) side of the screen. */
  protected readonly leftAreaRight = GRAPH_LEFT + GRAPH_WIDTH;

  public constructor(labModel: TLabModel & { reset(): void }, options: LabScreenViewOptions) {
    super(options);
    const labels = StringManager.getInstance().getLabels();

    this.fitPanel = new FitPanel(labModel, GRAPH_WIDTH + GRAPH_LEFT - SCREEN_VIEW_MARGIN);
    this.graphNode = new TimeGraphNode(labModel.recording, labModel.graph, {
      viewWidth: GRAPH_WIDTH,
      viewHeight: GRAPH_HEIGHT,
      measuresForce: labModel.measuresForce,
      onIntervalChanged: () => this.graphNode.addAccessibleContextResponse(this.fitPanel.describeFits(), "queue"),
    });
    this.graphNode.x = GRAPH_LEFT;
    this.graphNode.y = GRAPH_TOP;
    this.fitPanel.left = SCREEN_VIEW_MARGIN;
    this.fitPanel.top = GRAPH_TOP + GRAPH_HEIGHT + 40;

    this.recordControls = new RecordControls(labModel);

    const labTablesDialog = new LabTablesDialog(labModel.notebook);
    this.labTablesButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(labels.labTablesStringProperty, {
        font: new PhetFont({ size: 14, weight: "bold" }),
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: CONTROL_COLUMN_WIDTH - 30,
      }),
      accessibleName: labels.labTablesStringProperty,
      listener: () => labTablesDialog.show(),
      minWidth: CONTROL_COLUMN_WIDTH - 60,
    });

    this.controlColumn = new VBox({
      align: "center",
      spacing: 10,
      children: [this.recordControls, this.labTablesButton],
    });
    this.controlColumn.boundsProperty.link(() => {
      this.controlColumn.top = SCREEN_VIEW_MARGIN;
      this.controlColumn.centerX = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN - CONTROL_COLUMN_WIDTH / 2;
    });

    this.resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        this.interruptSubtreeInput();
        labModel.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    // Recording text, beside the graph's x axis label.
    const recordingText = new Text(labels.recordingStringProperty, {
      font: new PhetFont({ size: 12, weight: "bold" }),
      fill: CartCollisionsColors.redCartColorProperty,
      right: GRAPH_LEFT + GRAPH_WIDTH,
      top: GRAPH_TOP + GRAPH_HEIGHT + 18,
    });
    labModel.isRecordingProperty.link((recording) => {
      recordingText.visible = recording;
    });

    this.addChild(this.graphNode);
    this.addChild(recordingText);
    this.addChild(this.fitPanel);
    this.addChild(this.controlColumn);
    this.addChild(this.resetAllButton);
  }

  /**
   * Keyboard / reading order. Play area: the subclass's apparatus, then the graph
   * and fit. Control area: the subclass's controls, recording, tables, Reset All last.
   */
  protected setTraversalOrder(playArea: Node[], controls: Node[]): void {
    this.pdomPlayAreaNode.pdomOrder = [
      ...playArea,
      this.graphNode.quantityRadioButtons,
      this.graphNode.fitStartHandle,
      this.graphNode.fitEndHandle,
      this.graphNode.zoomButtons,
      ...this.fitPanel.sendButtons,
    ];
    this.pdomControlAreaNode.pdomOrder = [...controls, this.recordControls, this.labTablesButton, this.resetAllButton];
  }
}
