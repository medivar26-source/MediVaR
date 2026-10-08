import test from "node:test";
import assert from "node:assert/strict";
import { ASSESSMENT_LOCKED_KEYS, WRITABLE_PLAN_KEYS, checkPlanUpdate, checkSealable, isPlanLocked } from "../data/plan_lock";
import { buildV1VrPayload } from "../data/vr_payload";
import { resolvePatientIdentity } from "../data/planner_identity";
import { placeTemplateInImage, placedSizeMm } from "../data/overlay_geometry";
import { getFemoralImplant, getTibialImplant } from "../data/implant_templates";
import { imageToScreen, screenToImage, type ViewportState } from "../data/coordinates";
import { MEASURE_NEEDS, REQUIRED_LANDMARKS } from "../data/assessment_geometry";
import { deriveBone } from "../data/fit_markers";
import { PLACEHOLDER_MM_PER_PX, mmToPx, pxToMm, formatCalibration, DEFAULT_CALIBRATION } from "../data/calibration";
import { mmToImagePx, normalizeCalibration } from "../data/coordinates";
import type { PlanPayload, V1Assessment } from "../plan";

const assessment: V1Assessment = { MAD_mm: 12, AMA_deg: 6, mHKA_deg: 7, MPTA_deg: 89, LDFA_deg: 88, PTS_deg: 7, alignment_type: "VARUS" };
const pos = (x = 0, y = 0, r = 0) => ({ x_offset_mm: x, y_offset_mm: y, rotation_deg: r });
const completePayload = (over: Partial<PlanPayload> = {}): PlanPayload => ({
  workflow: "tkr",
  v1_assessment: assessment,
  v1_tibial: { implant_size: 3, position_2d: pos(1.2, -0.4, 0.5), is_confirmed: true },
  v1_femoral: { implant_size: 4, position_2d: pos(0.5, 0, 0), is_confirmed: true },
  ...over,
});
const plan = (payload: PlanPayload, extra: { isReadyForVr?: boolean; lockedVersion?: unknown } = {}) => ({
  isReadyForVr: false,
  payload,
  ...extra,
});

test("Plan lock — enforced by rules the server runs, not by a hidden button", async (t) => {
  await t.test("a locked plan accepts no change at all", () => {
    for (const locked of [{ isReadyForVr: true }, { lockedVersion: { versionId: "x" } }]) {
      const r = checkPlanUpdate(plan(completePayload(), locked), { v1_tibial: {} });
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.error, /locked/i);
    }
  });

  await t.test("only the planner's own fields may be written; the sealed VR payload cannot be forged", () => {
    const r = checkPlanUpdate(plan({ workflow: "tkr" }), { v1_vr_payload: { patient_id: "x" } });
    assert.equal(r.ok, false);
    assert.equal(checkPlanUpdate(plan({ workflow: "tkr" }), { lockedVersion: {} }).ok, false);
    assert.equal(checkPlanUpdate(plan({ workflow: "tkr" }), { isReadyForVr: true }).ok, false);
    for (const key of WRITABLE_PLAN_KEYS) assert.equal(checkPlanUpdate(plan({ workflow: "tkr" }), { [key]: {} }).ok, true, key);
  });

  await t.test("Continue on Page 1 locks the assessment: its values, points and scales cannot change afterwards", () => {
    const saved = plan({ workflow: "tkr", v1_assessment: assessment });
    for (const key of ASSESSMENT_LOCKED_KEYS) {
      const r = checkPlanUpdate(saved, { [key]: {} });
      assert.equal(r.ok, false, key);
      if (!r.ok) assert.match(r.error, /assessment is locked/i);
    }
    // Pages 2 and 3 can still be worked on.
    assert.equal(checkPlanUpdate(saved, { v1_tibial: {} }).ok, true);
    assert.equal(checkPlanUpdate(saved, { v1_femoral: {} }).ok, true);
    // Before Continue, the assessment is still editable.
    assert.equal(checkPlanUpdate(plan({ workflow: "tkr" }), { v1_assessment: assessment }).ok, true);
  });

  await t.test("isPlanLocked mirrors the two lock markers", () => {
    assert.equal(isPlanLocked(plan({})), false);
    assert.equal(isPlanLocked(plan({}, { isReadyForVr: true })), true);
    assert.equal(isPlanLocked(plan({}, { lockedVersion: {} })), true);
  });
});

