import { potentialAt } from "./potentials.js";

// Convenient units for 1D electron dynamics:
// ħ = 0.6582 eV·fs
// ħ²/(2m_e) = 0.03810 eV·nm²
const HBAR_EV_FS = 0.6582119569;
const KINETIC_COEFF_EV_NM2 = 0.0380998212;

// v1.0: choose the numerical window and grid resolution from the physical setup.
// The calculation still uses a finite box, but the box is deliberately much larger
// than the interaction region and terminates in absorbing layers to approximate x ∈ R.
const TARGET_DX_NM = 0.028;
const MIN_GRID_POINTS = 1201;
const MAX_GRID_POINTS = 2401;
const LEFT_FREE_MARGIN_NM = 18;
const RIGHT_FREE_MARGIN_NM = 24;
const PACKET_SIGMA_MARGIN = 10;
const EXTRA_LEFT_BUFFER_NM = 4;
const ABSORBING_FRACTION = 0.12;
const MIN_ABSORBER_WIDTH_NM = 3.5;
const MAX_ABSORBER_WIDTH_NM = 6.0;
const ABSORBING_STRENGTH = 0.0035;

export function createWavePacketSimulation({
  energyEV,
  profile,
  initialPositionNM,
  sigmaNM,
  dtFS,
}) {
  const domain = chooseNumericalDomain({
    profile,
    initialPositionNM,
    sigmaNM,
  });

  const { xMinNM: xMin, xMaxNM: xMax, gridPoints } = domain;
  const dx = (xMax - xMin) / (gridPoints - 1);

  const x = new Float64Array(gridPoints);
  const potential = new Float64Array(gridPoints);
  const re = new Float64Array(gridPoints);
  const im = new Float64Array(gridPoints);

  const k0 = Math.sqrt(Math.max(energyEV, 1e-9) / KINETIC_COEFF_EV_NM2);

  for (let i = 0; i < gridPoints; i += 1) {
    const position = xMin + i * dx;
    x[i] = position;
    potential[i] = potentialAt(position, profile);

    const gaussian = Math.exp(
      -((position - initialPositionNM) ** 2) / (4 * sigmaNM ** 2),
    );

    const phase = k0 * position;
    re[i] = gaussian * Math.cos(phase);
    im[i] = gaussian * Math.sin(phase);
  }

  normalize(re, im, dx);

  const propagator = buildCrankNicolsonPropagator({
    potential,
    dx,
    dtFS,
  });

  const absorbingMask = buildAbsorbingMask({
    length: gridPoints,
    dx,
    absorberWidthNM: domain.absorberWidthNM,
  });

  const initialMaxAmplitude = maxAmplitude(re, im);
  const initialMaxDensity = initialMaxAmplitude ** 2;

  return {
    x,
    potential,
    re,
    im,
    profile,
    dx,
    dtFS,
    timeFS: 0,
    initialPositionNM,
    sigmaNM,
    meanEnergyEV: energyEV,
    k0,
    propagator,
    absorbingMask,
    domain,
    amplitudeLimit: roundedAxisLimit(1.35 * initialMaxAmplitude, 0.25),
    densityLimit: roundedAxisLimit(1.35 * initialMaxDensity, 0.25),
  };
}

export function advanceWavePacket(simulation, steps = 1) {
  for (let step = 0; step < steps; step += 1) {
    crankNicolsonStep(simulation);
    applyAbsorbingMask(simulation);
    simulation.timeFS += simulation.dtFS;
  }

  updateDisplayLimits(simulation);
}

export function wavePacketProbabilities(simulation) {
  const { x, re, im, dx, profile } = simulation;
  const rightInterface = profile.totalWidthNM;

  let left = 0;
  let interior = 0;
  let right = 0;

  for (let i = 0; i < x.length; i += 1) {
    const density = re[i] ** 2 + im[i] ** 2;
    const contribution = density * dx;

    if (x[i] < 0) {
      left += contribution;
    } else if (x[i] > rightInterface) {
      right += contribution;
    } else {
      interior += contribution;
    }
  }

  return {
    left,
    interior,
    right,
    total: left + interior + right,
  };
}

export function wavePacketDensity(simulation) {
  const density = new Float64Array(simulation.re.length);

  for (let i = 0; i < density.length; i += 1) {
    density[i] = simulation.re[i] ** 2 + simulation.im[i] ** 2;
  }

  return density;
}

