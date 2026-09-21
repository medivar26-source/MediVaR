"use client";

import { useState } from "react";
import type { LandmarkState, Point2D, ViewMode } from "./AssessmentWorkspace";
import { ScanViewport } from "../components/ScanViewport";

interface XRayCanvasProps {
  viewMode: ViewMode;
  landmarks: LandmarkState;
  isAccepted: boolean;
  onLandmarkMove: (key: keyof LandmarkState, pos: Point2D) => void;
  src?: string;
}

const LANDMARK_COLORS: Record<string, string> = {
  // FLAP
  hipCenter: "#ef4444", 
  kneeCenter: "#3b82f6", 
  ankleCenter: "#10b981", 
  femurDistalLateral: "#f59e0b", 
  femurDistalMedial: "#f59e0b",
  tibiaProximalLateral: "#8b5cf6", 
  tibiaProximalMedial: "#8b5cf6",
  femurCanalProximal: "#ec4899",
  femurCanalDistal: "#ec4899",
  
  // KLAT
  tibiaPlateauAnterior: "#06b6d4",
  tibiaPlateauPosterior: "#06b6d4",
  tibiaShaftProximal: "#8b5cf6",
  tibiaShaftDistal: "#8b5cf6"
};

export function XRayCanvas({ viewMode, landmarks, isAccepted, onLandmarkMove, src }: XRayCanvasProps) {
  const [draggingKey, setDraggingKey] = useState<keyof LandmarkState | null>(null);

  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const handlePointerDown = (key: keyof LandmarkState, e: React.PointerEvent) => {
    if (isAccepted) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingKey(key);
  };

  const handlePointerMove = (key: keyof LandmarkState, stageElement: HTMLElement | null, e: React.PointerEvent) => {
    if (draggingKey !== key || !stageElement || isAccepted) return;

    const rect = stageElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    onLandmarkMove(key, { x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingKey) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setDraggingKey(null);
    }
  };

  const renderFlapLines = () => {
    const { 
      hipCenter, kneeCenter, ankleCenter, 
      femurDistalMedial, femurDistalLateral, 
      tibiaProximalMedial, tibiaProximalLateral,
      femurCanalProximal, femurCanalDistal
    } = landmarks;

    return (
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {hipCenter && ankleCenter && (
          <line x1={`${hipCenter.x}%`} y1={`${hipCenter.y}%`} x2={`${ankleCenter.x}%`} y2={`${ankleCenter.y}%`} stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        )}
        {hipCenter && kneeCenter && (
          <line x1={`${hipCenter.x}%`} y1={`${hipCenter.y}%`} x2={`${kneeCenter.x}%`} y2={`${kneeCenter.y}%`} stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
        {kneeCenter && ankleCenter && (
          <line x1={`${kneeCenter.x}%`} y1={`${kneeCenter.y}%`} x2={`${ankleCenter.x}%`} y2={`${ankleCenter.y}%`} stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
        {femurDistalLateral && femurDistalMedial && (
          <line x1={`${femurDistalLateral.x}%`} y1={`${femurDistalLateral.y}%`} x2={`${femurDistalMedial.x}%`} y2={`${femurDistalMedial.y}%`} stroke="#f59e0b" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
        {tibiaProximalLateral && tibiaProximalMedial && (
          <line x1={`${tibiaProximalLateral.x}%`} y1={`${tibiaProximalLateral.y}%`} x2={`${tibiaProximalMedial.x}%`} y2={`${tibiaProximalMedial.y}%`} stroke="#8b5cf6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
        {femurCanalProximal && femurCanalDistal && (
          <line x1={`${femurCanalProximal.x}%`} y1={`${femurCanalProximal.y}%`} x2={`${femurCanalDistal.x}%`} y2={`${femurCanalDistal.y}%`} stroke="#ec4899" strokeWidth="2" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    );
  };

  const renderKlatLines = () => {
    const { tibiaPlateauAnterior, tibiaPlateauPosterior, tibiaShaftProximal, tibiaShaftDistal } = landmarks;

    return (
      <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
        {tibiaPlateauAnterior && tibiaPlateauPosterior && (
          <line x1={`${tibiaPlateauAnterior.x}%`} y1={`${tibiaPlateauAnterior.y}%`} x2={`${tibiaPlateauPosterior.x}%`} y2={`${tibiaPlateauPosterior.y}%`} stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
        {tibiaShaftProximal && tibiaShaftDistal && (
          <line x1={`${tibiaShaftProximal.x}%`} y1={`${tibiaShaftProximal.y}%`} x2={`${tibiaShaftDistal.x}%`} y2={`${tibiaShaftDistal.y}%`} stroke="#8b5cf6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
    );
  };

  const currentLandmarks = viewMode === "FLAP" ? [
    "hipCenter", "kneeCenter", "ankleCenter", 
    "femurDistalLateral", "femurDistalMedial", 
    "tibiaProximalLateral", "tibiaProximalMedial",
    "femurCanalProximal", "femurCanalDistal"
  ] : [
    "tibiaPlateauAnterior", "tibiaPlateauPosterior", 
    "tibiaShaftProximal", "tibiaShaftDistal"
  ];

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {({ zoom, stageRef }) => (
        <>
          {viewMode === "FLAP" ? renderFlapLines() : renderKlatLines()}

          {currentLandmarks.map((key) => {
            const pos = landmarks[key as keyof LandmarkState];
            if (!pos) return null;
            const color = LANDMARK_COLORS[key] || "#fff";
            const isBeingDragged = draggingKey === key;

            return (
              <div
                key={key}
                data-landmark={key}
                onPointerDown={(e) => handlePointerDown(key as keyof LandmarkState, e)}
                onPointerMove={(e) => handlePointerMove(key as keyof LandmarkState, stageRef.current, e)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: "16px",
                  height: "16px",
                  backgroundColor: color,
                  border: "2px solid white",
                  borderRadius: "50%",
                  transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  cursor: isAccepted ? "not-allowed" : isBeingDragged ? "grabbing" : "grab",
                  boxShadow: isBeingDragged
                    ? "0 0 0 4px rgba(255, 255, 255, 0.4), 0 0 8px rgba(0, 0, 0, 0.8)"
                    : "0 0 4px rgba(0,0,0,0.7)",
                  zIndex: isBeingDragged ? 30 : 10,
                  touchAction: "none",
                }}
                title={`${key} (${Math.round(pos.x)}%, ${Math.round(pos.y)}%)`}
              />
            );
          })}
        </>
      )}
    </ScanViewport>
  );
}
