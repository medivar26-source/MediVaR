/**
 * Where an implant template lands on a scan, in natural image pixels.
 *
 * The planner works in physical millimetres and only turns them into pixels through the scan's own scale
 * (mm per pixel). Zoom and pan are screen-space and never enter here, which is what keeps overlays
 * physically meaningful and crisp at any zoom (the SVG uses the same numbers; strokes do not scale).
 *
 *   screen → viewport/stage → natural image pixels → calibrated physical mm → template
 */

import type { Point2D } from "./coordinates";
import type { ImplantTemplate } from "./implant_templates";
import { extentsOf, rotateAbout } from "./implant_templates";
import { modelXToImage, modelYToImageX, type Origin } from "./fit_markers";

export type OverlayPlacement = {
  /** Image-pixel position of the template's local origin (the centre handle / rotation pivot). */
  cx: number;
  cy: number;
  /** Pixels per millimetre on this scan. */
  pxPerMm: number;
  /** Horizontal flip applied to the template's x (the lateral drawing, when anterior is on the image's right). */
  flip: 1 | -1;
  /**
   * Turn actually applied to the drawing, in degrees clockwise on the template's own (unflipped) axes, about
   * `pivotPx`. On the AP scan it is the tilt; on the lateral scan it is flexion, negated so that positive
   * flexion tips the front of the component forward.
   */
  rotationDeg: number;
  /** What the drawing turns about, in natural image pixels (the middle of the distal cut on AP, the posterior condyle centre on lateral). */
  pivotPx: Point2D;
  /** A template-local point in natural image pixels, after the same turn, flip and translation as the drawing. */
  toImage: (p: Point2D) => Point2D;
  /** The template silhouette in natural image pixels, after rotation, flip and translation. */
  silhouettePx: Point2D[];
};

export function placeTemplateInImage(args: {
  template: ImplantTemplate;
  view: "FLAP" | "KLAT";
  origin: Origin;
  mmPerPx: number;
  anteriorImageSign: 1 | -1;
  position: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number; flexion_deg?: number };
  levelOffsetMm?: number;
}): OverlayPlacement {
  const { template, view, origin, mmPerPx, anteriorImageSign, position, levelOffsetMm = 0 } = args;
  const pxPerMm = 1 / mmPerPx;
  const shape = view === "FLAP" ? template.views.ap : template.views.lateral;
  // The AP scan turns by the tilt, the lateral scan by flexion. Each has its own pivot on the template.
  const rotationDeg = view === "FLAP" ? position.rotation_deg : -(position.flexion_deg ?? 0) || 0;
  const pivot = shape.pivot ?? { x: 0, y: 0 };
  const flip: 1 | -1 = view === "FLAP" ? 1 : (-anteriorImageSign as 1 | -1);

  const cx =
    view === "FLAP"
      ? modelXToImage(position.x_offset_mm, origin, mmPerPx)
      : modelYToImageX(position.y_offset_mm, origin, mmPerPx, anteriorImageSign);
  const cy = origin.y + levelOffsetMm * pxPerMm;

  const toImage = (p: Point2D): Point2D => {
    const [q] = rotateAbout([p], pivot, rotationDeg);
    return { x: cx + flip * q.x * pxPerMm, y: cy + q.y * pxPerMm };
  };
  const silhouettePx = rotateAbout(shape.silhouette, pivot, rotationDeg).map((p) => ({ x: cx + flip * p.x * pxPerMm, y: cy + p.y * pxPerMm }));
  const pivotPx = { x: cx + flip * pivot.x * pxPerMm, y: cy + pivot.y * pxPerMm };
  return { cx, cy, pxPerMm, flip, rotationDeg, pivotPx, toImage, silhouettePx };
}

/** Width and height of a placed template on the scan, in millimetres (the inverse of drawing it). */
export function placedSizeMm(placement: OverlayPlacement, mmPerPx: number) {
  const e = extentsOf(placement.silhouettePx);
  return { widthMm: (e.maxX - e.minX) * mmPerPx, heightMm: (e.maxY - e.minY) * mmPerPx };
}
