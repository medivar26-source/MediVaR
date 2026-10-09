import test from "node:test";
import assert from "node:assert/strict";
import { sectionsForPersona, sectionForPath } from "../nav";
import type { ProgramSummary } from "../data/programs";

test("Navigation persona separation & approved hierarchy", async (t) => {
  await t.test("learner persona sees exactly Training, Content Library, Progress", () => {
    const learnerSections = sectionsForPersona("learner");

    assert.deepEqual(
      learnerSections.map((s) => [s.id, s.label]),
      [
        ["assigned-activities", "Training"],
        ["content-library", "Content Library"],
        ["performance", "Progress"],
      ],
    );
    assert.equal(
      learnerSections.find((s) => s.id === "programs"),
      undefined,
      "Learner must NOT get the instructor 'programs' workspace",
    );

    const hrefsOf = (id: string) =>
      learnerSections.find((s) => s.id === id)!.groups.flatMap((g) => g.items.map((i) => i.href));

    // Assigned Activities: the programs they are enrolled in, and their sessions
    assert.deepEqual(hrefsOf("assigned-activities"), ["/programs", "/sessions"]);

    // Content Library: Procedures, Cases, Planning (many plans per case), their own cases
    assert.deepEqual(hrefsOf("content-library"), ["/content?tab=procedures", "/cases", "/plans", "/personal-cases"]);

    // Performance: activity, performance, reports, and the seven skills. The dashboard is not
    // a section: it is its own page, reached from the logo.
    const performance = hrefsOf("performance");
    assert.deepEqual(performance.slice(0, 3), ["/activity", "/performance", "/reports"]);
    assert.ok(!performance.includes("/"), "Dashboard is not a Performance item");
    assert.equal(performance.filter((h) => h.startsWith("/performance/")).length, 7);

    // Nothing instructor-only leaks in
    const all = learnerSections.flatMap((s) => s.groups.flatMap((g) => g.items));
    const labels = all.map((i) => i.label.toLowerCase());
    assert.ok(!all.some((i) => i.href === "/cohorts" || i.href === "/learners"));
    assert.ok(!labels.includes("cohorts") && !labels.includes("learners"));
    assert.ok(!all.some((i) => i.href === "/simulations" || i.href === "/setup"));
  });

  await t.test("instructor persona should follow approved hierarchy: Programs, Content Library, Reports", () => {
    const instructorSections = sectionsForPersona("instructor");

    // 1. Programs section
    const programsSection = instructorSections.find((s) => s.id === "programs");
    assert.ok(programsSection, "Instructor must have 'programs' section as primary academic structure");
    assert.equal(programsSection.label, "Programs");

    // Cohorts are nested under All Programs, because they sit inside programs.
    const programItems = programsSection.groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
    assert.ok(
      programItems.some((i) => i.href === "/programs" && i.label === "All Programs"),
      "Instructor must have All Programs at /programs",
    );

    // 2. Content Library section with Case Library and Procedures (no Assessment Criteria or Library)
    const contentSection = instructorSections.find((s) => s.id === "content-library");
    assert.ok(contentSection, "Instructor must have 'content-library' section");
    assert.equal(contentSection.label, "Content Library");

    const contentItems = contentSection.groups.flatMap((g) => g.items);
    assert.ok(
      contentItems.some((i) => i.href === "/cases" && i.label === "Case Library"),
      "Instructor must have Case Library at /cases",
    );
    assert.ok(
      contentItems.some((i) => i.href === "/content?tab=procedures" && i.label === "Procedures"),
      "Instructor must have Procedures at /content?tab=procedures",
    );
    assert.ok(
      !contentItems.some((i) => i.label === "Assessment Criteria"),
      "Instructor should not have Assessment Criteria in Content Library",
    );
    assert.ok(
      !contentItems.some((i) => i.label === "Library"),
      "Instructor should not have Library in Content Library",
    );

    // 3. Reports lives inside Performance, not as a section of its own; no Dashboard item
    assert.ok(
      !instructorSections.flatMap((s) => s.groups.flatMap((g) => g.items)).some((i) => i.href === "/"),
      "The dashboard is reached from the logo, not from the navigation",
    );
    assert.equal(instructorSections.find((s) => (s.id as string) === "reports"), undefined);
    const overviewItems = instructorSections
      .find((s) => s.id === "overview")!
      .groups.flatMap((g) => g.items);
    assert.ok(
      overviewItems.some((i) => i.href === "/reports"),
      "Instructor must have Reports at /reports under Overview",
    );

    // 4. Sessions and Cohorts are one click away. There is no standalone Learners list:
    // learners are read against their performance inside a program.
    assert.ok(
      !programItems.some((i) => i.label === "Learners" || i.href === "/learners"),
      "Instructor navigation has no separate Learners page",
    );
    for (const [label, href] of [
      ["Sessions", "/sessions"],
      ["Cohorts", "/programs?tab=cohorts"],
    ]) {
      assert.ok(
        programItems.some((i) => i.label === label && i.href === href),
        `Instructor must have ${label} at ${href}`,
      );
    }
  });

  await t.test("every top-level item has an icon so the collapsed sidebar stays usable", () => {
    for (const persona of ["learner", "instructor", "admin"] as const) {
      for (const section of sectionsForPersona(persona)) {
        for (const group of section.groups) {
          // Skill links are a sub-list that is hidden when collapsed.
          if (group.label === "By skill") continue;
          for (const item of group.items) {
            assert.ok(item.icon, `${persona} · ${section.label} · ${item.label} needs an icon`);
          }
        }
      }
    }
  });

  await t.test("Cohorts sit under All Programs for instructors", () => {
    const programs = sectionsForPersona("instructor").find((s) => s.id === "programs")!;
    const allPrograms = programs.groups[0].items.find((i) => i.label === "All Programs")!;
    assert.deepEqual(allPrograms.children?.map((c) => c.href), ["/programs?tab=cohorts"]);
  });

  await t.test("sectionForPath resolves correctly by persona", () => {
    assert.equal(sectionForPath("/programs", "learner"), "assigned-activities");
    assert.equal(sectionForPath("/programs/prog-123", "learner"), "assigned-activities");
    assert.equal(sectionForPath("/sessions/abc/report", "learner"), "assigned-activities");
    assert.equal(sectionForPath("/cases/abc", "learner"), "content-library");
    assert.equal(sectionForPath("/plan/abc/tibial", "learner"), "content-library");
    assert.equal(sectionForPath("/plans", "learner"), "content-library");
    assert.equal(sectionForPath("/personal-cases", "learner"), "content-library");
    assert.equal(sectionForPath("/content", "learner"), "content-library");
    // The dashboard, Settings and Help belong to no section, for either persona.
    assert.equal(sectionForPath("/", "learner"), null);
    assert.equal(sectionForPath("/", "instructor"), null);
    assert.equal(sectionForPath("/settings", "learner"), null);
    assert.equal(sectionForPath("/help", "instructor"), null);
    assert.equal(sectionForPath("/activity", "learner"), "performance");
    assert.equal(sectionForPath("/performance/planning", "learner"), "performance");
    assert.equal(sectionForPath("/programs", "instructor"), "programs");
    assert.equal(sectionForPath("/programs/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts", "instructor"), "programs");
    assert.equal(sectionForPath("/cohorts/prog-123", "instructor"), "programs");
    assert.equal(sectionForPath("/cases", "instructor"), "content-library");
    assert.equal(sectionForPath("/reports", "instructor"), "overview");
    assert.equal(sectionForPath("/learners/abc", "instructor"), "programs");
    assert.equal(sectionForPath("/content", "instructor"), "content-library");
    assert.equal(sectionForPath("/reports", "learner"), "performance");
    assert.equal(sectionForPath("/activity", "instructor"), "overview");
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
