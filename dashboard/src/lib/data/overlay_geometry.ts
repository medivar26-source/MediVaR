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
import { extentsOf, placePolygon } from "./implant_templates";
import { modelXToImage, modelYToImageX, type Origin } from "./fit_markers";

export type OverlayPlacement = {
  /** Image-pixel position of the template's local origin (the centre handle / rotation pivot). */
  cx: number;
  cy: number;
  /** Pixels per millimetre on this scan. */
  pxPerMm: number;
  /** Horizontal flip applied to the template's x (the lateral drawing, when anterior is on the image's right). */
  flip: 1 | -1;
  /** In-plane rotation actually applied (AP view only). */
  rotationDeg: number;
  /** The template silhouette in natural image pixels, after rotation, flip and translation. */
  silhouettePx: Point2D[];
};

export function placeTemplateInImage(args: {
  template: ImplantTemplate;
  view: "FLAP" | "KLAT";
  origin: Origin;
  mmPerPx: number;
  anteriorImageSign: 1 | -1;
  position: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number };
  levelOffsetMm?: number;
}): OverlayPlacement {
  const { template, view, origin, mmPerPx, anteriorImageSign, position, levelOffsetMm = 0 } = args;
  const pxPerMm = 1 / mmPerPx;
  const shape = view === "FLAP" ? template.views.ap : template.views.lateral;
  const rotationDeg = view === "FLAP" ? position.rotation_deg : 0;
  const flip: 1 | -1 = view === "FLAP" ? 1 : (-anteriorImageSign as 1 | -1);

  const cx =
    view === "FLAP"
      ? modelXToImage(position.x_offset_mm, origin, mmPerPx)
      : modelYToImageX(position.y_offset_mm, origin, mmPerPx, anteriorImageSign);
  const cy = origin.y + levelOffsetMm * pxPerMm;

  const turned = placePolygon(shape.silhouette, 0, 0, rotationDeg);
  const silhouettePx = turned.map((p) => ({ x: cx + flip * p.x * pxPerMm, y: cy + p.y * pxPerMm }));
  return { cx, cy, pxPerMm, flip, rotationDeg, silhouettePx };
}

/** Width and height of a placed template on the scan, in millimetres (the inverse of drawing it). */
export function placedSizeMm(placement: OverlayPlacement, mmPerPx: number) {
  const e = extentsOf(placement.silhouettePx);
  return { widthMm: (e.maxX - e.minX) * mmPerPx, heightMm: (e.maxY - e.minY) * mmPerPx };
}
