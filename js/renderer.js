import { abs, abs2, expI, mul } from "./complex.js";
import { potentialAt } from "./potentials.js";
import { evaluateStationaryState } from "./stationarySolver.js";

const initialized = { energy: false, wavefunction: false, probability: false };

function timeRotate(z, phase) { return mul(z, expI(-phase)); }
function nanOutside(value, active) { return active ? value : NaN; }

export function renderStationarySimulation({ state, solution }) {
  const sample = sampleStationaryState(state, solution);
  renderEnergyPanel(state, sample);
  renderWavefunctionPanel(state, sample);
  renderProbabilityPanel(state, sample);
}

function sampleStationaryState(state, solution) {
  const widthNM = state.potential.widthNM;
  const xMin = -2.5;
  const xMax = widthNM + 2.5;
  const dx = 0.015;
  const x = [], potential = [], total = [], incident = [], reflected = [], inside = [], transmitted = [];

  for (let position = xMin; position <= xMax; position += dx) {
    const pieces = evaluateStationaryState(position, solution, widthNM);
    x.push(position);
    potential.push(potentialAt(position, state.potential));
    total.push(timeRotate(pieces.total, state.animation.phase));
    incident.push(timeRotate(pieces.incident, state.animation.phase));
    reflected.push(timeRotate(pieces.reflected, state.animation.phase));
    inside.push(timeRotate(pieces.inside, state.animation.phase));
    transmitted.push(timeRotate(pieces.transmitted, state.animation.phase));
  }
  return { x, potential, total, incident, reflected, inside, transmitted, xMin, xMax };
}

function renderEnergyPanel(state, data) {
  const traces = [{
    x: data.x, y: data.potential, type: "scatter", mode: "lines", name: "V(x)",
    line: { color: "#34495e", width: 2, shape: "hv" }, fill: "tozeroy", fillcolor: "rgba(52,73,94,.14)", hovertemplate: "x=%{x:.3f} nm<br>V=%{y:.3f} eV<extra></extra>",
  }, {
    x: [data.xMin, data.xMax], y: [state.electron.energyEV, state.electron.energyEV], type: "scatter", mode: "lines", name: "E",
    line: { color: "#8e44ad", width: 2, dash: "dash" }, hovertemplate: `E=${state.electron.energyEV.toFixed(3)} eV<extra></extra>`,
  }];

  const annotations = state.display.energyValues ? [
    { x: data.xMin + .08, y: state.electron.energyEV, text: `E = ${state.electron.energyEV.toFixed(2)} eV`, showarrow: false, xanchor: "left", yshift: 12 },
    { x: state.potential.widthNM / 2, y: state.potential.heightEV, text: `V₀ = ${state.potential.heightEV.toFixed(2)} eV`, showarrow: false, yshift: 14 },
  ] : [];

  drawPlot("energy-plot", "energy", traces, {
    xaxis: commonXAxis(data), yaxis: { title: "Energy (eV)", rangemode: "tozero" },
    annotations, showlegend: false, margin: { t: 15, r: 18, l: 64, b: 50 },
  });
}

function wavefunctionYRange(state, data) {
  let waveSets;

  if (state.planeWave.decomposition === "total") {
    waveSets = [data.total];
  } else {
    waveSets = [
      data.incident,
      data.reflected,
      data.inside,
      data.transmitted,
    ];
  }

  let maxAmplitude = 0;

  for (const wave of waveSets) {
    for (const z of wave) {
      maxAmplitude = Math.max(
        maxAmplitude,
        abs(z),
      );
    }
  }

  // Add 15% padding.
  const paddedLimit = Math.max(
    1.25,
    1.15 * maxAmplitude,
  );

  // Round upward to the nearest 0.5
  // so small parameter changes do not constantly resize the axis.
  const limit =
    Math.ceil(paddedLimit * 2) / 2;

  return [-limit, limit];
}

function renderWavefunctionPanel(state, data) {
  const traces = [];

  const yRange =
  wavefunctionYRange(state, data);

  if (state.planeWave.decomposition === "total") {
    addRepresentations(traces, data.x, data.total, "ψ", state.display, { real: "#2457d6", imag: "#d97706", magnitude: "#667085" });
  } else {
    addComponent(traces, data.x, data.incident, "Incident", state.display, "#0f8a5f");
    addComponent(traces, data.x, data.reflected, "Reflected", state.display, "#c2413b");
    addComponent(traces, data.x, data.inside, "Barrier region", state.display, "#7c3aed");
    addComponent(traces, data.x, data.transmitted, "Transmitted", state.display, "#0f6fa8");
  }

  drawPlot("wavefunction-plot", "wavefunction", traces, {
    xaxis: commonXAxis(data), yaxis: { title: "Wavefunction amplitude", zeroline: true, zerolinecolor: "#b7bfca", range: yRange, autorange: false },
    showlegend: true, legend: { orientation: "h", y: -0.22 }, margin: { t: 15, r: 18, l: 70, b: 82 },
  });
}

function addRepresentations(traces, x, values, label, display, colors) {
  if (display.real) traces.push(lineTrace(x, values.map(z => z.re), `Re[${label}]`, colors.real));
  if (display.imaginary) traces.push(lineTrace(x, values.map(z => z.im), `Im[${label}]`, colors.imag, "dot"));
  if (display.magnitude) traces.push(lineTrace(x, values.map(abs), `|${label}|`, colors.magnitude, "dash"));
}

function addComponent(traces, x, values, label, display, color) {
  const active = values.map(z => abs2(z) > 1e-24);
  if (display.real) traces.push(lineTrace(x, values.map((z,i) => nanOutside(z.re, active[i])), `Re[ψ] · ${label}`, color));
  if (display.imaginary) traces.push(lineTrace(x, values.map((z,i) => nanOutside(z.im, active[i])), `Im[ψ] · ${label}`, color, "dot"));
  if (display.magnitude) traces.push(lineTrace(x, values.map((z,i) => nanOutside(abs(z), active[i])), `|ψ| · ${label}`, color, "dash"));
}

function renderProbabilityPanel(state, data) {
  const density = data.total.map(abs2);
  const traces = [{
    x: data.x, y: density, type: "scatter", mode: "lines", name: "|ψ|²",
    line: { color: "#2457d6", width: 2.4 }, fill: "tozeroy", fillcolor: "rgba(36,87,214,.08)",
    hovertemplate: "x=%{x:.3f} nm<br>|ψ|²=%{y:.5f}<extra></extra>",
  }];
  drawPlot("probability-plot", "probability", traces, {
    xaxis: commonXAxis(data), yaxis: { title: "Probability density (arb. units)", rangemode: "tozero" },
    showlegend: false, margin: { t: 15, r: 18, l: 78, b: 50 },
  });
}

function lineTrace(x, y, name, color, dash = "solid") {
  return { x, y, type: "scatter", mode: "lines", name, line: { color, width: 2, dash }, hovertemplate: "x=%{x:.3f} nm<br>%{y:.5f}<extra>" + name + "</extra>" };
}

function commonXAxis(data) { return { title: "Position x (nm)", range: [data.xMin, data.xMax], zeroline: false }; }

function drawPlot(elementId, key, traces, layout) {
  const config = { responsive: true, displaylogo: false, modeBarButtonsToRemove: ["select2d", "lasso2d"] };
  if (!initialized[key]) { Plotly.newPlot(elementId, traces, layout, config); initialized[key] = true; }
  else Plotly.react(elementId, traces, layout, config);
}
