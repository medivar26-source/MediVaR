"use client";

import { Loupe } from "./Loupe";
import { useEffect, useState } from "react";
import type { PointerEvent, RefObject } from "react";
import type { V1FitMarkers } from "@/lib/plan";
import type { FitTone } from "@/lib/data/tkr_templates";
import {
  MARKER_KEYS,
  MARKER_LABEL,
  MARKER_VIEW,
  markerHint,
  modelXToImage,
  modelYToImageX,
  sideGaps,
} from "@/lib/data/fit_markers";
import type { BoneModel, ComponentKind, MarkerKey, ScanView } from "@/lib/data/fit_markers";
import type { FitExtents } from "@/lib/data/tkr_templates";

const MARKER_COLOUR = "#facc15";
const TONE_COLOUR: Record<FitTone | "info", string> = {
  pass: "#22c55e",
  warn: "#f59e0b",
  fail: "#ef4444",
  info: "#e2e8f0",
};

/** What a canvas needs to show and run the scale measurement for the scan it is drawing. */
export type ScaleTools = {
  calibrated: boolean;
  calibrating: ScanView | null;
  knownMm: number;
  onMeasured: (view: ScanView, measuredPx: number) => void;
  onCancel: () => void;
  /** A marker the finder proposed on one of the scans (natural image pixels); drawn until confirmed or dismissed. */
  candidate?: { view: ScanView; cx: number; cy: number; diameterPx: number };
};

type Props = {
  kind: ComponentKind;
  view: ScanView;
  markers: V1FitMarkers;
  placing: MarkerKey | null;
  readOnly: boolean;
  zoom: number;
  stageRef: RefObject<HTMLDivElement | null>;
  onMove: (key: MarkerKey, point: { x: number; y: number }) => void;
  onPlace: (key: MarkerKey, point: { x: number; y: number }) => void;
  onCancelPlace: () => void;
  /** When given, a magnifying lens follows the pointer while an edge is placed or moved. */
  loupe?: { src: string; naturalWidth: number; naturalHeight: number; fitScale: number };
};

/** A pointer position as a percentage of the image, whatever the current zoom and pan. */
function toPercent(stage: HTMLDivElement | null, clientX: number, clientY: number) {
  if (!stage) return null;
  const rect = stage.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
  };
}

/**
 * The bone-edge markers for one scan. Each is a draggable handle, the lateral and AP scans carry two
 * each. While a marker is being placed, a click anywhere on the scan puts it there.
 */
