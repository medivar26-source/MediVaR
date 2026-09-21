import { describe, it } from "node:test";
import assert from "node:assert";
import { PLANS } from "../../../lib/data/plans";
import {
  TIBIAL_TEMPLATES,
  FEMORAL_TEMPLATES,
  evaluateTibialFit,
  evaluateFemoralFit,
} from "../../../lib/data/tkr_templates";
import { pxToMm, mmToPx, DEFAULT_CALIBRATION } from "../../../lib/data/calibration";

describe("V1 TKA Planning Workflow & Calibration", () => {
  it("should correctly convert pixels and mm using 0.264 mm/px calibration", () => {
    assert.strictEqual(DEFAULT_CALIBRATION.mm_per_px, 0.264);
    // 100 pixels * 0.264 mm/px = 26.4 mm
    assert.strictEqual(pxToMm(100), 26.4);
    // 26.4 mm / 0.264 mm/px = 100.0 px
    assert.strictEqual(mmToPx(26.4), 100.0);
  });

  it("should provide exact discrete catalog sizes for Tibial (1 to 6) and Femoral (1 to 8)", () => {
    assert.strictEqual(TIBIAL_TEMPLATES.length, 6);
    assert.strictEqual(TIBIAL_TEMPLATES[0].size, 1);
    assert.strictEqual(TIBIAL_TEMPLATES[5].size, 6);
    // Suggested Tibial Size 3
    assert.strictEqual(TIBIAL_TEMPLATES[2].size, 3);
    assert.strictEqual(TIBIAL_TEMPLATES[2].apMm, 42.5);
    assert.strictEqual(TIBIAL_TEMPLATES[2].mlMm, 68.2);

    assert.strictEqual(FEMORAL_TEMPLATES.length, 8);
    assert.strictEqual(FEMORAL_TEMPLATES[0].size, 1);
    assert.strictEqual(FEMORAL_TEMPLATES[7].size, 8);
    // Suggested Femoral Size 4
    assert.strictEqual(FEMORAL_TEMPLATES[3].size, 4);
    assert.strictEqual(FEMORAL_TEMPLATES[3].apMm, 58.4);
    assert.strictEqual(FEMORAL_TEMPLATES[3].mlMm, 64.1);
  });

  it("should evaluate tibial fit metrics against clinical tolerances (≥90% coverage, ≤1.0mm overhang)", () => {
    const acceptable = evaluateTibialFit(3, 1.2, -0.4, 43.0, 69.0);
    assert.ok(acceptable.coveragePct >= 90.0, "Coverage should be >= 90%");
    assert.ok(acceptable.medialOverhangMm <= 1.0, "Medial overhang should be <= 1.0mm");
    assert.ok(acceptable.lateralOverhangMm <= 1.0, "Lateral overhang should be <= 1.0mm");
    assert.strictEqual(acceptable.fitStatus, "ACCEPTABLE FIT");

    // Extreme lateral shift causing >1.5mm overhang
    const excessiveOverhang = evaluateTibialFit(3, 4.0, 0, 43.0, 69.0);
    assert.strictEqual(excessiveOverhang.fitStatus, "CAUTION: Overhang > 1.5mm");
  });

  it("should evaluate femoral fit and anterior notching risk against clinical tolerances", () => {
    const acceptable = evaluateFemoralFit(4, 0.5, 0.0, 59.0, 65.0);
    assert.ok(acceptable.apCoveragePct >= 90.0);
    assert.ok(acceptable.mlCoveragePct >= 90.0);
    assert.strictEqual(acceptable.notchingRiskMm, 0.0);
    assert.strictEqual(acceptable.fitStatus, "ACCEPTABLE FIT");

    // Posterior displacement creating anterior notching risk
    const notching = evaluateFemoralFit(4, 0.5, -2.0, 59.0, 65.0);
    assert.ok(notching.notchingRiskMm > 0.5);
    assert.strictEqual(notching.fitStatus, "CAUTION: Anterior Notch Risk");
  });

  it("should contain complete V1 payload structures in synthetic demo cases", () => {
    const varusPlan = PLANS.find((p) => p.caseId === "SYNTH-VARUS-001");
    assert.ok(varusPlan);
    assert.ok(varusPlan.payload.v1_assessment);
    assert.strictEqual(varusPlan.payload.v1_assessment.MAD_mm, 12.0);
    assert.strictEqual(varusPlan.payload.v1_assessment.AMA_deg, 6.0);
    assert.strictEqual(varusPlan.payload.v1_assessment.mHKA_deg, 7.0);
    assert.strictEqual(varusPlan.payload.v1_assessment.MPTA_deg, 89.0);
    assert.strictEqual(varusPlan.payload.v1_assessment.LDFA_deg, 88.0);
    assert.strictEqual(varusPlan.payload.v1_assessment.PTS_deg, 7.0);

    assert.ok(varusPlan.payload.v1_tibial);
    assert.strictEqual(varusPlan.payload.v1_tibial.implant_size, 3);
    assert.strictEqual(varusPlan.payload.v1_tibial.position_2d.x_offset_mm, 1.2);
    assert.strictEqual(varusPlan.payload.v1_tibial.position_2d.y_offset_mm, -0.4);
    assert.strictEqual(varusPlan.payload.v1_tibial.position_2d.rotation_deg, 0.5);

    assert.ok(varusPlan.payload.v1_femoral);
    assert.strictEqual(varusPlan.payload.v1_femoral.implant_size, 4);
    assert.strictEqual(varusPlan.payload.v1_femoral.position_2d.x_offset_mm, 0.5);
    assert.strictEqual(varusPlan.payload.v1_femoral.position_2d.y_offset_mm, 0.0);
    assert.strictEqual(varusPlan.payload.v1_femoral.position_2d.rotation_deg, 0.0);
  });
});
