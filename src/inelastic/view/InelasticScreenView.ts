/**
 * InelasticScreenView.ts
 *
 * The Inelastic screen — the shared virtual lab view, with this screen's summary.
 */

import type { ScreenViewOptions } from "scenerystack/sim";
import { VirtualLabScreenView } from "../../common/view/VirtualLabScreenView.js";
import type { InelasticModel } from "../model/InelasticModel.js";
import { InelasticScreenSummaryContent } from "./InelasticScreenSummaryContent.js";

export class InelasticScreenView extends VirtualLabScreenView {
  public constructor(model: InelasticModel, options: ScreenViewOptions) {
    super(model, { ...options, screenSummaryContent: new InelasticScreenSummaryContent(model) });
  }
}
