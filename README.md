# Quantum Tunneling Explorer — v1.1 Dispersion

v1.1 extends the v1.0 quantum-scattering simulator with quantitative wave-packet dispersion diagnostics. The propagation physics is still handled by the same Crank–Nicolson solver; the new analysis layer measures how the evolving state translates, spreads, and redistributes in momentum space.

## Main idea

A wave packet can change in two conceptually different ways:

- **Translation** — the packet center moves, tracked by `⟨x⟩(t)`.
- **Dispersion** — the packet width changes, tracked by `σx(t)`.

For a continuum free electron,

```text
E(k) = ħ²k²/(2m_e)
vg(k) = (1/ħ) dE/dk = ħk/m_e
```

A Gaussian contains a finite spread of wave numbers. Because different `k` components have different group velocities, the packet spreads even in free space.

For the initial state used by the simulator,

```text
ψ(x,0) ∝ exp[-(x-x0)²/(4σ0²)] exp(ik0x)
```

`σ0` is the initial standard deviation of the probability density. The continuum free-space reference is

```text
σx(t) = σ0 sqrt[1 + (C t/(ħ σ0²))²]
C = ħ²/(2m_e)
```

The v1.1 diagnostics plot this reference as a dashed curve so scattering-induced changes can be distinguished from ordinary free-packet spreading.

## New in v1.1

### 1. Free propagation mode

The potential selector now includes:

```text
Free propagation
```

and the preset menu adds:

```text
Free-packet dispersion · wave packet
```

This is a reference experiment with `V(x)=0`. It is useful for isolating dispersion before introducing a barrier or well.

### 2. Dispersion diagnostics panel

Wave-packet mode now reveals a fourth visualization block:

```text
IV. Wave-Packet Dispersion
```

with live readouts for:

- mean position `⟨x⟩`
- packet width `σx`
- mean wave number `⟨k⟩`
- wave-number width `σk`
- continuum free-electron group velocity `vg(⟨k⟩)`

The diagnostics card is hidden in plane-wave mode.

### 3. Translation vs. spreading history

The first diagnostic chart tracks:

```text
⟨x⟩(t)
σx(t)
```

on separate y-axes. A dashed curve shows the continuum free-Gaussian prediction for `σx(t)`.

This makes the distinction explicit:

```text
center motion  ≠  width growth
translation    ≠  dispersion
```

### 4. Momentum-space spectrum

The simulator estimates

```text
|ψ̃(k)|²
```

using a diagnostic discrete Fourier transform of the current position-space wavefunction.

The spectrum is normalized over the displayed finite `k` window and is refreshed at a lower rate than the main animation so it does not dominate browser performance.

Useful observations:

- free propagation: the momentum distribution remains nearly unchanged
- reflection: a negative-`k` component develops
- transmission: positive-`k` content remains
- simultaneous reflected/transmitted packets: the spectrum can become bimodal

### 5. Free-electron dispersion relation

The third diagnostic chart displays

```text
E(k) = ħ²k²/(2m_e)
```

with markers for:

- the initial carrier wave number `k0`
- the current full-state mean wave number `⟨k⟩`

The parabolic curvature is the origin of free-electron wave-packet dispersion.

### 6. Dedicated analysis module

v1.1 adds:

```text
js/dispersionAnalysis.js
```

The software responsibilities are now:

```text
wavePacketSolver.js
    evolve ψ(x,t)
          ↓
dispersionAnalysis.js
    measure the state
          ↓
renderer.js
    display diagnostics
```

This keeps the TDSE propagator separate from derived observables and makes future effective-mass work easier.

## Numerical definitions

### Position moments

The diagnostics evaluate the normalized moments

```text
⟨x⟩ = ∫ x |ψ|² dx / ∫ |ψ|² dx
σx² = ⟨x²⟩ - ⟨x⟩²
```

The normalization denominator is retained explicitly because the distant absorbing layers can eventually remove outgoing probability from the computational window.

### Momentum moments

Using `p = ħk`,

```text
⟨k⟩ = ∫ ψ* (-i ∂/∂x) ψ dx / ∫ |ψ|² dx
⟨k²⟩ = ∫ |∂ψ/∂x|² dx / ∫ |ψ|² dx
σk² = ⟨k²⟩ - ⟨k⟩²
```

