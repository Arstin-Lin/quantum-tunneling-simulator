export const state = {
  interfaceMode: "presentation",

  waveForm: "packet",

  electron: {
    energyEV: 5.0,
  },

  potential: {
    type: "barrier",
    heightEV: 10.0,
    widthNM: 0.3,
    spacingNM: 1.0,
  },

  planeWave: {
    decomposition: "total",
  },

  wavePacket: {
    initialPositionNM: -6.0,
    sigmaNM: 0.65,
    running: false,
    timeFS: 0,
    dtFS: 0.003,
    stepsPerFrame: 14,
  },

  display: {
    real: true,
    imaginary: true,
    magnitude: true,
    phase: false,
    energyValues: true,
    scatteringObservables: true,
  },

  animation: {
    phase: 0,
    phaseStep: 0.08,
  },
};
