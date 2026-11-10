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
  /** Raw values behind the reading, for `?showDiagnostics`. */
  readonly diagnostic?: string;
};

/** One streamed sample: host-aligned time, position since streaming began, force (NaN if absent). */
export type SmartCartStreamSample = {
  readonly timeMs: number;
  readonly position: number;
  readonly force: number;
};

export interface TSmartCartDevice {
  /** Advertised name (e.g. "Smart Cart 123-456"), or null before a connection exists. */
  readonly name: string | null;

  isConnected(): boolean;

  /** Opens the picker and connects. Must reach the picker promptly after the click. */
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  /** One round trip: the cart's current position and force. Used only when the device cannot stream. */
  read(): Promise<SmartCartReading>;

  /**
   * Puts the cart on its own sampling clock, calling back with every sample.
   * When present, the channel uses this instead of {@link read}.
   */
  startStreaming?(periodMs: number, onSample: (sample: SmartCartStreamSample) => void): Promise<void>;

  stopStreaming?(): Promise<void>;

  /** Raw stream statistics for `?showDiagnostics`, or empty. */
  readonly diagnostic?: string;

  /** Called when the cart drops the connection by itself (out of range, switched off). */
  onUnexpectedDisconnect(listener: () => void): void;
}
