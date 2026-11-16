import { TRACK_NODE_SETTINGS } from "../../CartCollisionsConstants.js";
/**
 * TrackNode.ts
 *
 * The aluminium track with its metric ruler and the two end stops.
 */

import { Line, Node, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import CartCollisionsColors from "../../CartCollisionsColors.js";
import { TRACK_LENGTH } from "../../CartCollisionsConstants.js";
import type { TrackTransform } from "./TrackTransform.js";

/** Height of the track beam, in view pixels. */
const TRACK_HEIGHT: number = TRACK_NODE_SETTINGS.TRACK_HEIGHT;

const STOP_WIDTH: number = TRACK_NODE_SETTINGS.STOP_WIDTH;
const STOP_HEIGHT: number = TRACK_NODE_SETTINGS.STOP_HEIGHT;

export class TrackNode extends Node {
  public constructor(transform: TrackTransform, trackTop: number) {
    const left = transform.modelToViewX(0);
    const right = transform.modelToViewX(TRACK_LENGTH);

    const beam = new Rectangle(left - STOP_WIDTH, trackTop, right - left + 2 * STOP_WIDTH, TRACK_HEIGHT, {
      fill: CartCollisionsColors.trackColorProperty,
      stroke: CartCollisionsColors.rulerColorProperty,
      lineWidth: TRACK_NODE_SETTINGS.BEAM_LINE_WIDTH,
    });

    const ruler = new Node();
    for (let cm = 0; cm <= TRACK_LENGTH * 100 + 1e-6; cm += 1) {
      const x = transform.modelToViewX(cm / 100);
      const major = cm % 10 === 0;
      const tickLength = major ? 7 : cm % 5 === 0 ? 5 : 2.5;
      ruler.addChild(
        new Line(x, trackTop + 1, x, trackTop + 1 + tickLength, {
          stroke: CartCollisionsColors.rulerColorProperty,
          lineWidth: major ? 1 : 0.5,
        }),
      );
      if (major) {
        const label = new Text(`${cm}`, {
          font: new PhetFont(TRACK_NODE_SETTINGS.LABEL_FONT_SIZE),
          fill: CartCollisionsColors.rulerColorProperty,
          bottom: trackTop + TRACK_HEIGHT - 0.5,
        });
        // Keep the end labels inside the beam.
        if (cm === 0) {
          label.left = x + 2;
        } else if (cm >= TRACK_LENGTH * 100 - 1e-6) {
          label.right = x - 2;
        } else {
          label.centerX = x;
        }
        ruler.addChild(label);
      }
    }

    const stop = (x: number) =>
      new Rectangle(x, trackTop - STOP_HEIGHT + TRACK_HEIGHT, STOP_WIDTH, STOP_HEIGHT, {
        fill: CartCollisionsColors.hardwareColorProperty,
        cornerRadius: TRACK_NODE_SETTINGS.STOP_CORNER_RADIUS,
      });

    super({ children: [beam, ruler, stop(left - STOP_WIDTH), stop(right)] });
  }
}
