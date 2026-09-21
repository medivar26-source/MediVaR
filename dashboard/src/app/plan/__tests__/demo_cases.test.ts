import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { CASES } from "../../../lib/seed";
import { PLANS } from "../../../lib/data/plans";

describe("Synthetic TKR Demo Cases", () => {
  it("should contain SYNTH-VARUS-001 in CASES and PLANS", () => {
    const varusCase = CASES.find((c) => c.id === "SYNTH-VARUS-001");
    assert.ok(varusCase, "SYNTH-VARUS-001 case must exist in CASES");
    
    const varusPlan = PLANS.find((p) => p.caseId === "SYNTH-VARUS-001");
    assert.ok(varusPlan, "SYNTH-VARUS-001 plan must exist in PLANS");
    assert.strictEqual(varusPlan.payload.workflow, "tkr", "Varus plan must have workflow: 'tkr'");
    assert.ok(varusPlan.payload.assessment_landmarks, "Varus plan must have assessment_landmarks");
    
    // Type assertion is safe here for tests since we know the shape we just put in.
    const landmarks = varusPlan.payload.assessment_landmarks as any;
    assert.strictEqual(landmarks.femoral_knee_center.x, 65, "Varus knee center should be 65");
  });

  it("should contain SYNTH-VALGUS-001 in CASES and PLANS", () => {
    const valgusCase = CASES.find((c) => c.id === "SYNTH-VALGUS-001");
    assert.ok(valgusCase, "SYNTH-VALGUS-001 case must exist in CASES");
    
    const valgusPlan = PLANS.find((p) => p.caseId === "SYNTH-VALGUS-001");
    assert.ok(valgusPlan, "SYNTH-VALGUS-001 plan must exist in PLANS");
    assert.strictEqual(valgusPlan.payload.workflow, "tkr", "Valgus plan must have workflow: 'tkr'");
    assert.ok(valgusPlan.payload.assessment_landmarks, "Valgus plan must have assessment_landmarks");
    
    const landmarks = valgusPlan.payload.assessment_landmarks as any;
    assert.strictEqual(landmarks.femoral_knee_center.x, 35, "Valgus knee center should be 35");
  });

  it("should verify existence of synthetic image assets", () => {
    const publicDir = path.join(process.cwd(), "public");
    
    const requiredImages = [
      "synth_varus_flap.jpg",
      "synth_varus_klat.jpg",
      "synth_valgus_flap.jpg",
      "synth_valgus_klat.jpg",
    ];

    for (const image of requiredImages) {
      const exists = fs.existsSync(path.join(publicDir, image));
      assert.ok(exists, `Image asset ${image} should exist in public directory`);
    }
  });
});
