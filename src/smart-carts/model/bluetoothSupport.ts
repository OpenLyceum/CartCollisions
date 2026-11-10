/**
 * bluetoothSupport.ts
 *
 * Whether this browser can reach a Smart Cart at all, reduced to something the
 * view can switch on. Adapted from MotionSensor `src/common/model/transportSupport.ts`.
 */

export const BluetoothStatus = {
  /** Web Bluetooth is present and the page is on a secure origin. */
  AVAILABLE: "available",
  /** Not a browser — a test runner. */
  NO_BROWSER: "noBrowser",
  /** The API exists but the page is plain HTTP, so the picker will refuse to open. */
  INSECURE_CONTEXT: "insecureContext",
  /** Firefox, Safari, and anything else without Web Bluetooth. */
  UNSUPPORTED_BROWSER: "unsupportedBrowser",
} as const;

export type BluetoothStatusValue = (typeof BluetoothStatus)[keyof typeof BluetoothStatus];

export function getBluetoothStatus(): BluetoothStatusValue {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return BluetoothStatus.NO_BROWSER;
  }
  if (!window.isSecureContext) {
    return BluetoothStatus.INSECURE_CONTEXT;
  }
  return "bluetooth" in navigator ? BluetoothStatus.AVAILABLE : BluetoothStatus.UNSUPPORTED_BROWSER;
}
