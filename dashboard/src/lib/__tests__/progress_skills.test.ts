import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSkillGroups } from "../data/performance";
import { sectionForPath, sectionsForPersona } from "../nav";
import { PROFILES } from "../seed";

describe("skills by procedure", () => {
  const arjun = PROFILES.find((p) => p.displayName.includes("Arjun"))!;

  it("groups a learner's scored sessions under their procedure, with the categories the reports carry", async () => {
    const groups = await getSkillGroups(arjun.id);
    assert.equal(groups.length, 1);
    const [tkr] = groups;
    assert.equal(tkr.procedureId, "tkr");
    assert.equal(tkr.hasScoringModel, true);
    assert.ok(tkr.sessions > 0);
    assert.ok(tkr.categories.length > 0);
    for (const cat of tkr.categories) {
      assert.ok(cat.pct >= 0 && cat.pct <= 100, cat.key);
    }
  });

  it("links a category to its scene breakdown only when it has a page", async () => {
    const [tkr] = await getSkillGroups(arjun.id);
    assert.ok(tkr.categories.some((c) => c.slug), "TKR categories open their breakdown");
  });

  it("invents nothing for a learner with no scored session", async () => {
    assert.deepEqual(await getSkillGroups("00000000-0000-4000-8000-000000000000"), []);
  });
});

describe("one Progress destination", () => {
  it("is the only item in the learner's Progress section, and the section opens it", () => {
    const section = sectionsForPersona("learner").find((s) => s.id === "performance")!;
    assert.equal(section.href, "/progress");
    assert.deepEqual(section.groups.flatMap((g) => g.items.map((i) => i.href)), ["/progress"]);
  });

  it("keeps the old addresses inside the same section for the sidebar", () => {
    for (const path of ["/progress", "/performance", "/activity", "/reports", "/performance/planning"]) {
      assert.equal(sectionForPath(path, "learner"), "performance", path);
    }
  });

  it("gives the instructor's Insights one destination, as a learner's Progress has", () => {
    const insights = sectionsForPersona("instructor").find((s) => s.id === "overview")!;
    const hrefs = insights.groups.flatMap((g) => g.items.map((i) => i.href));
    // Activity, Reports and By skill are tabs of /performance; the skill pages are reached from By skill.
    assert.deepEqual(hrefs, ["/performance"]);
  });
});
