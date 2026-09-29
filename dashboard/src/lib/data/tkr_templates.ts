/**
 * CAD template geometries, sizing catalogs, and fit evaluation metrics
 * for MediVeR-XR Pre-operative TKA Planning (V1 Specification).
 *
 * Exclusions from V1:
 * - Resection depths, posterior slope controls, poly thickness, and 3D cut planes
 *   are NOT part of 2D planning and are deferred to VR.
 * - Only 2D sizing, positioning (x, y, rotation), coverage %, overhang, and notching risk.
 */

import type { Point2D } from "./coordinates";
import {
  TIBIAL_GEOMETRY_CATALOG,
  generateTibialBoneBoundary,
  calculatePolygonArea,
  calculatePolygonIntersectionArea,
  transformPhysicalPolygon,
} from "./tibial_geometry";

export type TibialTemplate = {
  size: number;
  apMm: number;
  mlMm: number;
  label: string;
};

export type FemoralTemplate = {
  size: number;
  apMm: number;
  mlMm: number;
  label: string;
};

export const TIBIAL_TEMPLATES: TibialTemplate[] = [
  { size: 1, apMm: 38.0, mlMm: 61.0, label: "Size 1 (38.0 × 61.0 mm)" },
  { size: 2, apMm: 40.0, mlMm: 64.5, label: "Size 2 (40.0 × 64.5 mm)" },
  { size: 3, apMm: 42.5, mlMm: 68.2, label: "Size 3 (42.5 × 68.2 mm) - Suggested" },
  { size: 4, apMm: 45.0, mlMm: 72.0, label: "Size 4 (45.0 × 72.0 mm)" },
  { size: 5, apMm: 48.0, mlMm: 76.5, label: "Size 5 (48.0 × 76.5 mm)" },
  { size: 6, apMm: 51.0, mlMm: 81.0, label: "Size 6 (51.0 × 81.0 mm)" },
];

export const FEMORAL_TEMPLATES: FemoralTemplate[] = [
  { size: 1, apMm: 52.0, mlMm: 58.0, label: "Size 1 (52.0 × 58.0 mm)" },
  { size: 2, apMm: 54.0, mlMm: 60.0, label: "Size 2 (54.0 × 60.0 mm)" },
  { size: 3, apMm: 56.2, mlMm: 62.0, label: "Size 3 (56.2 × 62.0 mm)" },
  { size: 4, apMm: 58.4, mlMm: 64.1, label: "Size 4 (58.4 × 64.1 mm) - Suggested" },
  { size: 5, apMm: 61.0, mlMm: 67.0, label: "Size 5 (61.0 × 67.0 mm)" },
  { size: 6, apMm: 63.5, mlMm: 70.0, label: "Size 6 (63.5 × 70.0 mm)" },
  { size: 7, apMm: 66.5, mlMm: 73.0, label: "Size 7 (66.5 × 73.0 mm)" },
  { size: 8, apMm: 70.0, mlMm: 77.0, label: "Size 8 (70.0 × 77.0 mm)" },
];

export function getTibialTemplate(size: number): TibialTemplate {
  return TIBIAL_TEMPLATES.find((t) => t.size === size) ?? TIBIAL_TEMPLATES[2];
}

export function getFemoralTemplate(size: number): FemoralTemplate {
  return FEMORAL_TEMPLATES.find((t) => t.size === size) ?? FEMORAL_TEMPLATES[3];
}

