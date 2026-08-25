// Pure maths for sensor processing. No React, no native modules.
// Unit-testable with plain Node, which is what makes replay.js possible.

// expo-sensors reports acceleration in g already (1.0 at rest), not m/s^2,
// so nothing here converts units.

export function magnitude({ x, y, z }) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function variance(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
}

// Angle in degrees between two gravity vectors. Phase 3 uses this to measure
// how far the phone tilted between just before a fall and just after.
export function angleBetween(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (!magA || !magB) return 0;
  const dot = a.x * b.x + a.y * b.y + a.z * b.z;
  const cosine = Math.min(1, Math.max(-1, dot / (magA * magB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

// Altitude change in metres from a pressure change in hPa.
// Close enough to linear near sea level.
export function pressureToMetres(deltaHpa) {
  return deltaHpa * 8.43;
}