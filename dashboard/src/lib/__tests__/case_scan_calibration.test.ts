import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { normalizeCalibration } from "../data/coordinates";

/**
 * The demo case library's scans and their stored scale (backend/scripts/scan_manifest.json, written by
 * make_calibrated_scans.py and read by the seed script). Each scan carries a marker of known size; the
 * stored scale must be that size over the marker's measured pixels, differ between a full-leg film and a
 * knee close-up, and survive the trip through the planner's own normaliser unchanged.
 */
const root = path.resolve(process.cwd(), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "backend/scripts/scan_manifest.json"), "utf8")) as Record<
  string,
  { file: string; width_px: number; height_px: number; marker_type: string; marker_mm: number; marker_px: number; mm_per_px: number }
>;

/** Width and height from a JPEG header, without a library. */
function jpegSize(file: string): { width: number; height: number } {
  const d = readFileSync(file);
  let i = 2;
  while (i < d.length) {
    if (d[i] !== 0xff) {
      i++;
      continue;
    }
    const m = d[i + 1];
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) return { height: d.readUInt16BE(i + 5), width: d.readUInt16BE(i + 7) };
    i += 2 + d.readUInt16BE(i + 2);
  }
  throw new Error("no size in " + file);
}

describe("case library scan calibration", () => {
  const names = Object.keys(manifest);

  it("has the six scans of the three demo cases", () => {
    assert.deepEqual(names.sort(), ["mild_flap", "mild_klat", "valgus_flap", "valgus_klat", "varus_flap", "varus_klat"]);
  });

  for (const name of names) {
    const s = manifest[name];

    it(`${name}: the file exists and is the size the scale was measured on`, () => {
      const file = path.join(root, "dashboard/public", s.file);
      assert.ok(existsSync(file), file);
      assert.deepEqual(jpegSize(file), { width: s.width_px, height: s.height_px });
    });

    it(`${name}: scale is marker size over measured pixels, and realistic`, () => {
      assert.ok(Math.abs(s.mm_per_px - s.marker_mm / s.marker_px) / s.mm_per_px < 0.001);
      assert.ok(s.mm_per_px >= 0.05 && s.mm_per_px <= 1.5);
    });

    it(`${name}: the planner reads the stored calibration as the same valid scale`, () => {
      const stored = {
        marker_type: s.marker_type,
        physical_marker_diameter_mm: s.marker_mm,
        detected_marker_pixel_diameter: s.marker_px,
        calculated_scale_mm_per_px: s.mm_per_px,
        is_valid: true,
      };
      const cal = normalizeCalibration(stored);
      assert.equal(cal.isValid, true);
      assert.ok(Math.abs(cal.mm_per_px - s.mm_per_px) < 1e-9);
      assert.equal(cal.marker_type, s.marker_type === "ruler_100mm" ? "ruler_100mm" : "sphere_25mm");
      assert.equal(normalizeCalibration(cal).mm_per_px, cal.mm_per_px, "normalising twice changes nothing");
    });
  }

  it("a full-leg film is far coarser than a knee close-up, and no two views share a made-up scale", () => {
    for (const c of ["varus", "valgus", "mild"]) {
      const flap = manifest[`${c}_flap`].mm_per_px;
      const klat = manifest[`${c}_klat`].mm_per_px;
      assert.ok(flap > 2 * klat, `${c}: full-leg ${flap} vs knee ${klat}`);
    }
    assert.notEqual(manifest.varus_klat.mm_per_px, manifest.valgus_klat.mm_per_px);
  });

  it("the demo film's printed 10 cm ruler gives 0.8 mm/px", () => {
    assert.equal(manifest.mild_flap.marker_type, "ruler_100mm");
    assert.equal(manifest.mild_flap.mm_per_px, 0.8);
  });
});
