# Quantum Tunneling Explorer — v1.2 Dual Interface

v1.2 reorganizes the simulator around two audiences without duplicating the physics engine.

```text
Presentation mode  → focused classroom story
Explore mode       → complete v1.1 laboratory
```

The stationary solver, Crank–Nicolson wave-packet propagator, potential definitions, and dispersion-analysis code are shared by both modes.

## Why v1.2 exists

By v1.1 the simulator had become substantially more capable than the minimum course requirement. That depth is useful for interested users, but exposing every control during a short presentation creates unnecessary cognitive load.

v1.2 therefore applies **progressive disclosure**:

```text
same physical state
       ↓
shared physics engine
       ↓
Presentation UI   Explore UI
focused subset    full laboratory
```

Switching interface mode does not change the underlying numerical method.

## Presentation mode

Presentation mode is the default opening experience.

It keeps the three core visualization blocks:

1. `V(x), E` — potential / energy landscape
2. `ψ(x,t)` — complex wavefunction
3. `|ψ(x,t)|²` — probability density

The visible controls are deliberately reduced to the parameters needed by the chosen scenario. Advanced wave-representation toggles, packet-width controls, phase visualization, dispersion diagnostics, and numerical-domain details are hidden.

For readability, Presentation mode renders the wavefunction as:

```text
Re[ψ] + |ψ|
```

while preserving the user's advanced display settings for Explore mode.

### Guided presentation scenarios

#### Basic quantum tunneling

A Gaussian packet with `E0 < V0` reaches a thin barrier. The presenter can vary:

- central kinetic energy `E0`
- barrier height `V0`
- barrier width `L`

and compare the left/interior/right probability during scattering.

Device connection: a thin tunnel barrier or idealized tunnel junction.

#### Above-barrier reflection

A packet with `E0 > V0` demonstrates that quantum reflection can remain nonzero even without a classically forbidden region.

#### Resonant tunneling

A double-barrier stationary state uses the verified resonance near:

```text
E = 3.3 eV
V0 = 8.0 eV
L = 0.2 nm
d = 1.2 nm
```

with stationary transmission close to unity. Varying `E`, `L`, or `d` shifts the system away from resonance.

Device connection: idealized resonant-tunneling heterostructures / resonant tunneling diodes.

## Explore mode

Explore mode restores the complete v1.1 feature set:

- free propagation
- potential step
- single barrier
- finite well
- double barrier
- stationary plane-wave scattering
- total/component decomposition
- Gaussian Crank–Nicolson wave packets
- adjustable `x0` and `σ`
- `Re[ψ]`, `Im[ψ]`, `|ψ|`
- cyclic phase spectrum
- `R`, `T`
- `PL(t)`, `Pint(t)`, `PR(t)`
- adaptive numerical domain and absorbing boundaries
- `⟨x⟩`, `σx`, `⟨k⟩`, `σk`, group velocity
- momentum-space spectrum `|ψ̃(k)|²`
- free-electron `E(k)` relation
- analytic free-Gaussian spreading reference

## Shared-state behavior

Presentation and Explore are not separate simulators.

If a user adjusts physical parameters and switches mode, the current physical state remains active. A presentation scenario is simply a convenient preset applied to that shared state.

Manual parameter changes mark the scenario as a custom state. This prevents the interface from claiming that a modified configuration is still one of the verified presets.

## Software architecture

```text
index.html
style.css
js/
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

The main v1.2 architectural change is in the UI layer. Physics modules are unchanged from v1.1.

## Suggested classroom flow

A compact presentation can be:

```text
1. Basic tunneling
   E0 < V0
   press Play
   vary L or V0

2. Above-barrier reflection
   E0 > V0
   show that reflection is still possible

3. Resonant tunneling
   double barrier
   T ≈ 1 at a tuned sub-barrier energy

4. Switch to Explore mode only if the audience asks for more detail
```

This keeps the main story understandable while retaining the deeper simulator for follow-up questions.

## Run locally

Because the project uses ES modules, serve it through HTTP:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

GitHub Pages also serves the project correctly.

## Suggested Git workflow

```bash
git switch main
git pull
git switch -c feature/dual-interface

# copy/test v1.2

git status
git diff
git add .
git status
git commit -m "Add presentation and explore interface modes"
git push -u origin feature/dual-interface
```
