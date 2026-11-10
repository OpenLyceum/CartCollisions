/**
 * ExperimentControlPanel.ts
 *
 * The bench controls for one virtual run: which masses, how the run starts
 * (plunger position + trigger, or push speed + push), putting the carts back,
 * and each cart's Change Sign setting.
 */

import { DerivedProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { CONTROL_COLUMN_WIDTH, PLUNGER_COMPRESSIONS } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../CartCollisionsButtonOptions.js";
import {
  CART_COLLISIONS_CHECKBOX_OPTIONS,
  CART_COLLISIONS_NUMBER_CONTROL_OPTIONS,
} from "../CartCollisionsControlOptions.js";
import { CartCollisionsPanel } from "../CartCollisionsPanel.js";
import type { CartCollisionsModel } from "../model/CartCollisionsModel.js";
import { Experiment, MassMode, type MassModeValue } from "../model/LabModel.js";

const FONT = new PhetFont(12);
const TITLE_FONT = new PhetFont({ size: 12, weight: "bold" });
const INNER_WIDTH = CONTROL_COLUMN_WIDTH - 24;

const label = (
  string: TReadOnlyProperty<string>,
  maxWidth = INNER_WIDTH - 24,
  fill = CartCollisionsColors.textColorProperty,
) => new Text(string, { font: FONT, fill, maxWidth });

export function createMassModeRadioButtons(property: Property<MassModeValue>) {
  const labels = StringManager.getInstance().getLabels();
  return new AquaRadioButtonGroup<MassModeValue>(
    property,
    [
      {
        value: MassMode.EQUAL,
        createNode: () => label(labels.equalMassStringProperty),
        options: { accessibleName: labels.equalMassStringProperty },
      },
      {
        value: MassMode.UNEQUAL,
        createNode: () => label(labels.unequalMassStringProperty),
        options: { accessibleName: labels.unequalMassStringProperty },
      },
    ],
    { spacing: 5, radioButtonOptions: { radius: 6 }, accessibleName: labels.massSetupStringProperty },
  );
}

export class ExperimentControlPanel extends CartCollisionsPanel {
  /** Focusable controls in traversal order. */
  public readonly traversal: Node[];

  public constructor(model: CartCollisionsModel) {
    const labels = StringManager.getInstance().getLabels();
    const a11y = StringManager.getInstance().getA11yStrings();

    const massRadio = createMassModeRadioButtons(model.massModeProperty);

    const actionButton = (
      string: TReadOnlyProperty<string>,
      listener: () => void,
      enabledProperty?: TReadOnlyProperty<boolean>,
    ) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(string, {
          font: new PhetFont({ size: 13, weight: "bold" }),
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: INNER_WIDTH - 20,
        }),
        listener,
        accessibleName: string,
        ...(enabledProperty && { enabledProperty }),
        minWidth: INNER_WIDTH,
      });

    const children: Node[] = [
      new Text(labels.massSetupStringProperty, { font: TITLE_FONT, fill: CartCollisionsColors.textColorProperty }),
      massRadio,
    ];
    const traversal: Node[] = [massRadio];
    const derived: { dispose(): void }[] = [];

    if (model.experiment === Experiment.EXPLOSION) {
      const plungerRadio = new AquaRadioButtonGroup<number>(
        model.plungerSettingProperty,
        PLUNGER_COMPRESSIONS.map((_, i) => ({
          value: i + 1,
          createNode: () => new Text(`${i + 1}`, { font: FONT, fill: CartCollisionsColors.textColorProperty }),
          options: {
            accessibleName: new DerivedProperty([labels.plungerSettingStringProperty], (s) => `${s} ${i + 1}`),
          },
        })),
        {
          orientation: "horizontal",
          spacing: 12,
          radioButtonOptions: { radius: 6 },
          accessibleName: labels.plungerSettingStringProperty,
        },
      );
      const canTrigger = new DerivedProperty([model.plungerReleasedProperty], (released) => !released);
      derived.push(canTrigger);
      const triggerButton = actionButton(labels.triggerStringProperty, () => model.trigger(), canTrigger);
      children.push(
        new HBox({ spacing: 8, children: [label(labels.plungerSettingStringProperty, 110), plungerRadio] }),
        triggerButton,
      );
      traversal.push(plungerRadio, triggerButton);
    } else {
      const pushSpeedControl = new NumberControl(
        labels.pushSpeedStringProperty,
        model.pushSpeedProperty,
        model.pushSpeedProperty.range,
        {
          ...CART_COLLISIONS_NUMBER_CONTROL_OPTIONS,
          delta: 0.05,
          titleNodeOptions: { font: FONT, fill: CartCollisionsColors.textColorProperty, maxWidth: 110 },
          numberDisplayOptions: {
            decimalPlaces: 2,
            valuePattern: "{{value}} m/s",
            textOptions: { font: FONT },
          },
          sliderOptions: {
            ...CART_COLLISIONS_NUMBER_CONTROL_OPTIONS.sliderOptions,
            constrainValue: (value: number) => Number(toFixed(value, 2)),
          },
        },
      );
      const canPush = new DerivedProperty([model.isMovingProperty], (moving) => !moving);
      derived.push(canPush);
      const pushButton = actionButton(labels.pushStringProperty, () => model.push(), canPush);
      children.push(pushSpeedControl, pushButton);
      traversal.push(pushSpeedControl, pushButton);
    }

    const resetCartsButton = actionButton(labels.resetCartsStringProperty, () => model.resetCarts());

    const changeSign = (
      property: typeof model.redChangeSignProperty,
      cart: TReadOnlyProperty<string>,
      name: TReadOnlyProperty<string>,
      fill: typeof CartCollisionsColors.redCartColorProperty,
    ) =>
      new Checkbox(
        property,
        new HBox({ spacing: 4, children: [label(cart, 70, fill), label(labels.changeSignStringProperty, 110)] }),
        { ...CART_COLLISIONS_CHECKBOX_OPTIONS, accessibleName: name },
      );
    const redSign = changeSign(
      model.redChangeSignProperty,
      labels.redStringProperty,
      a11y.redChangeSignStringProperty,
      CartCollisionsColors.redCartColorProperty,
    );
    const blueSign = changeSign(
      model.blueChangeSignProperty,
      labels.blueStringProperty,
      a11y.blueChangeSignStringProperty,
      CartCollisionsColors.blueCartColorProperty,
    );

    children.push(resetCartsButton, redSign, blueSign);
    traversal.push(resetCartsButton, redSign, blueSign);

    super(new VBox({ align: "left", spacing: 7, children }), {
      minWidth: CONTROL_COLUMN_WIDTH,
      maxWidth: CONTROL_COLUMN_WIDTH,
    });
    this.traversal = traversal;
  }
}
