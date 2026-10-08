import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TIBIAL_FIT_THRESHOLDS,
  FIT_RULES,
  FEMORAL_NOTCH_LIMIT_MM,
  evaluateFemoralFit,
  evaluateTibialFit,
  femoralExtents,
  overhangCautionTag,
} from "../data/tkr_templates";
import { FEMORAL_SIZE_DIMENSIONS, TIBIAL_SIZE_DIMENSIONS } from "../data/implant_templates";
import { deriveBone, plateauLineAngleDeg, rankFemoralSizes, rankTibialSizes } from "../data/fit_markers";

const scan = { widthPx: 1000, heightPx: 1000, mmPerPx: 0.1, calibrated: true };

test("V1 thresholds are the PDF's, and the rules say where each comes from", async (t) => {
  await t.test("the V1 numbers", () => {
    assert.equal(DEFAULT_TIBIAL_FIT_THRESHOLDS.minCoveragePct, 90.0);
    assert.equal(DEFAULT_TIBIAL_FIT_THRESHOLDS.maxOverhangMm, 1.0);
    assert.equal(DEFAULT_TIBIAL_FIT_THRESHOLDS.cautionOverhangMm, 1.5);
  });

  await t.test("rule provenance: only the PDF's rules are SOURCE_VERIFIED; extras are labelled", () => {
    const verified = FIT_RULES.filter((r) => r.classification === "SOURCE_VERIFIED");
    assert.deepEqual(verified.map((r) => r.id).sort(), ["tibial.coverage.min", "tibial.overhang.caution", "tibial.overhang.max"]);
    assert.ok(verified.every((r) => r.v1));
    for (const r of FIT_RULES.filter((x) => !x.v1)) {
      assert.ok(["PROJECT_RULE", "ENGINEERING_DERIVATION"].includes(r.classification), r.id);
      assert.ok(r.source.length > 10);
    }
    assert.equal(FEMORAL_NOTCH_LIMIT_MM, 0.5);
    assert.equal(FIT_RULES.find((r) => r.id === "femoral.notch.limit")!.classification, "PROJECT_RULE");
  });
});

test("Tibial fit — coverage, medial and lateral overhang, and the 1.5 mm caution", async (t) => {
  await t.test("a matched size at the centre is ACCEPTABLE with no overhang and ≥ 90 % coverage", () => {
    for (const d of TIBIAL_SIZE_DIMENSIONS) {
      const r = evaluateTibialFit(d.size, 0, 0, d.apMm, d.mlMm);
      assert.equal(r.fitStatus, "ACCEPTABLE FIT", `size ${d.size}`);
      assert.ok(r.coveragePct >= 90, `size ${d.size} coverage ${r.coveragePct}`);
      assert.equal(r.medialOverhangMm + r.lateralOverhangMm, 0);
      assert.deepEqual(r.cautionTags, []);
    }
  });

  await t.test("lateral shift of 1.0 mm is still within the limit; 1.2 mm is between the limits", () => {
    assert.equal(evaluateTibialFit(3, 1.0, 0, 42.5, 68.2).fitStatus, "ACCEPTABLE FIT");
    const mid = evaluateTibialFit(3, 1.2, 0, 42.5, 68.2);
    assert.equal(mid.lateralOverhangMm, 1.2);
    assert.equal(mid.lateralTone, "warn");
    assert.deepEqual(mid.cautionTags, [], "no caution until the overhang passes 1.5 mm");
  });

  await t.test("overhang beyond 1.5 mm carries the PDF's exact caution text, on the medial or the lateral side", () => {
    const lateral = evaluateTibialFit(3, 2.0, 0, 42.5, 68.2);
    assert.deepEqual(lateral.cautionTags, ["CAUTION: Lateral Overhang > 1.5mm"]);
    const medial = evaluateTibialFit(3, -2.0, 0, 42.5, 68.2);
    assert.deepEqual(medial.cautionTags, ["CAUTION: Medial Overhang > 1.5mm"]);
    assert.equal(overhangCautionTag("Medial", 1.5), "CAUTION: Medial Overhang > 1.5mm");
    assert.equal(lateral.fitStatus, "POOR FIT");
  });

  await t.test("a left knee reads medial/lateral from the marked side", () => {
    const left = evaluateTibialFit(3, 2.0, 0, 42.5, 68.2, 0, undefined, undefined, { medialSide: "posX", anteriorSide: "negY" });
    assert.deepEqual(left.cautionTags, ["CAUTION: Medial Overhang > 1.5mm"]);
  });

  await t.test("coverage falls when the tray is moved off the bone", () => {
    const centred = evaluateTibialFit(3, 0, 0, 42.5, 68.2);
    const off = evaluateTibialFit(3, 6, 0, 42.5, 68.2);
    assert.ok(off.coveragePct < centred.coveragePct - 5);
  });

  await t.test("no example numbers are used as defaults: with no bone supplied the fit is against the template's own size", () => {
    const nominal = evaluateTibialFit(5, 0, 0);
    const explicit = evaluateTibialFit(5, 0, 0, 48.0, 76.5);
    assert.deepEqual(nominal, explicit);
    assert.notDeepEqual(evaluateTibialFit(5, 0, 0), evaluateTibialFit(5, 0, 0, 42.5, 68.2), "the PDF's example bone is not the default");
  });

  await t.test("a too-small size under-covers; a too-big size overhangs", () => {
    const small = evaluateTibialFit(1, 0, 0, 45, 72);
    assert.ok(small.coveragePct < 90);
    const big = evaluateTibialFit(6, 0, 0, 45, 72);
    assert.ok(big.medialOverhangMm > 1.5 && big.lateralOverhangMm > 1.5);
  });
});

