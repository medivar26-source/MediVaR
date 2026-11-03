import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromApi, runForScheduled, type ApiResultsBundle } from "../data/results";
import { storedReport } from "../data/sessions";
import {
  auditOf,
  gaugeAxis,
  gaugeOf,
  leaksOf,
  markSplits,
  markTotals,
  paceOf,
  passSummary,
  precisionOf,
  round,
  roundHalfUp,
  tallyOf,
  timingCreditOf,
  zoneOfRatio,
} from "../report-analytics";

/**
 * A report built by hand from the scorer's published rules, so every expected figure below can be checked
 * with a calculator:
 *
 *   scene marks   = maxPoints × (0.9 × techniqueCredit + 0.1 × timingCredit)
 *   timing credit = clamp((limit − time) ÷ (limit − par), 0, 1)
 *   category mark = Σ scene marks, rounded half up        total = Σ category marks
 *
 *   bone_cuts   three scenes of 10 marks each
 *     4.1  pass        90 s of par 60 / limit 150 → credit 2/3        → 10 × (0.9 + 0.1 × 2/3) = 9.6667
 *     4.2  borderline 120 s                       → credit 1/3        → 10 × (0.45 + 0.1 × 1/3) = 4.8333
 *     4.3  fail       200 s (past the limit)      → credit 0 (clamp)  → 0
 *                                                          Σ = 14.5 → rounds half up to 15
 *   trialling   two scenes of 25 marks, passed exactly on par → credit 1 → 25 each → 50
 *   preop_planning   18.2 → 18
 *   total = 18 + 15 + 50 = 83   (unrounded 82.7: rounding added 0.3)
 */
function bundle(overrides: { total?: number } = {}): ApiResultsBundle {
  const scene = (
    id: string, part: string, label: string, category: string, outcome: "pass" | "borderline" | "fail",
    dur: number, par: number, limit: number, maxPoints: number, points: number, credit: number, warnings = 0,
  ) => ({
    scene: id, part, label, category, outcome, warnings, duration_s: dur, par_s: par, max_s: limit,
    points, max_points: maxPoints, points_lost: round(maxPoints - points, 4), timing_credit: credit,
    notes: outcome === "pass" ? [] : [`note ${id}`],
  });

  const scenes = [
    scene("4.1", "P4", "Tibial jig", "bone_cuts", "pass", 90, 60, 150, 10, 9.6667, 0.6667),
    scene("4.2", "P4", "Tibial cut", "bone_cuts", "borderline", 120, 60, 150, 10, 4.8333, 0.3333, 1),
    scene("4.3", "P4", "Cut check", "bone_cuts", "fail", 200, 60, 150, 10, 0, 0, 2),
    scene("6.2", "P6", "Trials", "trialling", "pass", 75, 75, 180, 25, 25, 1),
    scene("6.3", "P6", "Tracking", "trialling", "pass", 75, 75, 180, 25, 25, 1),
  ];

  const cat = (key: string, label: string, max: number, raw: number, score: number, accuracy: number, timing: number | null) => ({
    key, label, short: label.split(" ")[0], max, raw, score, accuracy, timing,
  });

  const param = (key: string, label: string, unit: string, planned: number, achieved: number, tolerance: number, verdict: "pass" | "borderline" | "fail") => ({
    key, label, unit, planned, achieved, deviation: round(achieved - planned, 3), tolerance, verdict, scene: "4.2",
  });

  const total = overrides.total ?? 83;
  return {
    learners: [{ id: "u1", display_name: "Test Learner", role: "resident", cohort_id: null, cohort_name: null, last_active_at: null }],
    cohorts: [],
    attempts: [
      {
        id: "attempt-1", resident_id: "u1", session_id: "scheduled-1", plan_id: "plan-1", case_id: "case-1",
        case_title: "Synthetic varus knee", procedure_name: "Total Knee Replacement", mode: "training",
        difficulty: "beginner", implant_design: "CR", fixation: "cemented", status: "assessed", current_scene: null,
        started_at: "2026-10-01T10:00:00Z", completed_at: "2026-10-01T10:30:00Z",
        result: {
          overall_score: total, max_score: 100, pass_mark: 60, passed: true, critical_errors: 0, capped: false, percentile: null,
          categories: [
            cat("preop_planning", "Pre-operative planning", 20, 18.2, 18, 91, null),
            cat("bone_cuts", "Bone cuts", 30, 14.5, 15, 48, 33),
            cat("trialling", "Trialling", 50, 50, 50, 100, 100),
          ],
          parameters: [
            param("tibial_resection_mm", "Tibial resection", "mm", 9, 11.9, 3, "borderline"), // 2.9 / 3 = 0.9667
            param("hka_deg", "Hip–knee–ankle axis", "°", 0, 0.4, 4.5, "pass"), // 0.0889
            param("gap_mm", "Gap difference", "mm", 0, 3.2, 3, "fail"), // 1.0667
            param("half_mm", "Exactly half the band", "mm", 0, 1.5, 3, "pass"), // 0.5 — the boundary belongs to pass
            param("edge_mm", "Exactly the whole band", "mm", 0, 3, 3, "borderline"), // 1.0 — the boundary belongs to borderline
          ],
          scene_results: scenes,
          feedback: [
            { scene: "4.2", label: "Tibial cut", category: "bone_cuts", text: "x", points: 5.2, severity: "warning" },
            { scene: "4.3", label: "Cut check", category: "bone_cuts", text: "y", points: 10, severity: "fail" },
          ],
          reason_codes: [], scoring_version: "test", assessed_at: "2026-10-01T10:31:00Z",
          rules: {
            technique_share: 0.9, timing_share: 0.1, pass_mark: { beginner: 60, intermediate: 70, expert: 80 },
            critical_error_limit: 3, critical_error_cap: 59, technique_credit: { pass: 1, borderline: 0.5, fail: 0 },
          },
          planning: null, sample_data: true,
        },
      },
    ],
  };
}

