# Quantum Tunneling Explorer

Interactive HTML/CSS/JavaScript prototype for an Introduction to Semiconductor project.

## What it demonstrates

The simulator lets a user vary:

- electron energy `E`
- barrier height `V0`
- barrier thickness `a`

It updates the rectangular potential barrier, schematic wavefunction decay, decay constant `kappa`, approximate tunneling probability, and a graph of `log10(T)` versus barrier thickness.

## Physics

For a rectangular barrier with `E < V0`:

`kappa = sqrt(2 m (V0 - E)) / hbar`

A useful qualitative approximation is:

`T ≈ exp(-2 kappa a)`

This first prototype intentionally uses the approximation so the effect of barrier height and thickness is visually clear.

## Run locally

You can simply open `index.html` in a browser.

Recommended:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Stop the server with `Ctrl + C`.

## Learn Git with this project

Inside the project folder:

```bash
git init
git status
git add .
git commit -m "Initial quantum tunneling simulator"
```

Create a GitHub repository named, for example, `quantum-tunneling-simulator`, then run:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/quantum-tunneling-simulator.git
git push -u origin main
```

For later updates:

```bash
git status
git add .
git commit -m "Improve tunneling visualization"
git push
```

## GitHub Pages

On GitHub: repository → Settings → Pages → Deploy from a branch → `main` → `/(root)` → Save.

The site will usually appear at:

```text
https://YOUR_USERNAME.github.io/quantum-tunneling-simulator/
```

## Good next steps

- Use the exact rectangular-barrier transmission coefficient.
- Add a switch between approximate and exact models.
- Add wave-packet animation.
- Add semiconductor applications such as tunnel junctions or STM.
- Add bilingual English / Traditional Chinese UI.
