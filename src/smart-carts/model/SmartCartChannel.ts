/**
 * SmartCartChannel.ts
 *
 * One real Smart Cart — red or blue — and its link: connection state, the
 * student's Change Sign setting, and a sample stream that runs for as long as the
 * cart is connected, so the live readout always moves when the cart is pushed.
 *
 * ── Errors never reach the caller ─────────────────────────────────────────────
 * `connect()` resolves even when it fails (pattern from MotionSensor
 * `SensorPositionSource`): the button listener stays synchronous, and every outcome
 * lands on `connectionStateProperty` / `errorMessageProperty` for the panel to show.
 * A cancelled picker returns to DISCONNECTED with no message.
 *
 * ── Streaming, or polling as a fallback ───────────────────────────────────────
 * A device that can stream (a real cart, via `startStreaming`) samples on its own
 * clock and stamps each sample with that clock, aligned to the host time sampling
 * began. A device that cannot (the test fake) is polled, each sample stamped at the
 * midpoint of its round trip. Position starts at zero on connect either way.
 */

import { BooleanProperty, NumberProperty, Property } from "scenerystack/axon";
import { HARDWARE_POLL_INTERVAL_MS, HARDWARE_STREAM_PERIOD_MS } from "../../CartCollisionsConstants.js";
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

  /** Raw values behind the latest read and the read rate, for `?showDiagnostics`. */
  public readonly diagnosticProperty = new Property<string>("");

  /** Called for every successful read while connected. */
  public sampleListener: ((sample: ChannelSample) => void) | null = null;

  private zeroOffset = 0;
  private lastRawPosition: number | null = null;
  private polling = false;
  private generation = 0;

  private readonly device: TSmartCartDevice;
  private readonly clock: Clock;
  private readonly pollIntervalMs: number;
  private readonly streamPeriodMs: number;
  private samplesInWindow = 0;
  private windowStart = 0;
  private sampleRate = 0;

  public constructor(
    device: TSmartCartDevice,
    clock: Clock = () => performance.now(),
    pollIntervalMs = HARDWARE_POLL_INTERVAL_MS,
    streamPeriodMs = HARDWARE_STREAM_PERIOD_MS,
  ) {
    this.device = device;
    this.clock = clock;
    this.pollIntervalMs = pollIntervalMs;
    this.streamPeriodMs = streamPeriodMs;
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
      this.zeroOffset = 0;
      this.lastRawPosition = null;
      this.windowStart = this.clock();
      this.samplesInWindow = 0;
      if (this.device.startStreaming) {
        await this.device.startStreaming(this.streamPeriodMs, (sample) =>
          this.accept(sample.timeMs, sample.position, sample.force),
        );
      } else {
        this.startPolling();
      }
      this.connectionStateProperty.value = ConnectionState.CONNECTED;
    } catch (error) {
      this.connectionStateProperty.value = ConnectionState.DISCONNECTED;
      if (!(error instanceof DeviceSelectionCancelled)) {
        this.errorMessageProperty.value = error instanceof Error ? error.message : String(error);
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.stopPolling();
    await this.device.stopStreaming?.().catch(() => undefined);
    try {
      await this.device.disconnect();
    } finally {
      this.connectionStateProperty.value = ConnectionState.DISCONNECTED;
      this.deviceNameProperty.value = null;
    }
  }

  /** One sample from either source: zero, Change Sign, live readout, listener. */
  private accept(timeMs: number, rawPosition: number, force: number): void {
    this.lastRawPosition = rawPosition;
    const sign = this.changeSignProperty.value ? -1 : 1;
    const position = sign * (rawPosition - this.zeroOffset);
    this.livePositionProperty.value = position;
    this.sampleListener?.({ timeMs, position, force });

    this.samplesInWindow++;
    const now = this.clock();
    if (now - this.windowStart >= 1000) {
      this.sampleRate = (1000 * this.samplesInWindow) / (now - this.windowStart);
      this.windowStart = now;
      this.samplesInWindow = 0;
      const detail = this.device.diagnostic ?? "";
      this.diagnosticProperty.value = `${detail}${detail ? " · " : ""}${this.sampleRate.toFixed(0)} samples/s`;
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
          this.accept((before + this.clock()) / 2, reading.position, reading.force ?? Number.NaN);
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
    this.diagnosticProperty.dispose();
  }
}

CartCollisionsNamespace.register("SmartCartChannel", SmartCartChannel);
