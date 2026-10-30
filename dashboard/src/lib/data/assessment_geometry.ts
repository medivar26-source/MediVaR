/**
 * The six assessment measurements, worked out from the landmarks on the scans.
 *
 * Rules this file keeps, because each was once broken:
 *  - A measurement exists only when every point it needs has been placed. Nothing is filled in from
 *    a default, and nothing is clamped into a believable range: a wrong point gives a wrong number,
 *    and the number is flagged rather than quietly bent.
 *  - Landmarks are percentages of the image, and the two axes of an image are almost never the same
 *    length, so everything is converted to real image pixels first. Millimetres follow from the scan's
 *    scale.
 *  - Joint angles are measured on the side they are named for (medial for MPTA, lateral for LDFA), so
 *    85° and 95° are different answers instead of the same one.
 *  - Varus and valgus come from which way the knee bows relative to the lateral side the surgeon marked
 *    on the scan, so a left knee and a right knee both read correctly.
 *  - MAD's side is the side of the knee centre the hip-ankle line passes, as it is reported clinically:
 *    medial in a varus knee, lateral in a valgus one.
 */

import type { V1Assessment } from "../plan";

export type Pt = { x: number; y: number };

export type LandmarkKey =
  | "hipCenter" | "kneeCenter" | "ankleCenter"
  | "femurDistalLateral" | "femurDistalMedial"
  | "tibiaProximalLateral" | "tibiaProximalMedial"
  | "femurCanalProximal" | "femurCanalDistal"
  | "tibiaPlateauAnterior" | "tibiaPlateauPosterior"
  | "tibiaShaftProximal" | "tibiaShaftDistal";

export type LandmarkSet = Partial<Record<LandmarkKey, Pt>>;

/** A scan's size in pixels and its scale. */
export type ScanGeometry = { widthPx: number; heightPx: number; mmPerPx: number; calibrated: boolean };

export type MeasureKey = "mad" | "ama" | "mhka" | "mpta" | "ldfa" | "pts";

/** In the order the senior testers' reference ("Planning mode details") lists them. */
export const MEASURE_ORDER: MeasureKey[] = ["mad", "mhka", "ldfa", "mpta", "ama", "pts"];

/** The side of the knee centre the mechanical axis (hip to ankle) passes. */
export type MadSide = "medial" | "lateral";

/** The points each measurement needs, and the scan they are on. */
export const MEASURE_NEEDS: Record<MeasureKey, { view: "FLAP" | "KLAT"; keys: LandmarkKey[] }> = {
  mad: { view: "FLAP", keys: ["hipCenter", "kneeCenter", "ankleCenter"] },
  mhka: { view: "FLAP", keys: ["hipCenter", "kneeCenter", "ankleCenter"] },
  mpta: { view: "FLAP", keys: ["kneeCenter", "ankleCenter", "tibiaProximalLateral", "tibiaProximalMedial"] },
  ldfa: { view: "FLAP", keys: ["hipCenter", "kneeCenter", "femurDistalLateral", "femurDistalMedial"] },
  ama: { view: "FLAP", keys: ["hipCenter", "kneeCenter", "femurCanalProximal", "femurCanalDistal"] },
  pts: { view: "KLAT", keys: ["tibiaPlateauAnterior", "tibiaPlateauPosterior", "tibiaShaftProximal", "tibiaShaftDistal"] },
};

/** Every point the assessment needs, in the order they are asked for. */
export const REQUIRED_LANDMARKS: LandmarkKey[] = [
  "hipCenter", "kneeCenter", "ankleCenter",
  "femurDistalLateral", "femurDistalMedial",
  "tibiaProximalLateral", "tibiaProximalMedial",
  "femurCanalProximal", "femurCanalDistal",
  "tibiaPlateauAnterior", "tibiaPlateauPosterior",
  "tibiaShaftProximal", "tibiaShaftDistal",
];

