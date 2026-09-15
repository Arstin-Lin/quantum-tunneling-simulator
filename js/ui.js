import { PRESETS } from "./presets.js";

const ids = {
  preset: "scenario-preset",
  presetNote: "preset-note",

  potentialType: "potential-type",
  energy: "energy",
  height: "height",
  thickness: "thickness",
  spacing: "spacing",
  packetPosition: "packet-position",
  packetSigma: "packet-sigma",

  energyValue: "val-energy",
  heightValue: "val-height",
  thicknessValue: "val-thickness",
  spacingValue: "val-spacing",
  packetPositionValue: "val-packet-position",
  packetSigmaValue: "val-packet-sigma",

  energyLabel: "energy-label",
  energySubscript: "energy-subscript",
  heightLabel: "height-label",
  widthLabel: "width-label",

  widthControl: "width-control",
  spacingControl: "spacing-control",
  packetPositionControl: "packet-position-control",
  packetSigmaControl: "packet-sigma-control",

  planeWave: "wave-plane",
  packetWave: "wave-packet",
  planeDecompositionGroup: "plane-decomposition-group",
  packetEvolutionGroup: "packet-evolution-group",

  totalMode: "mode-total",
  componentMode: "mode-components",

  real: "show-real",
  imaginary: "show-imag",
  magnitude: "show-magnitude",
  phase: "show-phase",
  energyValues: "show-energy-values",
  scatteringObservables: "show-rt",

  observablesPanel: "scattering-observables",
  reflectionLabel: "reflection-label",
  interiorObservable: "interior-observable",
  interiorOutput: "interior-display",
  transmissionLabel: "transmission-label",
  transmissionOutput: "transmission-display",
  reflectionOutput: "reflection-display",

  packetPlay: "packet-play",
  packetReset: "packet-reset",
  packetTime: "packet-time",
  packetDomain: "packet-domain",
};

export function bindUI(state, callbacks) {
  const c = Object.fromEntries(
    Object.entries(ids).map(([key, id]) => [key, document.getElementById(id)]),
  );

  function configurePotentialControls() {
    const type = c.potentialType.value;

    c.widthControl.classList.toggle("hidden", type === "step");
    c.spacingControl.classList.toggle("hidden", type !== "doubleBarrier");

    c.heightLabel.textContent =
      type === "well"
        ? "Well depth"
        : type === "step"
          ? "Step height"
          : "Barrier height";

    c.widthLabel.textContent =
      type === "well" ? "Well width" : "Barrier width";
  }

  function configureWaveFormControls() {
    const isPacket = c.packetWave.checked;

    c.packetPositionControl.classList.toggle("hidden", !isPacket);
    c.packetSigmaControl.classList.toggle("hidden", !isPacket);
    c.packetEvolutionGroup.classList.toggle("hidden", !isPacket);
    c.planeDecompositionGroup.classList.toggle("hidden", isPacket);
    c.interiorObservable.classList.toggle("hidden", !isPacket);

    c.energyLabel.textContent = isPacket ? "Central kinetic energy" : "Electron energy";
    c.energySubscript.textContent = isPacket ? "₀" : "";

    c.reflectionLabel.textContent = isPacket ? "P_L(t)" : "R";
    c.transmissionLabel.textContent = isPacket ? "P_R(t)" : "T";

    updatePlaybackUI(state, c);
  }

  function syncPhysicalState({ markCustom = true } = {}) {
    state.waveForm = c.packetWave.checked ? "packet" : "plane";
    state.electron.energyEV = Number(c.energy.value);
    state.potential.type = c.potentialType.value;
    state.potential.heightEV = Number(c.height.value);
    state.potential.widthNM = Number(c.thickness.value);
    state.potential.spacingNM = Number(c.spacing.value);
    state.wavePacket.initialPositionNM = Number(c.packetPosition.value);
    state.wavePacket.sigmaNM = Number(c.packetSigma.value);

    if (markCustom) {
      c.preset.value = "custom";
      c.presetNote.textContent = "Manual parameter control.";
    }

    configurePotentialControls();
    configureWaveFormControls();
    updateLabels(state, c);

    callbacks.onPhysicsChange();
  }

  function syncDisplayState() {
    state.planeWave.decomposition = c.componentMode.checked ? "components" : "total";
    state.display.real = c.real.checked;
    state.display.imaginary = c.imaginary.checked;
    state.display.magnitude = c.magnitude.checked;
    state.display.phase = c.phase.checked;
    state.display.energyValues = c.energyValues.checked;
    state.display.scatteringObservables = c.scatteringObservables.checked;

    c.observablesPanel.hidden = !state.display.scatteringObservables;

    callbacks.onDisplayChange();
  }

  function applyPreset(presetKey) {
    if (presetKey === "custom") {
      c.presetNote.textContent = "Manual parameter control.";
      return;
    }

    const preset = PRESETS[presetKey];
    if (!preset) {
      return;
    }

    c.potentialType.value = preset.potential.type;
    c.energy.value = String(preset.energyEV);
    c.height.value = String(preset.potential.heightEV);
    c.thickness.value = String(preset.potential.widthNM);
    c.spacing.value = String(preset.potential.spacingNM);

    c.planeWave.checked = preset.waveForm === "plane";
    c.packetWave.checked = preset.waveForm === "packet";

    if (preset.packet) {
      c.packetPosition.value = String(preset.packet.initialPositionNM);
      c.packetSigma.value = String(preset.packet.sigmaNM);
    }

    c.presetNote.textContent = preset.description;
    syncPhysicalState({ markCustom: false });
  }

  c.preset.addEventListener("change", () => {
    applyPreset(c.preset.value);
  });

  [
    c.potentialType,
    c.energy,
    c.height,
    c.thickness,
    c.spacing,
    c.packetPosition,
    c.packetSigma,
    c.planeWave,
    c.packetWave,
  ].forEach((element) => {
    const eventName = element.type === "range" ? "input" : "change";
    element.addEventListener(eventName, () => syncPhysicalState({ markCustom: true }));
  });

  [
    c.totalMode,
    c.componentMode,
    c.real,
    c.imaginary,
    c.magnitude,
    c.phase,
    c.energyValues,
    c.scatteringObservables,
  ].forEach((element) => {
    element.addEventListener("change", syncDisplayState);
  });

  c.packetPlay.addEventListener("click", () => {
    callbacks.onPacketPlayPause();
    updatePlaybackUI(state, c);
  });

  c.packetReset.addEventListener("click", () => {
    callbacks.onPacketReset();
    updatePlaybackUI(state, c);
  });

  configurePotentialControls();
  configureWaveFormControls();
  updateLabels(state, c);
  c.observablesPanel.hidden = !state.display.scatteringObservables;
}

