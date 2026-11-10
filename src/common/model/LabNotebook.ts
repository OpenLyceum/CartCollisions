/**
 * LabNotebook.ts
 *
 * The student's copy of Tables 1 and 2 — one instance for the whole sim, built in
 * main.ts and handed to every screen, so the Explosions screen fills the first two
 * rows, the Inelastic screen the next two, and so on, and all six are visible from
 * any screen (the handout's tables span the whole lab).
 */

import { BooleanProperty, Property } from "scenerystack/axon";
import CartCollisionsNamespace from "../../CartCollisionsNamespace.js";
import {
  type ColumnId,
  computeDerived,
  DERIVED_COLUMNS,
  type DerivedColumn,
  type DerivedValues,
  MEASURED_COLUMNS,
  type MeasuredColumn,
  type MeasuredValues,
  ROW_IDS,
  type RowId,
} from "./labTables.js";

export class LabRow {
  public readonly cells: { readonly [K in ColumnId]: Property<number | null> };

  public readonly id: RowId;

  public constructor(id: RowId) {
    this.id = id;
    const cells: Partial<Record<ColumnId, Property<number | null>>> = {};
    for (const column of [...MEASURED_COLUMNS, ...DERIVED_COLUMNS]) {
      cells[column] = new Property<number | null>(null);
    }
    this.cells = cells as { readonly [K in ColumnId]: Property<number | null> };
  }

  public measuredValues(): MeasuredValues {
    const values: Partial<Record<MeasuredColumn, number | null>> = {};
    for (const column of MEASURED_COLUMNS) {
      values[column] = this.cells[column].value;
    }
    return values as MeasuredValues;
  }

  /** What each calculated cell should read, given this row's measurements. */
  public expected(): DerivedValues {
    return computeDerived(this.measuredValues());
  }

  public expectedFor(column: DerivedColumn): number | null {
    return this.expected()[column];
  }

  public reset(): void {
    for (const column of [...MEASURED_COLUMNS, ...DERIVED_COLUMNS]) {
      this.cells[column].reset();
    }
  }

  public dispose(): void {
    for (const column of [...MEASURED_COLUMNS, ...DERIVED_COLUMNS]) {
      this.cells[column].dispose();
    }
  }
}

export class LabNotebook {
  public readonly rows: { readonly [K in RowId]: LabRow };

  /** Mark each calculated cell right or wrong. */
  public readonly checkProperty = new BooleanProperty(false);

  /** Show the expected value next to each calculated cell. */
  public readonly showAnswersProperty = new BooleanProperty(false);

  public constructor() {
    const rows: Partial<Record<RowId, LabRow>> = {};
    for (const id of ROW_IDS) {
      rows[id] = new LabRow(id);
    }
    this.rows = rows as { readonly [K in RowId]: LabRow };
  }

  public reset(): void {
    for (const id of ROW_IDS) {
      this.rows[id].reset();
    }
    this.checkProperty.reset();
    this.showAnswersProperty.reset();
  }

  public dispose(): void {
    for (const id of ROW_IDS) {
      this.rows[id].dispose();
    }
    this.checkProperty.dispose();
    this.showAnswersProperty.dispose();
  }
}

CartCollisionsNamespace.register("LabNotebook", LabNotebook);
