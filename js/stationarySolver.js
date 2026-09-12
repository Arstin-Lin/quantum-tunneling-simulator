import {
  C,
  abs2,
  add,
  div,
  expComplex,
  expI,
  mul,
  scale,
  sqrtRealAsComplex,
  sub,
} from "./complex.js";

const ELECTRON_MASS = 9.1093837015e-31;
const HBAR = 1.054571817e-34;
const EV_TO_J = 1.602176634e-19;
const NM_TO_M = 1e-9;

export function solveRectangularBarrier({ energyEV, heightEV, widthNM }) {
  const energyJ = energyEV * EV_TO_J;
  const deltaEnergyJ = (energyEV - heightEV) * EV_TO_J;

  const kPerM = Math.sqrt(2 * ELECTRON_MASS * energyJ) / HBAR;
  const qPerM = scale(
    sqrtRealAsComplex(2 * ELECTRON_MASS * deltaEnergyJ),
    1 / HBAR,
  );

  const k = kPerM * NM_TO_M;
  const q = scale(qPerM, NM_TO_M);

  const qL = scale(q, widthNM);
  const iQL = C(-qL.im, qL.re);
  const expPlusIQL = expComplex(iQL);
  const expMinusIQL = expComplex(C(-iQL.re, -iQL.im));
  const expIKL = expI(k * widthNM);

  const matrix = [
    [C(1), C(-1), C(-1), C(0)],
    [C(-k), scale(q, -1), q, C(0)],
    [C(0), expPlusIQL, expMinusIQL, scale(expIKL, -1)],
    [
      C(0),
      mul(q, expPlusIQL),
      scale(mul(q, expMinusIQL), -1),
      scale(expIKL, -k),
    ],
  ];

  const vector = [C(-1), C(-k), C(0), C(0)];
  const [r, A, B, t] = solveComplexLinearSystem(matrix, vector);

  const R = abs2(r);
  const T = abs2(t);

  const fluxError = Math.abs(R + T - 1);
  if (fluxError > 1e-6) {
    console.warn(`Scattering flux check: R + T = ${(R + T).toFixed(8)}`);
  }

  return { k, q, r, A, B, t, R, T };
}

export function evaluateStationaryState(xNM, solution, widthNM) {
  const { k, q, r, A, B, t } = solution;

  if (xNM < 0) {
    const incident = expI(k * xNM);
    const reflected = mul(r, expI(-k * xNM));
    return {
      total: add(incident, reflected),
      incident,
      reflected,
      transmitted: C(0),
    };
  }

  if (xNM <= widthNM) {
    const iQX = C(-q.im * xNM, q.re * xNM);
    const expPlusIQX = expComplex(iQX);
    const expMinusIQX = expComplex(C(-iQX.re, -iQX.im));
    const inside = add(mul(A, expPlusIQX), mul(B, expMinusIQX));
    return {
      total: inside,
      incident: C(0),
      reflected: C(0),
      transmitted: C(0),
    };
  }

  const transmitted = mul(t, expI(k * xNM));
  return {
    total: transmitted,
    incident: C(0),
    reflected: C(0),
    transmitted,
  };
}

function solveComplexLinearSystem(matrix, vector) {
  const n = vector.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row.map((value) => C(value.re, value.im)),
    C(vector[rowIndex].re, vector[rowIndex].im),
  ]);

  for (let column = 0; column < n; column += 1) {
    let pivotRow = column;
    let largestPivot = abs2(augmented[column][column]);

    for (let row = column + 1; row < n; row += 1) {
      const candidate = abs2(augmented[row][column]);
      if (candidate > largestPivot) {
        largestPivot = candidate;
        pivotRow = row;
      }
    }

    if (largestPivot < 1e-24) {
      throw new Error("Boundary-matching matrix is numerically singular.");
    }

    if (pivotRow !== column) {
      [augmented[column], augmented[pivotRow]] = [
        augmented[pivotRow],
        augmented[column],
      ];
    }

    const pivot = augmented[column][column];
    for (let j = column; j <= n; j += 1) {
      augmented[column][j] = div(augmented[column][j], pivot);
    }

    for (let row = 0; row < n; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let j = column; j <= n; j += 1) {
        augmented[row][j] = sub(
          augmented[row][j],
          mul(factor, augmented[column][j]),
        );
      }
    }
  }

  return augmented.map((row) => row[n]);
}
