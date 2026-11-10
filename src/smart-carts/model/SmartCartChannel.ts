/**
 * SmartCartChannel.ts
 *
 * One real Smart Cart — red or blue — and its link: connection state, the
 * student's Change Sign setting, and a poll loop that runs for as long as the cart
 * is connected so the live readout always moves when the cart is pushed.
 *
 * ── Errors never reach the caller ─────────────────────────────────────────────
 * `connect()` resolves even when it fails (pattern from MotionSensor
 * `SensorPositionSource`): the button listener stays synchronous, and every outcome
 * lands on `connectionStateProperty` / `errorMessageProperty` for the panel to show.
 * A cancelled picker returns to DISCONNECTED with no message.
 *
 * ── Timestamps ────────────────────────────────────────────────────────────────
 * The library reads on demand, one Bluetooth round trip per sample, so each sample
 * is stamped on the host at the midpoint of its round trip. Two carts are polled
 * independently; see doc/implementation-notes.md for what that means for timing.
 */

import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { HARDWARE_POLL_INTERVAL_MS } from "../../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../../CartCollisionsNamespace.js";
import { DeviceSelectionCancelled, type TSmartCartDevice } from "./SmartCartDevice.js";

export const ConnectionState = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
} as const;

export type ConnectionStateValue = (typeof ConnectionState)[keyof typeof ConnectionState];

/** A sample as delivered to the model: host time in ms, position after Change Sign, force in N (NaN if absent). */
export type ChannelSample = {
  readonly timeMs: number;
  readonly position: number;
  readonly force: number;
};

/** Consecutive failed reads after which the link is considered lost. */
const MAX_FAILURES = 5;

export type Clock = () => number;

export class SmartCartChannel {
  public readonly connectionStateProperty = new Property<ConnectionStateValue>(ConnectionState.DISCONNECTED);
  public readonly deviceNameProperty = new Property<string | null>(null);
  public readonly errorMessageProperty = new Property<string | null>(null);
  public readonly changeSignProperty = new BooleanProperty(false);

  /** Position as last read, after Change Sign and relative to the last zero, in m. */
  public readonly livePositionProperty = new NumberProperty(0, { units: "m" });

  /** Called for every successful read while connected. */
  public sampleListener: ((sample: ChannelSample) => void) | null = null;

  private zeroOffset = 0;
  private lastRawPosition: number | null = null;
  private polling = false;
  private generation = 0;

  private readonly device: TSmartCartDevice;
  private readonly clock: Clock;
  private readonly pollIntervalMs: number;

  public constructor(
    device: TSmartCartDevice,
    clock: Clock = () => performance.now(),
    pollIntervalMs = HARDWARE_POLL_INTERVAL_MS,
  ) {
    this.device = device;
    this.clock = clock;
    this.pollIntervalMs = pollIntervalMs;
    device.onUnexpectedDisconnect(() => {
      this.stopPolling();
      this.connectionStateProperty.value = ConnectionState.DISCONNECTED;
      this.deviceNameProperty.value = null;
      this.errorMessageProperty.value = "disconnected";
    });
  }

  public get isConnected(): boolean {
    return this.connectionStateProperty.value === ConnectionState.CONNECTED;
  }

  public async connect(): Promise<void> {
    if (this.connectionStateProperty.value !== ConnectionState.DISCONNECTED) {
      return;
    }
    this.errorMessageProperty.value = null;
    this.connectionStateProperty.value = ConnectionState.CONNECTING;
    try {
      await this.device.connect();
      this.deviceNameProperty.value = this.device.name;
      this.connectionStateProperty.value = ConnectionState.CONNECTED;
      this.startPolling();
    } catch (error) {
      this.connectionStateProperty.value = ConnectionState.DISCONNECTED;
      if (!(error instanceof DeviceSelectionCancelled)) {
        this.errorMessageProperty.value = error instanceof Error ? error.message : String(error);
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.stopPolling();
    try {
      await this.device.disconnect();
    } finally {
      this.connectionStateProperty.value = ConnectionState.DISCONNECTED;
      this.deviceNameProperty.value = null;
    }
  }

  /** Makes the current position the new zero — Capstone's "zero at start". */
  public zero(): void {
    this.zeroOffset = this.lastRawPosition ?? 0;
    this.livePositionProperty.value = 0;
  }

  private startPolling(): void {
    this.polling = true;
    const generation = ++this.generation;
    this.pollLoop(generation).catch(() => undefined);
  }

  private stopPolling(): void {
    this.polling = false;
    this.generation++;
  }

  private async pollLoop(generation: number): Promise<void> {
    let failures = 0;
    while (this.polling && generation === this.generation) {
      const before = this.clock();
      try {
        const reading = await this.device.read();
        if (generation !== this.generation) {
          return;
        }
        failures = 0;
        if (reading.position !== null) {
          this.lastRawPosition = reading.position;
          const sign = this.changeSignProperty.value ? -1 : 1;
          const position = sign * (reading.position - this.zeroOffset);
          this.livePositionProperty.value = position;
          this.sampleListener?.({
            timeMs: (before + this.clock()) / 2,
            position,
            force: reading.force ?? Number.NaN,
          });
        }
      } catch (error) {
        failures++;
        if (failures >= MAX_FAILURES) {
          this.errorMessageProperty.value = error instanceof Error ? error.message : String(error);
          await this.disconnect().catch(() => undefined);
          return;
        }
      }
      await new Promise<void>((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  public reset(): void {
    this.changeSignProperty.reset();
  }

  public dispose(): void {
    this.stopPolling();
    this.device.disconnect().catch(() => undefined);
    this.connectionStateProperty.dispose();
    this.deviceNameProperty.dispose();
    this.errorMessageProperty.dispose();
    this.changeSignProperty.dispose();
    this.livePositionProperty.dispose();
  }
}

CartCollisionsNamespace.register("SmartCartChannel", SmartCartChannel);
