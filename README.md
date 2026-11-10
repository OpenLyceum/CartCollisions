# Cart Collisions

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

The PASCO Smart Cart collision lab, on screen and with real carts. Launch two
carts apart with a spring plunger, stick them together with Velcro, or bounce
them off each other's magnets — with equal masses, or with two mass bars in the
blue cart. Fit straight lines to the position–time graph to get each cart's
velocity just before and just after, fill in the lab's two tables, and find out
for yourself which of momentum and kinetic energy survives each kind of collision.

## Features

- **The three experiments of the handout, one screen each.** *Explosions*
  (plunger positions 1–3, tap the trigger), *Inelastic* (Velcro) and *Elastic*
  (magnetic bumpers), each with an *Equal mass* / *2 bars in blue cart* switch.
- **Collisions that take time.** Every interaction is a force law — a spring
  plunger, a magnetic repulsion, a damped Velcro joint, hard plastic contact — so
  the velocity changes over tens of milliseconds, as real data does, and choosing
  *where* to fit is part of the lab.
- **Smart Cart data, not perfect numbers.** Position is counted in whole
  wheel-encoder steps (0.12 mm), sampled at 50, 100 or 250 Hz, and zeroed where
  each cart sat when recording began. Masses on the balance are a few grams off
  nominal. A little rolling friction slows the carts.
- **The reference-frame trap, on purpose.** The blue cart faces the red one, so
  — exactly as the handout warns — it reports the opposite sign until you tick its
  *Change sign* box. (Preferences can switch that realism off.)
- **Best-fit lines on a graph you can shape.** Drag across the position graph to
  shade an interval; read each cart's slope ± uncertainty; send it to *before* or
  *after* in Table 1 with one click. Zoom to the interval, or show it all.
  Velocity and force graphs too.
- **Data Table 1 and Table 2 for all six runs**, shared across screens. Type the
  calculated columns (Δv, Δp, kinetic energies, ΔE, ΔE/Eᵢ) on a keypad, then
  *Check my calculations* against the values computed from your own measurements,
  or *Show expected values*. *Download CSV* for the write-up. The conclusion
  questions are there too.
- **Real Smart Carts.** The *Smart Carts* screen connects two PASCO Smart Carts
  (ME-1240) over Web Bluetooth and feeds their position and force into the same
  graph, fit and tables — no Capstone, no install.
- Fully keyboard operable, with a live screen-reader summary; installable and
  offline-capable (PWA); projector colour profile; English, French and Spanish.

## Quick Start

```bash
npm install
npm run icons     # generate PWA icons on a fresh clone
npm start         # → http://localhost:5173
```

To use real carts, open the **Smart Carts** screen in **Chrome or Edge** over
HTTPS (or `localhost`), switch the Smart Cart on, and press *Connect* in the red
or blue panel. Push the cart by hand: the live *x* reading should move, and
*Change sign* should flip it. Firefox and Safari have no Web Bluetooth; the
screen says so.

Query parameters: `?sampleRate=250`, `?rollingFriction=0` (frictionless
track), `?blueCartReversed=false` (both carts report the track's sign).

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

New sims start at `version: "0.0.0"` in `package.json`. Bump only when cutting a release (for example `npm version patch` and a matching git tag). Keep `name` in kebab-case; it is separate from the SceneryStack sim identifier in `src/init.ts`, which reads its `version` from `package.json`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |
| [pasco-ble](https://www.npmjs.com/package/pasco-ble) | 0.3.70 | Smart Cart over Web Bluetooth (loaded only on the Smart Carts screen) |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
