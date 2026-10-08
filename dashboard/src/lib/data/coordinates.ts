/**
 * Canonical Coordinate and Transformation Engine for MediVeR-XR Pre-operative Planning.
 * 
 * Clinical Coordinate Spaces:
 * 1. Physical Space (mm): Real anatomical millimeters. All implant CAD models, resections,
 *    and surgical tolerances are defined in physical millimeters.
 * 2. Natural Image Space (px): The intrinsic raster dimensions of the loaded radiograph
 *    ([0, naturalWidth] x [0, naturalHeight]).
 * 3. Viewport Stage Space (CSS px): The aspect-ratio locked stage inside ScanViewport
 *    ([0, fittedWidth] x [0, fittedHeight]), where fitted = natural * fitScale.
 * 4. Screen Space (DOM px): Raw clientX / clientY browser pointer coordinates, affected
 *    by container position, stage centering, pan (px), and zoom factor.
 */

import type { V1Calibration } from "@/lib/plan";
import { DEFAULT_CALIBRATION, DEFAULT_CALIBRATION_MARKER_MM } from "./calibration";

export type Point2D = { x: number; y: number };

export type ViewportState = {
  naturalWidth: number;
  naturalHeight: number;
  fittedWidth: number;
  fittedHeight: number;
  fitScale: number; // fittedWidth / naturalWidth
  zoom: number;     // e.g. 0.5 to 5.0
  pan: { x: number; y: number };
  containerRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
};

/** Radiographs run from about 0.05 to 1.5 mm per pixel; anything outside that is a mistake. */
export const REALISTIC_SCALE_MM_PER_PX: readonly [number, number] = [0.05, 1.5];

const positive = (v: unknown): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * The scale a stored calibration describes, whichever way it was written:
 * the backend (`calculated_scale_mm_per_px`), the planning screens (`mm_per_px`), a DICOM pixel
 * spacing (`derived_pixel_spacing_mm`), or just the marker's real and measured sizes.
 */
function scaleOf(cal: Record<string, unknown>): number | undefined {
  const direct =
    positive(cal.mm_per_px) ?? positive(cal.derived_pixel_spacing_mm) ?? positive(cal.calculated_scale_mm_per_px);
  if (direct) return direct;
  const physical = positive(cal.physical_marker_diameter_mm) ?? positive(cal.marker_diameter_mm);
  const measured = positive(cal.detected_marker_pixel_diameter) ?? positive(cal.measured_pixel_diameter);
  return physical && measured ? physical / measured : undefined;
}

/**
 * Turn whatever calibration a scan carries into one shape, and say honestly whether it can be trusted.
 *
 * - A stored calibration is used as written. It counts as valid unless it says otherwise
 *   (`is_valid` / `isValid` false) or its scale is outside the realistic range.
 * - Normalising twice gives the same answer. An unverified fallback must never become "valid"
 *   just by passing through this function again.
 * - A scan with no calibration gets a placeholder scale and `isValid: false`. The placeholder is a
 *   guess from the view's name, not a measurement, and the screens say so.
 */
