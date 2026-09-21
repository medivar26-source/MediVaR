"use client";

import { useState } from "react";
import type { Point2D } from "../assessment/AssessmentWorkspace";
import type { TibialViewMode } from "./TibialWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { getTibialTemplate } from "@/lib/data/tkr_templates";
import type { V1TibialComponent } from "@/lib/plan";

interface TibialCanvasProps {
  viewMode: TibialViewMode;
  tibialComponent: V1TibialComponent;
  onPositionChange: (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => void;
  assessmentLandmarks: Record<string, Point2D>;
  isReadOnly?: boolean;
  src?: string;
}

export function TibialCanvas({
  viewMode,
  tibialComponent,
  onPositionChange,
  assessmentLandmarks,
  isReadOnly = false,
  src,
}: TibialCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ clientX: number; clientY: number } | null>(null);

  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getTibialTemplate(tibialComponent.implant_size);

  // Position base around the knee joint center or standard proximal tibia height (52% Y in FLAP)
  const baseKnee = assessmentLandmarks.kneeCenter || { x: 50, y: 52 };

  // Offset in percent: 1 mm is approx 0.38% on a 1000px FLAP view (0.264 mm/px)
  const pxPerMm = 1 / 0.264; // ~3.788 px/mm
  // Assuming a 1000px nominal canvas for relative positioning
  const xOffsetPct = (tibialComponent.position_2d.x_offset_mm * pxPerMm) / 10;
  const yOffsetPct = (tibialComponent.position_2d.y_offset_mm * pxPerMm) / 10;

  // Center of template in percentage coordinates
  const templateCenterX = baseKnee.x + xOffsetPct;
  const templateCenterY = baseKnee.y + yOffsetPct;

  // Template visual size in percentage (scaled to view)
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

    // Convert screen px displacement to mm
    const mmDx = Number((dx * 0.264).toFixed(1));
    const mmDy = Number((dy * 0.264).toFixed(1));

    if (Math.abs(mmDx) >= 0.2 || Math.abs(mmDy) >= 0.2) {
      onPositionChange({
        x_offset_mm: Number((tibialComponent.position_2d.x_offset_mm + mmDx).toFixed(1)),
        y_offset_mm: Number((tibialComponent.position_2d.y_offset_mm + mmDy).toFixed(1)),
        rotation_deg: tibialComponent.position_2d.rotation_deg,
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
                  backgroundColor: "#3b82f6",
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

          {/* 2D CAD Template Overlay */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={(e) => handlePointerMove(e.currentTarget.parentElement, e)}
            onPointerUp={handlePointerUp}
            style={{
              position: "absolute",
              left: `${templateCenterX}%`,
              top: `${templateCenterY}%`,
              width: `${viewMode === "FLAP" ? templateWidthPct : templateHeightPct}%`,
              height: `${viewMode === "FLAP" ? templateHeightPct * 0.35 : templateHeightPct}%`,
              transform: `translate(-50%, -50%) rotate(${tibialComponent.position_2d.rotation_deg}deg)`,
              border: "2px solid #0284c7",
              background: "rgba(2, 132, 199, 0.18)",
              borderRadius: viewMode === "FLAP" ? "4px 4px 12px 12px" : "6px",
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
              Tibial Size {template.size} ({template.apMm} × {template.mlMm} mm)
            </div>
          </div>
        </>
      )}
    </ScanViewport>
  );
}
