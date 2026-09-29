"use client";

import React, { useState, useRef } from "react";
import type { Point2D } from "../assessment/AssessmentWorkspace";
import type { FemoralViewMode } from "./FemoralWorkspace";
import { ScanViewport, type ViewportContext } from "../components/ScanViewport";
import { getFemoralTemplate } from "@/lib/data/tkr_templates";
import { FEMORAL_GEOMETRY_CATALOG } from "@/lib/data/femoral_geometry";
import type { V1FemoralComponent, V1Calibration } from "@/lib/plan";
import { DEFAULT_CALIBRATION } from "@/lib/data/calibration";
import { screenDeltaToPhysicalMm } from "@/lib/data/coordinates";

interface FemoralCanvasProps {
  viewMode: FemoralViewMode;
  femoralComponent: V1FemoralComponent;
  onPositionChange: (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => void;
  assessmentLandmarks: Record<string, Point2D>;
  isReadOnly?: boolean;
  src?: string;
  calibration?: V1Calibration;
}

export function FemoralCanvas({
  viewMode,
  femoralComponent,
  onPositionChange,
  assessmentLandmarks,
  isReadOnly = false,
  src,
  calibration = DEFAULT_CALIBRATION,
}: FemoralCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getFemoralTemplate(femoralComponent.implant_size);
  const geom = FEMORAL_GEOMETRY_CATALOG[template.size] ?? FEMORAL_GEOMETRY_CATALOG[4];

  // Clinical physical calibration scale
  const mmPerPx = calibration?.mm_per_px > 0 ? calibration.mm_per_px : DEFAULT_CALIBRATION.mm_per_px;
  const pxPerMm = 1 / mmPerPx;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
  };

  const handlePointerMove = (viewport: ViewportContext, e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || isReadOnly) return;

    const screenDelta = {
      x: e.clientX - dragStartRef.current.clientX,
      y: e.clientY - dragStartRef.current.clientY,
    };

    // Canonical screen delta -> physical mm transformation
    const { x: dxMm, y: dyMm } = screenDeltaToPhysicalMm(screenDelta, viewport, mmPerPx);

    if (Math.abs(dxMm) >= 0.1 || Math.abs(dyMm) >= 0.1) {
      onPositionChange({
        x_offset_mm: Number((femoralComponent.position_2d.x_offset_mm + dxMm).toFixed(1)),
        y_offset_mm: Number((femoralComponent.position_2d.y_offset_mm + dyMm).toFixed(1)),
        rotation_deg: femoralComponent.position_2d.rotation_deg,
      });
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture already released
      }
      setIsDragging(false);
      dragStartRef.current = null;
    }
  };

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {(viewport) => {
        const { naturalWidth, naturalHeight, zoom } = viewport;

        // Position base around the knee joint center
        const baseKnee = assessmentLandmarks.kneeCenter || { x: 50, y: 52 };
        const kneeX_img = (baseKnee.x / 100) * naturalWidth;
        const kneeY_img = (baseKnee.y / 100) * naturalHeight;

        // Origin in image pixels: distal condyles sit directly against joint line
        const centerX_img = kneeX_img + femoralComponent.position_2d.x_offset_mm * pxPerMm;
        const centerY_img = kneeY_img + femoralComponent.position_2d.y_offset_mm * pxPerMm - (viewMode === "FLAP" ? 26 * pxPerMm : 4 * pxPerMm);

        const currentPolygon = viewMode === "FLAP" ? geom.flapPolygon : geom.klatPolygon;

        return (
          <>
            {/* Anterior Condylar Flush Reference Line on KLAT */}
            {viewMode === "KLAT" && (
              <div
                style={{
                  position: "absolute",
                  left: "35%",
                  top: "20%",
                  width: "2px",
                  height: "35%",
                  background: "#10b981",
                  boxShadow: "0 0 4px #10b981",
                  pointerEvents: "none",
                  opacity: 0.7,
                }}
                title="Anterior condylar cortex flush reference line"
              >
                <span
                  style={{
                    position: "absolute",
                    top: "-18px",
                    left: "-25px",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#10b981",
                    whiteSpace: "nowrap",
                    transform: `scale(${1 / zoom})`,
                  }}
                >
                  Anterior Cortex Line
                </span>
              </div>
            )}

            {/* Canonical SVG Overlay strictly aligned with Natural Image Raster */}
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              <defs>
                <radialGradient id="femoralGlow" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                  <stop offset="60%" stopColor="rgba(59, 130, 246, 0.2)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.35)" />
                </radialGradient>
                <filter id="femoralShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.45" />
                </filter>
              </defs>

              {/* Implant Component Group placed in Image Space, scaled strictly by pxPerMm */}
              <g
                transform={`translate(${centerX_img}, ${centerY_img}) rotate(${femoralComponent.position_2d.rotation_deg}) scale(${pxPerMm})`}
                filter="url(#femoralShadow)"
              >
                {/* Anatomical Femoral Component Silhouette mathematically matching fit calculations */}
                <polygon
                  points={currentPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="url(#femoralGlow)"
                  stroke="#3b82f6"
                  strokeWidth={1.5 / pxPerMm}
                  strokeLinejoin="round"
                />

                {/* Translation handle target */}
                <circle
                  cx={0}
                  cy={0}
                  r={3.5}
                  fill="#ffffff"
                  stroke="#3b82f6"
                  strokeWidth={1.2 / pxPerMm}
                />
              </g>
            </svg>

            {/* Interactive Drag & Position Target Overlay (rendered in stage coords) */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={(e) => handlePointerMove(viewport, e)}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: "absolute",
                left: `${(centerX_img / naturalWidth) * 100}%`,
                top: `${(centerY_img / naturalHeight) * 100}%`,
                width: `${(template.mlMm * pxPerMm * viewport.fitScale)}px`,
                height: `${(template.apMm * pxPerMm * viewport.fitScale)}px`,
                transform: `translate(-50%, -50%) rotate(${femoralComponent.position_2d.rotation_deg}deg)`,
                cursor: isReadOnly ? "default" : isDragging ? "grabbing" : "grab",
                zIndex: 30,
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Leader Line & HUD Tag: "Femoral Size 4" matching clinical reference */}
              <div
                style={{
                  position: "absolute",
                  top: "40%",
                  left: "-12px",
                  transform: `translate(-100%, -50%) scale(${1 / zoom})`,
                  transformOrigin: "right center",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  zIndex: 40,
                }}
              >
                <div
                  style={{
                    background: "#0f172a",
                    border: "1.5px solid #3b82f6",
                    color: "white",
                    padding: "6px 12px",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.6)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Femoral Size {template.size}
                </div>
                <div style={{ width: "24px", height: "2px", background: "#3b82f6" }} />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                    marginLeft: "-4px",
                  }}
                />
              </div>
            </div>
          </>
        );
      }}
    </ScanViewport>
  );
}
