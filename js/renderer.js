import { abs, abs2, expI, mul } from "./complex.js";
import { potentialAt } from "./potentials.js";
import { evaluateStationaryState } from "./stationarySolver.js";
import { wavePacketDensity } from "./wavePacketSolver.js";

const initialized = {
  energy: false,
  wavefunction: false,
  probability: false,
};

function timeRotate(z, phase) {
  return mul(z, expI(-phase));
}

function nanOutside(value, active) {
  return active ? value : NaN;
}

export function renderStationarySimulation({ state, solution }) {
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
  renderStationaryProbabilityPanel(sample);
}

export function renderWavePacketSimulation({ state, simulation }) {
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
  renderPacketProbabilityPanel(simulation);
}

function sampleStationaryState(state, solution) {
  const profile = solution.profile;
  const extent = Math.max(profile.totalWidthNM, 0);
  const xMin = -2.5;
  const xMax = extent + 2.5;
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