export function normalizeCalibration(cal?: any, viewHint?: string): V1Calibration {
  const scale = cal && typeof cal === "object" ? scaleOf(cal) : undefined;

  if (scale !== undefined) {
    const marker_diameter_mm =
      positive(cal.physical_marker_diameter_mm) ?? positive(cal.marker_diameter_mm) ?? DEFAULT_CALIBRATION_MARKER_MM;
    const measured_pixel_diameter =
      positive(cal.detected_marker_pixel_diameter) ?? positive(cal.measured_pixel_diameter) ?? marker_diameter_mm / scale;
    const flaggedInvalid = cal.is_valid === false || cal.isValid === false;
    const realistic = scale >= REALISTIC_SCALE_MM_PER_PX[0] && scale <= REALISTIC_SCALE_MM_PER_PX[1];

    return {
      marker_type: cal.marker_type === "manual" ? "manual" : "sphere_25mm",
      marker_diameter_mm,
      measured_pixel_diameter,
      mm_per_px: scale,
      calibrated_at: cal.calibrated_at || new Date().toISOString(),
      isValid: realistic && !flaggedInvalid,
    };
  }

  // Full-leg scans (FLAP / long_leg / full_leg_xray) cover the full leg (~850mm across ~1100px):
  // 10cm ruler on flap.jpg measures 130px -> 100mm / 130px = 0.7692 mm/px (25mm marker = 32.5px).
  // Anything else (a knee close-up) gets the placeholder, which is never valid.
  const isFullLeg =
    viewHint?.toLowerCase().includes("flap") ||
    viewHint?.toLowerCase().includes("long_leg") ||
    viewHint?.toLowerCase().includes("full_leg");

  if (isFullLeg) {
    const mm_per_px = 25.0 / 32.5; // ~0.7692 mm/px
    return {
      marker_type: "sphere_25mm",
      marker_diameter_mm: 25.0,
      measured_pixel_diameter: 32.5,
      mm_per_px,
      calibrated_at: new Date().toISOString(),
      isValid: false,
    };
  }

  return DEFAULT_CALIBRATION;
}

/** Calculate calibration from physical marker diameter and measured image pixel diameter */
export function calculateCalibrationFromMarker(
  physicalDiameterMm = 25.0,
  measuredMarkerImagePx: number
): V1Calibration {
  if (measuredMarkerImagePx <= 0) {
    return DEFAULT_CALIBRATION;
  }
  const mm_per_px = physicalDiameterMm / measuredMarkerImagePx;
  return {
    marker_type: "sphere_25mm",
    marker_diameter_mm: physicalDiameterMm,
    measured_pixel_diameter: measuredMarkerImagePx,
    mm_per_px,
    calibrated_at: new Date().toISOString(),
    isValid: true,
  };
}

/** Convert physical millimeters to natural image pixels */
export function mmToImagePx(mm: number, mmPerPx: number): number {
  // No silent fallback scale: without a usable scale there is no honest answer.
  return mmPerPx > 0 ? mm / mmPerPx : NaN;
}

/** Convert natural image pixels to physical millimeters */
export function imagePxToMm(px: number, mmPerPx: number): number {
  return mmPerPx > 0 ? px * mmPerPx : NaN;
}

/** Convert a 2D point from physical millimeters to natural image pixels */
export function physicalToImage(point_mm: Point2D, mmPerPx: number): Point2D {
  return {
    x: mmToImagePx(point_mm.x, mmPerPx),
    y: mmToImagePx(point_mm.y, mmPerPx),
  };
}

/** Convert a 2D point from natural image pixels to physical millimeters */
export function imageToPhysical(point_px: Point2D, mmPerPx: number): Point2D {
  return {
    x: imagePxToMm(point_px.x, mmPerPx),
    y: imagePxToMm(point_px.y, mmPerPx),
  };
}

/**
 * Convert a point in Natural Image Space to Screen Space (browser clientX / clientY).
 */
export function imageToScreen(imagePoint: Point2D, viewport: ViewportState): Point2D {
  const fitScale = viewport.fitScale || (viewport.naturalWidth > 0 ? viewport.fittedWidth / viewport.naturalWidth : 1);
  const xStage = imagePoint.x * fitScale;
  const yStage = imagePoint.y * fitScale;

  const dxFromStageCenter = (xStage - viewport.fittedWidth / 2) * viewport.zoom;
  const dyFromStageCenter = (yStage - viewport.fittedHeight / 2) * viewport.zoom;

  const containerLeft = viewport.containerRect?.left ?? 0;
  const containerTop = viewport.containerRect?.top ?? 0;
  const containerWidth = viewport.containerRect?.width ?? viewport.fittedWidth;
  const containerHeight = viewport.containerRect?.height ?? viewport.fittedHeight;

  const centerX = containerLeft + containerWidth / 2 + viewport.pan.x;
  const centerY = containerTop + containerHeight / 2 + viewport.pan.y;

  return {
    x: centerX + dxFromStageCenter,
    y: centerY + dyFromStageCenter,
  };
}

