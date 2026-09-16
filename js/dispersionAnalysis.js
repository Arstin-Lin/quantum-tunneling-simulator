import {
  HBAR_EV_FS,
  KINETIC_COEFF_EV_NM2,
} from "./wavePacketSolver.js";

const MAX_HISTORY_POINTS = 1400;
const MOMENTUM_SAMPLES = 321;
const MIN_K_WINDOW_NM_INV = 18;
const SPECTRUM_SIGMA_MARGIN = 6;
const MAX_SPECTRUM_GRID_POINTS = 1400;

// Dispersion analysis is intentionally kept separate from the propagator.
// wavePacketSolver.js evolves ψ(x,t); this module measures quantities from ψ.
export function createDispersionAnalysis(simulation) {
  const metrics = wavePacketMoments(simulation);
  const spectrum = momentumSpectrum(simulation, metrics);

  const analysis = {
    initialMeanXNM: metrics.meanXNM,
    initialSigmaXNM: metrics.sigmaXNM,
    initialMeanKNMInv: metrics.meanKNMInv,
    timeFS: [],
    meanXNM: [],
    sigmaXNM: [],
    freeSigmaXNM: [],
    metrics,
    spectrum,
    spectrumRevision: 0,
  };

  appendHistoryPoint(simulation, analysis, metrics);
  return analysis;
}

export function updateDispersionAnalysis(
  simulation,
  analysis,
  { refreshSpectrum = false } = {},
) {
  const metrics = wavePacketMoments(simulation);
  analysis.metrics = metrics;
  appendHistoryPoint(simulation, analysis, metrics);

  if (refreshSpectrum) {
    analysis.spectrum = momentumSpectrum(simulation, metrics);
    analysis.spectrumRevision += 1;
  }

  return analysis;
}

export function wavePacketMoments(simulation) {
  const { x, re, im, dx } = simulation;

  let norm = 0;
  let meanXNumerator = 0;
  let meanX2Numerator = 0;

  for (let i = 0; i < x.length; i += 1) {
    const density = re[i] ** 2 + im[i] ** 2;
    const weight = density * dx;

    norm += weight;
    meanXNumerator += x[i] * weight;
    meanX2Numerator += x[i] ** 2 * weight;
  }

  const safeNorm = Math.max(norm, 1e-15);
  const meanXNM = meanXNumerator / safeNorm;
  const meanX2NM2 = meanX2Numerator / safeNorm;
  const varianceXNM2 = Math.max(0, meanX2NM2 - meanXNM ** 2);
  const sigmaXNM = Math.sqrt(varianceXNM2);

  // <k> = ∫ ψ* (-i ∂/∂x) ψ dx / <ψ|ψ>
  // <k²> = ∫ |∂ψ/∂x|² dx / <ψ|ψ>. A fourth-order centered
  // derivative keeps the diagnostic accurate even when the carrier wavelength
  // is only resolved by a modest number of finite-difference grid points.
  let meanKNumerator = 0;
  let meanK2Numerator = 0;

  for (let i = 2; i < x.length - 2; i += 1) {
    const dReDX =
      (-re[i + 2] + 8 * re[i + 1] - 8 * re[i - 1] + re[i - 2]) /
      (12 * dx);

    const dImDX =
      (-im[i + 2] + 8 * im[i + 1] - 8 * im[i - 1] + im[i - 2]) /
      (12 * dx);

    meanKNumerator += (re[i] * dImDX - im[i] * dReDX) * dx;
    meanK2Numerator += (dReDX ** 2 + dImDX ** 2) * dx;
  }

  const meanKNMInv = meanKNumerator / safeNorm;
  const meanK2NMInv2 = meanK2Numerator / safeNorm;
  const varianceKNMInv2 = Math.max(
    0,
    meanK2NMInv2 - meanKNMInv ** 2,
  );
  const sigmaKNMInv = Math.sqrt(varianceKNMInv2);

  const groupVelocityNMFS =
    (2 * KINETIC_COEFF_EV_NM2 * meanKNMInv) / HBAR_EV_FS;

  return {
    norm,
    meanXNM,
    sigmaXNM,
    meanKNMInv,
    sigmaKNMInv,
    groupVelocityNMFS,
  };
}

