import { LAB_TABLES_DIALOG_SETTINGS } from "../../CartCollisionsConstants.js";
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

const CELL_WIDTH: number = LAB_TABLES_DIALOG_SETTINGS.CELL_WIDTH;
const ROW_LABEL_WIDTH: number = LAB_TABLES_DIALOG_SETTINGS.ROW_LABEL_WIDTH;
const CELL_FONT = new PhetFont(LAB_TABLES_DIALOG_SETTINGS.CELL_FONT_SIZE);
const HEADER_FONT = new PhetFont({ size: LAB_TABLES_DIALOG_SETTINGS.HEADER_FONT_SIZE, weight: "bold" });
const TITLE_FONT = new PhetFont({ size: LAB_TABLES_DIALOG_SETTINGS.TITLE_FONT_SIZE, weight: "bold" });
const DIALOG_TEXT_FILL = CartCollisionsColors.controlSurfaceTextColorProperty;

/** Largest magnitude a student may type into any cell. */
const ENTRY_LIMIT: number = LAB_TABLES_DIALOG_SETTINGS.ENTRY_LIMIT;

const isDerived = (column: ColumnId): column is DerivedColumn =>
  (DERIVED_COLUMNS as readonly string[]).includes(column);

/** Header text without markup, for accessible names and the CSV. */
const plainHeader = (header: string): string => header.replace(/<sub>(.*?)<\/sub>/g, "_$1");

class TableCellNode extends RectangularPushButton {
  private readonly disposeTableCellNode: () => void;

  public constructor(row: LabRow, column: ColumnId, notebook: LabNotebook, keypadDialog: KeypadDialog) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();
    const valueProperty = row.cells[column];
    const quantity = quantityOf(column);

    const valueText = new Text("", {
      font: CELL_FONT,
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: CELL_WIDTH - LAB_TABLES_DIALOG_SETTINGS.VALUE_TEXT_MAX_WIDTH_OFFSET,
    });
    const expectedText = new Text("", {
      font: new PhetFont(LAB_TABLES_DIALOG_SETTINGS.EXPECTED_TEXT_FONT_SIZE),
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: CELL_WIDTH - LAB_TABLES_DIALOG_SETTINGS.EXPECTED_TEXT_MAX_WIDTH_OFFSET,
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

    const accessibleNameProperty = new DerivedProperty(
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
      minHeight: LAB_TABLES_DIALOG_SETTINGS.CELL_MIN_HEIGHT,
      xMargin: LAB_TABLES_DIALOG_SETTINGS.CELL_X_MARGIN,
      yMargin: LAB_TABLES_DIALOG_SETTINGS.CELL_Y_MARGIN,
      accessibleName: accessibleNameProperty,
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
      accessibleNameProperty.dispose();
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
  const grid = new GridBox({
    xSpacing: LAB_TABLES_DIALOG_SETTINGS.GRID_X_SPACING,
    ySpacing: LAB_TABLES_DIALOG_SETTINGS.GRID_Y_SPACING,
    xAlign: "center",
    rows: [header, ...rows],
  });
  return new VBox({
    align: "left",
    spacing: LAB_TABLES_DIALOG_SETTINGS.CREATE_TABLE_SPACING,
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
      boxWidth: LAB_TABLES_DIALOG_SETTINGS.CHECKBOX_OPTIONS_BOX_WIDTH,
    };
    const checkbox = (property: typeof notebook.checkProperty, label: TReadOnlyProperty<string>) =>
      new Checkbox(
        property,
        new Text(label, {
          font: CELL_FONT,
          fill: DIALOG_TEXT_FILL,
          maxWidth: LAB_TABLES_DIALOG_SETTINGS.CHECKBOX_MAX_WIDTH,
        }),
        {
          ...checkboxOptions,
          accessibleName: label,
        },
      );

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
        content: new Text(label, {
          font: CELL_FONT,
          fill: CartCollisionsColors.accentButtonTextColorProperty,
          maxWidth: LAB_TABLES_DIALOG_SETTINGS.PUSH_BUTTON_MAX_WIDTH,
        }),
        accessibleName: label,
        listener,
      });

    const controls = new HBox({
      spacing: LAB_TABLES_DIALOG_SETTINGS.CONTROLS_SPACING,
      children: [
        checkbox(notebook.checkProperty, labels.checkStringProperty),
        checkbox(notebook.showAnswersProperty, labels.showAnswersStringProperty),
        pushButton(labels.downloadStringProperty, downloadCsv),
        pushButton(labels.clearTablesStringProperty, () => notebook.reset()),
      ],
    });

    const questionFont = new PhetFont(LAB_TABLES_DIALOG_SETTINGS.QUESTION_FONT_SIZE);
    const questions = new VBox({
      align: "left",
      spacing: LAB_TABLES_DIALOG_SETTINGS.QUESTIONS_SPACING,
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
              lineWrap: LAB_TABLES_DIALOG_SETTINGS.QUESTIONS_LINE_WRAP,
            }),
        ),
      ],
    });

    super(
      new VBox({
        align: "left",
        spacing: LAB_TABLES_DIALOG_SETTINGS.TITLE_SPACING,
        children: [table1, table2, controls, questions],
      }),
      {
        title: new Text(labels.labTablesStringProperty, {
          font: new PhetFont({ size: LAB_TABLES_DIALOG_SETTINGS.DIALOG_TITLE_FONT_SIZE, weight: "bold" }),
          fill: DIALOG_TEXT_FILL,
        }),
        fill: CartCollisionsColors.controlSurfaceColorProperty,
        leftMargin: 16,
        topMargin: 10,
        bottomMargin: 12,
        isDisposable: false,
      },
    );
  }
}
