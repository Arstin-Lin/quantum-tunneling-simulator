import { abs, abs2, expI, mul } from "./complex.js";
import { potentialAt } from "./potentials.js";
import { evaluateStationaryState } from "./stationarySolver.js";
import { wavePacketDensity } from "./wavePacketSolver.js";
import { dispersionEnergyEV } from "./dispersionAnalysis.js";

const initialized = {
  energy: false,
  wavefunction: false,
  probability: false,
  dispersionHistory: false,
  momentumSpectrum: false,
  dispersionRelation: false,
};

function timeRotate(z, phase) {
  return mul(z, expI(-phase));
}

function nanOutside(value, active) {
  return active ? value : NaN;
}

export function renderStationarySimulation({ state, solution }) {
  setDispersionDiagnosticsVisible(false);
  const sample = sampleStationaryState(state, solution);

  renderEnergyPanel({
    state,
    x: sample.x,
    potential: sample.potential,
    profile: sample.profile,
    xMin: sample.xMin,
    xMax: sample.xMax,
    energyLabel: "E",
  });

  renderStationaryWavefunctionPanel(state, sample);
  renderStationaryPhaseSpectrum(state, sample);
  renderStationaryProbabilityPanel(sample);
}

export function renderWavePacketSimulation({ state, simulation }) {
  setDispersionDiagnosticsVisible(true);
  const x = simulation.x;
  const xMin = x[0];
  const xMax = x[x.length - 1];

  renderEnergyPanel({
    state,
    x,
    potential: simulation.potential,
    profile: simulation.profile,
    xMin,
    xMax,
    energyLabel: "E₀",
  });

  renderPacketWavefunctionPanel(state, simulation);
  renderPacketPhaseSpectrum(state, simulation);
  renderPacketProbabilityPanel(simulation);
}

function sampleStationaryState(state, solution) {
  const profile = solution.profile;
  const extent = Math.max(profile.totalWidthNM, 0);
  const leadExtent = Math.max(4.0, Math.min(8.0, 3.0 + 0.75 * extent));
  const xMin = -leadExtent;
  const xMax = extent + leadExtent;
  const dx = 0.015;

  const x = [];
  const potential = [];
  const total = [];
  const incident = [];
  const reflected = [];
  const inside = [];
  const transmitted = [];

  for (let position = xMin; position <= xMax; position += dx) {
    const p = evaluateStationaryState(position, solution);

    x.push(position);
    potential.push(potentialAt(position, profile));
    total.push(timeRotate(p.total, state.animation.phase));
    incident.push(timeRotate(p.incident, state.animation.phase));
    reflected.push(timeRotate(p.reflected, state.animation.phase));
    inside.push(timeRotate(p.inside, state.animation.phase));
    transmitted.push(timeRotate(p.transmitted, state.animation.phase));
  }

  return {
    x,
    potential,
    total,
    incident,
    reflected,
    inside,
    transmitted,
    xMin,
    xMax,
    profile,
  };
}

function renderEnergyPanel({
  state,
  x,
  potential,
  profile,
  xMin,
  xMax,
  energyLabel,
}) {
  const traces = [
    {
      x,
      y: potential,
      type: "scatter",
      mode: "lines",
      name: "V(x)",
      line: {
        color: "#34495e",
        width: 2,
        shape: "hv",
      },
      fill: "tozeroy",
      fillcolor: "rgba(52,73,94,.14)",
      hovertemplate: "x=%{x:.3f} nm<br>V=%{y:.3f} eV<extra></extra>",
    },
    {
      x: [xMin, xMax],
      y: [state.electron.energyEV, state.electron.energyEV],
      type: "scatter",
      mode: "lines",
      name: energyLabel,
      line: {
        color: "#8e44ad",
        width: 2,
        dash: "dash",
      },
      hovertemplate: `${energyLabel}=${state.electron.energyEV.toFixed(3)} eV<extra></extra>`,
    },
  ];

  const annotations = [];

  if (state.display.energyValues) {
    annotations.push({
      x: xMin + 0.03 * (xMax - xMin),
      y: state.electron.energyEV,
      text: `${energyLabel} = ${state.electron.energyEV.toFixed(2)} eV`,
      showarrow: false,
      xanchor: "left",
      yshift: 12,
    });

    addPotentialAnnotations(annotations, state, profile, xMax);
  }

  const potentialArray = Array.from(potential);
  const values = [0, state.electron.energyEV, ...potentialArray];
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  const padding = Math.max(1, 0.12 * (yMax - yMin || 1));

  drawPlot(
    "energy-plot",
    "energy",
    traces,
    {
      xaxis: commonXAxis(xMin, xMax),
      yaxis: {
        title: "Energy (eV)",
        range: [Math.min(0, yMin - padding), yMax + padding],
      },
      annotations,
      showlegend: false,
      margin: { t: 15, r: 18, l: 64, b: 50 },
    },
  );
}

