// Build a piecewise-constant potential profile.
// Finite layers occupy 0 <= x <= totalWidthNM.
// Outside that range, the left/right lead potentials apply.
export function buildPotentialProfile(potentialState) {
  const V0 = potentialState.heightEV;
  const L = potentialState.widthNM;
  const d = potentialState.spacingNM;

  switch (potentialState.type) {
    case "step":
      return {
        type: "step",
        leftPotentialEV: 0,
        rightPotentialEV: V0,
        layers: [],
        totalWidthNM: 0,
      };

    case "well":
      return {
        type: "well",
        leftPotentialEV: 0,
        rightPotentialEV: 0,
        layers: [{ startNM: 0, endNM: L, potentialEV: -V0, label: "well" }],
        totalWidthNM: L,
      };

    case "doubleBarrier":
      return {
        type: "doubleBarrier",
        leftPotentialEV: 0,
        rightPotentialEV: 0,
        layers: [
          { startNM: 0, endNM: L, potentialEV: V0, label: "barrier 1" },
          { startNM: L, endNM: L + d, potentialEV: 0, label: "inter-barrier region" },
          { startNM: L + d, endNM: 2*L + d, potentialEV: V0, label: "barrier 2" },
        ],
        totalWidthNM: 2*L + d,
      };

    case "barrier":
    default:
      return {
        type: "barrier",
        leftPotentialEV: 0,
        rightPotentialEV: 0,
        layers: [{ startNM: 0, endNM: L, potentialEV: V0, label: "barrier" }],
        totalWidthNM: L,
      };
  }
}

export function potentialAt(xNM, profile) {
  if (xNM < 0) return profile.leftPotentialEV;
  for (const layer of profile.layers) {
    if (xNM >= layer.startNM && xNM <= layer.endNM) return layer.potentialEV;
  }
  return profile.rightPotentialEV;
}
