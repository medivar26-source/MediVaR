/**
 * Bone-edge markers for the tibial and femoral fit.
 *
 * The surgeon marks the four edges of the bone on the scans: medial and lateral on the AP (front)
 * view, anterior and posterior on the lateral view. From those four points we get the bone's width
 * and depth in millimetres, where its middle is, and which side of the image is medial. The fit is
 * then measured against that bone instead of against a stock outline.
 *
 * Markers are stored as percentages of the image, so they survive a change of display size. Turning
 * them into millimetres needs the scan's pixel size and its calibration; both are passed in.
 */

import type { V1FitMarkers } from "@/lib/plan";
import {
  DEFAULT_ORIENTATION,
  FEMORAL_TEMPLATES,
  TIBIAL_TEMPLATES,
  coverageTone,
  evaluateFemoralFit,
  evaluateTibialFit,
  overhangTone,
  worstTone,
  type FemoralFitResult,
  type FitExtents,
  type FitOrientation,
  type FitTone,
  type TibialFitResult,
} from "./tkr_templates";

export type MarkerKey = "medial" | "lateral" | "anterior" | "posterior";
export type ScanView = "FLAP" | "KLAT";
export type ComponentKind = "tibial" | "femoral";

export const MARKER_KEYS: MarkerKey[] = ["medial", "lateral", "anterior", "posterior"];

/** Which scan each marker belongs on. */
export const MARKER_VIEW: Record<MarkerKey, ScanView> = {
  medial: "FLAP",
  lateral: "FLAP",
  anterior: "KLAT",
  posterior: "KLAT",
};

export const MARKER_LABEL: Record<MarkerKey, string> = {
  medial: "Medial edge",
  lateral: "Lateral edge",
  anterior: "Anterior edge",
  posterior: "Posterior edge",
};

const BONE_NAME: Record<ComponentKind, string> = {
  tibial: "tibial plateau at the cut level",
  femoral: "distal femur",
};

/** One line telling the surgeon where to click. */
export function markerHint(kind: ComponentKind, key: MarkerKey): string {
  const bone = BONE_NAME[kind];
  const view = MARKER_VIEW[key] === "FLAP" ? "AP (front) scan" : "lateral (side) scan";
  return `Click the outer ${MARKER_LABEL[key].toLowerCase()} of the ${bone} on the ${view}.`;
}

/** The assessment landmarks that give a first guess for each marker. */
const SEED_KEYS: Record<ComponentKind, Partial<Record<MarkerKey, string>>> = {
  tibial: {
    medial: "tibiaProximalMedial",
    lateral: "tibiaProximalLateral",
    anterior: "tibiaPlateauAnterior",
    posterior: "tibiaPlateauPosterior",
  },
  femoral: {
    medial: "femurDistalMedial",
    lateral: "femurDistalLateral",
  },
};

/**
 * First guess for the markers, taken from the assessment step, and only once that step has been
 * accepted. They are never marked confirmed: the surgeon has to look at them and say so.
 */
export function seedMarkers(
  kind: ComponentKind,
  payload: { assessment_landmarks?: Record<string, { x: number; y: number }>; v1_assessment?: unknown } | undefined,
): V1FitMarkers {
  if (!payload?.v1_assessment || !payload.assessment_landmarks) return {};
  const out: V1FitMarkers = {};
  for (const key of MARKER_KEYS) {
    const seedKey = SEED_KEYS[kind][key];
    const p = seedKey ? payload.assessment_landmarks[seedKey] : undefined;
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) out[key] = { x: p.x, y: p.y };
  }
  return out;
}

export function markersPlaced(m: V1FitMarkers | undefined): MarkerKey[] {
  return MARKER_KEYS.filter((k) => Boolean(m?.[k]));
}

export function allMarkersPlaced(m: V1FitMarkers | undefined): boolean {
  return markersPlaced(m).length === MARKER_KEYS.length;
}

/** What is needed to turn a view's marker positions into millimetres. */
export type ViewScale = {
  widthPx: number;
  heightPx: number;
  mmPerPx: number;
  /** True only when the scan carries a verified 25 mm marker calibration. */
  calibrated: boolean;
};

