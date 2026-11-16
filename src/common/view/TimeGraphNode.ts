import { TIME_GRAPH_NODE_SETTINGS } from "../../CartCollisionsConstants.js";
/**
 * TimeGraphNode.ts
 *
 * Position, velocity or force against time for both carts, with a shaded fit
 * interval the student can drag and resize. On the position graph the fitted
 * straight lines are drawn over the interval — their slopes are the velocities the
 * handout asks for; on the velocity and force graphs the interval's mean is drawn.
 *
 * Built directly on bamboo rather than copied from MotionSensor's
 * ConfigurableGraph: this graph has a fixed x axis (time), two series, and one
 * gesture (the interval), which is a small fraction of that component.
 *
 * Gestures: drag across the plot to mark a new interval; drag either edge to
 * resize it; Tab to an edge and use ←/→ (Shift for fine steps) from the keyboard.
 */

import { Multilink } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, LinePlot } from "scenerystack/bamboo";
import { Range } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { HBox, Node, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import { GraphQuantity, type GraphQuantityValue, type GraphState } from "../model/GraphState.js";
import type { Recording } from "../model/Recording.js";
import { createFitIntervalChrome } from "./fitIntervalGestures.js";
import { createTimeGraphAxes } from "./timeGraphAxes.js";
import { traceToDataSet, visibleYExtent } from "./timeGraphPlotData.js";

const LABEL_FONT = new PhetFont(TIME_GRAPH_NODE_SETTINGS.LABEL_FONT_SIZE);

/** Smallest y span shown per quantity, so a cart at rest is not magnified into noise. */
const MIN_Y_SPAN: Record<GraphQuantityValue, number> = TIME_GRAPH_NODE_SETTINGS.MIN_Y_SPAN;

export type TimeGraphNodeOptions = {
  readonly viewWidth: number;
  readonly viewHeight: number;
  readonly measuresForce: boolean;
  /** Called when the student finishes moving the fit interval. */
  readonly onIntervalChanged?: () => void;
};

export class TimeGraphNode extends Node {
  public readonly fitStartHandle: Node;
  public readonly fitEndHandle: Node;
  public readonly quantityRadioButtons: Node;
  public readonly zoomButtons: Node;

  private readonly disposeTimeGraphNode: () => void;

  public constructor(recording: Recording, graph: GraphState, options: TimeGraphNodeOptions) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();
    const { viewWidth, viewHeight } = options;

    const chartTransform = new ChartTransform({
      viewWidth,
      viewHeight,
      modelXRange: graph.timeRangeProperty.value,
      modelYRange: new Range(
        TIME_GRAPH_NODE_SETTINGS.CHART_TRANSFORM_RANGE_MIN,
        TIME_GRAPH_NODE_SETTINGS.CHART_TRANSFORM_RANGE_MAX,
      ),
    });

    const chartRectangle = new ChartRectangle(chartTransform, {
      fill: CartCollisionsColors.chartBackgroundColorProperty,
      stroke: CartCollisionsColors.panelBorderColorProperty,
      cursor: "crosshair",
    });

    const axes = createTimeGraphAxes(chartTransform, viewWidth, viewHeight);

    const redPlot = new LinePlot(chartTransform, [], {
      stroke: CartCollisionsColors.redCartColorProperty,
      lineWidth: TIME_GRAPH_NODE_SETTINGS.RED_PLOT_LINE_WIDTH,
    });
    const bluePlot = new LinePlot(chartTransform, [], {
      stroke: CartCollisionsColors.blueCartColorProperty,
      lineWidth: TIME_GRAPH_NODE_SETTINGS.BLUE_PLOT_LINE_WIDTH,
    });

    // plotLayer is filled after fit chrome is created — listeners close over it.
    const plotLayer = new Node();
    const fit = createFitIntervalChrome({
      viewWidth,
      viewHeight,
      chartTransform,
      graph,
      plotLayer,
      chartPickTarget: chartRectangle,
      fitStartAccessibleName: a11y.fitStartStringProperty,
      fitEndAccessibleName: a11y.fitEndStringProperty,
      fitHelpText: a11y.fitHelpStringProperty,
      onIntervalChanged: options.onIntervalChanged,
    });

    plotLayer.children = [
      chartRectangle,
      new Node({
        clipArea: Shape.rect(0, 0, viewWidth, viewHeight),
        children: [axes.xGrid, axes.yGrid, axes.zeroLine, fit.band, redPlot, bluePlot, fit.fitLines],
      }),
      fit.fitStartHandle,
      fit.fitEndHandle,
    ];

    const yAxisLabel = new Text("", {
      font: LABEL_FONT,
      fill: CartCollisionsColors.textColorProperty,
      rotation: -Math.PI / 2,
    });
    const xAxisLabel = new Text(labels.timeAxisStringProperty, {
      font: LABEL_FONT,
      fill: CartCollisionsColors.textColorProperty,
    });

    // ── Quantity selector and zoom ───────────────────────────────────────────
    const radioLabel = (string: typeof labels.positionStringProperty) =>
      new Text(string, {
        font: LABEL_FONT,
        fill: CartCollisionsColors.textColorProperty,
        maxWidth: TIME_GRAPH_NODE_SETTINGS.RADIO_LABEL_MAX_WIDTH,
      });
    const quantityItems = [
      {
        value: GraphQuantity.POSITION,
        createNode: () => radioLabel(labels.positionStringProperty),
        options: { accessibleName: labels.positionStringProperty },
      },
      {
        value: GraphQuantity.VELOCITY,
        createNode: () => radioLabel(labels.velocityStringProperty),
        options: { accessibleName: labels.velocityStringProperty },
      },
      ...(options.measuresForce
        ? [
            {
              value: GraphQuantity.FORCE,
              createNode: () => radioLabel(labels.forceStringProperty),
              options: { accessibleName: labels.forceStringProperty },
            },
          ]
        : []),
    ];
    const quantityRadioButtons = new AquaRadioButtonGroup<GraphQuantityValue>(graph.quantityProperty, quantityItems, {
      orientation: "horizontal",
      spacing: TIME_GRAPH_NODE_SETTINGS.QUANTITY_RADIO_BUTTONS_SPACING,
      radioButtonOptions: { radius: TIME_GRAPH_NODE_SETTINGS.QUANTITY_RADIO_BUTTONS_RADIUS },
      accessibleName: a11y.graphQuantityStringProperty,
    });

    const smallButton = (string: typeof labels.zoomToFitStringProperty, listener: () => void) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(string, {
          font: LABEL_FONT,
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: TIME_GRAPH_NODE_SETTINGS.SMALL_BUTTON_MAX_WIDTH,
        }),
        listener,
        accessibleName: string,
        xMargin: TIME_GRAPH_NODE_SETTINGS.SMALL_BUTTON_X_MARGIN,
        yMargin: TIME_GRAPH_NODE_SETTINGS.SMALL_BUTTON_Y_MARGIN,
      });
    const zoomButtons = new HBox({
      spacing: TIME_GRAPH_NODE_SETTINGS.ZOOM_BUTTONS_SPACING,
      children: [
        smallButton(labels.zoomToFitStringProperty, () => graph.zoomToFit()),
        smallButton(labels.showAllStringProperty, () => graph.zoomAll()),
      ],
    });

    super({
      children: [
        plotLayer,
        axes.yTicks,
        axes.yTickLabels,
        axes.xTicks,
        axes.xTickLabels,
        yAxisLabel,
        xAxisLabel,
        quantityRadioButtons,
        zoomButtons,
      ],
    });

    this.fitStartHandle = fit.fitStartHandle;
    this.fitEndHandle = fit.fitEndHandle;
    this.quantityRadioButtons = quantityRadioButtons;
    this.zoomButtons = zoomButtons;

    // ── Data → plots ─────────────────────────────────────────────────────────
    const updatePlots = () => {
      const quantity = graph.quantityProperty.value;
      redPlot.setDataSet(traceToDataSet(recording.red, quantity));
      bluePlot.setDataSet(traceToDataSet(recording.blue, quantity));
    };

    const refresh = () => {
      const timeRange = graph.timeRangeProperty.value;
      const quantity = graph.quantityProperty.value;
      axes.updateAxes(timeRange, visibleYExtent(recording, quantity, timeRange, MIN_Y_SPAN[quantity]));
      updatePlots();
      fit.updateFit();
    };
    recording.changedEmitter.addListener(refresh);
    const refreshMultilink = Multilink.multilink([graph.timeRangeProperty, graph.quantityProperty], refresh);
    const fitMultilink = Multilink.multilink(
      [graph.fitStartProperty, graph.fitEndProperty, graph.fitResultsProperty],
      fit.updateFit,
    );

    const axisLabelMultilink = Multilink.multilink(
      [
        graph.quantityProperty,
        labels.positionAxisStringProperty,
        labels.velocityAxisStringProperty,
        labels.forceAxisStringProperty,
      ],
      (quantity, position, velocity, force) => {
        yAxisLabel.string =
          quantity === GraphQuantity.POSITION ? position : quantity === GraphQuantity.VELOCITY ? velocity : force;
      },
    );

    // ── Layout (plot origin at 0,0) ──────────────────────────────────────────
    const layout = () => {
      yAxisLabel.right = TIME_GRAPH_NODE_SETTINGS.Y_AXIS_LABEL_RIGHT;
      yAxisLabel.centerY = viewHeight / 2;
      xAxisLabel.centerX = viewWidth / 2;
      xAxisLabel.top = viewHeight + TIME_GRAPH_NODE_SETTINGS.LAYOUT_TOP_OFFSET;
      quantityRadioButtons.left = 0;
      quantityRadioButtons.bottom = TIME_GRAPH_NODE_SETTINGS.QUANTITY_RADIO_BOTTOM;
      zoomButtons.right = viewWidth;
      zoomButtons.bottom = -4;
    };
    layout();
    yAxisLabel.boundsProperty.lazyLink(layout);
    xAxisLabel.boundsProperty.lazyLink(layout);

    this.disposeTimeGraphNode = () => {
      recording.changedEmitter.removeListener(refresh);
      refreshMultilink.dispose();
      fitMultilink.dispose();
      axisLabelMultilink.dispose();
      for (const listener of fit.listeners) {
        listener.dispose();
      }
      quantityRadioButtons.dispose();
    };
  }

  public override dispose(): void {
    this.disposeTimeGraphNode();
    super.dispose();
  }
}