function buildCrankNicolsonPropagator({ potential, dx, dtFS }) {
  // Hamiltonian from the second-order finite-difference Laplacian:
  // H_jj     = 2C/dx² + V_j
  // H_j,j±1  = -C/dx²
  // where C = ħ²/(2m_e).
  const kineticDiagonal = 2 * KINETIC_COEFF_EV_NM2 / (dx ** 2);
  const kineticOffDiagonal = -KINETIC_COEFF_EV_NM2 / (dx ** 2);
  const gamma = dtFS / (2 * HBAR_EV_FS);

  // End points are Dirichlet boundaries. Solve only indices 1 ... N-2.
  const n = potential.length - 2;

  const aRe = 0;
  const aIm = gamma * kineticOffDiagonal;
  const cRe = aRe;
  const cIm = aIm;

  const bRe = new Float64Array(n);
  const bIm = new Float64Array(n);
  const bMinusRe = new Float64Array(n);
  const bMinusIm = new Float64Array(n);

  for (let j = 0; j < n; j += 1) {
    const gridIndex = j + 1;
    const hDiagonal = kineticDiagonal + potential[gridIndex];

    // A = I + i gamma H
    bRe[j] = 1;
    bIm[j] = gamma * hDiagonal;

    // B = I - i gamma H
    bMinusRe[j] = 1;
    bMinusIm[j] = -gamma * hDiagonal;
  }

  // B off diagonal = -i gamma H_off
  const rhsOffRe = 0;
  const rhsOffIm = -gamma * kineticOffDiagonal;

  // Precompute the Thomas-algorithm factors for matrix A.
  const cPrimeRe = new Float64Array(Math.max(0, n - 1));
  const cPrimeIm = new Float64Array(Math.max(0, n - 1));
  const invDenRe = new Float64Array(n);
  const invDenIm = new Float64Array(n);

  let denRe = bRe[0];
  let denIm = bIm[0];
  [invDenRe[0], invDenIm[0]] = reciprocalComplex(denRe, denIm);

  if (n > 1) {
    [cPrimeRe[0], cPrimeIm[0]] = multiplyComplex(
      cRe,
      cIm,
      invDenRe[0],
      invDenIm[0],
    );
  }

  for (let j = 1; j < n; j += 1) {
    const [acpRe, acpIm] = multiplyComplex(
      aRe,
      aIm,
      cPrimeRe[j - 1],
      cPrimeIm[j - 1],
    );

    denRe = bRe[j] - acpRe;
    denIm = bIm[j] - acpIm;

    [invDenRe[j], invDenIm[j]] = reciprocalComplex(denRe, denIm);

    if (j < n - 1) {
      [cPrimeRe[j], cPrimeIm[j]] = multiplyComplex(
        cRe,
        cIm,
        invDenRe[j],
        invDenIm[j],
      );
    }
  }

  return {
    n,
    aRe,
    aIm,
    bMinusRe,
    bMinusIm,
    rhsOffRe,
    rhsOffIm,
    cPrimeRe,
    cPrimeIm,
    invDenRe,
    invDenIm,
    forwardRe: new Float64Array(n),
    forwardIm: new Float64Array(n),
    rhsRe: new Float64Array(n),
    rhsIm: new Float64Array(n),
  };
}

function crankNicolsonStep(simulation) {
  const { re, im, propagator: p } = simulation;
  const {
    n,
    aRe,
    aIm,
    bMinusRe,
    bMinusIm,
    rhsOffRe,
    rhsOffIm,
    cPrimeRe,
    cPrimeIm,
    invDenRe,
    invDenIm,
    forwardRe,
    forwardIm,
    rhsRe,
    rhsIm,
  } = p;

  // Build rhs = (I - i dt H / 2ħ) ψ^n.
  for (let j = 0; j < n; j += 1) {
    const i = j + 1;

    let [valueRe, valueIm] = multiplyComplex(
      bMinusRe[j],
      bMinusIm[j],
      re[i],
      im[i],
    );

    const [leftRe, leftIm] = multiplyComplex(
      rhsOffRe,
      rhsOffIm,
      re[i - 1],
      im[i - 1],
    );

    const [rightRe, rightIm] = multiplyComplex(
      rhsOffRe,
      rhsOffIm,
      re[i + 1],
      im[i + 1],
    );

    valueRe += leftRe + rightRe;
    valueIm += leftIm + rightIm;

    rhsRe[j] = valueRe;
    rhsIm[j] = valueIm;
  }

  // Thomas forward substitution.
  [forwardRe[0], forwardIm[0]] = multiplyComplex(
    rhsRe[0],
    rhsIm[0],
    invDenRe[0],
    invDenIm[0],
  );

  for (let j = 1; j < n; j += 1) {
    const [adRe, adIm] = multiplyComplex(
      aRe,
      aIm,
      forwardRe[j - 1],
      forwardIm[j - 1],
    );

    const reducedRe = rhsRe[j] - adRe;
    const reducedIm = rhsIm[j] - adIm;

    [forwardRe[j], forwardIm[j]] = multiplyComplex(
      reducedRe,
      reducedIm,
      invDenRe[j],
      invDenIm[j],
    );
  }

  // Thomas back substitution. Reuse rhs arrays for the new interior ψ.
  rhsRe[n - 1] = forwardRe[n - 1];
  rhsIm[n - 1] = forwardIm[n - 1];

  for (let j = n - 2; j >= 0; j -= 1) {
    const [termRe, termIm] = multiplyComplex(
      cPrimeRe[j],
      cPrimeIm[j],
      rhsRe[j + 1],
      rhsIm[j + 1],
    );

    rhsRe[j] = forwardRe[j] - termRe;
    rhsIm[j] = forwardIm[j] - termIm;
  }

  re[0] = 0;
  im[0] = 0;
  re[re.length - 1] = 0;
  im[im.length - 1] = 0;

  for (let j = 0; j < n; j += 1) {
    re[j + 1] = rhsRe[j];
    im[j + 1] = rhsIm[j];
  }
}

