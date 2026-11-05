import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignmentFromApi,
  assignmentStatusText,
  clockText,
  currentAssignment,
  formatPairingCode,
  missingSetup,
  chosenSetup,
  secondsLeft,
  shouldPoll,
  type HeadsetAssignment,
} from "../headset-link";

describe("setup choices the plan never recorded", () => {
  it("reports what is missing and never defaults it", () => {
    assert.deepEqual(missingSetup(undefined), ["implant_design", "fixation"]);
    assert.deepEqual(missingSetup({}), ["implant_design", "fixation"]);
    assert.deepEqual(missingSetup({ implant_design: "CR" }), ["fixation"]);
    assert.deepEqual(missingSetup({ fixation: "cemented" }), ["implant_design"]);
    assert.deepEqual(missingSetup({ implant_design: "CR", fixation: "cemented" }), []);
  });

  it("treats a value that is not a real choice as missing", () => {
    assert.deepEqual(missingSetup({ implant_design: "XX", fixation: "glued" }), ["implant_design", "fixation"]);
    assert.deepEqual(missingSetup({ implant_design: "", fixation: "" }), ["implant_design", "fixation"]);
  });

  it("takes the sender's choice where the plan recorded nothing, and only a valid one", () => {
    assert.deepEqual(chosenSetup({}, { implant_design: "PS", fixation: "cementless" }), { implant_design: "PS", fixation: "cementless" });
    assert.deepEqual(chosenSetup({}, { implant_design: "XX", fixation: "cemented" }), { fixation: "cemented" });
    assert.deepEqual(chosenSetup({}, { implant_design: null, fixation: undefined }), {});
  });

  it("never lets a choice override what the plan already recorded", () => {
    assert.deepEqual(chosenSetup({ implant_design: "CR", fixation: "cemented" }, { implant_design: "PS", fixation: "cementless" }), {});
    assert.deepEqual(chosenSetup({ implant_design: "CR" }, { implant_design: "PS", fixation: "cementless" }), { fixation: "cementless" });
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
