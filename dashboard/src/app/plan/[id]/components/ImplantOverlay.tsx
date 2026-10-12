"use client";

import React, { useRef, useState } from "react";
import type { ImplantTemplate } from "@/lib/data/implant_templates";
import { screenDeltaToImageDelta } from "@/lib/data/coordinates";
import { screenMoveToOffsets, type Origin } from "@/lib/data/fit_markers";
import { placeTemplateInImage } from "@/lib/data/overlay_geometry";
import { rotationFromPointer } from "@/lib/data/fit_map";
import { FLEXION_LIMIT_DEG } from "@/lib/data/resection_geometry";
import type { ViewportContext } from "./ScanViewport";

/** The planner's template colour: a semi-transparent blue vector graphic (V1 PDF, Page 2 Step 3). */
export const TEMPLATE_BLUE = "#2563eb";

type View = "FLAP" | "KLAT";

interface Props {
  template: ImplantTemplate;
  view: View;
  viewport: ViewportContext;
  /** Middle of the marked bone edges on this scan, in natural image pixels. */
  origin: Origin;
  mmPerPx: number;
  anteriorImageSign: 1 | -1;
  position: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number; flexion_deg?: number };
  /** Drawing height relative to the marked level; never part of the fit or the payload. */
  levelOffsetMm: number;
  readOnly: boolean;
  /** A bone edge or the scale is being placed: the template must not catch the click. */
  busy: boolean;
  label: string;
  /** Colour of the label border only; the template itself stays blue. */
  verdictColour: string;
  onMove: (next: { x_offset_mm?: number; y_offset_mm?: number; level_offset_mm?: number }) => void;
  /** The turn for the scan on show: the tilt on the AP scan, flexion on the lateral scan. */
  onRotate: (deg: number) => void;
  /** Show the rotation handle on this scan. Defaults to the AP scan only. */
  rotatable?: boolean;
  /** Drawn behind the template's own hit areas: the cut lines. */
  children?: React.ReactNode;
}

const round1 = (v: number) => Number(v.toFixed(1));

/**
 * The generic template drawn on a scan: blue, semi-transparent, size-specific, in millimetres through the
 * scan's own scale. It draws the AP outline on the FLAP scan and the lateral outline on the KLAT scan.
 *
 *   • drag anywhere on the template, or on the centre handle, to move it;
 *   • the round handle above the template turns it. Each scan turns about its own point: the AP scan tilts
 *     the component about the middle of the distal cut (V1: "Rotational handle allows minor 2D alignment
 *     with MPTA axis line"); the lateral scan flexes it about the centre of the posterior condyle.
 *
 * Strokes use non-scaling-stroke so they stay crisp at any zoom.
 */
