/**
 * A geometric model of one leg, and the two radiographs drawn from it.
 *
 * Everything that a learner later measures is a CHOSEN number here, not something read off a picture:
 * the joint lines are drawn at the chosen LDFA and MPTA, the canal at the chosen AMA, the plateau at the
 * chosen slope, and the bones at the chosen widths and depths. The landmark positions come out of the
 * same construction, so the case data and the scan agree exactly (the generator then re-measures them
 * with the planner's own code to prove it).
 *
 * Canonical build: a RIGHT leg on a standard AP film (patient's right on the viewer's left), so medial is
 * +x and lateral is -x. A left leg is the mirror image. Millimetres, y down.
 *
 * The bone shapes are drawing aids modelled on textbook proportions. The distal femur and the tibial
 * plateau follow the planner's generic component outlines (`lib/data/implant_templates`), so a correctly
 * sized and placed component sits flush on the drawn bone.
 */

import { arc as templateArc, smoothCurve } from "../../src/lib/data/implant_templates/geometry_util";
import {
  add, at, closedSpline, dot, ellipse, extreme, intersect, len, lineDistance, lerp, mirrorX, mul, openSpline, pt,
  rot, rotAbout, roundCorners, sub, tube, turnTowards, unit, type Frame, type P,
} from "./geometry";

export type Side = "right" | "left";

export type LegModel = {
  side: Side;
  /** Hip centre to knee centre, and knee centre to ankle centre (mm). */
  femurLength: number;
  tibiaLength: number;
  /** Mechanical LDFA and MPTA, joint-line convergence (+ opens the lateral side) and the anatomical-mechanical angle (degrees). */
  ldfa: number;
  mpta: number;
  jlca: number;
  ama: number;
  /** Posterior tibial slope (degrees). The lateral film is taken with the knee flexed by the same amount, so the plateau is level. */
  pts: number;
  /** A healed tibial shaft fracture: where (share of the tibia from the knee) and how much extra varus (+) or valgus (-). */
  malunion?: { at: number; angleDeg: number };
  /** Distal femur: width at the condyles and depth (anterior cortex to back of the posterior condyle); femoral head radius; shaft half-width. */
  femur: { ml: number; ap: number; headRadius: number; shaftHalf: number };
  /** Tibial plateau width and depth; shaft half-width. */
  tibia: { ml: number; ap: number; shaftHalf: number };
  /** Joint space left in the worn compartment (mm). */
  wornGapMm: number;
  /** Size of the marginal osteophytes on the worn side (mm). 0 for none. */
  osteophyteMm: number;
  /** Soft-tissue girth, 1 = average build. */
  girth: number;
  /** Scale of each film (mm per pixel). */
  apMmPerPx: number;
  latMmPerPx: number;
};

/* ------------------------------------------------------------------------------------------------ */
/* What a film is made of                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export type BoneLayer = {
  kind: "bone";
  id: string;
  /** Filled outlines whose union is the bone. */
  parts: P[][];
  /** Openings through the first part (the obturator foramen). */
  holes?: P[][];
  /** Density of the cancellous bone, the extra brightness at the cortex, and how deep the cortex runs (mm). */
  base: number;
  rim: number;
  cortexMm: number;
  /** Strength of the trabecular texture. */
  texture: number;
};
export type Layer =
  | BoneLayer
  | { kind: "soft"; path: P[]; opacity: number; blurMm: number }
  | { kind: "shade"; path: P[]; opacity: number; blurMm: number; tone: "dark" | "light" }
  | { kind: "stroke"; path: P[]; widthMm: number; opacity: number; blurMm: number };

export type Label = { text: string; at: P; sizeMm: number; anchor: "start" | "middle" | "end"; opacity: number; boxed?: boolean; bold?: boolean };

export type Film = {
  view: "FLAP" | "KLAT";
  widthMm: number;
  heightMm: number;
  mmPerPx: number;
  layers: Layer[];
  /** The 25 mm calibration sphere. */
  marker: { centre: P; diameterMm: number };
  labels: Label[];
  /** Assessment landmarks on this film (film millimetres). */
  landmarks: Record<string, P>;
  /** Bone-edge marks for the component fit on this film (film millimetres). */
  fitMarkers: { tibial: Record<string, P>; femoral: Record<string, P> };
};

/* ------------------------------------------------------------------------------------------------ */
/* Shared pieces                                                                                     */
/* ------------------------------------------------------------------------------------------------ */

/** Piecewise-linear profile through [t, value] pairs. */
function profile(points: [number, number][]): (t: number) => number {
  return (t) => {
    if (t <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [t1, v1] = points[i];
      const [t0, v0] = points[i - 1];
      if (t <= t1) return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
    }
    return points[points.length - 1][1];
  };
}

/**
 * The outer outline of the distal femur seen from the front, from the planner's generic femoral
 * component (same control points as `implant_templates/femoral.ts`, AP view), cut off above the
 * condyles. Template-local: x = medio-lateral, y down, the lowest points of both condyles on y = 0.
 */
