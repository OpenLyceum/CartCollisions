/**
 * InelasticScreenSummaryContent.ts
 *
 * Screen summary for the Inelastic screen: this screen's play-area, control-area and
 * hint text, with the live cart details shared by every virtual screen.
 */

import { VirtualScreenSummaryContent } from "../../common/view/VirtualScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { InelasticModel } from "../model/InelasticModel.js";

export class InelasticScreenSummaryContent extends VirtualScreenSummaryContent {
  public constructor(model: InelasticModel) {
    super(model, StringManager.getInstance().getInelasticA11yStrings());
  }
}
