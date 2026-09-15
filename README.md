# Quantum Tunneling Explorer — v0.9 Phase Spectrum

v0.9 adds a cyclic phase visualization for the complex wavefunction while preserving the v0.8 stationary and time-dependent solvers.

## New in v0.9

### Cyclic phase spectrum

The complex wavefunction can be written as

```text
ψ(x,t) = |ψ(x,t)| exp[i φ(x,t)]
```

with

```text
φ(x,t) = arg ψ(x,t) = atan2(Im ψ, Re ψ)
```

The phase is periodic, so the simulator does **not** plot phase as an ordinary vertical line. Instead, v0.9 adds a horizontal cyclic color spectrum inside Panel II.

The hue map wraps continuously across

```text
−π  →  0  →  +π
```

and the colors at `−π` and `+π` are identical, reflecting the periodic nature of phase.

### Amplitude-weighted visibility

Phase becomes physically ill-defined when the wavefunction amplitude approaches zero. To avoid displaying a visually strong but meaningless phase in those regions, the phase-spectrum brightness is weighted by `|ψ|`.

Therefore:

- large `|ψ|` → saturated, easy-to-read phase color
- small `|ψ|` → color fades toward white
- `|ψ| ≈ 0` → phase is effectively hidden

This is especially useful for Gaussian wave packets because the phase color is visible primarily where the packet actually has appreciable probability amplitude.

### Plane-wave component mode

When the line plot is set to **Components**, the phase spectrum still represents the **total state**

```text
ψtotal = ψincident + ψreflected + ψinterior/transmitted
```

rather than trying to combine several unrelated component phases into a single strip. The interface labels this explicitly.

### Wave-packet phase evolution

In Wave packet mode, the spectrum is calculated directly from the time-dependent Crank–Nicolson state at every displayed frame.

This makes effects such as propagation, phase winding, reflection, interference, and transmitted-packet phase evolution directly visible.

## Wavefunction representations

Panel II now supports:

- `Re[ψ]`
- `Im[ψ]`
- `|ψ|`
- **Phase spectrum** — new in v0.9

The phase spectrum can be enabled independently of the three line representations.

## Features retained from v0.8

### Wave forms

- stationary Plane wave
- time-dependent Gaussian Wave packet

### Piecewise-constant potentials

- Potential step
- Single barrier
- Finite well
- Double barrier

### Three main visualization blocks

1. `V(x)` and `E` / `E0`
2. complex wavefunction `ψ(x,t)` plus optional phase spectrum
3. probability density `|ψ(x,t)|²`

### Stationary observables

```text
R, T
```

### Wave-packet observables

```text
P_L(t), P_R(t)
```

These become asymptotic reflection/transmission probabilities only after the scattered packets have separated from the interaction region.

## Numerical methods

### Plane wave

`stationarySolver.js` handles boundary-matched scattering through arbitrary piecewise-constant layers.

### Wave packet

`wavePacketSolver.js` solves

```text
iħ ∂ψ/∂t = [-(ħ²/2m) ∂²/∂x² + V(x)] ψ
```

using the Crank–Nicolson finite-difference method.

The phase-spectrum feature is a rendering layer only; it does not modify either quantum solver.

## Project structure

```text
quantum_tunneling_v0.9_phase_spectrum/
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
    ├── wavePacketSolver.js
    └── renderer.js          ← phase-spectrum rendering added here
```

## Run locally

Because the project uses ES modules, serve it through a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Suggested experiments

### 1. Plane-wave phase winding

Use a single barrier and enable only:

```text
Phase spectrum
```

Then vary `E` and observe how the spatial phase gradient changes.

### 2. Incident/reflected interference

Use Plane wave → Components and enable the phase spectrum. The line plot separates the components, while the spectrum continues to show the phase of the total state.

### 3. Wave-packet propagation

Switch to Wave packet, enable Phase spectrum, press Play, and watch the colored phase pattern move with the packet.

### 4. Low-amplitude regions

Observe the packet tails: the phase colors fade out because `|ψ|` is small there. This is intentional and prevents over-interpreting phase where the wavefunction is nearly zero.

## Suggested Git workflow

Start from the current `main` branch:

```bash
git switch main
git pull
```

Create the new feature branch:

```bash
git switch -c feature/phase-spectrum
```

After copying and testing v0.9:

```bash
git status
git diff
git add .
git status
git commit -m "Add cyclic wavefunction phase spectrum"
git push -u origin feature/phase-spectrum
```

Then open a Pull Request into `main`.

## Next milestone

The planned v1.0 milestone can now focus on product-level polish and semiconductor framing rather than another solver rewrite. Possible goals include:

- interface cleanup and responsive polish
- concise technical help/tooltips
- preset semiconductor examples
- clearer parameter grouping and units
- presentation-ready explanatory notes

Dispersion diagnostics such as `|ψ̃(k)|²`, packet-width evolution, `E(k)`, group velocity, and effective mass can remain a post-v1.0 extension.
