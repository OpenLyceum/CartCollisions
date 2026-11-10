import { describe, expect, it } from "vitest";
import { ENCODER_RESOLUTION } from "../src/CartCollisionsConstants.js";
import {
  forceSamples,
  isStreamPacket,
  PositionStreamDecoder,
  positionCountChanges,
  setSamplePeriodCommand,
  startSamplingCommand,
  streamAckCommand,
} from "../src/smart-carts/model/smartCartStream.js";

const le16 = (value: number) => [value & 0xff, (value >>> 8) & 0xff];

describe("smartCartStream", () => {
  it("builds the sampler commands", () => {
    expect(setSamplePeriodCommand(20)).toEqual([0x01, 0x20, 0x4e, 0x00, 0x00, 0, 0]); // 20 000 µs
    expect(startSamplingCommand(20, 4)).toEqual([0x06, 20, 0, 20, 0, 20, 0, 20, 0]);
    expect(streamAckCommand(0x27)).toEqual([0, 0, 0, 0, 0x07]);
  });

  it("tells streamed data from command replies", () => {
    expect(isStreamPacket([0x03, 0x01, 0x00])).toBe(true);
    expect(isStreamPacket([0xc0, 0x00, 0x05, 0x00, 0x00])).toBe(false);
  });

  it("decodes signed count changes, several samples per packet", () => {
    expect(positionCountChanges([0x00, ...le16(5), ...le16(0x10000 - 3)])).toEqual([5, -3]);
  });

  it("accumulates changes into position on the cart's clock", () => {
    const decoder = new PositionStreamDecoder(20, 1000);
    decoder.decode([0, ...le16(408)]);
    const samples = decoder.decode([1, ...le16(408), ...le16(0)]);
    expect(samples.map((s) => s.timeMs)).toEqual([1020, 1040]);
    expect(samples.at(-1)?.position).toBeCloseTo(816 * ENCODER_RESOLUTION, 12); // 0.09895 m
    expect(decoder.missedPackets).toBe(0);
  });

  it("counts packets lost in transit, across the sequence wrap", () => {
    const decoder = new PositionStreamDecoder(20, 0);
    decoder.decode([0x1e, ...le16(0)]);
    decoder.decode([0x01, ...le16(0)]); // 0x1f and 0x00 missing
    expect(decoder.missedPackets).toBe(2);
  });

  it("converts raw force on the factory line", () => {
    const [zero, hundred] = forceSamples([0, ...le16(32768), ...le16(1000)]);
    expect(zero).toBeCloseTo(0, 9);
    expect(hundred).toBeCloseTo(100, 9);
  });
});
