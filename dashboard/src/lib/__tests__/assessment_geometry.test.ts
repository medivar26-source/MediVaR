import test from "node:test";
import assert from "node:assert/strict";
import {
  REQUIRED_LANDMARKS,
  measureAssessment,
  perpendicularDistance,
  signedAngle,
  toV1Assessment,
  type LandmarkSet,
  type ScanGeometry,
} from "../data/assessment_geometry";

const square: ScanGeometry = { widthPx: 1000, heightPx: 1000, mmPerPx: 0.5, calibrated: true };
const tall: ScanGeometry = { widthPx: 1000, heightPx: 2000, mmPerPx: 0.5, calibrated: true };

/** A straight, symmetrical leg on a square scan. */
const straight: LandmarkSet = {
  hipCenter: { x: 50, y: 10 },
  kneeCenter: { x: 50, y: 50 },
  ankleCenter: { x: 50, y: 90 },
  femurDistalLateral: { x: 40, y: 50 },
  femurDistalMedial: { x: 60, y: 50 },
  tibiaProximalLateral: { x: 40, y: 50 },
  tibiaProximalMedial: { x: 60, y: 50 },
  femurCanalProximal: { x: 50, y: 20 },
  femurCanalDistal: { x: 50, y: 40 },
  tibiaPlateauAnterior: { x: 40, y: 50 },
  tibiaPlateauPosterior: { x: 60, y: 50 },
  tibiaShaftProximal: { x: 50, y: 55 },
  tibiaShaftDistal: { x: 50, y: 85 },
};

const read = (
  lm: LandmarkSet,
  flap: ScanGeometry | null = square,
  klat: ScanGeometry | null = square,
  side?: "RIGHT" | "LEFT",
) => measureAssessment(lm, flap, klat, side);

test("Nothing is measured from a point that has not been placed", async (t) => {
  await t.test("with no points there are no numbers at all", () => {
    const r = read({});
    for (const m of Object.values(r.measures)) assert.equal(m.value, undefined);
    assert.equal(r.complete, false);
    assert.deepEqual(r.missing, REQUIRED_LANDMARKS);
  });

  await t.test("three axis points give the axis measurements and nothing else", () => {
    const r = read({ hipCenter: straight.hipCenter, kneeCenter: straight.kneeCenter, ankleCenter: straight.ankleCenter });
    assert.equal(r.measures.mad.value, 0);
    assert.equal(r.measures.mhka.value, 0);
    for (const k of ["mpta", "ldfa", "ama", "pts"] as const) assert.equal(r.measures[k].value, undefined, k);
    assert.deepEqual(r.measures.mpta.missing, ["tibiaProximalLateral", "tibiaProximalMedial"]);
  });

  await t.test("a value is never bent into range: a straight leg is 0 mm and 0 degrees, not 1", () => {
    const r = read(straight);
    assert.equal(r.measures.mad.value, 0);
    assert.equal(r.measures.mhka.value, 0);
    assert.equal(r.measures.ama.value, 0);
    assert.equal(r.measures.pts.value, 0);
  });

  await t.test("a scan that has not loaded makes its measurements wait instead of guessing", () => {
    const r = read(straight, null, square);
    assert.equal(r.loading, true);
    assert.equal(r.measures.mad.value, undefined);
    assert.equal(r.complete, false);
  });
});

