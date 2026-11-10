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
const TRACK_Y = 250;
const CART_W = 150;
const CART_H = 70;

function cart(x: number, color: "red" | "blue"): Node {
  const fill = color === "red" ? CartCollisionsColors.redCartColorProperty : CartCollisionsColors.blueCartColorProperty;
  return new Node({
    x,
    children: [
      new Rectangle(0, TRACK_Y - CART_H - 22, CART_W, CART_H, { fill, cornerRadius: 8 }),
      new Circle(14, { x: 32, y: TRACK_Y - 14, fill: CartCollisionsColors.hardwareColorProperty }),
      new Circle(14, { x: CART_W - 32, y: TRACK_Y - 14, fill: CartCollisionsColors.hardwareColorProperty }),
    ],
  });
}

function track(): Node {
  return new Node({
    children: [
      new Rectangle(0, 0, W, H, { fill: CartCollisionsColors.backgroundColorProperty }),
      new Rectangle(20, TRACK_Y, W - 40, 22, { fill: CartCollisionsColors.trackColorProperty }),
      new Rectangle(14, TRACK_Y - 40, 14, 62, { fill: CartCollisionsColors.hardwareColorProperty }),
      new Rectangle(W - 28, TRACK_Y - 40, 14, 62, { fill: CartCollisionsColors.hardwareColorProperty }),
    ],
  });
}

const arrow = (x1: number, x2: number) =>
  new ArrowNode(x1, TRACK_Y - 140, x2, TRACK_Y - 140, {
    fill: CartCollisionsColors.textColorProperty,
    stroke: null,
    headHeight: 26,
    headWidth: 34,
    tailWidth: 12,
  });

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: CartCollisionsColors.backgroundColorProperty,
  });
}

export function createExplosionsIcon(): ScreenIcon {
  const burst = new Path(Shape.regularPolygon(8, 34), {
    x: W / 2,
    y: TRACK_Y - 57,
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
  const velcro = new Rectangle(W / 2 - 6, TRACK_Y - CART_H - 10, 12, CART_H - 24, {
    fill: CartCollisionsColors.velcroColorProperty,
  });
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
    new Rectangle(x, TRACK_Y - CART_H - 10, 10, CART_H - 24, { fill: CartCollisionsColors.magnetColorProperty });
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
  const waves = new Node({ x: W / 2, y: TRACK_Y - 120 });
  for (const radius of [30, 60, 90]) {
    waves.addChild(
      new Path(Shape.arc(0, 0, radius, -Math.PI * 0.8, -Math.PI * 0.2), {
        stroke: CartCollisionsColors.accentColorProperty,
        lineWidth: 12,
        lineCap: "round",
      }),
    );
  }
  return iconFrom(new Node({ children: [track(), cart(W / 2 - CART_W / 2, "red"), waves] }));
}
