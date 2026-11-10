/**
 * FakeSmartCart.ts
 *
 * A Smart Cart that never leaves the test process: connects at once (or reports a
 * cancelled picker), and reads back whatever position the test sets.
 */

import {
  DeviceSelectionCancelled,
  type SmartCartReading,
  type TSmartCartDevice,
} from "../../src/smart-carts/model/SmartCartDevice.js";

export class FakeSmartCart implements TSmartCartDevice {
  public position = 0.5;
  public connected = false;
  public cancel = false;
  public get name() {
    return this.connected ? "Smart Cart 000-001" : null;
  }
  public isConnected() {
    return this.connected;
  }
  public connect(): Promise<void> {
    if (this.cancel) {
      return Promise.reject(new DeviceSelectionCancelled());
    }
    this.connected = true;
    return Promise.resolve();
  }
  public disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }
  public read(): Promise<SmartCartReading> {
    return Promise.resolve({ position: this.position, force: 1.5 });
  }
  public onUnexpectedDisconnect() {
    /* never */
  }
}