test("Distances and angles are measured in real pixels", async (t) => {
  await t.test("MAD follows the scale: 20 px off the axis at 0.5 mm per pixel is 10 mm", () => {
    const r = read({ hipCenter: { x: 50, y: 10 }, kneeCenter: { x: 52, y: 50 }, ankleCenter: { x: 50, y: 90 } }, tall, tall);
    assert.equal(r.measures.mad.value, 10);
    assert.equal(r.scale_estimated, false);
  });

  await t.test("an unverified scale is flagged, and still gives a number", () => {
    const r = read(
      { hipCenter: { x: 50, y: 10 }, kneeCenter: { x: 52, y: 50 }, ankleCenter: { x: 50, y: 90 } },
      { ...tall, calibrated: false },
      tall,
    );
    assert.equal(r.scale_estimated, true);
    assert.ok(Number.isFinite(r.measures.mad.value));
  });

  await t.test("a tall image does not distort angles: 100 px over 800 px is 7.1 degrees", () => {
    const r = read({ hipCenter: { x: 50, y: 10 }, kneeCenter: { x: 50, y: 50 }, ankleCenter: { x: 60, y: 90 } }, tall, tall);
    assert.ok(Math.abs(r.measures.mhka.value! - 7.1) < 0.1, `mHKA ${r.measures.mhka.value}`);
  });

  await t.test("the helpers are right on simple cases", () => {
    assert.equal(perpendicularDistance({ x: 0, y: 0 }, { x: 0, y: 10 }, { x: 3, y: 5 }), 3);
    assert.ok(Math.abs(signedAngle({ x: 1, y: 0 }, { x: 0, y: 1 }) - 90) < 1e-9);
  });
});

test("Joint angles are measured on the side they are named for", async (t) => {
  await t.test("MPTA is below 90 when the inner side of the plateau is lower, above 90 when it is higher", () => {
    const low = read({ ...straight, tibiaProximalMedial: { x: 60, y: 51.75 } }).measures.mpta.value!;
    const high = read({ ...straight, tibiaProximalMedial: { x: 60, y: 48.25 } }).measures.mpta.value!;
    assert.equal(low, 85);
    assert.equal(high, 95);
  });

  await t.test("MPTA does not depend on which side of the picture the inner edge is on", () => {
    const mirrored = read({
      ...straight,
      tibiaProximalMedial: { x: 40, y: 51.75 },
      tibiaProximalLateral: { x: 60, y: 50 },
    }).measures.mpta.value;
    assert.equal(mirrored, 85);
  });

  await t.test("LDFA is below 90 when the outer end of the joint line is higher, above 90 when lower", () => {
    const high = read({ ...straight, femurDistalLateral: { x: 40, y: 48.25 } }).measures.ldfa.value!;
    const low = read({ ...straight, femurDistalLateral: { x: 40, y: 51.75 } }).measures.ldfa.value!;
    assert.equal(high, 85);
    assert.equal(low, 95);
  });

  await t.test("AMA is the angle between the bone's own axis and the mechanical axis", () => {
    const r = read({ ...straight, femurCanalProximal: { x: 50, y: 30 }, femurCanalDistal: { x: 53.15, y: 60 } });
    assert.ok(Math.abs(r.measures.ama.value! - 6.0) < 0.1, `AMA ${r.measures.ama.value}`);
  });

  await t.test("PTS is positive when the back of the plateau is lower and negative when higher, whichever way the knee faces", () => {
    const slope = (backY: number, frontX: number, backX: number) =>
      read({
        ...straight,
        tibiaPlateauAnterior: { x: frontX, y: 50 },
        tibiaPlateauPosterior: { x: backX, y: backY },
      }).measures.pts.value!;
    assert.ok(slope(54, 30, 70) > 5 && slope(54, 30, 70) < 6.5, `${slope(54, 30, 70)}`);
    assert.ok(slope(46, 30, 70) < -5);
    assert.equal(slope(54, 30, 70), slope(54, 70, 30), "same slope with the front on the other side of the picture");
  });

  await t.test("a value far from any real knee is flagged and left as measured", () => {
    const r = read({ ...straight, tibiaProximalMedial: { x: 60, y: 62 } });
    assert.ok(r.measures.mpta.value! < 70);
    assert.match(r.measures.mpta.check ?? "", /Check the points/);
  });
});

