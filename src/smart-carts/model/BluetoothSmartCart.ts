/**
 * BluetoothSmartCart.ts
 *
 * A Smart Cart over Web Bluetooth. Connection, sensor discovery and command
 * writes come from the `pasco-ble` library (OpenPhysics/pascoTS); sampling does
 * not. pasco-ble only offers one-shot reads, and a one-shot read of the cart's
 * position sensor carries no live encoder count (see smartCartStream.ts). So this
 * subclasses its device class to start the cart's own periodic sampler, and
 * takes the streamed packets itself — decoding them, timestamping them on the
 * cart's clock, and acknowledging them as PASCO's protocol requires.
 *
 * The library (and the mathjs it depends on) is loaded on demand, the first time a
 * Smart Carts screen is built, so the virtual screens never pay for it.
 */

import type { PASCOBLEDevice as PascoDevice } from "pasco-ble";
import {
  DeviceSelectionCancelled,
  type SmartCartReading,
  type SmartCartStreamSample,
  type TSmartCartDevice,
} from "./SmartCartDevice.js";
import {
  forceSamples,
  isStreamPacket,
  PositionStreamDecoder,
  STREAM_ACK_INTERVAL,
  setSamplePeriodCommand,
  startSamplingCommand,
  stopSamplingCommand,
  streamAckCommand,
} from "./smartCartStream.js";

type PascoBleModule = typeof import("pasco-ble");

let modulePromise: Promise<PascoBleModule> | null = null;

/** Starts loading pasco-ble; safe to call repeatedly. */
export function preloadPascoBle(): Promise<PascoBleModule> {
  if (modulePromise === null) {
    modulePromise = import("pasco-ble");
    // A failed load is reported when the student connects; don't leave it unhandled here.
    modulePromise.catch(() => undefined);
  }
  return modulePromise;
}

/** Name prefix every Smart Cart advertises. */
const SMART_CART_PREFIX = "Smart Cart";

/** PASCO sensor ids of the cart's position and force channels (datasheets). */
const POSITION_SENSOR_ID = 2027;
const FORCE_SENSOR_ID = 2025;

/** The parts of pasco-ble's internals this subclass relies on. */
type ChannelInfo = {
  readonly id: number;
  // biome-ignore lint/style/useNamingConvention: pasco-ble's own field name
  readonly sensor_id: number;
};

/** What the streaming subclass adds to pasco-ble's device. */
type StreamingDevice = PascoDevice & {
  channels(): readonly ChannelInfo[];
  sendCommand(serviceId: number, command: number[]): Promise<void>;
  sendStreamAck(serviceId: number, command: number[]): Promise<void>;
  streamHandler: ((serviceId: number, data: number[]) => void) | null;
};

/**
 * Builds the subclass once the library has loaded. Periodic packets on a sensor
 * service go to `streamHandler` and are *not* passed on: pasco-ble would decode
 * them as well and acknowledge with a one-byte packet the cart does not expect.
 */
function createStreamingDeviceClass(module: PascoBleModule) {
  return class StreamingPascoDevice extends module.PASCOBLEDevice {
    public streamHandler: ((serviceId: number, data: number[]) => void) | null = null;

    public channels(): readonly ChannelInfo[] {
      return (
        this as unknown as { _sensorManager: { state: { getChannels(): readonly ChannelInfo[] } } }
      )._sensorManager.state.getChannels();
    }

    public sendCommand(serviceId: number, command: number[]): Promise<void> {
      return this.write(serviceId, command);
    }

    public sendStreamAck(serviceId: number, command: number[]): Promise<void> {
      return (this as unknown as { _protocol: { sendAck(s: number, c: number[]): Promise<void> } })._protocol.sendAck(
        serviceId,
        command,
      );
    }

    protected override _handleNotification(serviceId: number, data: number[]): void {
      if (serviceId > 0 && this.streamHandler !== null && isStreamPacket(data)) {
        this.streamHandler(serviceId, data);
        return;
      }
      super._handleNotification(serviceId, data);
    }
  };
}