function addPotentialAnnotations(annotations, state, profile, xMax) {
  const V0 = state.potential.heightEV;

  if (profile.type === "free") {
    return;
  }

  if (profile.type === "step") {
    annotations.push({
      x: xMax - 0.5,
      y: V0,
      text: `V₀ = ${V0.toFixed(2)} eV`,
      showarrow: false,
      xanchor: "right",
      yshift: 14,
    });
    return;
  }

  if (profile.type === "well") {
    annotations.push({
      x: profile.totalWidthNM / 2,
      y: -V0,
      text: `V = −${V0.toFixed(2)} eV`,
      showarrow: false,
      yshift: -14,
    });
    return;
  }

  if (profile.type === "doubleBarrier") {
    const L = state.potential.widthNM;
    const d = state.potential.spacingNM;

    annotations.push({
      x: L / 2,
      y: V0,
      text: `V₀ = ${V0.toFixed(2)} eV`,
      showarrow: false,
      yshift: 14,
    });

    annotations.push({
      x: L + d + L / 2,
      y: V0,
      text: "V₀",
      showarrow: false,
      yshift: 14,
    });
    return;
  }

  annotations.push({
    x: profile.totalWidthNM / 2,
    y: V0,
    text: `V₀ = ${V0.toFixed(2)} eV`,
    showarrow: false,
    yshift: 14,
  });
}

function renderStationaryWavefunctionPanel(state, data) {
  const traces = [];

  if (state.planeWave.decomposition === "total") {
    addRepresentations(
      traces,
      data.x,
      data.total,
      "ψ",
      state.display,
      {
        real: "#2457d6",
        imag: "#d97706",
        magnitude: "#667085",
      },
    );
  } else {
    addComponent(traces, data.x, data.incident, "Incident", state.display, "#0f8a5f");
    addComponent(traces, data.x, data.reflected, "Reflected", state.display, "#c2413b");
    addComponent(traces, data.x, data.inside, "Interior", state.display, "#7c3aed");
    addComponent(traces, data.x, data.transmitted, "Transmitted", state.display, "#0f6fa8");
  }

  const yRange = stationaryWavefunctionYRange(state, data);

  drawPlot(
    "wavefunction-plot",
    "wavefunction",
    traces,
    {
      xaxis: commonXAxis(data.xMin, data.xMax),
      yaxis: {
        title: "Wavefunction amplitude",
        range: yRange,
        autorange: false,
        zeroline: true,
        zerolinecolor: "#b7bfca",
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.22 },
      margin: { t: 15, r: 18, l: 70, b: 82 },
    },
  );
}


function renderStationaryPhaseSpectrum(state, data) {
  const panel = document.getElementById("phase-spectrum-panel");
  panel.classList.toggle("hidden", !state.display.phase);

  if (!state.display.phase) {
    return;
  }

  const title = document.getElementById("phase-spectrum-title");
  const note = document.getElementById("phase-spectrum-note");

  title.textContent =
    state.planeWave.decomposition === "components"
      ? "Phase spectrum · arg ψtotal(x,t)"
      : "Phase spectrum · arg ψ(x,t)";

  note.textContent =
    state.planeWave.decomposition === "components"
      ? "total state · brightness weighted by |ψ|"
      : "brightness weighted by |ψ|";

  const re = new Float64Array(data.total.length);
  const im = new Float64Array(data.total.length);

  for (let i = 0; i < data.total.length; i += 1) {
    re[i] = data.total[i].re;
    im[i] = data.total[i].im;
  }

  renderPhaseSpectrumCanvas(re, im);
}

