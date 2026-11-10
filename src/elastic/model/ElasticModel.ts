/**
 * ElasticModel.ts
 *
 * The Elastic screen's bench: magnetic bumpers facing each other, the blue cart at rest.
 * All behaviour lives in the shared CartCollisionsModel.
 */

import { CartCollisionsModel } from "../../common/model/CartCollisionsModel.js";
import { Experiment } from "../../common/model/LabModel.js";
import type { LabNotebook } from "../../common/model/LabNotebook.js";
import type { CartCollisionsPreferencesModel } from "../../preferences/CartCollisionsPreferencesModel.js";

export class ElasticModel extends CartCollisionsModel {
  public constructor(notebook: LabNotebook, preferences: CartCollisionsPreferencesModel) {
    super(Experiment.ELASTIC, notebook, preferences);
  }
}
