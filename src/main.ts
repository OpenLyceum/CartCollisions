/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import CartCollisionsColors from "./CartCollisionsColors.js";
import { LabNotebook } from "./common/model/LabNotebook.js";
import { ElasticScreen } from "./elastic/ElasticScreen.js";
import { ExplosionsScreen } from "./explosions/ExplosionsScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { InelasticScreen } from "./inelastic/InelasticScreen.js";
import { CartCollisionsPreferencesModel } from "./preferences/CartCollisionsPreferencesModel.js";
import { CartCollisionsPreferencesNode } from "./preferences/CartCollisionsPreferencesNode.js";
import { SmartCartsScreen } from "./smart-carts/SmartCartsScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from cartCollisionsQueryParameters.
  const simPreferences = new CartCollisionsPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  // Tables 1 and 2 span the whole lab, so every screen writes to the one notebook.
  const notebook = new LabNotebook();

  const screens = [
    new ExplosionsScreen({
      name: stringManager.getScreenNames().explosionsStringProperty,
      tandem: Tandem.ROOT.createTandem("explosionsScreen"),
      notebook,
      preferences: simPreferences,
      backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
    }),
    new InelasticScreen({
      name: stringManager.getScreenNames().inelasticStringProperty,
      tandem: Tandem.ROOT.createTandem("inelasticScreen"),
      notebook,
      preferences: simPreferences,
      backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
    }),
    new ElasticScreen({
      name: stringManager.getScreenNames().elasticStringProperty,
      tandem: Tandem.ROOT.createTandem("elasticScreen"),
      notebook,
      preferences: simPreferences,
      backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
    }),
    new SmartCartsScreen({
      name: stringManager.getScreenNames().smartCartsStringProperty,
      tandem: Tandem.ROOT.createTandem("smartCartsScreen"),
      notebook,
      backgroundColorProperty: CartCollisionsColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new CartCollisionsPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Credits shown in Help → About
    credits: {
      leadDesign: "Martin Veillette",
      softwareDevelopment: "Martin Veillette",
      team: "OpenLyceum",
      qualityAssurance: "",
    },
  });

  sim.start();
});