function renderPacketPhaseSpectrum(state, simulation) {
  const panel = document.getElementById("phase-spectrum-panel");
  panel.classList.toggle("hidden", !state.display.phase);

  if (!state.display.phase) {
    return;
  }

  document.getElementById("phase-spectrum-title").textContent =
    "Phase spectrum · arg ψ(x,t)";

  document.getElementById("phase-spectrum-note").textContent =
    "brightness weighted by |ψ|";

  renderPhaseSpectrumCanvas(simulation.re, simulation.im);
}

function renderPhaseSpectrumCanvas(re, im) {
  const canvas = document.getElementById("phase-spectrum-canvas");
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.floor(rect.width));
  const cssHeight = Math.max(1, Math.floor(rect.height || 34));
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const pixelWidth = Math.round(cssWidth * dpr);
  const pixelHeight = Math.round(cssHeight * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  let maxAmplitude = 0;

  for (let i = 0; i < re.length; i += 1) {
    maxAmplitude = Math.max(
      maxAmplitude,
      Math.hypot(re[i], im[i]),
    );
  }

  if (maxAmplitude <= 1e-15) {
    return;
  }

  for (let px = 0; px < cssWidth; px += 1) {
    const fraction = cssWidth === 1 ? 0 : px / (cssWidth - 1);
    const index = Math.min(
      re.length - 1,
      Math.round(fraction * (re.length - 1)),
    );

    const amplitude = Math.hypot(re[index], im[index]);
    const phase = Math.atan2(im[index], re[index]);

    // Hue is cyclic: -π and +π map to the same color.
    const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;

    // Phase is not visually meaningful where |ψ| is nearly zero.
    // Fade those regions toward the white background.
    const normalized = Math.min(
      1,
      amplitude / (0.20 * maxAmplitude),
    );

    const visibility =
      normalized * normalized * (3 - 2 * normalized);

    ctx.fillStyle = `hsla(${hue}, 88%, 50%, ${visibility})`;
    ctx.fillRect(px, 0, 1.2, cssHeight);
  }
}

function renderPacketWavefunctionPanel(state, simulation) {
  const traces = [];
  const magnitude = new Float64Array(simulation.re.length);

  for (let i = 0; i < magnitude.length; i += 1) {
    magnitude[i] = Math.hypot(simulation.re[i], simulation.im[i]);
  }

  if (state.display.real) {
    traces.push(
      lineTrace(
        simulation.x,
        simulation.re,
        "Re[ψ]",
        "#2457d6",
      ),
    );
  }

  if (state.display.imaginary) {
    traces.push(
      lineTrace(
        simulation.x,
        simulation.im,
        "Im[ψ]",
        "#d97706",
        "dot",
      ),
    );
  }

  if (state.display.magnitude) {
    traces.push(
      lineTrace(
        simulation.x,
        magnitude,
        "|ψ|",
        "#667085",
        "dash",
      ),
    );
  }

  drawPlot(
    "wavefunction-plot",
    "wavefunction",
    traces,
    {
      // The Crank–Nicolson solver mutates re/im arrays in place. datarevision
      // tells Plotly that their contents changed even when the array identity did not.
      datarevision: simulation.timeFS,
      xaxis: commonXAxis(
        simulation.x[0],
        simulation.x[simulation.x.length - 1],
      ),
      yaxis: {
        title: "Wavefunction amplitude (nm⁻¹ᐟ²)",
        range: [-simulation.amplitudeLimit, simulation.amplitudeLimit],
        autorange: false,
        zeroline: true,
        zerolinecolor: "#b7bfca",
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.22 },
      margin: { t: 15, r: 18, l: 76, b: 82 },
    },
  );
}