function femoralCondylesAP(ml: number, ap: number): { outline: P[]; lowestX: number } {
  const hw = ml / 2;
  const right = (
    [
      [0.93, -0.27], [1.0, -0.2], [1.0, -0.1], [0.94, -0.035], [0.82, 0.0], [0.55, 0.012], [0.34, 0.0],
    ] as [number, number][]
  ).map(([u, v]) => ({ x: u * hw, y: v * ap }));
  const rough = smoothCurve(right, 6);
  const widest = Math.max(...rough.map((p) => Math.abs(p.x)));
  const outer = rough.map((p) => ({ x: p.x * (hw / widest), y: p.y }));
  const lowest = outer.reduce((a, b) => (b.y > a.y ? b : a));
  const lifted = outer.map((p) => ({ x: p.x, y: p.y - lowest.y }));
  const nh = hw * 0.3;
  const boxTop = -ap * 0.2 - lowest.y;
  const top = -ap * 0.3;
  const outline: P[] = [
    { x: hw * 0.9, y: top },
    ...lifted,
    { x: nh, y: -ap * 0.04 - lowest.y },
    { x: nh * 0.8, y: boxTop + 1.5 },
    { x: 0, y: boxTop - 0.5 },
    { x: -nh * 0.8, y: boxTop + 1.5 },
    { x: -nh, y: -ap * 0.04 - lowest.y },
    ...lifted.map((p) => ({ x: -p.x, y: p.y })).reverse(),
    { x: -hw * 0.9, y: top },
  ];
  return { outline, lowestX: lowest.x };
}

/**
 * The outer J-curve of the distal femur seen from the side, from the planner's generic femoral component
 * (same construction as `implant_templates/femoral.ts`, lateral view). Template-local: x = antero-posterior
 * with POSTERIOR positive, y down, the distal-most point on y = 0.
 */
function femoralProfileLateral(ap: number) {
  const half = ap / 2;
  const rp = ap * 0.36;
  const flangeLen = ap * 0.6;
  const xp = half - rp;
  const R = ap * 1.7;
  const distalY = (x: number) => -(R - Math.sqrt(R * R - (x - xp) * (x - xp)));
  const chamferX = -half + ap * 0.2;
  const yChamfer = distalY(chamferX);
  const yFlangeBottom = yChamfer - ap * 0.2;
  const anterior = smoothCurve(
    [
      { x: -half + ap * 0.04, y: -flangeLen },
      { x: -half + ap * 0.012, y: yFlangeBottom - (flangeLen + yFlangeBottom) * 0.55 },
      { x: -half, y: yFlangeBottom },
    ],
    10,
  );
  const distal: P[] = [];
  for (let i = 1; i <= 14; i++) {
    const x = chamferX + ((xp - chamferX) * i) / 14;
    distal.push({ x, y: distalY(x) });
  }
  const posterior = [...templateArc(xp, -rp, rp, 90, 0, 12), ...templateArc(xp, -rp, rp, 0, -100, 18).slice(1)];
  return {
    outer: [...anterior, { x: chamferX, y: yChamfer }, ...distal.slice(0, -1), ...posterior],
    anteriorMost: { x: -half, y: yFlangeBottom },
    posteriorMost: { x: half, y: -rp },
    flangeTip: { x: -half + ap * 0.04, y: -flangeLen },
    condyleCentre: { x: xp, y: -rp },
    rp,
  };
}

const bone = (id: string, parts: P[][], o: Partial<Omit<BoneLayer, "kind" | "id" | "parts">> = {}): BoneLayer => ({
  kind: "bone",
  id,
  parts,
  holes: o.holes,
  base: o.base ?? 0.44,
  rim: o.rim ?? 0.95,
  cortexMm: o.cortexMm ?? 2.2,
  texture: o.texture ?? 0.16,
});

/* ------------------------------------------------------------------------------------------------ */
/* AP full-length film                                                                              */
/* ------------------------------------------------------------------------------------------------ */

