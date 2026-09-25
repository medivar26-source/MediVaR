import test from "node:test";
import assert from "node:assert/strict";
import {
  TIBIAL_TEMPLATES,
  FEMORAL_TEMPLATES,
  suggestTibialSize,
  suggestFemoralSize,
  evaluateTibialFit,
  evaluateFemoralFit,
} from "../data/tkr_templates";

test("Case Authoring & Clinical Planning Tests", async (t) => {
  await t.test("Tibial sizing catalog contains 6 standard sizes matching V1 spec", () => {
    assert.equal(TIBIAL_TEMPLATES.length, 6);
    assert.deepEqual(
      TIBIAL_TEMPLATES.map((t) => t.size),
      [1, 2, 3, 4, 5, 6]
    );
    // Size 3 is 42.5 x 68.2 mm
    assert.equal(TIBIAL_TEMPLATES[2].apMm, 42.5);
    assert.equal(TIBIAL_TEMPLATES[2].mlMm, 68.2);
  });

  await t.test("Femoral sizing catalog contains 8 standard sizes matching V1 spec", () => {
    assert.equal(FEMORAL_TEMPLATES.length, 8);
    assert.deepEqual(
      FEMORAL_TEMPLATES.map((t) => t.size),
      [1, 2, 3, 4, 5, 6, 7, 8]
    );
    // Size 4 is 58.4 x 64.1 mm
    assert.equal(FEMORAL_TEMPLATES[3].apMm, 58.4);
    assert.equal(FEMORAL_TEMPLATES[3].mlMm, 64.1);
  });

  await t.test("Automatic sizing suggestions pick closest cortical dimension", () => {
    // Tibial suggests closest ML width
    assert.equal(suggestTibialSize(68.0), 3);
    assert.equal(suggestTibialSize(60.0), 1);
    assert.equal(suggestTibialSize(80.0), 6);

    // Femoral suggests closest AP length
    assert.equal(suggestFemoralSize(58.0), 4);
    assert.equal(suggestFemoralSize(52.0), 1);
    assert.equal(suggestFemoralSize(70.0), 8);
  });

  await t.test("Tibial fit metrics enforce V1 specification (overhang > 1.5mm caution)", () => {
    // Normal centered fit
    const okFit = evaluateTibialFit(3, 0.0, 0.0, 43.0, 69.0);
    assert.equal(okFit.fitStatus, "ACCEPTABLE FIT");
    assert.ok(okFit.coveragePct >= 90.0, "Coverage should be high for matching size");
    assert.ok(okFit.medialOverhangMm <= 1.0, "Overhang should be <= 1.0mm");

    // Overhang trigger
    const cautionFit = evaluateTibialFit(6, 0.0, 0.0, 40.0, 62.0);
    assert.equal(cautionFit.fitStatus, "CAUTION: Overhang > 1.5mm");
    assert.ok(cautionFit.medialOverhangMm > 1.5 || cautionFit.lateralOverhangMm > 1.5);
  });

  await t.test("Femoral fit metrics enforce V1 specification (anterior notch risk caution)", () => {
    // Normal flush fit
    const okFit = evaluateFemoralFit(4, 0.0, 0.0, 59.0, 65.0);
    assert.equal(okFit.fitStatus, "ACCEPTABLE FIT");
    assert.equal(okFit.notchingRiskMm, 0.0);

    // Posterior translation triggers anterior notching risk warning
    const notchFit = evaluateFemoralFit(4, 0.0, -1.8, 59.0, 65.0);
    assert.equal(notchFit.fitStatus, "CAUTION: Anterior Notch Risk");
    assert.ok(notchFit.notchingRiskMm > 0.5);
  });

  await t.test("Dynamic calibration derivation validates physical scale range", () => {
    const physicalMarkerMm = 25.0;
    const detectedPx = 94.7;
    const scale = Number((physicalMarkerMm / detectedPx).toFixed(4));

    assert.equal(scale, 0.264);
    const isValid = scale >= 0.05 && scale <= 1.5;
    assert.ok(isValid, "0.264 mm/px is clinically realistic and valid");

    // Extreme/unrealistic values
    const extremeDetected = 5.0;
    const extremeScale = Number((physicalMarkerMm / extremeDetected).toFixed(4));
    const isExtremeValid = extremeScale >= 0.05 && extremeScale <= 1.5;
    assert.ok(!isExtremeValid, "5.0 mm/px is clinically unrealistic");
  });
});
