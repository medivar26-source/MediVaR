"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePlanPayload } from "@/app/actions";
import {
  DEFAULT_CALIBRATION_MARKER_MM,
} from "@/lib/data/calibration";
import {
  resolvePlanScales,
  scaleFromTwoPoints,
  type ScanScale,
  type ScanView,
} from "@/lib/data/scan_scale";
import type { PlanDetail, V1ScanCalibrations } from "@/lib/plan";
import { useImageDims } from "./planHooks";
import { detectCalibrationMarker, type MarkerCandidate } from "@/lib/data/calibration_detect";

/** What the marker finder reported for one scan. Never a verified scale until the surgeon confirms it. */
export type MarkerDetectionState =
  | { view: ScanView; status: "searching" }
  | { view: ScanView; status: "found"; candidate: MarkerCandidate }
  | { view: ScanView; status: "ambiguous" | "none" | "unavailable"; message: string };

export type ScanDims = { width: number; height: number };

/**
 * The scale of both scans for a plan, and the means to measure a better one.
 *
 * Each scan's scale comes from `resolvePlanScales`; this hook adds the scan sizes (loaded ahead of
 * time, so a measurement never depends on which view is open) and the two-click calibration: click
 * the two opposite sides of a marker of known size and the scale follows. A scale measured this way is
 * saved on the plan and wins over whatever the case carries.
 *
 * `onScaleChanged` lets a screen withdraw a confirmation that was made at the old scale.
 */
export function useScanCalibration({
  plan,
  isReadOnly,
  onScaleChanged,
}: {
  plan: PlanDetail;
  isReadOnly: boolean;
  onScaleChanged?: () => void;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<V1ScanCalibrations>({});
  const [calibrating, setCalibrating] = useState<ScanView | null>(null);
  const [knownMm, setKnownMm] = useState<number>(DEFAULT_CALIBRATION_MARKER_MM);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reported, setReported] = useState<Partial<Record<ScanView, ScanDims>>>({});
  const [detection, setDetection] = useState<MarkerDetectionState | null>(null);

  const scales = useMemo(
    () => resolvePlanScales(plan, local),
    [plan, local],
  ) as Record<ScanView, ScanScale>;

  const flapPre = useImageDims(scales.FLAP.src);
  const klatPre = useImageDims(scales.KLAT.src);
  // The preloaded size is the file's true size; what a canvas reports is only a fallback (DICOM).
  const dims: Record<ScanView, ScanDims | null> = {
    FLAP: flapPre ?? reported.FLAP ?? null,
    KLAT: klatPre ?? reported.KLAT ?? null,
  };

  const reportDims = useCallback((view: ScanView, d: ScanDims) => {
    setReported((prev) => {
      const old = prev[view];
      return old && old.width === d.width && old.height === d.height ? prev : { ...prev, [view]: d };
    });
  }, []);

  const startCalibrating = useCallback((view: ScanView) => {
    setError(null);
    setCalibrating((current) => (current === view ? null : view));
  }, []);

  const cancelCalibrating = useCallback(() => setCalibrating(null), []);

  /** Two clicks `measuredPx` apart (natural image pixels) on a feature `knownMm` long. */
  const completeCalibration = useCallback(
    async (view: ScanView, measuredPx: number, method: "two_point" | "assisted_detection" = "two_point") => {
      if (isReadOnly) return;
      const result = scaleFromTwoPoints(knownMm, measuredPx, method);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaving(true);
      const next: V1ScanCalibrations = { ...plan.payload.scan_calibration, ...local, [view]: result.calibration };
      try {
        const saved = await updatePlanPayload(plan.id, { scan_calibration: next });
        if (!saved.success) {
          setError(saved.error ?? "The scale could not be saved.");
          return;
        }
        setLocal(next);
        setCalibrating(null);
        setDetection(null);
        onScaleChanged?.();
        // The header and anything else drawn on the server reads the saved scale.
        router.refresh();
      } catch {
        setError("Could not reach the server.");
      } finally {
        setSaving(false);
      }
    },
    [isReadOnly, knownMm, local, onScaleChanged, plan.id, plan.payload.scan_calibration, router],
  );

  /** Look for the 25 mm marker on a scan. The result is a proposal the surgeon must confirm. */
  const findMarker = useCallback(
    async (view: ScanView) => {
      const src = scales[view].src;
      setCalibrating(null);
      setError(null);
      if (/\.(dcm|dcim)$/i.test(src.split("?")[0])) {
        setDetection({ view, status: "unavailable", message: "Automatic search is not available for DICOM files. Set the scale by clicking the two sides of the marker." });
        return;
      }
      setDetection({ view, status: "searching" });
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("load"));
          img.src = src;
        });
        const cap = 4000;
        const k = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * k));
        const h = Math.max(1, Math.round(img.naturalHeight * k));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h); // throws if the image is cross-origin without CORS
        const gray = new Uint8Array(w * h);
        for (let i = 0; i < gray.length; i++) gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
        const r = detectCalibrationMarker(gray, w, h);
        if (r.status === "found") {
          const c = r.candidate;
          setDetection({ view, status: "found", candidate: { ...c, cx: c.cx / k, cy: c.cy / k, diameterPx: Number((c.diameterPx / k).toFixed(2)) } });
        } else if (r.status === "ambiguous") {
          setDetection({ view, status: "ambiguous", message: "More than one round bright object looks like a marker. Set the scale by clicking the two sides of the marker." });
        } else {
          setDetection({ view, status: "none", message: "No marker was found on this scan. Set the scale by clicking the two sides of the marker." });
        }
      } catch {
        setDetection({ view, status: "unavailable", message: "This scan could not be searched here. Set the scale by clicking the two sides of the marker." });
      }
    },
    [scales],
  );

  const dismissDetection = useCallback(() => setDetection(null), []);

  /** The surgeon agrees the proposed circle is the marker: its diameter becomes the measured distance. */
  const confirmDetection = useCallback(async () => {
    if (detection?.status !== "found") return;
    await completeCalibration(detection.view, detection.candidate.diameterPx, "assisted_detection");
  }, [detection, completeCalibration]);

  return {
    detection,
    findMarker,
    dismissDetection,
    confirmDetection,
    scales,
    dims,
    reportDims,
    calibrating,
    startCalibrating,
    cancelCalibrating,
    completeCalibration,
    knownMm,
    setKnownMm,
    error,
    setError,
    saving,
  };
}

export type ScanCalibration = ReturnType<typeof useScanCalibration>;