export function buildAP(m: LegModel): Film {
  const g = m.girth;
  const K = pt(0, 0);
  const aUp = pt(0, -1);
  const H = mul(aUp, m.femurLength);

  // Femoral joint line at the chosen LDFA (towards lateral, -x), and the tibial line at the chosen convergence.
  const dFJ = turnTowards(aUp, m.ldfa, (v) => -v.x);
  const eM = mul(dFJ, -1);
  const nUpF = turnTowards(eM, 90, (v) => -v.y);
  const eT = unit(rot(eM, -m.jlca));
  const nDownT = turnTowards(eT, 90, (v) => v.y);
  // The tibial axis leaves the joint line at the chosen MPTA, on the medial side.
  const tDown = turnTowards(eT, m.mpta, (v) => v.y);

  const hw = m.femur.ml / 2;
  const fem = femoralCondylesAP(m.femur.ml, m.femur.ap);
  const sC = fem.lowestX;

  // Joint space: the worn compartment keeps `wornGapMm` at its contact point.
  let gap = 4;
  let Fc = K;
  let Tc = K;
  for (let i = 0; i < 4; i++) {
    Fc = add(K, mul(nUpF, gap / 2));
    Tc = add(K, mul(nDownT, gap / 2));
    const gapAt = (s: number) => lineDistance(add(Fc, mul(eM, s)), Tc, eT, mul(nDownT, -1));
    const worn = Math.min(gapAt(sC), gapAt(-sC));
    gap += m.wornGapMm - worn;
  }
  const gapAt = (s: number) => lineDistance(add(Fc, mul(eM, s)), Tc, eT, mul(nDownT, -1));
  const medialGap = gapAt(sC);
  const lateralGap = gapAt(-sC);
  if (m.jlca !== 0 && Math.sign(lateralGap - medialGap) !== Math.sign(m.jlca)) {
    throw new Error("joint-line convergence drawn the wrong way round");
  }
  const wornSide = medialGap <= lateralGap ? 1 : -1; // +1 medial, -1 lateral

  // Tibia: straight, or bent at the healed fracture.
  const Lt = m.tibiaLength;
  let A: P;
  let tibAxis: P[];
  let dDist = tDown;
  if (m.malunion) {
    const l1 = m.malunion.at * Lt;
    const bend = add(K, mul(tDown, l1));
    dDist = turnTowards(tDown, Math.abs(m.malunion.angleDeg), (v) => (m.malunion!.angleDeg >= 0 ? v.x : -v.x));
    A = add(bend, mul(dDist, Lt - l1));
    tibAxis = [K, bend, A];
  } else {
    A = add(K, mul(tDown, Lt));
    tibAxis = [K, A];
  }

  // Femoral anatomical axis at the chosen AMA (towards lateral), through the knee centre; the neck at 128 degrees.
  const aAup = turnTowards(aUp, m.ama, (v) => -v.x);
  const latF = turnTowards(aAup, 90, (v) => -v.x);
  const medF = mul(latF, -1);
  const neckDir = turnTowards(aAup, 52, (v) => v.x);
  const N0 = intersect(H, neckDir, K, aAup);
  const shaftF = m.femur.shaftHalf;

  const layers: Layer[] = [];
  const femurParts: P[][] = [];
  const shaftTop = add(N0, mul(aAup, 22));
  const shaftBottom = add(K, mul(aAup, 78));
  const fp = profile([[0, 1.32], [0.1, 1.12], [0.35, 1.0], [0.65, 0.97], [0.9, 1.0], [1, 1.04]]);
  femurParts.push(tube([shaftTop, shaftBottom], (t) => [shaftF * fp(t), shaftF * fp(t)]));
  // Head, neck and trochanters.
  femurParts.push(ellipse(H, m.femur.headRadius, m.femur.headRadius, 0, 64));
  const neckProfile = profile([[0, 0.66], [0.45, 0.6], [0.85, 0.8], [1, 1.0]]);
  femurParts.push(tube([add(H, mul(neckDir, -m.femur.headRadius * 0.2)), add(N0, mul(aAup, -6))], (t) => {
    const w = m.femur.headRadius * neckProfile(t);
    return [w, w];
  }));
  const tilt = (Math.atan2(aAup.x, -aAup.y) * 180) / Math.PI;
  const GT = add(add(N0, mul(aAup, 10)), mul(latF, shaftF + 3));
  femurParts.push(ellipse(GT, 19, 27, tilt, 40));
  const LT = add(add(N0, mul(aAup, -44)), mul(medF, shaftF + 1));
  femurParts.push(ellipse(LT, 8, 13, tilt - 25, 32));
  femurParts.push(
    closedSpline([
      add(GT, mul(latF, 8)),
      add(add(N0, mul(aAup, -60)), mul(latF, shaftF * 1.15)),
      add(add(N0, mul(aAup, -62)), mul(medF, shaftF * 1.12)),
      add(add(N0, mul(aAup, -18)), mul(medF, shaftF * 1.15)),
      add(N0, mul(aAup, 26)),
    ]),
  );
  // Distal femur: the condyles on the joint line, and the metaphysis flaring up into the shaft.
  const jf: Frame = { origin: Fc, e1: eM, e2: mul(nUpF, -1) };
  const condyles = fem.outline.map((p) => at(jf, p.x, p.y));
  femurParts.push(condyles);
  const sf = (t: number, w: number) => add(add(K, mul(aAup, t)), mul(medF, w));
  femurParts.push(
    closedSpline([
      at(jf, -hw * 0.93, -m.femur.ap * 0.27),
      at(jf, -hw * 0.86, -m.femur.ap * 0.52),
      sf(58, -(shaftF + 9)),
      sf(80, -(shaftF + 2.5)),
      sf(110, -(shaftF * 1.02)),
      sf(140, -shaftF),
      sf(140, shaftF),
      sf(110, shaftF * 1.02),
      sf(80, shaftF + 3),
      sf(58, shaftF + 10),
      at(jf, hw * 0.86, -m.femur.ap * 0.52),
      at(jf, hw * 0.93, -m.femur.ap * 0.27),
      at(jf, hw * 0.3, -m.femur.ap * 0.25),
      at(jf, -hw * 0.3, -m.femur.ap * 0.25),
    ]),
  );
  if (m.osteophyteMm > 0) {
    const s = wornSide;
    femurParts.push([at(jf, s * hw * 0.97, -3.5), at(jf, s * (hw + m.osteophyteMm * 0.8), -1.2), at(jf, s * hw * 0.9, -0.6)]);
  }

  // Tibia: plateau on the tibial joint line, metaphysis, shaft, plafond and malleolus.
  const thw = m.tibia.ml / 2;
  const rc = 2.2;
  const jt: Frame = { origin: Tc, e1: eT, e2: nDownT };
  const tAxisPoint = (t: number) => {
    if (tibAxis.length === 2) return add(K, mul(tDown, t));
    const l1 = len(sub(tibAxis[1], K));
    return t <= l1 ? add(K, mul(tDown, t)) : add(tibAxis[1], mul(dDist, t - l1));
  };
  const nT = turnTowards(tDown, 90, (v) => v.x); // towards medial
  const st = (t: number, w: number) => add(tAxisPoint(t), mul(nT, w));
  const shaftT = m.tibia.shaftHalf;
  const plateauTop: P[] = [];
  const dip = (a: number) => {
    const side = Math.abs(a);
    if (side < 7) return -5.2 * Math.exp(-((side - 3) ** 2) / (2 * 1.7 ** 2)) * Math.min(1, (7 - side) / 2); // the tibial spines rise into the notch
    const mid = (7 + thw - rc) / 2;
    return 0.6 * Math.max(0, 1 - Math.abs(side - mid) / ((thw - rc - 7) / 2)); // shallow dish of each plateau
  };
  for (let a = -thw + rc; a <= thw - rc + 1e-6; a += 0.5) plateauTop.push(at(jt, a, dip(a)));
  const tibiaBlock: P[] = [
    ...templateArc(-thw + rc, rc, rc, 270, 180, 6).map((p) => at(jt, p.x, p.y)).slice(0, -1),
    ...plateauTop.slice(1),
    ...templateArc(thw - rc, rc, rc, 270, 360, 6).map((p) => at(jt, p.x, p.y)).slice(1),
    ...openSpline([at(jt, thw, rc + 0.6), at(jt, thw - 0.6, 10), at(jt, thw - 3.5, 21), st(52, shaftT + 9), st(80, shaftT + 2.5), st(110, shaftT * 0.97)], 8).slice(1),
    ...openSpline([st(110, -shaftT * 0.97), st(80, -(shaftT + 2.2)), st(54, -(shaftT + 8)), at(jt, -thw + 4, 22), at(jt, -thw + 0.8, 10), at(jt, -thw, rc + 0.6)], 8),
  ];
  const tibiaParts: P[][] = [tibiaBlock];
  if (m.osteophyteMm > 0) {
    const s = wornSide;
    tibiaParts.push(closedSpline([at(jt, s * (thw - 0.6), rc + 0.2), at(jt, s * (thw + m.osteophyteMm * 0.5), rc + 2.6), at(jt, s * (thw + m.osteophyteMm * 0.2), rc + 5.5), at(jt, s * (thw - 1.5), rc + 7.5)], 6));
  }
  const tp = profile([[0, 1.05], [0.25, 0.95], [0.65, 0.84], [0.9, 0.95], [1, 1.12]]);
  const tShaftLen = Lt - 60;
  const tAxisSampled: P[] = [];
  for (let t = 70; t <= tShaftLen; t += 5) tAxisSampled.push(tAxisPoint(t));
  tibiaParts.push(tube(tAxisSampled, (t) => [shaftT * tp(t), shaftT * tp(t)]));
  if (m.malunion) {
    const c = tAxisPoint(m.malunion.at * Lt);
    tibiaParts.push(ellipse(c, shaftT * 1.32, 22, (Math.atan2(dDist.x, dDist.y) * -180) / Math.PI, 40));
  }
  // Distal tibia in the frame of the distal shaft: the ankle centre A is the middle of the ankle joint space.
  const nD = turnTowards(dDist, 90, (v) => v.x);
  const ad = (u: number, v: number) => add(add(A, mul(nD, u)), mul(dDist, v));
  tibiaParts.push(
    closedSpline([
      ad(-11.5, -75), ad(-13, -45), ad(-19, -18), ad(-17, -2.6), ad(-8, -1.5), ad(0, -1.4), ad(8, -1.5), ad(16.5, -2.4),
      ad(19, 6), ad(21.5, 13.5), ad(25.5, 12), ad(27, -2), ad(23, -24), ad(14, -50), ad(12.5, -75),
    ], 8),
  );
  // Talus and the top of the calcaneus.
  const talus = closedSpline([ad(-16.5, 4.2), ad(-8, 1.6), ad(0, 1.4), ad(8, 1.6), ad(16.5, 4.2), ad(18.5, 12), ad(15, 21), ad(19, 28), ad(9, 33), ad(-6, 30), ad(-15, 31), ad(-19, 22), ad(-19.5, 12)], 8);
  const calcaneus = closedSpline([ad(-22, 28), ad(-4, 31), ad(14, 29), ad(25, 40), ad(23, 62), ad(12, 84), ad(-14, 86), ad(-26, 64), ad(-28, 42)], 8);
  // Fibula: head beside the lateral tibial condyle, shaft down to the lateral malleolus.
  const latT = mul(nT, -1);
  const fibHead = add(at(jt, -thw * 0.8, 0), mul(tDown, 21));
  const fibLine = [fibHead, st(Lt * 0.25, -(shaftT + 8.5)), st(Lt * 0.6, -(shaftT + 5.5)), st(Lt * 0.86, -(shaftT + 4.5)), add(ad(-21, 6), mul(latT, 0))];
  const fibAxis = openSpline(fibLine, 10);
  const fibProfile = profile([[0, 7.5], [0.12, 5.4], [0.6, 4.6], [0.88, 6.2], [1, 8.5]]);
  const fibula: P[][] = [
    ellipse(fibHead, 11.5, 13, 0, 36),
    tube(fibAxis, (t) => [fibProfile(t), fibProfile(t)]),
    closedSpline([ad(-27, -24), ad(-17.5, -20), ad(-17, 4), ad(-19, 18), ad(-23, 22), ad(-28.5, 12), ad(-29, -6)], 8),
  ];

  // Patella seen through the distal femur: a rounded triangle, apex down.
  const pcF = add(add(Fc, mul(nUpF, m.femur.ap * 0.52)), mul(eM, -hw * 0.1));
  const pf = (u: number, v: number) => add(add(pcF, mul(eM, u)), mul(nUpF, -v));
  const patella = closedSpline([pf(0, -23), pf(15, -19), pf(21, -5), pf(16, 11), pf(4, 21), pf(-5, 20), pf(-17, 10), pf(-21, -6), pf(-14, -20)], 8);

  // Pelvis: ilium and acetabular roof over the head, and the pubic/ischial ring round the obturator foramen.
  const R = m.femur.headRadius;
  const hp = (x: number, y: number) => add(H, pt(x, y));
  const ilium = closedSpline([
    hp(-R - 7, -3), hp(-R - 14, -30), hp(-48, -75), hp(-46, -150), hp(20, -170), hp(70, -130), hp(78, -70),
    hp(64, -26), hp(R + 18, -4), hp(R * 0.85, 10), hp(R * 0.55, -R * 0.55), hp(0, -R - 2.5), hp(-R * 0.75, -R * 0.75),
  ], 8);
  // Superior pubic ramus running medially from the acetabulum, the ischium below it, and the foramen between.
  const ring = closedSpline([
    hp(R * 0.6, R * 0.2), hp(R + 22, R * 0.15), hp(R + 62, R * 0.45), hp(R + 70, R + 14), hp(R + 52, R + 36),
    hp(R + 28, R + 62), hp(R + 4, R + 70), hp(-R * 0.15, R + 52), hp(R * 0.05, R + 18),
  ], 8);
  const obturator = closedSpline([hp(R + 14, R * 0.75), hp(R + 44, R + 4), hp(R + 40, R + 30), hp(R + 20, R + 48), hp(R + 6, R + 36), hp(R + 4, R + 12)], 8);
  const sourcil = templateArc(H.x, H.y, R + 2, 195, 330, 30);

  // Soft tissue: the envelope follows the bones, so a bowed leg looks bowed.
  const fAt = (frac: number) => add(K, mul(aAup, frac * len(sub(N0, K))));
  const tAt = (frac: number) => tAxisPoint(frac * Lt);
  const latSkin = openSpline([
    add(GT, pt(-42 * g, -120)), add(GT, mul(latF, 44 * g)), add(fAt(0.62), mul(latF, shaftF + 52 * g)), add(fAt(0.25), mul(latF, shaftF + 40 * g)),
    add(at(jf, -hw, -14), mul(latF, 17 * g)), add(at(jt, -thw, 25), mul(latT, 20 * g)), add(tAt(0.3), mul(latT, shaftT + 37 * g)), add(tAt(0.6), mul(latT, shaftT + 27 * g)),
    add(tAt(0.86), mul(latT, shaftT + 15 * g)), ad(-34 - 6 * g, 8), ad(-36 - 4 * g, 75), ad(-40, 180),
  ], 12);
  const medSkin = openSpline([
    add(H, pt(95 * g, -160)), add(H, pt(78 * g, 10)), add(fAt(0.62), mul(medF, shaftF + 62 * g)), add(fAt(0.25), mul(medF, shaftF + 46 * g)),
    add(at(jf, hw, -14), mul(medF, 19 * g)), add(at(jt, thw, 30), mul(nT, 30 * g)), add(tAt(0.28), mul(nT, shaftT + 48 * g)), add(tAt(0.6), mul(nT, shaftT + 30 * g)),
    add(tAt(0.86), mul(nT, shaftT + 15 * g)), ad(36 + 6 * g, 6), ad(38 + 4 * g, 75), ad(42, 180),
  ], 12);
  const envelope = [...latSkin, ...medSkin.slice().reverse()];
  // The muscle mass sits inside the subcutaneous fat: the envelope pulled a fifth of the way towards the bones.
  const axisPts = [...openSpline([shaftTop, K], 6), ...openSpline(tibAxis, 6)];
  const closestAxis = (p: P) => axisPts.reduce((best, q) => (len(sub(p, q)) < len(sub(p, best)) ? q : best));
  const muscle = envelope.map((p) => lerp(p, closestAxis(p), 0.2));

  layers.push({ kind: "soft", path: envelope, opacity: 0.25, blurMm: 2.2 });
  layers.push({ kind: "soft", path: muscle, opacity: 0.09, blurMm: 6 });
  layers.push(bone("pelvis", [ilium], { base: 0.3, rim: 0.7, cortexMm: 2.6, texture: 0.12 }));
  // The ring and the obturator foramen are drawn with the even-odd rule, so the foramen is a hole.
  layers.push(bone("pubis", [ring], { base: 0.22, rim: 0.5, cortexMm: 2.4, texture: 0.08, holes: [obturator] }));
  layers.push({ kind: "stroke", path: sourcil, widthMm: 2.4, opacity: 0.28, blurMm: 0.6 });
  layers.push(bone("femur", femurParts, { base: 0.45, rim: 1.0, cortexMm: 2.4 }));
  layers.push(bone("fibula", fibula, { base: 0.42, rim: 0.9, cortexMm: 1.8 }));
  layers.push(bone("tibia", tibiaParts, { base: 0.45, rim: 1.0, cortexMm: 2.2 }));
  layers.push(bone("calcaneus", [calcaneus], { base: 0.24, rim: 0.4, cortexMm: 2, texture: 0.1 }));
  layers.push(bone("talus", [talus], { base: 0.4, rim: 0.85, cortexMm: 1.8 }));
  layers.push(bone("patella", [patella], { base: 0.12, rim: 0.3, cortexMm: 1.0, texture: 0.05 }));
  // Medullary canals: the shafts read as two bright cortices with a darker channel between. The channel
  // narrows to nothing at both ends, where the shaft opens into cancellous bone.
  const taper = (t: number) => Math.min(1, t / 0.14, (1 - t) / 0.14);
  layers.push({
    kind: "shade",
    path: tube([add(N0, mul(aAup, -40)), add(K, mul(aAup, 110))], (t) => {
      const w = (shaftF * 0.98 - 6) * Math.sqrt(Math.max(0, taper(t)));
      return [w, w];
    }),
    opacity: 0.3,
    blurMm: 1.6,
    tone: "dark",
  });
  const canalT: P[] = [];
  for (let t = 95; t <= Lt - 80; t += 5) canalT.push(tAxisPoint(t));
  layers.push({
    kind: "shade",
    path: tube(canalT, (t) => {
      const w = (shaftT * tp(0.1 + t * 0.8) - 4.6) * Math.sqrt(Math.max(0, taper(t)));
      return [w, w];
    }),
    opacity: 0.28,
    blurMm: 1.5,
    tone: "dark",
  });
  // Subchondral sclerosis under the worn compartment.
  const s = wornSide;
  layers.push({ kind: "shade", path: [at(jt, s * 6, 0.6), at(jt, s * (thw - 3), 0.6), at(jt, s * (thw - 4), 4.5), at(jt, s * 7, 3.8)], opacity: 0.14, blurMm: 1.2, tone: "light" });
  layers.push({ kind: "shade", path: [at(jf, s * 8, -0.5), at(jf, s * (hw - 4), -0.6), at(jf, s * (hw - 5), -4.5), at(jf, s * 9, -4.2)], opacity: 0.1, blurMm: 1.4, tone: "light" });

  // Landmarks, exactly on the constructed lines.
  const landmarks: Record<string, P> = {
    hipCenter: H,
    kneeCenter: K,
    ankleCenter: A,
    femurDistalLateral: at(jf, -sC, 0),
    femurDistalMedial: at(jf, sC, 0),
    // The outer corners of the plateau rim. Both sit the same depth below the joint line, so the line through
    // them is the joint line's direction (MPTA is exact), and they are the planner's first guess for the bone
    // edges in the tibial step.
    tibiaProximalLateral: at(jt, -thw, rc),
    tibiaProximalMedial: at(jt, thw, rc),
    femurCanalProximal: add(K, mul(aAup, 0.62 * m.femurLength)),
    femurCanalDistal: add(K, mul(aAup, 0.3 * m.femurLength)),
  };
  // Stand the leg up: turn about the knee so the hip sits slightly lateral of the ankle (feet together).
  const axisDeg = (Math.atan2(A.x - H.x, A.y - H.y) * 180) / Math.PI;
  const turn = axisDeg - 1.5; // the hip-ankle line leans 1.5 degrees, hip lateral
  const upright = (p: P) => rotAbout(p, K, turn);

  // Bone edges for the fit: the outermost points across the film (what the eye picks, and what the planner
  // measures) of the condyles and of the plateau rim. Osteophytes are separate shapes, so they are not counted.
  const condyleBand = condyles.filter((p) => {
    const h = dot(sub(p, Fc), nUpF);
    return h >= 0 && h <= m.femur.ap * 0.35;
  });
  const rimBand = tibiaBlock.filter((p) => {
    const b = dot(sub(p, Tc), nDownT);
    return b >= 0 && b <= 12;
  });
  const fitMarkers = {
    tibial: { medial: extreme(rimBand, (p) => upright(p).x), lateral: extreme(rimBand, (p) => -upright(p).x) },
    femoral: { medial: extreme(condyleBand, (p) => upright(p).x), lateral: extreme(condyleBand, (p) => -upright(p).x) },
  };
  const markerAt = add(at(jt, thw, 35), mul(nT, 36 * g + 32));
  return frame("FLAP", m, layers, landmarks, fitMarkers, markerAt, upright, (pts) => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { left: Math.min(...xs) - 70, right: Math.max(...xs) + 70, top: Math.min(...ys) - 70, bottom: Math.max(...ys) + 48 };
  }, [H, GT, K, A, ad(0, 80), ad(-30, 20), ad(30, 20), markerAt]);
}

