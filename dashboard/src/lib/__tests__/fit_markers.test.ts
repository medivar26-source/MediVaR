import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateFemoralFit,
  evaluateTibialFit,
  femoralExtents,
  worstTone,
} from "../data/tkr_templates";
import {
  allMarkersPlaced,
  autoFitFemoral,
  autoFitTibial,
  deriveBone,
  imageDxToModelY,
  modelXToImage,
  modelYToImageX,
  rankFemoralSizes,
  rankTibialSizes,
  seedMarkers,
  sideGaps,
  type ViewScale,
} from "../data/fit_markers";

const scale = (calibrated = true): ViewScale => ({ widthPx: 1000, heightPx: 1000, mmPerPx: 0.1, calibrated });

test("Verdict is the worst of the metrics, and gets worse as the fit gets worse", async (t) => {
  await t.test("severity never goes down as an overhang grows", () => {
    const rank = { "ACCEPTABLE FIT": 0, "BORDERLINE FIT": 1, "POOR FIT": 2 } as const;
    let last = 0;
    for (const shift of [0, 0.6, 1.2, 1.8, 3, 5]) {
      const r = evaluateTibialFit(3, shift, 0, 42.5, 68.2, 0);
      assert.ok(rank[r.fitStatus] >= last, `shift ${shift} mm must not rate better than a smaller shift`);
      last = rank[r.fitStatus];
    }
    assert.equal(last, 2, "a 5 mm overhang is a poor fit");
  });

  await t.test("overhang between 1.0 and 1.5 mm is borderline, matching the gauge", () => {
    const r = evaluateTibialFit(3, 1.2, 0, 42.5, 68.2, 0);
    assert.equal(r.lateralOverhangMm, 1.2);
    assert.equal(r.lateralTone, "warn");
    assert.equal(r.fitStatus, "BORDERLINE FIT");
  });

  await t.test("a size that is too big is rated no better than one that is too small", () => {
    const big = evaluateTibialFit(6, 0, 0, 42.5, 68.2, 0);
    const small = evaluateTibialFit(1, 0, 0, 42.5, 68.2, 0);
    assert.equal(big.fitStatus, "POOR FIT");
    assert.equal(small.fitStatus, "POOR FIT");
  });

  await t.test("worstTone picks the weakest", () => {
    assert.equal(worstTone(["pass", "warn", "pass"]), "warn");
    assert.equal(worstTone(["pass", "fail", "warn"]), "fail");
    assert.equal(worstTone([]), "pass");
  });
});

test("Tibial overhang is measured on both axes, on the real outline", async (t) => {
  await t.test("a tray that is too deep for the bone overhangs front and back", () => {
    const r = evaluateTibialFit(3, 0, 0, 36, 68.2, 0);
    assert.ok(r.anteriorOverhangMm > 1.5 && r.posteriorOverhangMm > 1.5, "AP overhang must be reported");
    assert.equal(r.fitStatus, "POOR FIT");
  });

  await t.test("shifting posteriorly overhangs the posterior edge, not the anterior one", () => {
    const r = evaluateTibialFit(3, 0, 3, 42.5, 68.2, 0);
    assert.ok(r.posteriorOverhangMm >= 2.5);
    assert.equal(r.anteriorOverhangMm, 0);
  });

  await t.test("medial and lateral follow the marked side, so a left knee reads correctly", () => {
    const right = evaluateTibialFit(3, 2, 0, 42.5, 68.2, 0, undefined, undefined, { medialSide: "negX", anteriorSide: "negY" });
    const left = evaluateTibialFit(3, 2, 0, 42.5, 68.2, 0, undefined, undefined, { medialSide: "posX", anteriorSide: "negY" });
    assert.equal(right.lateralOverhangMm, 2);
    assert.equal(right.medialOverhangMm, 0);
    assert.equal(left.medialOverhangMm, 2);
    assert.equal(left.lateralOverhangMm, 0);
  });

  await t.test("in-plane rotation of the AP overlay is measured on the rotated drawing", () => {
    // Changed meaning: V1 rotation aligns the AP overlay with the MPTA line (in-plane), so it moves the
    // medio-lateral extents of the AP drawing and leaves the antero-posterior reading alone.
    const flat = evaluateTibialFit(3, 0, 0, 42.5, 68.2, 0);
    const turned = evaluateTibialFit(3, 0, 0, 42.5, 68.2, 10);
    assert.equal(flat.medialOverhangMm + flat.lateralOverhangMm, 0);
    assert.ok(turned.medialOverhangMm + turned.lateralOverhangMm > 0, "a turned tray reaches past the marked edge");
    assert.equal(turned.anteriorOverhangMm, flat.anteriorOverhangMm);
    assert.equal(turned.posteriorOverhangMm, flat.posteriorOverhangMm);
  });
});

