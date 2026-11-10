/**
 * SmartCartsScreenSummaryContent.ts
 *
 * Screen summary for the Smart Carts screen. Current details report each real
 * cart's connection and live position, and whether a recording is running.
 */

import { DerivedProperty } from "scenerystack/axon";
import { toFixed } from "scenerystack/dot";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import { ConnectionState, type SmartCartChannel } from "../model/SmartCartChannel.js";
import type { SmartCartsModel } from "../model/SmartCartsModel.js";

export class SmartCartsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: SmartCartsModel) {
    const strings = StringManager.getInstance().getSmartCartsA11yStrings();
    const a11y = StringManager.getInstance().getA11yStrings();
    const labels = StringManager.getInstance().getLabels();

    const describeCart = (channel: SmartCartChannel) =>
      new DerivedProperty(
        [
          channel.connectionStateProperty,
          channel.livePositionProperty,
          labels.notConnectedStringProperty,
          labels.livePositionPatternStringProperty,
        ],
        (state, position, notConnected, pattern) =>
          state === ConnectionState.CONNECTED
            ? StringUtils.fillIn(pattern, { value: toFixed(position, 2) })
            : notConnected,
      );
    const red = describeCart(model.red);
    const blue = describeCart(model.blue);

    const details = new DerivedProperty(
      [
        red,
        blue,
        model.isRecordingProperty,
        a11y.hardwareDetailsPatternStringProperty,
        a11y.recordingNowStringProperty,
        a11y.notRecordingStringProperty,
      ],
      (r, b, recording, pattern, recordingNow, notRecording) =>
        StringUtils.fillIn(pattern, { red: r, blue: b, recording: recording ? recordingNow : notRecording }),
    );

    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      currentDetailsContent: details,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
    });
  }
}
