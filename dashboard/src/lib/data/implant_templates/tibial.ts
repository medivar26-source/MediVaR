/**
 * Generic tibial tray template (AP view, lateral view, axial footprint) and the estimated tibial
 * plateau outline used to judge coverage.
 *
 * ENGINEERING_DERIVATION. Every proportion below is a project choice made so the drawing reads like a
 * tibial component on a radiograph (plate, dished insert with a central eminence, tapered stem and keel).
 * None of it is manufacturer geometry and none of it is clinically validated.
 *
 * Template-local frame (millimetres):
 *   AP view      x = medio-lateral (image right +), y = distal (down +), origin = centre of the top of the baseplate
 *   Lateral view x = antero-posterior (posterior +), y = distal (down +), origin = middle of the baseplate AP span
 *   Footprint    x = medio-lateral, y = antero-posterior (anterior −, posterior +), origin = footprint centre
 */

import type { Point2D } from "../coordinates";
import { TIBIAL_SIZE_DIMENSIONS } from "./dimensions";
import { arc, extentsOf, roundedRect, smoothCurve, superEllipse } from "./geometry_util";
import type { ImplantTemplate, TemplateLayer, ViewShape } from "./types";

export const TIBIAL_GEOMETRY_VERSION = "1.0.0";

/** Shape exponent of the estimated bone outline (boxier than an ellipse) and of the tray inside it. */
const BONE_EXPONENT = 2.65;
const TRAY_EXPONENT = 2.45;

/**
 * The tibial plateau outline ESTIMATED from the two measured spans. It is a generic shape scaled to the
 * surgeon's medio-lateral and antero-posterior marks. It is NOT traced anatomy.
 */
export function estimatedTibialPlateauOutline(mlMm: number, apMm: number): Point2D[] {
  return superEllipse(mlMm / 2, apMm / 2, BONE_EXPONENT, 72);
}

/** Axial baseplate footprint: slightly tighter than the estimated bone, with a shallow posterior notch. */
function trayFootprint(mlMm: number, apMm: number): Point2D[] {
  const pts = superEllipse(mlMm / 2, apMm / 2, TRAY_EXPONENT, 72);
  const notchHalfWidth = mlMm * 0.11;
  const notchDepth = apMm * 0.07;
  return pts.map((p) => {
    if (p.y > 0 && Math.abs(p.x) < notchHalfWidth) {
      const k = 1 - (p.x / notchHalfWidth) ** 2; // 1 at the centre, 0 at the notch edge
      return { x: p.x, y: p.y - notchDepth * k };
    }
    return p;
  });
}

const shape = (layers: TemplateLayer[], silhouette: Point2D[]): ViewShape => ({
  layers,
  silhouette,
  extents: extentsOf(silhouette),
});

function apView(ml: number): ViewShape {
  const half = ml / 2;
  const t = Math.round(ml * 0.06 * 10) / 10; // baseplate thickness
  const h = ml * 0.12; // insert height at its peripheral lip
  const stemLen = ml * 0.5;
  const stemRoot = ml * 0.2;
  const stemTip = ml * 0.05;
  const wingTop = ml * 0.5;
  const wingDepth = ml * 0.22;

  const base = roundedRect(-half, 0, half, t, Math.min(1.2, t / 2));

  // Insert: the top surface is dished on the medial and lateral sides with a central eminence.
  const ctrl: Point2D[] = [
    [-1.0, 0.88], [-0.86, 1.0], [-0.56, 0.74], [-0.3, 0.7], [-0.14, 0.92], [0, 1.12],
    [0.14, 0.92], [0.3, 0.7], [0.56, 0.74], [0.86, 1.0], [1.0, 0.88],
  ].map(([u, v]) => ({ x: u * (half - 0.6), y: -h * v }));
  const top = smoothCurve(ctrl, 6);
  const insert: Point2D[] = [{ x: -(half - 0.6), y: 0 }, ...top, { x: half - 0.6, y: 0 }];

  // Keel wings and the tapered central stem below the plate.
  const wings: Point2D[] = [
    { x: -wingTop / 2, y: t },
    { x: wingTop / 2, y: t },
    { x: stemRoot / 2 + 1.2, y: t + wingDepth },
    { x: -stemRoot / 2 - 1.2, y: t + wingDepth },
  ];
  const tipR = stemTip / 2;
  const stem: Point2D[] = [
    { x: -stemRoot / 2, y: t },
    { x: stemRoot / 2, y: t },
    { x: tipR, y: t + stemLen - tipR },
    ...arc(0, t + stemLen - tipR, tipR, 0, 180, 6),
    { x: -tipR, y: t + stemLen - tipR },
  ];

  const silhouette: Point2D[] = [
    ...top.map((p) => p),
    { x: half - 0.6, y: 0 },
    { x: half, y: 0 },
    { x: half, y: t },
    { x: wingTop / 2, y: t },
    { x: stemRoot / 2 + 1.2, y: t + wingDepth },
    { x: tipR, y: t + stemLen - tipR },
    ...arc(0, t + stemLen - tipR, tipR, 0, 180, 6),
    { x: -tipR, y: t + stemLen - tipR },
    { x: -stemRoot / 2 - 1.2, y: t + wingDepth },
    { x: -wingTop / 2, y: t },
    { x: -half, y: t },
    { x: -half, y: 0 },
    { x: -(half - 0.6), y: 0 },
  ];

  const layers: TemplateLayer[] = [
    { role: "keel", path: wings, fill: 0.45 },
    { role: "stem", path: stem, fill: 0.55 },
    { role: "baseplate", path: base, fill: 0.9 },
    { role: "insert", path: insert, fill: 0.35 },
    { role: "detail", open: true, fill: 0, path: [{ x: 0, y: t + 2 }, { x: 0, y: t + stemLen - 4 }] },
  ];
  return shape(layers, silhouette);
}

