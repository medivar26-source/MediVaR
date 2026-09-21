"use client";

import { useState } from "react";

import { updatePlanPayload } from "@/app/actions";
import s from "../plan.module.css";
import { XRayCanvas } from "./XRayCanvas";
import { MeasurementPanel } from "./MeasurementPanel";

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

  const imageMatch = plan.case?.imaging?.find(
    (img) => img.view.toLowerCase() === viewMode.toLowerCase()
  );
  const currentImgSrc = imageMatch?.src || (viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg");

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
    try {
      await updatePlanPayload(plan.id, {
        v1_assessment: calculated,
        assessment_landmarks: {
          ...landmarks,
          femoral_head_center: landmarks.hipCenter,
          femoral_knee_center: landmarks.kneeCenter,
          tibial_knee_center: landmarks.kneeCenter,
          ankle_center: landmarks.ankleCenter,
        },
      });
    } catch {
      // Best-effort local persistence if offline
    }
  };

  return (
    <div className={s.body}>
      <div className={s.card}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setViewMode("FLAP")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "FLAP" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "FLAP" ? "white" : "inherit",
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
              background: viewMode === "KLAT" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "KLAT" ? "white" : "inherit",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            KLAT View (Localized Knee)
          </button>
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "700px" }}>
          {/* Main Imaging/Landmark Workspace */}
          <div style={{ flex: "2", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>

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
