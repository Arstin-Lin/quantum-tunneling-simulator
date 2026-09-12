export const state = {
  electron: {
    energyEV: 5.0,
  },
  potential: {
    type: "rectangularBarrier",
    heightEV: 10.0,
    widthNM: 1.0,
  },
  display: {
    barrier: true,
    real: true,
    imaginary: true,
    magnitude: true,
    incident: false,
    reflected: false,
    transmitted: false,
  },
  animation: {
    phase: 0,
    phaseStep: 0.08,
  },
};
