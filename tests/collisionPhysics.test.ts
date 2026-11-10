import { describe, expect, it } from "vitest";
import { CART_LENGTH, PHYSICS_TIME_STEP, PLUNGER_COMPRESSIONS, TRACK_CENTER } from "../src/CartCollisionsConstants.js";
import {
  Bumper,
  type BumperValue,
  type CartsParameters,
  type CartsState,
  magnetForce,
  plungerEnergy,
  stepCarts,
  totalKineticEnergy,
  totalMomentum,
} from "../src/common/model/collisionPhysics.js";

const run = (state: CartsState, parameters: CartsParameters, seconds: number) => {
  const steps = Math.round(seconds / PHYSICS_TIME_STEP);
  for (let i = 0; i < steps; i++) {
    stepCarts(state, parameters, PHYSICS_TIME_STEP);
  }
};

const collision = (bumper: BumperValue, massBlue: number): { state: CartsState; parameters: CartsParameters } => ({
  state: { xRed: 0.3, vRed: 0.4, xBlue: 0.6, vBlue: 0, stuck: false, plungerReleased: false },
  parameters: { massRed: 0.25, massBlue, bumper, plungerExtension: 0, rollingFriction: 0 },
});

describe("collisionPhysics", () => {
  for (const bumper of [Bumper.MAGNET, Bumper.VELCRO]) {
    for (const massBlue of [0.25, 0.75]) {
      it(`conserves momentum: ${bumper}, blue ${massBlue} kg`, () => {
        const { state, parameters } = collision(bumper, massBlue);
        const before = totalMomentum(state, parameters);
        run(state, parameters, 0.8);
        expect(totalMomentum(state, parameters)).toBeCloseTo(before, 6);
      });
    }
  }

  it("magnets: equal masses swap velocities, kinetic energy conserved", () => {
    const { state, parameters } = collision(Bumper.MAGNET, 0.25);
    const before = totalKineticEnergy(state, parameters);
    run(state, parameters, 0.8);
    expect(state.vRed).toBeCloseTo(0, 3);
    expect(state.vBlue).toBeCloseTo(0.4, 3);
    expect(totalKineticEnergy(state, parameters) / before).toBeCloseTo(1, 3);
  });

  it("magnets: unequal masses match the elastic formulas", () => {
    const { state, parameters } = collision(Bumper.MAGNET, 0.75);
    run(state, parameters, 0.8);
    const { massRed: m1, massBlue: m2 } = parameters;
    expect(state.vRed).toBeCloseTo(((m1 - m2) / (m1 + m2)) * 0.4, 3);
    expect(state.vBlue).toBeCloseTo(((2 * m1) / (m1 + m2)) * 0.4, 3);
  });

  it("Velcro: carts move together and lose m₂/(m₁+m₂) of the kinetic energy", () => {
    const { state, parameters } = collision(Bumper.VELCRO, 0.75);
    const before = totalKineticEnergy(state, parameters);
    run(state, parameters, 0.8);
    expect(state.stuck).toBe(true);
    expect(state.vRed).toBeCloseTo(state.vBlue, 4);
    expect(state.vBlue).toBeCloseTo(0.1, 3);
    const lostFraction = 1 - totalKineticEnergy(state, parameters) / before;
    expect(lostFraction).toBeCloseTo(0.75, 2);
  });

  it("plunger: carts separate with zero total momentum and the spring's energy", () => {
    const extension = PLUNGER_COMPRESSIONS[1];
    const state: CartsState = {
      xRed: TRACK_CENTER - CART_LENGTH / 2,
      vRed: 0,
      xBlue: TRACK_CENTER + CART_LENGTH / 2,
      vBlue: 0,
      stuck: false,
      plungerReleased: true,
    };
    const parameters: CartsParameters = {
      massRed: 0.25,
      massBlue: 0.75,
      bumper: Bumper.PLUNGER,
      plungerExtension: extension,
      rollingFriction: 0,
    };
    run(state, parameters, 0.3);
    expect(totalMomentum(state, parameters)).toBeCloseTo(0, 6);
    expect(state.vRed).toBeLessThan(0);
    expect(state.vBlue).toBeGreaterThan(0);
    expect(totalKineticEnergy(state, parameters)).toBeCloseTo(plungerEnergy(extension), 4);
  });

  it("friction stops a coasting cart without reversing it", () => {
    const state: CartsState = { xRed: 0.3, vRed: 0.05, xBlue: 1.0, vBlue: 0, stuck: false, plungerReleased: false };
    const parameters: CartsParameters = {
      massRed: 0.25,
      massBlue: 0.25,
      bumper: Bumper.MAGNET,
      plungerExtension: 0,
      rollingFriction: 0.01,
    };
    run(state, parameters, 2);
    expect(state.vRed).toBe(0);
  });

  it("magnet force vanishes smoothly at the cutoff and grows as the gap closes", () => {
    expect(magnetForce(0.08)).toBe(0);
    expect(magnetForce(0.0799)).toBeGreaterThanOrEqual(0);
    expect(magnetForce(0.01)).toBeGreaterThan(magnetForce(0.03));
  });
});
