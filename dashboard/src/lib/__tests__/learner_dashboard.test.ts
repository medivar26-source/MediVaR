import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveNextAction,
  enrichCasesWithStatus,
} from "../data/learner-action";
import type { CaseCard } from "../data/cases";
import type { PlanRow } from "../data/plans";
import type { ReportSummary, SessionSummary } from "../types";

const mockSession: SessionSummary = {
  id: "session-001",
  userId: "user-123",
  planId: "plan-001",
  caseId: "CASE_001",
  caseTitle: "Varus Deformity — Primary OA",
  mode: "training",
  difficulty: "intermediate",
  design: "CR",
  fixation: "cemented",
  status: "completed",
  startedAt: "2026-03-20T10:00:00Z",
  endedAt: "2026-03-20T10:25:00Z",
  durationS: 1500,
  currentScene: "3",
  totalScore: 84,
  criticalErrors: 0,
};

const mockReport: ReportSummary = {
  sessionId: "session-001",
  totalScore: 84,
  max: 100,
  categories: [],
  generatedAt: "2026-03-20T10:26:00Z",
};

const mockCases: CaseCard[] = [
  {
    id: "CASE_001",
    title: "Varus Deformity — Primary OA",
    summary: "Standard primary osteoarthritic varus deformity.",
    pathologyLabel: "Primary OA",
    side: "right",
    difficulty: "intermediate",
    attempts: 2,
    bestScore: 88,
    lastScore: 88,
  },
  {
    id: "CASE_002",
    title: "Valgus Deformity — Grade 4",
    summary: "Lateral compartment bone loss with fixed flexion.",
    pathologyLabel: "Valgus deformity",
    side: "left",
    difficulty: "expert",
    attempts: 1,
    bestScore: 68,
    lastScore: 68,
  },
  {
    id: "CASE_003",
    title: "Post-Traumatic Deformity",
    summary: "Prior tibial plateau malunion.",
    pathologyLabel: "Post-traumatic",
    side: "right",
    difficulty: "expert",
    attempts: 0,
  },
];

