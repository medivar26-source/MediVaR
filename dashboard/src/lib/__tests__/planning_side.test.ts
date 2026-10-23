import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { caseMetaFromRecord, operativeSideOf, planningBlocker } from "../case-meta";
import { planOperativeSide } from "../plan";

describe("case detail metadata is never defaulted", () => {
  it("reads pathology and side from the active version, else from the case", () => {
    assert.deepEqual(
      caseMetaFromRecord({ active_version: { pathology_label: " Varus OA ", side: "Left" }, pathology_label: "Other", side: "right" }),
      { pathologyLabel: "Varus OA", side: "left" },
    );
    assert.deepEqual(caseMetaFromRecord({ pathology_label: "Valgus OA", side: "right" }), {
      pathologyLabel: "Valgus OA",
      side: "right",
    });
  });

  it("leaves both missing when the record has neither (no 'Osteoarthritis', no 'right')", () => {
    for (const row of [{}, { active_version: null }, { active_version: { pathology_label: null, side: null }, side: null }]) {
      const meta = caseMetaFromRecord(row);
      assert.equal(meta.pathologyLabel, undefined);
      assert.equal(meta.side, undefined);
    }
  });

  it("does not accept a value that is not a side", () => {
    assert.equal(caseMetaFromRecord({ side: "both" }).side, undefined);
  });
});

describe("planning needs a recorded operative side", () => {
  it("maps a recorded side to the planner's form", () => {
    assert.equal(operativeSideOf("left"), "LEFT");
    assert.equal(operativeSideOf("Right"), "RIGHT");
    assert.equal(operativeSideOf(undefined), null);
    assert.equal(operativeSideOf("unknown"), null);
  });

  it("does not block a case with a side, and ignores pathology", () => {
    assert.equal(planningBlocker({ side: "left" }), null);
    assert.equal(planningBlocker({ side: "right", ...{ pathologyLabel: undefined } }), null);
  });

  it("blocks a case with no side and says how to fix it, differently for a personal case", () => {
    const shared = planningBlocker({});
    const personal = planningBlocker({ side: null }, { personal: true });
    assert.ok(shared && /no operative side/i.test(shared) && /instructor/i.test(shared));
    assert.ok(personal && /choose Left or Right/.test(personal));
    assert.notEqual(shared, personal);
  });
});

describe("the side a plan is read with", () => {
  const withSide = (side?: string, sealed?: "LEFT" | "RIGHT") => ({
    case: { side },
    payload: {},
    lockedVersion: sealed ? { payload: { v1_vr_payload: { knee_side: sealed } } } : undefined,
  });

  it("is the case's recorded side", () => {
    assert.equal(planOperativeSide(withSide("left")), "LEFT");
    assert.equal(planOperativeSide(withSide("right")), "RIGHT");
  });

  it("is the side already sealed into a locked plan when the case no longer records one", () => {
    assert.equal(planOperativeSide(withSide(undefined, "LEFT")), "LEFT");
  });

  it("is null, never 'right', when nothing records it", () => {
    assert.equal(planOperativeSide(withSide(undefined)), null);
    assert.equal(planOperativeSide(withSide("")), null);
  });
});

import { casePlanBlocker, isPlannableProcedure, procedureBlocker, procedureText } from "../case-meta";

describe("the procedure is never assumed", () => {
  it("recognises the planner's procedure by short id or by name", () => {
    assert.equal(isPlannableProcedure({ procedureId: "tkr" }), true);
    assert.equal(isPlannableProcedure({ procedureName: " total knee replacement " }), true);
    assert.equal(isPlannableProcedure({ procedureId: "9d0f1a54-0000-4000-8000-000000000001", procedureName: "Total Knee Replacement" }), true);
  });

  it("says 'Procedure not recorded' rather than naming one", () => {
    assert.equal(procedureText({}), "Procedure not recorded");
    assert.equal(procedureText({ procedureName: "  " }), "Procedure not recorded");
    assert.equal(procedureText({ procedureName: "Hip Replacement" }), "Hip Replacement");
  });

  it("does not choose the TKA planner for a case whose procedure is unknown", () => {
    const message = procedureBlocker({});
    assert.ok(message && /not recorded/i.test(message));
    assert.equal(isPlannableProcedure({}), false);
  });

  it("names the procedure when it is known but has no planner", () => {
    const message = procedureBlocker({ procedureName: "Hip Replacement" });
    assert.ok(message && message.includes("Hip Replacement") && /no planner/i.test(message));
  });

  it("does not block a case with a supported procedure, or a learner's own case", () => {
    assert.equal(procedureBlocker({ procedureId: "tkr" }), null);
    assert.equal(procedureBlocker({}, { personal: true }), null);
  });

  it("checks the procedure first, then the side", () => {
    assert.match(casePlanBlocker({ side: "left" })!, /procedure/i);
    assert.match(casePlanBlocker({ procedureId: "tkr" })!, /operative side/i);
    assert.equal(casePlanBlocker({ procedureId: "tkr", side: "right" }), null);
    assert.equal(casePlanBlocker({ side: "left" }, { personal: true }), null);
    assert.match(casePlanBlocker({}, { personal: true })!, /operative side/i);
  });
});