test("Femoral fit uses the same worst-of rule", async (t) => {
  await t.test("coverage between 85 and 90 is borderline, not acceptable", () => {
    // Size 1 against a bone wider than it is: ML coverage falls to the borderline band.
    const r = evaluateFemoralFit(1, 0, 0, 52, 64.5, 0);
    assert.ok(r.mlCoveragePct >= 85 && r.mlCoveragePct < 90, `ML coverage ${r.mlCoveragePct}`);
    assert.equal(r.mlCoverageTone, "warn");
    assert.equal(r.fitStatus, "BORDERLINE FIT");
  });

  await t.test("poor coverage is a poor fit even when the anterior gap is small", () => {
    const r = evaluateFemoralFit(1, 0, 0, 59, 75, 0);
    assert.equal(r.fitStatus, "POOR FIT");
  });

  await t.test("a gap over 0.5 mm at the anterior cortex keeps the spec's notch caution", () => {
    const r = evaluateFemoralFit(4, 0, 2, 59, 65, 0);
    assert.ok(r.notchingRiskMm > 0.5);
    assert.equal(r.fitStatus, "CAUTION: Anterior Notch Risk");
  });

  await t.test("side and posterior overhang are reported but carry no verdict", () => {
    const r = evaluateFemoralFit(8, 0, 0, 59, 65, 0);
    assert.ok(r.medialOverhangMm > 0 && r.lateralOverhangMm > 0);
    assert.equal(r.notchTone, "pass");
  });

  await t.test("femoralExtents matches the extents the fit uses", () => {
    const fit = evaluateFemoralFit(4, 1.2, -0.6, 59, 65, 2);
    const ext = femoralExtents(4, 1.2, -0.6, 2);
    assert.deepEqual(fit.extents, ext);
  });
});

test("Markers become a bone model", async (t) => {
  const markers = {
    medial: { x: 30, y: 50 },
    lateral: { x: 40, y: 50 },
    anterior: { x: 60, y: 40 },
    posterior: { x: 50, y: 40 },
  };

  await t.test("width, depth and the middle of each pair come from the marks", () => {
    const bone = deriveBone("tibial", markers, scale(), scale());
    assert.ok(bone.complete);
    assert.equal(Number(bone.mlMm!.toFixed(1)), 10); // 100 px at 0.1 mm/px
    assert.equal(Number(bone.apMm!.toFixed(1)), 10);
    assert.deepEqual(bone.flapOrigin, { x: 350, y: 500 });
    assert.deepEqual(bone.klatOrigin, { x: 550, y: 400 });
  });

  await t.test("the medial side is whichever side the surgeon marked as medial", () => {
    const medialOnLeft = deriveBone("tibial", markers, scale(), scale());
    assert.equal(medialOnLeft.orientation.medialSide, "negX");
    const swapped = deriveBone("tibial", { ...markers, medial: markers.lateral, lateral: markers.medial }, scale(), scale());
    assert.equal(swapped.orientation.medialSide, "posX");
  });

  await t.test("anterior-on-the-right in the lateral view is remembered", () => {
    assert.equal(deriveBone("tibial", markers, scale(), scale()).anteriorImageSign, 1);
    const flipped = deriveBone("tibial", { ...markers, anterior: markers.posterior, posterior: markers.anterior }, scale(), scale());
    assert.equal(flipped.anteriorImageSign, -1);
  });

  await t.test("an uncalibrated scan is flagged as an estimate", () => {
    assert.equal(deriveBone("tibial", markers, scale(false), scale()).scaleEstimated, true);
    assert.equal(deriveBone("tibial", markers, scale(), scale()).scaleEstimated, false);
  });

  await t.test("nothing is guessed when a marker or a scan size is missing", () => {
    assert.equal(deriveBone("tibial", { medial: markers.medial }, scale(), scale()).complete, false);
    assert.equal(deriveBone("tibial", markers, undefined, scale()).complete, false);
    assert.equal(deriveBone("tibial", undefined, scale(), scale()).mlMm, undefined);
  });

  await t.test("an implausible size is called out", () => {
    const wide = deriveBone("tibial", { ...markers, medial: { x: 5, y: 50 }, lateral: { x: 95, y: 50 } }, scale(), scale());
    assert.ok(wide.warnings.some((w) => w.includes("outside the usual range")));
  });

  await t.test("allMarkersPlaced needs all four", () => {
    assert.equal(allMarkersPlaced(markers), true);
    assert.equal(allMarkersPlaced({ ...markers, posterior: undefined }), false);
    assert.equal(allMarkersPlaced(undefined), false);
  });
});