function lateralView(ml: number, ap: number): ViewShape {
  const half = ap / 2;
  const t = Math.round(ml * 0.06 * 10) / 10;
  const h = ap * 0.19;
  const stemLen = ml * 0.5;
  const stemRoot = ap * 0.26;
  const stemTip = ap * 0.06;
  const stemX = -ap * 0.06;

  // Baseplate: rounded anterior corners, chamfered posterior edge.
  const base: Point2D[] = [
    ...arc(-half + 1.4, 1.4, 1.4, 180, 270, 5),
    { x: half - 1.6, y: 0 },
    { x: half, y: t * 0.6 },
    { x: half - 0.8, y: t },
    ...arc(-half + 1.4, t - 1.4, 1.4, 90, 180, 5),
  ];

  // Insert: raised anterior lip, a dish, and a lower posterior rise. No slope is modelled (not a V1 parameter).
  const ctrl: Point2D[] = [
    [-1.0, 0.86], [-0.9, 1.08], [-0.55, 0.8], [-0.15, 0.62], [0.35, 0.8], [0.8, 1.0], [1.0, 0.84],
  ].map(([u, v]) => ({ x: u * (half - 0.5), y: -h * v }));
  const top = smoothCurve(ctrl, 7);
  const insert: Point2D[] = [{ x: -(half - 0.5), y: 0 }, ...top, { x: half - 0.5, y: 0 }];

  const tipR = stemTip / 2;
  const stem: Point2D[] = [
    { x: stemX - stemRoot / 2, y: t },
    { x: stemX + stemRoot / 2, y: t },
    { x: stemX + tipR, y: t + stemLen - tipR },
    ...arc(stemX, t + stemLen - tipR, tipR, 0, 180, 6),
    { x: stemX - tipR, y: t + stemLen - tipR },
  ];

  const silhouette: Point2D[] = [
    ...top,
    { x: half - 0.5, y: 0 },
    { x: half, y: t * 0.6 },
    { x: half - 0.8, y: t },
    { x: stemX + stemRoot / 2, y: t },
    { x: stemX + tipR, y: t + stemLen - tipR },
    ...arc(stemX, t + stemLen - tipR, tipR, 0, 180, 6),
    { x: stemX - tipR, y: t + stemLen - tipR },
    { x: stemX - stemRoot / 2, y: t },
    { x: -half + 1.4, y: t },
    { x: -half, y: t - 1.4 },
    { x: -half, y: 1.4 },
    { x: -(half - 0.5), y: 0 },
  ];

  const layers: TemplateLayer[] = [
    { role: "stem", path: stem, fill: 0.55 },
    { role: "baseplate", path: base, fill: 0.9 },
    { role: "insert", path: insert, fill: 0.35 },
  ];
  return shape(layers, silhouette);
}

export function buildTibialTemplate(size: number): ImplantTemplate {
  const dims = TIBIAL_SIZE_DIMENSIONS.find((d) => d.size === size) ?? TIBIAL_SIZE_DIMENSIONS[2];
  const { apMm: ap, mlMm: ml } = dims;
  return {
    implantId: `GENERIC_TKA_TEMPLATE/tibial/${dims.size}`,
    system: "GENERIC_TKA_TEMPLATE",
    component: "tibial",
    size: dims.size,
    dimensionsMm: { ap, ml },
    views: { ap: apView(ml), lateral: lateralView(ml, ap) },
    footprint: trayFootprint(ml, ap),
    origin:
      "AP view: centre of the top surface of the baseplate. Lateral view: middle of the baseplate antero-posterior span, top surface. Footprint: centre of the tray outline.",
    coordinateSystem:
      "Millimetres, template-local, y down. AP view x = medio-lateral. Lateral view x = antero-posterior (posterior positive). Footprint y = antero-posterior (anterior negative).",
    constraints: { rotationLimitDeg: 15, translationLimitMm: 12 },
    geometryVersion: TIBIAL_GEOMETRY_VERSION,
    provenance: "ENGINEERING_DERIVATION",
    validationStatus: "CLINICAL_APPROVAL_REQUIRED",
  };
}