function stationaryWavefunctionYRange(state, data) {
  const sets =
    state.planeWave.decomposition === "total"
      ? [data.total]
      : [data.incident, data.reflected, data.inside, data.transmitted];

  let maxAmplitude = 0;

  for (const wave of sets) {
    for (const z of wave) {
      maxAmplitude = Math.max(maxAmplitude, abs(z));
    }
  }

  const padded = Math.max(1.25, 1.15 * maxAmplitude);
  const limit = Math.ceil(padded * 2) / 2;

  return [-limit, limit];
}

function addRepresentations(traces, x, values, label, display, colors) {
  if (display.real) {
    traces.push(lineTrace(x, values.map((z) => z.re), `Re[${label}]`, colors.real));
  }

  if (display.imaginary) {
    traces.push(lineTrace(x, values.map((z) => z.im), `Im[${label}]`, colors.imag, "dot"));
  }

  if (display.magnitude) {
    traces.push(lineTrace(x, values.map(abs), `|${label}|`, colors.magnitude, "dash"));
  }
}

function addComponent(traces, x, values, label, display, color) {
  const active = values.map((z) => abs2(z) > 1e-24);

  if (display.real) {
    traces.push(
      lineTrace(
        x,
        values.map((z, i) => nanOutside(z.re, active[i])),
        `Re[ψ] · ${label}`,
        color,
      ),
    );
  }

  if (display.imaginary) {
    traces.push(
      lineTrace(
        x,
        values.map((z, i) => nanOutside(z.im, active[i])),
        `Im[ψ] · ${label}`,
        color,
        "dot",
      ),
    );
  }

  if (display.magnitude) {
    traces.push(
      lineTrace(
        x,
        values.map((z, i) => nanOutside(abs(z), active[i])),
        `|ψ| · ${label}`,
        color,
        "dash",
      ),
    );
  }
}

function renderStationaryProbabilityPanel(data) {
  const density = data.total.map(abs2);
  const yMax = Math.max(...density, 1);

  const traces = [
    probabilityTrace(data.x, density),
  ];

  drawPlot(
    "probability-plot",
    "probability",
    traces,
    {
      xaxis: commonXAxis(data.xMin, data.xMax),
      yaxis: {
        title: "Probability density (arb. units)",
        range: [0, 1.12 * yMax],
        autorange: false,
      },
      showlegend: false,
      margin: { t: 15, r: 18, l: 78, b: 50 },
    },
  );
}

function renderPacketProbabilityPanel(simulation) {
  const density = wavePacketDensity(simulation);

  drawPlot(
    "probability-plot",
    "probability",
    [probabilityTrace(simulation.x, density)],
    {
      datarevision: simulation.timeFS,
      xaxis: commonXAxis(
        simulation.x[0],
        simulation.x[simulation.x.length - 1],
      ),
      yaxis: {
        title: "Probability density |ψ|² (nm⁻¹)",
        range: [0, simulation.densityLimit],
        autorange: false,
      },
      showlegend: false,
      margin: { t: 15, r: 18, l: 86, b: 50 },
    },
  );
}

function probabilityTrace(x, density) {
  return {
    x,
    y: density,
    type: "scatter",
    mode: "lines",
    name: "|ψ|²",
    line: {
      color: "#2457d6",
      width: 2.4,
    },
    fill: "tozeroy",
    fillcolor: "rgba(36,87,214,.08)",
    hovertemplate: "x=%{x:.3f} nm<br>|ψ|²=%{y:.5f}<extra></extra>",
  };
}

function lineTrace(x, y, name, color, dash = "solid") {
  return {
    x,
    y,
    type: "scatter",
    mode: "lines",
    name,
    line: {
      color,
      width: 2,
      dash,
    },
    hovertemplate: `x=%{x:.3f} nm<br>%{y:.5f}<extra>${name}</extra>`,
  };
}

