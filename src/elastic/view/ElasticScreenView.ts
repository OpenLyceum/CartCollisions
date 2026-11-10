/**
 * ElasticScreenView.ts
 *
 * The Elastic screen — the shared virtual lab view, with this screen's summary.
 */

import type { ScreenViewOptions } from "scenerystack/sim";
import { VirtualLabScreenView } from "../../common/view/VirtualLabScreenView.js";
import type { ElasticModel } from "../model/ElasticModel.js";
import { ElasticScreenSummaryContent } from "./ElasticScreenSummaryContent.js";

export class ElasticScreenView extends VirtualLabScreenView {
  public constructor(model: ElasticModel, options: ScreenViewOptions) {
    super(model, { ...options, screenSummaryContent: new ElasticScreenSummaryContent(model) });
  }
}
