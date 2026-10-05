"use client";

import React, { useState, useRef } from "react";
import type { Point2D } from "../assessment/AssessmentWorkspace";
import type { TibialViewMode } from "./TibialWorkspace";
import { ScanViewport, type ViewportContext } from "../components/ScanViewport";
import { getTibialTemplate } from "@/lib/data/tkr_templates";
import { TIBIAL_GEOMETRY_CATALOG } from "@/lib/data/tibial_geometry";
import type { V1TibialComponent, V1Calibration } from "@/lib/plan";
import { DEFAULT_CALIBRATION } from "@/lib/data/calibration";
import { screenDeltaToPhysicalMm } from "@/lib/data/coordinates";

interface TibialCanvasProps {
  viewMode: TibialViewMode;
  tibialComponent: V1TibialComponent;
  onPositionChange: (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => void;
  assessmentLandmarks?: Record<string, Point2D>;
  patientBone?: { mlMm: number; apMm: number };
  isReadOnly?: boolean;
  src?: string;
  calibration?: V1Calibration;
}

export function TibialCanvas({
  viewMode,
  tibialComponent,
  onPositionChange,
  assessmentLandmarks = {},
  patientBone,
  isReadOnly = false,
  src,
  calibration = DEFAULT_CALIBRATION,
}: TibialCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const defaultImgSrc = viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg";
  const imgSrc = src || defaultImgSrc;

  const template = getTibialTemplate(tibialComponent.implant_size);
  const geom = TIBIAL_GEOMETRY_CATALOG[template.size] ?? TIBIAL_GEOMETRY_CATALOG[3];

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
        x_offset_mm: Number((tibialComponent.position_2d.x_offset_mm + dxMm).toFixed(1)),
        y_offset_mm: Number((tibialComponent.position_2d.y_offset_mm + dyMm).toFixed(1)),
        rotation_deg: tibialComponent.position_2d.rotation_deg,
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

        // Origin in image pixels: plateau starts right at joint line
        const centerX_img = kneeX_img + tibialComponent.position_2d.x_offset_mm * pxPerMm;
        const centerY_img = kneeY_img + tibialComponent.position_2d.y_offset_mm * pxPerMm + (viewMode === "FLAP" ? 6 * pxPerMm : 0);

        return (
          <>
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
                <filter id="tibialGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Patient Tibial Cortical Plateau Boundary & Resection Markers (Fixed to Anatomy) */}
              {patientBone && (
                <g
                  transform={`translate(${kneeX_img}, ${kneeY_img + (viewMode === "FLAP" ? 6 * pxPerMm : 0)}) scale(${pxPerMm})`}
                >
                  {/* Resection Reference Line */}
                  <line
                    x1={-patientBone.mlMm / 2}
                    y1={0}
                    x2={patientBone.mlMm / 2}
                    y2={0}
                    stroke="#0284c7"
                    strokeWidth={1.5 / pxPerMm}
                    strokeDasharray={`${3 / pxPerMm},${2 / pxPerMm}`}
                    opacity={0.8}
                  />
                  {/* Medial Cortical Boundary Marker */}
                  <line
                    x1={-patientBone.mlMm / 2}
                    y1={-3}
                    x2={-patientBone.mlMm / 2}
                    y2={8}
                    stroke="#0284c7"
                    strokeWidth={1.8 / pxPerMm}
                  />
                  {/* Lateral Cortical Boundary Marker */}
                  <line
                    x1={patientBone.mlMm / 2}
                    y1={-3}
                    x2={patientBone.mlMm / 2}
                    y2={8}
                    stroke="#0284c7"
                  strokeWidth={1.8 / pxPerMm}
                />
              </g>
              )}

              {/* Implant Component Group placed in Image Space, scaled strictly by pxPerMm */}
              <g
                transform={`translate(${centerX_img}, ${centerY_img}) rotate(${tibialComponent.position_2d.rotation_deg}) scale(${pxPerMm})`}
                filter="url(#tibialGlow)"
              >
                {viewMode === "FLAP" ? (
                  // Front Coronal View: Keel, Baseplate tray, and Polyethylene insert
                  <>
                    {/* Keel wings & stem extending distal into tibial shaft */}
                    <polygon
                      points={geom.keelPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(16, 185, 129, 0.35)"
                      stroke="#10b981"
                      strokeWidth={1.2 / pxPerMm}
                      strokeLinejoin="round"
                    />

                    {/* Stem core highlight */}
                    <polygon
                      points={geom.stemCorePolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(255, 255, 255, 0.35)"
                      stroke="#10b981"
                      strokeWidth={0.8 / pxPerMm}
                    />

                    {/* Metal baseplate tray */}
                    <polygon
                      points={geom.baseplatePolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(16, 185, 129, 0.45)"
                      stroke="#10b981"
                      strokeWidth={1.5 / pxPerMm}
                      strokeLinejoin="round"
                    />

                    {/* Polyethylene Insert (Top Layer) */}
                    <polygon
                      points={geom.insertPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(255, 255, 255, 0.92)"
                      stroke="#94a3b8"
                      strokeWidth={1.0 / pxPerMm}
                      strokeLinejoin="round"
                    />
                  </>
                ) : (
                  // Lateral View (KLAT): Profile of tray and stem
                  <>
                    <polygon
                      points={geom.klatPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(16, 185, 129, 0.35)"
                      stroke="#10b981"
                      strokeWidth={1.5 / pxPerMm}
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={geom.insertPolygon.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill="rgba(255, 255, 255, 0.92)"
                      stroke="#94a3b8"
                      strokeWidth={1.0 / pxPerMm}
                      strokeLinejoin="round"
                    />
                  </>
                )}

                {/* Translation handle target */}
                <circle
                  cx={0}
                  cy={viewMode === "FLAP" ? 10 : 8}
                  r={3.5}
                  fill="#ffffff"
                  stroke="#10b981"
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
                height: `${(42.0 * pxPerMm * viewport.fitScale)}px`,
                transform: `translate(-50%, 0%) rotate(${tibialComponent.position_2d.rotation_deg}deg)`,
                transformOrigin: "center top",
                cursor: isReadOnly ? "default" : isDragging ? "grabbing" : "grab",
                zIndex: 30,
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Leader Line & HUD Tag: "Tibial Size 3" matching clinical reference */}
              <div
                style={{
                  position: "absolute",
                  top: "20%",
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
                    border: "1.5px solid #10b981",
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
                  Tibial Size {template.size}
                </div>
                <div style={{ width: "24px", height: "2px", background: "#10b981" }} />
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    marginLeft: "-4px",
                  }}
                />
              </div>
            </div>

            {/* Part 22 - Development Diagnostic Mode HUD */}
            <button
              type="button"
              onClick={() => setShowDiagnostics((prev) => !prev)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 45,
                padding: "5px 10px",
                fontSize: "11px",
                fontWeight: 600,
                background: showDiagnostics ? "#10b981" : "rgba(15, 23, 42, 0.8)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "4px",
                cursor: "pointer",
                pointerEvents: "auto",
                backdropFilter: "blur(4px)",
              }}
            >
              Diagnostics {showDiagnostics ? "ON" : "OFF"}
            </button>

            {showDiagnostics && (
              <div
                style={{
                  position: "absolute",
                  top: "44px",
                  right: "12px",
                  background: "rgba(15, 23, 42, 0.94)",
                  color: "#f8fafc",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  lineHeight: "1.45",
                  minWidth: "310px",
                  maxWidth: "360px",
                  zIndex: 50,
                  boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  pointerEvents: "auto",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "4px" }}>
                  <span style={{ color: "#38bdf8" }}>TIBIAL PLANNING DIAGNOSTICS</span>
                  <button
                    type="button"
                    onClick={() => setShowDiagnostics(false)}
                    style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: 0 }}
                  >
                    ✕
                  </button>
                </div>
                <div><strong>Image dimensions:</strong> {naturalWidth} × {naturalHeight}</div>
                <div><strong>Zoom:</strong> {zoom.toFixed(2)}x</div>
                <div><strong>Viewport scale:</strong> {viewport.fitScale.toFixed(4)}</div>
                <div><strong>Calibration:</strong> {mmPerPx.toFixed(5)} mm/px</div>
                <div><strong>Tibial Size:</strong> Size {template.size}</div>
                <div><strong>Physical AP:</strong> {template.apMm.toFixed(1)} mm</div>
                <div><strong>Physical ML:</strong> {template.mlMm.toFixed(1)} mm</div>
                <div><strong>Expected ML in image px:</strong> {(template.mlMm * pxPerMm).toFixed(2)} px</div>
                <div><strong>Rendered ML in image px:</strong> {(template.mlMm * pxPerMm).toFixed(2)} px</div>
                <div><strong>Patient tibial boundary:</strong> ML: {patientMl.toFixed(1)} mm × AP: {patientAp.toFixed(1)} mm</div>
                <div><strong>Coverage:</strong> {tibialComponent.cortical_coverage_pct ?? 0}%</div>
                <div><strong>Medial overhang:</strong> {tibialComponent.medial_overhang_mm ?? 0} mm</div>
                <div><strong>Lateral overhang:</strong> {tibialComponent.lateral_overhang_mm ?? 0} mm</div>
                <div style={{ marginTop: "6px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.15)", color: "#e2e8f0" }}>
                  <strong>Fit rule:</strong> {tibialComponent.fit_status ?? "ACCEPTABLE FIT"}
                </div>
              </div>
            )}
          </>
        );
      }}
    </ScanViewport>
  );
}
