/**
 * FitPanel.ts
 *
 * Reads out the fit over the shaded interval for each cart, and sends a velocity
 * to the active row of Table 1. A velocity is the slope of the position fit, or the
 * mean of the velocity graph over the interval — both are what a student would do
 * with Capstone's tools. A force graph has no velocity to send.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { GridBox, type Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import { CartCollisionsPanel } from "../CartCollisionsPanel.js";
import type { LineFit } from "../model/fitMath.js";
import { GraphQuantity, type GraphQuantityValue } from "../model/GraphState.js";
import type { TLabModel } from "../model/LabModel.js";
import type { MeasuredColumn } from "../model/labTables.js";

const FONT = new PhetFont(12);
const SMALL_FONT = new PhetFont(11);

/** The velocity a fit gives, or null when it gives none. */
export function velocityFromFit(fit: LineFit | null, quantity: GraphQuantityValue): number | null {
  if (fit === null) {
    return null;
  }
  return quantity === GraphQuantity.POSITION ? fit.slope : quantity === GraphQuantity.VELOCITY ? fit.mean : null;
}

export class FitPanel extends CartCollisionsPanel {
  public readonly sendButtons: readonly Node[];

  /** The current fits as one sentence, for a screen-reader announcement. */
  public readonly describeFits: () => string;
  private readonly disposeFitPanel: () => void;

  public constructor(model: TLabModel, width: number) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();
    const graph = model.graph;

    const title = new Text(labels.fitTitleStringProperty, {
      font: new PhetFont({ size: 12, weight: "bold" }),
      fill: CartCollisionsColors.textColorProperty,
      maxWidth: width,
    });

    const rowName = DerivedProperty.deriveAny(
      [model.activeRowProperty, ...Object.values(labels.rows), labels.rowPatternStringProperty],
      () =>
        StringUtils.fillIn(labels.rowPatternStringProperty.value, {
          row: labels.rows[`${model.activeRowProperty.value}StringProperty` as const].value,
        }),
    );
    const rowText = new Text(rowName, {
      font: SMALL_FONT,
      fill: CartCollisionsColors.textColorProperty,
      maxWidth: width,
    });

    const readout = (
      cartName: TReadOnlyProperty<string>,
      pick: (fits: typeof graph.fitResultsProperty.value) => LineFit | null,
      fill: typeof CartCollisionsColors.redCartColorProperty,
    ) => {
      const text = new DerivedProperty(
        [
          graph.fitResultsProperty,
          graph.quantityProperty,
          cartName,
          labels.slopePatternStringProperty,
          labels.meanPatternStringProperty,
          labels.noFitPatternStringProperty,
        ],
        (fits, quantity, cart, slopePattern, meanPattern, noFitPattern) => {
          const fit = pick(fits);
          if (fit === null) {
            return StringUtils.fillIn(noFitPattern, { cart });
          }
          if (quantity === GraphQuantity.POSITION) {
            return StringUtils.fillIn(slopePattern, {
              cart,
              value: toFixed(fit.slope, 3),
              uncertainty: toFixed(fit.slopeUncertainty, 3),
            });
          }
          return StringUtils.fillIn(meanPattern, {
            cart,
            value: toFixed(fit.mean, quantity === GraphQuantity.VELOCITY ? 3 : 2),
            units: quantity === GraphQuantity.VELOCITY ? "m/s" : "N",
          });
        },
      );
      return { property: text, node: new Text(text, { font: FONT, fill, maxWidth: width - 140 }) };
    };

    const red = readout(labels.redStringProperty, (fits) => fits.red, CartCollisionsColors.redCartColorProperty);
    const blue = readout(labels.blueStringProperty, (fits) => fits.blue, CartCollisionsColors.blueCartColorProperty);

    const sendEnabled = (pick: (fits: typeof graph.fitResultsProperty.value) => LineFit | null) =>
      new DerivedProperty(
        [graph.fitResultsProperty, graph.quantityProperty],
        (fits, quantity) => velocityFromFit(pick(fits), quantity) !== null,
      );
    const redEnabled = sendEnabled((fits) => fits.red);
    const blueEnabled = sendEnabled((fits) => fits.blue);

    const send = (column: MeasuredColumn, pick: (fits: typeof graph.fitResultsProperty.value) => LineFit | null) => {
      const velocity = velocityFromFit(pick(graph.fitResultsProperty.value), graph.quantityProperty.value);
      if (velocity !== null) {
        model.notebook.rows[model.activeRowProperty.value].cells[column].value = Number(toFixed(velocity, 3));
      }
    };

    const button = (
      label: TReadOnlyProperty<string>,
      accessibleName: TReadOnlyProperty<string>,
      enabledProperty: TReadOnlyProperty<boolean>,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(label, { font: SMALL_FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 60 }),
        listener,
        enabledProperty,
        accessibleName,
        xMargin: 5,
        yMargin: 2,
      });

    const redBefore = button(labels.beforeStringProperty, a11y.sendRedBeforeStringProperty, redEnabled, () =>
      send("vRedInitial", (fits) => fits.red),
    );
    const redAfter = button(labels.afterStringProperty, a11y.sendRedAfterStringProperty, redEnabled, () =>
      send("vRedFinal", (fits) => fits.red),
    );
    const blueBefore = button(labels.beforeStringProperty, a11y.sendBlueBeforeStringProperty, blueEnabled, () =>
      send("vBlueInitial", (fits) => fits.blue),
    );
    const blueAfter = button(labels.afterStringProperty, a11y.sendBlueAfterStringProperty, blueEnabled, () =>
      send("vBlueFinal", (fits) => fits.blue),
    );

    const grid = new GridBox({
      xSpacing: 6,
      ySpacing: 4,
      xAlign: "left",
      rows: [
        [red.node, redBefore, redAfter],
        [blue.node, blueBefore, blueAfter],
      ],
    });

    super(new VBox({ align: "left", spacing: 5, children: [title, grid, rowText] }), {
      minWidth: width,
      maxWidth: width,
    });

    this.sendButtons = [redBefore, redAfter, blueBefore, blueAfter];

    this.describeFits = () =>
      StringUtils.fillIn(a11y.fitAnnouncementPatternStringProperty.value, {
        red: red.property.value,
        blue: blue.property.value,
      });

    this.disposeFitPanel = () => {
      rowName.dispose();
      red.property.dispose();
      blue.property.dispose();
      redEnabled.dispose();
      blueEnabled.dispose();
    };
  }

  public override dispose(): void {
    this.disposeFitPanel();
    super.dispose();
  }
}