export class BluetoothSmartCart implements TSmartCartDevice {
  private device: StreamingDevice | null = null;
  private readonly disconnectListeners: (() => void)[] = [];
  private disconnectRequested = false;
  private streamStats = "";

  public get name(): string | null {
    return this.device?.name ?? null;
  }

  public get diagnostic(): string {
    return this.streamStats;
  }

  public isConnected(): boolean {
    return this.device?.isConnected() ?? false;
  }

  public async connect(): Promise<void> {
    const module = await preloadPascoBle();
    const StreamingPascoDevice = createStreamingDeviceClass(module);
    const device = new StreamingPascoDevice({ connectionTimeout: 15000 }) as unknown as StreamingDevice;
    const found = await device.scan(SMART_CART_PREFIX);
    const chosen = found[0];
    if (chosen === undefined) {
      throw new DeviceSelectionCancelled();
    }
    await device.connect(chosen);
    this.disconnectRequested = false;
    device.on("disconnected", () => {
      if (!this.disconnectRequested) {
        for (const listener of this.disconnectListeners) {
          listener();
        }
      }
    });
    this.device = device;
  }

  public async disconnect(): Promise<void> {
    const device = this.device;
    this.device = null;
    if (device !== null) {
      this.disconnectRequested = true;
      device.streamHandler = null;
      await device.sendCommand(0, stopSamplingCommand()).catch(() => undefined);
      await device.disconnect();
    }
  }

  public async startStreaming(periodMs: number, onSample: (sample: SmartCartStreamSample) => void): Promise<void> {
    const device = this.device;
    if (device === null) {
      throw new Error("Smart Cart is not connected");
    }
    const channels = [...device.channels()].sort((a, b) => a.id - b.id);
    const positionChannel = channels.find((channel) => channel.sensor_id === POSITION_SENSOR_ID);
    const forceChannel = channels.find((channel) => channel.sensor_id === FORCE_SENSOR_ID);
    if (positionChannel === undefined) {
      throw new Error("This Smart Cart reported no position sensor");
    }
    const positionService = positionChannel.id + 1;
    const forceService = forceChannel === undefined ? null : forceChannel.id + 1;

    // A previous session may have left the sampler running.
    await device.sendCommand(0, stopSamplingCommand()).catch(() => undefined);
    for (const channel of channels) {
      await device.sendCommand(channel.id + 1, setSamplePeriodCommand(periodMs));
    }

    const decoder = new PositionStreamDecoder(periodMs, performance.now());
    let latestForce = Number.NaN;
    const packetsSinceAck = new Map<number, number>();
    let packets = 0;

    device.streamHandler = (serviceId, data) => {
      packets++;
      const count = (packetsSinceAck.get(serviceId) ?? 0) + 1;
      if (count >= STREAM_ACK_INTERVAL) {
        packetsSinceAck.set(serviceId, 0);
        device.sendStreamAck(serviceId, streamAckCommand(data[0] ?? 0)).catch(() => undefined);
      } else {
        packetsSinceAck.set(serviceId, count);
      }

      if (serviceId === forceService) {
        latestForce = forceSamples(data).at(-1) ?? latestForce;
      } else if (serviceId === positionService) {
        for (const sample of decoder.decode(data)) {
          onSample({ timeMs: sample.timeMs, position: sample.position, force: latestForce });
        }
        this.streamStats = `counts ${decoder.totalCounts} · packets ${packets} · missed ${decoder.missedPackets}`;
      }
    };

    await device.sendCommand(0, startSamplingCommand(periodMs, channels.length));
  }

  public async stopStreaming(): Promise<void> {
    const device = this.device;
    if (device !== null) {
      device.streamHandler = null;
      await device.sendCommand(0, stopSamplingCommand());
    }
  }

  public async read(): Promise<SmartCartReading> {
    const device = this.device;
    if (device === null) {
      return { position: null, force: null };
    }
    const values = await device.readDataList(["Position", "Force"]);
    return { position: values["Position"] ?? null, force: values["Force"] ?? null };
  }

  public onUnexpectedDisconnect(listener: () => void): void {
    this.disconnectListeners.push(listener);
  }
}
