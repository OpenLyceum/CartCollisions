/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every model object that links Properties or adds listeners, with a factory that
 * builds a fresh instance; the shared harness in tests/helpers/memoryLeak.ts checks
 * each is garbage collected after dispose().
 */

import { GraphState } from "../src/common/model/GraphState.js";
import { LabNotebook } from "../src/common/model/LabNotebook.js";
import { Recording } from "../src/common/model/Recording.js";
import { SmartCartChannel } from "../src/smart-carts/model/SmartCartChannel.js";
import { FakeSmartCart } from "./helpers/FakeSmartCart.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

describeDisposalLeaks([
  { name: "Recording", create: () => new Recording() },
  {
    name: "GraphState",
    create: () => {
      const recording = new Recording();
      const graph = new GraphState(recording);
      return {
        dispose: () => {
          graph.dispose();
          recording.dispose();
        },
      };
    },
  },
  { name: "LabNotebook", create: () => new LabNotebook() },
  { name: "SmartCartChannel", create: () => new SmartCartChannel(new FakeSmartCart()) },
]);
