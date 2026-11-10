# Cart Collisions — implementation notes

## Shape

```
main.ts ── LabNotebook (one, shared) ── CartCollisionsPreferencesModel (one, shared)
   │
   ├─ Explosions / Inelastic / Elastic screens
   │     model: CartCollisionsModel(experiment)  ── Recording, GraphState
   │     view:  VirtualLabScreenView ── LabScreenView
   │
   └─ Smart Carts screen
         model: SmartCartsModel ── 2 × SmartCartChannel(BluetoothSmartCart) ── Recording, GraphState
         view:  SmartCartsScreenView ── LabScreenView
```

`TLabModel` (`common/model/LabModel.ts`) is what every screen offers the shared
view: a `Recording`, a `GraphState`, the notebook, the active table row, and
record/stop/clear. `LabScreenView` builds the graph, the fit panel, the record
controls, the Lab Tables dialog and Reset All from that alone, so the Smart Carts
screen is the virtual screens with a different source — the same rule MotionSensor
follows for its sensor screen, and for the same reason: a student who has done the
virtual lab recognises the real one instantly.

## Time and sampling

`CartCollisionsModel.step` truncates a frame to 50 ms, splits it into 0.2 ms
substeps, and samples on that grid whenever the next sample time is reached, so
the sample interval is exact at any frame rate. When nothing moves it skips the
physics but keeps sampling, so a recording started before the push shows the flat
"before" segment students need for v_i = 0. `Recording.flush()` emits at most
once per frame; the graph redraws from there.

Recording stops by itself after 10 s, or when a cart comes within 1 cm of an end
stop — the handout's "stop recording before either cart reaches the end".

## The graph

`TimeGraphNode` is written directly on bamboo rather than copied from
MotionSensor's `ConfigurableGraph`: the x axis is always time, there are always
two series, and the only gesture is the fit interval. The y range follows the
data visible in the current time window (with a per-quantity minimum span, so a
cart at rest is not magnified into encoder noise). Ticks use 1-2-5 steps
(`formatting.ts`).

`GraphState.fitResultsProperty` recomputes both fits when the interval, the
quantity, or the recording changes (a revision counter bumped by the recording's
emitter).

## The tables

`LabNotebook` holds a `Property<number | null>` per cell. Formulas and tolerance
live in pure `labTables.ts`; `LabTablesDialog` only draws. Each cell's colour and
"expected" line depend on every cell of its row, because the expected value of a
calculated cell is computed from that row's measurements. One `KeypadDialog` is
shared by every cell of a dialog.

## Smart Carts

### Library

The link uses [`pasco-ble`](https://www.npmjs.com/package/pasco-ble)
(OpenPhysics/pascoTS), which knows the Smart Cart's datasheets — Position
(RotaryPos, sensor 2027) and Force (sensor 2025). It pulls in mathjs, so it is
loaded with a dynamic `import()`: Vite splits it into its own chunk, the three
virtual screens never download it, and `SmartCartsModel` starts the import as
soon as it is built (when Web Bluetooth exists), so it is ready before the
student clicks *Connect*. Chrome's user activation lasts a few seconds, so the
picker still opens after that `await`.

### Polling and timestamps

`pasco-ble` reads on demand (one Bluetooth round trip per `readDataList`), so
`SmartCartChannel` runs its own loop: read, then wait 20 ms. Each sample is
stamped on the host at the midpoint of its round trip, and `SmartCartsModel`
subtracts the time *Record* was pressed. The two carts are polled independently
and sampled at different instants, which is why every `CartTrace` has its own
time column.

The cost is timing jitter of a few milliseconds and an effective rate of
roughly 20–40 Hz per cart, depending on the adapter. That is plenty for straight-
line fits over a few tenths of a second before and after a collision, but it
smooths the collision itself. A future version could use the cart's own
periodic sampling (as MotionSensor does for the PS-3219) for device-clocked data.

### Zero and sign

Recording zeroes both carts where they stand (Capstone's default). *Change sign*
is applied on the host; both live in `SmartCartChannel`, in that order, so an
offset captured with the sign flipped still zeroes where the cart stood.

### Errors

`connect()` never rejects: outcomes land on `connectionStateProperty` and
`errorMessageProperty`. A cancelled picker returns to *Not connected* silently.
Five failed reads in a row, or the cart dropping the link, disconnect the channel
and say so in its panel.

### Testing without hardware

`TSmartCartDevice` is the seam; `tests/helpers/FakeSmartCart.ts` implements it.
The headless fuzz browser has no Web Bluetooth, so the Connect buttons are
disabled there and the screen shows the unsupported-browser message.
