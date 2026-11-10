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

The streaming subclass reaches into two non-public fields (`_sensorManager.state`
for the channel list, `_protocol.sendAck`). That is why pasco-ble is pinned to
exactly `0.3.70`: check both fields still exist before bumping it.

### Streaming, not polling

pasco-ble only offers one-shot reads, and **a one-shot read of the Smart Cart's
position sensor carries no live encoder count**. Tested with two ME-1240 carts, one
answered 0 however far it rolled, and the other a constant 32 625. pasco-ble then
added that value to "Position" on every read, reaching thousands of metres while
the cart sat still. The encoder only reports when the cart samples on its own
clock, which is how PASCO's software reads it.

So `BluetoothSmartCart` subclasses the library's device class at load time. It
keeps the library's connection, sensor discovery and command writes, and does the
sampling itself (protocol in `smartCartStream.ts`, the same commands MotionSensor
uses for the PS-3219):

1. Stop any sampler left running, then send each channel's service
   `[0x01, period µs (u32 LE), 0, 0]`.
2. Send the device service `[0x06, period ms (u16 LE) × channel count]`.
3. Each sensor service then pushes `[sequence < 0x20, sample, …]`. Position samples
   are signed 16-bit count *changes*, summed into position; force samples go
   through the factory line (32768 → 0 N, 1000 → 100 N).
4. Every 8 packets per service, acknowledge with `[0, 0, 0, 0, sequence]`. The
   periodic packets are not passed on to pasco-ble, which would also decode them
   and acknowledge with a one-byte packet.

Samples are timed on the cart's clock (index × period), offset to the host time
sampling began, so each cart's trace is evenly spaced. The two carts start a few
milliseconds apart; that offset is the only timing error between them. The default
period is 20 ms (50 Hz); `?smartCartPeriod=` changes it. `?showDiagnostics` shows
the summed counts, packets received, packets missed (from gaps in the sequence
numbers) and the sample rate.

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
