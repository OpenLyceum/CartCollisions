/**
 * SmartCartsModel.ts
 *
 * The Smart Carts screen: the same lab, with two real PASCO Smart Carts streaming
 * over Web Bluetooth instead of the virtual track. The student says which run it
 * is (experiment and mass setup), so the fits land in the right table row; masses
 * come from the real balance and are typed into the table.
 *
 * Recording zeroes both carts where they stand, like Capstone's default, and
 * gives both carts one shared clock so their traces line up on one graph.
 */

import { BooleanProperty, DerivedProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { MAX_RECORDING_TIME } from "../../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../../CartCollisionsNamespace.js";
import { GraphState } from "../../common/model/GraphState.js";
import {
  Experiment,
  type ExperimentValue,
  MassMode,
  type MassModeValue,
  rowFor,
  type TLabModel,
} from "../../common/model/LabModel.js";
import type { LabNotebook } from "../../common/model/LabNotebook.js";
import type { RowId } from "../../common/model/labTables.js";
import { type CartTrace, Recording } from "../../common/model/Recording.js";
import { BluetoothSmartCart, preloadPascoBle } from "./BluetoothSmartCart.js";
import { type ChannelSample, type Clock, ConnectionState, SmartCartChannel } from "./SmartCartChannel.js";
import type { TSmartCartDevice } from "./SmartCartDevice.js";

export type SmartCartsModelOptions = {
  /** Builds the device for each cart; defaults to Web Bluetooth. Tests pass fakes. */
  readonly createDevice?: () => TSmartCartDevice;
  readonly clock?: Clock;
};

export class SmartCartsModel implements TModel, TLabModel {
  public readonly notebook: LabNotebook;
  public readonly recording = new Recording();
  public readonly graph: GraphState;
  public readonly measuresForce = true;

  public readonly red: SmartCartChannel;
  public readonly blue: SmartCartChannel;

  public readonly experimentProperty = new Property<ExperimentValue>(Experiment.EXPLOSION);
  public readonly massModeProperty = new Property<MassModeValue>(MassMode.EQUAL);
  public readonly activeRowProperty: TReadOnlyProperty<RowId>;

  private readonly isRecordingWritable = new BooleanProperty(false);
  public readonly isRecordingProperty: TReadOnlyProperty<boolean> = this.isRecordingWritable;
  public readonly canRecordProperty: TReadOnlyProperty<boolean>;

  private readonly clock: Clock;
  private startTimeMs = 0;

  public constructor(notebook: LabNotebook, options?: SmartCartsModelOptions) {
    this.notebook = notebook;
    this.graph = new GraphState(this.recording);
    this.clock = options?.clock ?? (() => performance.now());
    const createDevice = options?.createDevice ?? (() => new BluetoothSmartCart());
    if (options?.createDevice === undefined && typeof window !== "undefined" && "bluetooth" in navigator) {
      preloadPascoBle().catch(() => undefined);
    }

    this.red = new SmartCartChannel(createDevice(), this.clock);
    this.blue = new SmartCartChannel(createDevice(), this.clock);
    this.red.sampleListener = (sample) => this.onSample(this.recording.red, sample);
    this.blue.sampleListener = (sample) => this.onSample(this.recording.blue, sample);

    this.activeRowProperty = new DerivedProperty([this.experimentProperty, this.massModeProperty], rowFor);
    this.canRecordProperty = new DerivedProperty(
      [this.red.connectionStateProperty, this.blue.connectionStateProperty],
      (red, blue) => red === ConnectionState.CONNECTED || blue === ConnectionState.CONNECTED,
    );
    this.canRecordProperty.lazyLink((canRecord) => {
      if (!canRecord) {
        this.stop();
      }
    });
  }

  private onSample(trace: CartTrace, sample: ChannelSample): void {
    if (!this.isRecordingWritable.value) {
      return;
    }
    const time = (sample.timeMs - this.startTimeMs) / 1000;
    if (time < 0) {
      return;
    }
    if (time > MAX_RECORDING_TIME) {
      this.stop();
      return;
    }
    trace.addSample(time, sample.position, sample.force);
    this.recording.markChanged();
  }

  public record(): void {
    if (!this.canRecordProperty.value) {
      return;
    }
    this.recording.clear();
    this.graph.zoomAll();
    this.red.zero();
    this.blue.zero();
    this.startTimeMs = this.clock();
    this.isRecordingWritable.value = true;
  }

  public stop(): void {
    this.isRecordingWritable.value = false;
  }

  public clear(): void {
    this.stop();
    this.recording.clear();
    this.graph.reset();
  }

  public step(_dt: number): void {
    this.recording.flush();
  }

  public reset(): void {
    this.clear();
    this.experimentProperty.reset();
    this.massModeProperty.reset();
    this.red.reset();
    this.blue.reset();
  }
}

CartCollisionsNamespace.register("SmartCartsModel", SmartCartsModel);
