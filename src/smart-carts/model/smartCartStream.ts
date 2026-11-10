/**
 * smartCartStream.ts
 *
 * The Smart Cart's periodic sampling, as pure functions: the commands that start
 * and stop the cart's own sampler, and the decoding of the packets it then pushes.
 *
 * ── Why streaming, not one-shot reads ─────────────────────────────────────────
 * A one-shot read (`readDataList`) of the position sensor does not return a live
 * encoder count: with a real ME-1240 one cart answered 0 however far it rolled and
 * another a constant 32 625, while pasco-ble added that value to "Position" on
 * every read (thousands of metres within minutes). The encoder's counts only flow
 * when the cart samples on its own clock, which is how PASCO's software reads it.
 *
 * ── The protocol (PASCO BLE, as used by MotionSensor for the PS-3219) ─────────
 *   sensor service, SEND_CMD:  [0x01, period µs (u32 LE), 0, 0]      set sample period
 *   device service, SEND_CMD:  [0x06, period ms (u16 LE) per channel] start sampling
 *   device service, SEND_CMD:  [0x07]                                 stop sampling
 *   sensor service, notify:    [sequence (< 0x20), sample, sample, …] streamed data
 *   sensor service, SEND_ACK:  [0, 0, 0, 0, sequence]                 every 8 packets
 *
 * Each position sample is a signed 16-bit count *change* since the previous
 * sample (0.09895 m / 816 counts); each force sample an unsigned 16-bit raw value
 * on the factory line through (32768 → 0 N) and (1000 → 100 N).
 */

import { ENCODER_RESOLUTION } from "../../CartCollisionsConstants.js";

export const SET_SAMPLE_PERIOD = 0x01;
export const START_SAMPLING = 0x06;
export const STOP_SAMPLING = 0x07;

/** Streamed packets carry a five-bit sequence number; anything at or above is a reply or event. */
export const STREAM_SEQUENCE_MODULUS = 0x20;

/** Acknowledge every this many packets, or the cart stops sending. */
export const STREAM_ACK_INTERVAL = 8;

export function setSamplePeriodCommand(periodMilliseconds: number): number[] {
  const us = Math.round(periodMilliseconds * 1000);
  return [SET_SAMPLE_PERIOD, us & 0xff, (us >>> 8) & 0xff, (us >>> 16) & 0xff, (us >>> 24) & 0xff, 0, 0];
}

/** One period per channel, in channel order. */
export function startSamplingCommand(periodMilliseconds: number, channelCount: number): number[] {
  const ms = Math.round(periodMilliseconds) & 0x7ff;
  const bytes = [START_SAMPLING];
  for (let i = 0; i < channelCount; i++) {
    bytes.push(ms & 0xff, (ms >>> 8) & 0xff);
  }
  return bytes;
}

export function stopSamplingCommand(): number[] {
  return [STOP_SAMPLING];
}

export function streamAckCommand(sequence: number): number[] {
  return [0, 0, 0, 0, sequence & (STREAM_SEQUENCE_MODULUS - 1)];
}

/** True for a streamed data packet (as opposed to a command reply or an event). */
export function isStreamPacket(data: readonly number[]): boolean {
  return data.length >= 2 && data[0] !== undefined && data[0] < STREAM_SEQUENCE_MODULUS;
}

const int16 = (low: number, high: number) => {
  const value = low | (high << 8);
  return value >= 0x8000 ? value - 0x10000 : value;
};

/** Signed count changes in a position packet (after the sequence byte). */
export function positionCountChanges(data: readonly number[]): number[] {
  const changes: number[] = [];
  for (let i = 1; i + 1 < data.length; i += 2) {
    changes.push(int16(data[i] ?? 0, data[i + 1] ?? 0));
  }
  return changes;
}

/** Forces in N in a force packet (after the sequence byte). */
export function forceSamples(data: readonly number[]): number[] {
  const forces: number[] = [];
  for (let i = 1; i + 1 < data.length; i += 2) {
    const raw = (data[i] ?? 0) | ((data[i + 1] ?? 0) << 8);
    forces.push(((32768 - raw) * 100) / (32768 - 1000));
  }
  return forces;
}

/**
 * Turns a stream of position packets into timestamped positions. Positions are
 * the running sum of count changes since streaming began; times are sample index
 * × period on the cart's own clock, offset to the host time streaming started.
 */
export class PositionStreamDecoder {
  private counts = 0;
  private sampleIndex = 0;
  private lastSequence: number | null = null;
  /** Packets the sequence numbers say never arrived. */
  public missedPackets = 0;

  private readonly periodMs: number;
  private readonly startTimeMs: number;

  public constructor(periodMs: number, startTimeMs: number) {
    this.periodMs = periodMs;
    this.startTimeMs = startTimeMs;
  }

  public decode(data: readonly number[]): { timeMs: number; position: number }[] {
    const sequence = data[0] ?? 0;
    if (this.lastSequence !== null) {
      const expected = (this.lastSequence + 1) % STREAM_SEQUENCE_MODULUS;
      this.missedPackets += (sequence - expected + STREAM_SEQUENCE_MODULUS) % STREAM_SEQUENCE_MODULUS;
    }
    this.lastSequence = sequence;
    return positionCountChanges(data).map((change) => {
      this.counts += change;
      const sample = {
        timeMs: this.startTimeMs + this.sampleIndex * this.periodMs,
        position: this.counts * ENCODER_RESOLUTION,
      };
      this.sampleIndex++;
      return sample;
    });
  }

  public get totalCounts(): number {
    return this.counts;
  }
}
