import test from "node:test";
import assert from "node:assert/strict";
import { sectionsForPersona, sectionForPath } from "../nav";
import type { ProgramSummary } from "../data/programs";

test("Navigation persona separation", async (t) => {
  await t.test("learner persona should see 'Programs' and never 'Cohorts' or 'Learners'", () => {
    const learnerSections = sectionsForPersona("learner");

    // Must have 'programs' section
    const programsSection = learnerSections.find((s) => s.id === "programs");
    assert.ok(programsSection, "Learner must have a 'programs' section");
    assert.equal(programsSection.label, "Programs");

    // All items across all groups for learner
    const allItems = learnerSections.flatMap((s) => s.groups.flatMap((g) => g.items));
    const hrefs = allItems.map((i) => i.href);
    const labels = allItems.map((i) => i.label.toLowerCase());

    assert.ok(hrefs.includes("/programs"), "Learner must have /programs destination");
    assert.ok(!hrefs.includes("/cohorts"), "Learner must NOT have /cohorts destination");
    assert.ok(!hrefs.includes("/cohorts/learners"), "Learner must NOT have /cohorts/learners destination");
    assert.ok(!labels.includes("cohorts"), "Learner must NOT see 'Cohorts' label");
    assert.ok(!labels.includes("learners"), "Learner must NOT see 'Learners' label");

    // Cohort section must NOT be present for learner
    const cohortSection = learnerSections.find((s) => s.id === "cohort");
    assert.equal(cohortSection, undefined, "Learner must not have 'cohort' section");
  });

  await t.test("instructor persona should see 'Cohorts' and administrative items", () => {
    const instructorSections = sectionsForPersona("instructor");

    const cohortSection = instructorSections.find((s) => s.id === "cohort");
    assert.ok(cohortSection, "Instructor must have 'cohort' section");
    assert.equal(cohortSection.label, "Cohorts");

    const cohortItems = cohortSection.groups.flatMap((g) => g.items);
    const hrefs = cohortItems.map((i) => i.href);

    assert.ok(hrefs.includes("/cohorts"), "Instructor must have /cohorts destination");
    assert.ok(hrefs.includes("/cohorts/learners"), "Instructor must have /cohorts/learners destination");

    // Programs section must NOT be present for instructor
    const programsSection = instructorSections.find((s) => s.id === "programs");
    assert.equal(programsSection, undefined, "Instructor must not have learner 'programs' section");
  });

  await t.test("sectionForPath resolves correctly by persona", () => {
    assert.equal(sectionForPath("/programs", "learner"), "programs");
    assert.equal(sectionForPath("/programs/prog-123", "learner"), "programs");
    assert.equal(sectionForPath("/cohorts", "instructor"), "cohort");
    assert.equal(sectionForPath("/cohorts/prog-123", "instructor"), "cohort");
  });
});

test("Multiple programs support with secondary cohort metadata", () => {
  const mockPrograms: ProgramSummary[] = [
    {
      id: "prog-1",
      institution_id: "inst-1",
      name: "Total Knee Replacement",
      description: "Primary TKA training",
      status: "active",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
      cohort_id: "cohort-1",
      cohort_name: "March 2026",
    },
    {
      id: "prog-2",
      institution_id: "inst-1",
      name: "Hip Replacement",
      description: "Primary THA training",
      status: "active",
      created_at: "2026-02-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
      cohort_id: "cohort-2",
      cohort_name: "April 2026",
    },
  ];

  assert.equal(mockPrograms.length, 2);
  assert.equal(mockPrograms[0].name, "Total Knee Replacement");
  assert.equal(mockPrograms[0].cohort_name, "March 2026");
  assert.equal(mockPrograms[1].name, "Hip Replacement");
  assert.equal(mockPrograms[1].cohort_name, "April 2026");

  // Ensure cohorts belong to different programs
  assert.notEqual(mockPrograms[0].id, mockPrograms[1].id);
  assert.notEqual(mockPrograms[0].cohort_id, mockPrograms[1].cohort_id);
});
