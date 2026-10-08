/**
 * Calibration helpers for MediVeR-XR Pre-operative TKA Planning (V1 Specification).
 *
 * Clinical standard: a 25.0 mm radio-opaque spherical calibration marker. The scale of EACH radiograph is
 * derived from that marker (mm per pixel = real size / measured pixels); there is no universal scale.
 *
 * The V1 PDF prints "0.264 mm/px" in its Review example. That is example data, not a default for any
 * patient. `PLACEHOLDER_MM_PER_PX` below exists only so a scan that has not been calibrated can still be
 * drawn before the surgeon sets its scale. It is never valid (`isValid: false`), it blocks locking a plan,
 * and `pxToMm` / `mmToPx` refuse to use it.
 */

import type { V1Calibration } from "@/lib/plan";

/** The real size of the V1 calibration marker (the 25 mm radio-opaque sphere). */
export const DEFAULT_CALIBRATION_MARKER_MM = 25.0;

/** UNVERIFIED display placeholder (the PDF's example value). Never a patient scale; never valid. */
export const PLACEHOLDER_MM_PER_PX = 0.264;

export const DEFAULT_CALIBRATION: V1Calibration = {
  marker_type: "sphere_25mm",
  marker_diameter_mm: DEFAULT_CALIBRATION_MARKER_MM,
  measured_pixel_diameter: DEFAULT_CALIBRATION_MARKER_MM / PLACEHOLDER_MM_PER_PX,
  mm_per_px: PLACEHOLDER_MM_PER_PX,
  calibrated_at: "1970-01-01T00:00:00.000Z",
  isValid: false, // A placeholder is NOT valid for clinical use.
};

/** Convert a pixel distance to millimetres. Only a calibration that is explicitly valid may be used. */
export function pxToMm(px: number, calibration: V1Calibration = DEFAULT_CALIBRATION): number {
  if (calibration.isValid !== true || !(calibration.mm_per_px > 0)) return NaN;
  return Number((px * calibration.mm_per_px).toFixed(1));
}

/** Convert a millimetre distance to pixels. Only a calibration that is explicitly valid may be used. */
export function mmToPx(mm: number, calibration: V1Calibration = DEFAULT_CALIBRATION): number {
  if (calibration.isValid !== true || !(calibration.mm_per_px > 0)) return NaN;
  return Number((mm / calibration.mm_per_px).toFixed(1));
}

/** Calibration label for headers. An unverified scale is never described as a verified marker scale. */
export function formatCalibration(calibration?: V1Calibration): string {
  if (!calibration || !(calibration.mm_per_px > 0)) return "Scale not set";
  const value = `${calibration.mm_per_px.toFixed(3)} mm/px`;
  return calibration.isValid === true ? `${value} (25 mm marker)` : `${value} (not verified)`;
}
