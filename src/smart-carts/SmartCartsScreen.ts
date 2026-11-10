/**
 * SmartCartsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createSmartCartsIcon() in src/common/CartCollisionsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { createSmartCartsIcon } from "../common/CartCollisionsScreenIcons.js";
import type { LabNotebook } from "../common/model/LabNotebook.js";
import { SmartCartsModel } from "./model/SmartCartsModel.js";
import { SmartCartsKeyboardHelpContent } from "./view/SmartCartsKeyboardHelpContent.js";
import { SmartCartsScreenView } from "./view/SmartCartsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SmartCartsScreenOptions = ScreenOptions & {
  tandem: Tandem;
  notebook: LabNotebook;
};

export class SmartCartsScreen extends Screen<SmartCartsModel, SmartCartsScreenView> {
  public constructor(options: SmartCartsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new SmartCartsModel(options.notebook),
      // View factory — receives the model instance
      (model) =>
        new SmartCartsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SmartCartsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SmartCartsKeyboardHelpContent(),
          homeScreenIcon: createSmartCartsIcon(),
          navigationBarIcon: createSmartCartsIcon(),
        },
        options,
      ),
    );
  }
}
