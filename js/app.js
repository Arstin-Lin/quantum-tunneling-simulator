import { state } from "./state.js";
import { bindUI, updateScatteringReadout } from "./ui.js";
import { buildPotentialProfile } from "./potentials.js";
import { solveStationaryScattering } from "./stationarySolver.js";
import { renderStationarySimulation } from "./renderer.js";

let latestSolution=null;
function solveCurrentState(){
  const profile=buildPotentialProfile(state.potential);
  latestSolution=solveStationaryScattering({energyEV:state.electron.energyEV,profile});
  updateScatteringReadout(latestSolution);
}
function render(){if(!latestSolution)solveCurrentState();renderStationarySimulation({state,solution:latestSolution});}
function handleStateChange(){solveCurrentState();render();}
bindUI(state,handleStateChange);
solveCurrentState();
function animate(){state.animation.phase+=state.animation.phaseStep;render();requestAnimationFrame(animate);}
animate();
