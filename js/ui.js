import { PRESETS, PRESENTATION_SCENARIOS } from "./presets.js";

const ids = {
  presentationMode: "mode-presentation",
  exploreMode: "mode-explore",
  modeHeading: "mode-heading",
  modeDescription: "mode-description",
  presentationScenario: "presentation-scenario",
  presentationTitle: "presentation-title",
  presentationQuestion: "presentation-question",
  presentationTry: "presentation-try",
  presentationApplication: "presentation-application",

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

  heightControl: "height-control",
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

  function hydrateControlsFromState() {
    c.potentialType.value = state.potential.type;
    c.energy.value = String(state.electron.energyEV);
    c.height.value = String(state.potential.heightEV);
    c.thickness.value = String(state.potential.widthNM);
    c.spacing.value = String(state.potential.spacingNM);
    c.packetPosition.value = String(state.wavePacket.initialPositionNM);
    c.packetSigma.value = String(state.wavePacket.sigmaNM);

    c.planeWave.checked = state.waveForm === "plane";
    c.packetWave.checked = state.waveForm === "packet";
    c.totalMode.checked = state.planeWave.decomposition === "total";
    c.componentMode.checked = state.planeWave.decomposition === "components";

    c.real.checked = state.display.real;
    c.imaginary.checked = state.display.imaginary;
    c.magnitude.checked = state.display.magnitude;
    c.phase.checked = state.display.phase;
    c.energyValues.checked = state.display.energyValues;
    c.scatteringObservables.checked = state.display.scatteringObservables;
  }

  function configureInterfaceMode() {
    state.interfaceMode = c.exploreMode.checked ? "explore" : "presentation";
    document.body.classList.toggle("mode-presentation", state.interfaceMode === "presentation");
    document.body.classList.toggle("mode-explore", state.interfaceMode === "explore");

    if (state.interfaceMode === "presentation") {
      c.modeHeading.textContent = "Presentation";
      c.modeDescription.textContent =
        "A focused classroom view with only the controls needed to tell the tunneling story.";
      c.observablesPanel.hidden = false;
    } else {
      c.modeHeading.textContent = "Explore";
      c.modeDescription.textContent =
        "The complete laboratory: potentials, wave representations, phase, dispersion, and numerical details.";
      c.observablesPanel.hidden = !state.display.scatteringObservables;
    }
  }

  function configurePotentialControls() {
    const type = c.potentialType.value;

    c.heightControl.classList.toggle("hidden", type === "free");
    c.widthControl.classList.toggle("hidden", type === "step" || type === "free");
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
    c.interiorObservable.classList.toggle(
      "hidden",
      !isPacket || c.potentialType.value === "free",
    );

    c.energyLabel.textContent = isPacket ? "Central kinetic energy" : "Electron energy";
    c.energySubscript.textContent = isPacket ? "₀" : "";

    c.reflectionLabel.textContent = isPacket ? "P_L(t)" : "R";
    c.transmissionLabel.textContent = isPacket ? "P_R(t)" : "T";

    updatePlaybackUI(state, c);
  }

  function updatePresentationGuide(scenarioKey) {
    const scenario = PRESENTATION_SCENARIOS[scenarioKey];

    if (!scenario) {
      c.presentationTitle.textContent = "Current custom state";
      c.presentationQuestion.textContent =
        "How does the current potential structure reshape the electron state?";
      c.presentationTry.textContent =
        "Change the visible physical parameters and compare the wavefunction, probability density, and scattering probabilities.";
      c.presentationApplication.textContent =
        "Switch to Explore mode to inspect the full model configuration and advanced diagnostics.";
      return;
    }

    c.presentationTitle.textContent = scenario.title;
    c.presentationQuestion.textContent = scenario.question;
    c.presentationTry.textContent = scenario.tryText;
    c.presentationApplication.textContent = scenario.application;
  }

  function markCurrentStateCustom() {
    c.preset.value = "custom";
    c.presetNote.textContent = "Manual parameter control.";
    c.presentationScenario.value = "custom";
    updatePresentationGuide("custom");
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
      markCurrentStateCustom();
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

    c.observablesPanel.hidden =
      state.interfaceMode === "explore"
        ? !state.display.scatteringObservables
        : false;

    callbacks.onDisplayChange();
  }

  function loadPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) {
      return false;
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

    c.preset.value = presetKey;
    c.presetNote.textContent = preset.description;
    return true;
  }

  function applyExplorePreset(presetKey) {
    if (presetKey === "custom") {
      c.presetNote.textContent = "Manual parameter control.";
      return;
    }

    if (!loadPreset(presetKey)) {
      return;
    }

    const matchingScenario = Object.entries(PRESENTATION_SCENARIOS)
      .find(([, scenario]) => scenario.presetKey === presetKey)?.[0] ?? "custom";

    c.presentationScenario.value = matchingScenario;
    updatePresentationGuide(matchingScenario);
    syncPhysicalState({ markCustom: false });
  }

  function applyPresentationScenario(scenarioKey) {
    if (scenarioKey === "custom") {
      updatePresentationGuide("custom");
      return;
    }

    const scenario = PRESENTATION_SCENARIOS[scenarioKey];
    if (!scenario || !loadPreset(scenario.presetKey)) {
      return;
    }

    c.presentationScenario.value = scenarioKey;
    updatePresentationGuide(scenarioKey);
    syncPhysicalState({ markCustom: false });
  }

  c.presentationMode.addEventListener("change", () => {
    if (!c.presentationMode.checked) return;
    configureInterfaceMode();
    callbacks.onDisplayChange();
  });

  c.exploreMode.addEventListener("change", () => {
    if (!c.exploreMode.checked) return;
    configureInterfaceMode();
    callbacks.onDisplayChange();
  });

  c.presentationScenario.addEventListener("change", () => {
    applyPresentationScenario(c.presentationScenario.value);
  });

  c.preset.addEventListener("change", () => {
    applyExplorePreset(c.preset.value);
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

  hydrateControlsFromState();
  c.presentationMode.checked = state.interfaceMode === "presentation";
  c.exploreMode.checked = state.interfaceMode === "explore";

  const initialPreset = PRESETS[c.preset.value];
  if (initialPreset) {
    c.presetNote.textContent = initialPreset.description;
  }

  configureInterfaceMode();
  configurePotentialControls();
  configureWaveFormControls();
  updateLabels(state, c);
  updatePresentationGuide(c.presentationScenario.value);
  c.observablesPanel.hidden =
    state.interfaceMode === "explore"
      ? !state.display.scatteringObservables
      : false;
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