function chooseNumericalDomain({ profile, initialPositionNM, sigmaNM }) {
  const structureRight = Math.max(profile.totalWidthNM, 0);

  const xMinNM = Math.min(
    -LEFT_FREE_MARGIN_NM,
    initialPositionNM - PACKET_SIGMA_MARGIN * sigmaNM - EXTRA_LEFT_BUFFER_NM,
  );

  const xMaxNM = structureRight + Math.max(
    RIGHT_FREE_MARGIN_NM,
    PACKET_SIGMA_MARGIN * sigmaNM + 8,
  );

  const widthNM = xMaxNM - xMinNM;
  let gridPoints = Math.ceil(widthNM / TARGET_DX_NM) + 1;
  gridPoints = Math.max(MIN_GRID_POINTS, Math.min(MAX_GRID_POINTS, gridPoints));

  // An odd number of samples gives a convenient central grid point and keeps
  // changes in the adaptive grid less visually abrupt.
  if (gridPoints % 2 === 0) {
    gridPoints = Math.min(MAX_GRID_POINTS, gridPoints + 1);
  }

  const absorberWidthNM = Math.min(
    MAX_ABSORBER_WIDTH_NM,
    Math.max(MIN_ABSORBER_WIDTH_NM, ABSORBING_FRACTION * widthNM),
  );

  return {
    xMinNM,
    xMaxNM,
    gridPoints,
    absorberWidthNM,
  };
}

function buildAbsorbingMask({ length, dx, absorberWidthNM }) {
  const mask = new Float64Array(length);
  const edgePoints = Math.max(12, Math.floor(absorberWidthNM / dx));

  mask.fill(1);

  for (let i = 0; i < edgePoints; i += 1) {
    const normalized = (edgePoints - i) / edgePoints;
    const attenuation = Math.exp(
      -ABSORBING_STRENGTH * normalized ** 4,
    );

    mask[i] = attenuation;
    mask[length - 1 - i] = attenuation;
  }

  return mask;
}

function applyAbsorbingMask(simulation) {
  const { re, im, absorbingMask } = simulation;

  for (let i = 0; i < re.length; i += 1) {
    re[i] *= absorbingMask[i];
    im[i] *= absorbingMask[i];
  }
}

function normalize(re, im, dx) {
  let norm = 0;

  for (let i = 0; i < re.length; i += 1) {
    norm += (re[i] ** 2 + im[i] ** 2) * dx;
  }

  const scale = 1 / Math.sqrt(norm);

  for (let i = 0; i < re.length; i += 1) {
    re[i] *= scale;
    im[i] *= scale;
  }
}

function maxAmplitude(re, im) {
  let maximum = 0;

  for (let i = 0; i < re.length; i += 1) {
    maximum = Math.max(
      maximum,
      Math.hypot(re[i], im[i]),
    );
  }

  return maximum;
}

function updateDisplayLimits(simulation) {
  const currentAmplitude = maxAmplitude(
    simulation.re,
    simulation.im,
  );

  if (currentAmplitude > 0.92 * simulation.amplitudeLimit) {
    simulation.amplitudeLimit = roundedAxisLimit(
      1.2 * currentAmplitude,
      0.25,
    );
  }

  const currentDensity = currentAmplitude ** 2;

  if (currentDensity > 0.92 * simulation.densityLimit) {
    simulation.densityLimit = roundedAxisLimit(
      1.2 * currentDensity,
      0.25,
    );
  }
}

function roundedAxisLimit(value, increment) {
  return Math.max(
    increment,
    Math.ceil(value / increment) * increment,
  );
}

function reciprocalComplex(re, im) {
  const denominator = re ** 2 + im ** 2;
  return [re / denominator, -im / denominator];
}

function multiplyComplex(aRe, aIm, bRe, bIm) {
  return [
    aRe * bRe - aIm * bIm,
    aRe * bIm + aIm * bRe,
  ];
}
