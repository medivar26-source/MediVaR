"use client";

import { useState } from "react";
import type { LandmarkState, Point2D, ViewMode } from "./AssessmentWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { Loupe } from "../components/Loupe";
import { CalibrationLayer, ScaleBar, type ScaleTools } from "../components/FitMarkerLayer";
import React, { useEffect } from "react";
import { LANDMARK_INFO, LANDMARK_ORDER } from "@/lib/data/landmark_guide";

const Reporter = ({ naturalWidth, naturalHeight, viewMode, onDimsLoaded }: any) => {
  useEffect(() => {
    if (onDimsLoaded && naturalWidth && naturalHeight) {
      onDimsLoaded(viewMode, { width: naturalWidth, height: naturalHeight });
    }
  }, [naturalWidth, naturalHeight, viewMode, onDimsLoaded]);
  return null;
};

type Key = keyof LandmarkState;

interface XRayCanvasProps {
  viewMode: ViewMode;
  landmarks: LandmarkState;
  isAccepted: boolean;
  /** The point being placed: a click anywhere on the scan puts it there. */
  placing: Key | null;
  onPlace: (key: Key, pos: Point2D) => void;
  onCancelPlace: () => void;
  onLandmarkMove: (key: keyof LandmarkState, pos: Point2D) => void;
  onDimsLoaded?: (viewMode: ViewMode, dims: { width: number; height: number }) => void;
  src?: string;
  mmPerPx: number;
  scale: ScaleTools;
}

export function XRayCanvas({ viewMode, landmarks, isAccepted, placing, onPlace, onCancelPlace, onLandmarkMove, onDimsLoaded, src, mmPerPx, scale }: XRayCanvasProps) {
  const [draggingKey, setDraggingKey] = useState<keyof LandmarkState | null>(null);
  const [hoveredKey, setHoveredKey] = useState<keyof LandmarkState | null>(null);

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

  const currentLandmarks = (LANDMARK_ORDER as Key[]).filter((k) => LANDMARK_INFO[k].view === viewMode);
  const placingHere = placing && LANDMARK_INFO[placing].view === viewMode && !isAccepted ? placing : null;
  const placedCount = (LANDMARK_ORDER as Key[]).filter((k) => landmarks[k]).length;

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {({ zoom, stageRef, naturalWidth, naturalHeight, fitScale }) => {
        return (
        <>
          <Reporter 
            naturalWidth={naturalWidth} 
            naturalHeight={naturalHeight} 
            viewMode={viewMode} 
            onDimsLoaded={onDimsLoaded} 
          />
          {viewMode === "FLAP" ? renderFlapLines() : renderKlatLines()}
          <Loupe
            active={Boolean(placingHere) || draggingKey !== null}
            stageRef={stageRef}
            src={imgSrc}
            naturalWidth={naturalWidth}
            naturalHeight={naturalHeight}
            fitScale={fitScale}
            zoom={zoom}
          />

          <svg
            viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
          >
            <ScaleBar
              widthPx={naturalWidth}
              heightPx={naturalHeight}
              mmPerPx={mmPerPx}
              calibrated={scale.calibrated}
              fontPx={13 / (fitScale * zoom)}
            />
          </svg>

          <CalibrationLayer
            active={scale.calibrating === viewMode}
            view={viewMode}
            zoom={zoom}
            stageRef={stageRef}
            widthPx={naturalWidth}
            heightPx={naturalHeight}
            knownMm={scale.knownMm}
            onMeasured={scale.onMeasured}
            onCancel={scale.onCancel}
            candidate={scale.candidate}
          />

          {placingHere && (
            <>
              <div
                data-landmark="placing"
                onClick={(e) => {
                  const rect = stageRef.current?.getBoundingClientRect();
                  if (!rect || rect.width <= 0 || rect.height <= 0) return;
                  onPlace(placingHere, {
                    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
                    y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
                  });
                }}
                style={{ position: "absolute", inset: 0, zIndex: 5, cursor: "crosshair" }}
              />
              <div
                role="status"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 10,
                  transform: `translateX(-50%) scale(${1 / zoom})`,
                  transformOrigin: "top center",
                  zIndex: 70,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.92)",
                  border: `1px solid ${LANDMARK_INFO[placingHere].color}`,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  width: "max-content",
                  maxWidth: 420,
                }}
              >
                <span>
                  Point {placedCount + (landmarks[placingHere] ? 0 : 1)} of {LANDMARK_ORDER.length}: click the {LANDMARK_INFO[placingHere].name.toLowerCase()}.
                </span>
                <button
                  type="button"
                  onClick={onCancelPlace}
                  style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}
                >
                  Stop
                </button>
              </div>
            </>
          )}

          {currentLandmarks.map((key) => {
            const pos = landmarks[key as keyof LandmarkState];
            if (!pos) return null;
            const info = LANDMARK_INFO[key];
            const color = info?.color ?? "#e2e8f0";
            const isBeingDragged = draggingKey === key;
            // Names are shown for the point under the pointer, so neighbouring points never cover each other.
            const showTag = isBeingDragged || hoveredKey === key;

            return (
              <div
                key={key}
                data-landmark={key}
                role="slider"
                aria-label={info?.name ?? key}
                aria-valuetext={`${Math.round(pos.x)}% across, ${Math.round(pos.y)}% down`}
                onPointerDown={(e) => handlePointerDown(key as keyof LandmarkState, e)}
                onPointerMove={(e) => handlePointerMove(key as keyof LandmarkState, stageRef.current, e)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerEnter={() => setHoveredKey(key)}
                onPointerLeave={() => setHoveredKey((k) => (k === key ? null : k))}
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
                  zIndex: isBeingDragged ? 30 : showTag ? 20 : 10,
                  touchAction: "none",
                  // While a point is being placed, a click always places it, even on top of another dot.
                  pointerEvents: placingHere ? "none" : "auto",
                }}
                title={info ? `${info.name}. ${info.where}` : key}
              >
                {info && showTag && (
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 20,
                      transform: "translateX(-50%)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "rgba(15,23,42,0.85)",
                      color,
                      fontSize: 11,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      pointerEvents: "none",
                    }}
                  >
                    {info.tag}
                  </span>
                )}
              </div>
            );
          })}
        </>
        );
      }}
    </ScanViewport>
  );
}
