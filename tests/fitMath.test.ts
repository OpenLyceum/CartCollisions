import { describe, expect, it } from "vitest";
import { differentiate, fitLine, quantize } from "../src/common/model/fitMath.js";

describe("fitMath", () => {
  it("fits a line exactly over the chosen interval only", () => {
    const times = [0, 0.1, 0.2, 0.3, 0.4, 0.5];
    const values = times.map((t) => (t < 0.25 ? 1 : 2 + 0.5 * t));
    const fit = fitLine(times, values, 0.3, 0.5);
    expect(fit?.slope).toBeCloseTo(0.5, 10);
    expect(fit?.intercept).toBeCloseTo(2, 10);
    expect(fit?.slopeUncertainty).toBeCloseTo(0, 10);
    expect(fit?.count).toBe(3);
  });

  it("accepts the interval in either order and needs two points", () => {
    const times = [0, 1, 2];
    const values = [0, 2, 4];
    expect(fitLine(times, values, 2, 0)?.slope).toBeCloseTo(2, 10);
    expect(fitLine(times, values, 0.5, 1.5)).toBeNull();
  });

  it("reports a slope uncertainty for noisy data", () => {
    const times = [0, 1, 2, 3, 4];
    const values = [0, 1.1, 1.9, 3.2, 3.9];
    const fit = fitLine(times, values, 0, 4);
    expect(fit?.slopeUncertainty).toBeGreaterThan(0);
  });

  it("differentiates a straight line to its slope everywhere", () => {
    const times = Array.from({ length: 20 }, (_, i) => i * 0.01);
    const values = times.map((t) => 3 * t + 1);
    for (const v of differentiate(times, values, 5)) {
      expect(v).toBeCloseTo(3, 9);
    }
  });

  it("quantizes to whole encoder counts", () => {
    expect(quantize(0.00026, 0.0001)).toBeCloseTo(0.0003, 12);
    expect(quantize(-0.00024, 0.0001)).toBeCloseTo(-0.0002, 12);
  });
});