export function updatePlaybackUIFromState(state) {
  const button = document.getElementById(ids.packetPlay);
  const time = document.getElementById(ids.packetTime);

  button.textContent = state.wavePacket.running ? "Pause" : "Play";
  time.textContent = state.wavePacket.timeFS.toFixed(3);
}

export function updatePacketDomainReadout(simulation) {
  const domain = document.getElementById(ids.packetDomain);
  const { xMinNM, xMaxNM, gridPoints, absorberWidthNM } = simulation.domain;

  domain.textContent =
    `x ∈ [${formatSigned(xMinNM, 1)}, ${formatSigned(xMaxNM, 1)}] nm · ` +
    `${gridPoints} grid points · ${absorberWidthNM.toFixed(1)} nm absorbing edges`;
}

export function updateScatteringReadout({ R, T }) {
  document.getElementById(ids.reflectionOutput).textContent = R.toExponential(4);
  document.getElementById(ids.transmissionOutput).textContent = T.toExponential(4);
}

export function updatePacketReadout({ left, interior, right }) {
  document.getElementById(ids.reflectionOutput).textContent = left.toFixed(4);
  document.getElementById(ids.interiorOutput).textContent = interior.toFixed(4);
  document.getElementById(ids.transmissionOutput).textContent = right.toFixed(4);
}

function updateLabels(state, c) {
  c.energyValue.textContent = state.electron.energyEV.toFixed(1);
  c.heightValue.textContent = state.potential.heightEV.toFixed(1);
  c.thicknessValue.textContent = state.potential.widthNM.toFixed(1);
  c.spacingValue.textContent = state.potential.spacingNM.toFixed(1);
  c.packetPositionValue.textContent = formatSigned(state.wavePacket.initialPositionNM, 1);
  c.packetSigmaValue.textContent = state.wavePacket.sigmaNM.toFixed(2);
}

function updatePlaybackUI(state, c) {
  c.packetPlay.textContent = state.wavePacket.running ? "Pause" : "Play";
  c.packetTime.textContent = state.wavePacket.timeFS.toFixed(3);
}

function formatSigned(value, digits) {
  const magnitude = Math.abs(value).toFixed(digits);
  return value < 0 ? `−${magnitude}` : `+${magnitude}`;
}
