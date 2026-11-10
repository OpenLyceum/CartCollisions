/**
 * TrackTransform.ts
 *
 * Maps a track position (m from the left end stop) to a view x coordinate.
 * One dimension only — the track is horizontal and the carts never leave it.
 */

export class TrackTransform {
  /** View pixels per metre. */
  public readonly scale: number;

  private readonly viewLeft: number;

  public constructor(viewLeft: number, viewWidth: number, trackLength: number) {
    this.viewLeft = viewLeft;
    this.scale = viewWidth / trackLength;
  }

  public modelToViewX(x: number): number {
    return this.viewLeft + x * this.scale;
  }

  public viewToModelX(x: number): number {
    return (x - this.viewLeft) / this.scale;
  }

  public modelToViewDelta(dx: number): number {
    return dx * this.scale;
  }
}