function reportOf(b: ApiResultsBundle = bundle()) {
  const data = fromApi(b);
  return storedReport(data, "attempt-1", data.reportBySession.get("attempt-1")!.stored!);
}

describe("rounding", () => {
  it("rounds half up, and strips float noise from a subtraction", () => {
    assert.equal(roundHalfUp(14.5), 15);
    assert.equal(roundHalfUp(14.49), 14);
    assert.equal(roundHalfUp(0.5), 1);
    assert.equal(11.9 - 9, 2.9000000000000004);
    assert.equal(round(11.9 - 9, 3), 2.9);
  });
});

describe("the verdict rule on the gauges", () => {
  it("places the boundaries: half the band is a pass, the whole band is borderline, beyond is a fail", () => {
    assert.equal(zoneOfRatio(0.5), "pass");
    assert.equal(zoneOfRatio(0.5001), "borderline");
    assert.equal(zoneOfRatio(1), "borderline");
    assert.equal(zoneOfRatio(1.0001), "fail");
  });

  it("measures each deviation in units of its own tolerance and agrees with the stored verdicts", () => {
    const gauges = reportOf().parameters.map(gaugeOf);
    assert.deepEqual(gauges.map((g) => round(g.ratio as number, 4)), [0.9667, 0.0889, 1.0667, 0.5, 1]);
    assert.deepEqual(gauges.map((g) => g.zone), ["borderline", "pass", "fail", "pass", "borderline"]);
    assert.ok(gauges.every((g) => g.agrees));
    assert.equal(gauges[0].signed, 2.9);
    assert.equal(round(gauges[0].headroom as number, 4), 0.0333);
    assert.equal(gauges[2].headroom, 0, "headroom floors at zero");
  });

  it("flags a stored verdict the rule does not give", () => {
    const b = bundle();
    b.attempts[0].result!.parameters[2].verdict = "pass";
    const gauge = reportOf(b).parameters.map(gaugeOf)[2];
    assert.equal(gauge.agrees, false);
    assert.equal(auditOf(reportOf(b)).find((c) => c.id === "verdicts")!.ok, false);
  });

  it("sizes one shared axis to the worst miss, never under ±1.5 tolerances", () => {
    assert.equal(gaugeAxis(reportOf().parameters.map(gaugeOf)), 1.5);
    const wide = { ...gaugeOf(reportOf().parameters[2]), ratio: 2.4 };
    assert.equal(gaugeAxis([wide]), 3); // ceil(2.4 × 1.15 × 4) / 4 = 12 / 4
  });

  it("summarises precision", () => {
    const p = precisionOf(reportOf().parameters.map(gaugeOf));
    assert.deepEqual(p.byZone, { pass: 2, borderline: 2, fail: 1 });
    assert.equal(p.measured, 5);
    assert.equal(round(p.meanUse, 6), round((2.9 / 3 + 0.4 / 4.5 + 3.2 / 3 + 0.5 + 1) / 5, 6));
    assert.deepEqual(p.outside.map((g) => g.key), ["gap_mm"]);
    assert.deepEqual(p.onTheEdge.map((g) => g.key), ["tibial_resection_mm", "edge_mm"]);
    assert.equal(p.best!.key, "hka_deg");
    assert.equal(p.worst!.key, "gap_mm");
  });
});

