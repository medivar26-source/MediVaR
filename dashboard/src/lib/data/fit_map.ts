/**
 * The top-down "fit map": the bone outline and the component seen from above, in millimetres.
 *
 * This is the one picture in which the component can move in both directions at once and turn, so the
 * map is also where it is dragged. These helpers build its shapes and turn a pointer into an offset.
 */

import type { Point2D } from "./coordinates";
import type { BoneModel, ComponentKind } from "./fit_markers";
import { estimatedTibialPlateauOutline, getFemoralImplant, getTibialImplant, placePolygon } from "./implant_templates";

export type MapPosition = { x_offset_mm: number; y_offset_mm: number; rotation_deg: number };

export type MapShapes = {
  /** The bone's outline at the cut, centred on the origin. */
  bone: Point2D[];
  /** The component's footprint where it is placed. */
  implant: Point2D[];
  /** The footprint at the origin, unrotated: its width and depth, for sizing handles. */
  implantHalfW: number;
  implantHalfH: number;
  /** The drawn frame is fixed for a bone and size, so the picture does not shift while dragging. */
  frameHalfW: number;
  frameHalfH: number;
};

/** Room around the picture: more above and below, where the labels and the rotation handle sit. */
export const MAP_MARGIN_X_MM = 12;
export const MAP_MARGIN_Y_MM = 17;
/** In-plane rotation limit of the AP overlay (V1: "minor 2-D alignment"). ENGINEERING_DERIVATION. */
export const ROTATION_LIMIT_DEG = 15;

const round1 = (v: number) => Number(v.toFixed(1));

export function mapShapes(kind: ComponentKind, size: number, bone: BoneModel, pos: MapPosition): MapShapes | undefined {
  if (!bone.complete || bone.mlMm === undefined || bone.apMm === undefined) return undefined;
  const ml = bone.mlMm;
  const ap = bone.apMm;

  // The map is a top-down ESTIMATE: the template's axial footprint over an outline scaled from the marked
  // medio-lateral and antero-posterior spans. Rotation is an in-plane (AP view) setting and does not move it.
  const tpl = kind === "tibial" ? getTibialImplant(size) : getFemoralImplant(size);
  const base: Point2D[] = tpl.footprint;
  const boneOutline: Point2D[] =
    kind === "tibial"
      ? estimatedTibialPlateauOutline(ml, ap)
      : [
          { x: -ml / 2, y: -ap / 2 },
          { x: ml / 2, y: -ap / 2 },
          { x: ml / 2, y: ap / 2 },
          { x: -ml / 2, y: ap / 2 },
        ];
  const implML = tpl.dimensionsMm.ml;
  const implAP = tpl.dimensionsMm.ap;

  return {
    bone: boneOutline,
    implant: placePolygon(base, pos.x_offset_mm, pos.y_offset_mm, 0),
    implantHalfW: implML / 2,
    implantHalfH: implAP / 2,
    frameHalfW: Math.max(ml, implML) / 2 + MAP_MARGIN_X_MM,
    frameHalfH: Math.max(ap, implAP) / 2 + MAP_MARGIN_Y_MM,
  };
}

/** The offsets after dragging from `from` to `to` (both in map millimetres), starting at `start`. */
export function offsetFromDrag(start: { x: number; y: number }, from: Point2D, to: Point2D) {
  return {
    x_offset_mm: round1(start.x + to.x - from.x),
    y_offset_mm: round1(start.y + to.y - from.y),
  };
}

/**
 * Rotation, in degrees clockwise, that puts the rotation handle (which sits straight up from the
 * component's centre when unrotated) under the pointer.
 */
export function rotationFromPointer(centre: Point2D, pointer: Point2D, limit = ROTATION_LIMIT_DEG): number {
  const raw = (Math.atan2(pointer.y - centre.y, pointer.x - centre.x) * 180) / Math.PI + 90;
  const wrapped = ((((raw + 180) % 360) + 360) % 360) - 180;
  return round1(Math.max(-limit, Math.min(limit, wrapped)));
}

/** Where the rotation handle is for a given rotation, `radius` millimetres from the centre. */
export function rotationHandlePoint(centre: Point2D, rotationDeg: number, radius: number): Point2D {
  const rad = (rotationDeg * Math.PI) / 180;
  return { x: centre.x + radius * Math.sin(rad), y: centre.y - radius * Math.cos(rad) };
}

export function pointsAttr(poly: Point2D[]): string {
  return poly.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}
