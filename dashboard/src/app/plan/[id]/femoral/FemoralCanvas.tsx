"use client";

import { useState } from "react";
import type { Point2D } from "../assessment/AssessmentWorkspace";
import type { FemoralViewMode } from "./FemoralWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { getFemoralTemplate } from "@/lib/data/tkr_templates";
import type { V1FemoralComponent } from "@/lib/plan";

interface FemoralCanvasProps {
  viewMode: FemoralViewMode;
  femoralComponent: V1FemoralComponent;
  onPositionChange: (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => void;
  assessmentLandmarks: Record<string, Point2D>;
  isReadOnly?: boolean;
  src?: string;
}

export function FemoralCanvas({
  viewMode,
  femoralComponent,
  onPositionChange,
  assessmentLandmarks,
  isReadOnly = false,
  src,
}: FemoralCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ clientX: number; clientY: number } | null>(null);

  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getFemoralTemplate(femoralComponent.implant_size);

  // Position base around the distal femur center (around 46% Y in FLAP)
  const baseKnee = assessmentLandmarks.kneeCenter || { x: 50, y: 46 };

  // Offset in percent: 1 mm is approx 0.38% on a 1000px FLAP view (0.264 mm/px)
  const pxPerMm = 1 / 0.264; // ~3.788 px/mm
  const xOffsetPct = (femoralComponent.position_2d.x_offset_mm * pxPerMm) / 10;
  const yOffsetPct = (femoralComponent.position_2d.y_offset_mm * pxPerMm) / 10;

  // Center of template in percentage coordinates
  const templateCenterX = baseKnee.x + xOffsetPct;
  const templateCenterY = (viewMode === "FLAP" ? baseKnee.y - 2 : baseKnee.y - 4) + yOffsetPct;

  // Template visual size in percentage
  const templateWidthPct = (template.mlMm * pxPerMm) / 10;
  const templateHeightPct = (template.apMm * pxPerMm) / 10;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isReadOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ clientX: e.clientX, clientY: e.clientY });
  };

  const handlePointerMove = (stageElement: HTMLElement | null, e: React.PointerEvent) => {
    if (!isDragging || !dragStart || !stageElement || isReadOnly) return;

    const dx = e.clientX - dragStart.clientX;
    const dy = e.clientY - dragStart.clientY;

    const mmDx = Number((dx * 0.264).toFixed(1));
    const mmDy = Number((dy * 0.264).toFixed(1));

    if (Math.abs(mmDx) >= 0.2 || Math.abs(mmDy) >= 0.2) {
      onPositionChange({
        x_offset_mm: Number((femoralComponent.position_2d.x_offset_mm + mmDx).toFixed(1)),
        y_offset_mm: Number((femoralComponent.position_2d.y_offset_mm + mmDy).toFixed(1)),
        rotation_deg: femoralComponent.position_2d.rotation_deg,
      });
      setDragStart({ clientX: e.clientX, clientY: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
      setDragStart(null);
    }
  };

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {({ zoom }) => (
        <>
          {/* Read-Only Assessment Landmarks */}
          {Object.entries(assessmentLandmarks).map(([key, pos]) => {
            if (!pos) return null;
            return (
              <div
                key={`landmark-${key}`}
                style={{
                  position: "absolute",
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#f59e0b",
                  border: "2px solid white",
                  borderRadius: "50%",
                  transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
                title={key}
              />
            );
          })}

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

          {/* 2D CAD Femoral Template Overlay */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={(e) => handlePointerMove(e.currentTarget.parentElement, e)}
            onPointerUp={handlePointerUp}
            style={{
              position: "absolute",
              left: `${templateCenterX}%`,
              top: `${templateCenterY}%`,
              width: `${viewMode === "FLAP" ? templateWidthPct : templateHeightPct}%`,
              height: `${viewMode === "FLAP" ? templateHeightPct * 0.45 : templateHeightPct * 0.9}%`,
              transform: `translate(-50%, -50%) rotate(${femoralComponent.position_2d.rotation_deg}deg)`,
              border: "2px solid #0284c7",
              background: "rgba(2, 132, 199, 0.18)",
              borderRadius: viewMode === "FLAP" ? "12px 12px 6px 6px" : "16px 4px 12px 12px",
              boxShadow: "0 0 8px rgba(2, 132, 199, 0.5)",
              cursor: isReadOnly ? "default" : isDragging ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
              zIndex: 30,
            }}
          >
            {/* Center Translation Handle */}
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#0284c7",
                border: "2px solid white",
                boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
                transform: `scale(${1 / zoom})`,
              }}
            />

            {/* Template Dimension Label HUD */}
            <div
              style={{
                position: "absolute",
                top: "-24px",
                padding: "2px 6px",
                background: "rgba(15, 23, 42, 0.85)",
                color: "white",
                fontSize: "0.6875rem",
                fontWeight: 700,
                borderRadius: "3px",
                whiteSpace: "nowrap",
                transform: `scale(${1 / zoom})`,
                pointerEvents: "none",
              }}
            >
              Femoral Size {template.size} ({template.apMm} × {template.mlMm} mm)
            </div>
          </div>
        </>
      )}
    </ScanViewport>
  );
}