export type Origin = { x: number; y: number };

export type BoneModel = {
  mlMm?: number;
  apMm?: number;
  /** Both width and depth are known, so the fit can be evaluated. */
  complete: boolean;
  orientation: FitOrientation;
  /** Middle of the two AP-view markers, in image pixels. Offsets are measured from here. */
  flapOrigin?: Origin;
  /** Middle of the two lateral-view markers, in image pixels. */
  klatOrigin?: Origin;
  /** +1 when the anterior marker is on the image's right in the lateral view, else -1. */
  anteriorImageSign: 1 | -1;
  /** True when any scale used was not calibrated, so millimetres are estimates. */
  scaleEstimated: boolean;
  /** Things worth a second look, in plain language. */
  warnings: string[];
};

/** Plausible bone sizes, from the implant catalogue with a margin either side. */
const PLAUSIBLE = {
  tibial: {
    ml: [Math.min(...TIBIAL_TEMPLATES.map((t) => t.mlMm)) * 0.75, Math.max(...TIBIAL_TEMPLATES.map((t) => t.mlMm)) * 1.3],
    ap: [Math.min(...TIBIAL_TEMPLATES.map((t) => t.apMm)) * 0.75, Math.max(...TIBIAL_TEMPLATES.map((t) => t.apMm)) * 1.3],
  },
  femoral: {
    ml: [Math.min(...FEMORAL_TEMPLATES.map((t) => t.mlMm)) * 0.75, Math.max(...FEMORAL_TEMPLATES.map((t) => t.mlMm)) * 1.3],
    ap: [Math.min(...FEMORAL_TEMPLATES.map((t) => t.apMm)) * 0.75, Math.max(...FEMORAL_TEMPLATES.map((t) => t.apMm)) * 1.3],
  },
} as const;

export function deriveBone(
  kind: ComponentKind,
  markers: V1FitMarkers | undefined,
  flap: ViewScale | undefined,
  klat: ViewScale | undefined,
): BoneModel {
  const warnings: string[] = [];
  let mlMm: number | undefined;
  let apMm: number | undefined;
  let flapOrigin: Origin | undefined;
  let klatOrigin: Origin | undefined;
  let orientation: FitOrientation = DEFAULT_ORIENTATION;
  let anteriorImageSign: 1 | -1 = 1;
  let scaleEstimated = false;

  const { medial, lateral, anterior, posterior } = markers ?? {};

  if (medial && lateral && flap && flap.widthPx > 0) {
    const mx = (medial.x / 100) * flap.widthPx;
    const lx = (lateral.x / 100) * flap.widthPx;
    mlMm = Math.abs(mx - lx) * flap.mmPerPx;
    flapOrigin = {
      x: (mx + lx) / 2,
      y: (((medial.y + lateral.y) / 2) / 100) * flap.heightPx,
    };
    orientation = { ...orientation, medialSide: mx > lx ? "posX" : "negX" };
    if (!flap.calibrated) scaleEstimated = true;
    if (Math.abs(mx - lx) < 2) warnings.push("The medial and lateral markers are almost on top of each other.");
  }

  if (anterior && posterior && klat && klat.widthPx > 0) {
    const ax = (anterior.x / 100) * klat.widthPx;
    const px = (posterior.x / 100) * klat.widthPx;
    apMm = Math.abs(ax - px) * klat.mmPerPx;
    klatOrigin = {
      x: (ax + px) / 2,
      y: (((anterior.y + posterior.y) / 2) / 100) * klat.heightPx,
    };
    anteriorImageSign = ax >= px ? 1 : -1;
    if (!klat.calibrated) scaleEstimated = true;
    if (Math.abs(ax - px) < 2) warnings.push("The anterior and posterior markers are almost on top of each other.");
  }

  const range = PLAUSIBLE[kind];
  if (mlMm !== undefined && (mlMm < range.ml[0] || mlMm > range.ml[1])) {
    warnings.push(`A width of ${mlMm.toFixed(1)} mm is outside the usual range. Check the medial and lateral markers and the scan scale.`);
  }
  if (apMm !== undefined && (apMm < range.ap[0] || apMm > range.ap[1])) {
    warnings.push(`A depth of ${apMm.toFixed(1)} mm is outside the usual range. Check the anterior and posterior markers and the scan scale.`);
  }

  return {
    mlMm,
    apMm,
    complete: mlMm !== undefined && apMm !== undefined && Number.isFinite(mlMm) && Number.isFinite(apMm),
    orientation,
    flapOrigin,
    klatOrigin,
    anteriorImageSign,
    scaleEstimated,
    warnings,
  };
}

