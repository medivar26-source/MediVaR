"use client";

import React from "react";
import type { FemoralViewMode } from "./FemoralWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { CalibrationLayer, DimsReporter, EdgeGapOverlay, FitMarkerLayer, ScaleBar, type ScaleTools } from "../components/FitMarkerLayer";
import type { FemoralFitResult } from "@/lib/data/tkr_templates";
import { getFemoralImplant } from "@/lib/data/implant_templates";
import type { BoneModel, MarkerKey, ScanView } from "@/lib/data/fit_markers";
import type { V1FemoralComponent, V1FitMarkers } from "@/lib/plan";
import { ImplantOverlay } from "../components/ImplantOverlay";

interface FemoralCanvasProps {
  viewMode: FemoralViewMode;
  femoralComponent: V1FemoralComponent;
  onMove: (next: { x_offset_mm?: number; y_offset_mm?: number; level_offset_mm?: number }) => void;
  /** In-plane rotation of the AP overlay (V1: minor 2-D alignment). */
  onRotate: (deg: number) => void;
  bone: BoneModel;
  markers: V1FitMarkers;
  fit?: FemoralFitResult;
  placing: MarkerKey | null;
  onMoveMarker: (key: MarkerKey, point: { x: number; y: number }) => void;
  onPlaceMarker: (key: MarkerKey, point: { x: number; y: number }) => void;
  onCancelPlace: () => void;
  onDimsLoaded: (view: ScanView, dims: { width: number; height: number }) => void;
  isReadOnly?: boolean;
  src?: string;
  mmPerPx: number;
  scale: ScaleTools;
}

const TONE_FILL = { pass: "#3b82f6", warn: "#f59e0b", fail: "#ef4444" } as const;

/**
 * The femoral component on the scan, placed against the bone edges the surgeon marked.
 *
 * It can be dragged anywhere. Sideways is the direction this scan measures (medial/lateral on the AP
 * view, anterior/posterior on the lateral view); up and down only changes the height it is drawn at,
 * which the fit does not depend on. In the lateral view the outline is stretched onto exactly the
 * extent the fit is measured on, so the edge of what is drawn is the edge of what is measured.
 */
export function FemoralCanvas({
  viewMode,
  femoralComponent,
  onMove,
  onRotate,
  bone,
  markers,
  fit,
  placing,
  onMoveMarker,
  onPlaceMarker,
  onCancelPlace,
  onDimsLoaded,
  isReadOnly = false,
  src,
  mmPerPx,
  scale,
}: FemoralCanvasProps) {
  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getFemoralImplant(femoralComponent.implant_size);
  const pos = femoralComponent.position_2d;
  const level = femoralComponent.level_offset_mm ?? 0;
  const origin = viewMode === "FLAP" ? bone.flapOrigin : bone.klatOrigin;

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {(viewport) => {
        const { naturalWidth, naturalHeight, zoom, fitScale, stageRef } = viewport;
        const fontPx = 13 / (fitScale * zoom);
        const colour = TONE_FILL[fit?.worstTone ?? "pass"];

        const sides = fit && {
          medial: { over: fit.medialOverhangMm, tone: "info" as const },
          lateral: { over: fit.lateralOverhangMm, tone: "info" as const },
          anterior: { over: fit.anteriorProudMm, tone: fit.notchTone },
          posterior: { over: fit.posteriorOverhangMm, tone: "info" as const },
        };

        return (
          <>
            <DimsReporter view={viewMode} width={naturalWidth} height={naturalHeight} onReport={onDimsLoaded} />

            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
              preserveAspectRatio="none"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
            >
              {fit && sides && bone.complete && (
                <EdgeGapOverlay
                  view={viewMode}
                  bone={bone}
                  markers={markers}
                  extents={fit.extents}
                  sides={sides}
                  widthPx={naturalWidth}
                  heightPx={naturalHeight}
                  mmPerPx={mmPerPx}
                  fontPx={fontPx}
                />
              )}
              <ScaleBar
                widthPx={naturalWidth}
                heightPx={naturalHeight}
                mmPerPx={mmPerPx}
                calibrated={scale.calibrated}
                fontPx={fontPx}
              />
            </svg>

            <FitMarkerLayer
              kind="femoral"
              view={viewMode}
              markers={markers}
              placing={placing}
              readOnly={isReadOnly}
              zoom={zoom}
              stageRef={stageRef}
              onMove={onMoveMarker}
              onPlace={onPlaceMarker}
              onCancelPlace={onCancelPlace}
              loupe={{ src: imgSrc, naturalWidth, naturalHeight, fitScale }}
            />

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

            {!origin && !placing && (
              <div
                role="status"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                  zIndex: 45,
                  maxWidth: 340,
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid #facc15",
                  color: "#fff",
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                {viewMode === "FLAP"
                  ? "Mark the medial and lateral edges of the distal femur on this scan to see the component against the bone."
                  : "Mark the anterior and posterior edges of the distal femur on this scan to see the component against the bone."}
              </div>
            )}

            {origin && (
              <ImplantOverlay
                template={template}
                view={viewMode}
                viewport={viewport}
                origin={origin}
                mmPerPx={mmPerPx}
                anteriorImageSign={bone.anteriorImageSign}
                position={pos}
                levelOffsetMm={level}
                readOnly={isReadOnly}
                busy={Boolean(placing) || Boolean(scale.calibrating)}
                label={`Femoral Size ${template.size}`}
                verdictColour={colour}
                onMove={onMove}
                onRotate={onRotate}
              />
            )}

          </>
        );
      }}
    </ScanViewport>
  );
}
