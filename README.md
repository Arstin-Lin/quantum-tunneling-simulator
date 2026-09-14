# Quantum Tunneling Explorer — v0.7 Potential Forms

v0.7 generalizes the stationary plane-wave solver from one rectangular barrier to several piecewise-constant potentials.

## New potential forms

- Potential step
- Single finite barrier
- Finite well
- Double barrier

The double-barrier mode adds an adjustable inter-barrier spacing `d` and can exhibit resonant transmission as the energy is varied.

## Solver architecture

Instead of solving one hard-coded barrier with four coefficients, v0.7 propagates the state vector

```text
[ psi(x) ]
[ psi'(x)]
```

through each constant-potential layer. For a layer of width `d`, the propagation matrix is constructed from the local complex wave number. This formulation works for both propagating and evanescent regions and has a smooth `k -> 0` threshold limit.

The left and right asymptotic leads are then matched to incident/reflected and transmitted solutions to obtain `r`, `t`, `R`, and `T`.

`R + T` remains an internal consistency diagnostic only.

## Current UI

The three scientific panels remain:

1. Potential / Energy Landscape
2. Complex Wavefunction
3. Probability Density

The wavefunction y-axis is explicitly locked using the time-independent magnitude, preventing visual vibration during animation.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Suggested Git workflow

Create the next feature branch from an updated main branch:

```bash
git switch main
git pull
git switch -c feature/potential-forms
```

After testing:

```bash
git status
git diff
git add .
git status
git commit -m "Add piecewise potential forms and multilayer solver"
git push -u origin feature/potential-forms
```
