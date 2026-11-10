import { describe, expect, it } from "vitest";
import { ConnectionState, SmartCartChannel } from "../src/smart-carts/model/SmartCartChannel.js";
import { FakeSmartCart } from "./helpers/FakeSmartCart.js";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 5));

describe("SmartCartChannel", () => {
  it("connects, polls, and applies zero and change sign", async () => {
    const device = new FakeSmartCart();
    const channel = new SmartCartChannel(device, () => 0, 1);
    const samples: number[] = [];
    channel.sampleListener = (sample) => samples.push(sample.position);
    await channel.connect();
    expect(channel.connectionStateProperty.value).toBe(ConnectionState.CONNECTED);
    expect(channel.deviceNameProperty.value).toBe("Smart Cart 000-001");
    await tick();
    channel.zero();
    device.position = 0.6;
    channel.changeSignProperty.value = true;
    await tick();
    expect(samples.at(-1)).toBeCloseTo(-0.1, 9);
    await channel.disconnect();
    expect(channel.connectionStateProperty.value).toBe(ConnectionState.DISCONNECTED);
    channel.dispose();
  });

  it("a cancelled picker is not an error", async () => {
    const device = new FakeSmartCart();
    device.cancel = true;
    const channel = new SmartCartChannel(device, () => 0, 1);
    await channel.connect();
    expect(channel.connectionStateProperty.value).toBe(ConnectionState.DISCONNECTED);
    expect(channel.errorMessageProperty.value).toBeNull();
    channel.dispose();
  });

  it("streams from a device that can, starting at zero on connect", async () => {
    const device = new FakeSmartCart();
    let emit: ((sample: { timeMs: number; position: number; force: number }) => void) | null = null;
    Object.assign(device, {
      startStreaming: (_period: number, onSample: typeof emit) => {
        emit = onSample;
        return Promise.resolve();
      },
      stopStreaming: () => Promise.resolve(),
    });
    const channel = new SmartCartChannel(device, () => 0, 1, 20);
    const samples: number[] = [];
    channel.sampleListener = (sample) => samples.push(sample.position);
    await channel.connect();
    emit!({ timeMs: 20, position: 0.05, force: 0 });
    channel.changeSignProperty.value = true;
    emit!({ timeMs: 40, position: 0.1, force: 0 });
    expect(samples).toEqual([0.05, -0.1]);
    await channel.disconnect();
    channel.dispose();
  });
});
