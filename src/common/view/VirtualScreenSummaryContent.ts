import { VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../CartCollisionsConstants.js";
/**
 * VirtualScreenSummaryContent.ts
 *
 * Screen summary for the three virtual screens. Current detailsProperty are live: both
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
    const vRed = rounded(model.redVelocityProperty, VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS.V_RED_DECIMALS);
    const vBlue = rounded(model.blueVelocityProperty, VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS.V_BLUE_DECIMALS);
    const p = rounded(
      model.totalMomentumProperty,
      VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS.TOTAL_MOMENTUM_ROUNDED_DECIMALS,
    );
    const e = rounded(
      model.totalKineticEnergyProperty,
      VIRTUAL_SCREEN_SUMMARY_CONTENT_SETTINGS.TOTAL_KINETIC_ENERGY_ROUNDED_DECIMALS,
    );

    const detailsProperty = new DerivedProperty(
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
      currentDetailsContent: detailsProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
    });
  }
}
