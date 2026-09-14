export function C(re, im = 0) { return { re, im }; }
export function add(a, b) { return C(a.re + b.re, a.im + b.im); }
export function sub(a, b) { return C(a.re - b.re, a.im - b.im); }
export function mul(a, b) { return C(a.re*b.re - a.im*b.im, a.re*b.im + a.im*b.re); }
export function div(a, b) {
  const d = b.re*b.re + b.im*b.im;
  if (d === 0) throw new Error("Complex division by zero.");
  return C((a.re*b.re + a.im*b.im)/d, (a.im*b.re - a.re*b.im)/d);
}
export function scale(a, s) { return C(a.re*s, a.im*s); }
export function abs2(a) { return a.re*a.re + a.im*a.im; }
export function abs(a) { return Math.sqrt(abs2(a)); }
export function expI(theta) { return C(Math.cos(theta), Math.sin(theta)); }
export function expComplex(z) {
  const er = Math.exp(z.re);
  return C(er*Math.cos(z.im), er*Math.sin(z.im));
}
export function sqrtRealAsComplex(x) { return x >= 0 ? C(Math.sqrt(x),0) : C(0,Math.sqrt(-x)); }
export function sinComplex(z) {
  return C(Math.sin(z.re)*Math.cosh(z.im), Math.cos(z.re)*Math.sinh(z.im));
}
export function cosComplex(z) {
  return C(Math.cos(z.re)*Math.cosh(z.im), -Math.sin(z.re)*Math.sinh(z.im));
}
