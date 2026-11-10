import { describe, expect, it } from "vitest";
import { computeDerived, isClose, type MeasuredValues } from "../src/common/model/labTables.js";
import { CSV_COLUMNS, labTablesCsv } from "../src/common/view/labTablesCsv.js";

const elastic: MeasuredValues = {
  massRed: 0.25,
  massBlue: 0.75,
  vRedInitial: 0.4,
  vBlueInitial: 0,
  vRedFinal: -0.2,
  vBlueFinal: 0.2,
};

describe("labTables", () => {
  it("computes Δv, Δp and kinetic energies from a row's measurements", () => {
    const d = computeDerived(elastic);
    expect(d.dvRed).toBeCloseTo(-0.6, 12);
    expect(d.dvBlue).toBeCloseTo(0.2, 12);
    expect(d.dpRed).toBeCloseTo(-0.15, 12);
    expect(d.dpBlue).toBeCloseTo(0.15, 12);
    expect(d.eRedInitial).toBeCloseTo(0.02, 12);
    expect(d.eBlueFinal).toBeCloseTo(0.015, 12);
    expect(d.dE).toBeCloseTo(0, 12);
    expect(d.dERatio).toBeCloseTo(0, 9);
  });

  it("leaves a cell empty when an input is missing, and ΔE/Eᵢ undefined for an explosion", () => {
    expect(computeDerived({ ...elastic, vBlueFinal: null }).dvBlue).toBeNull();
    const explosion = computeDerived({ ...elastic, vRedInitial: 0, vRedFinal: -0.3 });
    expect(explosion.dE).toBeGreaterThan(0);
    expect(explosion.dERatio).toBeNull();
  });

  it("accepts values within rounding and rejects real mistakes", () => {
    expect(isClose("dpBlue", 0.151, 0.15)).toBe(true);
    expect(isClose("dpBlue", 0.3, 0.15)).toBe(false);
    expect(isClose("dERatio", -49.6, -50)).toBe(true);
    expect(isClose("eRedInitial", 0.0201, 0.02)).toBe(true);
  });

  it("writes both tables as one CSV, blank for empty cells", () => {
    const csv = labTablesCsv(
      ["elasticUnequal"],
      () => "Elastic, unequal",
      (column) => column,
      (_row, column) => (column === "massRed" ? 0.25 : null),
      "Collision type",
    );
    const [header, row] = csv.trim().split("\n");
    expect(header?.split(",").length).toBe(CSV_COLUMNS.length + 1);
    expect(row?.startsWith('"Elastic, unequal",0.25000,')).toBe(true);
  });
});
