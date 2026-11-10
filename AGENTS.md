# AGENTS.md — Cart Collisions

Sim-specific context for AI assistants. General SceneryStack guidance:
[OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

A virtual (and real) version of the PASCO Smart Cart momentum lab: explosions
with the spring plunger, completely inelastic collisions with Velcro, elastic
collisions with magnets, each with equal and unequal masses. Students fit lines
to position–time graphs, fill the handout's Data Table 1 and Table 2, and check
their arithmetic. The **Smart Carts** screen does the same with two real PASCO
ME-1240 carts over Web Bluetooth.

Physics and measurement model: [`doc/model.md`](doc/model.md). Architecture and
the hardware link: [`doc/implementation-notes.md`](doc/implementation-notes.md).
Read both before changing model code.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/collisionPhysics.ts` | Pure two-cart force laws + integrator (plunger, magnets, Velcro, contact, friction) |
| `src/common/model/CartCollisionsModel.ts` | One virtual bench: substeps, encoder sampling, Change Sign, auto-stop |
| `src/common/model/Recording.ts` | Per-cart time / position / force traces; velocity derived by centred least squares |
| `src/common/model/GraphState.ts` | Graph quantity, zoom window, fit interval and the live fits |
| `src/common/model/fitMath.ts` | Line fit with slope uncertainty, differentiator, encoder quantisation (pure) |
| `src/common/model/labTables.ts` | Table rows/columns and the Δv, Δp, E, ΔE formulas + tolerance (pure) |
| `src/common/model/LabNotebook.ts` | The student's six-row tables — **one instance for the whole sim**, built in `main.ts` |
| `src/common/model/LabModel.ts` | `TLabModel`, the seam every screen offers the shared view |
| `src/common/view/LabScreenView.ts` | Graph, fit panel, record controls, Lab Tables, Reset All, traversal order |
| `src/common/view/VirtualLabScreenView.ts` | Track, carts, bench controls, balance (the three virtual screens) |
| `src/common/view/TimeGraphNode.ts` | bamboo time graph with the draggable fit interval |
| `src/common/view/LabTablesDialog.ts` | Tables 1 and 2, keypad entry, check/show answers, CSV, conclusion questions |
| `src/smart-carts/model/SmartCartChannel.ts` | One real cart: connect, poll loop, zero, Change Sign; never-rejecting connect |
| `src/smart-carts/model/BluetoothSmartCart.ts` | `pasco-ble` wrapper, lazily imported |
| `src/smart-carts/model/SmartCartsModel.ts` | Both channels on one run clock; which table row the run fills |

## Model notes

- **Each screen is a thin wrapper.** `ExplosionsModel`, `InelasticModel` and
  `ElasticModel` only pass an `Experiment` to `CartCollisionsModel`; the three
  screen views only pass their screen summary to `VirtualLabScreenView`. Do not
  fork behaviour per screen — add an option.
- **Tables are lab-wide.** Reset All resets the screen, *not* the tables (that
  would erase other screens' rows); the dialog has its own *Clear tables*.
- **Calculated cells are graded against the student's own measurements**, never
  against the simulation's true velocities — the Smart Carts screen has no truth
  to compare with, and the lab grades arithmetic, not luck.
- **The blue cart reports a reversed sign by default** (`blueCartReversed`
  preference). This is the handout's reference-frame warning, reproduced on
  purpose; tests rely on it.

## Accessibility

Three layers per Baton/ACCESSIBILITY.md: every control has an `accessibleName`
from the `a11y` / `labels` string groups; each screen has a live
`*ScreenSummaryContent` (velocities, total momentum and KE, recording state; for
Smart Carts, connection and live position); traversal order is set in
`LabScreenView.setTraversalOrder` with Reset All last. Carts and both fit-interval
edges are `RichDragListener`s (left/right keys, Shift for fine steps), documented
in `CartCollisionsKeyboardHelpContent`. Finishing an interval edit announces both
fits.

## Compliance carve-outs

- `tests/generators.test.ts` removed: it tested the template's `rename` /
  `scaffold-screens` scripts, which `check-template-drift --fix` removes from a sim.
- `TimeModel` removed: the model keeps its own substep clock (the physics needs
  0.2 ms substeps and samples on that grid).

### Template-owned files (drift-checked)

Infrastructure files are owned by this template and must stay byte-identical in every sim
(after substituting the sim's own name). `Baton/scripts/check-template-drift.sh <Sim>` compares a
sim against this repo using `Baton/config/template-manifest.json`, which lists the exact files,
the required `package.json` scripts, and the few keys a sim may extend (extra `biome.json`
ignores, extra tsconfig `types`, CSP/Permissions additions).

To diverge on purpose, add a bullet to the sim's own `## Compliance carve-outs` section naming
the file in backticks and the reason, e.g. ``- `tests/setup.ts`: adds a WebGPU mock``. The drift
checker treats a file named there as approved. Fix template-owned files **here first**, then
propagate — never hand-edit one in a single sim.

Toolkit exports that only some sims use (`CartCollisionsButtonOptions.ts`, `CartCollisionsControlOptions.ts`, the
`memoryLeak.ts` helpers) carry a `@public` JSDoc tag so dead-code checkers such as knip do not
report them as unused in the sims that skip them. Tag any new toolkit export the same way.

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

## Testing

| Path | Purpose |
|---|---|
| `tests/collisionPhysics.test.ts` | Momentum conserved in every mode; elastic/inelastic/explosion energies against the textbook formulas |
| `tests/CartCollisionsModel.test.ts` | Sampling, encoder zero, blue-cart sign, fitted velocities, auto-stop |
| `tests/fitMath.test.ts`, `tests/labTables.test.ts` | Fit, differentiator, table formulas, tolerance, CSV |
| `tests/SmartCartChannel.test.ts` | Connect / cancel / zero / Change Sign against `tests/helpers/FakeSmartCart.ts` |
| `tests/memory-leak.test.ts` | `describeDisposalLeaks` for Recording, GraphState, LabNotebook, SmartCartChannel |
| `tests/fuzz/fuzz.spec.ts` | Template-owned pointer + keyboard fuzz |

Physics tests set `rollingFriction` to 0; friction legitimately leaks momentum.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` on app, scripts, and tests) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` | Playwright fuzz smoke (pointer + keyboard, `?ea`, 30s each; `npm run test:fuzz -- 90` to change) |
| `npm run test:fuzz:quick` | 10s fuzz |
| `npm run test:fuzz:long` | 300s fuzz |
| `npm run icons` | Regenerate PWA icons; seed missing screenshots, preserve existing ones |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |

`src/init.ts` reads `version` from `package.json`, so the patch bump shows up in the About dialog
without a second edit.
