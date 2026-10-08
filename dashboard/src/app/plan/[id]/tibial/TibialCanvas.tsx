"use client";

import React from "react";
import type { TibialViewMode } from "./TibialWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { CalibrationLayer, DimsReporter, EdgeGapOverlay, FitMarkerLayer, ScaleBar, type ScaleTools } from "../components/FitMarkerLayer";
import type { TibialFitResult } from "@/lib/data/tkr_templates";
import { getTibialImplant } from "@/lib/data/implant_templates";
import type { BoneModel, MarkerKey, ScanView } from "@/lib/data/fit_markers";
import type { V1FitMarkers, V1TibialComponent } from "@/lib/plan";
import { ImplantOverlay } from "../components/ImplantOverlay";

interface TibialCanvasProps {
  viewMode: TibialViewMode;
  tibialComponent: V1TibialComponent;
  onMove: (next: { x_offset_mm?: number; y_offset_mm?: number; level_offset_mm?: number }) => void;
  /** In-plane rotation of the AP overlay (V1: align with the MPTA axis line). */
  onRotate: (deg: number) => void;
  bone: BoneModel;
  markers: V1FitMarkers;
  fit?: TibialFitResult;
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

const TONE_FILL = { pass: "#10b981", warn: "#f59e0b", fail: "#ef4444" } as const;

/**
 * The tibial tray on the scan, placed against the bone edges the surgeon marked.
 *
 * It can be dragged anywhere. Sideways is the direction this scan measures: medial/lateral on the AP
 * view, anterior/posterior on the lateral view. Up and down only changes the height it is drawn at,
 * which the fit does not depend on. The tray is outlined in the colour of the verdict.
 */
export function TibialCanvas({
  viewMode,
  tibialComponent,
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
}: TibialCanvasProps) {
  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getTibialImplant(tibialComponent.implant_size);
  const pos = tibialComponent.position_2d;
  const level = tibialComponent.level_offset_mm ?? 0;
  const origin = viewMode === "FLAP" ? bone.flapOrigin : bone.klatOrigin;

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`}>
      {(viewport) => {
        const { naturalWidth, naturalHeight, zoom, fitScale, stageRef } = viewport;

        const tone = fit?.worstTone;
        const stroke = TONE_FILL[tone ?? "pass"];
        const fontPx = 13 / (fitScale * zoom);

        const sideVerdicts = fit && {
          medial: { over: fit.medialOverhangMm, tone: fit.medialTone },
          lateral: { over: fit.lateralOverhangMm, tone: fit.lateralTone },
          anterior: { over: fit.anteriorOverhangMm, tone: fit.anteriorTone },
          posterior: { over: fit.posteriorOverhangMm, tone: fit.posteriorTone },
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
              {/* The cut level, joining the two edges marked on this scan. */}
              {origin && markers && (
                <line
                  x1={((viewMode === "FLAP" ? markers.medial?.x : markers.anterior?.x) ?? 0) / 100 * naturalWidth}
                  y1={origin.y}
                  x2={((viewMode === "FLAP" ? markers.lateral?.x : markers.posterior?.x) ?? 0) / 100 * naturalWidth}
                  y2={origin.y}
                  stroke="#facc15"
                  strokeWidth={1.2 / (fitScale * zoom)}
                  strokeDasharray={`${6 / (fitScale * zoom)},${4 / (fitScale * zoom)}`}
                  opacity={0.85}
                />
              )}

              {fit && sideVerdicts && bone.complete && (
                <EdgeGapOverlay
                  view={viewMode}
                  bone={bone}
                  markers={markers}
                  extents={fit.extents}
                  sides={sideVerdicts}
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
              kind="tibial"
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
                  ? "Mark the medial and lateral edges of the tibial plateau on this scan to see the tray against the bone."
                  : "Mark the anterior and posterior edges of the tibial plateau on this scan to see the tray against the bone."}
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
                label={`Tibial Size ${template.size}`}
                verdictColour={stroke}
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
