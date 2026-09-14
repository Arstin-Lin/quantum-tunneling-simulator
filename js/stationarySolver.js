import {
  C, abs, abs2, add, cosComplex, div, expI, mul, scale,
  sinComplex, sqrtRealAsComplex, sub,
} from "./complex.js";

const ELECTRON_MASS = 9.1093837015e-31;
const HBAR = 1.054571817e-34;
const EV_TO_J = 1.602176634e-19;
const NM_TO_M = 1e-9;
const K_EPS = 1e-10;

function waveNumberNM(energyEV, potentialEV) {
  const deltaJ = (energyEV - potentialEV) * EV_TO_J;
  return scale(sqrtRealAsComplex(2 * ELECTRON_MASS * deltaJ), NM_TO_M / HBAR);
}

function matVec(M, v) {
  return [add(mul(M[0][0],v[0]),mul(M[0][1],v[1])), add(mul(M[1][0],v[0]),mul(M[1][1],v[1]))];
}
function matMul(A,B) {
  return [
    [add(mul(A[0][0],B[0][0]),mul(A[0][1],B[1][0])), add(mul(A[0][0],B[0][1]),mul(A[0][1],B[1][1]))],
    [add(mul(A[1][0],B[0][0]),mul(A[1][1],B[1][0])), add(mul(A[1][0],B[0][1]),mul(A[1][1],B[1][1]))],
  ];
}
function identity2() { return [[C(1),C(0)],[C(0),C(1)]]; }

// Propagates the state vector [psi, dpsi/dx] across one constant-potential layer.
// This formulation has a smooth k -> 0 limit, avoiding a singular threshold basis.
function propagationMatrix(k, widthNM) {
  if (abs(k) < K_EPS) return [[C(1),C(widthNM)],[C(0),C(1)]];
  const kd = scale(k,widthNM);
  const c = cosComplex(kd);
  const s = sinComplex(kd);
  return [[c, div(s,k)], [scale(mul(k,s),-1), c]];
}

function solve2x2(A,b) {
  const det = sub(mul(A[0][0],A[1][1]),mul(A[0][1],A[1][0]));
  if (abs2(det) < 1e-26) throw new Error("Scattering system is numerically singular.");
  return [
    div(sub(mul(b[0],A[1][1]),mul(A[0][1],b[1])),det),
    div(sub(mul(A[0][0],b[1]),mul(b[0],A[1][0])),det),
  ];
}

export function solveStationaryScattering({ energyEV, profile }) {
  const kLeft = waveNumberNM(energyEV, profile.leftPotentialEV);
  const kRight = waveNumberNM(energyEV, profile.rightPotentialEV);
  if (Math.abs(kLeft.im) > 1e-12 || kLeft.re <= 0) throw new Error("The incident lead must support a propagating state.");

  let totalP = identity2();
  const layerMatrices = [];
  for (const layer of profile.layers) {
    const k = waveNumberNM(energyEV, layer.potentialEV);
    const P = propagationMatrix(k, layer.endNM-layer.startNM);
    layerMatrices.push({ ...layer, k, P });
    totalP = matMul(P,totalP);
  }

  const iKLeft = C(0,kLeft.re);
  const iKRight = mul(C(0,1),kRight);
  const incidentState = [C(1),iKLeft];
  const reflectedBasis = [C(1),scale(iKLeft,-1)];
  const rightBasis = [C(1),iKRight];

  const Pu = matVec(totalP,incidentState);
  const Pv = matVec(totalP,reflectedBasis);
  // Pv*r - rightBasis*t = -Pu
  const [r,t] = solve2x2(
    [[Pv[0],scale(rightBasis[0],-1)],[Pv[1],scale(rightBasis[1],-1)]],
    [scale(Pu[0],-1),scale(Pu[1],-1)]
  );

  const leftBoundaryState = addState(incidentState, scaleState(reflectedBasis,r));
  const layerStates = [];
  let currentState = leftBoundaryState;
  for (const layer of layerMatrices) {
    layerStates.push({ ...layer, leftState: currentState });
    currentState = matVec(layer.P,currentState);
  }

  const R = abs2(r);
  let T = 0;
  if (Math.abs(kRight.im) < 1e-10 && kRight.re > 1e-12) T = (kRight.re/kLeft.re)*abs2(t);

  const fluxError = Math.abs(R + T - 1);
  if (fluxError > 1e-6) console.warn(`Scattering flux check: R + T = ${(R+T).toFixed(8)}`);

  return { energyEV, profile, kLeft, kRight, r, t, R, T, layerStates };
}

function addState(a,b) { return [add(a[0],b[0]),add(a[1],b[1])]; }
function scaleState(v,z) { return [mul(v[0],z),mul(v[1],z)]; }

function propagateWithin(k, distanceNM, leftState) {
  return matVec(propagationMatrix(k,distanceNM),leftState);
}

export function evaluateStationaryState(xNM, solution) {
  const { profile, kLeft, kRight, r, t, layerStates } = solution;
  if (xNM < 0) {
    const incident = expI(kLeft.re*xNM);
    const reflected = mul(r,expI(-kLeft.re*xNM));
    return { total:add(incident,reflected), incident, reflected, inside:C(0), transmitted:C(0) };
  }

  for (const layer of layerStates) {
    if (xNM >= layer.startNM && xNM <= layer.endNM) {
      const psi = propagateWithin(layer.k,xNM-layer.startNM,layer.leftState)[0];
      return { total:psi, incident:C(0), reflected:C(0), inside:psi, transmitted:C(0) };
    }
  }

  const s = xNM-profile.totalWidthNM;
  let transmitted;
  if (Math.abs(kRight.im) < 1e-12) transmitted = mul(t,expI(kRight.re*s));
  else transmitted = mul(t,C(Math.exp(-kRight.im*s),0));
  return { total:transmitted, incident:C(0), reflected:C(0), inside:C(0), transmitted };
}
