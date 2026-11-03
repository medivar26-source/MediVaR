import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentFromApi,
  assignmentStatusText,
  clockText,
  currentAssignment,
  formatPairingCode,
  lockedPlanBody,
  secondsLeft,
  shouldPoll,
  type HeadsetAssignment,
} from "../headset-link";
import type { PlanSnapshot } from "../plan";

const VR = {
  patient_id: "SYN-TKA-101",
  knee_side: "LEFT" as const,
  assessment: { MAD_mm: 25, AMA_deg: 6.5, mHKA_deg: 8, MPTA_deg: 85, LDFA_deg: 88, PTS_deg: 7 },
  tibial_component: { implant_size: 4, position_2d: { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 } },
  femoral_component: { implant_size: 5, position_2d: { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 } },
};

function snapshot(config: Record<string, unknown> = { mode: "training", difficulty: "intermediate", implant_design: "CR", fixation: "cemented" }): PlanSnapshot {
  return {
    versionId: "lv-1",
    sealedBy: "u-1",
    sealedAt: "2026-11-03T10:00:00Z",
    payload: { workflow: "tkr", session_config: config as never, v1_vr_payload: VR as never },
  };
}

const base = { caseId: "c-1", isPersonalCase: false, isBuiltInCase: false, stepTimings: { assessment: 120 } };

describe("lockedPlanBody", () => {
  it("builds the body for a library case with the sealed version", () => {
    const out = lockedPlanBody({ ...base, lockedVersion: snapshot() });
    assert.ok("body" in out);
    assert.equal(out.body.case_id, "c-1");
    assert.equal(out.body.personal_case_id, undefined);
    assert.equal(out.body.locked_version_id, "lv-1");
    assert.deepEqual(out.body.session_config, { mode: "training", difficulty: "intermediate", implant_design: "CR", fixation: "cemented" });
    assert.equal(out.body.vr_payload.knee_side, "LEFT");
    assert.deepEqual(out.body.step_timings, { assessment: 120 });
  });

  it("sends a personal case as personal_case_id", () => {
    const out = lockedPlanBody({ ...base, isPersonalCase: true, lockedVersion: snapshot() });
    assert.ok("body" in out);
    assert.equal(out.body.personal_case_id, "c-1");
    assert.equal(out.body.case_id, undefined);
  });

  it("refuses a built-in demo case, an unlocked plan, and a missing VR payload", () => {
    assert.match((lockedPlanBody({ ...base, isBuiltInCase: true, lockedVersion: snapshot() }) as { error: string }).error, /built-in/);
    assert.match((lockedPlanBody({ ...base }) as { error: string }).error, /Lock the plan/);
    const noVr = snapshot();
    delete noVr.payload.v1_vr_payload;
    assert.match((lockedPlanBody({ ...base, lockedVersion: noVr }) as { error: string }).error, /VR payload/);
  });

  it("never defaults the implant design or fixation: it asks for them", () => {
    const out = lockedPlanBody({ ...base, lockedVersion: snapshot({ mode: "training", difficulty: "expert" }) });
    assert.ok("error" in out);
    assert.deepEqual(out.needs, ["implant_design", "fixation"]);
  });

  it("takes the sender's choice where the plan recorded nothing, and only a valid one", () => {
    const bare = snapshot({ mode: "training", difficulty: "expert" });
    const ok = lockedPlanBody({ ...base, lockedVersion: bare, chosen: { implant_design: "PS", fixation: "cementless" } });
    assert.ok("body" in ok);
    assert.equal(ok.body.session_config.implant_design, "PS");
    assert.equal(ok.body.session_config.fixation, "cementless");
    const half = lockedPlanBody({ ...base, lockedVersion: bare, chosen: { implant_design: "XX", fixation: "cemented" } });
    assert.ok("error" in half);
    assert.deepEqual(half.needs, ["implant_design"]);
  });

  it("never lets a choice override what the plan already recorded", () => {
    const out = lockedPlanBody({ ...base, lockedVersion: snapshot(), chosen: { implant_design: "PS", fixation: "cementless" } });
    assert.ok("body" in out);
    assert.equal(out.body.session_config.implant_design, "CR");
    assert.equal(out.body.session_config.fixation, "cemented");
  });

  it("keeps an assessment plan's mode and treats an unknown mode as training", () => {
    const exam = lockedPlanBody({ ...base, lockedVersion: snapshot({ mode: "assessment", difficulty: "expert", implant_design: "PS", fixation: "cementless" }) });
    assert.ok("body" in exam);
    assert.equal(exam.body.session_config.mode, "assessment");
    const odd = lockedPlanBody({ ...base, lockedVersion: snapshot({ mode: "weird", difficulty: "expert", implant_design: "PS", fixation: "cementless" }) });
    assert.ok("body" in odd);
    assert.equal(odd.body.session_config.mode, "training");
  });
});

describe("code and countdown", () => {
  it("groups the code in threes", () => {
    assert.equal(formatPairingCode("004217"), "004 217");
    assert.equal(formatPairingCode("12"), "12");
  });

  it("counts down whole seconds and stops at zero", () => {
    const now = Date.parse("2026-11-03T10:00:00Z");
    assert.equal(secondsLeft("2026-11-03T10:09:59.900Z", now), 599);
    assert.equal(secondsLeft("2026-11-03T09:59:00Z", now), 0);
    assert.equal(secondsLeft(undefined, now), 0);
    assert.equal(secondsLeft("not a date", now), 0);
    assert.equal(clockText(545), "9:05");
    assert.equal(clockText(0), "0:00");
  });
});

describe("assignments", () => {
  const row = (status: string, extra: Record<string, unknown> = {}) =>
    assignmentFromApi({ id: "a", plan_id: "p", status, headset_mode: "Practice", created_at: "2026-11-03T10:00:00Z", ...extra });

  it("maps the API row, never expecting a code", () => {
    const a = row("paired", { device_name: "Quest 3", paired_at: "2026-11-03T10:01:00Z", attempt_id: null });
    assert.equal(a.status, "paired");
    assert.equal(a.deviceName, "Quest 3");
    assert.equal(a.attemptId, undefined);
    assert.equal("code" in a, false);
  });

  it("says where each assignment has got to", () => {
    assert.match(assignmentStatusText(row("pending")), /Type the code/);
    assert.match(assignmentStatusText(row("paired", { device_name: "Quest 3" })), /connected \(Quest 3\)/);
    assert.match(assignmentStatusText(row("running", { last_outcome: "Abandoned" })), /stopped part-way/);
    assert.match(assignmentStatusText(row("reported", { scoring_status: "scored" })), /report is ready/);
    assert.match(assignmentStatusText(row("reported", { scoring_status: "awaiting_inputs" })), /cannot be scored yet/);
    assert.match(assignmentStatusText(row("expired")), /expired/);
  });

  it("shows the newest live or finished one and polls only while the headset may still act", () => {
    const list: HeadsetAssignment[] = [row("cancelled"), row("pending"), row("reported")];
    assert.equal(currentAssignment(list)?.status, "pending");
    assert.equal(shouldPoll(row("pending")), true);
    assert.equal(shouldPoll(row("running")), true);
    assert.equal(shouldPoll(row("reported")), false);
    assert.equal(shouldPoll(row("expired")), false);
    assert.equal(shouldPoll(undefined), false);
  });
});
