import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchHintFor, usesAppFrame } from "../shell-routes";

describe("which screens sit inside the app frame", () => {
  it("frames the signed-in app", () => {
    for (const path of [
      "/", "/programs", "/programs/abc", "/sessions", "/sessions/abc/report", "/cases", "/cases/abc",
      "/content", "/plans", "/progress", "/performance/planning", "/personal-cases/abc", "/library/scoring",
      "/settings", "/help", "/simulations", "/admin/instructors", "/some/unknown/page",
    ]) {
      assert.equal(usesAppFrame(path), true, path);
    }
  });

  it("does not frame sign-in and recovery", () => {
    for (const path of ["/login", "/forgot-password", "/reset-password", "/request-access", "/support"]) {
      assert.equal(usesAppFrame(path), false, path);
    }
  });

  it("does not frame the planner, but does frame the plan list (/plans is not /plan/)", () => {
    assert.equal(usesAppFrame("/plan/abc/assessment"), false);
    assert.equal(usesAppFrame("/plan/abc"), false);
    assert.equal(usesAppFrame("/plans"), true);
  });

  it("does not frame the headset launcher for a procedure, but frames the list", () => {
    assert.equal(usesAppFrame("/simulations/tkr"), false);
    assert.equal(usesAppFrame("/simulations"), true);
  });

  it("keeps a page shown inside the settings modal chrome-free", () => {
    assert.equal(usesAppFrame("/settings", true), false);
    assert.equal(usesAppFrame("/settings", false), true);
  });
});

describe("the search suggestion follows the screen", () => {
  it("uses the screen's own term", () => {
    assert.equal(searchHintFor("/cases/abc", "learner"), 'Try searching "varus"');
    assert.equal(searchHintFor("/programs", "instructor"), 'Try searching "programs"');
    assert.equal(searchHintFor("/progress", "learner"), 'Try searching "reports"');
  });

  it("differs on the dashboard by role", () => {
    assert.notEqual(searchHintFor("/", "learner"), searchHintFor("/", "instructor"));
  });

  it("falls back to a general suggestion", () => {
    assert.equal(searchHintFor("/admin/instructors", "admin"), "Search pages, cases, cohorts, learners");
  });
});
