import type { Point2D } from "./coordinates";
import {
  GENERIC_TKA_TEMPLATE,
  TIBIAL_SIZE_DIMENSIONS,
  estimatedTibialPlateauOutline,
  type ImplantTemplate,
} from "./implant_templates";

/**
 * Tibial geometry catalogue — a thin adapter over the implant-template module
 * (`lib/data/implant_templates`). The shapes are generic, engineering-derived templates, not a
 * manufacturer's implant; see that module for provenance and geometry versioning.
 *
 *   flapPolygon          outline of the template in the AP (coronal) view
 *   klatPolygon          outline of the template in the lateral (sagittal) view
 *   transverseTrayPolygon axial footprint of the baseplate
 */
export type TibialGeometry = {
  size: number;
  apMm: number;
  mlMm: number;
  flapPolygon: Point2D[];
  klatPolygon: Point2D[];
  insertPolygon: Point2D[];
  baseplatePolygon: Point2D[];
  keelPolygon: Point2D[];
  stemCorePolygon: Point2D[];
  transverseTrayPolygon: Point2D[];
};

export const TIBIAL_DIMENSIONS: Record<number, { apMm: number; mlMm: number }> = Object.fromEntries(
  TIBIAL_SIZE_DIMENSIONS.map((d) => [d.size, { apMm: d.apMm, mlMm: d.mlMm }]),
);

/**
 * The tibial plateau outline ESTIMATED from the two measured spans (a generic shape scaled to the
 * surgeon's medio-lateral and antero-posterior marks). It is not traced anatomy.
 */
export function generateTibialBoneBoundary(patientMlMm: number, patientApMm: number): Point2D[] {
  return estimatedTibialPlateauOutline(patientMlMm, patientApMm);
}

/**
 * Calculate polygon area using Gauss's Shoelace formula
 */
export function calculatePolygonArea(poly: Point2D[]): number {
  const n = poly.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += poly[i].x * poly[j].y;
    area -= poly[j].x * poly[i].y;
  }
  return Math.abs(area) / 2.0;
}

/**
 * Line segment intersection helper
 */
function lineIntersection(
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  p4: Point2D
): Point2D {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-10) {
    return { x: p2.x, y: p2.y };
  }
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/**
 * Check if point is inside half-plane defined by directed edge (cp1 -> cp2)
 */
function isInside(p: Point2D, cp1: Point2D, cp2: Point2D): boolean {
  return (cp2.x - cp1.x) * (p.y - cp1.y) - (cp2.y - cp1.y) * (p.x - cp1.x) >= -1e-7;
}

/**
 * Clip a subject polygon against a clip polygon using the Sutherland-Hodgman algorithm
 */
export function clipPolygon(subject: Point2D[], clipper: Point2D[]): Point2D[] {
  let outputList = [...subject];
  const cLen = clipper.length;
  if (cLen < 3 || outputList.length < 3) return [];

  // Ensure clipper has counter-clockwise orientation
  let clipArea = 0;
  for (let i = 0; i < cLen; i++) {
    const j = (i + 1) % cLen;
    clipArea += clipper[i].x * clipper[j].y - clipper[j].x * clipper[i].y;
  }
  const orientedClipper = clipArea < 0 ? [...clipper].reverse() : clipper;

  for (let i = 0; i < cLen; i++) {
    const cp1 = orientedClipper[i];
    const cp2 = orientedClipper[(i + 1) % cLen];
    const inputList = outputList;
    outputList = [];
    if (inputList.length === 0) break;

    let s = inputList[inputList.length - 1];
    for (let j = 0; j < inputList.length; j++) {
      const e = inputList[j];
      if (isInside(e, cp1, cp2)) {
        if (!isInside(s, cp1, cp2)) {
          outputList.push(lineIntersection(cp1, cp2, s, e));
        }
        outputList.push(e);
      } else if (isInside(s, cp1, cp2)) {
        outputList.push(lineIntersection(cp1, cp2, s, e));
      }
      s = e;
    }
  }

  return outputList;
}

/**
 * Calculate the exact intersection area of two polygons in physical space (mm^2)
 */
export function calculatePolygonIntersectionArea(polyA: Point2D[], polyB: Point2D[]): number {
  if (!polyA || polyA.length < 3 || !polyB || polyB.length < 3) return 0;
  const clipped = clipPolygon(polyA, polyB);
  return calculatePolygonArea(clipped);
}

/**
 * Transform a physical polygon by translation (xOffsetMm, yOffsetMm) and rotation (rotationDeg around 0,0)
 */
export function transformPhysicalPolygon(
  poly: Point2D[],
  xOffsetMm: number,
  yOffsetMm: number,
  rotationDeg: number = 0
): Point2D[] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return poly.map((p) => {
    // 1. Rotate around component center (0,0)
    const rx = p.x * cos - p.y * sin;
    const ry = p.x * sin + p.y * cos;
    // 2. Translate by physical offsets
    return {
      x: rx + xOffsetMm,
      y: ry + yOffsetMm,
    };
  });
}

/** True when `p` lies inside `poly` (ray casting). */
export function pointInPolygon(p: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    const crosses =
      a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** The point on `poly`'s outline closest to `p`, and how far away it is. */
export function nearestOnBoundary(p: Point2D, poly: Point2D[]): { point: Point2D; distance: number } {
  let best = { point: poly[0], distance: Infinity };
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < best.distance) best = { point: q, distance: d };
  }
  return best;
}

/** Insert points along each edge so no gap is longer than `maxStepMm`. */
export function densifyPolygon(poly: Point2D[], maxStepMm = 1.0): Point2D[] {
  const out: Point2D[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / maxStepMm));
    for (let k = 0; k < steps; k++) {
      out.push({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps });
    }
  }
  return out;
}

const layerPath = (t: ImplantTemplate, view: "ap" | "lateral", role: string): Point2D[] =>
  t.views[view].layers.find((l) => l.role === role)?.path ?? [];

function toGeometry(t: ImplantTemplate): TibialGeometry {
  return {
    size: t.size,
    apMm: t.dimensionsMm.ap,
    mlMm: t.dimensionsMm.ml,
    flapPolygon: t.views.ap.silhouette,
    klatPolygon: t.views.lateral.silhouette,
    insertPolygon: layerPath(t, "ap", "insert"),
    baseplatePolygon: layerPath(t, "ap", "baseplate"),
    keelPolygon: layerPath(t, "ap", "keel"),
    stemCorePolygon: layerPath(t, "ap", "stem"),
    transverseTrayPolygon: t.footprint,
  };
}

export const TIBIAL_GEOMETRY_CATALOG: Record<number, TibialGeometry> = Object.fromEntries(
  GENERIC_TKA_TEMPLATE.tibialTemplates.map((t) => [t.size, toGeometry(t)]),
);
