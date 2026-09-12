import { abs, expI, mul } from "./complex.js";
import { potentialAt } from "./potentials.js";
import { evaluateStationaryState } from "./stationarySolver.js";

let plotInitialized = false;

function applyTimePhase(z, phase) {
  return mul(z, expI(-phase));
}

export function renderStationarySimulation({ state, solution }) {
  const widthNM = state.potential.widthNM;
  const energyEV = state.electron.energyEV;
  const heightEV = state.potential.heightEV;

  const xValues = [];
  const potentialValues = [];
  const realValues = [];
  const imaginaryValues = [];
  const magnitudeValues = [];
  const incidentValues = [];
  const reflectedValues = [];
  const transmittedValues = [];

  const visualScale = 1.5;
  const xMin = -2;
  const xMax = widthNM + 2;
  const dx = 0.02;

  for (let x = xMin; x <= xMax; x += dx) {
    const components = evaluateStationaryState(x, solution, widthNM);

    const totalAnimated = applyTimePhase(components.total, state.animation.phase);
    const incidentAnimated = applyTimePhase(components.incident, state.animation.phase);
    const reflectedAnimated = applyTimePhase(components.reflected, state.animation.phase);
    const transmittedAnimated = applyTimePhase(components.transmitted, state.animation.phase);

    xValues.push(x);
    potentialValues.push(potentialAt(x, state.potential));
    realValues.push(energyEV + visualScale * totalAnimated.re);
    imaginaryValues.push(energyEV + visualScale * totalAnimated.im);
    magnitudeValues.push(energyEV + visualScale * abs(components.total));
    incidentValues.push(energyEV + visualScale * incidentAnimated.re);
    reflectedValues.push(energyEV + visualScale * reflectedAnimated.re);
    transmittedValues.push(energyEV + visualScale * transmittedAnimated.re);
  }

  const traces = [];

  if (state.display.barrier) {
    traces.push({
      x: xValues,
      y: potentialValues,
      type: "scatter",
      mode: "lines",
      name: "V(x)",
      line: { color: "#34495e", width: 2, shape: "hv" },
      fill: "tozeroy",
      fillcolor: "rgba(52, 73, 94, 0.15)",
    });
  }

  if (state.display.real) {
    traces.push({
      x: xValues,
      y: realValues,
      type: "scatter",
      mode: "lines",
      name: "Re[Ψ]",
      line: { color: "#2980b9", width: 2 },
    });
  }

  if (state.display.imaginary) {
    traces.push({
      x: xValues,
      y: imaginaryValues,
      type: "scatter",
      mode: "lines",
      name: "Im[Ψ]",
      line: { color: "#e67e22", width: 2, dash: "dot" },
    });
  }

  if (state.display.magnitude) {
    traces.push({
      x: xValues,
      y: magnitudeValues,
      type: "scatter",
      mode: "lines",
      name: "|Ψ|",
      line: { color: "#7f8c8d", width: 1.5, dash: "dash" },
    });
  }

  if (state.display.incident) {
    traces.push({
      x: xValues,
      y: incidentValues,
      type: "scatter",
      mode: "lines",
      name: "Incident component",
      line: { color: "#27ae60", width: 2 },
    });
  }

  if (state.display.reflected) {
    traces.push({
      x: xValues,
      y: reflectedValues,
      type: "scatter",
      mode: "lines",
      name: "Reflected component",
      line: { color: "#c0392b", width: 2, dash: "dash" },
    });
  }

  if (state.display.transmitted) {
    traces.push({
      x: xValues,
      y: transmittedValues,
      type: "scatter",
      mode: "lines",
      name: "Transmitted component",
      line: { color: "#8e44ad", width: 2, dash: "dashdot" },
    });
  }

  const maxY = Math.max(22, heightEV + 4, energyEV + 4);

  const layout = {
    title: energyEV < heightEV
      ? "Sub-barrier scattering: E < V₀"
      : "Above-barrier scattering: E ≥ V₀",
    xaxis: { title: "Position x (nm)", range: [xMin, xMax] },
    yaxis: { title: "Energy (eV) / wavefunction amplitude", range: [0, maxY] },
    showlegend: true,
    legend: { orientation: "h", y: -0.2 },
    margin: { t: 50, r: 20, l: 60, b: 85 },
  };

  const config = { responsive: true, displaylogo: false };

  if (!plotInitialized) {
    Plotly.newPlot("plot", traces, layout, config);
    plotInitialized = true;
  } else {
    Plotly.react("plot", traces, layout, config);
  }
}