test("Femoral fit — AP coverage, ML coverage and anterior notching are read on their own views", async (t) => {
  await t.test("every size, matched to its own bone, is ACCEPTABLE with full coverage and a flush front", () => {
    for (const d of FEMORAL_SIZE_DIMENSIONS) {
      const r = evaluateFemoralFit(d.size, 0, 0, d.apMm, d.mlMm);
      assert.equal(r.fitStatus, "ACCEPTABLE FIT", `size ${d.size}`);
      assert.equal(r.apCoveragePct, 100);
      assert.equal(r.mlCoveragePct, 100);
      assert.equal(r.notchingRiskMm, 0);
    }
  });

  await t.test("ML coverage comes from the AP drawing: a narrower component spans less of a wider bone", () => {
    const r = evaluateFemoralFit(4, 0, 0, 58.4, 70);
    assert.ok(Math.abs(r.mlCoveragePct - (64.1 / 70) * 100) < 0.2);
    assert.equal(r.apCoveragePct, 100);
  });

  await t.test("AP coverage comes from the lateral drawing", () => {
    const r = evaluateFemoralFit(4, 0, 0, 64, 64.1);
    assert.ok(Math.abs(r.apCoveragePct - (58.4 / 64) * 100) < 0.2);
    assert.equal(r.mlCoveragePct, 100);
  });

  await t.test("a gap at the anterior cortex is the notching reading; over 0.5 mm raises the caution", () => {
    const flush = evaluateFemoralFit(4, 0, 0, 58.4, 64.1);
    assert.equal(flush.notchingRiskMm, 0);
    const gap = evaluateFemoralFit(4, 0, 1.2, 58.4, 64.1);
    assert.equal(gap.notchingRiskMm, 1.2);
    assert.equal(gap.fitStatus, "CAUTION: Anterior Notch Risk");
    const small = evaluateFemoralFit(4, 0, 0.4, 58.4, 64.1);
    assert.equal(small.notchTone, "pass");
  });

  await t.test("the in-plane rotation only changes what the AP drawing shows", () => {
    const flat = evaluateFemoralFit(4, 0, 0, 58.4, 64.1, 0);
    const turned = evaluateFemoralFit(4, 0, 0, 58.4, 64.1, 12);
    assert.equal(turned.apCoveragePct, flat.apCoveragePct);
    assert.equal(turned.notchingRiskMm, flat.notchingRiskMm);
    assert.ok(turned.mlCoveragePct < flat.mlCoveragePct || turned.lateralOverhangMm + turned.medialOverhangMm > 0);
    assert.deepEqual(femoralExtents(4, 0, 0, 12), turned.extents);
  });
});

test("Size ranking and the rotation limit", async (t) => {
  const markers = { medial: { x: 10, y: 50 }, lateral: { x: 74, y: 50 }, anterior: { x: 70, y: 40 }, posterior: { x: 12, y: 40 } };

  await t.test("the best-matching size is highlighted, not hard-coded to size 3 or 4", () => {
    // 0.1 mm per pixel on a 1000 px scan: 61 % of the width is 61 mm.
    const small = deriveBone("tibial", { medial: { x: 10, y: 50 }, lateral: { x: 71, y: 50 }, anterior: { x: 60, y: 40 }, posterior: { x: 22, y: 40 } }, scan, scan); // 61 × 38 mm
    const big = deriveBone("tibial", { medial: { x: 10, y: 50 }, lateral: { x: 91, y: 50 }, anterior: { x: 60, y: 40 }, posterior: { x: 9, y: 40 } }, scan, scan); // 81 × 51 mm
    assert.ok(small.complete && big.complete);
    const a = rankTibialSizes(small).recommended!;
    const b = rankTibialSizes(big).recommended!;
    assert.ok(b > a, `a wider, deeper plateau recommends a bigger tray (${a} → ${b})`);
    assert.ok(markers && rankFemoralSizes(deriveBone("femoral", markers, scan, scan)).rows.length === 8);
  });

  await t.test("the plateau line angle follows the two edge marks on the AP scan", () => {
    const flat = plateauLineAngleDeg({ medial: { x: 30, y: 50 }, lateral: { x: 40, y: 50 } }, scan);
    assert.equal(flat, 0);
    const tilted = plateauLineAngleDeg({ medial: { x: 30, y: 50 }, lateral: { x: 40, y: 51 } }, scan);
    assert.ok(Math.abs(tilted! - 5.7) < 0.1, `got ${tilted}`);
    // The answer does not depend on which mark is on the left.
    assert.equal(plateauLineAngleDeg({ medial: { x: 40, y: 51 }, lateral: { x: 30, y: 50 } }, scan), tilted);
    assert.equal(plateauLineAngleDeg({ medial: { x: 30, y: 50 } }, scan), undefined);
    assert.equal(plateauLineAngleDeg({ medial: { x: 30, y: 50 }, lateral: { x: 40, y: 50 } }, undefined), undefined);
  });
});