/** What each measurement is, in plain words. */
export const MEASURE_INFO: Record<MeasureKey, { short: string; name: string; unit: "mm" | "°"; plain: string }> = {
  mad: {
    short: "MAD",
    name: "Mechanical axis deviation",
    unit: "mm",
    plain: "How far the straight line from the hip to the ankle passes from the knee centre: medial in a bow-legged (varus) knee.",
  },
  mhka: {
    short: "mHKA",
    name: "Mechanical hip-knee-ankle angle",
    unit: "°",
    plain: "How much the leg bends at the knee, as seen from the front.",
  },
  mpta: {
    short: "MPTA",
    name: "Medial proximal tibial angle",
    unit: "°",
    plain: "The angle between the shin's axis and the top of the shin bone, on the inner side.",
  },
  ldfa: {
    short: "mLDFA",
    name: "Mechanical lateral distal femoral angle",
    unit: "°",
    plain: "The angle between the thigh's axis and the bottom of the thigh bone, on the outer side.",
  },
  ama: {
    short: "AMA",
    name: "Anatomical-mechanical angle",
    unit: "°",
    plain: "The angle between the thigh bone's own axis and the leg's mechanical axis.",
  },
  pts: {
    short: "PTS",
    name: "Posterior tibial slope",
    unit: "°",
    plain: "How much the top of the shin bone slopes down towards the back of the knee.",
  },
};

export type RangeTier = "normal" | "borderline" | "abnormal";

/** A value inside `normal` is normal; inside `borderline` but not `normal`, borderline; outside both, abnormal. */
type Band = { normal: [number, number]; borderline: [number, number] };

/**
 * Reference bands from the senior testers' "Planning mode details". They are shown for orientation and never
 * used to change or block a value. mHKA and MAD are deviations from straight, so their bands start at 0.
 *
 * MAD has a band per side because the reference tolerates more deviation medially (varus) than laterally
 * (valgus). The reference calls 10–15 mm "borderline, medial or lateral" but also calls more than 10 mm
 * lateral abnormal; the lateral band follows the stricter of the two.
 */
export const MEASURE_RANGES: { [K in Exclude<MeasureKey, "mad">]: Band } & { mad: Record<MadSide, Band> } = {
  mad: {
    medial: { normal: [0, 10], borderline: [0, 15] },
    lateral: { normal: [0, 10], borderline: [0, 10] },
  },
  mhka: { normal: [0, 1.5], borderline: [0, 3] },
  ldfa: { normal: [85, 90], borderline: [83, 92] },
  mpta: { normal: [85, 90], borderline: [83, 92] },
  ama: { normal: [5, 7], borderline: [4, 8] },
  pts: { normal: [5, 12], borderline: [3, 15] },
};

export const RANGE_TIER_INFO: Record<RangeTier, { label: string; tone: "pass" | "warn" | "fail" }> = {
  normal: { label: "Normal", tone: "pass" },
  borderline: { label: "Borderline", tone: "warn" },
  abnormal: { label: "Abnormal", tone: "fail" },
};

const TIER_SEVERITY: RangeTier[] = ["normal", "borderline", "abnormal"];

const within = ([lo, hi]: [number, number], v: number) => v >= lo && v <= hi;
const tierIn = (band: Band, v: number): RangeTier =>
  within(band.normal, v) ? "normal" : within(band.borderline, v) ? "borderline" : "abnormal";

/** Where a value sits in the reference bands. MAD needs its side; without one, the stricter reading is used. */
export function rangeTier(key: MeasureKey, value: number, madSide?: MadSide): RangeTier {
  if (key !== "mad") return tierIn(MEASURE_RANGES[key], value);
  if (madSide) return tierIn(MEASURE_RANGES.mad[madSide], value);
  const both = [tierIn(MEASURE_RANGES.mad.medial, value), tierIn(MEASURE_RANGES.mad.lateral, value)];
  return both.reduce((a, b) => (TIER_SEVERITY.indexOf(b) > TIER_SEVERITY.indexOf(a) ? b : a));
}

