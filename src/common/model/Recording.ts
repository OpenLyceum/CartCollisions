/**
 * Recording.ts
 *
 * What one Smart Cart sends to the computer during a run: timestamped position,
 * and force where it is available. Velocity is derived here, from position, with a
 * centred least-squares window — the same kind of smoothing PASCO's software
 * applies — so the virtual and real carts produce identical kinds of trace.
 *
 * Each cart keeps its own clock column because two real carts are polled
 * independently and their samples never land at the same instants.
 */

import { Emitter } from "scenerystack/axon";
import { VELOCITY_WINDOW } from "../../CartCollisionsConstants.js";
import { differentiate } from "./fitMath.js";

export class CartTrace {
  public readonly times: number[] = [];
  public readonly positions: number[] = [];
  /** Force on the cart's load cell, in N; NaN when the source does not measure it. */
  public readonly forces: number[] = [];

  private velocityCache: number[] = [];
  private velocityDirty = false;

  public addSample(time: number, position: number, force: number): void {
    this.times.push(time);
    this.positions.push(position);
    this.forces.push(force);
    this.velocityDirty = true;
  }

  public get velocities(): readonly number[] {
    if (this.velocityDirty) {
      this.velocityCache = differentiate(this.times, this.positions, VELOCITY_WINDOW);
      this.velocityDirty = false;
    }
    return this.velocityCache;
  }

  public get length(): number {
    return this.times.length;
  }

  public clear(): void {
    this.times.length = 0;
    this.positions.length = 0;
    this.forces.length = 0;
    this.velocityCache = [];
    this.velocityDirty = false;
  }
}

/** The two carts' traces for one run. */
export class Recording {
  public readonly red = new CartTrace();
  public readonly blue = new CartTrace();

  /** Fired at most once per frame, after samples were added or the run was cleared. */
  public readonly changedEmitter = new Emitter();

  private pendingChange = false;

  public markChanged(): void {
    this.pendingChange = true;
  }

  /** Called once per frame by the owning model; emits if anything changed since the last flush. */
  public flush(): void {
    if (this.pendingChange) {
      this.pendingChange = false;
      this.changedEmitter.emit();
    }
  }

  public get duration(): number {
    const last = (trace: CartTrace) => (trace.length === 0 ? 0 : (trace.times[trace.length - 1] as number));
    return Math.max(last(this.red), last(this.blue));
  }

  public get isEmpty(): boolean {
    return this.red.length === 0 && this.blue.length === 0;
  }

  public clear(): void {
    this.red.clear();
    this.blue.clear();
    this.pendingChange = false;
    this.changedEmitter.emit();
  }

  public dispose(): void {
    this.changedEmitter.dispose();
  }
}
