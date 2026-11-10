/**
 * SmartCartPanel.ts
 *
 * One real Smart Cart's connection: Connect / Disconnect, the cart's name or
 * connection state, any error, Change Sign, and a live position readout that moves
 * when the cart is pushed — the quickest check that the right cart is connected
 * and its sign is the way the student wants.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox, RectangularPushButton } from "scenerystack/sun";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/CartCollisionsButtonOptions.js";
import { CART_COLLISIONS_CHECKBOX_OPTIONS } from "../../common/CartCollisionsControlOptions.js";
import { CartCollisionsPanel } from "../../common/CartCollisionsPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { ConnectionState, type SmartCartChannel } from "../model/SmartCartChannel.js";

const FONT = new PhetFont(12);

export type SmartCartPanelOptions = {
  readonly title: TReadOnlyProperty<string>;
  readonly titleFill: typeof CartCollisionsColors.redCartColorProperty;
  readonly connectAccessibleName: TReadOnlyProperty<string>;
  readonly changeSignAccessibleName: TReadOnlyProperty<string>;
  readonly bluetoothAvailable: boolean;
  readonly width: number;
};

export class SmartCartPanel extends CartCollisionsPanel {
  public readonly connectButton: RectangularPushButton;
  public readonly changeSignCheckbox: Checkbox;

  public constructor(channel: SmartCartChannel, options: SmartCartPanelOptions) {
    const labels = StringManager.getInstance().getLabels();
    const innerWidth = options.width - 24;

    const status = new DerivedProperty(
      [
        channel.connectionStateProperty,
        channel.deviceNameProperty,
        labels.notConnectedStringProperty,
        labels.connectingStringProperty,
      ],
      (state, name, notConnected, connecting) =>
        state === ConnectionState.CONNECTED
          ? (name ?? "")
          : state === ConnectionState.CONNECTING
            ? connecting
            : notConnected,
    );
    const error = new DerivedProperty(
      [channel.errorMessageProperty, labels.connectionLostStringProperty],
      (message, lost) => (message === null ? "" : message === "disconnected" ? lost : message),
    );
    const live = new DerivedProperty(
      [channel.livePositionProperty, channel.connectionStateProperty, labels.livePositionPatternStringProperty],
      (position, state, pattern) =>
        state === ConnectionState.CONNECTED ? StringUtils.fillIn(pattern, { value: toFixed(position, 3) }) : "",
    );

    const buttonLabel = new DerivedProperty(
      [channel.connectionStateProperty, labels.connectStringProperty, labels.disconnectStringProperty],
      (state, connect, disconnect) => (state === ConnectionState.CONNECTED ? disconnect : connect),
    );
    const canPress = new DerivedProperty(
      [channel.connectionStateProperty],
      (state) => options.bluetoothAvailable && state !== ConnectionState.CONNECTING,
    );

    const connectButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(buttonLabel, {
        font: new PhetFont({ size: 13, weight: "bold" }),
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: 100,
      }),
      enabledProperty: canPress,
      accessibleName: options.connectAccessibleName,
      // Synchronous listener so the browser still sees a user gesture; connect() never rejects.
      listener: () => {
        if (channel.connectionStateProperty.value === ConnectionState.CONNECTED) {
          channel.disconnect().catch(() => undefined);
        } else {
          channel.connect().catch(() => undefined);
        }
      },
    });

    const changeSignCheckbox = new Checkbox(
      channel.changeSignProperty,
      new Text(labels.changeSignStringProperty, {
        font: FONT,
        fill: CartCollisionsColors.textColorProperty,
        maxWidth: innerWidth - 30,
      }),
      { ...CART_COLLISIONS_CHECKBOX_OPTIONS, accessibleName: options.changeSignAccessibleName },
    );

    super(
      new VBox({
        align: "left",
        spacing: 5,
        children: [
          new HBox({
            spacing: 10,
            children: [
              new Text(options.title, {
                font: new PhetFont({ size: 14, weight: "bold" }),
                fill: options.titleFill,
                maxWidth: 110,
              }),
              connectButton,
            ],
          }),
          new Text(status, { font: FONT, fill: CartCollisionsColors.textColorProperty, maxWidth: innerWidth }),
          new Text(error, {
            font: new PhetFont(11),
            fill: CartCollisionsColors.warningColorProperty,
            maxWidth: innerWidth,
          }),
          changeSignCheckbox,
          new Text(live, { font: FONT, fill: CartCollisionsColors.textColorProperty, maxWidth: innerWidth }),
        ],
      }),
      { minWidth: options.width, maxWidth: options.width },
    );

    this.connectButton = connectButton;
    this.changeSignCheckbox = changeSignCheckbox;
  }
}
