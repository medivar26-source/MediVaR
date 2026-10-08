/**
 * Implant size catalogue lookups and the CANONICAL V1 fit engine for the pre-operative TKA planner.
 *
 * Exclusions from V1 (deferred to VR): resection depths, posterior slope controls, polyethylene
 * thickness, gap balancing and 3-D cut planes. Only 2-D sizing, positioning (x, y, rotation),
 * coverage, overhang and notching are evaluated here.
 *
 * ── How a fit is measured ───────────────────────────────────────────────────────────────────────────
 * The two radiographs are calibrated 2-D views, not a 3-D reconstruction, so each metric is measured in
 * the view that shows it:
 *   • Medio-lateral extent and overhang   → the AP (FLAP) drawing of the template, including its in-plane rotation.
 *   • Antero-posterior extent and overhang → the lateral (KLAT) drawing of the template.
 *   • Tibial "cortical coverage"          → area of the axial baseplate footprint ∩ the ESTIMATED plateau outline.
 *     Radiographs do not show the axial outline; it is a generic shape scaled to the surgeon's ML and AP
 *     marks. The number is an estimate and the UI says so.
 *
 * ── Where each rule comes from ──────────────────────────────────────────────────────────────────────
 * See FIT_RULES below. Only the rules marked SOURCE_VERIFIED are in the V1 PDF.
 */

import type { Point2D } from "./coordinates";
import {
  FEMORAL_SIZE_DIMENSIONS,
  TIBIAL_SIZE_DIMENSIONS,
  estimatedTibialPlateauOutline,
  extentsOf,
  getFemoralImplant,
  getTibialImplant,
  placePolygon,
  area,
} from "./implant_templates";
import { calculatePolygonIntersectionArea, transformPhysicalPolygon } from "./tibial_geometry";

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

const label = (size: number, apMm: number, mlMm: number) => `Size ${size} (${apMm.toFixed(1)} × ${mlMm.toFixed(1)} mm)`;

/** V1 tibial sizes 1-6. Dimensions: ENGINEERING_DERIVATION, CLINICAL_APPROVAL_REQUIRED (see implant_templates/dimensions.ts). */
export const TIBIAL_TEMPLATES: TibialTemplate[] = TIBIAL_SIZE_DIMENSIONS.map((d) => ({
  ...d,
  label: label(d.size, d.apMm, d.mlMm),
}));

/** V1 femoral sizes 1-8. Same provenance. */
export const FEMORAL_TEMPLATES: FemoralTemplate[] = FEMORAL_SIZE_DIMENSIONS.map((d) => ({
  ...d,
  label: label(d.size, d.apMm, d.mlMm),
}));

export function getTibialTemplate(size: number): TibialTemplate {
  return TIBIAL_TEMPLATES.find((t) => t.size === size) ?? TIBIAL_TEMPLATES[2];
}

export function getFemoralTemplate(size: number): FemoralTemplate {
  return FEMORAL_TEMPLATES.find((t) => t.size === size) ?? FEMORAL_TEMPLATES[3];
}

/** The size whose ML dimension is closest to the measured one (used to highlight a size, not to prescribe it). */
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

/** The size whose AP dimension is closest to the measured one. */
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

export type { Point2D };
export { transformPhysicalPolygon };

/* ───────────────────────────── rule provenance ───────────────────────────── */

export type RuleClass =
  | "SOURCE_VERIFIED"
  | "PROJECT_RULE"
  | "ENGINEERING_DERIVATION"
  | "CLINICAL_APPROVAL_REQUIRED"
  | "UNKNOWN";

export type FitRule = {
  id: string;
  component: "tibial" | "femoral";
  label: string;
  /** Human-readable rule, e.g. "≥ 90.0 %". */
  rule: string;
  classification: RuleClass;
  /** Where it appears in the V1 PDF, or why it is not there. */
  source: string;
  /** True for rules defined by the V1 PDF; false for project/engineering additions. */
  v1: boolean;
};

/**
 * Every threshold the engine applies, and where it comes from. The UI uses `v1` to separate what the
 * V1 specification requires from rules the project added.
 */
