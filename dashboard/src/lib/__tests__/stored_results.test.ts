import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromApi, isSampleUserId, sessionsOf, sessionsOfCohort, type ApiResultsBundle } from "../data/results";
import { categoryAverages, cohortLearners, marksLost, passedOf } from "../data/rollups";
import { hasReport, sessionLinks } from "../data/session-links";
import { PROFILES } from "../seed";

/** Two learners in one cohort: a capped run, a passed run, and an interrupted run without a report. */
function bundle(): ApiResultsBundle {
  const cat = (key: string, score: number, max: number) => ({ key, label: key, short: key, max, score, accuracy: 80, timing: 90 });
  const scene = (s: string, outcome: "pass" | "borderline" | "fail", lost: number, category = "bone_cuts") => ({
    scene: s, part: "P4", label: `Scene ${s}`, category, outcome, warnings: outcome === "pass" ? 0 : 1,
    duration_s: 100, par_s: 75, points_lost: lost, notes: outcome === "pass" ? [] : [`note ${s}`],
  });
  const result = (score: number, passed: boolean, capped: boolean, critical: number, scenes: ReturnType<typeof scene>[]) => ({
    overall_score: score, max_score: 100, pass_mark: 70, passed, critical_errors: critical, capped, percentile: null,
    categories: [cat("preop_planning", 18, 20), cat("bone_cuts", score - 18, 80)],
    parameters: [], scene_results: scenes, feedback: [], reason_codes: capped ? ["CRITICAL_ERROR_CAP"] : [],
    scoring_version: "test", assessed_at: "2026-10-01T10:20:00Z",
  });
  const attempt = (id: string, resident: string, status: string, r: ReturnType<typeof result> | null, sessionId: string | null = null) => ({
    id, resident_id: resident, session_id: sessionId, plan_id: `plan-${id}`, case_id: "case-1", case_title: "Severe varus (left knee)",
    procedure_name: "Total Knee Replacement", mode: "training" as const, difficulty: "intermediate" as const,
    implant_design: "CR" as const, fixation: "cemented" as const, status, current_scene: r ? null : "5.2",
    started_at: "2026-10-01T10:00:00Z", completed_at: r ? "2026-10-01T10:20:00Z" : null, result: r,
  });
  return {
    learners: [
      { id: "u-a", display_name: "A Learner", role: "resident", cohort_id: "c-1", cohort_name: "C", last_active_at: null },
      { id: "u-b", display_name: "B Learner", role: "resident", cohort_id: "c-1", cohort_name: "C", last_active_at: null },
    ],
    cohorts: [{ id: "c-1", name: "C", owner_id: "i-1", created_at: "2026-09-01T00:00:00Z" }],
    attempts: [
      // 75 marks earned would pass, but three critical errors capped it at 59: the stored verdict is a fail.
      attempt("a1", "u-a", "assessed", result(59, false, true, 3, [scene("4.2", "fail", 2.25), scene("4.3", "borderline", 1.13)])),
      attempt("a2", "u-b", "assessed", result(88, true, false, 0, [scene("4.2", "pass", 0)]), "sched-1"),
      attempt("a3", "u-b", "cancelled", null),
    ],
  };
}

describe("stored results from the API", () => {
  const data = fromApi(bundle());

  it("maps attempts to runs, with the attempt lifecycle in the product's words", () => {
    assert.equal(data.source, "database");
    assert.equal(data.sessionById.get("a1")!.status, "completed");
    assert.equal(data.sessionById.get("a3")!.status, "aborted");
    assert.equal(data.sessionById.get("a3")!.totalScore, undefined);
    assert.equal(data.sessionById.get("a2")!.scheduledSessionId, "sched-1");
    assert.equal(data.sessionById.get("a2")!.procedureId, "tkr");
  });

  it("uses the stored verdict, so a capped run fails whatever its marks", () => {
    assert.equal(passedOf(data.sessionById.get("a1")!), false);
    assert.equal(passedOf(data.sessionById.get("a2")!), true);
    assert.equal(passedOf(data.sessionById.get("a3")!), undefined);
  });

  it("counts the marks each scene actually lost, not a flat 3 or 1", () => {
    const lost = marksLost(data.sessions, data);
    assert.deepEqual(
      lost.map((m) => [m.scene, m.points]),
      [
        ["4.2", 2.3],
        ["4.3", 1.1],
      ],
    );
  });

  it("links a report only where one is stored", () => {
    assert.equal(hasReport(data.sessionById.get("a1")!), true);
    assert.equal(hasReport(data.sessionById.get("a3")!), false);
    assert.equal(sessionLinks(data.sessionById.get("a3")!).report, undefined);
    assert.equal(sessionLinks(data.sessionById.get("a2")!).report, "/sessions/a2/report");
  });

  it("rolls up per learner and per cohort from the same rows", () => {
    const learners = cohortLearners("c-1", data);
    assert.equal(learners.find((l) => l.id === "u-a")!.meanScore, 59);
    assert.equal(learners.find((l) => l.id === "u-b")!.meanScore, 88);
    assert.equal(learners.find((l) => l.id === "u-b")!.sessions, 2);
    assert.equal(sessionsOfCohort(data, "c-1").length, 3);
    assert.equal(sessionsOf(data, "u-a").length, 1);
    const cats = categoryAverages(data.sessions, data);
    // preop 18/20 in both reports -> 90%.
    assert.equal(cats.find((c) => c.key === "preop_planning")!.pct, 90);
  });

  it("never treats a real account as a sample learner", () => {
    assert.equal(isSampleUserId("u-a"), false);
    assert.equal(isSampleUserId(PROFILES[1].id), true);
  });
});
