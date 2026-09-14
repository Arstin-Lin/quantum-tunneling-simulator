const ids = {
  potentialType:"potential-type", energy:"energy", height:"height", thickness:"thickness", spacing:"spacing",
  energyValue:"val-energy", heightValue:"val-height", thicknessValue:"val-thickness", spacingValue:"val-spacing",
  heightLabel:"height-label", widthLabel:"width-label", widthControl:"width-control", spacingControl:"spacing-control",
  totalMode:"mode-total", componentMode:"mode-components", real:"show-real", imaginary:"show-imag", magnitude:"show-magnitude",
  energyValues:"show-energy-values", scatteringObservables:"show-rt", observablesPanel:"scattering-observables",
  transmissionOutput:"transmission-display", reflectionOutput:"reflection-display",
};

export function bindUI(state,onStateChange) {
  const c = Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,document.getElementById(id)]));

  function configurePotentialControls() {
    const type = c.potentialType.value;
    c.widthControl.classList.toggle("hidden", type === "step");
    c.spacingControl.classList.toggle("hidden", type !== "doubleBarrier");
    c.heightLabel.textContent = type === "well" ? "Well depth" : type === "step" ? "Step height" : "Barrier height";
    c.widthLabel.textContent = type === "well" ? "Well width" : "Barrier width";
  }

  function syncState() {
    state.waveForm = "plane";
    state.electron.energyEV = Number(c.energy.value);
    state.potential.type = c.potentialType.value;
    state.potential.heightEV = Number(c.height.value);
    state.potential.widthNM = Number(c.thickness.value);
    state.potential.spacingNM = Number(c.spacing.value);
    state.planeWave.decomposition = c.componentMode.checked ? "components" : "total";
    state.display.real = c.real.checked;
    state.display.imaginary = c.imaginary.checked;
    state.display.magnitude = c.magnitude.checked;
    state.display.energyValues = c.energyValues.checked;
    state.display.scatteringObservables = c.scatteringObservables.checked;
    configurePotentialControls();
    updateLabels(state,c);
    c.observablesPanel.hidden = !state.display.scatteringObservables;
    onStateChange();
  }

  [c.potentialType,c.energy,c.height,c.thickness,c.spacing,c.totalMode,c.componentMode,c.real,c.imaginary,c.magnitude,c.energyValues,c.scatteringObservables]
    .forEach(el=>el.addEventListener(el.type === "range" ? "input" : "change",syncState));

  configurePotentialControls();
  updateLabels(state,c);
}

function updateLabels(state,c) {
  c.energyValue.textContent = state.electron.energyEV.toFixed(1);
  c.heightValue.textContent = state.potential.heightEV.toFixed(1);
  c.thicknessValue.textContent = state.potential.widthNM.toFixed(1);
  c.spacingValue.textContent = state.potential.spacingNM.toFixed(1);
}

export function updateScatteringReadout({R,T}) {
  document.getElementById(ids.reflectionOutput).textContent = R.toExponential(4);
  document.getElementById(ids.transmissionOutput).textContent = T.toExponential(4);
}