describe("technique and time marks", () => {
  const report = reportOf();
  const splits = markSplits(report)!;
  const cuts = splits.find((s) => s.key === "bone_cuts")!;

  it("splits a timed category into the marks on offer and the marks earned", () => {
    assert.equal(round(cuts.techniqueAvailable, 4), 27); // 30 × 0.9
    assert.equal(round(cuts.timeAvailable, 4), 3); //       30 × 0.1
    assert.equal(round(cuts.timeEarned, 4), 1); //          10 × 0.1 × (2/3 + 1/3 + 0)
    assert.equal(round(cuts.techniqueEarned, 4), 13.5); //  14.5 − 1
    assert.equal(round(cuts.techniqueEarned + cuts.timeEarned, 4), 14.5);
  });

  it("treats planning as all technique", () => {
    const preop = splits.find((s) => s.key === "preop_planning")!;
    assert.equal(preop.fromScenes, false);
    assert.equal(preop.techniqueAvailable, 20);
    assert.equal(preop.timeAvailable, 0);
    assert.equal(preop.techniqueEarned, 18.2);
  });

  it("totals to the unrounded score, and states what rounding added", () => {
    const totals = markTotals(report, splits);
    assert.equal(round(totals.rawTotal, 4), 82.7);
    assert.equal(totals.roundingEffect, 0.3);
    assert.equal(round(totals.techniqueAvailable + totals.timeAvailable, 4), 100);
    assert.equal(round(totals.techniqueEarned + totals.timeEarned, 3), 82.7);
  });

  it("gives no split when the report carries no per-scene marks", () => {
    const b = bundle();
    for (const s of b.attempts[0].result!.scene_results) { delete s.points; delete s.max_points; delete s.timing_credit; }
    assert.equal(markSplits(reportOf(b)), null);
  });
});

describe("where the marks went", () => {
  it("ranks the leaks, and the shares and the running total reach exactly 100%", () => {
    const { leaks, totalLost } = leaksOf(reportOf().categories);
    assert.equal(totalLost, 17); // 100 − 83
    assert.deepEqual(leaks.map((l) => [l.key, l.lost]), [["bone_cuts", 15], ["preop_planning", 2]]);
    assert.equal(round(leaks[0].share, 4), round(15 / 17, 4));
    assert.equal(leaks[leaks.length - 1].cumulative, 1);
  });
});

