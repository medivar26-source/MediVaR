/**
 * The implant-template abstraction.
 *
 *   ImplantSystem
 *     ├─ tibialTemplates[]   (V1: sizes 1-6)
 *     └─ femoralTemplates[]  (V1: sizes 1-8)
 *
 * A template is a set of size-specific VECTOR outlines in millimetres — one per radiographic view plus
 * an axial footprint — generated deterministically from the size's AP and ML dimensions. They are
 * GENERIC engineering-derived shapes. They are not any manufacturer's implant, were not copied from any
 * CAD file, and have not been clinically validated.
 */

import type { Point2D } from "../coordinates";
import type { Extents } from "./geometry_util";

/** Where a geometry came from. Never "manufacturer" in this codebase. */
export type TemplateProvenance = "ENGINEERING_DERIVATION";
export type TemplateValidation = "CLINICAL_APPROVAL_REQUIRED";

export type LayerRole =
  | "baseplate"
  | "insert"
  | "stem"
  | "keel"
  | "condyle"
  | "flange"
  | "shell"
  | "box"
  | "detail";

export type TemplateLayer = {
  role: LayerRole;
  /** Closed polygon for filled layers, open polyline when `open` is true. Template-local mm. */
  path: Point2D[];
  open?: boolean;
  /** 0 = outline only. Fill opacity relative to the template colour. */
  fill: number;
};

export type ViewShape = {
  layers: TemplateLayer[];
  /** The outer outline of everything in the view. Extents and overhang are measured on this. */
  silhouette: Point2D[];
  extents: Extents;
};

export type ComponentKind = "tibial" | "femoral";

export type ImplantTemplate = {
  /** e.g. "GENERIC_TKA_TEMPLATE/tibial/3" */
  implantId: string;
  system: "GENERIC_TKA_TEMPLATE";
  component: ComponentKind;
  size: number;
  dimensionsMm: { ap: number; ml: number };
  views: {
    /** Coronal drawing for the AP / full-leg (FLAP) radiograph. x = medio-lateral, y down = distal. */
    ap: ViewShape;
    /** Sagittal drawing for the lateral (KLAT) radiograph. x = antero-posterior (posterior +), y down = distal. */
    lateral: ViewShape;
  };
  /** Axial (top-down) footprint: x = medio-lateral, y = antero-posterior (anterior −, posterior +). */
  footprint: Point2D[];
  /** Plain-language statement of the reference origin. */
  origin: string;
  coordinateSystem: string;
  constraints: { rotationLimitDeg: number; translationLimitMm: number };
  geometryVersion: string;
  provenance: TemplateProvenance;
  validationStatus: TemplateValidation;
};

export type ImplantSystem = {
  id: "GENERIC_TKA_TEMPLATE";
  geometryVersion: string;
  provenance: TemplateProvenance;
  validationStatus: TemplateValidation;
  notice: string;
  tibialTemplates: ImplantTemplate[];
  femoralTemplates: ImplantTemplate[];
};
