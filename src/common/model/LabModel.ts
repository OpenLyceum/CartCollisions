/**
 * LabModel.ts
 *
 * The seam between the screens and the shared view: what every screen — virtual
 * or Smart Cart — offers the graph, the record controls and the lab tables.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { GraphState } from "./GraphState.js";
import type { LabNotebook } from "./LabNotebook.js";
import type { RowId } from "./labTables.js";
import type { Recording } from "./Recording.js";

/** The three procedure sections of the handout. */
export const Experiment = {
  EXPLOSION: "explosion",
  INELASTIC: "inelastic",
  ELASTIC: "elastic",
} as const;

export type ExperimentValue = (typeof Experiment)[keyof typeof Experiment];

export const MassMode = {
  EQUAL: "equal",
  UNEQUAL: "unequal",
} as const;

export type MassModeValue = (typeof MassMode)[keyof typeof MassMode];

/** Which row of the lab tables a run fills. */
export function rowFor(experiment: ExperimentValue, massMode: MassModeValue): RowId {
  const suffix = massMode === MassMode.EQUAL ? "Equal" : "Unequal";
  return `${experiment}${suffix}` as RowId;
}

export interface TLabModel {
  readonly recording: Recording;
  readonly graph: GraphState;
  readonly notebook: LabNotebook;
  readonly activeRowProperty: TReadOnlyProperty<RowId>;
  readonly isRecordingProperty: TReadOnlyProperty<boolean>;
  /** False while recording is impossible (e.g. no Smart Cart connected). */
  readonly canRecordProperty: TReadOnlyProperty<boolean>;
  /** Whether the source reports force, so the graph can offer it. */
  readonly measuresForce: boolean;
  record(): void;
  stop(): void;
  clear(): void;
}
