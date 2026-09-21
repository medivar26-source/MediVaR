/**
 * Calibration module for MediVeR-XR Pre-operative TKA Planning (V1 Specification).
 * 
 * Clinical standard: 25.0 mm radio-opaque spherical calibration marker.
 * Default calibrated scale: 0.264 mm / pixel (~3.788 px / mm).
 */

import type { V1Calibration } from "@/lib/plan";

export const DEFAULT_CALIBRATION_MARKER_MM = 25.0;
export const DEFAULT_MM_PER_PX = 0.264;

export const DEFAULT_CALIBRATION: V1Calibration = {
  marker_type: "sphere_25mm",
  marker_diameter_mm: DEFAULT_CALIBRATION_MARKER_MM,
  measured_pixel_diameter: 25.0 / DEFAULT_MM_PER_PX, // ~94.7 px
  mm_per_px: DEFAULT_MM_PER_PX,
  calibrated_at: new Date().toISOString(),
};

/** Convert pixel distance to millimeters using calibration */
export function pxToMm(px: number, calibration: V1Calibration = DEFAULT_CALIBRATION): number {
  return Number((px * (calibration.mm_per_px || DEFAULT_MM_PER_PX)).toFixed(1));
}

/** Convert millimeter distance to pixels using calibration */
export function mmToPx(mm: number, calibration: V1Calibration = DEFAULT_CALIBRATION): number {
  const mmPerPx = calibration.mm_per_px || DEFAULT_MM_PER_PX;
  return Number((mm / mmPerPx).toFixed(1));
}

/** Format calibration label for persistent header */
export function formatCalibration(calibration?: V1Calibration): string {
  const mmPerPx = calibration?.mm_per_px ?? DEFAULT_MM_PER_PX;
  return `${mmPerPx.toFixed(3)} mm/px (25mm marker)`;
}
