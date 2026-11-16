/**
 * Fit-interval chrome for TimeGraphNode: shaded band, mean/slope lines, edge
 * handles with pointer + keyboard resize, and plot-wide sweep-to-mark.
 */

import type { Property, TReadOnlyProperty } from "scenerystack/axon";
import type { ChartTransform } from "scenerystack/bamboo";
import { clamp, Matrix3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, Line, Node, Path, Rectangle, RichDragListener } from "scenerystack/scenery";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { MAX_RECORDING_TIME, TIME_GRAPH_NODE_SETTINGS } from "../../CartCollisionsConstants.js";
import { GraphQuantity, type GraphState } from "../model/GraphState.js";

export type FitIntervalChrome = {
  readonly band: Rectangle;
  readonly fitLines: Path;
  readonly fitStartHandle: Node;
  readonly fitEndHandle: Node;
  readonly listeners: readonly { dispose: () => void }[];
  readonly updateFit: () => void;
};

const createHandle = (
  viewHeight: number,
  accessibleName: TReadOnlyProperty<string>,
  accessibleHelpText: TReadOnlyProperty<string>,
): Node =>
  new Node({
    cursor: "ew-resize",
    tagName: "div",
    focusable: true,
    accessibleName,
    accessibleHelpText,
    children: [
      // Wide transparent strip so the edge is easy to grab.
      new Rectangle(TIME_GRAPH_NODE_SETTINGS.HANDLE_X, 0, TIME_GRAPH_NODE_SETTINGS.HANDLE_WIDTH, viewHeight, {
        fill: "transparent",
      }),
      new Line(0, 0, 0, viewHeight, {
        stroke: CartCollisionsColors.fitLineColorProperty,
        lineWidth: TIME_GRAPH_NODE_SETTINGS.HANDLE_LINE_WIDTH,
      }),
      new Path(
        Shape.regularPolygon(3, TIME_GRAPH_NODE_SETTINGS.HANDLE_RADIUS).transformed(Matrix3.rotation2(Math.PI / 2)),
        {
          fill: CartCollisionsColors.fitLineColorProperty,
          y: TIME_GRAPH_NODE_SETTINGS.HANDLE_Y,
        },
      ),
    ],
  });

const timeFromViewX = (chartTransform: ChartTransform, viewWidth: number, x: number): number =>
  clamp(chartTransform.viewToModelX(clamp(x, 0, viewWidth)), 0, MAX_RECORDING_TIME);

const handleListener = (
  handle: Node,
  property: Property<number>,
  chartTransform: ChartTransform,
  viewWidth: number,
  plotLayer: Node,
  onIntervalChanged?: () => void,
): RichDragListener =>
  new RichDragListener({
    dragListenerOptions: {
      drag: (event) => {
        property.value = timeFromViewX(chartTransform, viewWidth, plotLayer.globalToLocalPoint(event.pointer.point).x);
      },
      end: () => onIntervalChanged?.(),
    },
    keyboardDragListenerOptions: {
      keyboardDragDirection: "leftRight",
      dragDelta: 6,
      shiftDragDelta: 1,
      drag: (_event, listener) => {
        property.value = timeFromViewX(chartTransform, viewWidth, handle.x + listener.modelDelta.x);
      },
      end: () => onIntervalChanged?.(),
    },
  });

/**
 * Build the shaded band, fit lines, edge handles, and wire pointer/keyboard
 * gestures onto `chartPickTarget` (usually the ChartRectangle) and `plotLayer`.
 */
export const createFitIntervalChrome = (options: {
  readonly viewWidth: number;
  readonly viewHeight: number;
  readonly chartTransform: ChartTransform;
  readonly graph: GraphState;
  readonly plotLayer: Node;
  readonly chartPickTarget: Node;
  readonly fitStartAccessibleName: TReadOnlyProperty<string>;
  readonly fitEndAccessibleName: TReadOnlyProperty<string>;
  readonly fitHelpText: TReadOnlyProperty<string>;
  readonly onIntervalChanged?: (() => void) | undefined;
}): FitIntervalChrome => {
  const { viewWidth, viewHeight, chartTransform, graph, plotLayer, chartPickTarget, onIntervalChanged } = options;

  const band = new Rectangle(0, 0, 1, viewHeight, {
    fill: CartCollisionsColors.fitIntervalColorProperty,
    pickable: false,
  });
  const fitLines = new Path(null, {
    stroke: CartCollisionsColors.fitLineColorProperty,
    lineWidth: TIME_GRAPH_NODE_SETTINGS.FIT_LINES_LINE_WIDTH,
    lineDash: [TIME_GRAPH_NODE_SETTINGS.FIT_LINES_LINE_DASH_DASH, TIME_GRAPH_NODE_SETTINGS.FIT_LINES_LINE_DASH_GAP],
    pickable: false,
  });

  const fitStartHandle = createHandle(viewHeight, options.fitStartAccessibleName, options.fitHelpText);
  const fitEndHandle = createHandle(viewHeight, options.fitEndAccessibleName, options.fitHelpText);

  const startListener = handleListener(
    fitStartHandle,
    graph.fitStartProperty,
    chartTransform,
    viewWidth,
    plotLayer,
    onIntervalChanged,
  );
  const endListener = handleListener(
    fitEndHandle,
    graph.fitEndProperty,
    chartTransform,
    viewWidth,
    plotLayer,
    onIntervalChanged,
  );
  fitStartHandle.addInputListener(startListener);
  fitEndHandle.addInputListener(endListener);

  // Drag across the plot to mark a fresh interval.
  const sweepListener = new DragListener({
    start: (event) => {
      const t = timeFromViewX(chartTransform, viewWidth, plotLayer.globalToLocalPoint(event.pointer.point).x);
      graph.fitStartProperty.value = t;
      graph.fitEndProperty.value = t;
    },
    drag: (event) => {
      graph.fitEndProperty.value = timeFromViewX(
        chartTransform,
        viewWidth,
        plotLayer.globalToLocalPoint(event.pointer.point).x,
      );
    },
    end: () => onIntervalChanged?.(),
  });
  chartPickTarget.addInputListener(sweepListener);

  const updateFit = (): void => {
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

  return {
    band,
    fitLines,
    fitStartHandle,
    fitEndHandle,
    listeners: [startListener, endListener, sweepListener],
    updateFit,
  };
};
