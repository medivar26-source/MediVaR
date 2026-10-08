/**
 * Small geometry helpers for building implant template outlines.
 *
 * Everything is in millimetres, template-local, with x to the right and y DOWN (image convention).
 * Curves are sampled to polygons so the same data is used to draw, to measure and to test.
 */

import type { Point2D } from "../coordinates";

export type Extents = { minX: number; maxX: number; minY: number; maxY: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

export function extentsOf(poly: Point2D[]): Extents {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

/** Signed area (positive when the points run clockwise on a y-down screen). */
export function signedArea(poly: Point2D[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return a / 2;
}

export const area = (poly: Point2D[]) => Math.abs(signedArea(poly));

/** Points on a circular arc from `a0` to `a1` degrees (0° = +x, 90° = +y i.e. down). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, segments = 16): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / segments);
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
}

/**
 * Super-ellipse |x/a|^n + |y/b|^n = 1 sampled at `count` points, starting at +x and running
 * clockwise on a y-down screen. n = 2 is an ellipse; larger n is boxier.
 */
export function superEllipse(a: number, b: number, n: number, count = 72): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i < count; i++) {
    const t = (2 * Math.PI * i) / count;
    const c = Math.cos(t);
    const s = Math.sin(t);
    out.push({
      x: a * Math.sign(c) * Math.pow(Math.abs(c), 2 / n),
      y: b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n),
    });
  }
  return out;
}

/** Rounded rectangle, clockwise from the top-left corner. */
export function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number, segments = 6): Point2D[] {
  const rr = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
  if (rr === 0) return [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }];
  return [
    ...arc(x0 + rr, y0 + rr, rr, 180, 270, segments),
    ...arc(x1 - rr, y0 + rr, rr, 270, 360, segments),
    ...arc(x1 - rr, y1 - rr, rr, 0, 90, segments),
    ...arc(x0 + rr, y1 - rr, rr, 90, 180, segments),
  ];
}

/** Smooth open curve through the given control points (centripetal-free Catmull-Rom, uniform). */
export function smoothCurve(ctrl: Point2D[], perSegment = 8): Point2D[] {
  if (ctrl.length < 3) return ctrl.slice();
  const out: Point2D[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

/** Rotate about the origin by `deg` (positive = clockwise on a y-down screen) then translate. */
export function placePolygon(poly: Point2D[], dx: number, dy: number, deg = 0): Point2D[] {
  if (deg === 0) return poly.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  const c = Math.cos(rad(deg));
  const s = Math.sin(rad(deg));
  return poly.map((p) => ({ x: p.x * c - p.y * s + dx, y: p.x * s + p.y * c + dy }));
}

export const round3 = (v: number) => Math.round(v * 1000) / 1000;