A fourth-order centered finite-difference derivative is used for these diagnostic moments.

### Momentum transform

For visualization,

```text
ψ̃(k) = (1/sqrt(2π)) ∫ ψ(x) exp(-ikx) dx
```

is sampled over a symmetric finite `k` window. The diagnostic transform may stride over very large position grids to keep interactive performance reasonable.

## Important numerical note: physical vs. numerical dispersion

The displayed `E(k)=ħ²k²/(2m_e)` curve is the **continuum free-electron dispersion relation**.

The Crank–Nicolson calculation uses a finite-difference spatial Hamiltonian and therefore has a small additional **numerical dispersion**. At the present grid spacing the free-packet evolution follows the continuum reference closely, but not identically. Refining the spatial grid reduces this difference.

This distinction is scientifically useful:

```text
physical dispersion
    comes from the curvature of the physical E(k)

numerical dispersion
    comes from approximating derivatives on a finite grid
```

## Core v1.0 features retained

- Plane-wave stationary scattering
- Gaussian wave-packet propagation
- Potential step
- Single barrier
- Finite well
- Double barrier / resonant tunneling
- Adaptive open-line numerical window
- Absorbing edge layers
- `Re[ψ]`, `Im[ψ]`, `|ψ|`
- cyclic phase spectrum
- `|ψ|²`
- `R`, `T`
- `P_L(t)`, `P_int(t)`, `P_R(t)`
- presentation presets
- stable wavefunction y-axis
- Plotly in-place-array refresh fix

## Suggested experiments

### Experiment 1 — isolate free dispersion

Choose:

```text
Free-packet dispersion · wave packet
```

Press Play and compare:

```text
⟨x⟩(t)     packet translation
σx(t)      packet spreading
|ψ̃(k)|²    momentum distribution
```

The momentum spectrum should remain nearly unchanged while `σx` grows.

### Experiment 2 — change the initial width

Compare a broad and narrow initial packet.

A narrower `σx(0)` implies a broader momentum distribution, approximately consistent with

```text
σx σk ≈ 1/2
```

for the initial minimum-uncertainty Gaussian.

The narrower packet therefore disperses more rapidly.

### Experiment 3 — reflection in momentum space

Choose Direct tunneling and watch the momentum spectrum after the packet reaches the barrier.

A reflected packet generates spectral weight at negative `k`.

### Experiment 4 — above-barrier scattering

Choose Above-barrier reflection. The final momentum distribution can contain both positive- and negative-`k` components even when `E0 > V0`.

## Project structure

```text
quantum_tunneling_v1.1_dispersion/
├── index.html
├── style.css
├── README.md
└── js/
    ├── app.js
    ├── state.js
    ├── ui.js
    ├── presets.js
    ├── complex.js
    ├── potentials.js
    ├── stationarySolver.js
    ├── wavePacketSolver.js
    ├── dispersionAnalysis.js
    └── renderer.js
```

## Performance strategy

The position-space animation remains near the v1.0 update rate. The more expensive momentum transform and three dispersion plots are refreshed less often.

Conceptually:

```text
TDSE / position-space display   ~20 fps
Dispersion diagnostics          ~4–5 fps
```

This keeps the wave-packet motion responsive while still providing live quantitative analysis.

## Run locally

```bash
python3 -m http.server 8000
```

then open:

```text
http://localhost:8000
```

## Suggested Git workflow

After v1.0 is merged into `main`:

```bash
git switch main
git pull

git switch -c feature/dispersion-analysis
```

Copy the v1.1 files into the repository, test locally, then:

```bash
git status
git diff
git add .
git status
git commit -m "Add wave-packet dispersion diagnostics"
git push -u origin feature/dispersion-analysis
```

Open a Pull Request into `main`.

## Natural next extension

A particularly useful semiconductor extension is to replace the fixed free-electron mass with a material-dependent effective mass `m*`.

Then the same diagnostics would directly show how changing band curvature modifies:

```text
E(k)
vg
σx(t)
```

That would connect the simulator from generic quantum scattering to semiconductor carrier dynamics.
