/**
 * LabTablesDialog.ts
 *
 * The handout's Data Table 1 and Table 2 for all six runs, plus the conclusion
 * questions. Every cell is a button: press it and type a value on the keypad.
 * Velocities usually arrive from the fit panel and masses from the balance, but
 * any cell can be typed.
 *
 * "Check my calculations" colours each calculated cell against the value computed
 * from that row's own measurements; "Show expected values" prints that value
 * beneath. Measured cells are never graded — there is no right answer to a
 * measurement.
 *
 * One dialog per screen view, all bound to the one shared LabNotebook.
 */

import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, HBox, type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { Keypad, PhetFont } from "scenerystack/scenery-phet";
import { Dialog, KeypadDialog } from "scenerystack/sim";
import { Checkbox, RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import type { LabNotebook, LabRow } from "../model/LabNotebook.js";
import {
  type ColumnId,
  DERIVED_COLUMNS,
  type DerivedColumn,
  isClose,
  quantityOf,
  ROW_IDS,
  type RowId,
  TABLE_1_COLUMNS,
  TABLE_2_COLUMNS,
} from "../model/labTables.js";
import { formatQuantity } from "./formatting.js";
import { labTablesCsv } from "./labTablesCsv.js";

const CELL_WIDTH = 74;
const ROW_LABEL_WIDTH = 190;
const CELL_FONT = new PhetFont(11);
const HEADER_FONT = new PhetFont({ size: 11, weight: "bold" });
const TITLE_FONT = new PhetFont({ size: 14, weight: "bold" });
const DIALOG_TEXT_FILL = CartCollisionsColors.controlSurfaceTextColorProperty;

/** Largest magnitude a student may type into any cell. */
const ENTRY_LIMIT = 1000;

const isDerived = (column: ColumnId): column is DerivedColumn =>
  (DERIVED_COLUMNS as readonly string[]).includes(column);

/** Header text without markup, for accessible names and the CSV. */
export const plainHeader = (header: string): string => header.replace(/<sub>(.*?)<\/sub>/g, "_$1");

class TableCellNode extends RectangularPushButton {
  private readonly disposeTableCellNode: () => void;

  public constructor(row: LabRow, column: ColumnId, notebook: LabNotebook, keypadDialog: KeypadDialog) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();
    const valueProperty = row.cells[column];
    const quantity = quantityOf(column);

    const valueText = new Text("", { font: CELL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: CELL_WIDTH - 8 });
    const expectedText = new Text("", {
      font: new PhetFont(9),
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: CELL_WIDTH - 8,
    });

    // Everything the cell's appearance depends on, including the row's inputs.
    // (The cell's own Property is among the row's cells, so it is not listed twice.)
    const dependencies = [
      notebook.checkProperty,
      notebook.showAnswersProperty,
      labels.emptyStringProperty,
      ...Object.values(row.cells),
    ];

    const baseColor = DerivedProperty.deriveAny(dependencies, () => {
      if (!(isDerived(column) && notebook.checkProperty.value)) {
        return CartCollisionsColors.controlSurfaceColorProperty.value;
      }
      const expected = row.expectedFor(column);
      const entered = valueProperty.value;
      if (entered === null || expected === null) {
        return CartCollisionsColors.controlSurfaceColorProperty.value;
      }
      return isClose(column, entered, expected)
        ? CartCollisionsColors.correctColorProperty.value
        : CartCollisionsColors.incorrectColorProperty.value;
    });

    const accessibleName = new DerivedProperty(
      [
        valueProperty,
        labels.rows[`${row.id}StringProperty` as const],
        labels.columnNames[`${column}StringProperty` as const],
        labels.emptyStringProperty,
      ],
      (value, rowName, columnName, empty) =>
        StringUtils.fillIn(a11y.cellValuePatternStringProperty.value, {
          row: rowName,
          column: columnName,
          value: value === null ? empty : formatQuantity(value, quantity),
        }),
    );

    super({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      baseColor,
      content: new VBox({ spacing: 0, children: [valueText, expectedText], excludeInvisibleChildrenFromBounds: true }),
      minWidth: CELL_WIDTH,
      maxWidth: CELL_WIDTH,
      minHeight: 22,
      xMargin: 3,
      yMargin: 2,
      accessibleName,
      listener: () => {
        keypadDialog.beginEdit(
          (value: number) => {
            valueProperty.value = value;
          },
          new Range(-ENTRY_LIMIT, ENTRY_LIMIT),
          labels.keypadRangePatternStringProperty,
          () => undefined,
        );
      },
    });

    const appearance = Multilink.multilinkAny(dependencies, () => {
      const value = valueProperty.value;
      valueText.string = value === null ? labels.emptyStringProperty.value : formatQuantity(value, quantity);
      const expected = isDerived(column) ? row.expectedFor(column) : null;
      expectedText.visible = notebook.showAnswersProperty.value && expected !== null;
      expectedText.string = expected === null ? "" : `(${formatQuantity(expected, quantity)})`;
    });

    this.disposeTableCellNode = () => {
      appearance.dispose();
      baseColor.dispose();
      accessibleName.dispose();
    };
  }

  public override dispose(): void {
    this.disposeTableCellNode();
    super.dispose();
  }
}

