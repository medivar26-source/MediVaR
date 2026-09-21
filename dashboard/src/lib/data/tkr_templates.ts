/**
 * CAD template geometries, sizing catalogs, and fit evaluation metrics
 * for MediVeR-XR Pre-operative TKA Planning (V1 Specification).
 *
 * Exclusions from V1:
 * - Resection depths, posterior slope controls, poly thickness, and 3D cut planes
 *   are NOT part of 2D planning and are deferred to VR.
 * - Only 2D sizing, positioning (x, y, rotation), coverage %, overhang, and notching risk.
 */

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
  patientApMm = 43.0,
  patientMlMm = 69.0
): TibialFitResult {
  const template = getTibialTemplate(size);
  
  // Base coverage
  const ratioAp = Math.min(1.0, template.apMm / patientApMm);
  const ratioMl = Math.min(1.0, template.mlMm / patientMlMm);
  const baseCoverage = ratioAp * ratioMl * 100;
  
  // Penalty for displacement
  const offsetPenalty = (Math.abs(xOffsetMm) * 0.8 + Math.abs(yOffsetMm) * 0.8);
  const coveragePct = Number(Math.max(60, Math.min(99.5, baseCoverage - offsetPenalty)).toFixed(1));

  // Overhang calculations
  const halfPatientMl = patientMlMm / 2;
  const halfImplantMl = template.mlMm / 2;

  // Positive x offset shifts laterally (or medially depending on side, here general signed shift)
  const medialBound = halfImplantMl - xOffsetMm;
  const lateralBound = halfImplantMl + xOffsetMm;

  const medialOverhangMm = Number(Math.max(0, medialBound - halfPatientMl).toFixed(1));
  const lateralOverhangMm = Number(Math.max(0, lateralBound - halfPatientMl).toFixed(1));

  let fitStatus: TibialFitResult["fitStatus"] = "ACCEPTABLE FIT";
  if (medialOverhangMm > 1.5 || lateralOverhangMm > 1.5) {
    fitStatus = "CAUTION: Overhang > 1.5mm";
  } else if (coveragePct < 85.0) {
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
  patientMlMm = 65.0
): FemoralFitResult {
  const template = getFemoralTemplate(size);

  const apCoveragePct = Number(
    Math.min(100, Math.max(60, (template.apMm / patientApMm) * 100 - Math.abs(yOffsetMm) * 0.5)).toFixed(1)
  );
  const mlCoveragePct = Number(
    Math.min(100, Math.max(60, (template.mlMm / patientMlMm) * 100 - Math.abs(xOffsetMm) * 0.5)).toFixed(1)
  );

  // Anterior notching: If shifted posterior (negative y) or undersized by > 3mm
  const undersizeGap = Math.max(0, patientApMm - template.apMm);
  const posteriorShift = Math.max(0, -yOffsetMm);
  const notchingRiskMm = Number((posteriorShift > 0.2 ? posteriorShift : (undersizeGap > 4.0 ? (undersizeGap - 4.0) * 0.5 : 0.0)).toFixed(1));

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
