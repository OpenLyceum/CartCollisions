/**
 * ExplosionsScreenView.ts
 *
 * The Explosions screen — the shared virtual lab view, with this screen's summary.
 */

import type { ScreenViewOptions } from "scenerystack/sim";
import { VirtualLabScreenView } from "../../common/view/VirtualLabScreenView.js";
import type { ExplosionsModel } from "../model/ExplosionsModel.js";
import { ExplosionsScreenSummaryContent } from "./ExplosionsScreenSummaryContent.js";

export class ExplosionsScreenView extends VirtualLabScreenView {
  public constructor(model: ExplosionsModel, options: ScreenViewOptions) {
    super(model, { ...options, screenSummaryContent: new ExplosionsScreenSummaryContent(model) });
  }
}
