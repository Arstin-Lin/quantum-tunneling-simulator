# Quantum Tunneling Explorer — v0.8 Wave Packet Mode

v0.8 adds genuinely time-dependent quantum dynamics while preserving the v0.7 stationary plane-wave solver and all four piecewise-constant potential forms.

## New in v0.8

### Wave-form selector

The simulator now supports two distinct solvers:

- **Plane wave** — stationary scattering solution
- **Wave packet** — numerical time evolution of a localized Gaussian packet

The two modes share the same potential model and three visualization panels.

### Gaussian wave packet

The initial state is

```text
ψ(x,0) ∝ exp[-(x-x0)^2/(4σ^2)] exp(i k0 x)
```

where:

- `x0` is the initial packet center
- `σ` is the spatial standard deviation of `|ψ|²`
- `k0` is set by the selected central kinetic energy `E0`

```text
E0 = ħ² k0² / (2m)
```

Because a localized packet has a finite momentum spread, `E0` is the carrier/central kinetic energy rather than the exact expectation value of the total energy.

### Time-dependent propagation

The wave packet is evolved with the one-dimensional time-dependent Schrödinger equation

```text
iħ ∂ψ/∂t = [-(ħ²/2m) ∂²/∂x² + V(x)] ψ
```

using a **Crank–Nicolson finite-difference propagator**.

The implementation uses:

- `ħ = 0.6582119569 eV fs`
- `ħ²/(2m_e) = 0.0380998212 eV nm²`
- 900 spatial grid points
- a small internal time step (`0.003 fs` by default)
- multiple numerical steps per displayed frame

Crank–Nicolson is unitary for the Hermitian finite-grid Hamiltonian and is unconditionally stable. A weak absorbing mask is used only near the outer grid boundaries to suppress artificial reflections from the finite simulation box.

### Play / Pause / Reset

Wave-packet mode adds:

- **Play / Pause**
- **Reset**
- simulation-time readout in femtoseconds

Changing a physical parameter reconstructs the initial packet and pauses the propagation.

### Packet observables

For stationary plane waves the observable panel remains

```text
R, T
```

For wave packets it becomes

```text
P_L(t), P_R(t)
```

where the quantities are the instantaneous integrated probability in the left and right asymptotic regions.

They should not be interpreted as final `R` and `T` until the scattered packets have separated from the interaction region. During the interaction, probability may still occupy the potential region.

## Potential forms retained from v0.7

- Potential step
- Single barrier
- Finite well
- Double barrier

The same `potentials.js` profile is used by both the stationary and time-dependent solvers.

## Three visualization panels

### I. Potential / Energy Landscape

Shows `V(x)` together with:

- `E` for plane-wave mode
- central kinetic energy `E0` for wave-packet mode

### II. Complex Wavefunction

Selectable representations:

- `Re[ψ]`
- `Im[ψ]`
- `|ψ|`

The wave-packet y-axis is intentionally kept fixed during propagation. It can expand if a larger amplitude is encountered, but it does not shrink frame-by-frame.

### III. Probability Density

Shows

```text
|ψ(x,t)|²
```

For the normalized wave packet the vertical unit is `nm^-1`.

## Project structure

```text
quantum_tunneling_v0.8_wave_packet/
├── index.html
├── style.css
├── README.md
└── js/
    ├── app.js
    ├── state.js
    ├── ui.js
    ├── complex.js
    ├── potentials.js
    ├── stationarySolver.js
    ├── wavePacketSolver.js   ← new in v0.8
    └── renderer.js
```

### `wavePacketSolver.js`

Responsible for:

- initializing the normalized Gaussian state
- constructing the finite-difference Hamiltonian
- precomputing the Crank–Nicolson tridiagonal system
- advancing the state in time
- weak edge absorption
- integrated left/interior/right probabilities

The plotting code remains in `renderer.js`; numerical quantum mechanics remains outside the UI layer.

## Run locally

Because the project uses ES modules, use a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Suggested Git workflow

Start from the current main branch:

```bash
git switch main
git pull
```

Create the feature branch:

```bash
git switch -c feature/wave-packet
```

After copying/testing v0.8:

```bash
git status
git diff
git add .
git status
git commit -m "Add Crank-Nicolson wave-packet propagation"
git push -u origin feature/wave-packet
```

Then open a Pull Request into `main`.

## Numerical validation performed

The packet was checked for:

- normalization before interaction
- correct positive group-velocity motion
- operation with barrier, step, well, and double-barrier profiles
- strong reflection for `E0 < V0`
- partial reflection/transmission for `E0 > V0`

The default `E0 = 5 eV`, `V0 = 10 eV`, `L = 1 nm` single-barrier case becomes almost completely reflected, consistent with the extremely small stationary transmission for that barrier.

## Planned v0.9

The next planned feature remains the **phase-spectrum representation**:

```text
ψ = |ψ| exp(iφ)
```

with phase `φ = arg ψ` encoded using a cyclic color map.
