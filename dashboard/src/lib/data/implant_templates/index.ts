/**
 * `GENERIC_TKA_TEMPLATE` — the planner's implant system.
 *
 * This is a generic, engineering-derived template family. It is not a manufacturer's implant and has
 * not been clinically validated (provenance ENGINEERING_DERIVATION, validation CLINICAL_APPROVAL_REQUIRED).
 */

import { FEMORAL_SIZE_DIMENSIONS, TIBIAL_SIZE_DIMENSIONS } from "./dimensions";
import { buildFemoralTemplate, FEMORAL_GEOMETRY_VERSION } from "./femoral";
import { buildTibialTemplate, TIBIAL_GEOMETRY_VERSION } from "./tibial";
import type { ImplantSystem, ImplantTemplate } from "./types";

export * from "./types";
export * from "./dimensions";
export { estimatedTibialPlateauOutline } from "./tibial";
export { area, extentsOf, placePolygon } from "./geometry_util";

export const IMPLANT_SYSTEM_NOTICE =
  "Generic template shapes drawn for planning only. They are not a manufacturer's implant and are not clinically validated.";

const tibial = TIBIAL_SIZE_DIMENSIONS.map((d) => buildTibialTemplate(d.size));
const femoral = FEMORAL_SIZE_DIMENSIONS.map((d) => buildFemoralTemplate(d.size));

export const GENERIC_TKA_TEMPLATE: ImplantSystem = {
  id: "GENERIC_TKA_TEMPLATE",
  geometryVersion: `tibial ${TIBIAL_GEOMETRY_VERSION} / femoral ${FEMORAL_GEOMETRY_VERSION}`,
  provenance: "ENGINEERING_DERIVATION",
  validationStatus: "CLINICAL_APPROVAL_REQUIRED",
  notice: IMPLANT_SYSTEM_NOTICE,
  tibialTemplates: tibial,
  femoralTemplates: femoral,
};

/** The template for a tibial size; an unknown size falls back to size 3 (never throws mid-render). */
export function getTibialImplant(size: number): ImplantTemplate {
  return tibial.find((t) => t.size === size) ?? tibial[2];
}

/** The template for a femoral size; an unknown size falls back to size 4. */
export function getFemoralImplant(size: number): ImplantTemplate {
  return femoral.find((t) => t.size === size) ?? femoral[3];
}
