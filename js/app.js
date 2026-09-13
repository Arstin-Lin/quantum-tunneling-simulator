import { state } from "./state.js";
import { bindUI, updateScatteringReadout } from "./ui.js";
import { solveRectangularBarrier } from "./stationarySolver.js";
import { renderStationarySimulation } from "./renderer.js";

let latestSolution = null;

function solveCurrentState() {
  latestSolution = solveRectangularBarrier({
    energyEV: state.electron.energyEV,
    heightEV: state.potential.heightEV,
    widthNM: state.potential.widthNM,
  });
  updateScatteringReadout(latestSolution);
}

function render() {
  if (!latestSolution) solveCurrentState();
  renderStationarySimulation({ state, solution: latestSolution });
}

function handleStateChange() {
  solveCurrentState();
  render();
}

bindUI(state, handleStateChange);
solveCurrentState();

function animate() {
  state.animation.phase += state.animation.phaseStep;
  render();
  requestAnimationFrame(animate);
}

animate();