/** The normal band in words, e.g. "85–90°", "within ±1.5°", "within 10 mm". */
export function normalRangeText(key: MeasureKey): string {
  if (key === "mad") {
    const { medial, lateral } = MEASURE_RANGES.mad;
    return medial.normal[1] === lateral.normal[1]
      ? `within ${medial.normal[1]} mm`
      : `within ${medial.normal[1]} mm medial, ${lateral.normal[1]} mm lateral`;
  }
  const [lo, hi] = MEASURE_RANGES[key].normal;
  return lo === 0 ? `within ±${hi}°` : `${lo}–${hi}°`;
}

/** The saved field each measurement is kept in. */
const STORED_FIELD: Record<MeasureKey, "MAD_mm" | "AMA_deg" | "mHKA_deg" | "MPTA_deg" | "LDFA_deg" | "PTS_deg"> = {
  mad: "MAD_mm",
  mhka: "mHKA_deg",
  mpta: "MPTA_deg",
  ldfa: "LDFA_deg",
  ama: "AMA_deg",
  pts: "PTS_deg",
};

/** A saved measurement, or undefined when it was never recorded. */
export function storedMeasure(a: Partial<V1Assessment> | null | undefined, key: MeasureKey): number | undefined {
  const v = a?.[STORED_FIELD[key]];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * The MAD side a saved assessment implies. Saved plans keep the varus/valgus designation rather than the side,
 * and `measureAssessment` makes varus exactly the medial side, so one gives the other. Neutral gives no side.
 */
export const madSideFromAlignment = (alignment?: V1Assessment["alignment_type"]): MadSide | undefined =>
  alignment === "VARUS" ? "medial" : alignment === "VALGUS" ? "lateral" : undefined;

/** A measurement as the planner shows it: "88.0°", "12.0 mm medial", "12.0 mm medial (est.)". */
export function formatMeasure(
  key: MeasureKey,
  value: number,
  { madSide, scaleEstimated }: { madSide?: MadSide; scaleEstimated?: boolean } = {},
): string {
  if (MEASURE_INFO[key].unit === "°") return `${value.toFixed(1)}°`;
  // A knee exactly on the axis has no side.
  const side = madSide && value > 0 ? ` ${madSide}` : "";
  return `${value.toFixed(1)} mm${side}${scaleEstimated ? " (est.)" : ""}`;
}

/** A value outside these is far enough from any real knee that a point is probably misplaced. */
const IMPLAUSIBLE: Record<MeasureKey, [number, number]> = {
  mad: [0, 80],
  mhka: [0, 30],
  mpta: [70, 110],
  ldfa: [70, 110],
  ama: [0, 12],
  pts: [-10, 25],
};

const dot = (u: Pt, v: Pt) => u.x * v.x + u.y * v.y;
const cross = (u: Pt, v: Pt) => u.x * v.y - u.y * v.x;
const mag = (u: Pt) => Math.hypot(u.x, u.y);
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });

export const unsignedAngle = (u: Pt, v: Pt) => {
  const mu = mag(u);
  const mv = mag(v);
  if (mu === 0 || mv === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (mu * mv)))) * (180 / Math.PI);
};

export const signedAngle = (u: Pt, v: Pt) => Math.atan2(cross(u, v), dot(u, v)) * (180 / Math.PI);

/** Distance from `point` to the infinite line through `a` and `b`. */
export const perpendicularDistance = (a: Pt, b: Pt, point: Pt) => {
  const len = mag(sub(b, a));
  if (len === 0) return 0;
  return Math.abs(cross(sub(b, a), sub(a, point))) / len;
};

const round1 = (v: number) => Number(v.toFixed(1));