function commonXAxis(xMin, xMax) {
  return {
    title: "Position x (nm)",
    range: [xMin, xMax],
    zeroline: false,
  };
}


export function renderDispersionDiagnostics({ simulation, analysis }) {
  if (!analysis) {
    return;
  }

  setDispersionDiagnosticsVisible(true);
  updateDispersionMetricReadouts(analysis.metrics);
  renderDispersionHistory(analysis);
  renderMomentumSpectrum(analysis);
  renderDispersionRelation(simulation, analysis);
}

export function setDispersionDiagnosticsVisible(visible) {
  const card = document.getElementById("dispersion-card");
  if (card) {
    card.classList.toggle("hidden", !visible);
  }
}

function updateDispersionMetricReadouts(metrics) {
  document.getElementById("dispersion-mean-x").textContent =
    `${formatSignedNumber(metrics.meanXNM, 3)} nm`;

  document.getElementById("dispersion-sigma-x").textContent =
    `${metrics.sigmaXNM.toFixed(3)} nm`;

  document.getElementById("dispersion-mean-k").textContent =
    `${formatSignedNumber(metrics.meanKNMInv, 3)} nm⁻¹`;

  document.getElementById("dispersion-sigma-k").textContent =
    `${metrics.sigmaKNMInv.toFixed(3)} nm⁻¹`;

  document.getElementById("dispersion-vg").textContent =
    `${formatSignedNumber(metrics.groupVelocityNMFS, 3)} nm/fs`;
}

function renderDispersionHistory(analysis) {
  const traces = [
    {
      x: analysis.timeFS,
      y: analysis.meanXNM,
      type: "scatter",
      mode: "lines",
      name: "⟨x⟩",
      line: { color: "#2457d6", width: 2.2 },
      hovertemplate: "t=%{x:.3f} fs<br>⟨x⟩=%{y:.4f} nm<extra></extra>",
    },
    {
      x: analysis.timeFS,
      y: analysis.sigmaXNM,
      type: "scatter",
      mode: "lines",
      name: "σx",
      yaxis: "y2",
      line: { color: "#d97706", width: 2.2 },
      hovertemplate: "t=%{x:.3f} fs<br>σx=%{y:.4f} nm<extra></extra>",
    },
    {
      x: analysis.timeFS,
      y: analysis.freeSigmaXNM,
      type: "scatter",
      mode: "lines",
      name: "free σx",
      yaxis: "y2",
      line: { color: "#d97706", width: 1.4, dash: "dot" },
      hovertemplate: "t=%{x:.3f} fs<br>free σx=%{y:.4f} nm<extra></extra>",
    },
  ];

  drawPlot(
    "dispersion-history-plot",
    "dispersionHistory",
    traces,
    {
      datarevision: analysis.timeFS.length,
      xaxis: {
        title: "Time t (fs)",
        zeroline: false,
      },
      yaxis: {
        title: "Mean position ⟨x⟩ (nm)",
        zeroline: false,
      },
      yaxis2: {
        title: "Width σx (nm)",
        overlaying: "y",
        side: "right",
        rangemode: "tozero",
        showgrid: false,
      },
      showlegend: true,
      legend: {
        orientation: "h",
        y: -0.28,
      },
      margin: { t: 14, r: 68, l: 66, b: 82 },
    },
  );
}

