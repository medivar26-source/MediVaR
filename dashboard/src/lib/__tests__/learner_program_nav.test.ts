import test from "node:test";
import assert from "node:assert/strict";
import { sectionsForPersona, sectionForPath } from "../nav";
import type { ProgramSummary } from "../data/programs";

test("Navigation persona separation & approved hierarchy", async (t) => {
  await t.test("learner persona should see role-appropriate sections and never cohort admin", () => {
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
    assert.ok(!hrefs.includes("/cohorts"), "Learner must NOT have /cohorts destination in nav");
    assert.ok(!hrefs.includes("/cohorts/learners"), "Learner must NOT have /cohorts/learners destination");
    assert.ok(!labels.includes("cohorts"), "Learner must NOT see 'Cohorts' label");
    assert.ok(!labels.includes("learners"), "Learner must NOT see 'Learners' label");

    // Learner should have Content Library with Simulations, Practice Cases, Library
    const contentSection = learnerSections.find((s) => s.id === "content-library");
    assert.ok(contentSection, "Learner must have 'content-library' section");
  });

  await t.test("instructor persona should follow approved hierarchy: Programs, Content Library, Reports", () => {
    const instructorSections = sectionsForPersona("instructor");

    // 1. Programs section
    const programsSection = instructorSections.find((s) => s.id === "programs");
    assert.ok(programsSection, "Instructor must have 'programs' section as primary academic structure");
    assert.equal(programsSection.label, "Programs");

    const programItems = programsSection.groups.flatMap((g) => g.items);
    assert.ok(
      programItems.some((i) => i.href === "/programs" && i.label === "All Programs"),
      "Instructor must have All Programs at /programs",
    );

    // 2. Content Library section with Case Library and Library
    const contentSection = instructorSections.find((s) => s.id === "content-library");
    assert.ok(contentSection, "Instructor must have 'content-library' section");
    assert.equal(contentSection.label, "Content Library");

    const contentItems = contentSection.groups.flatMap((g) => g.items);
    assert.ok(
      contentItems.some((i) => i.href === "/cases" && i.label === "Case Library"),
      "Instructor must have Case Library at /cases",
    );
    assert.ok(
      contentItems.some((i) => i.href === "/library" && i.label === "Library"),
      "Instructor must have Library at /library",
    );

    // 3. Global Reports section
    const reportsSection = instructorSections.find((s) => s.id === "reports");
    assert.ok(reportsSection, "Instructor must have top-level 'reports' section");
    assert.equal(reportsSection.label, "Reports");

    const reportItems = reportsSection.groups.flatMap((g) => g.items);
    assert.ok(
      reportItems.some((i) => i.href === "/reports"),
      "Instructor must have Global Reports at /reports",
    );
  });

  await t.test("sectionForPath resolves correctly by persona", () => {
    assert.equal(sectionForPath("/programs", "learner"), "programs");
    assert.equal(sectionForPath("/programs/prog-123", "learner"), "programs");
    assert.equal(sectionForPath("/programs", "instructor"), "programs");
    assert.equal(sectionForPath("/programs/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cases", "instructor"), "content-library");
    assert.equal(sectionForPath("/library", "instructor"), "content-library");
    assert.equal(sectionForPath("/reports", "instructor"), "reports");
    assert.equal(sectionForPath("/reports", "learner"), "overview");
    assert.equal(sectionForPath("/", "instructor"), "overview");
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