export type Measure = {
  key: MeasureKey;
  value?: number;
  /** Points still to place before this can be measured. */
  missing: LandmarkKey[];
  /** Set when the value is so far from any real knee that a point is probably in the wrong place. */
  check?: string;
};

export type AssessmentReading = {
  measures: Record<MeasureKey, Measure>;
  alignment_type?: "VARUS" | "VALGUS" | "NEUTRAL";
  /** The side of the knee centre the hip-ankle line passes, for MAD; unset when the knee is on the line. */
  mad_direction?: MadSide;
  /** "points" when the surgeon's own lateral/medial marks decided varus/valgus, "knee_side" when the case's side did. */
  alignment_basis?: "points" | "knee_side";
  /** MAD was converted to millimetres with a scale that is not verified. */
  scale_estimated: boolean;
  /** Every point is placed, so all six numbers exist. */
  complete: boolean;
  /** Points still to place, in the order they are asked for. */
  missing: LandmarkKey[];
  /** A scan has not finished loading, so its measurements cannot be made yet. */
  loading: boolean;
};

/**
 * `flap` and `klat` are the two scans; a measurement on a scan whose size is not known yet waits
 * instead of guessing. `kneeSide` is only a fallback for varus/valgus when neither the tibial nor the
 * femoral lateral/medial pair has been placed; the standard AP convention is assumed (the patient's
 * right is on the viewer's left).
 */