/**
 * The angle, in degrees clockwise on screen, of the line through the medial and lateral bone-edge marks on
 * the AP scan — the plateau / MPTA line the V1 rotation handle is meant to align the overlay with.
 * `undefined` until both marks are placed and the scan size is known. Reported as the smaller angle
 * (-90…90°) so it does not depend on which mark is on the left.
 */
export function plateauLineAngleDeg(
  markers: V1FitMarkers | undefined,
  flap: { widthPx: number; heightPx: number } | undefined,
): number | undefined {
  const m = markers?.medial;
  const l = markers?.lateral;
  if (!m || !l || !flap || flap.widthPx <= 0 || flap.heightPx <= 0) return undefined;
  const dx = ((l.x - m.x) / 100) * flap.widthPx;
  const dy = ((l.y - m.y) / 100) * flap.heightPx;
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) return undefined;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg < -90) deg += 180;
  return Number(deg.toFixed(1));
}

/* ---------- image <-> model frame ---------- */

/**
 * Model frame: x follows the AP image to the right; y is anteroposterior, positive posterior.
 * In the lateral view the horizontal image axis is anteroposterior, so a model y of +1 mm moves
 * `-anteriorImageSign` pixels along the image's x axis.
 */
export function modelXToImage(xMm: number, origin: Origin, mmPerPx: number): number {
  return origin.x + xMm / mmPerPx;
}

export function modelYToImageX(yMm: number, origin: Origin, mmPerPx: number, anteriorImageSign: 1 | -1): number {
  return origin.x - (anteriorImageSign * yMm) / mmPerPx;
}

/** An image-x drag in the lateral view, in model y millimetres. */
export function imageDxToModelY(dxPx: number, mmPerPx: number, anteriorImageSign: 1 | -1): number {
  return -anteriorImageSign * dxPx * mmPerPx;
}

/**
 * A move across the screen, in millimetres (right and down positive), as changes to the component's
 * offsets. On the AP scan, sideways is medial/lateral; on the lateral scan it is anterior/posterior.
 * Up and down is the height on the scan, which the fit does not depend on.
 */
export function screenMoveToOffsets(
  view: ScanView,
  dxMm: number,
  dyMm: number,
  anteriorImageSign: 1 | -1,
): { x: number; y: number; level: number } {
  return view === "FLAP"
    ? { x: dxMm, y: 0, level: dyMm }
    : { x: 0, y: -anteriorImageSign * dxMm, level: dyMm };
}

/* ---------- ranking sizes and auto-fit ---------- */

const TONE_WEIGHT: Record<FitTone, number> = { pass: 0, warn: 1000, fail: 2000 };

export type TibialSizeRow = { size: number; result: TibialFitResult; score: number };
export type FemoralSizeRow = { size: number; result: FemoralFitResult; score: number };

function tibialScore(r: TibialFitResult): number {
  const over = r.medialOverhangMm + r.lateralOverhangMm + r.anteriorOverhangMm + r.posteriorOverhangMm;
  return TONE_WEIGHT[r.worstTone] - r.coveragePct + 20 * over;
}

function femoralScore(r: FemoralFitResult): number {
  const over = r.medialOverhangMm + r.lateralOverhangMm + r.posteriorOverhangMm + r.anteriorProudMm;
  return (
    TONE_WEIGHT[r.worstTone] - (r.apCoveragePct + r.mlCoveragePct) / 2 + 10 * over + 15 * r.notchingRiskMm
  );
}

