export const PRESETS = {
  freeDispersion: {
    description: "Reference experiment: a Gaussian electron packet translates and disperses in free space before any scattering structure is introduced.",
    waveForm: "packet",
    energyEV: 5.0,
    potential: {
      type: "free",
      heightEV: 10.0,
      widthNM: 1.0,
      spacingNM: 1.0,
    },
    packet: {
      initialPositionNM: -6.0,
      sigmaNM: 0.65,
    },
  },

  directTunneling: {
    description: "A finite Gaussian packet tunnels through a thin barrier with E₀ < V₀.",
    waveForm: "packet",
    energyEV: 5.0,
    potential: {
      type: "barrier",
      heightEV: 10.0,
      widthNM: 0.3,
      spacingNM: 1.0,
    },
    packet: {
      initialPositionNM: -6.0,
      sigmaNM: 0.65,
    },
  },

  aboveBarrier: {
    description: "Quantum reflection remains possible even when E₀ exceeds the barrier height.",
    waveForm: "packet",
    energyEV: 15.0,
    potential: {
      type: "barrier",
      heightEV: 10.0,
      widthNM: 1.0,
      spacingNM: 1.0,
    },
    packet: {
      initialPositionNM: -6.0,
      sigmaNM: 0.65,
    },
  },

  quantumWell: {
    description: "A finite potential well produces phase accumulation and interference within the well region.",
    waveForm: "plane",
    energyEV: 5.0,
    potential: {
      type: "well",
      heightEV: 8.0,
      widthNM: 1.5,
      spacingNM: 1.0,
    },
  },

  resonantDoubleBarrier: {
    description: "A verified sub-barrier resonance: E = 3.3 eV, V₀ = 8 eV, L = 0.2 nm, d = 1.2 nm gives T ≈ 0.999 in the stationary solver.",
    waveForm: "plane",
    energyEV: 3.3,
    potential: {
      type: "doubleBarrier",
      heightEV: 8.0,
      widthNM: 0.2,
      spacingNM: 1.2,
    },
  },
};
