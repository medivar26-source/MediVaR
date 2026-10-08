/**
 * Generic femoral component template (AP view, lateral view, axial footprint).
 *
 * ENGINEERING_DERIVATION. The proportions are project choices made so the drawing reads like a
 * cruciate-retaining femoral component on a radiograph: two condyles with an intercondylar box and an
 * anterior flange in the AP view, and a J-shaped outer profile with five bone-facing cut lines in the
 * lateral view. None of it is manufacturer geometry and none of it is clinically validated.
 *
 * Template-local frame (millimetres, y down):
 *   AP view      x = medio-lateral (image right +); origin = mid-ML at the widest part of the condyles (14 % of AP above the distal surface)
 *   Lateral view x = antero-posterior (posterior +); origin = mid-AP, 30 % of AP above the distal-most surface
 *   Footprint    x = medio-lateral, y = antero-posterior (anterior −, posterior +)
 * The origin is where the template sits on the surgeon's bone marks and is the pivot for in-plane rotation.
 */

import type { Point2D } from "../coordinates";
import { FEMORAL_SIZE_DIMENSIONS } from "./dimensions";
import { arc, extentsOf, smoothCurve, superEllipse } from "./geometry_util";
import type { ImplantTemplate, TemplateLayer, ViewShape } from "./types";

export const FEMORAL_GEOMETRY_VERSION = "1.0.0";

const shape = (layers: TemplateLayer[], silhouette: Point2D[]): ViewShape => ({
  layers,
  silhouette,
  extents: extentsOf(silhouette),
});

const shift = (pts: Point2D[], dy: number): Point2D[] => pts.map((p) => ({ x: p.x, y: p.y + dy }));

/** Move a whole view down by `dy` so the template's local origin sits where the surgeon's bone marks sit. */
function reanchor(view: ViewShape, dy: number): ViewShape {
  return shape(
    view.layers.map((l) => ({ ...l, path: shift(l.path, dy) })),
    shift(view.silhouette, dy),
  );
}

/**
 * Coronal drawing: a tapered anterior flange above, two rounded condyles below and the intercondylar
 * notch between them. The outer outline is a smooth curve through control points given as fractions of
 * the half-width (x) and of the AP dimension (y, negative = proximal), mirrored left and right.
 */
function apView(ml: number, ap: number): ViewShape {
  const hw = ml / 2;
  const nh = hw * 0.3; // half-width of the intercondylar notch
  const boxTop = -ap * 0.2;
  const shoulderY = -ap * 0.27;

  const right: Point2D[] = (
    [
      [0.0, -0.6],
      [0.38, -0.625],
      [0.62, -0.6],
      [0.7, -0.5],
      [0.8, -0.37],
      [0.93, -0.27],
      [1.0, -0.2],
      [1.0, -0.1],
      [0.94, -0.035],
      [0.82, 0.0],
      [0.55, 0.012],
      [0.34, 0.0],
    ] as [number, number][]
  ).map(([u, v]) => ({ x: u * hw, y: v * ap }));
  const rough = smoothCurve(right, 5);
  // A spline can overshoot its widest control point slightly; hold the width at exactly the ML dimension.
  const widest = Math.max(...rough.map((p) => Math.abs(p.x)));
  const outerR = rough.map((p) => ({ x: p.x * (hw / widest), y: p.y }));
  const outerL = outerR.map((p) => ({ x: -p.x, y: p.y }));

  // One closed outline, clockwise from the top centre: right outer curve, notch walls, left outer curve.
  const silhouette: Point2D[] = [
    ...outerR,
    { x: nh, y: -ap * 0.04 },
    { x: nh, y: boxTop },
    { x: -nh, y: boxTop },
    { x: -nh, y: -ap * 0.04 },
    ...outerL.slice().reverse(),
  ];

  const lowerR = outerR.filter((p) => p.y >= shoulderY);
  const lateral: Point2D[] = [{ x: hw * 0.93, y: shoulderY }, ...lowerR, { x: nh, y: -ap * 0.04 }, { x: nh, y: boxTop }];
  const medial: Point2D[] = lateral.map((p) => ({ x: -p.x, y: p.y }));
  const upperR = outerR.filter((p) => p.y <= shoulderY);
  const flange: Point2D[] = [...upperR, { x: hw * 0.93, y: shoulderY }, { x: -hw * 0.93, y: shoulderY }, ...upperR.map((p) => ({ x: -p.x, y: p.y })).reverse()];

  // Trochlear groove and the bone-facing box line, drawn as detail.
  const groove: Point2D[] = [{ x: 0, y: -ap * 0.57 }, { x: 0.015 * ml, y: -ap * 0.4 }, { x: 0, y: boxTop }];

  const layers: TemplateLayer[] = [
    { role: "flange", path: flange, fill: 0.4 },
    { role: "condyle", path: medial, fill: 0.55 },
    { role: "condyle", path: lateral, fill: 0.55 },
    { role: "detail", open: true, fill: 0, path: groove },
    { role: "box", open: true, fill: 0, path: [{ x: -nh, y: boxTop }, { x: nh, y: boxTop }] },
  ];
  return shape(layers, silhouette);
}

