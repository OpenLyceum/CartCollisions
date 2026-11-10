/**
 * fitMath.ts
 *
 * Least-squares helpers: the straight-line fit students use on the position–time
 * graph, and the centred-window derivative that turns encoder positions into a
 * velocity trace. Pure, no SceneryStack imports.
 *
 * `differentiate` is copied from MotionSensor `src/common/model/motionMath.ts`
 * (copy-fork; the fleet has no shared library).
 */

/** Result of a straight-line fit y = slope·t + intercept. */
export type LineFit = {
  readonly slope: number;
  readonly intercept: number;
  /** Standard error of the slope; 0 when fewer than three points. */
  readonly slopeUncertainty: number;
  /** Mean of y over the interval — what a velocity graph's "average" reads. */
  readonly mean: number;
  readonly count: number;
};

/**
 * Fits a line to the points of `times`/`values` whose time lies in [t0, t1].
 * Returns null with fewer than two points (or no spread in time).
 */
export function fitLine(times: readonly number[], values: readonly number[], t0: number, t1: number): LineFit | null {
  const start = Math.min(t0, t1);
  const end = Math.max(t0, t1);
  let n = 0;
  let sumT = 0;
  let sumY = 0;
  const count = Math.min(times.length, values.length);
  for (let i = 0; i < count; i++) {
    const t = times[i] as number;
    if (t >= start && t <= end) {
      n++;
      sumT += t;
      sumY += values[i] as number;
    }
  }
  if (n < 2) {
    return null;
  }
  const meanT = sumT / n;
  const meanY = sumY / n;
  let stt = 0;
  let sty = 0;
  for (let i = 0; i < count; i++) {
    const t = times[i] as number;
    if (t >= start && t <= end) {
      const dt = t - meanT;
      stt += dt * dt;
      sty += dt * ((values[i] as number) - meanY);
    }
  }
  if (stt === 0) {
    return null;
  }
  const slope = sty / stt;
  const intercept = meanY - slope * meanT;

  let residualSquares = 0;
  for (let i = 0; i < count; i++) {
    const t = times[i] as number;
    if (t >= start && t <= end) {
      const r = (values[i] as number) - (slope * t + intercept);
      residualSquares += r * r;
    }
  }
  const slopeUncertainty = n > 2 ? Math.sqrt(residualSquares / (n - 2) / stt) : 0;

  return { slope, intercept, slopeUncertainty, mean: meanY, count: n };
}

/**
 * Differentiates a uniformly sampled series with a centred least-squares window
 * of `windowSize` samples. Near the ends the window slides inward rather than
 * shrinking, so every sample's slope uses the same number of points.
 */
export function differentiate(times: readonly number[], values: readonly number[], windowSize: number): number[] {
  const n = Math.min(times.length, values.length);
  if (n < 2) {
    return new Array<number>(n).fill(0);
  }
  const width = Math.min(windowSize, n);
  const half = Math.floor(width / 2);
  const result = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const start = Math.min(Math.max(i - half, 0), n - width);
    result[i] = slopeOver(times, values, start, start + width);
  }
  return result;
}

function slopeOver(times: readonly number[], values: readonly number[], start: number, end: number): number {
  const n = end - start;
  let sumT = 0;
  let sumV = 0;
  for (let i = start; i < end; i++) {
    sumT += times[i] as number;
    sumV += values[i] as number;
  }
  const meanT = sumT / n;
  const meanV = sumV / n;
  let numerator = 0;
  let denominator = 0;
  for (let i = start; i < end; i++) {
    const dt = (times[i] as number) - meanT;
    numerator += dt * ((values[i] as number) - meanV);
    denominator += dt * dt;
  }
  return denominator === 0 ? 0 : numerator / denominator;
}

/** Rounds `position` to the nearest whole encoder count of size `resolution`. */
export function quantize(position: number, resolution: number): number {
  return Math.round(position / resolution) * resolution;
}
