export function potentialAt(xNM, potentialState) {
  const { type, heightEV, widthNM } = potentialState;

  switch (type) {
    case "rectangularBarrier":
      return xNM >= 0 && xNM <= widthNM ? heightEV : 0;
    default:
      throw new Error(`Unknown potential type: ${type}`);
  }
}
