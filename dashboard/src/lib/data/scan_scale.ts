/**
 * The scale of each scan, decided in one place.
 *
 * The assessment, tibial and femoral steps all read it from here, so the same scan can never be
 * measured at two different scales, and the header, the fit and the implant drawing agree.
 *
 * Order of trust: a scale measured on this plan, then the case's own verified calibration, then an
 * estimate (clearly labelled, never presented as verified).
 */

import { REALISTIC_SCALE_MM_PER_PX, normalizeCalibration } from "./coordinates";
import { fallbackNotice, resolveScan } from "../plan-scans";
import type { V1ScanCalibration, V1ScanCalibrations } from "../plan";

export type ScanView = "FLAP" | "KLAT";
export type ScanScaleSource = "plan" | "case" | "estimate";

export type ScanScale = {
  view: ScanView;
  src: string;
  isFallback: boolean;
  notice: string;
  mmPerPx: number;
  /** True only for a scale measured on this plan or verified on the case. */
  calibrated: boolean;
  source: ScanScaleSource;
};

type ImagingLike = { view: string; src?: string; calibration?: unknown };
type PlanLike = {
  case?: { imaging?: ImagingLike[] };
  payload: { scan_calibration?: V1ScanCalibrations };
};

/** The case image that serves a view, matching the names the planning screens already accept. */
export function pickImage(imaging: ImagingLike[] | undefined, view: ScanView): ImagingLike | undefined {
  const named = (...names: string[]) => imaging?.find((i) => names.includes(i.view.toLowerCase()));
  return view === "FLAP" ? named("ap") ?? named("flap") ?? named("long_leg") : named("klat") ?? named("lateral");
}

export function resolveScanScale(
  plan: PlanLike,
  view: ScanView,
  override?: V1ScanCalibrations,
): ScanScale {
  const image = pickImage(plan.case?.imaging, view);
  const resolved = resolveScan(image, view);
  const base = {
    view,
    src: resolved.src,
    isFallback: resolved.isFallback,
    notice: resolved.isFallback ? fallbackNotice(view) : "",
  };

  const measured = override?.[view] ?? plan.payload.scan_calibration?.[view];
  if (measured && measured.mm_per_px > 0) {
    return { ...base, mmPerPx: measured.mm_per_px, calibrated: true, source: "plan" };
  }

  const cal = normalizeCalibration(image?.calibration, `${view} ${resolved.src}`);
  return {
    ...base,
    mmPerPx: cal.mm_per_px,
    calibrated: cal.isValid === true,
    source: cal.isValid === true ? "case" : "estimate",
  };
}

export function resolvePlanScales(plan: PlanLike, override?: V1ScanCalibrations): Record<ScanView, ScanScale> {
  return { FLAP: resolveScanScale(plan, "FLAP", override), KLAT: resolveScanScale(plan, "KLAT", override) };
}

export const SCAN_VIEW_NAME: Record<ScanView, string> = { FLAP: "AP", KLAT: "lateral" };

/** "0.250 mm/px · measured on this plan", for headers and panels. */
export function describeScale(s: ScanScale): string {
  const how =
    s.source === "plan" ? "measured on this plan" : s.source === "case" ? "from the case's marker" : "estimated, not verified";
  return `${s.mmPerPx.toFixed(3)} mm/px · ${how}`;
}

/** Whether two scales are the same for planning purposes (half a percent apart is the same). */
export function sameScale(a: number | undefined, b: number | undefined): boolean {
  if (a === undefined || b === undefined) return a === b;
  return Math.abs(a - b) / Math.max(a, b) < 0.005;
}

/**
 * Turn two clicks a known distance apart into a scale. Refuses anything a real radiograph could not
 * be: a zero distance, or a scale outside the realistic range.
 */
export function scaleFromTwoPoints(
  knownMm: number,
  measuredPx: number,
  method: V1ScanCalibration["method"] = "two_point",
): { ok: true; calibration: V1ScanCalibration } | { ok: false; error: string } {
  if (!(knownMm > 0)) return { ok: false, error: "Enter the real size of the marker in millimetres." };
  if (!(measuredPx >= 4)) return { ok: false, error: "The two points are too close together. Click the two opposite sides of the marker." };
  const mmPerPx = knownMm / measuredPx;
  const [lo, hi] = REALISTIC_SCALE_MM_PER_PX;
  if (mmPerPx < lo || mmPerPx > hi) {
    return {
      ok: false,
      error: `That gives ${mmPerPx.toFixed(3)} mm per pixel, which no radiograph produces (expected ${lo} to ${hi}). Check the points and the marker size.`,
    };
  }
  return {
    ok: true,
    calibration: {
      mm_per_px: Number(mmPerPx.toFixed(5)),
      known_mm: knownMm,
      measured_px: Number(measuredPx.toFixed(2)),
      method,
      calibrated_at: new Date().toISOString(),
    },
  };
}