export function ImplantOverlay({
  template,
  view,
  viewport,
  origin,
  mmPerPx,
  anteriorImageSign,
  position,
  levelOffsetMm,
  readOnly,
  busy,
  label,
  verdictColour,
  onMove,
  onRotate,
  rotatable = view === "FLAP",
  children,
}: Props) {
  const { naturalWidth, naturalHeight, zoom, fitScale, stageRef } = viewport;
  const shape = view === "FLAP" ? template.views.ap : template.views.lateral;
  // One function decides where the template lands on the scan (and is what the geometry tests exercise).
  const placement = placeTemplateInImage({
    template,
    view,
    origin,
    mmPerPx,
    anteriorImageSign,
    position,
    levelOffsetMm,
  });
  const { cx, cy, pxPerMm, flip, rotationDeg: rotation, pivotPx } = placement;
  const pivot = shape.pivot ?? { x: 0, y: 0 };

  const [dragging, setDragging] = useState(false);
  const [turning, setTurning] = useState(false);
  const dragStart = useRef<{ clientX: number; clientY: number; x: number; y: number; level: number } | null>(null);

  const onDragDown = (e: React.PointerEvent) => {
    if (readOnly || busy) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { clientX: e.clientX, clientY: e.clientY, x: position.x_offset_mm, y: position.y_offset_mm, level: levelOffsetMm };
  };

  const onDragMove = (e: React.PointerEvent) => {
    const start = dragStart.current;
    if (!dragging || !start || readOnly) return;
    const d = screenDeltaToImageDelta({ x: e.clientX - start.clientX, y: e.clientY - start.clientY }, viewport);
    const move = screenMoveToOffsets(view, d.x * mmPerPx, d.y * mmPerPx, anteriorImageSign);
    onMove({
      ...(view === "FLAP" ? { x_offset_mm: round1(start.x + move.x) } : { y_offset_mm: round1(start.y + move.y) }),
      level_offset_mm: round1(start.level + move.level),
    });
  };

  const onDragUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    setDragging(false);
    dragStart.current = null;
  };

  // Rotation handle: above the template's top edge, in the template's own (turned) frame.
  const limit = view === "FLAP" ? template.constraints.rotationLimitDeg : FLEXION_LIMIT_DEG;
  // The turn as it reads on screen (clockwise from straight up). The lateral drawing is mirrored when the
  // front of the knee is on the left, and flexion is the opposite way round to the drawing's own turn.
  const turnDeg = view === "FLAP" ? rotation : flip * rotation;
  const angle = view === "FLAP" ? position.rotation_deg : position.flexion_deg ?? 0;
  const handleDistMm = pivot.y - shape.extents.minY + 9;
  const rad = (turnDeg * Math.PI) / 180;
  const handle = { x: pivotPx.x + Math.sin(rad) * handleDistMm * pxPerMm, y: pivotPx.y - Math.cos(rad) * handleDistMm * pxPerMm };

  const onTurnMove = (e: React.PointerEvent) => {
    if (!turning || readOnly) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const ix = ((e.clientX - rect.left) / rect.width) * naturalWidth;
    const iy = ((e.clientY - rect.top) / rect.height) * naturalHeight;
    const onScreen = rotationFromPointer(pivotPx, { x: ix, y: iy }, limit);
    // Positive flexion tips the front of the component forward, whichever way the scan faces.
    onRotate(view === "FLAP" ? onScreen : Number((-flip * onScreen || 0).toFixed(1)));
  };

  const boxW = (shape.extents.maxX - shape.extents.minX) * pxPerMm;
  const boxH = (shape.extents.maxY - shape.extents.minY) * pxPerMm;
  const boxCx = cx + flip * ((shape.extents.minX + shape.extents.maxX) / 2) * pxPerMm;
  const boxCy = cy + ((shape.extents.minY + shape.extents.maxY) / 2) * pxPerMm;
  const handleSize = 1 / zoom;

  const toPoints = (pts: { x: number; y: number }[]) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  return (
    <>
      <svg
        data-implant-template={template.implantId}
        width="100%"
        height="100%"
        viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}
      >
        <g transform={`translate(${cx} ${cy}) scale(${flip * pxPerMm} ${pxPerMm}) rotate(${rotation} ${pivot.x} ${pivot.y})`}>
          {shape.layers.map((layer, i) =>
            layer.open ? (
              <polyline
                key={i}
                points={toPoints(layer.path)}
                fill="none"
                stroke={TEMPLATE_BLUE}
                strokeOpacity={0.75}
                strokeWidth={1}
                strokeDasharray={layer.role === "box" ? "4 3" : undefined}
                vectorEffect="non-scaling-stroke"
              />
            ) : (
              <polygon
                key={i}
                points={toPoints(layer.path)}
                fill={TEMPLATE_BLUE}
                fillOpacity={layer.fill * 0.55}
                stroke={TEMPLATE_BLUE}
                strokeOpacity={0.55}
                strokeWidth={0.8}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ),
          )}
          <polygon
            points={toPoints(shape.silhouette)}
            fill="none"
            stroke={TEMPLATE_BLUE}
            strokeWidth={1.8}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>

      {children}

      {/* Hit area for dragging the whole template. */}
      <div
        data-implant-drag
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        onPointerCancel={onDragUp}
        style={{
          position: "absolute",
          left: `${(boxCx / naturalWidth) * 100}%`,
          top: `${(boxCy / naturalHeight) * 100}%`,
          width: `${boxW * fitScale}px`,
          height: `${boxH * fitScale}px`,
          transform: "translate(-50%, -50%)",
          cursor: readOnly ? "default" : dragging ? "grabbing" : "grab",
          zIndex: 30,
          userSelect: "none",
          touchAction: "none",
          pointerEvents: busy ? "none" : "auto",
        }}
      />

      {/* Centre handle: the point this scan turns about, and a second place to grab. */}
      <div
        aria-hidden="true"
        data-implant-centre
        onPointerDown={onDragDown}
        onPointerMove={onDragMove}
        onPointerUp={onDragUp}
        onPointerCancel={onDragUp}
        style={{
          position: "absolute",
          left: `${(pivotPx.x / naturalWidth) * 100}%`,
          top: `${(pivotPx.y / naturalHeight) * 100}%`,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          border: `2px solid ${TEMPLATE_BLUE}`,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.8), 0 1px 4px rgba(0,0,0,0.5)",
          transform: `translate(-50%, -50%) scale(${handleSize})`,
          cursor: readOnly ? "default" : "move",
          zIndex: 36,
          touchAction: "none",
          pointerEvents: busy ? "none" : "auto",
        }}
      />

      {/* Rotational handle: tilt on the AP scan, flexion on the lateral scan. */}
      {rotatable && !readOnly && (
        <>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", zIndex: 34 }}
          >
            <line x1={pivotPx.x} y1={pivotPx.y} x2={handle.x} y2={handle.y} stroke={TEMPLATE_BLUE} strokeWidth={1.2} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          </svg>
          <div
            role="slider"
            aria-label={view === "FLAP" ? "Tilt the component on the AP scan" : "Flex the component on the lateral scan"}
            aria-valuemin={Number(-limit)}
            aria-valuemax={Number(limit)}
            aria-valuenow={Number(angle)}
            aria-valuetext={`${angle.toFixed(1)} degrees`}
            data-implant-rotate
            title={
              view === "FLAP"
                ? `Tilt (±${limit}°): set the distal cut square to the mechanical axis`
                : `Flexion (±${limit}°): tip the front of the component forward (+) or back (−) about the back of the condyle`
            }
            onPointerDown={(e) => {
              if (busy) return;
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              setTurning(true);
            }}
            onPointerMove={onTurnMove}
            onPointerUp={(e) => {
              try {
                e.currentTarget.releasePointerCapture(e.pointerId);
              } catch {
                /* already released */
              }
              setTurning(false);
            }}
            onPointerCancel={() => setTurning(false)}
            style={{
              position: "absolute",
              left: `${(handle.x / naturalWidth) * 100}%`,
              top: `${(handle.y / naturalHeight) * 100}%`,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: TEMPLATE_BLUE,
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.55)",
              transform: `translate(-50%, -50%) scale(${handleSize})`,
              cursor: turning ? "grabbing" : "grab",
              zIndex: 37,
              touchAction: "none",
              pointerEvents: busy ? "none" : "auto",
            }}
          />
        </>
      )}

      {/* Size label */}
      <div
        style={{
          position: "absolute",
          left: `${(boxCx / naturalWidth) * 100}%`,
          top: `${((boxCy - (boxH / 2)) / naturalHeight) * 100}%`,
          transform: `translate(-50%, -100%) scale(${handleSize})`,
          transformOrigin: "bottom center",
          pointerEvents: "none",
          zIndex: 40,
          marginTop: -6,
        }}
      >
        <div
          style={{
            background: "#0f172a",
            border: `1.5px solid ${verdictColour}`,
            color: "white",
            padding: "4px 10px",
            fontSize: "0.8125rem",
            fontWeight: 700,
            borderRadius: 6,
            whiteSpace: "nowrap",
            boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
          }}
        >
          {label}
        </div>
      </div>
    </>
  );
}
