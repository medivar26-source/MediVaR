import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sessionCaption } from "../session-label";

describe("sessionCaption", () => {
  it("adds nothing when the name already says the mode and the case", () => {
    assert.equal(
      sessionCaption({
        name: "Training: Severe varus osteoarthritis (left knee)",
        caseName: "Severe varus osteoarthritis (left knee)",
        mode: "training",
      }),
      undefined,
    );
  });

  it("adds both when the name is just a label", () => {
    assert.equal(
      sessionCaption({ name: "Week 3 lab", caseName: "Severe varus osteoarthritis (left knee)", mode: "training" }),
      "Training · Severe varus osteoarthritis (left knee)",
    );
  });

  it("adds only the mode when the name has the case but not the mode", () => {
    assert.equal(
      sessionCaption({ name: "Severe varus (left knee) check", caseName: "Severe varus", mode: "assessment" }),
      "Assessment",
    );
  });

  it("adds only the case when the name has the mode but not the case", () => {
    assert.equal(
      sessionCaption({ name: "Assessment day", caseName: "Varus knee", mode: "assessment" }),
      "Varus knee",
    );
  });

  it("ignores letter case when comparing", () => {
    assert.equal(sessionCaption({ name: "TRAINING: VARUS KNEE", caseName: "Varus knee", mode: "training" }), undefined);
  });

  it("copes with a missing case or mode", () => {
    assert.equal(sessionCaption({ name: "Lab", caseName: null, mode: undefined }), undefined);
    assert.equal(sessionCaption({ name: "Lab", caseName: undefined, mode: "training" }), "Training");
  });
});
