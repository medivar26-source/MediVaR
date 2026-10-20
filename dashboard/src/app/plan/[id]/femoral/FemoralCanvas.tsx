"use client";

import React, { useState, useCallback } from "react";
import type { FemoralViewMode } from "./FemoralWorkspace";
import { ScanViewport } from "../components/ScanViewport";
import { CalibrationLayer, DimsReporter, EdgeGapOverlay, FitMarkerLayer, ScaleBar, type ScaleTools } from "../components/FitMarkerLayer";
import type { FemoralFitResult } from "@/lib/data/tkr_templates";
import { getFemoralImplant } from "@/lib/data/implant_templates";
import type { BoneModel, MarkerKey, ScanView } from "@/lib/data/fit_markers";
import type { V1FemoralComponent, V1FitMarkers } from "@/lib/plan";
import { ImplantOverlay } from "../components/ImplantOverlay";
import { ResectionGuides, CUT_COLOUR } from "../components/ResectionGuides";
import { placeTemplateInImage } from "@/lib/data/overlay_geometry";
import { cutPlan, femoralCutLines, legAxes, tiltFromSquareDeg } from "@/lib/data/resection_geometry";

interface FemoralCanvasProps {
  viewMode: FemoralViewMode;
  femoralComponent: V1FemoralComponent;
  onMove: (next: { x_offset_mm?: number; y_offset_mm?: number; level_offset_mm?: number }) => void;
  /** The turn for the scan on show: tilt on the AP scan, flexion on the lateral scan. */
  onRotate: (deg: number) => void;
  /** The assessment's landmarks (percent of the image), which give the mechanical axis. */
  landmarks?: Record<string, { x: number; y: number }>;
  /** The marked edges are confirmed: the scan then zooms in on the knee by itself. */
  markersConfirmed?: boolean;
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
  landmarks,
  markersConfirmed = false,
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

  const [showCuts, setShowCuts] = useState(true);
  const [focusNonce, setFocusNonce] = useState(0);
  const [hotCut, setHotCut] = useState<string | null>(null);
  const hasOrigin = Boolean(origin);

  // The AP scan's size, reported as it loads, turns the assessment's percentages into pixels for the mechanical axis.
  const [apDims, setApDims] = useState<{ width: number; height: number } | undefined>();
  const reportDims = useCallback((view: ScanView, dims: { width: number; height: number }) => {
    if (view === "FLAP") setApDims((prev) => (prev && prev.width === dims.width && prev.height === dims.height ? prev : dims));
    onDimsLoaded(view, dims);
  }, [onDimsLoaded]);
  const axes = apDims ? legAxes(landmarks, apDims.width, apDims.height) : undefined;


  const placement = origin
    ? placeTemplateInImage({ template, view: viewMode, origin, mmPerPx, anteriorImageSign: bone.anteriorImageSign, position: pos, levelOffsetMm: level })
    : undefined;
  const cutLines = placement ? femoralCutLines(template, viewMode, placement) : [];
  const plan = cutPlan(template);
  const flexion = pos.flexion_deg ?? 0;

  const focusSpanMm = 110;
  // Once the edges are confirmed, each scan opens zoomed in on the knee (the whole leg is far too small to work
  // on), and the button does it again. A new key is a new request, so each scan asks once.
  const autoFocus = hasOrigin && markersConfirmed;
  const focus =
    placement && (autoFocus || focusNonce > 0)
      ? { x: placement.pivotPx.x, y: placement.pivotPx.y, spanPx: focusSpanMm / mmPerPx, nonce: `${viewMode}:${autoFocus ? "auto" : "manual"}:${focusNonce}` }
      : undefined;

  const hud = origin ? (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      data-no-wheel
      style={{
        position: "absolute",
        left: 12,
        bottom: 40,
        zIndex: 55,
        width: 224,
        padding: "8px 10px",
        borderRadius: 8,
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#e2e8f0",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer" }}>
          <input type="checkbox" checked={showCuts} onChange={(e) => setShowCuts(e.target.checked)} />
          <span style={{ color: CUT_COLOUR }}>Bone cuts</span>
        </label>
        <button
          type="button"
          onClick={() => setFocusNonce((n) => n + 1)}
          style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#e2e8f0", fontSize: 11, cursor: "pointer" }}
          title="Zoom in on the knee and the component"
        >
          Zoom to knee
        </button>
      </div>
      {showCuts && (
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
          {plan
            .filter((c) => viewMode === "KLAT" || c.id === "distal")
            .map((c) => (
              <li
                key={c.id}
                onPointerEnter={() => setHotCut(c.id)}
                onPointerLeave={() => setHotCut((h) => (h === c.id ? null : h))}
                style={{ display: "flex", justifyContent: "space-between", gap: 8, opacity: hotCut && hotCut !== c.id ? 0.6 : 1 }}
              >
                <span>
                  <b style={{ color: CUT_COLOUR }}>{c.sequence}</b> {c.label}
                </span>
                <span style={{ color: "#94a3b8" }}>{c.thicknessMm !== undefined ? `${c.thicknessMm.toFixed(1)} mm` : "angled"}</span>
              </li>
            ))}
        </ol>
      )}
      <div style={{ color: "#cbd5e1", lineHeight: 1.35 }}>
        {viewMode === "FLAP" ? (
          <>
            Tilt {pos.rotation_deg.toFixed(1)}°
            {axes && tiltFromSquareDeg(pos.rotation_deg, axes) !== undefined && (
              <>
                {" · "}
                {Math.abs(tiltFromSquareDeg(pos.rotation_deg, axes)!) < 0.05 ? "square to the mechanical axis" : `${Math.abs(tiltFromSquareDeg(pos.rotation_deg, axes)!).toFixed(1)}° off square`}
              </>
            )}
          </>
        ) : (
          <>Flexion {flexion.toFixed(1)}° · turns about the back of the condyle</>
        )}
      </div>
    </div>
  ) : null;

  return (
    <ScanViewport src={imgSrc} alt={`${viewMode} Scan`} overlay={hud} focus={focus}>
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
            <DimsReporter view={viewMode} width={naturalWidth} height={naturalHeight} onReport={reportDims} />

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
                rotatable
              >
                {showCuts && (
                  <ResectionGuides
                    view={viewMode}
                    lines={cutLines}
                    axes={viewMode === "FLAP" ? axes : undefined}
                    naturalWidth={naturalWidth}
                    naturalHeight={naturalHeight}
                    zoom={zoom}
                    mmPerPx={mmPerPx}
                    highlightId={hotCut}
                  />
                )}
              </ImplantOverlay>
            )}

          </>
        );
      }}
    </ScanViewport>
  );
}