export function momentumSpectrum(simulation, metrics = wavePacketMoments(simulation)) {
  const { x, re, im, dx, k0 } = simulation;

  // For the diagnostic transform we may stride over very large x grids. The
  // resulting k window is kept comfortably inside the corresponding Nyquist limit.
  const stride = Math.max(
    1,
    Math.ceil(x.length / MAX_SPECTRUM_GRID_POINTS),
  );
  const sampledDX = dx * stride;
  const nyquist = Math.PI / sampledDX;

  const physicallyUsefulWindow = Math.max(
    MIN_K_WINDOW_NM_INV,
    Math.abs(k0) + SPECTRUM_SIGMA_MARGIN * Math.max(metrics.sigmaKNMInv, 0.2),
    Math.abs(metrics.meanKNMInv) + SPECTRUM_SIGMA_MARGIN * Math.max(metrics.sigmaKNMInv, 0.2),
  );

  const kMax = Math.min(0.82 * nyquist, 1.12 * physicallyUsefulWindow);
  const k = new Float64Array(MOMENTUM_SAMPLES);
  const density = new Float64Array(MOMENTUM_SAMPLES);
  const dk = (2 * kMax) / (MOMENTUM_SAMPLES - 1);
  const transformScale = sampledDX / Math.sqrt(2 * Math.PI);

  for (let m = 0; m < MOMENTUM_SAMPLES; m += 1) {
    const kValue = -kMax + m * dk;
    k[m] = kValue;

    let sumRe = 0;
    let sumIm = 0;

    for (let i = 0; i < x.length; i += stride) {
      const phase = kValue * x[i];
      const cosPhase = Math.cos(phase);
      const sinPhase = Math.sin(phase);

      // (re + i im) exp(-ikx)
      sumRe += re[i] * cosPhase + im[i] * sinPhase;
      sumIm += im[i] * cosPhase - re[i] * sinPhase;
    }

    const phiRe = transformScale * sumRe;
    const phiIm = transformScale * sumIm;
    density[m] = phiRe ** 2 + phiIm ** 2;
  }

  // Renormalize the displayed finite-k window so its area is one. This makes
  // spectra directly comparable as the packet reflects and transmits.
  let spectralNorm = 0;
  for (let m = 0; m < density.length; m += 1) {
    spectralNorm += density[m] * dk;
  }

  if (spectralNorm > 1e-15) {
    for (let m = 0; m < density.length; m += 1) {
      density[m] /= spectralNorm;
    }
  }

  return {
    k,
    density,
    kMin: -kMax,
    kMax,
  };
}

export function dispersionEnergyEV(kNMInv) {
  return KINETIC_COEFF_EV_NM2 * kNMInv ** 2;
}

function appendHistoryPoint(simulation, analysis, metrics) {
  const t = simulation.timeFS;
  const lastIndex = analysis.timeFS.length - 1;

  if (lastIndex >= 0 && Math.abs(analysis.timeFS[lastIndex] - t) < 1e-12) {
    return;
  }

  analysis.timeFS.push(t);
  analysis.meanXNM.push(metrics.meanXNM);
  analysis.sigmaXNM.push(metrics.sigmaXNM);

  // For ψ(x,0) ∝ exp[-(x-x0)^2/(4σ0²)] exp(ik0x), the free-packet
  // probability-width evolution is σx(t)=σ0 sqrt[1+(C t/(ħ σ0²))²],
  // where C=ħ²/(2m).
  const sigma0 = Math.max(analysis.initialSigmaXNM, 1e-9);
  const spreadingFactor =
    (KINETIC_COEFF_EV_NM2 * t) /
    (HBAR_EV_FS * sigma0 ** 2);

  analysis.freeSigmaXNM.push(
    sigma0 * Math.sqrt(1 + spreadingFactor ** 2),
  );

  if (analysis.timeFS.length > MAX_HISTORY_POINTS) {
    const removeCount = 200;
    analysis.timeFS.splice(0, removeCount);
    analysis.meanXNM.splice(0, removeCount);
    analysis.sigmaXNM.splice(0, removeCount);
    analysis.freeSigmaXNM.splice(0, removeCount);
  }
}
