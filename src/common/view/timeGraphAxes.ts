/**
 * Bamboo axis chrome for TimeGraphNode: grids, zero line, tick marks/labels,
 * and the spacing/decimals refresh when the visible window changes.
 */

import { type ChartTransform, GridLineSet, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { type Range, toFixed } from "scenerystack/dot";
import { Orientation } from "scenerystack/phet-core";
import { Line, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { TIME_GRAPH_NODE_SETTINGS } from "../../CartCollisionsConstants.js";
import { decimalsFor, niceStep } from "./formatting.js";

const TICK_FONT = new PhetFont(TIME_GRAPH_NODE_SETTINGS.TICK_FONT_SIZE);

export type TimeGraphAxes = {
  readonly xGrid: GridLineSet;
  readonly yGrid: GridLineSet;
  readonly zeroLine: Line;
  readonly xTicks: TickMarkSet;
  readonly xTickLabels: TickLabelSet;
  readonly yTicks: TickMarkSet;
  readonly yTickLabels: TickLabelSet;
  readonly updateAxes: (timeRange: Range, yRange: Range) => void;
};

/** Build grid + tick sets bound to `chartTransform` for a fixed plot size. */
export const createTimeGraphAxes = (
  chartTransform: ChartTransform,
  viewWidth: number,
  viewHeight: number,
): TimeGraphAxes => {
  const gridOptions = {
    stroke: CartCollisionsColors.chartGridColorProperty,
    lineWidth: TIME_GRAPH_NODE_SETTINGS.GRID_OPTIONS_LINE_WIDTH,
  };
  const xGrid = new GridLineSet(chartTransform, Orientation.HORIZONTAL, 1, gridOptions);
  const yGrid = new GridLineSet(chartTransform, Orientation.VERTICAL, 0.05, gridOptions);
  const zeroLine = new Line(0, 0, viewWidth, 0, {
    stroke: CartCollisionsColors.textColorProperty,
    lineWidth: TIME_GRAPH_NODE_SETTINGS.ZERO_LINE_LINE_WIDTH,
  });

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

  const updateAxes = (timeRange: Range, yRange: Range): void => {
    chartTransform.setModelXRange(timeRange);
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

  return { xGrid, yGrid, zeroLine, xTicks, xTickLabels, yTicks, yTickLabels, updateAxes };
};
