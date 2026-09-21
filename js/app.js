import { state } from "./state.js";
import {
  bindUI,
  updatePacketDomainReadout,
  updatePacketReadout,
  updatePlaybackUIFromState,
  updateScatteringReadout,
} from "./ui.js";
import { buildPotentialProfile } from "./potentials.js";
import { solveStationaryScattering } from "./stationarySolver.js";
import {
  advanceWavePacket,
  createWavePacketSimulation,
  wavePacketProbabilities,
} from "./wavePacketSolver.js";
import {
  createDispersionAnalysis,
  updateDispersionAnalysis,
} from "./dispersionAnalysis.js";
import {
  renderDispersionDiagnostics,
  renderStationarySimulation,
  renderWavePacketSimulation,
} from "./renderer.js";

let currentProfile = buildPotentialProfile(state.potential);
let stationarySolution = null;
let packetSimulation = null;
let dispersionAnalysis = null;

function rebuildPhysics() {
  currentProfile = buildPotentialProfile(state.potential);

  if (state.waveForm === "plane") {
    state.wavePacket.running = false;
    stationarySolution = solveStationaryScattering({
      energyEV: state.electron.energyEV,
      profile: currentProfile,
    });
    packetSimulation = null;
    dispersionAnalysis = null;
    updateScatteringReadout(stationarySolution);
  } else {
    stationarySolution = null;
    packetSimulation = createWavePacketSimulation({
      energyEV: state.electron.energyEV,
      profile: currentProfile,
      initialPositionNM: state.wavePacket.initialPositionNM,
      sigmaNM: state.wavePacket.sigmaNM,
      dtFS: state.wavePacket.dtFS,
    });

    dispersionAnalysis = createDispersionAnalysis(packetSimulation);

    state.wavePacket.running = false;
    state.wavePacket.timeFS = 0;
    updatePacketDomainReadout(packetSimulation);
    updatePacketObservables();
  }

  updatePlaybackUIFromState(state);
}

function renderCurrentState() {
  if (state.waveForm === "plane") {
    if (!stationarySolution) {
      rebuildPhysics();
    }

    renderStationarySimulation({
      state,
      solution: stationarySolution,
    });
  } else {
    if (!packetSimulation) {
      rebuildPhysics();
    }

    renderWavePacketSimulation({
      state,
      simulation: packetSimulation,
    });
  }
}

function renderCurrentDiagnostics() {
  if (
    state.interfaceMode !== "explore" ||
    state.waveForm !== "packet" ||
    !packetSimulation ||
    !dispersionAnalysis
  ) {
    return;
  }

  renderDispersionDiagnostics({
    simulation: packetSimulation,
    analysis: dispersionAnalysis,
  });
}

function handlePhysicsChange() {
  rebuildPhysics();
  renderCurrentState();
  renderCurrentDiagnostics();
}

function handleDisplayChange() {
  renderCurrentState();
  renderCurrentDiagnostics();
}

function handlePacketPlayPause() {
  if (state.waveForm !== "packet") {
    return;
  }

  if (!packetSimulation) {
    rebuildPhysics();
  }

  state.wavePacket.running = !state.wavePacket.running;
  updatePlaybackUIFromState(state);
}

function handlePacketReset() {
  if (state.waveForm !== "packet") {
    return;
  }

  state.wavePacket.running = false;
  rebuildPhysics();
  renderCurrentState();
  renderCurrentDiagnostics();
}

function updatePacketObservables() {
  if (!packetSimulation) {
    return;
  }

  const probabilities = wavePacketProbabilities(packetSimulation);
  updatePacketReadout(probabilities);
}

bindUI(state, {
  onPhysicsChange: handlePhysicsChange,
  onDisplayChange: handleDisplayChange,
  onPacketPlayPause: handlePacketPlayPause,
  onPacketReset: handlePacketReset,
});

rebuildPhysics();
renderCurrentState();
renderCurrentDiagnostics();

// Main position-space plots stay responsive at ~20 fps. The heavier
// momentum-space transform and dispersion plots are intentionally refreshed
// at a lower rate so analysis does not slow the propagator.
const DISPLAY_INTERVAL_MS = 50;
const DIAGNOSTIC_INTERVAL_MS = 220;
let lastDisplayTime = 0;
let lastDiagnosticTime = 0;

function animate(timestamp) {
  if (timestamp - lastDisplayTime >= DISPLAY_INTERVAL_MS) {
    if (state.waveForm === "plane") {
      state.animation.phase += state.animation.phaseStep;
      renderCurrentState();
    } else if (state.wavePacket.running && packetSimulation) {
      advanceWavePacket(
        packetSimulation,
        state.wavePacket.stepsPerFrame,
      );

      state.wavePacket.timeFS = packetSimulation.timeFS;
      updatePacketObservables();
      updatePlaybackUIFromState(state);

      if (dispersionAnalysis) {
        updateDispersionAnalysis(
          packetSimulation,
          dispersionAnalysis,
          { refreshSpectrum: false },
        );
      }

      renderCurrentState();

      if (
        dispersionAnalysis &&
        timestamp - lastDiagnosticTime >= DIAGNOSTIC_INTERVAL_MS
      ) {
        updateDispersionAnalysis(
          packetSimulation,
          dispersionAnalysis,
          { refreshSpectrum: true },
        );
        renderCurrentDiagnostics();
        lastDiagnosticTime = timestamp;
      }
    }

    lastDisplayTime = timestamp;
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