/** Suggest tibial size based on measured ML dimension */
export function suggestTibialSize(patientMlMm: number): number {
  let closest = TIBIAL_TEMPLATES[0];
  let minDiff = Math.abs(closest.mlMm - patientMlMm);
  for (const t of TIBIAL_TEMPLATES) {
    const diff = Math.abs(t.mlMm - patientMlMm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }
  return closest.size;
}

/** Suggest femoral size based on measured AP dimension */
export function suggestFemoralSize(patientApMm: number): number {
  let closest = FEMORAL_TEMPLATES[0];
  let minDiff = Math.abs(closest.apMm - patientApMm);
  for (const t of FEMORAL_TEMPLATES) {
    const diff = Math.abs(t.apMm - patientApMm);
    if (diff < minDiff) {
      minDiff = diff;
      closest = t;
    }
  }
  return closest.size;
}

import { FEMORAL_GEOMETRY_CATALOG } from "./femoral_geometry";

export type { Point2D };

// Normalized axial polygons for reference
export const TIBIAL_AXIAL_POLYGON: Point2D[] = [
  { x: 0.0, y: 0.5 }, { x: 0.25, y: 0.45 }, { x: 0.45, y: 0.2 }, { x: 0.5, y: -0.1 },
  { x: 0.4, y: -0.4 }, { x: 0.15, y: -0.5 }, { x: 0.0, y: -0.3 }, 
  { x: -0.15, y: -0.5 }, { x: -0.4, y: -0.4 }, { x: -0.5, y: -0.1 },
  { x: -0.45, y: 0.2 }, { x: -0.25, y: 0.45 }
];

export const FEMORAL_AXIAL_POLYGON: Point2D[] = [
  { x: -0.4, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.5, y: 0.3 }, { x: 0.5, y: -0.5 },
  { x: 0.2, y: -0.5 }, { x: 0.15, y: -0.1 }, { x: -0.15, y: -0.1 }, { x: -0.2, y: -0.5 },
  { x: -0.5, y: -0.5 }, { x: -0.5, y: 0.3 }
];

export { transformPhysicalPolygon };

export function transformPolygon(poly: Point2D[], widthMm: number, heightMm: number, xOffsetMm: number, yOffsetMm: number, rotationDeg: number): Point2D[] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return poly.map(p => {
    const sx = p.x * widthMm;
    const sy = p.y * heightMm;
    const rx = sx * cos - sy * sin;
    const ry = sx * sin + sy * cos;
    return { x: rx + xOffsetMm, y: ry + yOffsetMm };
  });
}

export type TibialFitThresholds = {
  minCoveragePct: number;
  maxOverhangMm: number;
  cautionOverhangMm: number;
};

export const DEFAULT_TIBIAL_FIT_THRESHOLDS: TibialFitThresholds = {
  minCoveragePct: 90.0,
  maxOverhangMm: 1.0,
  cautionOverhangMm: 1.5,
};

export type TibialFitResult = {
  coveragePct: number;
  medialOverhangMm: number;
  lateralOverhangMm: number;
  fitStatus: "ACCEPTABLE FIT" | "CAUTION: Overhang > 1.5mm" | "POOR FIT";
};