export const FIT_RULES: readonly FitRule[] = [
  { id: "tibial.coverage.min", component: "tibial", label: "Cortical coverage", rule: "≥ 90.0 %", classification: "SOURCE_VERIFIED", source: "V1 PDF p.4-5 (Fit Metrics table)", v1: true },
  { id: "tibial.overhang.max", component: "tibial", label: "Medial / lateral overhang", rule: "≤ 1.0 mm", classification: "SOURCE_VERIFIED", source: "V1 PDF p.5 (Fit Metrics table)", v1: true },
  { id: "tibial.overhang.caution", component: "tibial", label: "Overhang caution", rule: "> 1.5 mm → \"CAUTION: Medial Overhang > 1.5mm\"", classification: "SOURCE_VERIFIED", source: "V1 PDF p.5 (below the table)", v1: true },
  { id: "tibial.coverage.poor", component: "tibial", label: "Poor coverage", rule: "< 85 %", classification: "PROJECT_RULE", source: "doc 09 only; not in the V1 PDF — clinical approval required", v1: false },
  { id: "tibial.ap.overhang", component: "tibial", label: "Anterior / posterior overhang", rule: "same 1.0 / 1.5 mm limits", classification: "ENGINEERING_DERIVATION", source: "Not in the V1 PDF (it lists medial and lateral only)", v1: false },
  { id: "femoral.coverage.min", component: "femoral", label: "AP / ML coverage", rule: "≥ 90.0 %", classification: "PROJECT_RULE", source: "V1 PDF p.5 shows example values only (97.1 % / 95.8 %); the limit is reused from Page 2", v1: false },
  { id: "femoral.coverage.poor", component: "femoral", label: "Poor coverage", rule: "< 85 %", classification: "PROJECT_RULE", source: "doc 09 only — clinical approval required", v1: false },
  { id: "femoral.notch.limit", component: "femoral", label: "Anterior notching risk", rule: "> 0.5 mm gap → caution", classification: "PROJECT_RULE", source: "V1 PDF shows \"0.0 mm (Flush)\" as an example only; the limit is from doc 09 — clinical approval required", v1: false },
] as const;

/* ───────────────────────────── tones and thresholds ───────────────────────────── */

export type FitTone = "pass" | "warn" | "fail";

const TONE_RANK: Record<FitTone, number> = { pass: 0, warn: 1, fail: 2 };

/** The worst of several tones. A fit is only as good as its weakest edge. */
export function worstTone(tones: FitTone[]): FitTone {
  return tones.reduce<FitTone>((w, t) => (TONE_RANK[t] > TONE_RANK[w] ? t : w), "pass");
}

/**
 * Which side of the image each anatomical side is on. The medial cortex is the bone edge the
 * surgeon marked as "medial", so this follows the markers instead of assuming left or right.
 * `negX` is the image's left edge in the AP view; `negY` is the anterior side.
 */
export type FitOrientation = {
  medialSide: "negX" | "posX";
  anteriorSide: "negY" | "posY";
};

export const DEFAULT_ORIENTATION: FitOrientation = { medialSide: "negX", anteriorSide: "negY" };

/** Outer bounds of the placed component, in the frame of the offsets: x to the image right, +y posterior. */
export type FitExtents = { minX: number; maxX: number; minY: number; maxY: number };

export type TibialFitThresholds = {
  minCoveragePct: number;
  maxOverhangMm: number;
  cautionOverhangMm: number;
  /** Coverage below this is a poor fit; between this and `minCoveragePct` it is borderline (PROJECT_RULE). */
  poorCoveragePct: number;
};

export const DEFAULT_TIBIAL_FIT_THRESHOLDS: TibialFitThresholds = {
  minCoveragePct: 90.0,
  maxOverhangMm: 1.0,
  cautionOverhangMm: 1.5,
  poorCoveragePct: 85.0,
};

export const coverageTone = (pct: number, t = DEFAULT_TIBIAL_FIT_THRESHOLDS): FitTone =>
  pct >= t.minCoveragePct ? "pass" : pct >= t.poorCoveragePct ? "warn" : "fail";

export const overhangTone = (mm: number, t = DEFAULT_TIBIAL_FIT_THRESHOLDS): FitTone =>
  mm <= t.maxOverhangMm ? "pass" : mm <= t.cautionOverhangMm ? "warn" : "fail";

export type TibialFitResult = {
  coveragePct: number;
  medialOverhangMm: number;
  lateralOverhangMm: number;
  anteriorOverhangMm: number;
  posteriorOverhangMm: number;
  coverageTone: FitTone;
  medialTone: FitTone;
  lateralTone: FitTone;
  anteriorTone: FitTone;
  posteriorTone: FitTone;
  worstTone: FitTone;
  extents: FitExtents;
  fitStatus: "ACCEPTABLE FIT" | "BORDERLINE FIT" | "POOR FIT";
  /** The V1 PDF's caution text for each medial/lateral overhang beyond the caution limit. */
  cautionTags: string[];
};

const round1 = (v: number) => Number(v.toFixed(1));

/** The PDF's exact caution wording (p.5): "CAUTION: Medial Overhang > 1.5mm". */
export const overhangCautionTag = (side: "Medial" | "Lateral", cautionMm: number) =>
  `CAUTION: ${side} Overhang > ${cautionMm}mm`;

