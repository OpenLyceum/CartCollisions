/**
 * BluetoothSmartCart.ts
 *
 * A Smart Cart over Web Bluetooth, through the `pasco-ble` library (OpenPhysics/
 * pascoTS). The library — and the mathjs it depends on — is loaded on demand, the
 * first time a Smart Carts screen is built, so the three virtual screens never pay
 * for it. `preloadPascoBle()` starts that load early so that, by the time a student
 * clicks Connect, scanning can begin while the click still counts as a user gesture.
 */

import type { PASCOBLEDevice as PascoDevice } from "pasco-ble";
import { DeviceSelectionCancelled, type SmartCartReading, type TSmartCartDevice } from "./SmartCartDevice.js";

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

export class BluetoothSmartCart implements TSmartCartDevice {
  private device: PascoDevice | null = null;
  private readonly disconnectListeners: (() => void)[] = [];
  private disconnectRequested = false;

  public get name(): string | null {
    return this.device?.name ?? null;
  }

  public isConnected(): boolean {
    return this.device?.isConnected() ?? false;
  }

  public async connect(): Promise<void> {
    const { PASCOBLEDevice } = await preloadPascoBle();
    const device = new PASCOBLEDevice({ connectionTimeout: 15000 });
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
      await device.disconnect();
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
