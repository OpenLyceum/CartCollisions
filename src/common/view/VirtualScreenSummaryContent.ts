/**
 * VirtualScreenSummaryContent.ts
 *
 * Screen summary for the three virtual screens. Current details are live: both
 * carts' velocities, the total momentum and kinetic energy, and whether a
 * recording is running — rounded so the paragraph only changes when the numbers a
 * student would read change.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { CartCollisionsModel } from "../model/CartCollisionsModel.js";

export type ScreenSummaryStrings = {
  readonly screenSummary: {
    readonly playAreaStringProperty: TReadOnlyProperty<string>;
    readonly controlAreaStringProperty: TReadOnlyProperty<string>;
    readonly interactionHintStringProperty: TReadOnlyProperty<string>;
  };
};

export class VirtualScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: CartCollisionsModel, strings: ScreenSummaryStrings) {
    const a11y = StringManager.getInstance().getA11yStrings();

    const rounded = (property: TReadOnlyProperty<number>, decimals: number) =>
      new DerivedProperty([property], (value) => toFixed(value, decimals));
    const vRed = rounded(model.redVelocityProperty, 2);
    const vBlue = rounded(model.blueVelocityProperty, 2);
    const p = rounded(model.totalMomentumProperty, 3);
    const e = rounded(model.totalKineticEnergyProperty, 3);

    const details = new DerivedProperty(
      [
        vRed,
        vBlue,
        p,
        e,
        model.isRecordingProperty,
        a11y.detailsPatternStringProperty,
        a11y.recordingNowStringProperty,
        a11y.notRecordingStringProperty,
      ],
      (vr, vb, momentum, energy, recording, pattern, recordingNow, notRecording) =>
        StringUtils.fillIn(pattern, {
          vRed: vr,
          vBlue: vb,
          p: momentum,
          e: energy,
          recording: recording ? recordingNow : notRecording,
        }),
    );

    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      currentDetailsContent: details,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
    });
  }
}