/* ------------------------------------------------------------------------------------------------ */
/* Knee lateral film                                                                                 */
/* ------------------------------------------------------------------------------------------------ */

export function buildLateral(m: LegModel): Film {
  const g = m.girth;
  // Built with POSTERIOR to the right (+x) and the femur upright; mirrored at the end for the film's facing.
  const fem = femoralProfileLateral(m.femur.ap);
  const tAP = m.tibia.ap;
  const xp = fem.condyleCentre.x;
  const yT = 3.4; // the plateau sits this far below the distal-most point of the femur
  const xTc = xp - 0.08 * tAP; // plateau centre: the femur contacts it a little behind the middle
  const kappa = m.pts; // knee flexion that brings the sloped plateau level
  const tDown = unit(pt(Math.sin((kappa * Math.PI) / 180), Math.cos((kappa * Math.PI) / 180)));
  const nAnt = turnTowards(tDown, 90, (v) => -v.x);
  const S0 = pt(xTc - 0.06 * tAP, yT);
  const ax = (t: number) => add(S0, mul(tDown, t));
  const sw = (t: number, w: number) => add(ax(t), mul(nAnt, w)); // w > 0 anterior
  const hs = m.tibia.shaftHalf * 1.08;

  // Femur: the J-curve, the shaft above it and the posterior metaphysis.
  const shaftAnt = fem.flangeTip.x - 0.4;
  const shaftPost = shaftAnt + 2 * m.femur.shaftHalf * 1.05;
  const top = -200;
  const condTop = fem.outer[fem.outer.length - 1];
  // The back of the femur runs from the top of the posterior condyle up the popliteal surface to the shaft.
  const femur: P[] = roundCorners([
    pt(shaftAnt, top),
    ...openSpline([pt(shaftAnt, -m.femur.ap * 1.1), pt(shaftAnt + 0.2, -m.femur.ap * 0.8), fem.flangeTip], 8).slice(1, -1),
    ...fem.outer,
    ...openSpline([condTop, pt(shaftPost + 4, -m.femur.ap * 0.95), pt(shaftPost + 0.8, -m.femur.ap * 1.25), pt(shaftPost, -m.femur.ap * 1.6)], 10).slice(1),
    pt(shaftPost, top),
  ]);
  // Canals narrow to nothing where the shaft opens into the metaphysis.
  const femurCanal = tube([pt((shaftAnt + shaftPost) / 2, top), pt((shaftAnt + shaftPost) / 2 + 1.5, -m.femur.ap * 1.05)], (t) => {
    const w = (m.femur.shaftHalf - 5.2) * Math.sqrt(Math.max(0, Math.min(1, (1 - t) / 0.3)));
    return [w, w];
  });
  // The other condyle, a little offset, as a faint second contour.
  const twin = fem.outer.slice(Math.floor(fem.outer.length * 0.45)).map((p) => add(p, pt(2.4, -1.7)));

  // Tibia: level plateau, spines, tubercle, shaft along the flexed axis.
  const aE = xTc - tAP / 2; // anterior edge
  const pE = xTc + tAP / 2; // posterior edge
  // Both rim corners share one radius, so their outermost points sit at the same depth below the plateau.
  const rA = 2.3;
  const rP = 2.3;
  const plateau: P[] = [];
  for (let x = aE + rA; x <= pE - rP + 1e-6; x += 0.5) {
    const u = (x - aE) / tAP;
    const spine = 5 * Math.exp(-((u - 0.42) ** 2) / (2 * 0.045 ** 2));
    plateau.push(pt(x, yT - spine));
  }
  const tubercle = sw(30, hs + 8.5);
  const tibiaBlock: P[] = [
    ...templateArc(aE + rA, yT + rA, rA, 180, 270, 5),
    ...plateau.slice(1),
    ...templateArc(pE - rP, yT + rP, rP, 270, 360, 5).slice(1),
    ...openSpline([pt(pE, yT + rP + 0.4), pt(pE - 0.8, yT + 9), pt(pE - 4.5, yT + 19), sw(48, -(hs + 2.5)), sw(78, -hs), sw(100, -hs * 0.98)], 8).slice(1),
    ...openSpline([sw(100, hs * 0.98), sw(70, hs + 1.5), sw(44, hs + 4.5), tubercle, pt(aE + 2.5, yT + 17), pt(aE + 0.6, yT + 9), pt(aE, yT + rA + 0.4)], 8),
  ];
  const tibShaft = tube([ax(60), ax(240)], (t) => {
    const w = hs * (1 - 0.14 * t);
    return [w, w];
  });
  const tibCanal = tube([ax(70), ax(240)], (t) => {
    const w = (hs * (1 - 0.14 * t) - 5.4) * Math.sqrt(Math.max(0, Math.min(1, t / 0.25)));
    return [w, w];
  });
  const fibHead = pt(pE - 9.5, yT + 17);
  const fibula: P[][] = [
    ellipse(fibHead, 10.5, 12.5, 8, 36),
    tube([fibHead, sw(120, -(hs - 3)), sw(240, -(hs - 4))], (t) => {
      const w = 6 - 1.4 * Math.min(1, t * 3);
      return [w, w];
    }),
  ];

  // Patella in front of the trochlea, and its tendon down to the tubercle.
  const pc = pt(fem.anteriorMost.x - 13, -m.femur.ap * 0.62);
  const patella = closedSpline([
    add(pc, pt(2, -22)), add(pc, pt(-10.5, -14)), add(pc, pt(-11.5, 6)), add(pc, pt(-4, 22)), add(pc, pt(5, 18.5)), add(pc, pt(11, 2)), add(pc, pt(9.5, -14)),
  ], 8);
  const tendon = tube([add(pc, pt(-2.5, 20)), add(tubercle, pt(-2, -2))], () => [3.4, 3.4]);
  const quad = tube([add(pc, pt(0, -21)), pt(shaftAnt - 8, -140)], () => [4, 4]);

  // Soft tissue.
  const ant = openSpline([
    pt(shaftAnt - 26 * g, top - 40), pt(shaftAnt - 24 * g, -110), add(pc, pt(-11.5 - 7, -16)), add(pc, pt(-12 - 6, 8)),
    add(tubercle, pt(-6 - 3 * g, -12)), add(tubercle, mul(nAnt, 7)), add(sw(120, hs + 8), pt(0, 0)), add(sw(260, hs + 8), pt(0, 0)),
  ], 12);
  const post = openSpline([
    pt(shaftPost + 70 * g, top - 40), pt(shaftPost + 64 * g, -110), pt(fem.posteriorMost.x + 34 * g, -12), sw(40, -(hs + 46 * g)),
    sw(100, -(hs + 72 * g)), sw(180, -(hs + 60 * g)), sw(260, -(hs + 48 * g)),
  ], 12);
  const envelope = [...ant, ...post.slice().reverse()];
  const axisOf = (p: P) => (p.y < 0 ? pt((shaftAnt + shaftPost) / 2, p.y) : ax(Math.max(0, p.y - yT)));
  const muscle = envelope.map((p) => lerp(p, axisOf(p), 0.22));

  const layers: Layer[] = [
    { kind: "soft", path: envelope, opacity: 0.25, blurMm: 1.6 },
    { kind: "soft", path: muscle, opacity: 0.09, blurMm: 4 },
    { kind: "soft", path: quad, opacity: 0.05, blurMm: 1.2 },
    { kind: "soft", path: tendon, opacity: 0.07, blurMm: 1 },
    bone("femur", [femur], { base: 0.45, rim: 1.0, cortexMm: 1.7 }),
    bone("fibula", fibula, { base: 0.36, rim: 0.8, cortexMm: 1.4 }),
    bone("tibia", [tibiaBlock, tibShaft], { base: 0.45, rim: 1.0, cortexMm: 1.6 }),
    bone("patella", [patella], { base: 0.42, rim: 0.95, cortexMm: 1.5 }),
    { kind: "stroke", path: twin, widthMm: 1.1, opacity: 0.22, blurMm: 0.5 },
    { kind: "shade", path: femurCanal, opacity: 0.24, blurMm: 1.6, tone: "dark" },
    { kind: "shade", path: tibCanal, opacity: 0.22, blurMm: 1.6, tone: "dark" },
  ];

  const landmarks: Record<string, P> = {
    // The front-most and back-most points of the plateau rim. They sit at the same depth, so the line through
    // them is level with the plateau (PTS is exact), and they are the planner's first guess for the tibial
    // anterior and posterior bone edges.
    tibiaPlateauAnterior: pt(aE, yT + rA),
    tibiaPlateauPosterior: pt(pE, yT + rP),
    tibiaShaftProximal: ax(70),
    tibiaShaftDistal: ax(150),
  };
  // Bone edges for the fit: the front-most and back-most points of the drawn bone (posterior is +x here).
  const distalFemur = femur.filter((p) => p.y > -m.femur.ap * 0.75);
  const plateauRim = tibiaBlock.filter((p) => p.y <= yT + 8);
  const fitMarkers = {
    tibial: { anterior: extreme(plateauRim, (p) => -p.x), posterior: extreme(plateauRim, (p) => p.x) },
    femoral: { anterior: extreme(distalFemur, (p) => -p.x), posterior: extreme(distalFemur, (p) => p.x) },
  };
  const markerAt = pt(xTc - 78, yT + 112);
  return frame("KLAT", m, layers, landmarks, fitMarkers, markerAt, (p) => p, () => {
    const cx = xTc + 2;
    return { left: cx - 98, right: cx + 98, top: -150, bottom: yT + 170 };
  }, []);
}

