import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStoredId, isStoredPlan, newPlanSetup, pinFromHeadset, planFromApi } from "../plan-api";

const ID = "11111111-1111-4111-8111-111111111111";
const CASE = "22222222-2222-4222-8222-222222222222";

const draft = (over: Record<string, unknown> = {}) => ({
  id: ID,
  owner_id: "u-1",
  case_id: CASE,
  is_personal_case: false,
  workflow: "tkr",
  session_config: { mode: "training", difficulty: "intermediate" },
  payload: { workflow: "tkr", case_id: CASE, v1_assessment: { MAD_mm: 25 } },
  step_timings: { assessment: 120, junk: "x" },
  preset_name: null,
  status: "draft",
  locked: null,
  attempt_id: null,
  headset: null,
  created_at: "2026-11-05T10:00:00+00:00",
  updated_at: "2026-11-05T10:05:00+00:00",
  ...over,
});

describe("which ids are stored", () => {
  it("is true for database ids and false for the built-in practice cases", () => {
    assert.equal(isStoredId(ID), true);
    assert.equal(isStoredId(ID.toUpperCase()), true);
    assert.equal(isStoredId("CASE_001"), false);
    assert.equal(isStoredId("SYNTH-VARUS-001"), false);
    assert.equal(isStoredId("10000000-0000-4000-a000-000000000904x"), false);
    assert.equal(isStoredId(""), false);
  });
});

describe("planFromApi", () => {
  it("maps a draft: owned, not ready, no snapshot, and the stored payload kept as it is", () => {
    const plan = planFromApi(draft());
    assert.equal(plan.id, ID);
    assert.equal(plan.dbPlanId, ID);
    assert.equal(isStoredPlan(plan), true);
    assert.equal(plan.userId, "u-1");
    assert.equal(plan.caseId, CASE);
    assert.equal(plan.isReadyForVr, false);
    assert.equal(plan.lockedVersion, undefined);
    assert.equal(plan.presetName, undefined);
    assert.deepEqual(plan.payload.v1_assessment, { MAD_mm: 25 });
    assert.deepEqual(plan.stepTimings, { assessment: 120 }); // only numbers
    assert.equal(plan.updatedAt, "2026-11-05T10:05:00+00:00");
  });

  it("maps a locked plan: ready, with the sealed version", () => {
    const sealed = { workflow: "tkr", v1_assessment: { MAD_mm: 25 }, v1_vr_payload: { patient_id: "p" } };
    const plan = planFromApi(
      draft({
        status: "locked",
        payload: sealed,
        locked: { version_id: "v-1", sealed_by: "u-1", sealed_at: "2026-11-05T10:10:00+00:00", payload: sealed },
      }),
    );
    assert.equal(plan.isReadyForVr, true);
    assert.equal(plan.lockedVersion?.versionId, "v-1");
    assert.equal(plan.lockedVersion?.sealedBy, "u-1");
    assert.equal(plan.lockedVersion?.sealedAt, "2026-11-05T10:10:00+00:00");
    assert.deepEqual(plan.lockedVersion?.payload, sealed);
  });

  it("uses the plan's own payload as the snapshot when the list leaves it out (a locked payload never changes)", () => {
    const sealed = { workflow: "tkr", v1_vr_payload: { patient_id: "p" } };
    const plan = planFromApi(draft({ status: "locked", payload: sealed, locked: { version_id: "v-1", sealed_by: null, sealed_at: "t" } }));
    assert.deepEqual(plan.lockedVersion?.payload, sealed);
    assert.equal(plan.lockedVersion?.sealedBy, "");
  });

  it("carries the personal-case flag, the performed run and the headset's state", () => {
    const plan = planFromApi(
      draft({
        is_personal_case: true,
        attempt_id: "att-1",
        headset: { status: "pending", code_expires_at: "2026-11-05T10:15:00+00:00", paired_at: null },
      }),
    );
    assert.equal(plan.isPersonalCase, true);
    assert.equal(plan.attemptId, "att-1");
    assert.deepEqual(plan.headset, { status: "pending", codeExpiresAt: "2026-11-05T10:15:00+00:00", pairedAt: undefined });
  });

  it("survives a row with nothing optional on it", () => {
    const plan = planFromApi({ id: ID, owner_id: "u-1", case_id: CASE, status: "draft" });
    assert.deepEqual(plan.payload, {});
    assert.deepEqual(plan.stepTimings, {});
    assert.equal(plan.headset, undefined);
  });
});

describe("the pairing code's lifecycle", () => {
  const plan = { id: ID, caseId: CASE };
  it("is live while a code waits, expired after, and used once a headset paired", () => {
    const live = pinFromHeadset({ status: "pending", codeExpiresAt: "t1" }, plan, "Case");
    assert.deepEqual([live?.state, live?.expiresAt, live?.caseTitle], ["live", "t1", "Case"]);
    assert.equal(pinFromHeadset({ status: "expired", codeExpiresAt: "t1" }, plan, "Case")?.state, "expired");
    for (const status of ["paired", "running", "reported"]) {
      const used = pinFromHeadset({ status, codeExpiresAt: "t1", pairedAt: "t2" }, plan, "Case");
      assert.deepEqual([used?.state, used?.redeemedAt], ["redeemed", "t2"], status);
    }
  });

  it("is nothing for a replaced code or no assignment, and never carries digits", () => {
    assert.equal(pinFromHeadset({ status: "cancelled" }, plan, "Case"), undefined);
    assert.equal(pinFromHeadset(undefined, plan, "Case"), undefined);
    assert.equal("pin" in (pinFromHeadset({ status: "pending", codeExpiresAt: "t" }, plan, "Case") ?? {}), false);
  });
});

describe("the setup a new plan starts with", () => {
  it("keeps real values", () => {
    assert.deepEqual(newPlanSetup({ mode: "assessment", difficulty: "expert", design: "PS", fixation: "cementless" }), {
      mode: "assessment",
      difficulty: "expert",
      implant_design: "PS",
      fixation: "cementless",
    });
  });

  it("falls back to training / intermediate for mode and difficulty, and never defaults the implant", () => {
    assert.deepEqual(newPlanSetup({ mode: "", difficulty: null }), { mode: "training", difficulty: "intermediate" });
    assert.deepEqual(newPlanSetup({ mode: "exam", difficulty: "hard", design: "XX", fixation: "glued" }), {
      mode: "training",
      difficulty: "intermediate",
    });
  });
});
