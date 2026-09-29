import type { Point2D } from "./coordinates";

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

export const TIBIAL_DIMENSIONS: Record<number, { apMm: number; mlMm: number }> = {
  1: { apMm: 38.0, mlMm: 61.0 },
  2: { apMm: 40.0, mlMm: 64.5 },
  3: { apMm: 42.5, mlMm: 68.2 },
  4: { apMm: 45.0, mlMm: 72.0 },
  5: { apMm: 48.0, mlMm: 76.5 },
  6: { apMm: 51.0, mlMm: 81.0 },
};

/**
 * Normalized 2D transverse perimeter of a standard clinical TKA tibial baseplate/plateau.
 * Origin (0,0) is the plateau center. -Y is anterior, +Y is posterior, -X is medial, +X is lateral.
 * Includes medial/lateral condylar contours, anterior patellar tendon curve, and posterior PCL notch.
 */
export const NORMALIZED_TIBIAL_PLATEAU_CONTOUR: Point2D[] = [
  { x: 0.0, y: -1.0 },        // anterior midline (patellar tendon curve)
  { x: 0.35, y: -0.92 },
  { x: 0.68, y: -0.72 },
  { x: 0.90, y: -0.40 },
  { x: 1.0, y: 0.0 },         // lateral extreme margin
  { x: 0.92, y: 0.42 },
  { x: 0.72, y: 0.78 },
  { x: 0.40, y: 0.96 },       // posterolateral plateau contour
  { x: 0.0, y: 0.98 },        // posterior midline resection margin
  { x: -0.40, y: 0.96 },      // posteromedial plateau contour
  { x: -0.72, y: 0.78 },
  { x: -0.92, y: 0.42 },
  { x: -1.0, y: 0.0 },        // medial extreme margin
  { x: -0.90, y: -0.40 },
  { x: -0.68, y: -0.72 },
  { x: -0.35, y: -0.92 },
];

/**
 * Generate anatomical transverse tibial cortical bone boundary polygon in physical mm
 * based on patient AP and ML dimensions.
 */
export function generateTibialBoneBoundary(patientMlMm: number, patientApMm: number): Point2D[] {
  const halfMl = patientMlMm / 2;
  const halfAp = patientApMm / 2;
  return NORMALIZED_TIBIAL_PLATEAU_CONTOUR.map((p) => ({
    x: p.x * halfMl,
    y: p.y * halfAp,
  }));
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

function generateTibialSizeGeometry(size: number): TibialGeometry {
  const { apMm, mlMm } = TIBIAL_DIMENSIONS[size] ?? TIBIAL_DIMENSIONS[3];
  const halfMl = mlMm / 2;
  const halfAp = apMm / 2;

  // Insert height: 6mm, Tray height: 4mm, Stem total depth: 36mm
  const insertHeight = 6.0;
  const trayHeight = 4.0;
  const stemWidth = Math.min(12.0, mlMm * 0.18);
  const halfStem = stemWidth / 2;
  const keelWidth = Math.min(36.0, mlMm * 0.52);
  const halfKeel = keelWidth / 2;
  const stemDepth = 32.0;
  const stemTipY = 36.0;

  // Polyethylene insert polygon (top layer)
  const insertPolygon: Point2D[] = [
    { x: -halfMl + 2.0, y: -insertHeight },
    { x: halfMl - 2.0, y: -insertHeight },
    { x: halfMl, y: -insertHeight + 2.0 },
    { x: halfMl, y: 0.0 },
    { x: -halfMl, y: 0.0 },
    { x: -halfMl, y: -insertHeight + 2.0 },
  ];

  // Baseplate tray plateau polygon
  const baseplatePolygon: Point2D[] = [
    { x: -halfMl, y: 0.0 },
    { x: halfMl, y: 0.0 },
    { x: halfMl, y: trayHeight },
    { x: -halfMl, y: trayHeight },
  ];

  // Keel and central stem polygon extending distal into tibial canal
  const keelPolygon: Point2D[] = [
    { x: -halfKeel, y: trayHeight },
    { x: halfKeel, y: trayHeight },
    { x: halfStem + 2.0, y: trayHeight + 12.0 },
    { x: halfStem, y: stemDepth },
    { x: 0.0, y: stemTipY },
    { x: -halfStem, y: stemDepth },
    { x: -halfStem - 2.0, y: trayHeight + 12.0 },
  ];

  // Central stem 3D highlight core
  const stemCorePolygon: Point2D[] = [
    { x: -halfStem * 0.6, y: trayHeight + 2.0 },
    { x: halfStem * 0.6, y: trayHeight + 2.0 },
    { x: halfStem * 0.5, y: stemDepth - 2.0 },
    { x: 0.0, y: stemTipY - 2.0 },
    { x: -halfStem * 0.5, y: stemDepth - 2.0 },
  ];

  // Complete outer perimeter polygon for FLAP (Coronal View) used for exact intersection/fit math
  const flapPolygon: Point2D[] = [
    { x: -halfMl + 2.0, y: -insertHeight },
    { x: halfMl - 2.0, y: -insertHeight },
    { x: halfMl, y: -insertHeight + 2.0 },
    { x: halfMl, y: trayHeight },
    { x: halfKeel, y: trayHeight },
    { x: halfStem + 2.0, y: trayHeight + 12.0 },
    { x: halfStem, y: stemDepth },
    { x: 0.0, y: stemTipY },
    { x: -halfStem, y: stemDepth },
    { x: -halfStem - 2.0, y: trayHeight + 12.0 },
    { x: -halfKeel, y: trayHeight },
    { x: -halfMl, y: trayHeight },
    { x: -halfMl, y: -insertHeight + 2.0 },
  ];

  // Complete outer perimeter polygon for KLAT (Sagittal View)
  const klatPolygon: Point2D[] = [
    { x: -halfAp + 2.0, y: -insertHeight },
    { x: halfAp - 2.0, y: -insertHeight },
    { x: halfAp, y: -insertHeight + 2.0 },
    { x: halfAp, y: trayHeight },
    { x: halfStem * 0.9, y: trayHeight },
    { x: halfStem * 0.8, y: stemDepth },
    { x: 0.0, y: stemTipY - 1.0 },
    { x: -halfStem * 0.8, y: stemDepth },
    { x: -halfStem * 0.9, y: trayHeight },
    { x: -halfAp, y: trayHeight },
    { x: -halfAp, y: -insertHeight + 2.0 },
  ];

  // Transverse baseplate tray footprint in physical mm
  const transverseTrayPolygon: Point2D[] = NORMALIZED_TIBIAL_PLATEAU_CONTOUR.map((p) => ({
    x: p.x * halfMl,
    y: p.y * halfAp,
  }));

  return {
    size,
    apMm,
    mlMm,
    flapPolygon,
    klatPolygon,
    insertPolygon,
    baseplatePolygon,
    keelPolygon,
    stemCorePolygon,
    transverseTrayPolygon,
  };
}

export const TIBIAL_GEOMETRY_CATALOG: Record<number, TibialGeometry> = {
  1: generateTibialSizeGeometry(1),
  2: generateTibialSizeGeometry(2),
  3: generateTibialSizeGeometry(3),
  4: generateTibialSizeGeometry(4),
  5: generateTibialSizeGeometry(5),
  6: generateTibialSizeGeometry(6),
};