function createTable(
  title: TReadOnlyProperty<string>,
  columns: readonly ColumnId[],
  notebook: LabNotebook,
  keypadDialog: KeypadDialog,
): Node {
  const labels = StringManager.getInstance().getLabels();
  const header = [
    new Text(labels.collisionTypeStringProperty, {
      font: HEADER_FONT,
      fill: DIALOG_TEXT_FILL,
      maxWidth: ROW_LABEL_WIDTH,
    }),
    ...columns.map(
      (column) =>
        new RichText(labels.columns[`${column}StringProperty`], {
          font: HEADER_FONT,
          fill: DIALOG_TEXT_FILL,
          maxWidth: CELL_WIDTH,
        }),
    ),
  ];
  const rows = ROW_IDS.map((rowId: RowId) => [
    new Text(labels.rows[`${rowId}StringProperty`], {
      font: CELL_FONT,
      fill: DIALOG_TEXT_FILL,
      maxWidth: ROW_LABEL_WIDTH,
      layoutOptions: { xAlign: "left" },
    }),
    ...columns.map((column) => new TableCellNode(notebook.rows[rowId], column, notebook, keypadDialog)),
  ]);
  const grid = new GridBox({ xSpacing: 3, ySpacing: 3, xAlign: "center", rows: [header, ...rows] });
  return new VBox({
    align: "left",
    spacing: 4,
    children: [new Text(title, { font: TITLE_FONT, fill: DIALOG_TEXT_FILL }), grid],
  });
}

export class LabTablesDialog extends Dialog {
  public constructor(notebook: LabNotebook) {
    const labels = StringManager.getInstance().getLabels();

    const keypadDialog = new KeypadDialog({
      keypadLayout: Keypad.PositiveAndNegativeFloatingPointLayout,
      keypadOptions: { accumulatorOptions: { maxDigits: 8, maxDigitsRightOfMantissa: 5 } },
    });

    const table1 = createTable(labels.table1StringProperty, TABLE_1_COLUMNS, notebook, keypadDialog);
    const table2 = createTable(labels.table2StringProperty, TABLE_2_COLUMNS, notebook, keypadDialog);

    const checkboxOptions = {
      checkboxColor: DIALOG_TEXT_FILL,
      checkboxColorBackground: CartCollisionsColors.controlSurfaceColorProperty,
      boxWidth: 14,
    };
    const checkbox = (property: typeof notebook.checkProperty, label: TReadOnlyProperty<string>) =>
      new Checkbox(property, new Text(label, { font: CELL_FONT, fill: DIALOG_TEXT_FILL, maxWidth: 200 }), {
        ...checkboxOptions,
        accessibleName: label,
      });

    const downloadCsv = () => {
      const csv = labTablesCsv(
        ROW_IDS,
        (row) => labels.rows[`${row}StringProperty`].value,
        (column) => plainHeader(labels.columns[`${column}StringProperty`].value),
        (row, column) => notebook.rows[row].cells[column].value,
        labels.collisionTypeStringProperty.value,
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cart-collisions-tables.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const pushButton = (label: TReadOnlyProperty<string>, listener: () => void) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        baseColor: CartCollisionsColors.panelBorderColorProperty,
        content: new Text(label, { font: CELL_FONT, fill: "white", maxWidth: 140 }),
        accessibleName: label,
        listener,
      });

    const controls = new HBox({
      spacing: 16,
      children: [
        checkbox(notebook.checkProperty, labels.checkStringProperty),
        checkbox(notebook.showAnswersProperty, labels.showAnswersStringProperty),
        pushButton(labels.downloadStringProperty, downloadCsv),
        pushButton(labels.clearTablesStringProperty, () => notebook.reset()),
      ],
    });

    const questionFont = new PhetFont(11);
    const questions = new VBox({
      align: "left",
      spacing: 3,
      children: [
        new Text(labels.conclusionTitleStringProperty, { font: HEADER_FONT, fill: DIALOG_TEXT_FILL }),
        ...[
          labels.conclusion1StringProperty,
          labels.conclusion2StringProperty,
          labels.conclusion3StringProperty,
          labels.conclusion4StringProperty,
        ].map(
          (question, i) =>
            new RichText(new DerivedProperty([question], (text) => `${i + 1}. ${text}`), {
              font: questionFont,
              fill: DIALOG_TEXT_FILL,
              lineWrap: 800,
            }),
        ),
      ],
    });

    super(new VBox({ align: "left", spacing: 10, children: [table1, table2, controls, questions] }), {
      title: new Text(labels.labTablesStringProperty, {
        font: new PhetFont({ size: 18, weight: "bold" }),
        fill: DIALOG_TEXT_FILL,
      }),
      fill: CartCollisionsColors.controlSurfaceColorProperty,
      leftMargin: 16,
      topMargin: 10,
      bottomMargin: 12,
      isDisposable: false,
    });
  }
}