export function FitMarkerLayer({
  kind,
  view,
  markers,
  placing,
  readOnly,
  zoom,
  stageRef,
  onMove,
  onPlace,
  onCancelPlace,
  loupe,
}: Props) {
  const [dragging, setDragging] = useState<MarkerKey | null>(null);
  const keys = MARKER_KEYS.filter((k) => MARKER_VIEW[k] === view);
  const placingHere = placing && MARKER_VIEW[placing] === view ? placing : null;

  const down = (key: MarkerKey, e: PointerEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(key);
  };
  const move = (key: MarkerKey, e: PointerEvent<HTMLDivElement>) => {
    if (dragging !== key || readOnly) return;
    const p = toPercent(stageRef.current, e.clientX, e.clientY);
    if (p) onMove(key, p);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    setDragging(null);
  };

  return (
    <>
      {loupe && (
        <Loupe
          active={Boolean(placingHere) || dragging !== null}
          stageRef={stageRef}
          src={loupe.src}
          naturalWidth={loupe.naturalWidth}
          naturalHeight={loupe.naturalHeight}
          fitScale={loupe.fitScale}
          zoom={zoom}
        />
      )}
      {keys.map((key) => {
        const point = markers[key];
        if (!point) return null;
        return (
          <div
            key={key}
            data-landmark={key}
            role="slider"
            aria-label={`${MARKER_LABEL[key]} marker`}
            aria-valuetext={`${point.x.toFixed(1)}% across, ${point.y.toFixed(1)}% down`}
            tabIndex={readOnly ? -1 : 0}
            onPointerDown={(e) => down(key, e)}
            onPointerMove={(e) => move(key, e)}
            onPointerUp={up}
            onPointerCancel={up}
            style={{
              position: "absolute",
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: `translate(-50%, -50%) scale(${1 / zoom})`,
              zIndex: 60,
              touchAction: "none",
              // While an edge is being placed, a click always places it, even on top of another marker.
              pointerEvents: placingHere ? "none" : "auto",
              cursor: readOnly ? "default" : dragging === key ? "grabbing" : "grab",
            }}
          >
            <span
              style={{
                display: "block",
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `2px solid ${MARKER_COLOUR}`,
                background: "rgba(0,0,0,0.35)",
                boxShadow: "0 0 0 1px rgba(0,0,0,0.6)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 4,
                  height: 4,
                  marginLeft: -2,
                  marginTop: -2,
                  borderRadius: "50%",
                  background: MARKER_COLOUR,
                }}
              />
            </span>
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 22,
                transform: "translateX(-50%)",
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(15,23,42,0.85)",
                color: MARKER_COLOUR,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              {MARKER_LABEL[key].replace(" edge", "")}
            </span>
          </div>
        );
      })}

      {placingHere && !readOnly && (
        <>
          <div
            data-landmark="placing"
            onClick={(e) => {
              const p = toPercent(stageRef.current, e.clientX, e.clientY);
              if (p) onPlace(placingHere, p);
            }}
            style={{ position: "absolute", inset: 0, zIndex: 55, cursor: "crosshair" }}
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
              border: `1px solid ${MARKER_COLOUR}`,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <span>{markerHint(kind, placingHere)}</span>
            <button
              type="button"
              onClick={onCancelPlace}
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </>
  );
}

/**
 * A measured gap or overhang between a bone edge and the implant edge, drawn in image pixels on the
 * scan: a short bracket between the two edges, and the number beside it.
 */
export function EdgeGap({
  x1,
  x2,
  y,
  label,
  tone,
  fontPx,
  anchor = "middle",
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
  tone: FitTone | "info";
  /** Text size in image pixels: 13 divided by (fit scale × zoom) keeps it readable. */
  fontPx: number;
  anchor?: "start" | "middle" | "end";
}) {
  const colour = TONE_COLOUR[tone];
  const lo = Math.min(x1, x2);
  const hi = Math.max(x1, x2);
  const mid = (lo + hi) / 2;
  const tick = fontPx * 0.6;
  const tx = anchor === "start" ? hi + fontPx * 0.4 : anchor === "end" ? lo - fontPx * 0.4 : mid;
  return (
    <g pointerEvents="none">
      <line x1={lo} y1={y} x2={hi} y2={y} stroke={colour} strokeWidth={fontPx * 0.14} />
      <line x1={lo} y1={y - tick} x2={lo} y2={y + tick} stroke={colour} strokeWidth={fontPx * 0.14} />
      <line x1={hi} y1={y - tick} x2={hi} y2={y + tick} stroke={colour} strokeWidth={fontPx * 0.14} />
      <text
        x={tx}
        y={y - tick * 1.4}
        textAnchor={anchor}
        fontSize={fontPx}
        fontWeight={700}
        fill={colour}
        stroke="rgba(0,0,0,0.75)"
        strokeWidth={fontPx * 0.2}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}

/** Reports the scan's natural size upward; covers DICOM files, which cannot be preloaded. */
export function DimsReporter({
  view,
  width,
  height,
  onReport,
}: {
  view: ScanView;
  width: number;
  height: number;
  onReport: (view: ScanView, dims: { width: number; height: number }) => void;
}) {
  useEffect(() => {
    if (width > 0 && height > 0) onReport(view, { width, height });
  }, [view, width, height, onReport]);
  return null;
}

export type SideVerdict = { over: number; tone: FitTone | "info" };

/**
 * The two gap labels for one scan: medial and lateral on the AP view, anterior and posterior on the
 * lateral one. Each sits between the marked bone edge and the matching implant edge.
 */
export function EdgeGapOverlay({
  view,
  bone,
  markers,
  extents,
  sides,
  widthPx,
  heightPx,
  mmPerPx,
  fontPx,
}: {
  view: ScanView;
  bone: BoneModel;
  markers: V1FitMarkers;
  extents: FitExtents;
  sides: Record<MarkerKey, SideVerdict>;
  widthPx: number;
  heightPx: number;
  mmPerPx: number;
  fontPx: number;
}) {
  const origin = view === "FLAP" ? bone.flapOrigin : bone.klatOrigin;
  if (!origin || !bone.complete) return null;
  const gaps = sideGaps(extents, bone);
  const keys: MarkerKey[] = view === "FLAP" ? ["medial", "lateral"] : ["anterior", "posterior"];

  return (
    <>
      {keys.map((key) => {
        const marker = markers[key];
        if (!marker) return null;
        const markerX = (marker.x / 100) * widthPx;
        const y = (marker.y / 100) * heightPx;

        // Where the implant's edge on this side lands on the scan.
        let implantX: number;
        if (view === "FLAP") {
          const isLeftSide = (key === "medial") === (bone.orientation.medialSide === "negX");
          implantX = modelXToImage(isLeftSide ? extents.minX : extents.maxX, origin, mmPerPx);
        } else {
          const modelY = key === "anterior" ? extents.minY : extents.maxY;
          implantX = modelYToImageX(modelY, origin, mmPerPx, bone.anteriorImageSign);
        }

        const verdict = sides[key];
        const gap = gaps[key];
        const text =
          verdict.over > 0
            ? `${verdict.over.toFixed(1)} mm over`
            : gap > 0.05
              ? `${gap.toFixed(1)} mm gap`
              : "flush";
        const outward = markerX >= (widthPx - 0) / 2 ? "start" : "end";
        const colour = TONE_COLOUR[verdict.tone];
        const reach = 12 / mmPerPx;
        const bracketY = Math.min(heightPx - fontPx, Math.max(fontPx * 2, y)) - fontPx * 0.8;
        return (
          <g key={key}>
            {/* The marked bone edge, carried the full height of the scan: the implant edge is read against it. */}
            <line
              x1={markerX}
              y1={0}
              x2={markerX}
              y2={heightPx}
              stroke={MARKER_COLOUR}
              strokeWidth={fontPx * 0.08}
              strokeDasharray={`${fontPx * 0.7} ${fontPx * 0.5}`}
              opacity={0.55}
              pointerEvents="none"
            />
            {/* The implant's own edge, in the colour of how it sits against that bone edge. */}
            <line
              x1={implantX}
              y1={bracketY - reach}
              x2={implantX}
              y2={bracketY + reach}
              stroke={colour}
              strokeWidth={fontPx * 0.2}
              strokeLinecap="round"
              pointerEvents="none"
            />
            <EdgeGap
              x1={markerX}
              x2={implantX}
              y={bracketY}
              label={text}
              tone={verdict.tone}
              fontPx={fontPx}
              anchor={outward}
            />
          </g>
        );
      })}
    </>
  );
}

/**
 * Two clicks across something of known size (the 25 mm marker) give the scan's scale. The points are
 * shown as they are placed; the second click finishes the measurement.
 */
export function CalibrationLayer({
  active,
  view,
  zoom,
  stageRef,
  widthPx,
  heightPx,
  knownMm,
  onMeasured,
  onCancel,
  candidate,
}: {
  candidate?: { view: ScanView; cx: number; cy: number; diameterPx: number };
  active: boolean;
  view: ScanView;
  zoom: number;
  stageRef: RefObject<HTMLDivElement | null>;
  /** The scan's true size in pixels, so the distance is measured on the file, not on the screen. */
  widthPx: number;
  heightPx: number;
  knownMm: number;
  onMeasured: (view: ScanView, measuredPx: number) => void;
  onCancel: () => void;
}) {
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  // Clear the clicks when measuring stops. Done during render, not in an effect, so it never paints stale points.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setPoints([]);
  }

  const ring =
    candidate && candidate.view === view ? (
      <svg
        data-marker-candidate
        viewBox={`0 0 ${widthPx} ${heightPx}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 55, pointerEvents: "none", overflow: "visible" }}
      >
        <circle cx={candidate.cx} cy={candidate.cy} r={candidate.diameterPx / 2} fill="none" stroke={MARKER_COLOUR} strokeWidth={2.5} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
        <circle cx={candidate.cx} cy={candidate.cy} r={candidate.diameterPx / 2 + 6} fill="none" stroke="#0f172a" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={0.6} />
      </svg>
    ) : null;

  if (!active) return ring;

  const click = (clientX: number, clientY: number) => {
    const p = toPercent(stageRef.current, clientX, clientY);
    if (!p) return;
    if (points.length === 0) {
      setPoints([p]);
      return;
    }
    const first = points[0];
    const px = Math.hypot(((p.x - first.x) / 100) * widthPx, ((p.y - first.y) / 100) * heightPx);
    setPoints([first, p]);
    onMeasured(view, px);
  };

  return (
    <>
      {ring}
      <div
        data-landmark="calibrating"
        onClick={(e) => click(e.clientX, e.clientY)}
        style={{ position: "absolute", inset: 0, zIndex: 56, cursor: "crosshair" }}
      />
      {points.length === 2 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 57, pointerEvents: "none" }}
        >
          <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={MARKER_COLOUR} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      {points.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: `2px solid ${MARKER_COLOUR}`,
            background: "rgba(0,0,0,0.5)",
            transform: `translate(-50%, -50%) scale(${1 / zoom})`,
            zIndex: 58,
            pointerEvents: "none",
          }}
        />
      ))}
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
          border: `1px solid ${MARKER_COLOUR}`,
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        <span>
          {points.length === 0
            ? `Click one edge of the ${knownMm} mm marker, then the opposite edge.`
            : "Now click the opposite edge."}
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

/** A ruler drawn at the scan's own scale, so a wrong scale shows up as a ruler that does not match the anatomy. */
export function ScaleBar({
  widthPx,
  heightPx,
  mmPerPx,
  calibrated,
  fontPx,
}: {
  widthPx: number;
  heightPx: number;
  mmPerPx: number;
  calibrated: boolean;
  fontPx: number;
}) {
  const lengthMm = [100, 50, 20, 10, 5].find((mm) => mm / mmPerPx <= widthPx * 0.35) ?? 5;
  const barPx = lengthMm / mmPerPx;
  const x = widthPx * 0.04;
  const y = heightPx * 0.94;
  const colour = calibrated ? "#e2e8f0" : "#f59e0b";
  const stroke = fontPx * 0.18;
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={x + barPx} y2={y} stroke="rgba(0,0,0,0.7)" strokeWidth={stroke * 2.2} />
      <line x1={x} y1={y} x2={x + barPx} y2={y} stroke={colour} strokeWidth={stroke} />
      <line x1={x} y1={y - fontPx * 0.5} x2={x} y2={y + fontPx * 0.5} stroke={colour} strokeWidth={stroke} />
      <line x1={x + barPx} y1={y - fontPx * 0.5} x2={x + barPx} y2={y + fontPx * 0.5} stroke={colour} strokeWidth={stroke} />
      <text
        x={x + barPx / 2}
        y={y - fontPx * 0.8}
        textAnchor="middle"
        fontSize={fontPx}
        fontWeight={700}
        fill={colour}
        stroke="rgba(0,0,0,0.75)"
        strokeWidth={fontPx * 0.2}
        paintOrder="stroke"
      >
        {calibrated ? `${lengthMm} mm` : `≈ ${lengthMm} mm (estimated scale)`}
      </text>
    </g>
  );
}
