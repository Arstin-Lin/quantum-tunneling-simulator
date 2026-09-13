const ids = {
  energy: "energy",
  height: "height",
  thickness: "thickness",
  energyValue: "val-energy",
  heightValue: "val-height",
  thicknessValue: "val-thickness",
  planeWave: "wave-plane",
  totalMode: "mode-total",
  componentMode: "mode-components",
  real: "show-real",
  imaginary: "show-imag",
  magnitude: "show-magnitude",
  energyValues: "show-energy-values",
  scatteringObservables: "show-rt",
  observablesPanel: "scattering-observables",
  transmissionOutput: "transmission-display",
  reflectionOutput: "reflection-display",
};

export function bindUI(state, onStateChange) {
  const controls = {
    energy: document.getElementById(ids.energy),
    height: document.getElementById(ids.height),
    thickness: document.getElementById(ids.thickness),
    planeWave: document.getElementById(ids.planeWave),
    totalMode: document.getElementById(ids.totalMode),
    componentMode: document.getElementById(ids.componentMode),
    real: document.getElementById(ids.real),
    imaginary: document.getElementById(ids.imaginary),
    magnitude: document.getElementById(ids.magnitude),
    energyValues: document.getElementById(ids.energyValues),
    scatteringObservables: document.getElementById(ids.scatteringObservables),
  };

  function syncState() {
    state.waveForm = "plane";
    state.electron.energyEV = Number(controls.energy.value);
    state.potential.heightEV = Number(controls.height.value);
    state.potential.widthNM = Number(controls.thickness.value);
    state.planeWave.decomposition = controls.componentMode.checked ? "components" : "total";
    state.display.real = controls.real.checked;
    state.display.imaginary = controls.imaginary.checked;
    state.display.magnitude = controls.magnitude.checked;
    state.display.energyValues = controls.energyValues.checked;
    state.display.scatteringObservables = controls.scatteringObservables.checked;
    updateControlLabels(state);
    updateVisibility(state);
    onStateChange();
  }

  [controls.energy, controls.height, controls.thickness].forEach((el) => el.addEventListener("input", syncState));
  [controls.totalMode, controls.componentMode, controls.real, controls.imaginary, controls.magnitude, controls.energyValues, controls.scatteringObservables]
    .forEach((el) => el.addEventListener("change", syncState));

  updateControlLabels(state);
  updateVisibility(state);
}

export function updateControlLabels(state) {
  document.getElementById(ids.energyValue).textContent = state.electron.energyEV.toFixed(1);
  document.getElementById(ids.heightValue).textContent = state.potential.heightEV.toFixed(1);
  document.getElementById(ids.thicknessValue).textContent = state.potential.widthNM.toFixed(1);
}

export function updateScatteringReadout({ R, T }) {
  document.getElementById(ids.transmissionOutput).textContent = T.toPrecision(5);
  document.getElementById(ids.reflectionOutput).textContent = R.toPrecision(5);
}

function updateVisibility(state) {
  document.getElementById(ids.observablesPanel).hidden = !state.display.scatteringObservables;
}