test("Review gating — what must exist before a plan can be locked", async (t) => {
  await t.test("a complete plan can be sealed", () => assert.deepEqual(checkSealable(plan(completePayload())), { ok: true }));

  await t.test("a plan cannot be sealed twice", () => {
    assert.equal(checkSealable(plan(completePayload(), { isReadyForVr: true })).ok, false);
    assert.equal(checkSealable(plan(completePayload(), { lockedVersion: {} })).ok, false);
  });

  await t.test("nothing is filled in: each missing piece blocks the lock with its own message", () => {
    const noAssessment = checkSealable(plan(completePayload({ v1_assessment: undefined })));
    assert.equal(noAssessment.ok, false);
    if (!noAssessment.ok) assert.match(noAssessment.error, /assessment/i);
    const noTibia = checkSealable(plan(completePayload({ v1_tibial: { implant_size: 3, position_2d: pos(), is_confirmed: false } })));
    if (!noTibia.ok) assert.match(noTibia.error, /tibial/i);
    assert.equal(noTibia.ok, false);
    const noFemur = checkSealable(plan(completePayload({ v1_femoral: { implant_size: 4, position_2d: pos(), is_confirmed: false } })));
    if (!noFemur.ok) assert.match(noFemur.error, /femoral/i);
    assert.equal(noFemur.ok, false);
  });

  await t.test("values must be real numbers and sizes must be V1 sizes", () => {
    assert.equal(checkSealable(plan(completePayload({ v1_assessment: { ...assessment, MAD_mm: NaN } }))).ok, false);
    assert.equal(checkSealable(plan(completePayload({ v1_tibial: { implant_size: 7, position_2d: pos(), is_confirmed: true } }))).ok, false);
    assert.equal(checkSealable(plan(completePayload({ v1_femoral: { implant_size: 9, position_2d: pos(), is_confirmed: true } }))).ok, false);
    assert.equal(checkSealable(plan(completePayload({ v1_femoral: { implant_size: 4, position_2d: pos(Infinity), is_confirmed: true } }))).ok, false);
  });
});

test("V1 payload serialisation is exactly the PDF's contract", async (t) => {
  await t.test("keys and nesting", () => {
    const p = buildV1VrPayload({
      patientId: "P-0247",
      kneeSide: "RIGHT",
      assessment,
      tibial: { implant_size: 3, position_2d: pos(1.2, -0.4, 0.5) },
      femoral: { implant_size: 4, position_2d: pos(0.5, 0, 0) },
    });
    assert.deepEqual(p, {
      patient_id: "P-0247",
      knee_side: "RIGHT",
      assessment: { MAD_mm: 12, AMA_deg: 6, mHKA_deg: 7, MPTA_deg: 89, LDFA_deg: 88, PTS_deg: 7 },
      tibial_component: { implant_size: 3, position_2d: { x_offset_mm: 1.2, y_offset_mm: -0.4, rotation_deg: 0.5 } },
      femoral_component: { implant_size: 4, position_2d: { x_offset_mm: 0.5, y_offset_mm: 0, rotation_deg: 0 } },
    });
  });

  await t.test("nothing extra leaks in from the stored plan (no fit metrics, directions, geometry or intra-operative values)", () => {
    const rich = {
      implant_size: 3,
      position_2d: pos(1, 1, 1),
      fit_status: "ACCEPTABLE FIT",
      cortical_coverage_pct: 96,
      level_offset_mm: 3,
      scales: { FLAP: 0.2 },
    };
    const p = buildV1VrPayload({ patientId: "x", kneeSide: "LEFT", assessment, tibial: rich as never, femoral: rich as never });
    assert.deepEqual(Object.keys(p).sort(), ["assessment", "femoral_component", "knee_side", "patient_id", "tibial_component"]);
    assert.deepEqual(Object.keys(p.tibial_component).sort(), ["implant_size", "position_2d"]);
    assert.deepEqual(Object.keys(p.tibial_component.position_2d).sort(), ["rotation_deg", "x_offset_mm", "y_offset_mm"]);
    assert.deepEqual(Object.keys(p.assessment).sort(), ["AMA_deg", "LDFA_deg", "MAD_mm", "MPTA_deg", "PTS_deg", "mHKA_deg"]);
    const json = JSON.stringify(p);
    for (const banned of ["resection", "gap", "cut", "alignment_type", "fit_status", "level_offset"]) assert.ok(!json.includes(banned), banned);
  });
});