describe("pace", () => {
  const pace = paceOf(reportOf().timeline)!;

  it("adds the clock up, scene by scene and phase by phase", () => {
    assert.equal(pace.totalS, 560);
    assert.equal(pace.parS, 330);
    assert.equal(pace.deltaS, 230);
    assert.equal(round(pace.efficiency, 4), round(330 / 560, 4));
    assert.equal(round(pace.overrun, 4), round(560 / 330 - 1, 4));
    assert.deepEqual(pace.scenes.map((s) => s.elapsedS), [90, 210, 410, 485, 560]);
    assert.deepEqual(pace.scenes.map((s) => s.parElapsedS), [60, 120, 180, 255, 330]);
    assert.deepEqual(pace.parts.map((p) => [p.part, p.durationS, p.parS]), [["P4", 410, 180], ["P6", 150, 150]]);
    assert.equal(pace.parts.reduce((t, p) => t + p.durationS, 0), pace.totalS);
  });

  it("counts scenes over par and over their limit", () => {
    assert.equal(pace.overParCount, 3);
    assert.equal(pace.overLimitCount, 1); // 4.3: 200 s against 150 s
    assert.equal(pace.slowest[0].scene, "4.3");
  });

  it("recomputes time credit by the par rule, clamped to 0–1", () => {
    assert.equal(round(timingCreditOf(90, 60, 150) as number, 4), 0.6667);
    assert.equal(timingCreditOf(200, 60, 150), 0);
    assert.equal(timingCreditOf(30, 60, 150), 1);
    assert.equal(timingCreditOf(90, 60, null), null);
  });
});

describe("the run, counted", () => {
  it("tallies outcomes and warnings", () => {
    const t = tallyOf(reportOf().timeline);
    assert.deepEqual([t.pass, t.borderline, t.fail], [3, 1, 1]);
    assert.equal(t.reached, 5);
    assert.equal(t.cleanRate, 0.6);
    assert.equal(t.warnings, 3);
    assert.equal(t.scenesWithWarnings, 2);
  });

  it("states the margin over the pass mark at every level", () => {
    const s = passSummary(reportOf());
    assert.equal(s.margin, 23); // 83 − 60
    assert.deepEqual(s.levels.map((l) => [l.level, l.met, l.margin]), [
      ["beginner", true, 23], ["intermediate", true, 13], ["expert", true, 3],
    ]);
    assert.equal(s.capReached, false);
  });
});

describe("the audit", () => {
  it("agrees with a self-consistent report on every check", () => {
    const checks = auditOf(reportOf());
    assert.deepEqual(checks.filter((c) => !c.ok), []);
    assert.deepEqual(checks.map((c) => c.id).sort(), [
      "deductions", "max", "rounding", "scene-bounds", "scene-sum", "timing", "total", "verdict", "verdicts",
    ]);
  });

  it("catches a total that is not the sum of its categories", () => {
    const failed = auditOf(reportOf(bundle({ total: 84 }))).filter((c) => !c.ok);
    assert.deepEqual(failed.map((c) => c.id), ["total"]);
    assert.match(failed[0].detail, /18 \+ 15 \+ 50 = 83; reported 84/);
  });

  it("catches a category mark that is not its unrounded mark rounded half up", () => {
    const b = bundle();
    b.attempts[0].result!.categories[1].score = 14; // 14.5 rounds half up to 15
    b.attempts[0].result!.overall_score = 82;
    const failed = auditOf(reportOf(b)).filter((c) => !c.ok).map((c) => c.id);
    assert.ok(failed.includes("rounding"));
  });

  it("catches a time credit that does not follow the par rule", () => {
    const b = bundle();
    b.attempts[0].result!.scene_results[0].timing_credit = 0.9;
    assert.equal(auditOf(reportOf(b)).find((c) => c.id === "timing")!.ok, false);
  });
});

describe("scheduled and performed ids", () => {
  it("finds the run performed for a scheduled session, and nothing for one never performed", () => {
    const data = fromApi(bundle());
    assert.equal(runForScheduled(data, "scheduled-1")?.id, "attempt-1");
    assert.equal(runForScheduled(data, "never-performed"), undefined);
    assert.equal(runForScheduled(data, "attempt-1"), undefined, "an attempt id is not a scheduled id");
  });

  it("prefers a run that has a report over one that does not", () => {
    const b = bundle();
    b.attempts.unshift({ ...b.attempts[0], id: "attempt-0", plan_id: "plan-0", status: "cancelled", result: null });
    assert.equal(runForScheduled(fromApi(b), "scheduled-1")?.id, "attempt-1");
  });
});