/* ------------------------------------------------------------------------------------------------ */
/* Placing a built leg on a film                                                                     */
/* ------------------------------------------------------------------------------------------------ */

function frame(
  view: "FLAP" | "KLAT",
  m: LegModel,
  layers: Layer[],
  landmarks: Record<string, P>,
  fitMarkers: Film["fitMarkers"],
  markerAt: P,
  place: (p: P) => P,
  bounds: (pts: P[]) => { left: number; right: number; top: number; bottom: number },
  extent: P[],
): Film {
  const mmPerPx = view === "FLAP" ? m.apMmPerPx : m.latMmPerPx;
  const b = bounds(extent.map(place));
  const widthPx = Math.round((b.right - b.left) / mmPerPx);
  const heightPx = Math.round((b.bottom - b.top) / mmPerPx);
  const widthMm = widthPx * mmPerPx;
  const heightMm = heightPx * mmPerPx;
  // A right knee's AP film shows its lateral side on the left; its lateral film faces right. Left knees mirror both.
  const mirror = view === "FLAP" ? m.side === "left" : m.side === "right";
  const T = (p: P) => {
    const q = place(p);
    const f = pt(q.x - b.left, q.y - b.top);
    return mirror ? mirrorX(f, widthMm / 2) : f;
  };
  const mapPts = (pts: P[]) => pts.map(T);
  const placed: Layer[] = layers.map((l) =>
    l.kind === "bone" ? { ...l, parts: l.parts.map(mapPts), holes: l.holes?.map(mapPts) } : { ...l, path: mapPts(l.path) },
  );
  const mapRecord = (r: Record<string, P>) => Object.fromEntries(Object.entries(r).map(([k, p]) => [k, T(p)]));
  const marker = { centre: T(markerAt), diameterMm: 25 };

  // Lead side marker on the lateral side of an AP film, and in the top corner of a lateral film.
  const letter = m.side === "right" ? "R" : "L";
  const lateralOnLeft = view === "FLAP" ? m.side === "right" : m.side === "left";
  const lx = lateralOnLeft ? 14 : widthMm - 14;
  const anchor = lateralOnLeft ? "start" : "end";
  const labels: Label[] = [
    { text: letter, at: pt(lx, 26), sizeMm: 15, anchor, opacity: 0.92, boxed: true, bold: true },
    { text: view === "FLAP" ? "STANDING AP" : "LATERAL", at: pt(lx, 40), sizeMm: 4.6, anchor, opacity: 0.75 },
    { text: "25 mm", at: pt(marker.centre.x + (marker.centre.x < widthMm / 2 ? 17 : -17), marker.centre.y + 1.8), sizeMm: 5, anchor: marker.centre.x < widthMm / 2 ? "start" : "end", opacity: 0.72 },
    { text: "SYNTHETIC TRAINING IMAGE - NOT A PATIENT", at: pt(widthMm / 2, heightMm - 6), sizeMm: 3.6, anchor: "middle", opacity: 0.42 },
  ];
  return {
    view,
    widthMm,
    heightMm,
    mmPerPx,
    layers: placed,
    marker,
    labels,
    landmarks: mapRecord(landmarks),
    fitMarkers: { tibial: mapRecord(fitMarkers.tibial), femoral: mapRecord(fitMarkers.femoral) },
  };
}