test("resolveNextAction priority resolution", async (t) => {
  await t.test("Priority 1: Live simulation in headset takes top precedence", () => {
    const action = resolveNextAction({
      activeSession: {
        state: "live",
        session: mockSession,
        elapsedS: 420,
        progress: 45,
      },
      plans: [
        {
          id: "draft-1",
          caseId: "CASE_003",
          caseTitle: "Post-Traumatic Deformity",
          difficulty: "expert",
          mode: "training",
          createdAt: "2026-03-20T09:00:00Z",
          updatedAt: "2026-03-20T09:30:00Z",
          state: "draft",
          stepsAnswered: 2,
          secondsSpent: 120,
        },
      ],
      cases: mockCases,
    });

    assert.equal(action.type, "live_session");
    assert.equal(action.badge, "Live Simulation");
    assert.equal(action.href, "/sessions/session-001");
    assert.ok(action.title.includes("Varus Deformity"));
  });

  await t.test("Priority 2: Interrupted simulation takes precedence over plans and cases", () => {
    const action = resolveNextAction({
      activeSession: {
        state: "interrupted",
        session: mockSession,
        elapsedS: 600,
        progress: 50,
      },
      plans: [
        {
          id: "draft-1",
          caseId: "CASE_003",
          caseTitle: "Post-Traumatic Deformity",
          difficulty: "expert",
          mode: "training",
          createdAt: "2026-03-20T09:00:00Z",
          updatedAt: "2026-03-20T09:30:00Z",
          state: "draft",
          stepsAnswered: 2,
          secondsSpent: 120,
        },
      ],
      cases: mockCases,
    });

    assert.equal(action.type, "interrupted_session");
    assert.equal(action.badge, "Interrupted");
    assert.equal(action.href, "/sessions/session-001");
  });

  await t.test("Priority 3: Draft plan in progress prompts learner to continue planning", () => {
    const draftPlan: PlanRow = {
      id: "draft-1",
      caseId: "CASE_003",
      caseTitle: "Post-Traumatic Deformity",
      difficulty: "expert",
      mode: "training",
      createdAt: "2026-03-20T09:00:00Z",
      updatedAt: "2026-03-20T09:30:00Z",
      state: "draft",
      stepsAnswered: 3,
      secondsSpent: 240,
    };

    const action = resolveNextAction({
      plans: [draftPlan],
      cases: mockCases,
    });

    assert.equal(action.type, "continue_plan");
    assert.equal(action.badge, "Draft Plan");
    assert.equal(action.href, "/plan/draft-1");
    assert.ok(action.subtitle.includes("3 of 6 steps answered"));
  });

  await t.test("Priority 4: Ready/paired plan prompts learner for VR transfer", () => {
    const readyPlan: PlanRow = {
      id: "ready-1",
      caseId: "CASE_002",
      caseTitle: "Valgus Deformity — Grade 4",
      difficulty: "expert",
      mode: "assessment",
      createdAt: "2026-03-19T09:00:00Z",
      updatedAt: "2026-03-19T10:30:00Z",
      state: "ready",
      stepsAnswered: 6,
      secondsSpent: 600,
    };

    const action = resolveNextAction({
      plans: [readyPlan],
      cases: mockCases,
    });

    assert.equal(action.type, "ready_vr");
    assert.equal(action.badge, "Ready for VR");
    assert.equal(action.href, "/plan/ready-1/review");
  });

  await t.test("Priority 5: Assigned unattempted case prompts learner to start planning", () => {
    const action = resolveNextAction({
      cases: mockCases, // CASE_003 has 0 attempts
    });

    assert.equal(action.type, "start_case");
    assert.equal(action.badge, "Assigned Case");
    assert.equal(action.href, "/cases/CASE_003");
  });

  await t.test("Priority 6: Latest completed report prompts learner for debrief review", () => {
    const completedCasesOnly: CaseCard[] = [
      { ...mockCases[0], attempts: 1, bestScore: 85 },
      { ...mockCases[1], attempts: 1, bestScore: 85 },
    ];

    const action = resolveNextAction({
      cases: completedCasesOnly,
      latestReport: {
        session: mockSession,
        report: mockReport,
      },
    });

    assert.equal(action.type, "review_report");
    assert.equal(action.badge, "Latest Result");
    assert.equal(action.href, "/sessions/session-001/report");
    assert.ok(action.subtitle.includes("Scored 84/100"));
  });

  await t.test("Priority 7: Fallback to case catalogue when all tasks complete", () => {
    const completedCasesOnly: CaseCard[] = [
      { ...mockCases[0], attempts: 1, bestScore: 85 },
    ];

    const action = resolveNextAction({
      cases: completedCasesOnly,
    });

    assert.equal(action.type, "none");
    assert.equal(action.badge, "Up to date");
    assert.equal(action.href, "/cases");
  });
});

test("enrichCasesWithStatus lifecycle mapping", async (t) => {
  await t.test("computes correct lifecycle status for each case", () => {
    const plans: PlanRow[] = [
      {
        id: "plan-draft",
        caseId: "CASE_003",
        caseTitle: "Post-Traumatic Deformity",
        difficulty: "expert",
        mode: "training",
        createdAt: "2026-03-20T09:00:00Z",
        updatedAt: "2026-03-20T09:30:00Z",
        state: "draft",
        stepsAnswered: 2,
        secondsSpent: 120,
      },
    ];

    const enriched = enrichCasesWithStatus(mockCases, plans);

    // CASE_001: attempts=2, bestScore=88 (>= passMark 75) -> completed
    const c1 = enriched.find((c) => c.id === "CASE_001");
    assert.ok(c1);
    assert.equal(c1.status, "completed");
    assert.equal(c1.statusLabel, "Completed");

    // CASE_002: attempts=1, bestScore=68 (< passMark 80 for advanced) -> needs_retry
    const c2 = enriched.find((c) => c.id === "CASE_002");
    assert.ok(c2);
    assert.equal(c2.status, "needs_retry");
    assert.equal(c2.statusLabel, "Needs retry");

    // CASE_003: attempts=0, has draft plan -> in_planning
    const c3 = enriched.find((c) => c.id === "CASE_003");
    assert.ok(c3);
    assert.equal(c3.status, "in_planning");
    assert.equal(c3.statusLabel, "In planning");
    assert.equal(c3.associatedPlanId, "plan-draft");
  });

  await t.test("maps unattempted case with no plan to not_started", () => {
    const enriched = enrichCasesWithStatus([mockCases[2]], []);
    assert.equal(enriched[0].status, "not_started");
    assert.equal(enriched[0].statusLabel, "Not started");
  });
});