/**
 * Tibial fit of a tray against the patient's plateau.
 *
 * `patientApMm` / `patientMlMm` are the surgeon's measured spans. When omitted the bone is taken to be
 * exactly the template's own size ("nominal") — never a borrowed example value.
 *
 * Offsets are measured from the middle of the marked bone edges. `rotationDeg` is the IN-PLANE rotation
 * of the AP overlay about its centre handle (V1: "minor 2-D alignment with the MPTA axis line"); it does
 * not affect the axial coverage estimate or the lateral view.
 */
export function evaluateTibialFit(
  size: number,
  xOffsetMm: number,
  yOffsetMm: number,
  patientApMm?: number,
  patientMlMm?: number,
  rotationDeg = 0,
  customBoneBoundary?: Point2D[],
  thresholds: TibialFitThresholds = DEFAULT_TIBIAL_FIT_THRESHOLDS,
  orientation: FitOrientation = DEFAULT_ORIENTATION,
): TibialFitResult {
  const tpl = getTibialImplant(size);
  const ml = patientMlMm ?? tpl.dimensionsMm.ml;
  const ap = patientApMm ?? tpl.dimensionsMm.ap;

  const bonePoly =
    customBoneBoundary && customBoneBoundary.length >= 3 ? customBoneBoundary : estimatedTibialPlateauOutline(ml, ap);

  // Coverage: axial footprint (translated only) against the estimated plateau outline.
  const footprint = placePolygon(tpl.footprint, xOffsetMm, yOffsetMm, 0);
  const boneArea = area(bonePoly);
  const coveragePct = round1(boneArea > 0 ? (calculatePolygonIntersectionArea(footprint, bonePoly) / boneArea) * 100 : 0);

  // ML: the AP drawing, rotated in-plane, against the marked medio-lateral edges.
  const boneX = extentsOf(bonePoly);
  const apExt = extentsOf(placePolygon(tpl.views.ap.silhouette, xOffsetMm, 0, rotationDeg));
  // AP: the lateral drawing against the marked antero-posterior edges.
  const latMin = tpl.views.lateral.extents.minX + yOffsetMm;
  const latMax = tpl.views.lateral.extents.maxX + yOffsetMm;

  const o = {
    negX: Math.max(0, boneX.minX - apExt.minX),
    posX: Math.max(0, apExt.maxX - boneX.maxX),
    negY: Math.max(0, boneX.minY - latMin),
    posY: Math.max(0, latMax - boneX.maxY),
  };
  const medialKey = orientation.medialSide;
  const lateralKey = medialKey === "negX" ? "posX" : "negX";
  const anteriorKey = orientation.anteriorSide;
  const posteriorKey = anteriorKey === "negY" ? "posY" : "negY";

  const medialOverhangMm = round1(o[medialKey]);
  const lateralOverhangMm = round1(o[lateralKey]);
  const anteriorOverhangMm = round1(o[anteriorKey]);
  const posteriorOverhangMm = round1(o[posteriorKey]);

  const tones = {
    coverageTone: coverageTone(coveragePct, thresholds),
    medialTone: overhangTone(medialOverhangMm, thresholds),
    lateralTone: overhangTone(lateralOverhangMm, thresholds),
    anteriorTone: overhangTone(anteriorOverhangMm, thresholds),
    posteriorTone: overhangTone(posteriorOverhangMm, thresholds),
  };
  const worst = worstTone(Object.values(tones));

  const cautionTags: string[] = [];
  if (medialOverhangMm > thresholds.cautionOverhangMm) cautionTags.push(overhangCautionTag("Medial", thresholds.cautionOverhangMm));
  if (lateralOverhangMm > thresholds.cautionOverhangMm) cautionTags.push(overhangCautionTag("Lateral", thresholds.cautionOverhangMm));

  return {
    coveragePct,
    medialOverhangMm,
    lateralOverhangMm,
    anteriorOverhangMm,
    posteriorOverhangMm,
    ...tones,
    worstTone: worst,
    extents: { minX: apExt.minX, maxX: apExt.maxX, minY: latMin, maxY: latMax },
    fitStatus: worst === "pass" ? "ACCEPTABLE FIT" : worst === "warn" ? "BORDERLINE FIT" : "POOR FIT",
    cautionTags,
  };
}