test("Markers seed only from an accepted assessment, and are never pre-confirmed", () => {
  const landmarks = {
    tibiaProximalMedial: { x: 40, y: 50 },
    tibiaProximalLateral: { x: 60, y: 50 },
    tibiaPlateauAnterior: { x: 30, y: 40 },
    tibiaPlateauPosterior: { x: 70, y: 40 },
  };
  assert.deepEqual(seedMarkers("tibial", { assessment_landmarks: landmarks }), {}, "no assessment, no guess");
  const seeded = seedMarkers("tibial", { assessment_landmarks: landmarks, v1_assessment: {} });
  assert.deepEqual(seeded.medial, { x: 40, y: 50 });
  assert.equal(seeded.confirmed, undefined);
  assert.deepEqual(seedMarkers("femoral", { assessment_landmarks: landmarks, v1_assessment: {} }), {}, "femoral keys are separate");
});

test("Image and model axes line up in both views", () => {
  const origin = { x: 500, y: 300 };
  assert.equal(modelXToImage(2, origin, 0.1), 520);
  // Anterior on the image right: a posterior move goes left.
  assert.equal(modelYToImageX(2, origin, 0.1, 1), 480);
  assert.equal(modelYToImageX(2, origin, 0.1, -1), 520);
  // Dragging right 20 px with anterior on the right is 2 mm anterior, i.e. y = -2.
  assert.equal(imageDxToModelY(20, 0.1, 1), -2);
  assert.equal(imageDxToModelY(20, 0.1, -1), 2);
});

test("Size ranking and auto-fit pick a fit that is actually good", async (t) => {
  const bone = deriveBone(
    "tibial",
    { medial: { x: 33, y: 50 }, lateral: { x: 33 + 68.2 / 0.1 / 10, y: 50 }, anterior: { x: 40, y: 40 }, posterior: { x: 40 + 42.5 / 0.1 / 10, y: 40 } },
    scale(),
    scale(),
  );

  await t.test("a bone sized for a 3 recommends a 3, and the table covers all six", () => {
    const { rows, recommended } = rankTibialSizes(bone);
    assert.equal(rows.length, 6);
    assert.equal(recommended, 3);
  });

  await t.test("auto-fit recovers a good position from a bad one", () => {
    const start = evaluateTibialFit(3, 3, 2.5, bone.apMm!, bone.mlMm!, 0);
    const best = autoFitTibial(3, bone, 0);
    const fitted = evaluateTibialFit(3, best.x, best.y, bone.apMm!, bone.mlMm!, 0);
    assert.ok(fitted.coveragePct > start.coveragePct);
    assert.equal(fitted.worstTone, "pass");
    assert.ok(Math.hypot(best.x, best.y) <= 0.5, "a matched tray belongs at the middle");
  });

  await t.test("femoral ranking and auto-fit flush the anterior flange", () => {
    const femur = deriveBone(
      "femoral",
      { medial: { x: 30, y: 50 }, lateral: { x: 30 + 64.1 / 0.1 / 10, y: 50 }, anterior: { x: 40, y: 40 }, posterior: { x: 40 + 58.4 / 0.1 / 10, y: 40 } },
      scale(),
      scale(),
    );
    const { rows, recommended } = rankFemoralSizes(femur);
    assert.equal(rows.length, 8);
    assert.equal(recommended, 4);
    const start = evaluateFemoralFit(4, 0, 3, femur.apMm!, femur.mlMm!, 0, femur.orientation);
    const best = autoFitFemoral(4, femur, 0);
    const fitted = evaluateFemoralFit(4, best.x, best.y, femur.apMm!, femur.mlMm!, 0, femur.orientation);
    assert.ok(fitted.notchingRiskMm <= start.notchingRiskMm);
    assert.equal(fitted.worstTone, "pass");
  });

  await t.test("nothing is ranked until the bone is known", () => {
    const none = deriveBone("tibial", {}, scale(), scale());
    assert.deepEqual(rankTibialSizes(none).rows, []);
    assert.deepEqual(autoFitTibial(3, none, 0), { x: 0, y: 0 });
  });
});

test("Edge gaps are signed: positive is a gap, negative is overhang", () => {
  const bone = deriveBone(
    "tibial",
    { medial: { x: 30, y: 50 }, lateral: { x: 40, y: 50 }, anterior: { x: 40, y: 40 }, posterior: { x: 50, y: 40 } },
    scale(),
    scale(),
  );
  // 10 mm wide, 10 mm deep, centred. An 8 mm wide implant centred leaves a 1 mm gap each side.
  const gaps = sideGaps({ minX: -4, maxX: 4, minY: -5, maxY: 6 }, bone);
  assert.equal(Number(gaps.medial.toFixed(1)), 1);
  assert.equal(Number(gaps.lateral.toFixed(1)), 1);
  assert.equal(Number(gaps.anterior.toFixed(1)), 0);
  assert.equal(Number(gaps.posterior.toFixed(1)), -1);
});
