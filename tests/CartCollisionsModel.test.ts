import { describe, expect, it } from "vitest";
import { CartCollisionsModel } from "../src/common/model/CartCollisionsModel.js";
import { fitLine } from "../src/common/model/fitMath.js";
import { Experiment, type ExperimentValue, MassMode } from "../src/common/model/LabModel.js";
import { LabNotebook } from "../src/common/model/LabNotebook.js";
import { CartCollisionsPreferencesModel } from "../src/preferences/CartCollisionsPreferencesModel.js";

const FRAME = 1 / 60;

function bench(experiment: ExperimentValue, reversed = false) {
  const preferences = new CartCollisionsPreferencesModel();
  preferences.rollingFrictionProperty.value = 0;
  preferences.blueCartReversedProperty.value = reversed;
  return new CartCollisionsModel(experiment, new LabNotebook(), preferences);
}

const advance = (model: CartCollisionsModel, seconds: number) => {
  for (let t = 0; t < seconds; t += FRAME) {
    model.step(FRAME);
  }
};

describe("CartCollisionsModel", () => {
  it("samples at the chosen rate, zeroed at the start of the recording", () => {
    const model = bench(Experiment.ELASTIC);
    model.record();
    advance(model, 0.5);
    const { times, positions } = model.recording.red;
    expect(times[1]).toBeCloseTo(0.01, 9);
    expect(positions[0]).toBe(0);
    expect(times.length).toBeGreaterThanOrEqual(50);
  });

  it("an elastic run recorded and fitted gives the expected velocities", () => {
    const model = bench(Experiment.ELASTIC);
    model.record();
    advance(model, 0.2);
    model.push();
    advance(model, 1.2);
    const red = model.recording.red;
    const blue = model.recording.blue;
    const before = fitLine(red.times, red.positions, 0.25, 0.45);
    const blueAfter = fitLine(blue.times, blue.positions, red.times.at(-1)! - 0.3, red.times.at(-1)!);
    expect(before?.slope).toBeCloseTo(0.4, 2);
    expect(blueAfter?.slope).toBeCloseTo(0.4, 2);
  });

  it("the blue cart reports the opposite sign when it faces backward, until Change Sign", () => {
    const model = bench(Experiment.EXPLOSION, true);
    model.record();
    model.trigger();
    advance(model, 0.5);
    expect(model.recording.blue.positions.at(-1)!).toBeLessThan(0);

    model.clear();
    model.resetCarts();
    model.blueChangeSignProperty.value = true;
    model.record();
    model.trigger();
    advance(model, 0.5);
    expect(model.recording.blue.positions.at(-1)!).toBeGreaterThan(0);
  });

  it("an explosion conserves momentum; unequal masses load the blue cart", () => {
    const model = bench(Experiment.EXPLOSION);
    model.massModeProperty.value = MassMode.UNEQUAL;
    expect(model.massBlueProperty.value).toBeGreaterThan(model.massRedProperty.value * 2.5);
    model.trigger();
    advance(model, 0.3);
    expect(model.momentum).toBeCloseTo(0, 6);
    expect(model.kineticEnergy).toBeGreaterThan(0);
    expect(model.activeRowProperty.value).toBe("explosionUnequal");
  });

  it("stops recording before a cart reaches an end stop", () => {
    const model = bench(Experiment.INELASTIC);
    model.pushSpeedProperty.value = 1;
    model.record();
    model.push();
    advance(model, 4);
    expect(model.isRecordingProperty.value).toBe(false);
  });
});
