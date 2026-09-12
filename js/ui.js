const ids = {
  energy: "energy",
  height: "height",
  thickness: "thickness",
  energyValue: "val-energy",
  heightValue: "val-height",
  thicknessValue: "val-thickness",
  barrier: "show-barrier",
  real: "show-real",
  imaginary: "show-imag",
  magnitude: "show-envelope",
  incident: "show-incident",
  reflected: "show-reflected",
  transmitted: "show-transmitted",
  transmissionOutput: "transmission-display",
  reflectionOutput: "reflection-display",
};

export function bindUI(state, onStateChange) {
  const energy = document.getElementById(ids.energy);
  const height = document.getElementById(ids.height);
  const thickness = document.getElementById(ids.thickness);

  const displayInputs = {
    barrier: document.getElementById(ids.barrier),
    real: document.getElementById(ids.real),
    imaginary: document.getElementById(ids.imaginary),
    magnitude: document.getElementById(ids.magnitude),
    incident: document.getElementById(ids.incident),
    reflected: document.getElementById(ids.reflected),
    transmitted: document.getElementById(ids.transmitted),
  };

  function syncStateFromControls() {
    state.electron.energyEV = Number(energy.value);
    state.potential.heightEV = Number(height.value);
    state.potential.widthNM = Number(thickness.value);

    for (const [key, input] of Object.entries(displayInputs)) {
      state.display[key] = input.checked;
    }

    updateControlLabels(state);
    onStateChange();
  }

  energy.addEventListener("input", syncStateFromControls);
  height.addEventListener("input", syncStateFromControls);
  thickness.addEventListener("input", syncStateFromControls);

  for (const input of Object.values(displayInputs)) {
    input.addEventListener("change", syncStateFromControls);
  }

  updateControlLabels(state);
}

export function updateControlLabels(state) {
  document.getElementById(ids.energyValue).textContent = state.electron.energyEV.toFixed(1);
  document.getElementById(ids.heightValue).textContent = state.potential.heightEV.toFixed(1);
  document.getElementById(ids.thicknessValue).textContent = state.potential.widthNM.toFixed(1);
}

export function updateScatteringReadout({ R, T }) {
  document.getElementById(ids.transmissionOutput).textContent = T.toExponential(4);
  document.getElementById(ids.reflectionOutput).textContent = R.toExponential(4);
}
