import test from "node:test";
import assert from "node:assert/strict";
import { deriveBone, screenMoveToOffsets } from "../data/fit_markers";
import { mapShapes, offsetFromDrag, rotationFromPointer, rotationHandlePoint } from "../data/fit_map";
import { evaluateTibialFit } from "../data/tkr_templates";

const view = { widthPx: 1000, heightPx: 1000, mmPerPx: 0.25, calibrated: true };
// A 68 mm wide, 42 mm deep plateau on 0.25 mm/px scans.
const markers = {
  medial: { x: 36, y: 40 },
  lateral: { x: 63.2, y: 40 },
  anterior: { x: 40, y: 50 },
  posterior: { x: 50.5, y: 50 },
};
const bone = deriveBone("tibial", markers, view, view);

test("A move across the screen becomes the offset that scan measures", async (t) => {
  await t.test("on the AP scan sideways is medial/lateral and up/down is only height", () => {
    assert.deepEqual(screenMoveToOffsets("FLAP", 2, 3, 1), { x: 2, y: 0, level: 3 });
  });

  await t.test("on the lateral scan sideways is anterior/posterior, whichever way the knee faces", () => {
    // Anterior on the image's right: moving right is moving anterior, which is negative y.
    assert.deepEqual(screenMoveToOffsets("KLAT", 2, 0, 1), { x: 0, y: -2, level: 0 });
    assert.deepEqual(screenMoveToOffsets("KLAT", 2, 0, -1), { x: 0, y: 2, level: 0 });
  });
});

test("The fit map is built from the same bone and tray the fit is measured on", async (t) => {
  await t.test("it has nothing to draw until the bone is known", () => {
    assert.equal(mapShapes("tibial", 3, deriveBone("tibial", {}, view, view), { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 }), undefined);
  });

  await t.test("the bone outline is the measured size and the tray follows the offsets", () => {
    const s = mapShapes("tibial", 3, bone, { x_offset_mm: 2, y_offset_mm: -1, rotation_deg: 0 })!;
    const xs = s.bone.map((p) => p.x);
    assert.ok(Math.abs(Math.max(...xs) - Math.min(...xs) - bone.mlMm!) < 1e-6);
    const fit = evaluateTibialFit(3, 2, -1, bone.apMm!, bone.mlMm!, 0, undefined, undefined, bone.orientation);
    const ix = s.implant.map((p) => p.x);
    assert.ok(Math.abs(Math.min(...ix) - fit.extents.minX) < 1e-6);
    assert.ok(Math.abs(Math.max(...ix) - fit.extents.maxX) < 1e-6);
  });

  await t.test("the frame leaves room around both the bone and the component", () => {
    const s = mapShapes("femoral", 4, deriveBone("femoral", markers, view, view), { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 })!;
    assert.ok(s.frameHalfW > s.implantHalfW && s.frameHalfH > s.implantHalfH);
  });
});

test("Dragging on the map gives positions to a tenth of a millimetre", async (t) => {
  await t.test("the component follows the pointer from where it was grabbed", () => {
    const next = offsetFromDrag({ x: 1, y: -0.5 }, { x: 10, y: 10 }, { x: 12.34, y: 7.06 });
    assert.deepEqual(next, { x_offset_mm: 3.3, y_offset_mm: -3.4 });
  });

  await t.test("the rotation handle straight above the centre is no rotation", () => {
    assert.equal(rotationFromPointer({ x: 0, y: 0 }, { x: 0, y: -20 }), 0);
  });

  await t.test("a handle swung to the right turns the component clockwise", () => {
    // 45° from vertical is far beyond the in-plane limit (±15°, "minor 2-D alignment"), so it is held at the limit.
    const r = rotationFromPointer({ x: 0, y: 0 }, { x: 10, y: -10 });
    assert.equal(r, 15);
    assert.equal(rotationFromPointer({ x: 0, y: 0 }, { x: -3, y: -17.3 }) < 0, true);
  });

  await t.test("it is held to a sensible range", () => {
    assert.equal(rotationFromPointer({ x: 0, y: 0 }, { x: 20, y: 0 }), 15);
    assert.equal(rotationFromPointer({ x: 0, y: 0 }, { x: -20, y: 0 }), -15);
  });

  await t.test("the handle is drawn where the pointer put it", () => {
    // 12° is inside the ±15° in-plane limit (the earlier test used 20°, valid only under the old ±45° axial range).
    const handle = rotationHandlePoint({ x: 5, y: 5 }, 12, 30);
    assert.ok(Math.abs(rotationFromPointer({ x: 5, y: 5 }, handle) - 12) < 0.06);
  });
});