test("Patient identity comes from the case, and is never invented", async (t) => {
  await t.test("a recorded patient id, age and sex are used as they are", () => {
    const id = resolvePatientIdentity("CASE-1", [{ label: "Patient ID", value: "P-1234" }, { label: "Age", value: "71 years" }, { label: "Sex", value: "Female" }]);
    assert.deepEqual(id, { patientId: "P-1234", patientIdSource: "case record", age: "71 years", sex: "Female" });
  });

  await t.test("missing age and sex stay missing (no 68 / Male defaults)", () => {
    const id = resolvePatientIdentity("CASE-2", []);
    assert.equal(id.age, undefined);
    assert.equal(id.sex, undefined);
    assert.deepEqual(id, { patientId: "CASE-2", patientIdSource: "case id", age: undefined, sex: undefined });
  });

  await t.test("the two synthetic demo cases carry the PDF's example ids, and say they are fixtures", () => {
    assert.equal(resolvePatientIdentity("SYNTH-VARUS-001", undefined).patientIdSource, "synthetic fixture");
    assert.equal(resolvePatientIdentity("SYNTH-VARUS-001", undefined).patientId, "P-0247");
    assert.equal(resolvePatientIdentity("SYNTH-VALGUS-001", undefined).patientId, "P-0891");
  });
});

test("Assessment and sizing — what is measured and what is reused", async (t) => {
  await t.test("six assessment measurements, three of them on one shared set of hip / knee / ankle points", () => {
    assert.deepEqual(Object.keys(MEASURE_NEEDS).sort(), ["ama", "ldfa", "mad", "mhka", "mpta", "pts"]);
    for (const k of ["mad", "mhka", "mpta", "ldfa", "ama"] as const) assert.equal(MEASURE_NEEDS[k].view, "FLAP");
    assert.equal(MEASURE_NEEDS.pts.view, "KLAT");
    const total = Object.values(MEASURE_NEEDS).reduce((n, m) => n + m.keys.length, 0);
    assert.ok(REQUIRED_LANDMARKS.length < total, "a point used by several measurements is placed once");
    assert.equal(new Set(REQUIRED_LANDMARKS).size, REQUIRED_LANDMARKS.length);
    const users = (k: string) => Object.values(MEASURE_NEEDS).filter((m) => (m.keys as string[]).includes(k)).length;
    assert.ok(users("hipCenter") >= 3 && users("kneeCenter") >= 4 && users("ankleCenter") >= 2);
  });

  await t.test("four sizing dimensions: ML on the AP scan, AP on the lateral scan, tibial and femoral", () => {
    const view = { widthPx: 1000, heightPx: 1000, mmPerPx: 0.1, calibrated: true };
    // 0.1 mm per pixel on a 1000 px scan: 80 % of the width is 80 mm.
    const markers = { medial: { x: 10, y: 50 }, lateral: { x: 90, y: 50 }, anterior: { x: 80, y: 40 }, posterior: { x: 20, y: 40 } };
    for (const kind of ["tibial", "femoral"] as const) {
      const bone = deriveBone(kind, markers, view, view);
      assert.ok(Math.abs(bone.mlMm! - 80) < 1e-6, `${kind} ML from the AP scan`);
      assert.ok(Math.abs(bone.apMm! - 60) < 1e-6, `${kind} AP from the lateral scan`);
    }
  });

  await t.test("a different scale on each scan gives different millimetres from the same clicks", () => {
    const markers = { medial: { x: 10, y: 50 }, lateral: { x: 90, y: 50 }, anterior: { x: 80, y: 40 }, posterior: { x: 20, y: 40 } };
    const a = deriveBone("tibial", markers, { widthPx: 1000, heightPx: 1000, mmPerPx: 0.1, calibrated: true }, { widthPx: 1000, heightPx: 1000, mmPerPx: 0.2, calibrated: true });
    assert.ok(Math.abs(a.mlMm! - 80) < 1e-6);
    assert.ok(Math.abs(a.apMm! - 120) < 1e-6);
  });
});

