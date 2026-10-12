import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getFemoralImplant } from "../data/implant_templates";
import { placeTemplateInImage } from "../data/overlay_geometry";
import { cutPlan, femoralCutLines, legAxes, tiltFromSquareDeg } from "../data/resection_geometry";
import { evaluateFemoralFit, femoralExtents } from "../data/tkr_templates";

const origin = { x: 500, y: 400 };
const place = (view: "FLAP" | "KLAT", position: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number; flexion_deg?: number }) =>
  placeTemplateInImage({ template: getFemoralImplant(4), view, origin, mmPerPx: 0.5, anteriorImageSign: 1, position });

describe("femoral cuts and pivots", () => {
  it("gives the AP drawing one distal cut and the lateral drawing all five", () => {
    const t = getFemoralImplant(4);
    assert.deepEqual(t.views.ap.cuts?.map((c) => c.id), ["distal"]);
    assert.deepEqual(
      t.views.lateral.cuts?.map((c) => c.id).sort(),
      ["anterior", "anterior_chamfer", "distal", "posterior", "posterior_chamfer"],
    );
    assert.deepEqual(cutPlan(t).map((c) => c.sequence), [1, 2, 3, 4, 5]);
  });

  it("each view turns about its own pivot", () => {
    const t = getFemoralImplant(4);
    assert.ok(t.views.ap.pivot && t.views.lateral.pivot);
    assert.notDeepEqual(t.views.ap.pivot, t.views.lateral.pivot);
  });

  it("keeps the pivot still while the component turns", () => {
    const flat = place("FLAP", { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 });
    const tilted = place("FLAP", { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 8 });
    assert.deepEqual(tilted.pivotPx, flat.pivotPx);
    const pivot = getFemoralImplant(4).views.ap.pivot!;
    const moved = tilted.toImage({ x: pivot.x, y: pivot.y });
    assert.ok(Math.abs(moved.x - flat.pivotPx.x) < 1e-6 && Math.abs(moved.y - flat.pivotPx.y) < 1e-6);
  });

  it("tilts the distal cut by exactly the tilt on the AP scan", () => {
    const lines = femoralCutLines(getFemoralImplant(4), "FLAP", place("FLAP", { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 6 }));
    const d = lines.find((l) => l.id === "distal")!;
    const deg = (Math.atan2(d.b.y - d.a.y, d.b.x - d.a.x) * 180) / Math.PI;
    assert.ok(Math.abs(deg - 6) < 1e-6);
  });

  it("flexes the lateral cuts, tipping the front forward for positive flexion", () => {
    const t = getFemoralImplant(4);
    const flat = femoralCutLines(t, "KLAT", place("KLAT", { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 }));
    const flexed = femoralCutLines(t, "KLAT", place("KLAT", { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0, flexion_deg: 5 }));
    const tip = (lines: typeof flat) => lines.find((l) => l.id === "anterior")!.a; // proximal end of the anterior cut
    // anteriorImageSign is +1: the front of the knee is to the right of the image.
    assert.ok(tip(flexed).x > tip(flat).x);
    const ang = (l: (typeof flat)[number]) => (Math.atan2(l.b.y - l.a.y, l.b.x - l.a.x) * 180) / Math.PI;
    const dFlat = flat.find((l) => l.id === "distal")!;
    const dFlexed = flexed.find((l) => l.id === "distal")!;
    const turned = Math.abs(((ang(dFlexed) - ang(dFlat) + 540) % 360) - 180); // wraps at ±180°
    assert.ok(Math.abs(turned - 5) < 1e-6);
  });

  it("changes nothing on the lateral scan when flexion is 0, and the fit is unchanged", () => {
    assert.deepEqual(femoralExtents(4, 1, 2, 3, 0), femoralExtents(4, 1, 2, 3));
    const base = evaluateFemoralFit(4, 0, 0, 58.4, 64.1);
    assert.deepEqual(evaluateFemoralFit(4, 0, 0, 58.4, 64.1, 0, undefined, 0), base);
  });

  it("flexion changes the depth the component spans a little, never wildly", () => {
    const flat = femoralExtents(4, 0, 0, 0, 0);
    const flexed = femoralExtents(4, 0, 0, 0, 5);
    assert.ok(flexed.minY !== flat.minY || flexed.maxY !== flat.maxY);
    assert.ok(Math.abs(flexed.maxY - flat.maxY) < 6 && Math.abs(flexed.minY - flat.minY) < 6);
  });
});

describe("legAxes", () => {
  it("is square when the hip is straight above the knee", () => {
    const a = legAxes({ hipCenter: { x: 50, y: 10 }, kneeCenter: { x: 50, y: 60 } }, 1000, 1000)!;
    assert.equal(a.squareRotationDeg, 0);
    assert.equal(tiltFromSquareDeg(0, a), 0);
  });

  it("turns the cut to stay square when the axis leans", () => {
    // Hip left of the knee: the axis leans down to the right, so a square cut rises to the right (negative turn).
    const a = legAxes({ hipCenter: { x: 40, y: 10 }, kneeCenter: { x: 50, y: 60 } }, 1000, 1000)!;
    const expected = -(Math.atan(100 / 500) * 180) / Math.PI;
    assert.ok(Math.abs(a.squareRotationDeg - expected) < 0.06);
    const t = getFemoralImplant(4);
    const placed = placeTemplateInImage({ template: t, view: "FLAP", origin, mmPerPx: 0.5, anteriorImageSign: 1, position: { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: a.squareRotationDeg } });
    const d = femoralCutLines(t, "FLAP", placed).find((l) => l.id === "distal")!;
    const dot = (d.b.x - d.a.x) * (a.knee.x - a.hip.x) + (d.b.y - d.a.y) * (a.knee.y - a.hip.y);
    const norm = Math.hypot(d.b.x - d.a.x, d.b.y - d.a.y) * Math.hypot(a.knee.x - a.hip.x, a.knee.y - a.hip.y);
    assert.ok(Math.abs(dot / norm) < 0.001);
  });

  it("reports the valgus cut angle when the femoral canal is marked", () => {
    const a = legAxes(
      {
        hipCenter: { x: 50, y: 10 },
        kneeCenter: { x: 50, y: 60 },
        femurCanalProximal: { x: 45, y: 20 },
        femurCanalDistal: { x: 50, y: 50 },
      },
      1000,
      1000,
    )!;
    assert.ok(a.canal);
    assert.ok(a.valgusCutAngleDeg! > 4 && a.valgusCutAngleDeg! < 12);
  });

  it("is undefined without a hip and knee", () => {
    assert.equal(legAxes({ hipCenter: { x: 1, y: 1 } }, 1000, 1000), undefined);
    assert.equal(legAxes(undefined, 1000, 1000), undefined);
  });
});
