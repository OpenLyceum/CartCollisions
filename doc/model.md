# Cart Collisions — model

## The apparatus

Two PASCO ME-1240 Smart Carts on a 1.2 m track between two end stops. Positions
are measured along the track from the left stop, positive to the right; the red
cart is always on the left. Each cart is 0.17 m long and about 0.25 kg; a mass
bar is about 0.25 kg. Each cart and bar is drawn once per session within ±4 g of
nominal, so the balance never reads a perfectly round number and "equal" masses
differ by a few grams, as on a real bench.

## Interactions

Every interaction is a force, integrated with semi-implicit Euler at 0.2 ms
substeps (`collisionPhysics.ts`). The gap between the facing bumpers is
`d = x_blue − x_red − L`. Each force between the carts acts equal and opposite,
so total momentum is conserved to rounding whenever friction and the end stops do
not act — the tests check it to 1e-6.

| Bumper | Force on the blue cart (red feels the opposite) | Energy |
|---|---|---|
| Magnets (elastic) | K (1/(d+d₀)² − 1/(d_c+d₀)²) for d < d_c; K = 3×10⁻⁴ N·m², d₀ = 5 mm, d_c = 8 cm | Conservative: kinetic energy returns to its initial value |
| Velcro (completely inelastic) | Grabs when d ≤ 1 mm while closing; thereafter −k d + c (v_r − v_b), k = 3000 N/m, c = 35 N·s/m (near critical) | The relative motion is damped out: the carts lose the fraction m_b/(m_r+m_b) of their kinetic energy when the blue cart starts at rest |
| Plunger (explosion) | Once triggered, k_p (x_p − d) while d < x_p; k_p = 200 N/m, x_p = 1, 2 or 3 cm for positions 1–3 | Releases ½ k_p x_p² (0.04 J at position 2) into kinetic energy |
| Bare contact (all) | k_c (−d) + c_c (v_r − v_b) while pressing, d < 0; k_c = 8000 N/m | Lossy, like plastic on plastic |

End stops are the same stiff, more heavily damped contact. Rolling friction
(default μ = 0.002) decelerates each moving cart by μg and never reverses it.

With the magnets the velocities change over roughly 50–100 ms, with Velcro over
about 20 ms, and the plunger pushes for about 50 ms: long enough to see on a
100 Hz graph, which is why the fit interval must avoid the collision itself.

### Results the tests pin

- Elastic, blue at rest: v_r′ = (m_r − m_b)/(m_r + m_b) · v, v_b′ = 2m_r/(m_r + m_b) · v.
- Velcro, blue at rest: v′ = m_r v/(m_r + m_b), kinetic energy lost = m_b/(m_r + m_b).
- Explosion from rest: m_r v_r′ + m_b v_b′ = 0 and the carts gain ½ k_p x_p².

## What a Smart Cart reports

A Smart Cart measures its own wheel travel, not where it is on the track. The
virtual cart reproduces that:

1. **Zero at start.** Position is the displacement since recording began.
2. **Encoder counts.** It is rounded to whole steps of 0.09895 m / 816 counts
   ≈ 0.121 mm — the RotaryPos parameters of PASCO sensor 2027.
3. **Sign.** Positive is the way the cart faces. The blue cart faces the red one,
   so by default it reports the opposite of the track's sign. *Change sign* flips
   either cart, as in Capstone's Smart Cart Position Sensor settings.
4. **Samples** are taken on the substep grid at 50, 100 or 250 Hz.
5. **Force** is the load cell behind the bumper: the interaction force on that
   cart, in the cart's own sign convention.

Velocity is not reported separately: it is derived from position with a centred
five-sample least-squares window, for virtual and real carts alike.

## The fit

`fitLine` fits y = a t + b by ordinary least squares to the samples inside the
shaded interval and reports the slope's standard error,
σ_a = √(Σr²/(n−2) / Σ(t − t̄)²). On the position graph the slope is the velocity;
on the velocity graph the interval's mean is offered instead. Either can be sent
to Table 1, rounded to 1 mm/s.

## The tables

For each run, from Table 1's measured masses and velocities:

- Δv = v_f − v_i, Δp = m Δv for each cart (eq. 1).
- E = ½ m v² for each cart before and after (eq. 3).
- E_f − E_i is the change in the total, and (E_f − E_i)/E_i is given in percent.
  It is undefined when E_i = 0 — every explosion — and the cell expects nothing.

A typed value is marked correct when it is within 2 % of the expected value or a
small absolute floor (1 mm/s, 0.001 kg·m/s, 0.5 mJ, 1 percentage point), which
allows for rounding the inputs to three figures.