export function measureAssessment(
  lm: LandmarkSet,
  flap?: ScanGeometry | null,
  klat?: ScanGeometry | null,
  kneeSide?: "RIGHT" | "LEFT",
): AssessmentReading {
  const F = (p: Pt): Pt => ({ x: (p.x / 100) * flap!.widthPx, y: (p.y / 100) * flap!.heightPx });
  const K = (p: Pt): Pt => ({ x: (p.x / 100) * klat!.widthPx, y: (p.y / 100) * klat!.heightPx });
  const scanFor = (view: "FLAP" | "KLAT") => (view === "FLAP" ? flap : klat);

  const measures = {} as Record<MeasureKey, Measure>;
  for (const key of MEASURE_ORDER) {
    const needs = MEASURE_NEEDS[key];
    measures[key] = { key, missing: needs.keys.filter((k) => !lm[k]) };
  }
  const ready = (key: MeasureKey) =>
    measures[key].missing.length === 0 && Boolean(scanFor(MEASURE_NEEDS[key].view));

  let alignment: AssessmentReading["alignment_type"];
  let madDirection: AssessmentReading["mad_direction"];
  let basis: AssessmentReading["alignment_basis"];

  const hip = lm.hipCenter && flap ? F(lm.hipCenter) : undefined;
  const knee = lm.kneeCenter && flap ? F(lm.kneeCenter) : undefined;
  const ankle = lm.ankleCenter && flap ? F(lm.ankleCenter) : undefined;

  if (ready("mad") && hip && knee && ankle) {
    measures.mad.value = round1(perpendicularDistance(hip, ankle, knee) * flap!.mmPerPx);

    const fma = sub(knee, hip);
    const tma = sub(ankle, knee);
    const hka = round1(Math.abs(signedAngle(fma, tma)));
    measures.mhka.value = hka;

    // Which way the knee bows. Offset is the knee's displacement from the hip-ankle line; the line passes on
    // the other side of the knee, so a knee bowed outward (lateral) leaves the line medial: varus.
    const axis = sub(ankle, hip);
    const axisLen = mag(axis);
    if (axisLen > 0) {
      const along = dot(sub(knee, hip), axis) / (axisLen * axisLen);
      const offset: Pt = { x: knee.x - (hip.x + axis.x * along), y: knee.y - (hip.y + axis.y * along) };

      // The lateral side of the image, from the surgeon's own marks: tibia first, then femur.
      let lateral: Pt | undefined;
      if (lm.tibiaProximalLateral && lm.tibiaProximalMedial) lateral = sub(F(lm.tibiaProximalLateral), F(lm.tibiaProximalMedial));
      else if (lm.femurDistalLateral && lm.femurDistalMedial) lateral = sub(F(lm.femurDistalLateral), F(lm.femurDistalMedial));
      let lateralX: number | undefined;
      if (lateral && Math.abs(lateral.x) > 1e-6) {
        basis = "points";
        lateralX = lateral.x;
      } else if (kneeSide) {
        basis = "knee_side";
        // Standard AP view: the patient's right is the viewer's left, so a right knee's lateral side is image-left.
        lateralX = kneeSide === "RIGHT" ? -1 : 1;
      }
      if (lateralX !== undefined) {
        const lineSide: MadSide = lateralX * offset.x > 0 ? "medial" : "lateral";
        alignment = hka < 0.5 ? "NEUTRAL" : lineSide === "medial" ? "VARUS" : "VALGUS";
        if (measures.mad.value! > 0) madDirection = lineSide;
      }
    }
  }

  if (ready("ldfa") && hip && knee) {
    // The lateral angle: from the thigh's axis (up from the knee) round to the outer end of the joint line.
    const outward = sub(F(lm.femurDistalLateral!), F(lm.femurDistalMedial!));
    measures.ldfa.value = round1(unsignedAngle(sub(hip, knee), outward));
  }

  if (ready("mpta") && knee && ankle) {
    // The medial angle: from the shin's axis (down from the knee) round to the inner end of the joint line.
    const inward = sub(F(lm.tibiaProximalMedial!), F(lm.tibiaProximalLateral!));
    measures.mpta.value = round1(unsignedAngle(sub(ankle, knee), inward));
  }

  if (ready("ama") && hip && knee) {
    const anatomical = sub(F(lm.femurCanalDistal!), F(lm.femurCanalProximal!));
    measures.ama.value = round1(unsignedAngle(anatomical, sub(knee, hip)));
  }

  if (ready("pts")) {
    // Positive when the back of the plateau sits lower down the shin than the front.
    const plateau = sub(K(lm.tibiaPlateauPosterior!), K(lm.tibiaPlateauAnterior!));
    const shaft = sub(K(lm.tibiaShaftDistal!), K(lm.tibiaShaftProximal!));
    const lp = mag(plateau);
    const ls = mag(shaft);
    if (lp > 0 && ls > 0) {
      measures.pts.value = round1((Math.asin(Math.max(-1, Math.min(1, dot(plateau, shaft) / (lp * ls)))) * 180) / Math.PI);
    }
  }

  for (const key of MEASURE_ORDER) {
    const v = measures[key].value;
    if (v === undefined) continue;
    const [lo, hi] = IMPLAUSIBLE[key];
    if (v < lo || v > hi) {
      measures[key].check = "This is far from a usual knee. Check the points that feed it.";
    }
  }

  const missing = REQUIRED_LANDMARKS.filter((k) => !lm[k]);
  const loading = !flap || !klat;
  const complete = missing.length === 0 && !loading && MEASURE_ORDER.every((k) => measures[k].value !== undefined);

  return {
    measures,
    alignment_type: alignment,
    mad_direction: madDirection,
    alignment_basis: basis,
    scale_estimated: flap ? !flap.calibrated : false,
    complete,
    missing,
    loading,
  };
}

/** The saved form of a complete reading; nothing to save until every number exists. */
export function toV1Assessment(r: AssessmentReading): V1Assessment | null {
  if (!r.complete || !r.alignment_type) return null;
  const m = r.measures;
  return {
    MAD_mm: m.mad.value!,
    AMA_deg: m.ama.value!,
    mHKA_deg: m.mhka.value!,
    MPTA_deg: m.mpta.value!,
    LDFA_deg: m.ldfa.value!,
    PTS_deg: m.pts.value!,
    alignment_type: r.alignment_type,
    scale_estimated: r.scale_estimated,
  };
}
