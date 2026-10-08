"use client";

import { useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { RotateCcw, Target } from "lucide-react";
import type { Point2D } from "@/lib/data/coordinates";
import type { FitOrientation, FitTone } from "@/lib/data/tkr_templates";
import type { MarkerKey } from "@/lib/data/fit_markers";
import { offsetFromDrag, pointsAttr, type MapPosition, type MapShapes } from "@/lib/data/fit_map";
import c from "./planControls.module.css";

const TONE_COLOUR: Record<FitTone | "info", string> = {
  pass: "#22c55e",
  warn: "#f59e0b",
  fail: "#ef4444",
  info: "#cbd5e1",
};

export type MapSide = { text: string; tone: FitTone | "info" };

type Props = {
  kind: "tibial" | "femoral";
  shapes: MapShapes | undefined;
  position: MapPosition;
  orientation: FitOrientation;
  /** What each edge reads, in words ("0.4 mm gap"), and how that is judged. */
  sides: Record<MarkerKey, MapSide> | undefined;
  /** The headline number and what it is, and the verdict colour for the whole fit. */
  headline: { value: string; caption: string } | undefined;
  tone: FitTone | undefined;
  readOnly: boolean;
  onChange: (next: Partial<MapPosition>) => void;
  onCentre: () => void;
  onBest: () => void;
};

type Drag = { mode: "move"; from: Point2D; start: { x: number; y: number } } | null;

/**
 * The bone and the component seen from above, so coverage and alignment can be read at a glance:
 * green is bone the component covers, red is bone it leaves bare, hatching is component hanging past
 * the bone. Drag the component to move it in any direction. This is an ESTIMATE from above, built from the
 * marked width and depth; radiographs do not show the true outline. Rotation is set on the AP scan.
 */
export function FitMap({ kind, shapes, position, orientation, sides, headline, tone, readOnly, onChange, onCentre, onBest }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<Drag>(null);

  if (!shapes) {
    return (
      <section className={c.mapBox} aria-label="Fit map">
        <div className={c.mapHead}>
          <h4 className={c.sectionLabel}>Fit map</h4>
        </div>
        <p className={c.hint}>
          Place all four bone edges to see the {kind === "tibial" ? "tray" : "component"} against the bone from above.
        </p>
      </section>
    );
  }

  const { frameHalfW: hw, frameHalfH: hh } = shapes;
  const vbW = hw * 2;
  const vbH = hh * 2;
  const unit = vbW / 100; // 1% of the frame width, so line weights and text scale with the picture
  // The picture is as tall as the panel allows, so size the text by the height it is drawn at: about 11 px.
  const labelSize = Math.max(unit * 3.1, vbH * 0.046);
  const colour = TONE_COLOUR[tone ?? "pass"];
  // The tibial fit is the share of the bone's area covered, so bare bone is shown red. The femoral fit
  // is how far the component spans the marked bone box, so its box is neutral and only overhang is red.
  const byArea = kind === "tibial";
  const centre = { x: position.x_offset_mm, y: position.y_offset_mm };

  const toMap = (e: PointerEvent): Point2D | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const startMove = (e: PointerEvent) => {
    if (readOnly) return;
    const p = toMap(e);
    if (!p) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ mode: "move", from: p, start: { x: position.x_offset_mm, y: position.y_offset_mm } });
  };
  const move = (e: PointerEvent) => {
    if (!drag || readOnly) return;
    const p = toMap(e);
    if (!p) return;
    onChange(offsetFromDrag(drag.start, drag.from, p));
  };
  const end = (e: PointerEvent) => {
    if (!drag) return;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // pointer capture already released
    }
    setDrag(null);
  };

  const medialLeft = orientation.medialSide === "negX";
  const anteriorTop = orientation.anteriorSide === "negY";
  const edge = (key: MarkerKey) => sides?.[key];
  const label = (key: MarkerKey, name: string, x: number, y: number, anchor: "start" | "middle" | "end") => {
    const side = edge(key);
    return (
      <text
        key={key}
        x={x}
        y={y}
        textAnchor={anchor}
        fontSize={labelSize}
        fontWeight={700}
        fill={TONE_COLOUR[side?.tone ?? "info"]}
        stroke="rgba(2,6,23,0.9)"
        strokeWidth={unit * 0.7}
        paintOrder="stroke"
        pointerEvents="none"
      >
        <tspan x={x} dy={0}>{name}</tspan>
        {side && (
          <tspan x={x} dy={labelSize * 1.15} fontWeight={600}>
            {side.text}
          </tspan>
        )}
      </text>
    );
  };

  const pad = unit * 2;
  const leftKey: MarkerKey = medialLeft ? "medial" : "lateral";
  const rightKey: MarkerKey = medialLeft ? "lateral" : "medial";
  const topKey: MarkerKey = anteriorTop ? "anterior" : "posterior";
  const bottomKey: MarkerKey = anteriorTop ? "posterior" : "anterior";
  const nameOf: Record<MarkerKey, string> = { medial: "MEDIAL", lateral: "LATERAL", anterior: "ANTERIOR", posterior: "POSTERIOR" };

  const sideways = position.x_offset_mm;
  const sidewaysWord =
    Math.abs(sideways) < 0.05 ? "centred" : `${Math.abs(sideways).toFixed(1)} mm ${(sideways > 0) === (orientation.medialSide === "posX") ? "medial" : "lateral"}`;
  const depth = position.y_offset_mm;
  const depthWord =
    Math.abs(depth) < 0.05
      ? "centred"
      : `${Math.abs(depth).toFixed(1)} mm ${(depth < 0) === (orientation.anteriorSide === "negY") ? "anterior" : "posterior"}`;

  return (
    <section className={c.mapBox} aria-label="Fit map">
      <div className={c.mapHead}>
        <h4 className={c.sectionLabel}>Fit map · from above (estimate)</h4>
        {!readOnly && (
          <div className={c.mapActions}>
            <button type="button" className={c.mapBtn} onClick={onBest} title="Move to the position that fits the marked bone best">
              <Target size={13} aria-hidden="true" /> Best position
            </button>
            <button type="button" className={c.mapBtn} onClick={onCentre} title="Put it back at the middle of the bone">
              <RotateCcw size={13} aria-hidden="true" /> Centre
            </button>
          </div>
        )}
      </div>

      {headline && (
        <div className={c.mapHeadline} style={{ borderColor: colour }}>
          <strong style={{ color: colour }}>{headline.value}</strong>
          <span>{headline.caption}</span>
        </div>
      )}

      <div className={c.mapCanvas} data-fit-map>
        <svg
          ref={svgRef}
          viewBox={`${-hw} ${-hh} ${vbW} ${vbH}`}
          width="100%"
          style={{ display: "block", touchAction: "none", maxHeight: 215, margin: "0 auto" }}
          role="img"
          aria-label={`The ${kind === "tibial" ? "tray" : "component"} over the bone, seen from above. ${headline ? `${headline.value} ${headline.caption}.` : ""}`}
        >
          <defs>
            <clipPath id={`${uid}bone`}>
              <polygon points={pointsAttr(shapes.bone)} />
            </clipPath>
            <mask id={`${uid}out`} maskUnits="userSpaceOnUse" x={-hw} y={-hh} width={vbW} height={vbH}>
              <rect x={-hw} y={-hh} width={vbW} height={vbH} fill="#fff" />
              <polygon points={pointsAttr(shapes.bone)} fill="#000" />
            </mask>
            <pattern id={`${uid}hatch`} width={unit * 1.6} height={unit * 1.6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width={unit * 1.6} height={unit * 1.6} fill="rgba(239,68,68,0.55)" />
              <line x1="0" y1="0" x2="0" y2={unit * 1.6} stroke="#fecaca" strokeWidth={unit * 0.55} />
            </pattern>
          </defs>

          {/* Bone first, all of it bare: whatever the component does not cover stays red. */}
          <polygon points={pointsAttr(shapes.bone)} fill={byArea ? "rgba(239,68,68,0.32)" : "rgba(148,163,184,0.16)"} />
          <line x1={-hw} y1={0} x2={hw} y2={0} stroke="rgba(148,163,184,0.25)" strokeWidth={unit * 0.25} strokeDasharray={`${unit} ${unit}`} />
          <line x1={0} y1={-hh} x2={0} y2={hh} stroke="rgba(148,163,184,0.25)" strokeWidth={unit * 0.25} strokeDasharray={`${unit} ${unit}`} />

          {/* Covered bone: the component, cut to the bone. */}
          <polygon points={pointsAttr(shapes.implant)} fill={byArea ? "rgba(34,197,94,0.62)" : "rgba(59,130,246,0.6)"} clipPath={`url(#${uid}bone)`} pointerEvents="none" />
          {/* Overhang: the component where there is no bone. */}
          <polygon points={pointsAttr(shapes.implant)} fill={`url(#${uid}hatch)`} mask={`url(#${uid}out)`} pointerEvents="none" />

          <polygon points={pointsAttr(shapes.bone)} fill="none" stroke="#f8fafc" strokeWidth={unit * 0.45} strokeDasharray={`${unit * 1.4} ${unit * 0.9}`} pointerEvents="none" />

          {/* The component's outline, in the colour of the verdict. It is also what is grabbed. */}
          <polygon
            data-fit-drag
            points={pointsAttr(shapes.implant)}
            fill="rgba(0,0,0,0.001)"
            stroke={colour}
            strokeWidth={unit * 0.7}
            strokeLinejoin="round"
            style={{ cursor: readOnly ? "default" : drag?.mode === "move" ? "grabbing" : "grab" }}
            onPointerDown={startMove}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />

          {/* Bone centre and component centre, joined, so an off-centre placement is plain to see. */}
          <line x1={0} y1={0} x2={centre.x} y2={centre.y} stroke="#f8fafc" strokeWidth={unit * 0.3} strokeDasharray={`${unit * 0.6} ${unit * 0.6}`} pointerEvents="none" />
          <g pointerEvents="none" stroke="#f8fafc" strokeWidth={unit * 0.4}>
            <line x1={-unit * 1.2} y1={0} x2={unit * 1.2} y2={0} />
            <line x1={0} y1={-unit * 1.2} x2={0} y2={unit * 1.2} />
          </g>
          <circle cx={centre.x} cy={centre.y} r={unit * 1.1} fill={colour} stroke="#020617" strokeWidth={unit * 0.3} pointerEvents="none" />

          {label(leftKey, nameOf[leftKey], -hw + pad, -hh + labelSize * 1.5, "start")}
          {label(rightKey, nameOf[rightKey], hw - pad, -hh + labelSize * 1.5, "end")}
          {label(topKey, nameOf[topKey], 0, -hh + labelSize * 1.5, "middle")}
          {label(bottomKey, nameOf[bottomKey], 0, hh - labelSize * 2.1, "middle")}
        </svg>

      </div>

      <ul className={c.mapLegend}>
        {byArea ? (
          <>
            <li><i style={{ background: "rgba(34,197,94,0.75)" }} /> Covered</li>
            <li><i style={{ background: "rgba(239,68,68,0.45)" }} /> Bare bone</li>
          </>
        ) : (
          <>
            <li><i style={{ background: "rgba(59,130,246,0.75)" }} /> Component</li>
            <li><i style={{ background: "rgba(148,163,184,0.45)" }} /> Marked bone</li>
          </>
        )}
        <li><i className={c.mapHatch} /> Overhang</li>
      </ul>

      <p className={c.mapReadout}>
        {sidewaysWord} · {depthWord}
      </p>
      <p className={c.hint} style={{ margin: 0 }}>
        {kind === "tibial"
          ? "Outline estimated from your width and depth marks, not traced anatomy."
          : "Based on the marked width and depth; no area is claimed."}
      </p>
    </section>
  );
}
