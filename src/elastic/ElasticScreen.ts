/**
 * ElasticScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createElasticIcon() in src/common/CartCollisionsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "../CartCollisionsColors.js";
import { createElasticIcon } from "../common/CartCollisionsScreenIcons.js";
import type { LabNotebook } from "../common/model/LabNotebook.js";
import type { CartCollisionsPreferencesModel } from "../preferences/CartCollisionsPreferencesModel.js";
import { ElasticModel } from "./model/ElasticModel.js";
import { ElasticKeyboardHelpContent } from "./view/ElasticKeyboardHelpContent.js";
import { ElasticScreenView } from "./view/ElasticScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ElasticScreenOptions = ScreenOptions & {
  tandem: Tandem;
  notebook: LabNotebook;
  preferences: CartCollisionsPreferencesModel;
};

export class ElasticScreen extends Screen<ElasticModel, ElasticScreenView> {
  public constructor(options: ElasticScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ElasticModel(options.notebook, options.preferences),
      // View factory — receives the model instance
      (model) =>
        new ElasticScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ElasticScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ElasticKeyboardHelpContent(),
          homeScreenIcon: createElasticIcon(),
          navigationBarIcon: createElasticIcon(),
        },
        options,
      ),
    );
  }
}
