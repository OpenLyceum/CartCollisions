/**
 * InelasticScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createInelasticIcon() in src/common/CartCollisionsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { createInelasticIcon } from "../common/CartCollisionsScreenIcons.js";
import type { LabNotebook } from "../common/model/LabNotebook.js";
import type { CartCollisionsPreferencesModel } from "../preferences/CartCollisionsPreferencesModel.js";
import { InelasticModel } from "./model/InelasticModel.js";
import { InelasticKeyboardHelpContent } from "./view/InelasticKeyboardHelpContent.js";
import { InelasticScreenView } from "./view/InelasticScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type InelasticScreenOptions = ScreenOptions & {
  tandem: Tandem;
  notebook: LabNotebook;
  preferences: CartCollisionsPreferencesModel;
};

export class InelasticScreen extends Screen<InelasticModel, InelasticScreenView> {
  public constructor(options: InelasticScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new InelasticModel(options.notebook, options.preferences),
      // View factory — receives the model instance
      (model) =>
        new InelasticScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<InelasticScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new InelasticKeyboardHelpContent(),
          homeScreenIcon: createInelasticIcon(),
          navigationBarIcon: createInelasticIcon(),
        },
        options,
      ),
    );
  }
}
