/**
 * ExplosionsScreenSummaryContent.ts
 *
 * Screen summary for the Explosions screen: this screen's play-area, control-area and
 * hint text, with the live cart details shared by every virtual screen.
 */

import { VirtualScreenSummaryContent } from "../../common/view/VirtualScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ExplosionsModel } from "../model/ExplosionsModel.js";

export class ExplosionsScreenSummaryContent extends VirtualScreenSummaryContent {
  public constructor(model: ExplosionsModel) {
    super(model, StringManager.getInstance().getExplosionsA11yStrings());
  }
}
