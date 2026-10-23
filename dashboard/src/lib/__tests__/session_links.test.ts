import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SESSIONS, REPORTS } from "../seed";
import { hasReport, hasRun, sessionLinks } from "../data/session-links";

describe("which sessions have run", () => {
  it("counts completed, live (or in_progress) and interrupted sessions, not scheduled or cancelled", () => {
    for (const status of ["completed", "live", "in_progress", "aborted"] as const) {
      assert.equal(hasRun({ status }), true, status);
    }
    for (const status of ["scheduled", "cancelled", "pending"] as const) {
      assert.equal(hasRun({ status }), false, status);
    }
  });
});

describe("session links", () => {
  const scored = SESSIONS.find((s) => REPORTS.some((r) => r.sessionId === s.id))!;
  const unscored = SESSIONS.find((s) => !REPORTS.some((r) => r.sessionId === s.id))!;

  it("links the session, case, sealed plan and report of a scored session", () => {
    const links = sessionLinks(scored);
    assert.equal(links.session, `/sessions/${scored.id}`);
    assert.equal(links.case, `/cases/${scored.caseId}`);
    assert.equal(links.plan, `/plan/${scored.planId}/review`);
    assert.equal(links.report, `/sessions/${scored.id}/report`);
  });

  it("offers no report link where none was generated", () => {
    assert.equal(hasReport(unscored.id), false);
    assert.equal(sessionLinks(unscored).report, undefined);
  });

  it("offers no plan or case link a session does not have (an API-scheduled session)", () => {
    const links = sessionLinks({ id: "api-1", caseId: undefined, planId: undefined });
    assert.equal(links.case, undefined);
    assert.equal(links.plan, undefined);
    assert.equal(links.report, undefined);
    assert.equal(links.session, "/sessions/api-1");
  });

  it("does not link a plan id the plan store does not know", () => {
    assert.equal(sessionLinks({ id: "x", caseId: "c", planId: "no-such-plan" }).plan, undefined);
  });
});

import { canViewSession, isSampleSession } from "../data/session-links";

describe("whose session may be opened", () => {
  const owner = SESSIONS[0];
  const learner = { id: owner.userId, role: "resident" as const };
  const otherLearner = { id: "9b1f0c52-3d7e-4a55-8c10-2f6a7d9e4b01", role: "resident" as const };
  const instructor = { id: "i-1", role: "instructor" as const };

  it("lets a learner open their own and not another learner's sample session", () => {
    assert.equal(canViewSession(learner, owner), true);
    assert.equal(canViewSession(otherLearner, owner), false);
  });

  it("lets instructors and administrators review a learner's session", () => {
    assert.equal(canViewSession(instructor, owner), true);
    assert.equal(canViewSession({ id: "a", role: "admin" }, owner), true);
  });

  it("treats a session the API listed for the signed-in learner (no owner on it) as theirs", () => {
    assert.equal(canViewSession(otherLearner, { userId: undefined }), true);
  });

  it("recognises sample sessions", () => {
    assert.equal(isSampleSession(owner.id), true);
    assert.equal(isSampleSession("s2000000-0000-4000-a000-000000000001"), false);
  });
});
