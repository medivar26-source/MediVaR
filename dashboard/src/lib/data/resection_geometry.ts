/**
 * The bone cuts of the femoral component, as lines on the scan, and the axes they are set against.
 *
 * In real surgery the component is chosen for its cuts. The distal femoral cut is made square to the leg's
 * mechanical axis (hip centre to knee centre), which is the same as about 5–7° of valgus to the shaft's
 * anatomical axis. Seen from the side, five cuts shape the end of the bone, and the component sits on all
 * of them at once: distal, anterior, posterior, then the two chamfers. These helpers place those cut lines
 * on the scan with the component, so the user sees where the saw goes rather than judging an outline.
 *
 * Everything is in natural image pixels, through the scan's own scale. ENGINEERING_DERIVATION: the cut
 * positions follow the generic template, not a manufacturer's cutting guide.
 */

import type { Point2D } from "./coordinates";
import type { ImplantTemplate, ResectionCut } from "./implant_templates";
import type { OverlayPlacement } from "./overlay_geometry";

type View = "FLAP" | "KLAT";

/** Flexion limit of the lateral drawing, in degrees. A few degrees is usual; this leaves room either side. */
export const FLEXION_LIMIT_DEG = 10;

/** How far past the component each cut line runs, so it can be seen on the bone. Chamfers stay short. */
const EXTEND_MM: Record<ResectionCut["id"], number> = {
  distal: 14,
  anterior: 8,
  posterior: 8,
  anterior_chamfer: 0,
  posterior_chamfer: 0,
};

export type CutLine = {
  id: ResectionCut["id"];
  label: string;
  sequence: number;
  /** The cut line to draw, in natural image pixels, run out past the component. */
  a: Point2D;
  b: Point2D;
  /** The middle of the part of the cut that touches the component, where the label goes. */
  mid: Point2D;
  thicknessMm?: number;
};

/** The cuts of a placed femoral component on one scan. */
export function femoralCutLines(template: ImplantTemplate, view: View, placement: OverlayPlacement): CutLine[] {
  const shape = view === "FLAP" ? template.views.ap : template.views.lateral;
  const cuts = shape.cuts ?? [];
  return cuts.map((cut) => {
    const a = placement.toImage(cut.a);
    const b = placement.toImage(cut.b);
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const ux = (b.x - a.x) / len;
    const uy = (b.y - a.y) / len;
    const run = EXTEND_MM[cut.id] * placement.pxPerMm;
    return {
      id: cut.id,
      label: cut.label,
      sequence: cut.sequence,
      a: { x: a.x - ux * run, y: a.y - uy * run },
      b: { x: b.x + ux * run, y: b.y + uy * run },
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      thicknessMm: cut.thicknessMm,
    };
  });
}

/** What the surgeon removes at each cut, in the order the cuts are made: the cut plan. */
export function cutPlan(template: ImplantTemplate): { id: ResectionCut["id"]; label: string; sequence: number; thicknessMm?: number }[] {
  const lateral = template.views.lateral.cuts ?? [];
  return [...lateral]
    .sort((x, y) => x.sequence - y.sequence)
    .map(({ id, label, sequence, thicknessMm }) => ({ id, label, sequence, thicknessMm }));
}

/* ---------- the leg's axes, from the assessment landmarks ---------- */

type Landmarks = Record<string, { x: number; y: number }> | undefined;

const inPx = (p: { x: number; y: number }, w: number, h: number): Point2D => ({ x: (p.x / 100) * w, y: (p.y / 100) * h });

export type LegAxes = {
  hip: Point2D;
  knee: Point2D;
  /** Anatomical axis of the femoral shaft, when both canal points were marked in the assessment. */
  canal?: { proximal: Point2D; distal: Point2D };
  /** Tilt that makes the component's distal cut square to the mechanical axis, in degrees (AP scan, clockwise). */
  squareRotationDeg: number;
  /** Angle between the anatomical and mechanical axes, i.e. the valgus cut angle the surgeon would dial in. */
  valgusCutAngleDeg?: number;
};

/** Angle of the line a→b measured from straight down, clockwise on screen, in degrees. */
const fromVertical = (a: Point2D, b: Point2D) => (Math.atan2(-(b.x - a.x), b.y - a.y) * 180) / Math.PI;

/**
 * The mechanical axis (hip centre to knee centre) and, when marked, the femoral canal, from the assessment
 * landmarks on the AP scan. `undefined` until the hip and knee centres exist and the scan size is known.
 */
export function legAxes(landmarks: Landmarks, widthPx: number, heightPx: number): LegAxes | undefined {
  const hip0 = landmarks?.hipCenter;
  const knee0 = landmarks?.kneeCenter;
  if (!hip0 || !knee0 || widthPx <= 0 || heightPx <= 0) return undefined;
  const hip = inPx(hip0, widthPx, heightPx);
  const knee = inPx(knee0, widthPx, heightPx);
  if (Math.hypot(knee.x - hip.x, knee.y - hip.y) < 1) return undefined;

  // A cut square to the axis is turned by the axis's own lean from vertical.
  let squareRotationDeg = Number(fromVertical(hip, knee).toFixed(1));
  if (Object.is(squareRotationDeg, -0)) squareRotationDeg = 0;

  const cp = landmarks?.femurCanalProximal;
  const cd = landmarks?.femurCanalDistal;
  let canal: LegAxes["canal"];
  let valgusCutAngleDeg: number | undefined;
  if (cp && cd) {
    const proximal = inPx(cp, widthPx, heightPx);
    const distal = inPx(cd, widthPx, heightPx);
    if (Math.hypot(distal.x - proximal.x, distal.y - proximal.y) >= 1) {
      canal = { proximal, distal };
      valgusCutAngleDeg = Number(Math.abs(fromVertical(proximal, distal) - fromVertical(hip, knee)).toFixed(1));
    }
  }
  return { hip, knee, canal, squareRotationDeg, valgusCutAngleDeg };
}

/** How far the tilt is from square to the mechanical axis, in degrees. 0 is square. */
export const tiltFromSquareDeg = (rotationDeg: number, axes: LegAxes | undefined) =>
  axes ? Number((rotationDeg - axes.squareRotationDeg).toFixed(1)) : undefined;
