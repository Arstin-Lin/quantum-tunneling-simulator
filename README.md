# Quantum Tunneling Explorer — v1.0

v1.0 is the presentation-ready milestone for the one-dimensional quantum tunneling simulator developed for an Introduction to Semiconductor project.

The release keeps the stationary and time-dependent physics introduced in v0.7–v0.9, adds a clearer semiconductor interpretation, introduces verified presentation presets, improves the numerical spatial domain used for wave packets, and consolidates several visualization fixes.

## Core physics

### Wave forms

- **Plane wave** — stationary scattering state
- **Wave packet** — time-dependent Gaussian packet

### Potential structures

- Potential step
- Single barrier
- Finite well
- Double barrier

These are idealized piecewise-constant one-dimensional potentials. They can be interpreted as simplified models of band offsets, tunnel barriers, quantum wells, and resonant-tunneling structures.

### Visualization blocks

1. Potential / Energy Landscape: `V(x)` and `E` or `E0`
2. Complex Wavefunction: `Re[ψ]`, `Im[ψ]`, `|ψ|`, optional cyclic phase spectrum
3. Probability Density: `|ψ|²`

### Stationary observables

```text
R, T
```

The stationary multilayer solver internally checks probability-flux conservation.

### Wave-packet observables

```text
P_L(t), P_int(t), P_R(t)
```

`P_int(t)` is the probability currently inside the interaction structure. Only after the scattered packets separate do `P_L` and `P_R` approach the asymptotic reflected and transmitted probabilities.

## Numerical methods

### Stationary scattering

`stationarySolver.js` propagates the state vector

```text
[ ψ, dψ/dx ]
```

through arbitrary piecewise-constant layers. The formulation remains regular at `E = V` and supports propagating and evanescent regions.

### Wave-packet propagation

`wavePacketSolver.js` solves

```text
iħ ∂ψ/∂t = [-(ħ²/2m_e) ∂²/∂x² + V(x)] ψ
```

with a Crank–Nicolson finite-difference propagator.

## New in v1.0

### 1. Adaptive open-line numerical window

Earlier versions used a fixed spatial scale near `|x| ≲ 12 nm`. v1.0 removes that fixed-looking limit.

The time-dependent solver now chooses the computational domain from:

- initial packet center `x0`
- packet width `σ`
- total potential-structure width
- a large free-propagation margin on both sides

The grid spacing is targeted near `0.028 nm` and the total number of grid points adapts between approximately 1200 and 2400 points.

The calculation is still necessarily finite. It approximates the whole line `x ∈ R` by placing absorbing layers far from the interaction region. The active numerical window and absorbing-edge width are shown beside the Play/Reset controls.

Typical default single-barrier packet domain:

```text
x ≈ -18 nm ... +25 nm
```

rather than the previous approximately `-12 nm ... +12 nm` view.

### 2. Presentation presets

Four verified starting scenarios are included:

- **Direct tunneling · wave packet**
- **Above-barrier reflection · wave packet**
- **Finite quantum well · plane wave**
- **Resonant double barrier · plane wave**

The resonant double-barrier preset uses

```text
E  = 3.3 eV
V0 = 8.0 eV
L  = 0.2 nm
d  = 1.2 nm
```

and the stationary solver gives approximately

```text
T ≈ 0.99939
```

showing resonant transmission even though `E < V0`.

Changing any physical control automatically returns the preset selector to `Custom`.

### 3. Semiconductor framing

The interface now identifies the intended simplified interpretation:

- step → band-offset interface
- barrier → tunnel barrier
- well → quantum-well region
- double barrier → resonant-tunneling structure

A collapsible Model Scope section also states the important limitations. v1.0 still uses the free electron mass `m_e`; material-dependent effective mass is intentionally reserved for a later extension.

### 4. Wave-packet probability partition

Wave-packet mode now displays all three spatial probability sectors:

```text
P_L(t), P_int(t), P_R(t)
```

This makes it clearer when probability is still inside the barrier/well structure during the interaction.

### 5. Wavefunction refresh fix

The Crank–Nicolson solver updates the real and imaginary arrays in place. Plotly can otherwise reuse stale traces when `|ψ|` is hidden.

v1.0 explicitly changes Plotly's `datarevision` with simulation time, so `Re[ψ]` and `Im[ψ]` continue animating correctly whether or not the envelope is displayed.

### 6. Wider stationary lead view

Plane-wave plots now show a somewhat larger lead region around the potential structure, improving the visibility of incident/reflected interference and transmitted phase evolution.

## Phase visualization retained from v0.9

The phase spectrum represents

```text
φ(x,t) = arg ψ(x,t)
```

with a cyclic hue map. Brightness is weighted by `|ψ|`, so phase is visually suppressed where the amplitude is nearly zero.

## Project structure

```text
quantum_tunneling_v1.0_release/
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
    └── renderer.js
```

## Run locally

Because the project uses ES modules, serve the project directory through a local server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Suggested v1.0 checks

### Direct tunneling

Choose the Direct tunneling preset, press Play, and observe the packet split into reflected and transmitted components.

### Above-barrier reflection

Choose Above-barrier reflection. Even for `E0 > V0`, the reflected packet should not vanish identically.

### Resonant double barrier

Choose Resonant double barrier. In plane-wave mode the displayed transmission should be near unity despite `E < V0`.

### Phase spectrum

Enable Phase spectrum in either wave form and observe phase winding, interference, and reflected/transmitted phase structure.

### Envelope-independent animation

In Wave packet mode, turn off `|ψ|` while leaving `Re[ψ]` and/or `Im[ψ]` enabled. The visible complex-wavefunction traces should continue evolving normally.

## Suggested Git workflow

After v0.9 has been merged into `main`:

```bash
git switch main
git pull

git switch -c release/v1.0
```

Copy the v1.0 files into the repository and test locally. Then:

```bash
git status
git diff
git add .
git status
git commit -m "Prepare v1.0 quantum tunneling simulator"
git push -u origin release/v1.0
```

Open a Pull Request from `release/v1.0` into `main`.

After merging on GitHub:

```bash
git switch main
git pull origin main
```

## Post-v1.0 roadmap

The next physics extension can focus on dispersion diagnostics rather than core simulator architecture:

- momentum-space distribution `|ψ̃(k)|²`
- packet width `σx(t)`
- group velocity
- dispersion relation `E(k)`
- semiconductor effective mass `m*`

Those features can build directly on the time-dependent solver already present in v1.0.
