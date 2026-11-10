/**
 * GraphState.ts
 *
 * What the graph is showing, and the fit interval the student has marked on it.
 * Shared by every screen; the view draws it and the fit panel reads it.
 *
 * The fit interval is two times, `fitStartProperty` and `fitEndProperty`, that the
 * student drags; the fits are recomputed whenever the interval or the recording
 * changes. Zoom is a visible time window — "expand the graph to see just the area
 * you are interested in", as the handout puts it.
 */

import { DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { MAX_RECORDING_TIME } from "../../CartCollisionsConstants.js";
import { fitLine, type LineFit } from "./fitMath.js";
import type { CartTrace, Recording } from "./Recording.js";

export const GraphQuantity = {
  POSITION: "position",
  VELOCITY: "velocity",
  FORCE: "force",
} as const;

export type GraphQuantityValue = (typeof GraphQuantity)[keyof typeof GraphQuantity];

export function valuesFor(trace: CartTrace, quantity: GraphQuantityValue): readonly number[] {
  return quantity === GraphQuantity.POSITION
    ? trace.positions
    : quantity === GraphQuantity.VELOCITY
      ? trace.velocities
      : trace.forces;
}

export type FitResults = {
  readonly red: LineFit | null;
  readonly blue: LineFit | null;
};

/** Shortest visible time window, in s. */
const MIN_ZOOM_SPAN = 0.1;

export class GraphState {
  public readonly quantityProperty = new Property<GraphQuantityValue>(GraphQuantity.POSITION);

  public readonly fitStartProperty: NumberProperty;
  public readonly fitEndProperty: NumberProperty;

  /** Visible time window of the graph, in s. */
  public readonly timeRangeProperty = new Property<Range>(new Range(0, 3));

  /** Bumped whenever the recording changes, so fits recompute. */
  private readonly revisionProperty = new NumberProperty(0);

  public readonly fitResultsProperty: TReadOnlyProperty<FitResults>;

  private readonly onRecordingChanged: () => void;

  private readonly recording: Recording;

  public constructor(recording: Recording) {
    this.recording = recording;
    const timeRange = new Range(0, MAX_RECORDING_TIME);
    this.fitStartProperty = new NumberProperty(0.5, { range: timeRange, units: "s" });
    this.fitEndProperty = new NumberProperty(1.0, { range: timeRange, units: "s" });

    this.fitResultsProperty = new DerivedProperty(
      [this.fitStartProperty, this.fitEndProperty, this.quantityProperty, this.revisionProperty],
      (start, end, quantity) => ({
        red: fitLine(recording.red.times, valuesFor(recording.red, quantity), start, end),
        blue: fitLine(recording.blue.times, valuesFor(recording.blue, quantity), start, end),
      }),
    );

    this.onRecordingChanged = () => {
      this.revisionProperty.value++;
      this.autoScaleTime();
    };
    recording.changedEmitter.addListener(this.onRecordingChanged);
  }

  /** While data arrives, keep the whole run in view. */
  private autoScaleTime(): void {
    const duration = this.recording.duration;
    const current = this.timeRangeProperty.value;
    if (duration > current.max) {
      this.timeRangeProperty.value = new Range(current.min, Math.min(MAX_RECORDING_TIME, Math.ceil(duration + 0.5)));
    }
  }

  /** Zoom the time axis to the fit interval, with a little margin on both sides. */
  public zoomToFit(): void {
    const start = Math.min(this.fitStartProperty.value, this.fitEndProperty.value);
    const end = Math.max(this.fitStartProperty.value, this.fitEndProperty.value);
    const margin = Math.max((end - start) * 0.5, MIN_ZOOM_SPAN / 2);
    this.timeRangeProperty.value = new Range(Math.max(0, start - margin), Math.min(MAX_RECORDING_TIME, end + margin));
  }

  /** Show the whole recording. */
  public zoomAll(): void {
    const duration = this.recording.duration;
    this.timeRangeProperty.value = new Range(0, Math.max(1, Math.ceil(duration * 2) / 2));
  }

  public reset(): void {
    this.quantityProperty.reset();
    this.fitStartProperty.reset();
    this.fitEndProperty.reset();
    this.timeRangeProperty.reset();
  }

  public dispose(): void {
    this.recording.changedEmitter.removeListener(this.onRecordingChanged);
    this.fitResultsProperty.dispose();
    this.quantityProperty.dispose();
    this.fitStartProperty.dispose();
    this.fitEndProperty.dispose();
    this.timeRangeProperty.dispose();
    this.revisionProperty.dispose();
  }
}
