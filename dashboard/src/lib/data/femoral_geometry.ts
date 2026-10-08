import type { Point2D } from "./coordinates";
import { GENERIC_TKA_TEMPLATE, type ImplantTemplate } from "./implant_templates";

/**
 * Femoral geometry catalogue — a thin adapter over the implant-template module
 * (`lib/data/implant_templates`). The shapes are generic, engineering-derived templates, not a
 * manufacturer's implant (provenance ENGINEERING_DERIVATION, validation CLINICAL_APPROVAL_REQUIRED).
 *
 *   flapPolygon  outline in the AP (coronal) view — its width is the ML dimension
 *   klatPolygon  outline in the lateral (sagittal) view — its span is the AP dimension
 *   footprint    axial distal footprint
 */
export type FemoralGeometry = {
  size: number;
  apMm: number;
  mlMm: number;
  flapPolygon: Point2D[];
  klatPolygon: Point2D[];
  footprint: Point2D[];
};

function toGeometry(t: ImplantTemplate): FemoralGeometry {
  return {
    size: t.size,
    apMm: t.dimensionsMm.ap,
    mlMm: t.dimensionsMm.ml,
    flapPolygon: t.views.ap.silhouette,
    klatPolygon: t.views.lateral.silhouette,
    footprint: t.footprint,
  };
}

export const FEMORAL_GEOMETRY_CATALOG: Record<number, FemoralGeometry> = Object.fromEntries(
  GENERIC_TKA_TEMPLATE.femoralTemplates.map((t) => [t.size, toGeometry(t)]),
);