/**
 * Sagittal drawing. Outer J-curve: anterior flange → anterior chamfer → distal arc → posterior condyle
 * arc. The component is a shell; its bone-facing side is the classic five cuts (anterior, anterior chamfer,
 * distal, posterior chamfer, posterior). The shell outline is drawn as one closed polygon.
 */
function lateralView(ml: number, ap: number): ViewShape {
  const half = ap / 2;
  const tA = ap * 0.11; // anterior flange thickness
  const tD = ap * 0.15; // distal thickness
  const tP = ap * 0.15; // posterior condyle thickness
  const rp = ap * 0.36; // posterior condyle radius
  const flangeLen = ap * 0.6; // how far the flange runs proximally from the distal surface
  const xp = half - rp; // x of the distal-most point of the posterior condyle circle

  // The distal surface is a shallow arc that rises (towards proximal, i.e. negative y) towards the front.
  const R = ap * 1.7;
  const distalY = (x: number) => -(R - Math.sqrt(R * R - (x - xp) * (x - xp)));
  const anteriorChamferX = -half + ap * 0.2;
  const yChamferStart = distalY(anteriorChamferX);
  const yFlangeBottom = yChamferStart - ap * 0.2; // distal end of the anterior flange surface

  // Anterior surface: smooth, slightly concave (trochlear), from the proximal tip down to the chamfer.
  const anteriorSurface = smoothCurve(
    [
      { x: -half + ap * 0.04, y: -flangeLen },
      { x: -half + ap * 0.012, y: yFlangeBottom - (flangeLen + yFlangeBottom) * 0.55 },
      { x: -half, y: yFlangeBottom },
    ],
    10,
  );
  const chamfer: Point2D[] = [{ x: anteriorChamferX, y: yChamferStart }];
  const distal: Point2D[] = [];
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const x = anteriorChamferX + ((xp - anteriorChamferX) * i) / steps;
    distal.push({ x, y: distalY(x) });
  }
  // Posterior condyle: circle centred (xp, -rp), from its lowest point round the back (via its widest point).
  const posterior = [...arc(xp, -rp, rp, 90, 0, 12), ...arc(xp, -rp, rp, 0, -22, 4).slice(1)];

  const outer = [...anteriorSurface, ...chamfer, ...distal.slice(0, -1), ...posterior];

  // --- bone-facing cuts, from the posterior tip back to the proximal tip of the flange ---
  const xAC = -half + tA; // anterior cut
  const xPC = half - tP; // posterior cut
  const yDC = -tD; // distal cut
  const chamferRun = ap * 0.09;
  const lastOuter = outer[outer.length - 1];
  const inner: Point2D[] = [
    { x: xPC, y: lastOuter.y },
    { x: xPC, y: yDC - chamferRun },
    { x: xPC - chamferRun, y: yDC },
    { x: xAC + chamferRun, y: yDC },
    { x: xAC, y: yDC - chamferRun },
    { x: xAC, y: -flangeLen + 0.5 },
  ];

  const silhouette = [...outer, ...inner];
  const layers: TemplateLayer[] = [
    { role: "shell", path: silhouette, fill: 0.45 },
    // The bone-facing cut lines, drawn as a detail so the notching verification has a visible reference.
    { role: "box", open: true, fill: 0, path: inner },
  ];
  return shape(layers, silhouette);
}

/** Axial distal footprint: two lobes with the intercondylar notch opening posteriorly. */
function footprint(ml: number, ap: number): Point2D[] {
  const pts = superEllipse(ml / 2, ap / 2, 2.3, 72);
  const nhw = ml * 0.14;
  const floor = ap * 0.05;
  return pts.map((p) => (p.y > floor && Math.abs(p.x) < nhw ? { x: p.x, y: floor } : p));
}

export function buildFemoralTemplate(size: number): ImplantTemplate {
  const dims = FEMORAL_SIZE_DIMENSIONS.find((d) => d.size === size) ?? FEMORAL_SIZE_DIMENSIONS[3];
  const { apMm: ap, mlMm: ml } = dims;
  return {
    implantId: `GENERIC_TKA_TEMPLATE/femoral/${dims.size}`,
    system: "GENERIC_TKA_TEMPLATE",
    component: "femoral",
    size: dims.size,
    dimensionsMm: { ap, ml },
    views: {
      // The local origin is the point that sits on the surgeon's bone marks (and is the pivot / centre handle).
      ap: reanchor(apView(ml, ap), ap * 0.14),
      lateral: reanchor(lateralView(ml, ap), ap * 0.3),
    },
    footprint: footprint(ml, ap),
    origin:
      "AP view: mid-ML at the widest part of the condyles (the pivot / centre handle). Lateral view: mid-AP, 30 % of the AP dimension above the distal-most surface. Footprint: centre of the distal outline.",
    coordinateSystem:
      "Millimetres, template-local, y down. AP view x = medio-lateral. Lateral view x = antero-posterior (posterior positive). Footprint y = antero-posterior (anterior negative).",
    constraints: { rotationLimitDeg: 15, translationLimitMm: 12 },
    geometryVersion: FEMORAL_GEOMETRY_VERSION,
    provenance: "ENGINEERING_DERIVATION",
    validationStatus: "CLINICAL_APPROVAL_REQUIRED",
  };
}