export function rankTibialSizes(bone: BoneModel, rotationDeg = 0): { rows: TibialSizeRow[]; recommended?: number } {
  if (!bone.complete) return { rows: [] };
  const rows = TIBIAL_TEMPLATES.map((t) => {
    const result = evaluateTibialFit(t.size, 0, 0, bone.apMm!, bone.mlMm!, rotationDeg, undefined, undefined, bone.orientation);
    return { size: t.size, result, score: tibialScore(result) };
  });
  const best = rows.reduce((a, b) => (b.score < a.score ? b : a));
  return { rows, recommended: best.size };
}

export function rankFemoralSizes(bone: BoneModel, rotationDeg = 0): { rows: FemoralSizeRow[]; recommended?: number } {
  if (!bone.complete) return { rows: [] };
  const rows = FEMORAL_TEMPLATES.map((t) => {
    const result = evaluateFemoralFit(t.size, 0, 0, bone.apMm!, bone.mlMm!, rotationDeg, bone.orientation);
    return { size: t.size, result, score: femoralScore(result) };
  });
  const best = rows.reduce((a, b) => (b.score < a.score ? b : a));
  return { rows, recommended: best.size };
}

const SEARCH_RANGE_MM = 4;
const SEARCH_STEP_MM = 0.2;

function gridSearch(score: (x: number, y: number) => number): { x: number; y: number } {
  let best = { x: 0, y: 0, score: score(0, 0) };
  const steps = Math.round(SEARCH_RANGE_MM / SEARCH_STEP_MM);
  for (let ix = -steps; ix <= steps; ix++) {
    for (let iy = -steps; iy <= steps; iy++) {
      const x = Number((ix * SEARCH_STEP_MM).toFixed(1));
      const y = Number((iy * SEARCH_STEP_MM).toFixed(1));
      const sc = score(x, y);
      // Prefer the smaller move when two positions fit equally well.
      if (sc < best.score - 1e-9 || (Math.abs(sc - best.score) <= 1e-9 && Math.hypot(x, y) < Math.hypot(best.x, best.y))) {
        best = { x, y, score: sc };
      }
    }
  }
  return { x: best.x, y: best.y };
}

/** The offset (within ±4 mm) at which this size fits the marked bone best. */
export function autoFitTibial(size: number, bone: BoneModel, rotationDeg: number): { x: number; y: number } {
  if (!bone.complete) return { x: 0, y: 0 };
  return gridSearch((x, y) =>
    tibialScore(evaluateTibialFit(size, x, y, bone.apMm!, bone.mlMm!, rotationDeg, undefined, undefined, bone.orientation)),
  );
}

export function autoFitFemoral(size: number, bone: BoneModel, rotationDeg: number): { x: number; y: number } {
  if (!bone.complete) return { x: 0, y: 0 };
  return gridSearch((x, y) =>
    femoralScore(evaluateFemoralFit(size, x, y, bone.apMm!, bone.mlMm!, rotationDeg, bone.orientation)),
  );
}

/**
 * Gap between each implant edge and the marked bone edge, in millimetres. Positive is a gap,
 * negative means the implant extends past the marked edge.
 */
export function sideGaps(ext: FitExtents, bone: BoneModel): Record<MarkerKey, number> {
  const ml = bone.mlMm ?? 0;
  const ap = bone.apMm ?? 0;
  const x = { negX: ext.minX + ml / 2, posX: ml / 2 - ext.maxX };
  const medial = bone.orientation.medialSide;
  const lateral = medial === "negX" ? "posX" : "negX";
  return {
    medial: x[medial],
    lateral: x[lateral],
    anterior: ext.minY + ap / 2,
    posterior: ap / 2 - ext.maxY,
  };
}

/** Signed clearance: positive is a gap to the bone, negative is overhang. */
export function clearanceText(overhangMm: number, gapMm: number): string {
  if (overhangMm > 0) return `${overhangMm.toFixed(1)} mm over`;
  if (gapMm > 0) return `${gapMm.toFixed(1)} mm gap`;
  return "flush";
}

export { coverageTone, overhangTone, worstTone };
