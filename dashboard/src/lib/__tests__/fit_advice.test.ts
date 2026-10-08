import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { evaluateFemoralFit, evaluateTibialFit } from "../data/tkr_templates";
import { deriveBone, rankFemoralSizes, rankTibialSizes, type ViewScale } from "../data/fit_markers";
import { adviseFemoral, adviseTibial } from "../data/fit_advice";
import { LANDMARK_GUIDE, LANDMARK_INFO, landmarkGroups, landmarksForView } from "../data/landmark_guide";

const scale: ViewScale = { widthPx: 1000, heightPx: 1000, mmPerPx: 0.1, calibrated: true };

/** Markers that make a bone of exactly `ml` x `ap` millimetres. */
const markersFor = (ml: number, ap: number) => ({
  medial: { x: 20, y: 50 },
  lateral: { x: 20 + ml / 0.1 / 10, y: 50 },
  anterior: { x: 20, y: 40 },
  posterior: { x: 20 + ap / 0.1 / 10, y: 40 },
  confirmed: true,
});

const tibialCase = (ml: number, ap: number, size: number, x = 0, y = 0, rot = 0) => {
  const markers = markersFor(ml, ap);
  const bone = deriveBone("tibial", markers, scale, scale);
  const fit = evaluateTibialFit(size, x, y, bone.apMm!, bone.mlMm!, rot, undefined, undefined, bone.orientation);
  const ranking = rankTibialSizes(bone, rot);
  return adviseTibial({ placed: 4, markersConfirmed: true, bone, fit, size, rotationDeg: rot, ranking });
};

test("The adviser walks a new user through the steps in order", async (t) => {
  const none = deriveBone("tibial", {}, scale, scale);
  const base = { bone: none, size: 3, rotationDeg: 0, ranking: { rows: [] as never[] } };

  await t.test("with nothing marked it says to start with the edges", () => {
    const a = adviseTibial({ ...base, placed: 0, markersConfirmed: false });
    assert.equal(a.step, 1);
    assert.equal(a.tone, "none");
    assert.match(a.detail, /4 edges left/);
  });

  await t.test("with some marked it counts what is left", () => {
    const a = adviseTibial({ ...base, placed: 3, markersConfirmed: false });
    assert.match(a.detail, /1 edge left/);
  });

  await t.test("with all four placed but not confirmed it asks to check them", () => {
    const bone = deriveBone("tibial", markersFor(68.2, 42.5), scale, scale);
    const a = adviseTibial({ placed: 4, markersConfirmed: false, bone, size: 3, rotationDeg: 0, ranking: rankTibialSizes(bone) });
    assert.equal(a.step, 1);
    assert.match(a.headline, /Check the four marks/);
  });
});

test("Tibial advice says what is wrong and what to do", async (t) => {
  await t.test("a good fit says so and moves to confirming", () => {
    const a = tibialCase(68.2, 42.5, 3);
    assert.equal(a.tone, "pass");
    assert.equal(a.step, 4);
    assert.match(a.headline, /fits well/);
  });

  await t.test("one side sticking out gives a direction and an amount", () => {
    const a = tibialCase(68.2, 42.5, 3, 2.4, 0);
    assert.notEqual(a.tone, "pass");
    assert.match(a.headline, /sticks out 2\.4 mm/);
    assert.match(a.detail, /Move the implant about 2\.4 mm/);
    assert.equal(a.step, 3);
  });

  await t.test("a size that is too big points to the recommended size", () => {
    const a = tibialCase(68.2, 42.5, 5);
    assert.equal(a.tone, "fail");
    assert.equal(a.step, 2);
    assert.match(a.headline, /too big/);
    assert.match(a.detail, /Try size 3/);
  });

  await t.test("a size that is too small points to a bigger one and mentions coverage", () => {
    const a = tibialCase(68.2, 42.5, 1);
    assert.equal(a.step, 2);
    assert.match(a.headline, /uncovered/);
    assert.match(a.detail, /Try size 3/);
    assert.match(a.detail, /target 90%/);
  });

  await t.test("the advice never recommends a size that is not in the table", () => {
    for (const size of [1, 2, 3, 4, 5, 6]) {
      const a = tibialCase(68.2, 42.5, size);
      const m = a.detail.match(/Try size (\d)/);
      if (m) assert.ok(Number(m[1]) >= 1 && Number(m[1]) <= 6);
    }
  });
});

test("Femoral advice uses the spec's coverage and notching limits", async (t) => {
  const femoral = (ml: number, ap: number, size: number, x = 0, y = 0) => {
    const bone = deriveBone("femoral", markersFor(ml, ap), scale, scale);
    const fit = evaluateFemoralFit(size, x, y, bone.apMm!, bone.mlMm!, 0, bone.orientation);
    return adviseFemoral({ placed: 4, markersConfirmed: true, bone, fit, size, rotationDeg: 0, ranking: rankFemoralSizes(bone) });
  };

  await t.test("a matched component is a good fit", () => {
    const a = femoral(64.1, 58.4, 4, 0, 0);
    assert.equal(a.tone, "pass");
    assert.equal(a.step, 4);
  });

  await t.test("a gap at the front over 0.5 mm says move forwards", () => {
    const a = femoral(64.1, 58.4, 4, 0, 2);
    assert.match(a.headline, /gap at the front/);
    assert.match(a.detail, /forwards/);
    assert.match(a.detail, /0\.5 mm/);
  });

  await t.test("short coverage points to another size", () => {
    const a = femoral(64.1, 58.4, 1);
    assert.equal(a.step, 2);
    assert.match(a.headline, /does not span/);
    assert.match(a.detail, /Try size 4/);
  });
});

test("Every landmark on the scans is named, coloured and explained", async (t) => {
  await t.test("the guide covers exactly the landmarks the assessment uses", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../../app/plan/[id]/assessment/AssessmentWorkspace.tsx"),
      "utf8",
    );
    const block = source.slice(source.indexOf("export type LandmarkState"), source.indexOf("type LandmarkKey"));
    const keys = [...block.matchAll(/^\s+(\w+)\?: Point2D;/gm)].map((m) => m[1]).sort();
    assert.ok(keys.length >= 13, "found the landmark keys");
    assert.deepEqual(LANDMARK_GUIDE.map((l) => l.key).sort(), keys);
  });

  await t.test("none is left uncoloured, and none has an empty explanation", () => {
    for (const l of LANDMARK_GUIDE) {
      assert.match(l.color, /^#[0-9a-f]{6}$/i, `${l.key} needs a colour`);
      assert.notEqual(l.color.toLowerCase(), "#ffffff");
      assert.ok(l.tag.length > 0 && l.name.length > 0 && l.where.length > 10 && l.feeds.length > 10, l.key);
    }
  });

  await t.test("points are grouped in pairs per scan", () => {
    assert.equal(landmarksForView("FLAP").length + landmarksForView("KLAT").length, LANDMARK_GUIDE.length);
    for (const view of ["FLAP", "KLAT"] as const) {
      for (const g of landmarkGroups(view)) assert.ok(g.items.length >= 2, `${g.title} should be a pair or a trio`);
    }
  });
});
