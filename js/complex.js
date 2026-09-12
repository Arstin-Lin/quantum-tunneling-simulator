export function C(re, im = 0) {
  return { re, im };
}

export function add(a, b) {
  return C(a.re + b.re, a.im + b.im);
}

export function sub(a, b) {
  return C(a.re - b.re, a.im - b.im);
}

export function mul(a, b) {
  return C(
    a.re * b.re - a.im * b.im,
    a.re * b.im + a.im * b.re,
  );
}

export function div(a, b) {
  const denominator = b.re ** 2 + b.im ** 2;
  if (denominator === 0) {
    throw new Error("Complex division by zero.");
  }
  return C(
    (a.re * b.re + a.im * b.im) / denominator,
    (a.im * b.re - a.re * b.im) / denominator,
  );
}

export function scale(a, scalar) {
  return C(a.re * scalar, a.im * scalar);
}

export function abs2(a) {
  return a.re ** 2 + a.im ** 2;
}

export function abs(a) {
  return Math.sqrt(abs2(a));
}

export function expI(theta) {
  return C(Math.cos(theta), Math.sin(theta));
}

export function expComplex(z) {
  const radial = Math.exp(z.re);
  return C(radial * Math.cos(z.im), radial * Math.sin(z.im));
}

export function sqrtRealAsComplex(x) {
  return x >= 0 ? C(Math.sqrt(x), 0) : C(0, Math.sqrt(-x));
}