test("Calibration is patient-specific; an unverified scale can never silently become verified", async (t) => {
  await t.test("the placeholder is never valid and is refused for measurement", () => {
    assert.equal(DEFAULT_CALIBRATION.isValid, false);
    assert.ok(Number.isNaN(pxToMm(100, DEFAULT_CALIBRATION)));
    assert.ok(Number.isNaN(mmToPx(10, DEFAULT_CALIBRATION)));
    assert.equal(PLACEHOLDER_MM_PER_PX, 0.264);
    assert.match(formatCalibration(DEFAULT_CALIBRATION), /not verified/);
    assert.equal(formatCalibration(undefined), "Scale not set");
  });

  await t.test("a scan with no calibration is estimated, and stays estimated however often it is normalised", () => {
    const once = normalizeCalibration(undefined, "klat");
    assert.equal(once.isValid, false);
    assert.equal(normalizeCalibration(once, "klat").isValid, false);
    assert.equal(normalizeCalibration({ mm_per_px: 9, is_valid: true }).isValid, false, "an unrealistic scale is not valid");
    assert.equal(normalizeCalibration({ mm_per_px: 0.2 }).isValid, true);
    assert.equal(normalizeCalibration({ mm_per_px: 0.2, is_valid: false }).isValid, false);
  });

  await t.test("there is no fallback scale inside the converters", () => {
    assert.ok(Number.isNaN(mmToImagePx(10, 0)));
    assert.ok(Number.isNaN(mmToImagePx(10, -1)));
    assert.equal(mmToImagePx(10, 0.25), 40);
  });
});

