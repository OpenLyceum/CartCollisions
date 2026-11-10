/**
 * CartCollisionsModel.ts
 *
 * One virtual lab bench: two Smart Carts on a track, set up for one of the
 * handout's three experiments. The Explosions, Inelastic and Elastic screens each
 * construct one, differing only in `experiment`.
 *
 * ── What the virtual carts report ─────────────────────────────────────────────
 * Like a real Smart Cart, each cart measures its own wheel travel: position is
 * zero where the cart was when recording started, counts in whole encoder steps,
 * and is positive in the direction the cart *faces*. The blue cart faces the red
 * one, so by default it reports the opposite sign from the track's "positive to
 * the right" — exactly the reference-frame trap the handout warns about — until
 * the student ticks its Change Sign box. (Preferences can turn this realism off.)
 *
 * ── Time ──────────────────────────────────────────────────────────────────────
 * Each frame is split into PHYSICS_TIME_STEP substeps. Samples are taken on the
 * substep grid at the chosen sample rate, so the sample interval is exact.
 */

import { BooleanProperty, DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { dotRandom, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import {
  CART_LENGTH,
  COLLISION_BLUE_START,
  COLLISION_RED_START,
  DEFAULT_PLUNGER_SETTING,
  DEFAULT_PUSH_SPEED,
  ENCODER_RESOLUTION,
  END_STOP_MARGIN,
  MASS_TOLERANCE,
  MAX_PUSH_SPEED,
  MAX_RECORDING_TIME,
  MIN_PUSH_SPEED,
  NOMINAL_BAR_MASS,
  NOMINAL_CART_MASS,
  PHYSICS_TIME_STEP,
  PLUNGER_COMPRESSIONS,
  TRACK_CENTER,
  TRACK_LENGTH,
  UNEQUAL_MASS_BAR_COUNT,
} from "../../CartCollisionsConstants.js";
import CartCollisionsNamespace from "../../CartCollisionsNamespace.js";
import type { CartCollisionsPreferencesModel } from "../../preferences/CartCollisionsPreferencesModel.js";
import {
  Bumper,
  type BumperValue,
  type CartsParameters,
  type CartsState,
  stepCarts,
  totalKineticEnergy,
  totalMomentum,
} from "./collisionPhysics.js";
import { quantize } from "./fitMath.js";
import { GraphState } from "./GraphState.js";
import { Experiment, type ExperimentValue, MassMode, type MassModeValue, rowFor, type TLabModel } from "./LabModel.js";
import type { LabNotebook } from "./LabNotebook.js";
import type { RowId } from "./labTables.js";
import { Recording } from "./Recording.js";

/** A frame longer than this (a backgrounded tab) is truncated, in s. */
const MAX_FRAME = 1 / 20;

/** Below this speed a cart counts as at rest, in m/s. */
const REST_SPEED = 1e-4;

const BUMPER_FOR: Record<ExperimentValue, BumperValue> = {
  [Experiment.EXPLOSION]: Bumper.PLUNGER,
  [Experiment.INELASTIC]: Bumper.VELCRO,
  [Experiment.ELASTIC]: Bumper.MAGNET,
};

const nominal = (value: number) => value + dotRandom.nextDoubleBetween(-MASS_TOLERANCE, MASS_TOLERANCE);

export class CartCollisionsModel implements TModel, TLabModel {
  public readonly experiment: ExperimentValue;
  public readonly bumper: BumperValue;
  public readonly notebook: LabNotebook;
  public readonly recording = new Recording();
  public readonly graph: GraphState;
  public readonly measuresForce = true;

  /** Masses on the balance, in kg — fixed for the session, each a little off nominal. */
  public readonly redCartMass: number;
  public readonly blueCartMass: number;
  public readonly barMasses: readonly [number, number];

  public readonly massModeProperty = new Property<MassModeValue>(MassMode.EQUAL);
  public readonly massRedProperty: TReadOnlyProperty<number>;
  public readonly massBlueProperty: TReadOnlyProperty<number>;
  public readonly blueBarCountProperty: TReadOnlyProperty<number>;

  /** Plunger latch position, 1–3. */
  public readonly plungerSettingProperty = new NumberProperty(DEFAULT_PLUNGER_SETTING, {
    range: new Range(1, PLUNGER_COMPRESSIONS.length),
    numberType: "Integer",
  });

  /** How hard the student pushes the red cart, in m/s. */
  public readonly pushSpeedProperty = new NumberProperty(DEFAULT_PUSH_SPEED, {
    range: new Range(MIN_PUSH_SPEED, MAX_PUSH_SPEED),
    units: "m/s",
  });

  /** Track positions of the cart centres, in m from the left stop (true, not as reported). */
  public readonly redPositionProperty: NumberProperty;
  public readonly bluePositionProperty: NumberProperty;
  public readonly redVelocityProperty = new NumberProperty(0, { units: "m/s" });
  public readonly blueVelocityProperty = new NumberProperty(0, { units: "m/s" });
  public readonly plungerReleasedProperty = new BooleanProperty(false);
  public readonly stuckProperty = new BooleanProperty(false);

  /** Change Sign, per cart — as in PASCO Capstone's Smart Cart Position Sensor settings. */
  public readonly redChangeSignProperty = new BooleanProperty(false);
  public readonly blueChangeSignProperty = new BooleanProperty(false);

  private readonly isRecordingWritable = new BooleanProperty(false);
  public readonly isRecordingProperty: TReadOnlyProperty<boolean> = this.isRecordingWritable;
  public readonly canRecordProperty: TReadOnlyProperty<boolean> = new BooleanProperty(true);
  public readonly activeRowProperty: TReadOnlyProperty<RowId>;

  /** True while any cart moves or the plunger is pushing. */
  public readonly isMovingProperty = new BooleanProperty(false);

  /** Emitted with the closing speed (m/s) when the carts strike each other or a stop, for sound. */
  public readonly impactListeners: ((speed: number) => void)[] = [];

  public readonly totalMomentumProperty: TReadOnlyProperty<number>;
  public readonly totalKineticEnergyProperty: TReadOnlyProperty<number>;

  private readonly state: CartsState;
  private recordingTime = 0;
  private nextSampleTime = 0;
  private redZero = 0;
  private blueZero = 0;
  private wasTouching = false;

  private readonly preferences: CartCollisionsPreferencesModel;

  public constructor(experiment: ExperimentValue, notebook: LabNotebook, preferences: CartCollisionsPreferencesModel) {
    this.preferences = preferences;
    this.experiment = experiment;
    this.bumper = BUMPER_FOR[experiment];
    this.notebook = notebook;
    this.graph = new GraphState(this.recording);

    this.redCartMass = nominal(NOMINAL_CART_MASS);
    this.blueCartMass = nominal(NOMINAL_CART_MASS);
    this.barMasses = [nominal(NOMINAL_BAR_MASS), nominal(NOMINAL_BAR_MASS)];

    this.blueBarCountProperty = new DerivedProperty([this.massModeProperty], (mode) =>
      mode === MassMode.EQUAL ? 0 : UNEQUAL_MASS_BAR_COUNT,
    );
    this.massRedProperty = new DerivedProperty([this.massModeProperty], () => this.redCartMass);
    this.massBlueProperty = new DerivedProperty(
      [this.blueBarCountProperty],
      (bars) => this.blueCartMass + this.barMasses.slice(0, bars).reduce((sum, m) => sum + m, 0),
    );
    this.activeRowProperty = new DerivedProperty([this.massModeProperty], (mode) => rowFor(experiment, mode));

    const [redStart, blueStart] = this.startPositions();
    const positionRange = new Range(CART_LENGTH / 2, TRACK_LENGTH - CART_LENGTH / 2);
    this.redPositionProperty = new NumberProperty(redStart, { range: positionRange, units: "m" });
    this.bluePositionProperty = new NumberProperty(blueStart, { range: positionRange, units: "m" });
    this.state = { xRed: redStart, vRed: 0, xBlue: blueStart, vBlue: 0, stuck: false, plungerReleased: false };

    this.totalMomentumProperty = new DerivedProperty(
      [this.redVelocityProperty, this.blueVelocityProperty, this.massRedProperty, this.massBlueProperty],
      (vr, vb, mr, mb) => mr * vr + mb * vb,
    );
    this.totalKineticEnergyProperty = new DerivedProperty(
      [this.redVelocityProperty, this.blueVelocityProperty, this.massRedProperty, this.massBlueProperty],
      (vr, vb, mr, mb) => 0.5 * mr * vr * vr + 0.5 * mb * vb * vb,
    );

    // A new mass setup is a new run: put the carts back.
    this.massModeProperty.lazyLink(() => this.resetCarts());
  }

  private startPositions(): [number, number] {
    return this.experiment === Experiment.EXPLOSION
      ? [TRACK_CENTER - CART_LENGTH / 2, TRACK_CENTER + CART_LENGTH / 2]
      : [COLLISION_RED_START, COLLISION_BLUE_START];
  }

  public get parameters(): CartsParameters {
    return {
      massRed: this.massRedProperty.value,
      massBlue: this.massBlueProperty.value,
      bumper: this.bumper,
      plungerExtension: PLUNGER_COMPRESSIONS[this.plungerSettingProperty.value - 1] ?? 0,
      rollingFriction: this.preferences.rollingFrictionProperty.value,
    };
  }

  /** Total momentum and kinetic energy right now (true values, for the summary and tests). */
  public get momentum(): number {
    return totalMomentum(this.state, this.parameters);
  }

  public get kineticEnergy(): number {
    return totalKineticEnergy(this.state, this.parameters);
  }

  // ── Student actions ─────────────────────────────────────────────────────────

  /** Clears the graph and starts recording, zeroing each cart's encoder where it stands. */
  public record(): void {
    this.recording.clear();
    this.graph.zoomAll();
    this.recordingTime = 0;
    this.nextSampleTime = 0;
    this.redZero = this.state.xRed;
    this.blueZero = this.state.xBlue;
    this.isRecordingWritable.value = true;
    this.takeSample(0);
  }

  public stop(): void {
    this.isRecordingWritable.value = false;
  }

  public clear(): void {
    this.stop();
    this.recording.clear();
    this.graph.reset();
  }

  /** Taps the plunger trigger (Explosions screen). */
  public trigger(): void {
    if (this.experiment === Experiment.EXPLOSION && !this.state.plungerReleased) {
      this.state.plungerReleased = true;
      this.plungerReleasedProperty.value = true;
      this.isMovingProperty.value = true;
    }
  }

  /** Gives the red cart a push toward the blue one (Inelastic and Elastic screens). */
  public push(): void {
    if (this.experiment !== Experiment.EXPLOSION) {
      this.state.vRed = this.pushSpeedProperty.value;
      this.isMovingProperty.value = true;
      this.syncProperties();
    }
  }

  /** Back to the starting positions, at rest, plunger latched, Velcro apart. Keeps the recording. */
  public resetCarts(): void {
    this.stop();
    const [redStart, blueStart] = this.startPositions();
    Object.assign(this.state, {
      xRed: redStart,
      vRed: 0,
      xBlue: blueStart,
      vBlue: 0,
      stuck: false,
      plungerReleased: false,
    });
    this.wasTouching = false;
    this.isMovingProperty.value = false;
    this.syncProperties();
  }

  /**
   * Moves a resting cart by hand, without passing through the other cart or a stop.
   * In an explosion the carts sit together, so they move as a pair.
   */
  public dragCart(cart: "red" | "blue", position: number): void {
    if (this.isMovingProperty.value) {
      return;
    }
    const half = CART_LENGTH / 2;
    if (this.experiment === Experiment.EXPLOSION && !this.state.plungerReleased) {
      const centre = cart === "red" ? position + half : position - half;
      const clamped = Math.min(Math.max(centre, CART_LENGTH), TRACK_LENGTH - CART_LENGTH);
      this.state.xRed = clamped - half;
      this.state.xBlue = clamped + half;
    } else if (cart === "red") {
      this.state.xRed = Math.min(Math.max(position, half), this.state.xBlue - CART_LENGTH);
    } else {
      this.state.xBlue = Math.max(Math.min(position, TRACK_LENGTH - half), this.state.xRed + CART_LENGTH);
    }
    this.syncProperties();
  }

  // ── Time ────────────────────────────────────────────────────────────────────

  public step(dt: number): void {
    if (this.isMovingProperty.value) {
      const frame = Math.min(dt, MAX_FRAME);
      const substeps = Math.max(1, Math.round(frame / PHYSICS_TIME_STEP));
      const parameters = this.parameters;
      for (let i = 0; i < substeps; i++) {
        const forces = stepCarts(this.state, parameters, PHYSICS_TIME_STEP);
        this.detectImpact(forces.onBlue !== 0 || forces.leftStopOnRed !== 0 || forces.rightStopOnBlue !== 0);
        if (this.isRecordingWritable.value) {
          this.recordingTime += PHYSICS_TIME_STEP;
          if (this.recordingTime + 1e-9 >= this.nextSampleTime) {
            this.takeSample(forces.onBlue);
          }
          if (this.shouldAutoStop()) {
            this.stop();
          }
        }
      }
      this.syncProperties();
      if (this.isAtRest()) {
        this.isMovingProperty.value = false;
      }
    } else if (this.isRecordingWritable.value) {
      // Carts at rest still produce samples, so a recording started before the push
      // shows the flat "before" segment.
      const end = this.recordingTime + Math.min(dt, MAX_FRAME);
      while (this.nextSampleTime <= end) {
        this.recordingTime = this.nextSampleTime;
        this.takeSample(0);
      }
      this.recordingTime = end;
      if (this.recordingTime >= MAX_RECORDING_TIME) {
        this.stop();
      }
    }
    this.recording.flush();
  }

  /**
   * One sample per cart, as the Smart Cart would report it: displacement since
   * recording began, in whole encoder counts, positive the way the cart faces,
   * times the Change Sign setting. Force is the load cell behind the bumper,
   * positive when the bumper is pushed toward the cart's back.
   */
  private takeSample(forceOnBlue: number): void {
    const t = this.nextSampleTime;
    const blueFacing = this.preferences.blueCartReversedProperty.value ? -1 : 1;
    const redSign = this.redChangeSignProperty.value ? -1 : 1;
    const blueSign = (this.blueChangeSignProperty.value ? -1 : 1) * blueFacing;
    const redPosition = redSign * quantize(this.state.xRed - this.redZero, ENCODER_RESOLUTION);
    const bluePosition = blueSign * quantize(this.state.xBlue - this.blueZero, ENCODER_RESOLUTION);
    // The red cart is pushed left (−) by +forceOnBlue's reaction; its own frame faces right.
    this.recording.red.addSample(t, redPosition, redSign * -forceOnBlue);
    this.recording.blue.addSample(t, bluePosition, blueSign * forceOnBlue);
    this.recording.markChanged();
    this.nextSampleTime = t + 1 / this.preferences.sampleRateProperty.value;
  }

  private shouldAutoStop(): boolean {
    const half = CART_LENGTH / 2;
    return (
      this.recordingTime >= MAX_RECORDING_TIME ||
      this.state.xRed - half <= END_STOP_MARGIN ||
      this.state.xBlue + half >= TRACK_LENGTH - END_STOP_MARGIN
    );
  }

  private detectImpact(touching: boolean): void {
    if (touching && !this.wasTouching) {
      const speed = Math.abs(this.state.vRed - this.state.vBlue);
      for (const listener of this.impactListeners) {
        listener(speed);
      }
    }
    this.wasTouching = touching;
  }

  private isAtRest(): boolean {
    const parameters = this.parameters;
    const pushing =
      this.state.plungerReleased &&
      this.bumper === Bumper.PLUNGER &&
      this.state.xBlue - this.state.xRed - CART_LENGTH < parameters.plungerExtension;
    return !pushing && Math.abs(this.state.vRed) < REST_SPEED && Math.abs(this.state.vBlue) < REST_SPEED;
  }

  private syncProperties(): void {
    const range = this.redPositionProperty.range;
    this.redPositionProperty.value = range.constrainValue(this.state.xRed);
    this.bluePositionProperty.value = range.constrainValue(this.state.xBlue);
    this.redVelocityProperty.value = this.state.vRed;
    this.blueVelocityProperty.value = this.state.vBlue;
    this.stuckProperty.value = this.state.stuck;
    this.plungerReleasedProperty.value = this.state.plungerReleased;
  }

  public reset(): void {
    this.clear();
    this.massModeProperty.reset();
    this.plungerSettingProperty.reset();
    this.pushSpeedProperty.reset();
    this.redChangeSignProperty.reset();
    this.blueChangeSignProperty.reset();
    this.resetCarts();
  }
}

CartCollisionsNamespace.register("CartCollisionsModel", CartCollisionsModel);