function renderMomentumSpectrum(analysis) {
  const spectrum = analysis.spectrum;

  drawPlot(
    "momentum-spectrum-plot",
    "momentumSpectrum",
    [
      {
        x: spectrum.k,
        y: spectrum.density,
        type: "scatter",
        mode: "lines",
        name: "|ψ̃(k)|²",
        line: { color: "#7c3aed", width: 2.2 },
        fill: "tozeroy",
        fillcolor: "rgba(124,58,237,.08)",
        hovertemplate: "k=%{x:.3f} nm⁻¹<br>|ψ̃|²=%{y:.5f} nm<extra></extra>",
      },
    ],
    {
      datarevision: analysis.spectrumRevision,
      xaxis: {
        title: "Wave number k (nm⁻¹)",
        range: [spectrum.kMin, spectrum.kMax],
        zeroline: true,
        zerolinecolor: "#b7bfca",
      },
      yaxis: {
        title: "Spectral probability density (nm)",
        rangemode: "tozero",
      },
      shapes: [
        {
          type: "line",
          x0: analysis.metrics.meanKNMInv,
          x1: analysis.metrics.meanKNMInv,
          y0: 0,
          y1: 1,
          yref: "paper",
          line: { color: "#475467", width: 1.3, dash: "dash" },
        },
      ],
      annotations: [
        {
          x: analysis.metrics.meanKNMInv,
          y: 0.98,
          yref: "paper",
          text: "⟨k⟩",
          showarrow: false,
          xanchor: "left",
          font: { size: 11, color: "#475467" },
        },
      ],
      showlegend: false,
      margin: { t: 14, r: 18, l: 74, b: 58 },
    },
  );
}

function renderDispersionRelation(simulation, analysis) {
  const spectrum = analysis.spectrum;
  const sampleCount = 241;
  const k = new Float64Array(sampleCount);
  const energy = new Float64Array(sampleCount);
  const dk = (spectrum.kMax - spectrum.kMin) / (sampleCount - 1);

  for (let i = 0; i < sampleCount; i += 1) {
    const kValue = spectrum.kMin + i * dk;
    k[i] = kValue;
    energy[i] = dispersionEnergyEV(kValue);
  }

  const meanK = analysis.metrics.meanKNMInv;
  const meanEnergy = dispersionEnergyEV(meanK);
  const centralEnergy = dispersionEnergyEV(simulation.k0);

  drawPlot(
    "dispersion-relation-plot",
    "dispersionRelation",
    [
      {
        x: k,
        y: energy,
        type: "scatter",
        mode: "lines",
        name: "E(k)",
        line: { color: "#0f6fa8", width: 2.2 },
        hovertemplate: "k=%{x:.3f} nm⁻¹<br>E=%{y:.3f} eV<extra></extra>",
      },
      {
        x: [meanK],
        y: [meanEnergy],
        type: "scatter",
        mode: "markers+text",
        name: "current ⟨k⟩",
        text: ["⟨k⟩"],
        textposition: "top center",
        marker: { color: "#d97706", size: 9 },
        hovertemplate: "⟨k⟩=%{x:.3f} nm⁻¹<br>E(⟨k⟩)=%{y:.3f} eV<extra></extra>",
      },
      {
        x: [simulation.k0],
        y: [centralEnergy],
        type: "scatter",
        mode: "markers",
        name: "initial k₀",
        marker: { color: "#7c3aed", size: 8, symbol: "diamond" },
        hovertemplate: "k₀=%{x:.3f} nm⁻¹<br>E₀=%{y:.3f} eV<extra></extra>",
      },
    ],
    {
      datarevision: `${analysis.spectrumRevision}:${analysis.metrics.meanKNMInv.toFixed(6)}`,
      xaxis: {
        title: "Wave number k (nm⁻¹)",
        range: [spectrum.kMin, spectrum.kMax],
        zeroline: true,
        zerolinecolor: "#b7bfca",
      },
      yaxis: {
        title: "Kinetic energy E (eV)",
        rangemode: "tozero",
      },
      showlegend: true,
      legend: { orientation: "h", y: -0.28 },
      margin: { t: 14, r: 18, l: 66, b: 82 },
    },
  );
}

function formatSignedNumber(value, digits) {
  const magnitude = Math.abs(value).toFixed(digits);
  if (Math.abs(value) < 0.5 * 10 ** (-digits)) {
    return Number(0).toFixed(digits);
  }
  return value < 0 ? `−${magnitude}` : `+${magnitude}`;
}

function drawPlot(elementId, key, traces, layout) {
  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["select2d", "lasso2d"],
  };

  if (!initialized[key]) {
    Plotly.newPlot(elementId, traces, layout, config);
    initialized[key] = true;
  } else {
    Plotly.react(elementId, traces, layout, config);
  }
}
