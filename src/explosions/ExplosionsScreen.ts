/**
 * ExplosionsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createExplosionsIcon() in src/common/CartCollisionsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { createExplosionsIcon } from "../common/CartCollisionsScreenIcons.js";
import type { LabNotebook } from "../common/model/LabNotebook.js";
import type { CartCollisionsPreferencesModel } from "../preferences/CartCollisionsPreferencesModel.js";
import { ExplosionsModel } from "./model/ExplosionsModel.js";
import { ExplosionsKeyboardHelpContent } from "./view/ExplosionsKeyboardHelpContent.js";
import { ExplosionsScreenView } from "./view/ExplosionsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ExplosionsScreenOptions = ScreenOptions & {
  tandem: Tandem;
  notebook: LabNotebook;
  preferences: CartCollisionsPreferencesModel;
};

export class ExplosionsScreen extends Screen<ExplosionsModel, ExplosionsScreenView> {
  public constructor(options: ExplosionsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ExplosionsModel(options.notebook, options.preferences),
      // View factory — receives the model instance
      (model) =>
        new ExplosionsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ExplosionsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ExplosionsKeyboardHelpContent(),
          homeScreenIcon: createExplosionsIcon(),
          navigationBarIcon: createExplosionsIcon(),
        },
        options,
      ),
    );
  }
}
