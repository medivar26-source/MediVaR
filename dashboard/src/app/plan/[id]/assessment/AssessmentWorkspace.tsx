"use client";

import { useState, useCallback } from "react";
import { fallbackNotice, resolveScan } from "@/lib/plan-scans";

import { SaveBadge } from "../components/PlanControls";
import { useSaveStatus } from "../components/planHooks";
import s from "../plan.module.css";
import { XRayCanvas } from "./XRayCanvas";
import { MeasurementPanel } from "./MeasurementPanel";
import { pxToMm } from "@/lib/data/calibration";
import { normalizeCalibration } from "@/lib/data/coordinates";

export type ViewMode = "FLAP" | "KLAT";

export type Point2D = { x: number; y: number };

export type LandmarkState = {
  // FLAP Landmarks
  hipCenter?: Point2D;
  kneeCenter?: Point2D;
  ankleCenter?: Point2D;
  femurDistalLateral?: Point2D;
  femurDistalMedial?: Point2D;
  tibiaProximalLateral?: Point2D;
  tibiaProximalMedial?: Point2D;
  femurCanalProximal?: Point2D;
  femurCanalDistal?: Point2D;
  
  // KLAT Landmarks
  tibiaPlateauAnterior?: Point2D;
  tibiaPlateauPosterior?: Point2D;
  tibiaShaftProximal?: Point2D;
  tibiaShaftDistal?: Point2D;
  femurAnteriorBoundary?: Point2D;
  femurPosteriorBoundary?: Point2D;
};

const DEFAULT_LANDMARKS: LandmarkState = {
  hipCenter: { x: 50, y: 10 },
  kneeCenter: { x: 50, y: 50 },
  ankleCenter: { x: 50, y: 90 },
  femurDistalLateral: { x: 45, y: 48 },
  femurDistalMedial: { x: 55, y: 48 },
  tibiaProximalLateral: { x: 45, y: 52 },
  tibiaProximalMedial: { x: 55, y: 52 },
  femurCanalProximal: { x: 50, y: 20 },
  femurCanalDistal: { x: 50, y: 40 },
  
  tibiaPlateauAnterior: { x: 30, y: 40 },
  tibiaPlateauPosterior: { x: 70, y: 40 },
  tibiaShaftProximal: { x: 50, y: 50 },
  tibiaShaftDistal: { x: 50, y: 80 },
  femurAnteriorBoundary: { x: 35, y: 30 },
  femurPosteriorBoundary: { x: 65, y: 30 },
};

import type { PlanDetail } from "@/lib/plan";

function normalizeLandmarks(raw?: Record<string, any>): LandmarkState {
  if (!raw || Object.keys(raw).length === 0) return DEFAULT_LANDMARKS;
  return {
    ...DEFAULT_LANDMARKS,
    ...raw,
    hipCenter: raw.hipCenter || raw.femoral_head_center || DEFAULT_LANDMARKS.hipCenter,
    kneeCenter: raw.kneeCenter || raw.femoral_knee_center || raw.tibial_knee_center || DEFAULT_LANDMARKS.kneeCenter,
    ankleCenter: raw.ankleCenter || raw.ankle_center || DEFAULT_LANDMARKS.ankleCenter,
  };
}

