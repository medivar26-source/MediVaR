/**
 * Plane geometry for the synthetic case scans. Millimetres, x to the right, y DOWN (image convention).
 * Angles are degrees; `rot` turns clockwise on screen for a positive angle (the SVG convention).
 */

export type P = { x: number; y: number };

export const pt = (x: number, y: number): P => ({ x, y });
export const add = (a: P, b: P): P => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: P, b: P): P => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: P, k: number): P => ({ x: a.x * k, y: a.y * k });
export const dot = (a: P, b: P) => a.x * b.x + a.y * b.y;
export const cross = (a: P, b: P) => a.x * b.y - a.y * b.x;
export const len = (a: P) => Math.hypot(a.x, a.y);
export const unit = (a: P): P => mul(a, 1 / len(a));
export const lerp = (a: P, b: P, t: number): P => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

const RAD = Math.PI / 180;

export function rot(a: P, deg: number): P {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

export function rotAbout(a: P, centre: P, deg: number): P {
  return add(centre, rot(sub(a, centre), deg));
}

export const angleBetween = (a: P, b: P) =>
  Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (len(a) * len(b))))) / RAD;

/** The unit vector at `deg` from `from`, picked from the two candidates by `prefer`. */
export function turnTowards(from: P, deg: number, prefer: (v: P) => number): P {
  const a = unit(rot(from, deg));
  const b = unit(rot(from, -deg));
  return prefer(a) >= prefer(b) ? a : b;
}

/** A local frame: `origin + u * e1 + v * e2`. */
export type Frame = { origin: P; e1: P; e2: P };
export const at = (f: Frame, u: number, v: number): P => add(f.origin, add(mul(f.e1, u), mul(f.e2, v)));

/** Intersection of the lines p + s*d and q + t*e. */
export function intersect(p: P, d: P, q: P, e: P): P {
  const s = cross(sub(q, p), e) / cross(d, e);
  return add(p, mul(d, s));
}

/** Signed distance of `p` from the line through `a` along `d`; positive on the side `side` points to. */
export function lineDistance(p: P, a: P, d: P, side: P): number {
  const n = unit({ x: -d.y, y: d.x });
  const sign = dot(n, side) >= 0 ? 1 : -1;
  return dot(sub(p, a), n) * sign;
}

function catmull(p0: P, p1: P, p2: P, p3: P, t: number): P {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

/** A closed Catmull-Rom curve through every point. */
export function closedSpline(pts: P[], perSegment = 10): P[] {
  const out: P[] = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    for (let k = 0; k < perSegment; k++) out.push(catmull(p0, p1, p2, p3, k / perSegment));
  }
  return out;
}

/** An open Catmull-Rom curve from the first point to the last, through every point. */
export function openSpline(pts: P[], perSegment = 10): P[] {
  if (pts.length < 3) return pts.slice();
  const out: P[] = [];
  const ext = [sub(mul(pts[0], 2), pts[1]), ...pts, sub(mul(pts[pts.length - 1], 2), pts[pts.length - 2])];
  for (let i = 1; i < ext.length - 2; i++) {
    for (let k = 0; k < perSegment; k++) out.push(catmull(ext[i - 1], ext[i], ext[i + 1], ext[i + 2], k / perSegment));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/** Points on a circular arc, `a0` to `a1` degrees (0° = +x, 90° = +y i.e. down). */
export function arc(c: P, r: number, a0: number, a1: number, segments = 16): P[] {
  const out: P[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (a0 + ((a1 - a0) * i) / segments) * RAD;
    out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return out;
}

export function ellipse(c: P, rx: number, ry: number, tiltDeg = 0, segments = 48): P[] {
  const out: P[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (2 * Math.PI * i) / segments;
    out.push(add(c, rot({ x: rx * Math.cos(a), y: ry * Math.sin(a) }, tiltDeg)));
  }
  return out;
}

/** Resample a polyline to points `step` apart (keeps the ends). */
export function resample(line: P[], step: number): P[] {
  const out: P[] = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const d = len(sub(b, a));
    let s = step - carry;
    while (s <= d) {
      out.push(lerp(a, b, s / d));
      s += step;
    }
    carry = d - (s - step);
  }
  const last = line[line.length - 1];
  if (len(sub(out[out.length - 1], last)) > 1e-6) out.push(last);
  return out;
}

/**
 * A closed outline around a centre line. `half(t)` gives the half-widths [towards `leftOf`, other side]
 * at `t` = 0…1 along the line. The ends are closed straight across.
 */
export function tube(axis: P[], half: (t: number) => [number, number], step = 2): P[] {
  const line = resample(axis, step);
  const total = line.reduce((s, p, i) => (i ? s + len(sub(p, line[i - 1])) : 0), 0);
  const left: P[] = [];
  const right: P[] = [];
  let run = 0;
  for (let i = 0; i < line.length; i++) {
    if (i) run += len(sub(line[i], line[i - 1]));
    const a = line[Math.max(0, i - 2)];
    const b = line[Math.min(line.length - 1, i + 2)];
    const tan = unit(sub(b, a));
    const n = { x: -tan.y, y: tan.x };
    const [l, r] = half(total ? run / total : 0);
    left.push(add(line[i], mul(n, l)));
    right.push(add(line[i], mul(n, -r)));
  }
  return [...left, ...right.reverse()];
}

/** Round off the corners of a closed outline (resampled to `step` mm, then Chaikin corner cutting). */
export function roundCorners(closed: P[], step = 3, iterations = 3): P[] {
  let pts = resample([...closed, closed[0]], step).slice(0, -1);
  for (let k = 0; k < iterations; k++) {
    const next: P[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      next.push(lerp(a, b, 0.25), lerp(a, b, 0.75));
    }
    pts = next;
  }
  return pts;
}

/** The point of `pts` that scores highest. */
export const extreme = (pts: P[], score: (p: P) => number): P => pts.reduce((a, b) => (score(b) > score(a) ? b : a));

/** Mirror left-right about x = `axisX`. */
export const mirrorX = (p: P, axisX: number): P => ({ x: 2 * axisX - p.x, y: p.y });
