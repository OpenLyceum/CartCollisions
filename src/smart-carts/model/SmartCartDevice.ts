/**
 * SmartCartDevice.ts
 *
 * What a {@link SmartCartChannel} needs from one PASCO Smart Cart (ME-1240),
 * independent of how it is reached. The real implementation is
 * {@link BluetoothSmartCart}; tests substitute a fake.
 */

/** Thrown when the student dismisses the browser's device picker. Not a failure. */
export class DeviceSelectionCancelled extends Error {}

/** One reading: position in m from the cart's power-on origin, force in N; null when not reported. */
export type SmartCartReading = {
  readonly position: number | null;
  readonly force: number | null;
};

export interface TSmartCartDevice {
  /** Advertised name (e.g. "Smart Cart 123-456"), or null before a connection exists. */
  readonly name: string | null;

  isConnected(): boolean;

  /** Opens the picker and connects. Must reach the picker promptly after the click. */
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  /** One round trip: the cart's current position and force. */
  read(): Promise<SmartCartReading>;

  /** Called when the cart drops the connection by itself (out of range, switched off). */
  onUnexpectedDisconnect(listener: () => void): void;
}