test("Varus and valgus follow the lateral side the surgeon marked", async (t) => {
  // Knee displaced to the image right of the hip-ankle line.
  const bowRight: LandmarkSet = { ...straight, kneeCenter: { x: 56, y: 50 } };

  await t.test("when the outer edge is on the right, a knee bowing right bows outward: varus", () => {
    const r = read({ ...bowRight, tibiaProximalLateral: { x: 65, y: 50 }, tibiaProximalMedial: { x: 45, y: 50 } });
    assert.equal(r.alignment_type, "VARUS");
    assert.equal(r.mad_direction, "lateral");
    assert.equal(r.alignment_basis, "points");
  });

  await t.test("when the outer edge is on the left, the same knee bows inward: valgus", () => {
    const r = read({ ...bowRight, tibiaProximalLateral: { x: 45, y: 50 }, tibiaProximalMedial: { x: 65, y: 50 } });
    assert.equal(r.alignment_type, "VALGUS");
    assert.equal(r.mad_direction, "medial");
  });

  await t.test("the femur's marks decide when the tibia's are not placed", () => {
    const noTibia: LandmarkSet = { ...bowRight };
    delete noTibia.tibiaProximalLateral;
    delete noTibia.tibiaProximalMedial;
    const r = read({ ...noTibia, femurDistalLateral: { x: 65, y: 50 }, femurDistalMedial: { x: 45, y: 50 } });
    assert.equal(r.alignment_type, "VARUS");
  });

  await t.test("with no lateral/medial marks the knee's side decides, on the standard view", () => {
    const axis = { hipCenter: bowRight.hipCenter, kneeCenter: bowRight.kneeCenter, ankleCenter: bowRight.ankleCenter };
    const right = read(axis, square, square, "RIGHT");
    const left = read(axis, square, square, "LEFT");
    assert.equal(right.alignment_type, "VALGUS", "a right knee's outer side is on the left of the picture");
    assert.equal(left.alignment_type, "VARUS");
    assert.equal(right.alignment_basis, "knee_side");
    assert.equal(read(axis).alignment_type, undefined, "no marks and no side: not guessed");
  });

  await t.test("a leg that is straight is neutral", () => {
    assert.equal(read(straight).alignment_type, "NEUTRAL");
  });
});

test("An assessment can only be saved when every number exists", async (t) => {
  await t.test("incomplete gives nothing to save", () => {
    const partial: LandmarkSet = { ...straight };
    delete partial.tibiaShaftDistal;
    assert.equal(toV1Assessment(read(partial)), null);
  });

  await t.test("complete gives all six numbers and the designation", () => {
    const a = toV1Assessment(
      read({ ...straight, kneeCenter: { x: 56, y: 50 }, tibiaProximalLateral: { x: 65, y: 50 }, tibiaProximalMedial: { x: 45, y: 50 } }),
    )!;
    assert.ok(a);
    assert.equal(a.alignment_type, "VARUS");
    for (const k of ["MAD_mm", "AMA_deg", "mHKA_deg", "MPTA_deg", "LDFA_deg", "PTS_deg"] as const) {
      assert.ok(Number.isFinite(a[k]), k);
    }
  });
});

test("The points are asked for in one order, everywhere", async (t) => {
  await t.test("the guide and the measurements agree on which points exist", async () => {
    const { LANDMARK_ORDER, LANDMARK_INFO } = await import("../data/landmark_guide");
    assert.deepEqual(LANDMARK_ORDER, REQUIRED_LANDMARKS);
    for (const key of LANDMARK_ORDER) assert.ok(LANDMARK_INFO[key], key);
  });

  await t.test("the next point is the first one missing, wrapping round, and none when all are placed", async () => {
    const { nextMissing, LANDMARK_ORDER } = await import("../data/landmark_guide");
    const placed = new Set<string>();
    assert.equal(nextMissing((k) => placed.has(k)), "hipCenter");
    placed.add("hipCenter");
    assert.equal(nextMissing((k) => placed.has(k), "hipCenter"), "kneeCenter");
    for (const k of LANDMARK_ORDER.slice(0, 5)) placed.add(k);
    assert.equal(nextMissing((k) => placed.has(k), LANDMARK_ORDER[12]), LANDMARK_ORDER[5], "wraps to the first gap");
    for (const k of LANDMARK_ORDER) placed.add(k);
    assert.equal(nextMissing((k) => placed.has(k)), undefined);
  });
});
