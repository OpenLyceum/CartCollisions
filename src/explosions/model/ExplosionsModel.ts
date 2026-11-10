/**
 * ExplosionsModel.ts
 *
 * The Explosions screen's bench: carts touching at the centre of the track, the red cart's spring plunger latched against the blue cart.
 * All behaviour lives in the shared CartCollisionsModel.
 */

import { CartCollisionsModel } from "../../common/model/CartCollisionsModel.js";
import { Experiment } from "../../common/model/LabModel.js";
import type { LabNotebook } from "../../common/model/LabNotebook.js";
import type { CartCollisionsPreferencesModel } from "../../preferences/CartCollisionsPreferencesModel.js";

export class ExplosionsModel extends CartCollisionsModel {
  public constructor(notebook: LabNotebook, preferences: CartCollisionsPreferencesModel) {
    super(Experiment.EXPLOSION, notebook, preferences);
  }
}