/**
 * Convert a point in Screen Space (browser clientX / clientY) to Natural Image Space.
 */
export function screenToImage(screenPoint: Point2D, viewport: ViewportState): Point2D {
  const containerLeft = viewport.containerRect?.left ?? 0;
  const containerTop = viewport.containerRect?.top ?? 0;
  const containerWidth = viewport.containerRect?.width ?? viewport.fittedWidth;
  const containerHeight = viewport.containerRect?.height ?? viewport.fittedHeight;

  const centerX = containerLeft + containerWidth / 2 + viewport.pan.x;
  const centerY = containerTop + containerHeight / 2 + viewport.pan.y;

  const dxFromStageCenter = (screenPoint.x - centerX) / viewport.zoom;
  const dyFromStageCenter = (screenPoint.y - centerY) / viewport.zoom;

  const xStage = dxFromStageCenter + viewport.fittedWidth / 2;
  const yStage = dyFromStageCenter + viewport.fittedHeight / 2;

  const fitScale = viewport.fitScale || (viewport.naturalWidth > 0 ? viewport.fittedWidth / viewport.naturalWidth : 1);

  return {
    x: fitScale > 0 ? xStage / fitScale : xStage,
    y: fitScale > 0 ? yStage / fitScale : yStage,
  };
}

/**
 * Convert a screen drag displacement (delta clientX, delta clientY) to natural image pixel delta.
 */
export function screenDeltaToImageDelta(screenDelta: Point2D, viewport: ViewportState): Point2D {
  const fitScale = viewport.fitScale || (viewport.naturalWidth > 0 ? viewport.fittedWidth / viewport.naturalWidth : 1);
  const effectiveScale = fitScale * viewport.zoom;
  return {
    x: effectiveScale > 0 ? screenDelta.x / effectiveScale : screenDelta.x,
    y: effectiveScale > 0 ? screenDelta.y / effectiveScale : screenDelta.y,
  };
}

/**
 * Convert a screen drag displacement directly to physical millimeter displacement.
 * Example: At zoom 2.0 and fitScale 1.0, a 50px screen drag with mmPerPx 0.264 results in:
 * deltaImg = 50 / (1.0 * 2.0) = 25px
 * deltaMm = 25 * 0.264 = 6.6mm
 */
export function screenDeltaToPhysicalMm(
  screenDelta: Point2D,
  viewport: ViewportState,
  mmPerPx: number
): Point2D {
  const imgDelta = screenDeltaToImageDelta(screenDelta, viewport);
  return {
    x: imagePxToMm(imgDelta.x, mmPerPx),
    y: imagePxToMm(imgDelta.y, mmPerPx),
  };
}

/** Apply canonical viewport transform (Image -> Screen) */
export function applyViewportTransform(imagePoint: Point2D, viewport: ViewportState): Point2D {
  return imageToScreen(imagePoint, viewport);
}

/** Remove canonical viewport transform (Screen -> Image) */
export function removeViewportTransform(screenPoint: Point2D, viewport: ViewportState): Point2D {
  return screenToImage(screenPoint, viewport);
}

/** Rotate a 2D point about a center point in degrees */
export function rotatePoint(point: Point2D, angleDeg: number, center: Point2D = { x: 0, y: 0 }): Point2D {
  if (angleDeg === 0) return point;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: dx * cos - dy * sin + center.x,
    y: dx * sin + dy * cos + center.y,
  };
}

/** Translate a 2D point by an offset vector */
export function translatePoint(point: Point2D, offset: Point2D): Point2D {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

/** Transform a physical polygon by physical offset (mm) and rotation (deg) */
export function transformPhysicalPolygon(
  poly: Point2D[],
  xOffsetMm: number,
  yOffsetMm: number,
  rotationDeg: number
): Point2D[] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return poly.map((p) => {
    const rx = p.x * cos - p.y * sin;
    const ry = p.x * sin + p.y * cos;
    return {
      x: rx + xOffsetMm,
      y: ry + yOffsetMm,
    };
  });
}