test("Overlay placement is physical: scaled by the scan's own scale, independent of zoom and pan", async (t) => {
  const origin = { x: 500, y: 400 };

  await t.test("a template's width on the scan is its ML dimension divided by that scan's mm per pixel", () => {
    const tpl = getTibialImplant(3);
    for (const mmPerPx of [0.1, 0.264, 0.7692]) {
      const p = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx, anteriorImageSign: 1, position: pos() });
      const xs = p.silhouettePx.map((q) => q.x);
      const widthPx = Math.max(...xs) - Math.min(...xs);
      assert.ok(Math.abs(widthPx - tpl.dimensionsMm.ml / mmPerPx) < 0.05 / mmPerPx, `scale ${mmPerPx}`);
      assert.ok(Math.abs(placedSizeMm(p, mmPerPx).widthMm - tpl.dimensionsMm.ml) < 0.06);
    }
  });

  await t.test("translation moves the template by the offset in millimetres", () => {
    const tpl = getTibialImplant(3);
    const a = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: 0.25, anteriorImageSign: 1, position: pos() });
    const b = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: 0.25, anteriorImageSign: 1, position: pos(5, 0, 0) });
    assert.ok(Math.abs(b.cx - a.cx - 20) < 1e-9, "5 mm at 0.25 mm/px is 20 px");
    const lat = placeTemplateInImage({ template: tpl, view: "KLAT", origin, mmPerPx: 0.25, anteriorImageSign: 1, position: pos(0, 2, 0) });
    const lat0 = placeTemplateInImage({ template: tpl, view: "KLAT", origin, mmPerPx: 0.25, anteriorImageSign: 1, position: pos() });
    assert.ok(Math.abs(lat0.cx - lat.cx - 8) < 1e-9, "posterior (+y) is towards the image left when anterior is on the right");
  });

  await t.test("rotation turns the AP drawing in place about its centre handle and leaves the lateral drawing alone", () => {
    const tpl = getFemoralImplant(4);
    const flat = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: 0.2, anteriorImageSign: 1, position: pos() });
    const turned = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: 0.2, anteriorImageSign: 1, position: pos(0, 0, 10) });
    assert.equal(turned.cx, flat.cx);
    assert.equal(turned.cy, flat.cy);
    assert.notDeepEqual(turned.silhouettePx, flat.silhouettePx);
    // A rotation preserves every distance from the pivot.
    const dist = (p: { x: number; y: number }, c: { cx: number; cy: number }) => Math.hypot(p.x - c.cx, p.y - c.cy);
    flat.silhouettePx.forEach((p, i) => assert.ok(Math.abs(dist(p, flat) - dist(turned.silhouettePx[i], turned)) < 1e-6));
    const latFlat = placeTemplateInImage({ template: tpl, view: "KLAT", origin, mmPerPx: 0.2, anteriorImageSign: 1, position: pos() });
    const latTurned = placeTemplateInImage({ template: tpl, view: "KLAT", origin, mmPerPx: 0.2, anteriorImageSign: 1, position: pos(0, 0, 10) });
    assert.deepEqual(latFlat.silhouettePx, latTurned.silhouettePx);
    assert.equal(latTurned.rotationDeg, 0);
  });

  await t.test("zoom and pan never change image-space geometry: screen ↔ image round-trips at any zoom and pan", () => {
    const tpl = getTibialImplant(4);
    const placed = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: 0.264, anteriorImageSign: 1, position: pos(1.2, 0, 0.5) });
    for (const zoom of [0.5, 1, 2, 3, 5]) {
      for (const pan of [{ x: 0, y: 0 }, { x: 130, y: -80 }]) {
        const vp: ViewportState = {
          naturalWidth: 1000, naturalHeight: 1000, fittedWidth: 800, fittedHeight: 800, fitScale: 0.8,
          zoom, pan, containerRect: { left: 10, top: 20, width: 900, height: 900 },
        };
        for (const p of placed.silhouettePx.slice(0, 12)) {
          const back = screenToImage(imageToScreen(p, vp), vp);
          assert.ok(Math.hypot(back.x - p.x, back.y - p.y) < 1e-6, `zoom ${zoom}`);
        }
        // On screen the template is physically the same size: (screen px / (fitScale × zoom)) × mm/px = mm.
        const a = imageToScreen(placed.silhouettePx[0], vp);
        const b = imageToScreen(placed.silhouettePx[5], vp);
        const screenD = Math.hypot(a.x - b.x, a.y - b.y);
        const imageD = Math.hypot(placed.silhouettePx[0].x - placed.silhouettePx[5].x, placed.silhouettePx[0].y - placed.silhouettePx[5].y);
        assert.ok(Math.abs(screenD / (0.8 * zoom) - imageD) < 1e-6);
      }
    }
  });

  await t.test("a verified scale resizes the same template: 0.2 vs 0.4 mm/px gives half the pixels", () => {
    const tpl = getFemoralImplant(5);
    const w = (mm: number) => {
      const p = placeTemplateInImage({ template: tpl, view: "FLAP", origin, mmPerPx: mm, anteriorImageSign: 1, position: pos() });
      const xs = p.silhouettePx.map((q) => q.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    assert.ok(Math.abs(w(0.2) / w(0.4) - 2) < 1e-9);
  });
});
