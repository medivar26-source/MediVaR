"use client";

import React from "react";
import type { CutLine, LegAxes } from "@/lib/data/resection_geometry";

export const CUT_COLOUR = "#fb923c";
const AXIS_COLOUR = "#22c55e";
const CANAL_COLOUR = "#ec4899";

interface Props {
  view: "FLAP" | "KLAT";
  lines: CutLine[];
  /** AP scan only: the leg's mechanical axis, from the assessment. */
  axes?: LegAxes;
  naturalWidth: number;
  naturalHeight: number;
  zoom: number;
  mmPerPx: number;
  /** Cut line numbers are always shown; names are for the ones the user is pointing at. */
  highlightId?: string | null;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * Where the saw goes: the bone-facing cuts of the component drawn as dashed lines on the scan, run out past
 * the component so they read on the bone, each with its number in the order the cuts are made. On the AP scan
 * the mechanical axis is drawn with them, since the distal cut is set square to it.
 *
 * Strokes do not scale with zoom; the number badges are counter-scaled so they stay the same size.
 */
export function ResectionGuides({ view, lines, axes, naturalWidth, naturalHeight, zoom, mmPerPx, highlightId }: Props) {
  const badge = 1 / zoom;
  // Run the mechanical axis a good way past the knee, so it meets the cut line and shows the right angle.
  const axisEnd =
    axes &&
    (() => {
      const dx = axes.knee.x - axes.hip.x;
      const dy = axes.knee.y - axes.hip.y;
      const len = Math.hypot(dx, dy) || 1;
      const run = 40 / mmPerPx;
      return { x: axes.knee.x + (dx / len) * run, y: axes.knee.y + (dy / len) * run };
    })();

  return (
    <>
      <svg
        data-resection-guides
        width="100%"
        height="100%"
        viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible", zIndex: 28 }}
      >
        {view === "FLAP" && axes && axisEnd && (
          <>
            <line x1={axes.hip.x} y1={axes.hip.y} x2={axisEnd.x} y2={axisEnd.y} stroke="rgba(2,6,23,0.75)" strokeWidth={4} vectorEffect="non-scaling-stroke" />
            <line x1={axes.hip.x} y1={axes.hip.y} x2={axisEnd.x} y2={axisEnd.y} stroke={AXIS_COLOUR} strokeWidth={1.6} strokeDasharray="7 4" vectorEffect="non-scaling-stroke" />
            {axes.canal && (
              <line
                x1={axes.canal.proximal.x}
                y1={axes.canal.proximal.y}
                x2={axes.canal.distal.x}
                y2={axes.canal.distal.y}
                stroke={CANAL_COLOUR}
                strokeWidth={1.2}
                strokeDasharray="3 3"
                strokeOpacity={0.9}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </>
        )}
        {lines.map((l) => {
          const hot = highlightId === l.id;
          const heavy = l.id === "distal" || l.id === "anterior" || l.id === "posterior";
          return (
            <g key={l.id}>
              <line x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke="rgba(2,6,23,0.8)" strokeWidth={hot ? 6 : heavy ? 5 : 4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <line
                x1={l.a.x}
                y1={l.a.y}
                x2={l.b.x}
                y2={l.b.y}
                stroke={CUT_COLOUR}
                strokeWidth={hot ? 3 : heavy ? 2.2 : 1.8}
                strokeDasharray={heavy ? "9 5" : "5 4"}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </svg>

      {lines.map((l) => (
        <div
          key={l.id}
          data-cut-badge={l.id}
          style={{
            position: "absolute",
            left: pct(l.b.x, naturalWidth),
            top: pct(l.b.y, naturalHeight),
            transform: `translate(-50%, -50%) scale(${badge})`,
            zIndex: 33,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: CUT_COLOUR,
              color: "#111827",
              fontSize: 11,
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
              border: "1.5px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
            }}
          >
            {l.sequence}
          </span>
          {(l.id === "distal" || highlightId === l.id) && (
            <span
              style={{
                padding: "1px 6px",
                borderRadius: 4,
                background: "rgba(15,23,42,0.9)",
                color: "#fed7aa",
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              {l.label}
              {l.thicknessMm !== undefined ? ` · ${l.thicknessMm.toFixed(1)} mm` : ""}
            </span>
          )}
        </div>
      ))}

      {view === "FLAP" && axes && axisEnd && (
        <div
          style={{
            position: "absolute",
            left: pct(axes.knee.x, naturalWidth),
            top: pct(axes.knee.y, naturalHeight),
            transform: `translate(14px, -50%) scale(${badge})`,
            transformOrigin: "left center",
            zIndex: 33,
            pointerEvents: "none",
            padding: "1px 6px",
            borderRadius: 4,
            background: "rgba(15,23,42,0.9)",
            color: AXIS_COLOUR,
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Mechanical axis
        </div>
      )}
    </>
  );
}