export type FemoralFitResult = {
  apCoveragePct: number;
  mlCoveragePct: number;
  /** Gap between the anterior flange and the anterior cortex. Flush is 0; the project limit is 0.5 mm. */
  notchingRiskMm: number;
  /** How far the flange sits past the anterior cortex, if it does. */
  anteriorProudMm: number;
  medialOverhangMm: number;
  lateralOverhangMm: number;
  posteriorOverhangMm: number;
  apCoverageTone: FitTone;
  mlCoverageTone: FitTone;
  notchTone: FitTone;
  worstTone: FitTone;
  extents: FitExtents;
  fitStatus: "ACCEPTABLE FIT" | "BORDERLINE FIT" | "CAUTION: Anterior Notch Risk" | "POOR FIT";
};

export const FEMORAL_NOTCH_LIMIT_MM = 0.5;

/** Where the femoral template sits once placed: the same extents the fit is measured on. */
export function femoralExtents(size: number, xOffsetMm: number, yOffsetMm: number, rotationDeg = 0): FitExtents {
  const tpl = getFemoralImplant(size);
  const apExt = extentsOf(placePolygon(tpl.views.ap.silhouette, xOffsetMm, 0, rotationDeg));
  return {
    minX: apExt.minX,
    maxX: apExt.maxX,
    minY: tpl.views.lateral.extents.minX + yOffsetMm,
    maxY: tpl.views.lateral.extents.maxX + yOffsetMm,
  };
}

/**
 * Femoral fit of a component against the marked distal femur.
 *
 * Coverage is span-based (no area claim): ML coverage from the AP drawing's horizontal extent, AP coverage
 * from the lateral drawing's extent, each as a share of the marked bone dimension. The anterior gap is the
 * notching-risk reading (flush = 0). The PDF sets no limit for side or posterior overhang, so they are
 * reported but do not change the verdict.
 */
export function evaluateFemoralFit(
  size: number,
  xOffsetMm: number,
  yOffsetMm: number,
  patientApMm?: number,
  patientMlMm?: number,
  rotationDeg = 0,
  orientation: FitOrientation = DEFAULT_ORIENTATION,
): FemoralFitResult {
  const tpl = getFemoralImplant(size);
  const ml = patientMlMm ?? tpl.dimensionsMm.ml;
  const ap = patientApMm ?? tpl.dimensionsMm.ap;
  const ext = femoralExtents(size, xOffsetMm, yOffsetMm, rotationDeg);

  const boneMinX = -ml / 2;
  const boneMaxX = ml / 2;
  const boneMinY = -ap / 2;
  const boneMaxY = ap / 2;

  const overlapMl = Math.max(0, Math.min(boneMaxX, ext.maxX) - Math.max(boneMinX, ext.minX));
  const overlapAp = Math.max(0, Math.min(boneMaxY, ext.maxY) - Math.max(boneMinY, ext.minY));
  const apCoveragePct = round1((overlapAp / ap) * 100);
  const mlCoveragePct = round1((overlapMl / ml) * 100);

  const over = {
    negX: Math.max(0, boneMinX - ext.minX),
    posX: Math.max(0, ext.maxX - boneMaxX),
    negY: Math.max(0, boneMinY - ext.minY),
    posY: Math.max(0, ext.maxY - boneMaxY),
  };
  const anteriorKey = orientation.anteriorSide;
  const posteriorKey = anteriorKey === "negY" ? "posY" : "negY";
  const medialKey = orientation.medialSide;
  const lateralKey = medialKey === "negX" ? "posX" : "negX";

  // The anterior edge is the one nearest the anterior cortex. A flange short of the cortex is a gap
  // (notching risk); one past it is proud.
  const anteriorGap =
    anteriorKey === "negY" ? Math.max(0, ext.minY - boneMinY) : Math.max(0, boneMaxY - ext.maxY);
  const notchingRiskMm = round1(anteriorGap);

  const apCoverageTone = coverageTone(apCoveragePct);
  const mlCoverageTone = coverageTone(mlCoveragePct);
  const notchTone: FitTone = notchingRiskMm > FEMORAL_NOTCH_LIMIT_MM ? "warn" : "pass";
  const worst = worstTone([apCoverageTone, mlCoverageTone, notchTone]);

  let fitStatus: FemoralFitResult["fitStatus"] = "ACCEPTABLE FIT";
  if (worst === "fail") fitStatus = "POOR FIT";
  else if (notchTone === "warn") fitStatus = "CAUTION: Anterior Notch Risk";
  else if (worst === "warn") fitStatus = "BORDERLINE FIT";

  return {
    apCoveragePct,
    mlCoveragePct,
    notchingRiskMm,
    anteriorProudMm: round1(over[anteriorKey]),
    medialOverhangMm: round1(over[medialKey]),
    lateralOverhangMm: round1(over[lateralKey]),
    posteriorOverhangMm: round1(over[posteriorKey]),
    apCoverageTone,
    mlCoverageTone,
    notchTone,
    worstTone: worst,
    extents: ext,
    fitStatus,
  };
}
