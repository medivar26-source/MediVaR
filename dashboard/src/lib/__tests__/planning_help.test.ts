import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { HELP_ARTICLES, LIBRARY_RESOURCES, PLANNING_PAGES } from "../data/support-content";
import { getLibraryDoc } from "../data/support";
import { V1_TKR_STEPS } from "../plan";

describe("pre-operative planning help article", () => {
  it("describes the four V1 pages, in the planner's order and with its titles", async () => {
    const doc = await getLibraryDoc("preoperative-planning");
    assert.ok(doc && doc.slug === "preoperative-planning");
    assert.deepEqual(
      doc.pages.map((p) => p.title),
      V1_TKR_STEPS.map((s) => s.title),
    );
    assert.deepEqual(doc.pages.map((p) => p.step), [1, 2, 3, 4]);
  });

  it("lists the six assessment measurements of the specification", () => {
    const assessment = PLANNING_PAGES.find((p) => p.id === "assessment")!;
    assert.deepEqual(
      assessment.measurements.map((m) => m.abbreviation),
      ["MAD", "AMA", "mHKA", "MPTA", "LDFA", "PTS"],
    );
    assert.equal(assessment.measurements.filter((m) => m.view === "KLAT").length, 1);
  });

  it("states the tibial fit thresholds from the specification", () => {
    const tibial = PLANNING_PAGES.find((p) => p.id === "tibial")!;
    const byName = Object.fromEntries(tibial.fitMetrics!.map((f) => [f.metric, f.threshold]));
    assert.equal(byName["Cortical coverage"], "90.0% or more");
    assert.equal(byName["Medial overhang"], "1.0 mm or less");
    assert.equal(byName["Lateral overhang"], "1.0 mm or less");
  });

  it("no longer calls planning seven steps anywhere in Help", () => {
    const planning = LIBRARY_RESOURCES.find((r) => r.slug === "preoperative-planning")!;
    assert.ok(!/seven/i.test(planning.title + planning.summary));
    for (const article of HELP_ARTICLES) {
      assert.ok(!/seven steps/i.test(article.body), article.slug);
    }
  });

  it("keeps the operative sequence out of the planning article", () => {
    for (const page of PLANNING_PAGES) {
      assert.ok(!/\bP(?:0|1|11)\b/.test(page.objective + page.gate), page.id);
    }
  });
});
