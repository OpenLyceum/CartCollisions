import { CART_COLLISIONS_SCREEN_ICONS_SETTINGS } from "../CartCollisionsConstants.js";
/**
 * CartCollisionsScreenIcons.ts
 *
 * Home-screen / navigation-bar icons, drawn on the standard 548 × 373 canvas:
 * a track with the two carts posed for each screen's experiment.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import CartCollisionsColors from "../CartCollisionsColors.js";

const W = 548;
const H = 373;
const TRACK_Y: number = CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_Y;
const CART_W: number = CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_W;
const CART_H: number = CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_H;

function cart(x: number, color: "red" | "blue"): Node {
  const fill = color === "red" ? CartCollisionsColors.redCartColorProperty : CartCollisionsColors.blueCartColorProperty;
  return new Node({
    x,
    children: [
      new Rectangle(0, TRACK_Y - CART_H - 22, CART_W, CART_H, {
        fill,
        cornerRadius: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_CORNER_RADIUS,
      }),
      new Circle(CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_RADIUS, {
        x: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_X,
        y: TRACK_Y - CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_Y_OFFSET,
        fill: CartCollisionsColors.hardwareColorProperty,
      }),
      new Circle(CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_RADIUS, {
        x: CART_W - CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_X_OFFSET,
        y: TRACK_Y - CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CART_Y_OFFSET,
        fill: CartCollisionsColors.hardwareColorProperty,
      }),
    ],
  });
}

function track(): Node {
  return new Node({
    children: [
      new Rectangle(0, 0, W, H, { fill: CartCollisionsColors.backgroundColorProperty }),
      new Rectangle(
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_X,
        TRACK_Y,
        W - 40,
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_HEIGHT,
        { fill: CartCollisionsColors.trackColorProperty },
      ),
      new Rectangle(
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_X_SEGMENT_2,
        TRACK_Y - 40,
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_WIDTH,
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_HEIGHT_SEGMENT_2,
        {
          fill: CartCollisionsColors.hardwareColorProperty,
        },
      ),
      new Rectangle(
        W - 28,
        TRACK_Y - 40,
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_WIDTH,
        CART_COLLISIONS_SCREEN_ICONS_SETTINGS.TRACK_HEIGHT_SEGMENT_2,
        {
          fill: CartCollisionsColors.hardwareColorProperty,
        },
      ),
    ],
  });
}

const arrow = (x1: number, x2: number) =>
  new ArrowNode(x1, TRACK_Y - 140, x2, TRACK_Y - 140, {
    fill: CartCollisionsColors.textColorProperty,
    stroke: null,
    headHeight: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.ARROW_HEAD_HEIGHT,
    headWidth: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.ARROW_HEAD_WIDTH,
    tailWidth: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.ARROW_TAIL_WIDTH,
  });

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: CartCollisionsColors.backgroundColorProperty,
  });
}

export function createExplosionsIcon(): ScreenIcon {
  const burst = new Path(Shape.regularPolygon(8, CART_COLLISIONS_SCREEN_ICONS_SETTINGS.BURST_RADIUS), {
    x: W / 2,
    y: TRACK_Y - CART_COLLISIONS_SCREEN_ICONS_SETTINGS.BURST_Y_OFFSET,
    fill: CartCollisionsColors.fitLineColorProperty,
  });
  return iconFrom(
    new Node({
      children: [
        track(),
        cart(W / 2 - CART_W - 12, "red"),
        cart(W / 2 + 12, "blue"),
        burst,
        arrow(W / 2 - 60, W / 2 - 200),
        arrow(W / 2 + 60, W / 2 + 200),
      ],
    }),
  );
}

export function createInelasticIcon(): ScreenIcon {
  const velcro = new Rectangle(
    W / 2 - 6,
    TRACK_Y - CART_H - 10,
    CART_COLLISIONS_SCREEN_ICONS_SETTINGS.VELCRO_WIDTH,
    CART_H - 24,
    {
      fill: CartCollisionsColors.velcroColorProperty,
    },
  );
  return iconFrom(
    new Node({
      children: [
        track(),
        cart(W / 2 - CART_W - 6, "red"),
        cart(W / 2 + 6, "blue"),
        velcro,
        arrow(W / 2 - 60, W / 2 + 90),
      ],
    }),
  );
}

export function createElasticIcon(): ScreenIcon {
  const magnet = (x: number) =>
    new Rectangle(x, TRACK_Y - CART_H - 10, CART_COLLISIONS_SCREEN_ICONS_SETTINGS.MAGNET_WIDTH, CART_H - 24, {
      fill: CartCollisionsColors.magnetColorProperty,
    });
  return iconFrom(
    new Node({
      children: [
        track(),
        cart(60, "red"),
        cart(W - 60 - CART_W, "blue"),
        magnet(60 + CART_W),
        magnet(W - 70 - CART_W),
        arrow(W - 60 - CART_W / 2 - 40, W - 60 - CART_W / 2 + 80),
      ],
    }),
  );
}

export function createSmartCartsIcon(): ScreenIcon {
  const waves = new Node({ x: W / 2, y: TRACK_Y - CART_COLLISIONS_SCREEN_ICONS_SETTINGS.WAVES_Y_OFFSET });
  for (const radius of [30, 60, 90]) {
    waves.addChild(
      new Path(Shape.arc(0, 0, radius, -Math.PI * 0.8, -Math.PI * 0.2), {
        stroke: CartCollisionsColors.accentColorProperty,
        lineWidth: CART_COLLISIONS_SCREEN_ICONS_SETTINGS.CREATE_SMART_CARTS_ICON_LINE_WIDTH,
        lineCap: "round",
      }),
    );
  }
  return iconFrom(new Node({ children: [track(), cart(W / 2 - CART_W / 2, "red"), waves] }));
}
