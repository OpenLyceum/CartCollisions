/**
 * formatting.ts
 *
 * Number formatting for readouts, tables and the CSV. Pure.
 */

import { toFixed } from "scenerystack/dot";
import type { Quantity } from "../model/labTables.js";

/** Decimal places shown for each quantity in the tables and the CSV. */
export const DECIMALS: Record<Quantity, number> = {
  mass: 4,
  velocity: 3,
  momentum: 4,
  energy: 4,
  percent: 1,
};

export function formatQuantity(value: number, quantity: Quantity): string {
  return toFixed(value, DECIMALS[quantity]);
}

/** A "nice" tick spacing (1, 2 or 5 × 10ⁿ) giving about `targetTicks` ticks across `span`. */
export function niceStep(span: number, targetTicks = 5): number {
  if (!(span > 0 && Number.isFinite(span))) {
    return 1;
  }
  const raw = span / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice = normalized < 1.5 ? 1 : normalized < 3.5 ? 2 : normalized < 7.5 ? 5 : 10;
  return nice * magnitude;
}

/** Decimals needed to print multiples of `step` exactly. */
export function decimalsFor(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}