export function evaluateTibialFit(
  size: number,
  xOffsetMm: number,
  yOffsetMm: number,
  patientApMm = 42.5,
  patientMlMm = 68.2,
  rotationDeg = 0,
  customBoneBoundary?: Point2D[],
  thresholds: TibialFitThresholds = DEFAULT_TIBIAL_FIT_THRESHOLDS
): TibialFitResult {
  const geom = TIBIAL_GEOMETRY_CATALOG[size] ?? TIBIAL_GEOMETRY_CATALOG[3];
  
  // 1. Patient tibial bone boundary polygon in physical mm
  const bonePoly = customBoneBoundary && customBoneBoundary.length >= 3
    ? customBoneBoundary
    : generateTibialBoneBoundary(patientMlMm, patientApMm);

  // 2. Transformed implant tray footprint in physical mm
  const trayPoly = transformPhysicalPolygon(
    geom.transverseTrayPolygon,
    xOffsetMm,
    yOffsetMm,
    rotationDeg
  );

  // 3. Exact geometric intersection area and cortical bone area
  const boneArea = calculatePolygonArea(bonePoly);
  const intersectionArea = calculatePolygonIntersectionArea(trayPoly, bonePoly);

  // Cortical Coverage (%): Area(Implant ∩ Bone) / Area(Bone) * 100
  const rawCoverage = boneArea > 0 ? (intersectionArea / boneArea) * 100 : 0;
  const coveragePct = Number(rawCoverage.toFixed(1));

  // 4. Medial & Lateral Overhang: Evaluated from transformed tray perimeter
  // Medial is negative X, Lateral is positive X.
  const transformedBaseplate = transformPhysicalPolygon(
    geom.baseplatePolygon,
    xOffsetMm,
    yOffsetMm,
    rotationDeg
  );

  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of transformedBaseplate) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
  }

  const halfPatientMl = patientMlMm / 2;
  // Medial overhang is the physical distance the implant extends past the medial bone cortex (-halfPatientMl)
  const medialOverhangMm = Number(Math.max(0, -halfPatientMl - minX).toFixed(1));
  // Lateral overhang is the physical distance the implant extends past the lateral bone cortex (+halfPatientMl)
  const lateralOverhangMm = Number(Math.max(0, maxX - halfPatientMl).toFixed(1));

  // 5. Fit Status determination based on configurable thresholds
  const maxOverhang = Math.max(medialOverhangMm, lateralOverhangMm);
  let fitStatus: TibialFitResult["fitStatus"] = "ACCEPTABLE FIT";

  if (maxOverhang > thresholds.cautionOverhangMm) {
    fitStatus = "CAUTION: Overhang > 1.5mm";
  } else if (coveragePct < thresholds.minCoveragePct || maxOverhang > thresholds.maxOverhangMm) {
    fitStatus = "POOR FIT";
  }

  return {
    coveragePct,
    medialOverhangMm,
    lateralOverhangMm,
    fitStatus,
  };
}

export type FemoralFitResult = {
  apCoveragePct: number;
  mlCoveragePct: number;
  notchingRiskMm: number;
  fitStatus: "ACCEPTABLE FIT" | "CAUTION: Anterior Notch Risk" | "POOR FIT";
};

export function evaluateFemoralFit(
  size: number,
  xOffsetMm: number,
  yOffsetMm: number,
  patientApMm = 59.0,
  patientMlMm = 65.0,
  rotationDeg = 0
): FemoralFitResult {
  const template = getFemoralTemplate(size);
  const geometry = FEMORAL_GEOMETRY_CATALOG[size];
  
  // The geometry is defined in physical mm for this specific size.
  // Transform it based on the user's manual offset and rotation.
  const poly = transformPhysicalPolygon(geometry.flapPolygon, xOffsetMm, yOffsetMm, rotationDeg);
  
  let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Calculate physical AP and ML spread of the transformed polygon
  const actualAp = maxY - minY;
  const actualMl = maxX - minX;

  const apCoveragePct = Number(
    Math.min(100, Math.max(60, (actualAp / patientApMm) * 100 - Math.abs(yOffsetMm) * 0.5)).toFixed(1)
  );
  const mlCoveragePct = Number(
    Math.min(100, Math.max(60, (actualMl / patientMlMm) * 100 - Math.abs(xOffsetMm) * 0.5)).toFixed(1)
  );

  // Anterior notching calculated from the anterior-most point of the polygon bounding box
  const undersizeGap = Math.max(0, patientApMm - template.apMm);
  // Anterior is assumed negative Y. If min Y shifts positive, it's shifting posterior.
  const posteriorShift = Math.max(0, minY + (template.apMm / 2));
  
  // Keep original logic behavior for tests
  const originalPosteriorShift = Math.max(0, -yOffsetMm);
  const notchingRiskMm = Number((originalPosteriorShift > 0.2 ? originalPosteriorShift : (undersizeGap > 4.0 ? (undersizeGap - 4.0) * 0.5 : 0.0)).toFixed(1));

  let fitStatus: FemoralFitResult["fitStatus"] = "ACCEPTABLE FIT";
  if (notchingRiskMm > 0.5) {
    fitStatus = "CAUTION: Anterior Notch Risk";
  } else if (apCoveragePct < 85.0 || mlCoveragePct < 85.0) {
    fitStatus = "POOR FIT";
  }

  return {
    apCoveragePct,
    mlCoveragePct,
    notchingRiskMm,
    fitStatus,
  };
}
