# Quantum Tunneling Explorer — v0.6 Plane-Wave Interface

This version builds the first presentation architecture on top of the modular v0.5 codebase.

## Visible changes

- Three scientific visualization blocks:
  1. Potential / Energy Landscape: `V(x), E`
  2. Complex Wavefunction: `psi(x,t)`
  3. Probability Density: `|psi(x,t)|^2`
- Plane-wave decomposition selector:
  - Total state
  - Components
- Wavefunction representations:
  - Real part
  - Imaginary part
  - Magnitude
- Optional energy-value labels
- Optional `R` and `T` readout
- Wave-packet choice is visible but intentionally disabled until the numerical propagator is implemented.

## Component mode

The stationary state is separated spatially into:

- incident component in Region I
- reflected component in Region I
- boundary-matched barrier-region state in Region II
- transmitted component in Region III

The probability-density block always shows the physical total-state density `|psi|^2`, including interference.

## Physics robustness

The stationary solver now includes the exact threshold form for `E = V0`, where the Region-II solution is linear in `x` rather than oscillatory or exponential. This avoids the singular `q = 0` form of the ordinary basis.

`R + T ≈ 1` remains an internal consistency check only and is not displayed.

## Run locally

Because the project uses ES modules:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Recommended Git feature-branch workflow

```bash
git status
git pull
git switch -c feature/plane-wave-interface
```

After replacing/testing the files:

```bash
git status
git diff
git add .
git commit -m "Add plane-wave interface and three-panel visualization"
git push -u origin feature/plane-wave-interface
```

After review, merge the branch into `main` on GitHub or locally.