export function AssessmentWorkspace({ plan }: { plan: PlanDetail }) {
  const [viewMode, setViewMode] = useState<ViewMode>("FLAP");
  
  // If plan is locked, we read from lockedVersion. Otherwise draft payload or default.
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;
  const rawLandmarks = isReadOnly && plan.lockedVersion?.payload.assessment_landmarks 
    ? plan.lockedVersion.payload.assessment_landmarks 
    : plan.payload.assessment_landmarks;

  const [landmarks, setLandmarks] = useState<LandmarkState>(() => normalizeLandmarks(rawLandmarks));
  const [isAccepted, setIsAccepted] = useState(isReadOnly); // Automatically accept if locked
  const [flapDims, setFlapDims] = useState<{width: number, height: number} | null>(null);
  const [klatDims, setKlatDims] = useState<{width: number, height: number} | null>(null);

  const { status: saveStatus, save, retry } = useSaveStatus<LandmarkState>(
    plan.id,
    landmarks,
    rawLandmarks ? normalizeLandmarks(rawLandmarks) : null,
    isReadOnly,
  );

  const handleDimsLoaded = useCallback((mode: string, dims: { width: number; height: number }) => {
    if (mode === "FLAP") {
      setFlapDims(prev => prev?.width === dims.width && prev?.height === dims.height ? prev : dims);
    } else if (mode === "KLAT") {
      setKlatDims(prev => prev?.width === dims.width && prev?.height === dims.height ? prev : dims);
    }
  }, []);

  const imageMatch = plan.case?.imaging?.find(
    (img) => img.view.toLowerCase() === viewMode.toLowerCase()
  );
  const scan = resolveScan(imageMatch, viewMode);
  const currentImgSrc = scan.src;

  const handleLandmarkMove = (key: keyof LandmarkState, pos: Point2D) => {
    if (isReadOnly || isAccepted) return; // locked
    setLandmarks((prev) => ({ ...prev, [key]: pos }));
  };

  const handleReset = () => {
    if (isReadOnly) return;
    setIsAccepted(false);
    setLandmarks(DEFAULT_LANDMARKS);
  };

  const handleAccept = async (calculated?: import("@/lib/plan").V1Assessment) => {
    if (isReadOnly) return;
    setIsAccepted(true);

    // Compute Physical Planning Geometries
    const flapImg = plan.case?.imaging?.find(i => i.view.toLowerCase() === "flap" || i.view.toLowerCase() === "ap");
    const klatImg = plan.case?.imaging?.find(i => i.view.toLowerCase() === "klat");
    const flapCal = normalizeCalibration(flapImg?.calibration);
    const klatCal = normalizeCalibration(klatImg?.calibration);

    let patient_tibial_ml_mm, patient_tibial_ap_mm, patient_femoral_ml_mm, patient_femoral_ap_mm;

    if (flapDims && landmarks.tibiaProximalLateral && landmarks.tibiaProximalMedial) {
      const px = Math.abs(landmarks.tibiaProximalMedial.x - landmarks.tibiaProximalLateral.x) / 100 * flapDims.width;
      patient_tibial_ml_mm = pxToMm(px, flapCal);
    }
    if (klatDims && landmarks.tibiaPlateauAnterior && landmarks.tibiaPlateauPosterior) {
      const px = Math.abs(landmarks.tibiaPlateauPosterior.x - landmarks.tibiaPlateauAnterior.x) / 100 * klatDims.width;
      patient_tibial_ap_mm = pxToMm(px, klatCal);
    }
    if (flapDims && landmarks.femurDistalLateral && landmarks.femurDistalMedial) {
      const px = Math.abs(landmarks.femurDistalMedial.x - landmarks.femurDistalLateral.x) / 100 * flapDims.width;
      patient_femoral_ml_mm = pxToMm(px, flapCal);
    }
    if (klatDims && landmarks.femurAnteriorBoundary && landmarks.femurPosteriorBoundary) {
      const px = Math.abs(landmarks.femurPosteriorBoundary.x - landmarks.femurAnteriorBoundary.x) / 100 * klatDims.width;
      patient_femoral_ap_mm = pxToMm(px, klatCal);
    }

    const assessmentPayload = {
      ...calculated,
      ...(!Number.isNaN(patient_tibial_ml_mm) && patient_tibial_ml_mm !== undefined && { patient_tibial_ml_mm }),
      ...(!Number.isNaN(patient_tibial_ap_mm) && patient_tibial_ap_mm !== undefined && { patient_tibial_ap_mm }),
      ...(!Number.isNaN(patient_femoral_ml_mm) && patient_femoral_ml_mm !== undefined && { patient_femoral_ml_mm }),
      ...(!Number.isNaN(patient_femoral_ap_mm) && patient_femoral_ap_mm !== undefined && { patient_femoral_ap_mm }),
    };

    const ok = await save(
      {
        v1_assessment: assessmentPayload as import("@/lib/plan").V1Assessment,
        assessment_landmarks: {
          ...landmarks,
          femoral_head_center: landmarks.hipCenter,
          femoral_knee_center: landmarks.kneeCenter,
          tibial_knee_center: landmarks.kneeCenter,
          ankle_center: landmarks.ankleCenter,
        },
      },
      landmarks,
    );
    // Let the surgeon keep adjusting if the server did not accept the assessment.
    if (!ok) setIsAccepted(false);
  };

  return (
    <div className={s.body}>
      <div className={s.card}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setViewMode("FLAP")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "FLAP" ? "var(--brand)" : "var(--surface)",
              color: viewMode === "FLAP" ? "var(--on-brand)" : "var(--ink)",
              fontWeight: 600,
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            FLAP View (Full-Length AP)
          </button>
          <button
            onClick={() => setViewMode("KLAT")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "KLAT" ? "var(--brand)" : "var(--surface)",
              color: viewMode === "KLAT" ? "var(--on-brand)" : "var(--ink)",
              fontWeight: 600,
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            KLAT View (Localized Knee)
          </button>
          <div style={{ marginLeft: "auto", alignSelf: "center" }}>
            <SaveBadge status={saveStatus} onRetry={retry} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "700px" }}>
          {/* Main Imaging/Landmark Workspace */}
          <div style={{ flex: "2", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            {scan.isFallback && (
              <div
                role="status"
                style={{ position: "absolute", top: 10, right: 10, zIndex: 100, backgroundColor: "rgba(154,98,18,0.95)", color: "white", padding: "6px 12px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, maxWidth: "60%" }}
              >
                {fallbackNotice(viewMode)}
              </div>
            )}

             {plan.payload.workflow === "tkr" && (
               <div style={{ position: "absolute", top: 10, left: 10, zIndex: 100, backgroundColor: "rgba(220,38,38,0.9)", color: "white", padding: "6px 12px", borderRadius: "4px", fontSize: "0.875rem", fontWeight: "bold" }}>
                 DEMO / SYNTHETIC - Not for clinical use
               </div>
             )}
             <XRayCanvas 
                viewMode={viewMode} 
                landmarks={landmarks} 
                isAccepted={isAccepted}
                onLandmarkMove={handleLandmarkMove} 
                onDimsLoaded={handleDimsLoaded}
                src={currentImgSrc}
             />
          </div>

          {/* Measurement Panel */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1rem" }}>
             <MeasurementPanel 
                landmarks={landmarks} 
                isAccepted={isAccepted}
                onReset={handleReset}
                onAccept={handleAccept}
             />
          </div>
        </div>
      </div>
    </div>
  );
}
