/**
 * CartNode.ts
 *
 * One Smart Cart seen from the side: coloured body, wheels, the bumper that faces
 * the other cart (plunger, Velcro or magnet), and any mass bars it carries.
 *
 * Drawn with its origin at the cart's centre on the track's top surface, so the
 * owner only has to set `x`. Optionally draggable along the track by pointer or
 * keyboard; the model decides whether a drag is allowed and where the cart ends up.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, RichDragListener, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { CART_LENGTH, PLUNGER_COMPRESSIONS } from "../../CartCollisionsConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { Bumper, type BumperValue } from "../model/collisionPhysics.js";
import type { TrackTransform } from "./TrackTransform.js";

const BODY_HEIGHT = 30;
const WHEEL_RADIUS = 6;
const BAR_HEIGHT = 9;
const BUMPER_WIDTH = 5;

export type CartNodeOptions = {
  readonly color: "red" | "blue";
  readonly bumper: BumperValue;
  readonly transform: TrackTransform;
  readonly positionProperty: TReadOnlyProperty<number>;
  readonly barCountProperty?: TReadOnlyProperty<number>;
  /** Whether the plunger has been released (red cart, explosions). */
  readonly plungerReleasedProperty?: TReadOnlyProperty<boolean>;
  readonly plungerSettingProperty?: TReadOnlyProperty<number>;
  /** When given, the cart can be dragged; called with the requested track position (m). */
  readonly drag?: (position: number) => void;
  readonly accessibleName?: TReadOnlyProperty<string>;
  readonly accessibleHelpText?: TReadOnlyProperty<string>;
};

export class CartNode extends Node {
  private readonly disposeCartNode: () => void;

  public constructor(options: CartNodeOptions) {
    const { transform } = options;
    const width = transform.modelToViewDelta(CART_LENGTH);
    const halfWidth = width / 2;
    const facesRight = options.color === "red";
    const fill =
      options.color === "red" ? CartCollisionsColors.redCartColorProperty : CartCollisionsColors.blueCartColorProperty;

    const bodyBottom = -WHEEL_RADIUS * 1.2;
    const body = new Rectangle(-halfWidth, bodyBottom - BODY_HEIGHT, width, BODY_HEIGHT, {
      fill,
      stroke: CartCollisionsColors.hardwareColorProperty,
      lineWidth: 1,
      cornerRadius: 4,
    });
    const label = new Text(StringManager.getInstance().getLabels().smartCartStringProperty, {
      font: new PhetFont({ size: 9, weight: "bold" }),
      fill: "white",
      centerX: 0,
      centerY: bodyBottom - BODY_HEIGHT / 2,
      maxWidth: width - 16,
    });
    const wheels = [-halfWidth + 14, halfWidth - 14].map(
      (x) =>
        new Circle(WHEEL_RADIUS, {
          x,
          y: -WHEEL_RADIUS,
          fill: CartCollisionsColors.hardwareColorProperty,
          stroke: CartCollisionsColors.trackColorProperty,
        }),
    );

    // The bumper on the end that faces the other cart.
    const facing = facesRight ? 1 : -1;
    const bumperX = facesRight ? halfWidth : -halfWidth - BUMPER_WIDTH;
    const bumperY = bodyBottom - BODY_HEIGHT * 0.75;
    const bumperNode = new Node();
    if (options.bumper === Bumper.VELCRO) {
      bumperNode.addChild(
        new Rectangle(bumperX, bumperY, BUMPER_WIDTH, BODY_HEIGHT * 0.5, {
          fill: CartCollisionsColors.velcroColorProperty,
        }),
      );
    } else if (options.bumper === Bumper.MAGNET) {
      bumperNode.addChild(
        new Rectangle(bumperX, bumperY, BUMPER_WIDTH, BODY_HEIGHT * 0.5, {
          fill: CartCollisionsColors.magnetColorProperty,
          stroke: CartCollisionsColors.hardwareColorProperty,
          lineWidth: 0.5,
        }),
      );
    }

    // Plunger rod: flush when latched, extended once released.
    const plunger = new Path(null, {
      fill: CartCollisionsColors.hardwareColorProperty,
    });
    if (options.bumper === Bumper.PLUNGER && facesRight) {
      bumperNode.addChild(plunger);
    }

    const bars = new Node();
    const children: Node[] = [bars, ...wheels, body, label, bumperNode];

    super({ children, cursor: options.drag ? "ew-resize" : null });

    const links: { dispose: () => void }[] = [];

    links.push(
      Multilink.multilink([options.positionProperty], (position) => {
        this.x = transform.modelToViewX(position);
      }),
    );

    if (options.barCountProperty) {
      links.push(
        Multilink.multilink([options.barCountProperty], (count) => {
          bars.children = Array.from(
            { length: count },
            (_, i) =>
              new Rectangle(
                -halfWidth + 10,
                bodyBottom - BODY_HEIGHT - (i + 1) * BAR_HEIGHT,
                width - 20,
                BAR_HEIGHT - 1,
                {
                  fill: CartCollisionsColors.massBarColorProperty,
                  stroke: CartCollisionsColors.hardwareColorProperty,
                  lineWidth: 0.5,
                  cornerRadius: 1,
                },
              ),
          );
        }),
      );
    }

    if (options.plungerReleasedProperty && options.plungerSettingProperty && options.bumper === Bumper.PLUNGER) {
      links.push(
        Multilink.multilink([options.plungerReleasedProperty, options.plungerSettingProperty], (released, setting) => {
          const extension = released ? transform.modelToViewDelta(PLUNGER_COMPRESSIONS[setting - 1] ?? 0) : 1.5;
          const rodY = bumperY + BODY_HEIGHT * 0.2;
          plunger.shape = Shape.rect(halfWidth, rodY, extension, 4).rect(
            halfWidth + extension - 2,
            rodY - 4,
            3 * facing,
            12,
          );
        }),
      );
    }

    if (options.drag) {
      const drag = options.drag;
      this.tagName = "div";
      this.focusable = true;
      if (options.accessibleName) {
        this.accessibleName = options.accessibleName;
      }
      if (options.accessibleHelpText) {
        this.accessibleHelpText = options.accessibleHelpText;
      }
      let grabOffset = 0;
      const listener = new RichDragListener({
        dragListenerOptions: {
          start: (event) => {
            const parent = this.parents[0];
            if (parent) {
              grabOffset = parent.globalToLocalPoint(event.pointer.point).x - this.x;
            }
          },
          drag: (event) => {
            const parent = this.parents[0];
            if (parent) {
              drag(transform.viewToModelX(parent.globalToLocalPoint(event.pointer.point).x - grabOffset));
            }
          },
        },
        keyboardDragListenerOptions: {
          keyboardDragDirection: "leftRight",
          dragDelta: 10,
          shiftDragDelta: 2,
          drag: (_event, keyboardListener) => {
            drag(options.positionProperty.value + keyboardListener.modelDelta.x / transform.scale);
          },
        },
      });
      this.addInputListener(listener);
      links.push(listener);
    }

    this.disposeCartNode = () => {
      for (const link of links) {
        link.dispose();
      }
    };
  }

  public override dispose(): void {
    this.disposeCartNode();
    super.dispose();
  }
}
