/**
 * labTablesCsv.ts
 *
 * Tables 1 and 2 as one CSV file, a row per run — what a student pastes into a
 * spreadsheet or hands in. Pure, so the column order is pinned by tests.
 */

import { toFixed } from "scenerystack/dot";
import { type ColumnId, quantityOf, type RowId, TABLE_1_COLUMNS, TABLE_2_COLUMNS } from "../model/labTables.js";
import { DECIMALS } from "./formatting.js";

/** Both tables' columns, in order, with Table 1's Δv columns kept in Table 1. */
export const CSV_COLUMNS: readonly ColumnId[] = [...TABLE_1_COLUMNS, ...TABLE_2_COLUMNS];

const quote = (text: string) => `"${text.replace(/"/g, '""')}"`;

export function labTablesCsv(
  rows: readonly RowId[],
  rowName: (row: RowId) => string,
  columnName: (column: ColumnId) => string,
  value: (row: RowId, column: ColumnId) => number | null,
  typeHeading: string,
): string {
  const lines = [[quote(typeHeading), ...CSV_COLUMNS.map((column) => quote(columnName(column)))].join(",")];
  for (const row of rows) {
    const cells = CSV_COLUMNS.map((column) => {
      const v = value(row, column);
      return v === null ? "" : toFixed(v, DECIMALS[quantityOf(column)] + 1);
    });
    lines.push([quote(rowName(row)), ...cells].join(","));
  }
  return `${lines.join("\n")}\n`;
}
