import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCalibration } from "../data/coordinates";
import { mmToPx } from "../data/calibration";
import {
  pickImage,
  resolveScanScale,
  sameScale,
  scaleFromTwoPoints,
} from "../data/scan_scale";

/** The shape the backend stores for a scan whose 25 mm marker measured 100 px across. */
const backendCal = {
  marker_type: "sphere_25mm",
  physical_marker_diameter_mm: 25,
  detected_marker_pixel_diameter: 100,
  calculated_scale_mm_per_px: 0.25,
  unit: "mm/px",
  is_valid: true,
};

test("A stored calibration is read as written, whichever way it was stored", async (t) => {
  await t.test("the backend's format gives the real scale, and is valid", () => {
    const c = normalizeCalibration(backendCal, "FLAP /x.jpg");
    assert.equal(c.mm_per_px, 0.25);
    assert.equal(c.isValid, true);
  });

  await t.test("the scale is rebuilt from the marker sizes when no scale was stored", () => {
    const c = normalizeCalibration({ physical_marker_diameter_mm: 25, detected_marker_pixel_diameter: 50 });
    assert.equal(c.mm_per_px, 0.5);
    assert.equal(c.isValid, true);
  });

  await t.test("the seed/demo format and a DICOM pixel spacing still work", () => {
    assert.ok(Math.abs(normalizeCalibration({ mm_per_px: 25 / 94.7 }).mm_per_px - 0.264) < 0.001);
    assert.equal(normalizeCalibration({ derived_pixel_spacing_mm: 0.143 }).mm_per_px, 0.143);
  });

  await t.test("a calibration the server marked invalid stays invalid", () => {
    assert.equal(normalizeCalibration({ ...backendCal, is_valid: false }).isValid, false);
    assert.equal(normalizeCalibration({ mm_per_px: 0.25, isValid: false }).isValid, false);
  });

  await t.test("a scale no radiograph could have is invalid", () => {
    assert.equal(normalizeCalibration({ mm_per_px: 0.001 }).isValid, false);
    assert.equal(normalizeCalibration({ mm_per_px: 9 }).isValid, false);
  });
});

test("An unverified scale can never become verified by being read again", async (t) => {
  await t.test("normalising twice gives the same answer", () => {
    const once = normalizeCalibration(undefined, "KLAT /k.jpg");
    const twice = normalizeCalibration(once, "KLAT /k.jpg");
    assert.equal(once.isValid, false);
    assert.equal(twice.isValid, false);
    assert.equal(twice.mm_per_px, once.mm_per_px);
  });

  await t.test("a verified one stays verified", () => {
    const once = normalizeCalibration(backendCal);
    assert.equal(normalizeCalibration(once).isValid, true);
    assert.equal(normalizeCalibration(once).mm_per_px, 0.25);
  });

  await t.test("a scan with no calibration is never valid", () => {
    for (const hint of ["FLAP /a.jpg", "KLAT /b.jpg", undefined]) {
      assert.equal(normalizeCalibration(undefined, hint).isValid, false);
    }
  });
});

const planWith = (imaging: { view: string; src?: string; calibration?: unknown }[], scan_calibration?: object) => ({
  case: { imaging },
  payload: { scan_calibration: scan_calibration as never },
});

test("Each scan's scale is decided in one place, in order of trust", async (t) => {
  await t.test("the case's own verified calibration is used", () => {
    const s = resolveScanScale(planWith([{ view: "flap", src: "/a.jpg", calibration: backendCal }]), "FLAP");
    assert.equal(s.mmPerPx, 0.25);
    assert.equal(s.calibrated, true);
    assert.equal(s.source, "case");
  });

  await t.test("a scale measured on the plan wins over the case's", () => {
    const plan = planWith([{ view: "flap", src: "/a.jpg", calibration: backendCal }], {
      FLAP: { mm_per_px: 0.18, known_mm: 25, measured_px: 138.9, method: "two_point", calibrated_at: "now" },
    });
    const s = resolveScanScale(plan, "FLAP");
    assert.equal(s.mmPerPx, 0.18);
    assert.equal(s.source, "plan");
    assert.equal(s.calibrated, true);
  });

  await t.test("a scale measured on one scan does not leak onto the other", () => {
    const plan = planWith(
      [{ view: "klat", src: "/k.jpg", calibration: backendCal }],
      { FLAP: { mm_per_px: 0.18, known_mm: 25, measured_px: 138.9, method: "two_point", calibrated_at: "now" } },
    );
    assert.equal(resolveScanScale(plan, "KLAT").mmPerPx, 0.25);
  });

  await t.test("with nothing to go on it is an estimate, and says so", () => {
    const s = resolveScanScale(planWith([]), "FLAP");
    assert.equal(s.calibrated, false);
    assert.equal(s.source, "estimate");
    assert.equal(s.isFallback, true);
  });

  await t.test("a scale measured in this session overrides what the plan loaded with", () => {
    const s = resolveScanScale(planWith([]), "KLAT", {
      KLAT: { mm_per_px: 0.2, known_mm: 25, measured_px: 125, method: "two_point", calibrated_at: "now" },
    });
    assert.equal(s.mmPerPx, 0.2);
    assert.equal(s.calibrated, true);
  });

  await t.test("every step picks the same image for a view", () => {
    const imaging = [
      { view: "lateral", src: "/l.jpg" },
      { view: "long_leg", src: "/ll.jpg" },
      { view: "flap", src: "/f.jpg" },
    ];
    assert.equal(pickImage(imaging, "FLAP")?.src, "/f.jpg");
    assert.equal(pickImage(imaging, "KLAT")?.src, "/l.jpg");
    assert.equal(pickImage([{ view: "ap", src: "/a.jpg" }, { view: "flap", src: "/f.jpg" }], "FLAP")?.src, "/a.jpg");
  });
});

test("Two clicks across a known size give the scale", async (t) => {
  await t.test("25 mm across 100 px is 0.25 mm per pixel", () => {
    const r = scaleFromTwoPoints(25, 100);
    assert.ok(r.ok);
    if (r.ok) {
      assert.equal(r.calibration.mm_per_px, 0.25);
      assert.equal(r.calibration.known_mm, 25);
      assert.equal(r.calibration.measured_px, 100);
    }
  });

  await t.test("a different known size works, such as a 100 mm ruler", () => {
    const r = scaleFromTwoPoints(100, 130);
    assert.ok(r.ok && Math.abs(r.calibration.mm_per_px - 0.76923) < 0.0001);
  });

  await t.test("nonsense is refused with a reason", () => {
    for (const [mm, px] of [[0, 100], [25, 0], [25, 2], [25, 5000], [25, 5]] as const) {
      const r = scaleFromTwoPoints(mm, px);
      assert.equal(r.ok, false, `${mm} mm over ${px} px`);
      if (!r.ok) assert.ok(r.error.length > 10);
    }
  });

  await t.test("the implant is drawn at the size the scale says", () => {
    // A 68.2 mm tray on a 0.25 mm/px scan is 272.8 px wide, and half that scale halves it.
    assert.equal(mmToPx(68.2, { ...normalizeCalibration(backendCal) }), 272.8);
    assert.equal(mmToPx(68.2, { ...normalizeCalibration({ ...backendCal, calculated_scale_mm_per_px: 0.5 }) }), 136.4);
  });

  await t.test("sameScale ignores rounding but not a real change", () => {
    assert.equal(sameScale(0.25, 0.2501), true);
    assert.equal(sameScale(0.25, 0.264), false);
    assert.equal(sameScale(undefined, undefined), true);
    assert.equal(sameScale(0.25, undefined), false);
  });
});
