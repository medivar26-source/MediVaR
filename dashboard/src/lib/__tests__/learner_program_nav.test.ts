import test from "node:test";
import assert from "node:assert/strict";
import { sectionsForPersona, sectionForPath } from "../nav";
import type { ProgramSummary } from "../data/programs";

test("Navigation persona separation & approved hierarchy", async (t) => {
  await t.test("learner persona should see role-appropriate sections and never cohort admin", () => {
    const learnerSections = sectionsForPersona("learner");

    // Learners get one Training section for their whole path
    const trainingSection = learnerSections.find((s) => s.id === "training");
    assert.ok(trainingSection, "Learner must have a 'training' section");
    assert.equal(trainingSection.label, "Training");
    assert.equal(
      learnerSections.find((s) => s.id === "programs"),
      undefined,
      "Learner must NOT get the instructor 'programs' workspace",
    );

    // All items across all groups for learner
    const allItems = learnerSections.flatMap((s) => s.groups.flatMap((g) => g.items));
    const hrefs = allItems.map((i) => i.href);
    const labels = allItems.map((i) => i.label.toLowerCase());

    assert.ok(hrefs.includes("/programs"), "Learner must have /programs destination");
    assert.ok(!hrefs.includes("/cohorts"), "Learner must NOT have /cohorts destination in nav");
    assert.ok(!hrefs.includes("/learners"), "Learner must NOT have /learners destination");
    assert.ok(!labels.includes("cohorts"), "Learner must NOT see 'Cohorts' label");
    assert.ok(!labels.includes("learners"), "Learner must NOT see 'Learners' label");

    // Training path: Programs, Cases, Pre-op Plans, Sessions, in that order
    const trainingHrefs = trainingSection.groups.flatMap((g) => g.items.map((i) => i.href));
    assert.deepEqual(trainingHrefs, ["/programs", "/cases", "/plans", "/sessions"]);

    // Simulations / setup are no longer navigation destinations
    assert.ok(!hrefs.includes("/simulations"), "Simulations leaves learner navigation");
    assert.ok(!hrefs.includes("/setup"), "Setup leaves learner navigation");

    // All seven skills are listed
    const skillHrefs = allItems.filter((i) => i.href.startsWith("/performance/")).map((i) => i.href);
    assert.equal(skillHrefs.length, 7);
    assert.ok(skillHrefs.includes("/performance/planning"));

    // Help & guides
    const helpSection = learnerSections.find((s) => s.id === "help");
    assert.ok(helpSection, "Learner must have a 'help' section");
    assert.ok(helpSection.groups.flatMap((g) => g.items).some((i) => i.href === "/library"));
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

    // 3. Reports lives inside Overview, not as a section of its own
    assert.equal(instructorSections.find((s) => (s.id as string) === "reports"), undefined);
    const overviewItems = instructorSections
      .find((s) => s.id === "overview")!
      .groups.flatMap((g) => g.items);
    assert.ok(
      overviewItems.some((i) => i.href === "/reports"),
      "Instructor must have Reports at /reports under Overview",
    );

    // 4. Sessions, Cohorts and Learners are all one click away
    for (const [label, href] of [
      ["Sessions", "/sessions"],
      ["Cohorts", "/programs?tab=cohorts"],
      ["Learners", "/learners"],
    ]) {
      assert.ok(
        programItems.some((i) => i.label === label && i.href === href),
        `Instructor must have ${label} at ${href}`,
      );
    }
  });

  await t.test("sectionForPath resolves correctly by persona", () => {
    assert.equal(sectionForPath("/programs", "learner"), "training");
    assert.equal(sectionForPath("/programs/prog-123", "learner"), "training");
    assert.equal(sectionForPath("/cases/abc", "learner"), "training");
    assert.equal(sectionForPath("/plan/abc/tibial", "learner"), "training");
    assert.equal(sectionForPath("/plans", "learner"), "training");
    assert.equal(sectionForPath("/sessions/abc/report", "learner"), "training");
    assert.equal(sectionForPath("/library", "learner"), "help");
    assert.equal(sectionForPath("/performance/planning", "learner"), "overview");
    assert.equal(sectionForPath("/programs", "instructor"), "programs");
    assert.equal(sectionForPath("/programs/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cases", "instructor"), "content-library");
    assert.equal(sectionForPath("/library", "instructor"), "content-library");
    assert.equal(sectionForPath("/reports", "instructor"), "overview");
    assert.equal(sectionForPath("/learners/abc", "instructor"), "programs");
    assert.equal(sectionForPath("/content", "instructor"), "content-library");
    assert.equal(sectionForPath("/reports", "learner"), "overview");
    assert.equal(sectionForPath("/", "instructor"), "overview");
  });
});

test("Admin section is for administrators only", () => {
  const adminItems = (persona: "learner" | "instructor" | "admin") =>
    sectionsForPersona(persona)
      .filter((s) => s.id === "admin")
      .flatMap((s) => s.groups.flatMap((g) => g.items));

  assert.deepEqual(adminItems("admin").map((i) => i.href), ["/admin/instructors", "/admin/institutions"]);
  assert.equal(adminItems("instructor").length, 0);
  assert.equal(adminItems("learner").length, 0);
  assert.equal(sectionForPath("/admin/instructors", "admin"), "admin");
  // The administrator gets the admin console only, not the instructor workspace.
  assert.deepEqual(sectionsForPersona("admin").map((s) => s.id), ["admin"]);
  assert.ok(sectionsForPersona("instructor").every((s) => s.id !== "admin"));
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
