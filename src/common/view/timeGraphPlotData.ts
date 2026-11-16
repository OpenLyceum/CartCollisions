/**
 * Pure helpers that turn cart traces into bamboo data sets and y ranges.
 */

import { Range, Vector2 } from "scenerystack/dot";
import type { GraphQuantityValue } from "../model/GraphState.js";
import { valuesFor } from "../model/GraphState.js";
import type { CartTrace, Recording } from "../model/Recording.js";

/** Convert one cart's sampled quantity into a bamboo LinePlot data set. */
export const traceToDataSet = (trace: CartTrace, quantity: GraphQuantityValue): (Vector2 | null)[] => {
  const values = valuesFor(trace, quantity);
  const points: (Vector2 | null)[] = [];
  for (let i = 0; i < trace.length; i++) {
    const value = values[i] as number;
    points.push(Number.isFinite(value) ? new Vector2(trace.times[i] as number, value) : null);
  }
  return points;
};

/**
 * Y range covering both carts over `timeRange`, padded and floored by `minYSpan`
 * so a cart at rest is not magnified into noise.
 */
export const visibleYExtent = (
  recording: Recording,
  quantity: GraphQuantityValue,
  timeRange: Range,
  minYSpan: number,
): Range => {
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
  const span = Math.max(max - min, minYSpan);
  const centre = (max + min) / 2;
  return new Range(centre - span * 0.55, centre + span * 0.55);
};
