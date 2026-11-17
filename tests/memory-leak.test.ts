/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every model object that links Properties or adds listeners, with a factory that
 * builds a fresh instance; the shared harness in tests/helpers/memoryLeak.ts checks
 * each is garbage collected after dispose().
 */

import { NumberProperty } from "scenerystack/axon";
import { TRACK_LENGTH } from "../src/CartCollisionsConstants.js";
import { CartCollisionsModel } from "../src/common/model/CartCollisionsModel.js";
import { Bumper } from "../src/common/model/collisionPhysics.js";
import { GraphState } from "../src/common/model/GraphState.js";
import { Experiment } from "../src/common/model/LabModel.js";
import { LabNotebook, LabRow } from "../src/common/model/LabNotebook.js";
import { Recording } from "../src/common/model/Recording.js";
import { CartNode } from "../src/common/view/CartNode.js";
import { RecordControls } from "../src/common/view/RecordControls.js";
import { TimeGraphNode } from "../src/common/view/TimeGraphNode.js";
import { TrackTransform } from "../src/common/view/TrackTransform.js";
import { CartCollisionsPreferencesModel } from "../src/preferences/CartCollisionsPreferencesModel.js";
import { SmartCartChannel } from "../src/smart-carts/model/SmartCartChannel.js";
import { FakeSmartCart } from "./helpers/FakeSmartCart.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

const notebook = new LabNotebook();
const preferences = new CartCollisionsPreferencesModel();
const labModel = new CartCollisionsModel(Experiment.ELASTIC, notebook, preferences);
const recording = new Recording();
const graph = new GraphState(recording);
const cartPositionProperty = new NumberProperty(0.5);
const trackTransform = new TrackTransform(0, 400, TRACK_LENGTH);

describeDisposalLeaks([
  { name: "Recording", create: () => new Recording() },
  {
    name: "GraphState",
    create: () => {
      const ownedRecording = new Recording();
      const ownedGraph = new GraphState(ownedRecording);
      return {
        dispose: () => {
          ownedGraph.dispose();
          ownedRecording.dispose();
        },
      };
    },
  },
  { name: "LabNotebook", create: () => new LabNotebook() },
  { name: "LabRow", create: () => new LabRow("explosionEqual") },
  { name: "SmartCartChannel", create: () => new SmartCartChannel(new FakeSmartCart()) },
  {
    name: "CartNode",
    create: () =>
      new CartNode({
        color: "red",
        bumper: Bumper.MAGNET,
        transform: trackTransform,
        positionProperty: cartPositionProperty,
      }),
    keepAlive: () => [cartPositionProperty, trackTransform],
  },
  {
    name: "RecordControls",
    create: () => new RecordControls(labModel),
    keepAlive: () => [labModel],
  },
  {
    name: "TimeGraphNode",
    create: () =>
      new TimeGraphNode(recording, graph, {
        viewWidth: 320,
        viewHeight: 180,
        measuresForce: true,
      }),
    keepAlive: () => [recording, graph],
  },
]);
