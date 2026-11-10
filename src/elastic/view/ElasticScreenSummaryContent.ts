/**
 * ElasticScreenSummaryContent.ts
 *
 * Screen summary for the Elastic screen: this screen's play-area, control-area and
 * hint text, with the live cart details shared by every virtual screen.
 */

import { VirtualScreenSummaryContent } from "../../common/view/VirtualScreenSummaryContent.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ElasticModel } from "../model/ElasticModel.js";

export class ElasticScreenSummaryContent extends VirtualScreenSummaryContent {
  public constructor(model: ElasticModel) {
    super(model, StringManager.getInstance().getElasticA11yStrings());
  }
}
