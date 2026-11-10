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
import { ChartRectangle, ChartTransform, GridLineSet, LinePlot, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { clamp, Matrix3, Range, toFixed, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { DragListener, HBox, Line, Node, Path, Rectangle, RichDragListener, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { MAX_RECORDING_TIME } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import { GraphQuantity, type GraphQuantityValue, type GraphState, valuesFor } from "../model/GraphState.js";
import type { CartTrace, Recording } from "../model/Recording.js";
import { decimalsFor, niceStep } from "./formatting.js";

const LABEL_FONT = new PhetFont(11);
const TICK_FONT = new PhetFont(10);

/** Smallest y span shown per quantity, so a cart at rest is not magnified into noise. */
const MIN_Y_SPAN: Record<GraphQuantityValue, number> = {
  position: 0.1,
  velocity: 0.2,
  force: 2,
};

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
      modelYRange: new Range(-0.1, 0.1),
    });

    const chartRectangle = new ChartRectangle(chartTransform, {
      fill: CartCollisionsColors.chartBackgroundColorProperty,
      stroke: CartCollisionsColors.panelBorderColorProperty,
      cursor: "crosshair",
    });

    const gridOptions = { stroke: CartCollisionsColors.chartGridColorProperty, lineWidth: 0.5 };
    const xGrid = new GridLineSet(chartTransform, Orientation.HORIZONTAL, 1, gridOptions);
    const yGrid = new GridLineSet(chartTransform, Orientation.VERTICAL, 0.05, gridOptions);
    const zeroLine = new Line(0, 0, viewWidth, 0, { stroke: CartCollisionsColors.textColorProperty, lineWidth: 0.5 });

    let xDecimals = 0;
    let yDecimals = 2;
    const tickLabel = (decimals: () => number) => (value: number) =>
      new Text(toFixed(value, decimals()), { font: TICK_FONT, fill: CartCollisionsColors.textColorProperty });
    const xTicks = new TickMarkSet(chartTransform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      stroke: CartCollisionsColors.textColorProperty,
    });
    const xTickLabels = new TickLabelSet(chartTransform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      createLabel: tickLabel(() => xDecimals),
    });
    const yTicks = new TickMarkSet(chartTransform, Orientation.VERTICAL, 0.05, {
      edge: "min",
      stroke: CartCollisionsColors.textColorProperty,
    });
    const yTickLabels = new TickLabelSet(chartTransform, Orientation.VERTICAL, 0.05, {
      edge: "min",
      createLabel: tickLabel(() => yDecimals),
    });

    const redPlot = new LinePlot(chartTransform, [], {
      stroke: CartCollisionsColors.redCartColorProperty,
      lineWidth: 2,
    });
    const bluePlot = new LinePlot(chartTransform, [], {
      stroke: CartCollisionsColors.blueCartColorProperty,
      lineWidth: 2,
    });

    // ── Fit interval ─────────────────────────────────────────────────────────
    const band = new Rectangle(0, 0, 1, viewHeight, {
      fill: CartCollisionsColors.fitIntervalColorProperty,
      pickable: false,
    });
    const fitLines = new Path(null, {
      stroke: CartCollisionsColors.fitLineColorProperty,
      lineWidth: 2,
      lineDash: [6, 3],
      pickable: false,
    });

    const createHandle = (accessibleName: typeof a11y.fitStartStringProperty) => {
      const handle = new Node({
        cursor: "ew-resize",
        tagName: "div",
        focusable: true,
        accessibleName,
        accessibleHelpText: a11y.fitHelpStringProperty,
        children: [
          // Wide transparent strip so the edge is easy to grab.
          new Rectangle(-6, 0, 12, viewHeight, { fill: "transparent" }),
          new Line(0, 0, 0, viewHeight, { stroke: CartCollisionsColors.fitLineColorProperty, lineWidth: 2 }),
          new Path(Shape.regularPolygon(3, 6).transformed(Matrix3.rotation2(Math.PI / 2)), {
            fill: CartCollisionsColors.fitLineColorProperty,
            y: 4,
          }),
        ],
      });
      return handle;
    };
    const fitStartHandle = createHandle(a11y.fitStartStringProperty);
    const fitEndHandle = createHandle(a11y.fitEndStringProperty);

    const timeFromViewX = (x: number) =>
      clamp(chartTransform.viewToModelX(clamp(x, 0, viewWidth)), 0, MAX_RECORDING_TIME);

    const handleListener = (handle: Node, property: typeof graph.fitStartProperty) =>
      new RichDragListener({
        dragListenerOptions: {
          drag: (event) => {
            property.value = timeFromViewX(plotLayer.globalToLocalPoint(event.pointer.point).x);
          },
          end: () => options.onIntervalChanged?.(),
        },
        keyboardDragListenerOptions: {
          keyboardDragDirection: "leftRight",
          dragDelta: 6,
          shiftDragDelta: 1,
          drag: (_event, listener) => {
            property.value = timeFromViewX(handle.x + listener.modelDelta.x);
          },
          end: () => options.onIntervalChanged?.(),
        },
      });
    const startListener = handleListener(fitStartHandle, graph.fitStartProperty);
    const endListener = handleListener(fitEndHandle, graph.fitEndProperty);
    fitStartHandle.addInputListener(startListener);
    fitEndHandle.addInputListener(endListener);

    // Drag across the plot to mark a fresh interval.
    const sweepListener = new DragListener({
      start: (event) => {
        const t = timeFromViewX(plotLayer.globalToLocalPoint(event.pointer.point).x);
        graph.fitStartProperty.value = t;
        graph.fitEndProperty.value = t;
      },
      drag: (event) => {
        graph.fitEndProperty.value = timeFromViewX(plotLayer.globalToLocalPoint(event.pointer.point).x);
      },
      end: () => options.onIntervalChanged?.(),
    });
    chartRectangle.addInputListener(sweepListener);

    const plotLayer = new Node({
      children: [
        chartRectangle,
        new Node({
          clipArea: Shape.rect(0, 0, viewWidth, viewHeight),
          children: [xGrid, yGrid, zeroLine, band, redPlot, bluePlot, fitLines],
        }),
        fitStartHandle,
        fitEndHandle,
      ],
    });

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
      new Text(string, { font: LABEL_FONT, fill: CartCollisionsColors.textColorProperty, maxWidth: 90 });
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
      spacing: 14,
      radioButtonOptions: { radius: 6 },
      accessibleName: a11y.graphQuantityStringProperty,
    });

    const smallButton = (string: typeof labels.zoomToFitStringProperty, listener: () => void) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(string, { font: LABEL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 110 }),
        listener,
        accessibleName: string,
        xMargin: 6,
        yMargin: 3,
      });
    const zoomButtons = new HBox({
      spacing: 6,
      children: [
        smallButton(labels.zoomToFitStringProperty, () => graph.zoomToFit()),
        smallButton(labels.showAllStringProperty, () => graph.zoomAll()),
      ],
    });

    super({
      children: [
        plotLayer,
        yTicks,
        yTickLabels,
        xTicks,
        xTickLabels,
        yAxisLabel,
        xAxisLabel,
        quantityRadioButtons,
        zoomButtons,
      ],
    });

    this.fitStartHandle = fitStartHandle;
    this.fitEndHandle = fitEndHandle;
    this.quantityRadioButtons = quantityRadioButtons;
    this.zoomButtons = zoomButtons;

    // ── Data → plots ─────────────────────────────────────────────────────────
    const toDataSet = (trace: CartTrace, quantity: GraphQuantityValue): (Vector2 | null)[] => {
      const values = valuesFor(trace, quantity);
      const points: (Vector2 | null)[] = [];
      for (let i = 0; i < trace.length; i++) {
        const value = values[i] as number;
        points.push(Number.isFinite(value) ? new Vector2(trace.times[i] as number, value) : null);
      }
      return points;
    };

    const visibleExtent = (quantity: GraphQuantityValue, timeRange: Range): Range => {
      let min = 0;
      let max = 0;
      for (const trace of [recording.red, recording.blue]) {
        const values = valuesFor(trace, quantity);
        for (let i = 0; i < trace.length; i++) {
          const t = trace.times[i] as number;
          const value = values[i] as number;
          if (t >= timeRange.min && t <= timeRange.max && Number.isFinite(value)) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
      }
      const span = Math.max(max - min, MIN_Y_SPAN[quantity]);
      const centre = (max + min) / 2;
      return new Range(centre - span * 0.55, centre + span * 0.55);
    };

    const updateAxes = () => {
      const timeRange = graph.timeRangeProperty.value;
      const quantity = graph.quantityProperty.value;
      chartTransform.setModelXRange(timeRange);
      const yRange = visibleExtent(quantity, timeRange);
      chartTransform.setModelYRange(yRange);

      const xStep = niceStep(timeRange.getLength(), 6);
      const yStep = niceStep(yRange.getLength(), 5);
      xDecimals = decimalsFor(xStep);
      yDecimals = decimalsFor(yStep);
      for (const set of [xGrid, xTicks, xTickLabels]) {
        set.setSpacing(xStep);
      }
      for (const set of [yGrid, yTicks, yTickLabels]) {
        set.setSpacing(yStep);
      }
      const zeroY = chartTransform.modelToViewY(0);
      zeroLine.visible = zeroY >= 0 && zeroY <= viewHeight;
      zeroLine.y = zeroY;
    };

    const updatePlots = () => {
      const quantity = graph.quantityProperty.value;
      redPlot.setDataSet(toDataSet(recording.red, quantity));
      bluePlot.setDataSet(toDataSet(recording.blue, quantity));
    };

    const updateFit = () => {
      const t0 = Math.min(graph.fitStartProperty.value, graph.fitEndProperty.value);
      const t1 = Math.max(graph.fitStartProperty.value, graph.fitEndProperty.value);
      const x0 = chartTransform.modelToViewX(t0);
      const x1 = chartTransform.modelToViewX(t1);
      band.setRect(x0, 0, Math.max(x1 - x0, 1), viewHeight);
      fitStartHandle.x = chartTransform.modelToViewX(graph.fitStartProperty.value);
      fitEndHandle.x = chartTransform.modelToViewX(graph.fitEndProperty.value);
      const inView = (x: number) => x >= -1 && x <= viewWidth + 1;
      fitStartHandle.visible = inView(fitStartHandle.x);
      fitEndHandle.visible = inView(fitEndHandle.x);

      const fits = graph.fitResultsProperty.value;
      const shape = new Shape();
      const isPosition = graph.quantityProperty.value === GraphQuantity.POSITION;
      for (const fit of [fits.red, fits.blue]) {
        if (fit) {
          const y0 = isPosition ? fit.slope * t0 + fit.intercept : fit.mean;
          const y1 = isPosition ? fit.slope * t1 + fit.intercept : fit.mean;
          shape.moveTo(x0, chartTransform.modelToViewY(y0)).lineTo(x1, chartTransform.modelToViewY(y1));
        }
      }
      fitLines.shape = shape;
    };

    const refresh = () => {
      updateAxes();
      updatePlots();
      updateFit();
    };
    recording.changedEmitter.addListener(refresh);
    const refreshMultilink = Multilink.multilink([graph.timeRangeProperty, graph.quantityProperty], refresh);
    const fitMultilink = Multilink.multilink(
      [graph.fitStartProperty, graph.fitEndProperty, graph.fitResultsProperty],
      updateFit,
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
      yAxisLabel.right = -38;
      yAxisLabel.centerY = viewHeight / 2;
      xAxisLabel.centerX = viewWidth / 2;
      xAxisLabel.top = viewHeight + 18;
      quantityRadioButtons.left = 0;
      quantityRadioButtons.bottom = -6;
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
      startListener.dispose();
      endListener.dispose();
      sweepListener.dispose();
      quantityRadioButtons.dispose();
    };
  }

  public override dispose(): void {
    this.disposeTimeGraphNode();
    super.dispose();
  }
}
