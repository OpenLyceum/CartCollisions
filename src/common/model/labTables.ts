/**
 * labTables.ts
 *
 * The handout's Data Table 1 and Table 2 as plain data: which rows and columns
 * exist, and the formulas that turn a row's measurements into its analysis cells.
 * Pure, no SceneryStack imports.
 *
 * Analysis cells are checked against values computed from the student's *own*
 * Table 1 entries for that row — the lab grades the arithmetic, not how close the
 * measured velocities came to some hidden truth (on the Smart Carts screen there
 * is none).
 */

/** The six runs, in the handout's order. */
export const ROW_IDS = [
  "explosionEqual",
  "explosionUnequal",
  "inelasticEqual",
  "inelasticUnequal",
  "elasticEqual",
  "elasticUnequal",
] as const;

export type RowId = (typeof ROW_IDS)[number];

/** Table 1 cells the student measures (balance and graph fits). */
export const MEASURED_COLUMNS = [
  "massRed",
  "massBlue",
  "vRedInitial",
  "vBlueInitial",
  "vRedFinal",
  "vBlueFinal",
] as const;

export type MeasuredColumn = (typeof MEASURED_COLUMNS)[number];

/** Cells the student calculates: Table 1's Δv columns, then all of Table 2. */
export const DERIVED_COLUMNS = [
  "dvBlue",
  "dvRed",
  "dpBlue",
  "dpRed",
  "eRedInitial",
  "eBlueInitial",
  "eRedFinal",
  "eBlueFinal",
  "dE",
  "dERatio",
] as const;

export type DerivedColumn = (typeof DERIVED_COLUMNS)[number];

export type ColumnId = MeasuredColumn | DerivedColumn;

/** Table 1, left to right, as in the handout. */
export const TABLE_1_COLUMNS: readonly ColumnId[] = [...MEASURED_COLUMNS, "dvBlue", "dvRed"];

/** Table 2, left to right, as in the handout. */
export const TABLE_2_COLUMNS: readonly ColumnId[] = [
  "dpBlue",
  "dpRed",
  "eRedInitial",
  "eBlueInitial",
  "eRedFinal",
  "eBlueFinal",
  "dE",
  "dERatio",
];

/** The physical quantity in a column, which sets its unit and tolerance. */
export type Quantity = "mass" | "velocity" | "momentum" | "energy" | "percent";

export function quantityOf(column: ColumnId): Quantity {
  if (column === "massRed" || column === "massBlue") {
    return "mass";
  }
  if (column === "dpBlue" || column === "dpRed") {
    return "momentum";
  }
  if (column === "dERatio") {
    return "percent";
  }
  if (column.startsWith("e") || column === "dE") {
    return "energy";
  }
  return "velocity";
}

/** Absolute tolerance floor per quantity, below which a relative tolerance would be too strict. */
const ABSOLUTE_TOLERANCE: Record<Quantity, number> = {
  mass: 0.0005,
  velocity: 0.002,
  momentum: 0.001,
  energy: 0.0005,
  percent: 1,
};

/** Relative tolerance for a calculated cell — allows for rounding the inputs to 3 figures. */
export const RELATIVE_TOLERANCE = 0.02;

export type MeasuredValues = { readonly [K in MeasuredColumn]: number | null };
export type DerivedValues = { readonly [K in DerivedColumn]: number | null };

const ke = (m: number | null, v: number | null): number | null => (m === null || v === null ? null : 0.5 * m * v * v);
const difference = (a: number | null, b: number | null): number | null => (a === null || b === null ? null : a - b);
const product = (a: number | null, b: number | null): number | null => (a === null || b === null ? null : a * b);

/**
 * Every analysis cell for one row, from its measurements; null where an input is
 * missing. ΔE/Eᵢ is a percentage, and null when Eᵢ is zero (an explosion starts at
 * rest, so its fractional change is undefined — the handout's question about
 * "where the extra energy came from" is the point there).
 */
export function computeDerived(m: MeasuredValues): DerivedValues {
  const dvBlue = difference(m.vBlueFinal, m.vBlueInitial);
  const dvRed = difference(m.vRedFinal, m.vRedInitial);
  const eRedInitial = ke(m.massRed, m.vRedInitial);
  const eBlueInitial = ke(m.massBlue, m.vBlueInitial);
  const eRedFinal = ke(m.massRed, m.vRedFinal);
  const eBlueFinal = ke(m.massBlue, m.vBlueFinal);
  const initial = eRedInitial === null || eBlueInitial === null ? null : eRedInitial + eBlueInitial;
  const final = eRedFinal === null || eBlueFinal === null ? null : eRedFinal + eBlueFinal;
  const dE = difference(final, initial);
  const dERatio = dE === null || initial === null || Math.abs(initial) < 1e-12 ? null : (100 * dE) / initial;
  return {
    dvBlue,
    dvRed,
    dpBlue: product(m.massBlue, dvBlue),
    dpRed: product(m.massRed, dvRed),
    eRedInitial,
    eBlueInitial,
    eRedFinal,
    eBlueFinal,
    dE,
    dERatio,
  };
}

/** Whether an entered value matches the expected one, within rounding. */
export function isClose(column: ColumnId, entered: number, expected: number): boolean {
  const tolerance = Math.max(RELATIVE_TOLERANCE * Math.abs(expected), ABSOLUTE_TOLERANCE[quantityOf(column)]);
  return Math.abs(entered - expected) <= tolerance;
}
