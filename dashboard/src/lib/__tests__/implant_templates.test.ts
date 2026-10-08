import test from "node:test";
import assert from "node:assert/strict";
import {
  FEMORAL_SIZE_DIMENSIONS,
  GENERIC_TKA_TEMPLATE,
  TIBIAL_SIZE_DIMENSIONS,
  V1_FEMORAL_SIZES,
  V1_TIBIAL_SIZES,
  area,
  estimatedTibialPlateauOutline,
  getFemoralImplant,
  getTibialImplant,
  type ImplantTemplate,
} from "../data/implant_templates";
import { FEMORAL_GEOMETRY_CATALOG } from "../data/femoral_geometry";
import { TIBIAL_GEOMETRY_CATALOG, calculatePolygonIntersectionArea } from "../data/tibial_geometry";

const all = (t: ImplantTemplate) => [...t.views.ap.layers.map((l) => l.path), ...t.views.lateral.layers.map((l) => l.path), t.views.ap.silhouette, t.views.lateral.silhouette, t.footprint];

test("V1 size ladders are fixed: tibial 1-6, femoral 1-8", async (t) => {
  await t.test("sizes", () => {
    assert.deepEqual(V1_TIBIAL_SIZES, [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(V1_FEMORAL_SIZES, [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.deepEqual(GENERIC_TKA_TEMPLATE.tibialTemplates.map((x) => x.size), [1, 2, 3, 4, 5, 6]);
    assert.deepEqual(GENERIC_TKA_TEMPLATE.femoralTemplates.map((x) => x.size), [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  await t.test("every size is larger than the last in both dimensions", () => {
    for (const list of [TIBIAL_SIZE_DIMENSIONS, FEMORAL_SIZE_DIMENSIONS]) {
      for (let i = 1; i < list.length; i++) {
        assert.ok(list[i].apMm > list[i - 1].apMm && list[i].mlMm > list[i - 1].mlMm, `size ${list[i].size}`);
      }
    }
  });
});

test("Provenance is never overstated", async (t) => {
  await t.test("the system and every template are generic, engineering-derived and unvalidated", () => {
    assert.equal(GENERIC_TKA_TEMPLATE.id, "GENERIC_TKA_TEMPLATE");
    assert.equal(GENERIC_TKA_TEMPLATE.provenance, "ENGINEERING_DERIVATION");
    assert.equal(GENERIC_TKA_TEMPLATE.validationStatus, "CLINICAL_APPROVAL_REQUIRED");
    assert.match(GENERIC_TKA_TEMPLATE.notice, /not a manufacturer/i);
    for (const tpl of [...GENERIC_TKA_TEMPLATE.tibialTemplates, ...GENERIC_TKA_TEMPLATE.femoralTemplates]) {
      assert.equal(tpl.system, "GENERIC_TKA_TEMPLATE");
      assert.equal(tpl.provenance, "ENGINEERING_DERIVATION");
      assert.equal(tpl.validationStatus, "CLINICAL_APPROVAL_REQUIRED");
      assert.match(tpl.geometryVersion, /^\d+\.\d+\.\d+$/);
      assert.ok(tpl.origin.length > 10 && tpl.coordinateSystem.length > 10, "origin and coordinate system are documented");
      assert.match(tpl.implantId, /^GENERIC_TKA_TEMPLATE\/(tibial|femoral)\/\d$/);
    }
  });
});

test("Template geometry is real, finite and size-specific", async (t) => {
  await t.test("no non-finite coordinates and a positive area in every drawing", () => {
    for (const tpl of [...GENERIC_TKA_TEMPLATE.tibialTemplates, ...GENERIC_TKA_TEMPLATE.femoralTemplates]) {
      for (const poly of all(tpl)) {
        assert.ok(poly.length >= 2);
        assert.ok(poly.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)), `${tpl.implantId} has a non-finite point`);
      }
      assert.ok(area(tpl.views.ap.silhouette) > 50, `${tpl.implantId} AP area`);
      assert.ok(area(tpl.views.lateral.silhouette) > 50, `${tpl.implantId} lateral area`);
      assert.ok(area(tpl.footprint) > 50, `${tpl.implantId} footprint area`);
    }
  });

  await t.test("the AP drawing is as wide as the ML dimension and the lateral drawing as deep as the AP dimension", () => {
    for (const tpl of [...GENERIC_TKA_TEMPLATE.tibialTemplates, ...GENERIC_TKA_TEMPLATE.femoralTemplates]) {
      const ap = tpl.views.ap.extents;
      const lat = tpl.views.lateral.extents;
      assert.ok(Math.abs(ap.maxX - ap.minX - tpl.dimensionsMm.ml) < 0.05, `${tpl.implantId} ML`);
      assert.ok(Math.abs(lat.maxX - lat.minX - tpl.dimensionsMm.ap) < 0.05, `${tpl.implantId} AP`);
    }
  });

  await t.test("neither a rectangle nor an ellipse: the outlines are detailed and fill little of their bounding box", () => {
    for (const tpl of [...GENERIC_TKA_TEMPLATE.tibialTemplates, ...GENERIC_TKA_TEMPLATE.femoralTemplates]) {
      for (const view of [tpl.views.ap, tpl.views.lateral]) {
        assert.ok(view.silhouette.length >= 16, `${tpl.implantId} has too few vertices`);
        const e = view.extents;
        const box = (e.maxX - e.minX) * (e.maxY - e.minY);
        const fill = area(view.silhouette) / box;
        assert.ok(fill < 0.82, `${tpl.implantId} fills ${(fill * 100).toFixed(0)}% of its box — too rectangular`);
        assert.ok(fill > 0.2, `${tpl.implantId} is degenerate`);
      }
    }
  });

  await t.test("a tibial tray has layers: plate, insert, stem and keel in AP; plate, insert and stem laterally", () => {
    const tpl = getTibialImplant(3);
    const roles = (v: "ap" | "lateral") => tpl.views[v].layers.map((l) => l.role);
    for (const r of ["baseplate", "insert", "stem", "keel"]) assert.ok(roles("ap").includes(r as never), `AP ${r}`);
    for (const r of ["baseplate", "insert", "stem"]) assert.ok(roles("lateral").includes(r as never), `lateral ${r}`);
  });

  await t.test("a femoral component has two condyles and a flange in AP, and a J-shaped shell with cut lines laterally", () => {
    const tpl = getFemoralImplant(4);
    assert.equal(tpl.views.ap.layers.filter((l) => l.role === "condyle").length, 2);
    assert.ok(tpl.views.ap.layers.some((l) => l.role === "flange"));
    assert.ok(tpl.views.lateral.layers.some((l) => l.role === "shell"));
    assert.ok(tpl.views.lateral.layers.some((l) => l.role === "box" && l.open), "bone-facing cut lines");
    // The flange runs well up the femur: the drawing is far taller than the distal thickness alone.
    const e = tpl.views.lateral.extents;
    assert.ok(e.maxY - e.minY > 0.55 * tpl.dimensionsMm.ap, "anterior flange reaches proximally");
  });

  await t.test("the posterior condyle wraps round: the posterior-most point is above the distal-most point", () => {
    const tpl = getFemoralImplant(4);
    const pts = tpl.views.lateral.silhouette;
    const posterior = pts.reduce((a, b) => (b.x > a.x ? b : a));
    const distal = pts.reduce((a, b) => (b.y > a.y ? b : a));
    assert.ok(posterior.y < distal.y - 5, "J-curve");
  });

  await t.test("sizes are different shapes, not one shape scaled: proportions change between sizes", () => {
    const ratio = (n: number) => {
      const e = getTibialImplant(n).views.ap.extents;
      return (e.maxY - e.minY) / (e.maxX - e.minX);
    };
    // Stem and plate dimensions follow the size ladder, so the drawing's proportions are not constant.
    const ratios = V1_TIBIAL_SIZES.map(ratio);
    assert.ok(Math.max(...ratios) - Math.min(...ratios) > 0.004 || new Set(ratios.map((r) => r.toFixed(4))).size > 1);
    const fem = V1_FEMORAL_SIZES.map((n) => area(getFemoralImplant(n).views.lateral.silhouette));
    for (let i = 1; i < fem.length; i++) assert.ok(fem[i] > fem[i - 1], "bigger size, bigger drawing");
  });
});

test("The estimated bone outline is a different shape from the tray that is judged against it", async (t) => {
  await t.test("a matched tray covers most but not all of the estimated plateau, and stays inside it", () => {
    for (const tpl of GENERIC_TKA_TEMPLATE.tibialTemplates) {
      const bone = estimatedTibialPlateauOutline(tpl.dimensionsMm.ml, tpl.dimensionsMm.ap);
      const cov = calculatePolygonIntersectionArea(tpl.footprint, bone) / area(bone);
      assert.ok(cov > 0.92 && cov < 0.995, `size ${tpl.size} covers ${(cov * 100).toFixed(1)}%`);
      assert.ok(area(tpl.footprint) < area(bone), "tray footprint is not a scaled copy of the bone outline");
    }
  });
});

test("Compatibility catalogues are built from the templates, not from separate hand-typed shapes", async (t) => {
  await t.test("tibial and femoral catalogues mirror the template drawings", () => {
    for (const tpl of GENERIC_TKA_TEMPLATE.tibialTemplates) {
      assert.deepEqual(TIBIAL_GEOMETRY_CATALOG[tpl.size].flapPolygon, tpl.views.ap.silhouette);
      assert.deepEqual(TIBIAL_GEOMETRY_CATALOG[tpl.size].transverseTrayPolygon, tpl.footprint);
    }
    for (const tpl of GENERIC_TKA_TEMPLATE.femoralTemplates) {
      assert.deepEqual(FEMORAL_GEOMETRY_CATALOG[tpl.size].klatPolygon, tpl.views.lateral.silhouette);
    }
  });

  await t.test("an unknown size falls back to the example size instead of throwing mid-render", () => {
    assert.equal(getTibialImplant(99).size, 3);
    assert.equal(getFemoralImplant(0).size, 4);
  });
});
