# Quantum Tunneling Explorer — v0.5 Modular Refactor

v0.5 reorganizes the simulator into separate interface, state, physics, and rendering modules. The purpose of this milestone is architectural: the stationary-scattering model remains the same while the code becomes easier to extend.

## Structure

```text
quantum_tunneling_v0.5_modular/
├── index.html
├── style.css
└── js/
    ├── app.js
    ├── state.js
    ├── ui.js
    ├── complex.js
    ├── potentials.js
    ├── stationarySolver.js
    └── renderer.js
```

- `index.html`: semantic page structure and module entry point.
- `style.css`: appearance and responsive layout only.
- `js/state.js`: central application state.
- `js/ui.js`: sliders, checkboxes, labels, and observable readouts.
- `js/complex.js`: minimal complex arithmetic.
- `js/potentials.js`: the potential-energy function `V(x)`.
- `js/stationarySolver.js`: boundary-matched stationary scattering solver.
- `js/renderer.js`: Plotly sampling and rendering.
- `js/app.js`: application orchestration and animation loop.

## Physics in v0.5

The stationary solver uses

```text
Region I:    exp(ikx) + r exp(-ikx)
Region II:   A exp(iqx) + B exp(-iqx)
Region III:  t exp(ikx)
```

with continuity of the wavefunction and its first derivative at both interfaces.

The same formulation covers both regimes:

- `E < V0`: `q` is imaginary and the barrier-region solution is evanescent.
- `E >= V0`: `q` is real and the barrier-region solution is oscillatory.

`R + T ≈ 1` is used only as an internal numerical consistency check and is not displayed in the interface.

## Run locally

Because v0.5 uses JavaScript ES modules (`import` / `export`), serve the project through HTTP instead of opening `index.html` via `file://`.

```bash
cd quantum_tunneling_v0.5_modular
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Stop the server with `Ctrl + C`.

GitHub Pages serves ES modules correctly as well.

## Git workflow for this milestone

Before editing your repository:

```bash
git status
git pull
```

After copying the v0.5 files into your repository and verifying the simulator locally:

```bash
git status
git diff
git add .
git commit -m "Refactor simulator into modular JavaScript files"
git push
```

## Planned next milestones

1. Three visualization blocks: `E`, complex `ψ`, and `|ψ|²`.
2. Plane-wave total/component display mode.
3. Potential-form selector for step, barrier, well, and double barrier.
4. Phase-spectrum rendering.
5. Wave-packet solver with adjustable initial position `x0` and width `sigma`.
6. Multi-barrier / resonant-tunneling support.
