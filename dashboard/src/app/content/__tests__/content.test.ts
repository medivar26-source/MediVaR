import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getCaseForAuthoring,
  getProcedureForAuthoring,
  isSyntheticCase,
  listAssessmentCriteria,
  listCasesForAuthoring,
  listProceduresForAuthoring,
} from "../../../lib/data/content";
import {
  createCase,
  saveAssessmentCriterion,
  saveProcedureStep,
  setCaseStatus,
  updateCase,
} from "../../actions";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("Content / Case Library — list cases", () => {
  it("lists every authored case, active and inactive alike", async () => {
    const { cases, total } = await listCasesForAuthoring();
    assert.ok(total >= 8, "expects at least the six authored cases plus two synthetic demos");
    assert.ok(cases.some((c) => c.status === "inactive"), "draft cases must still be visible to an author");
    assert.ok(cases.some((c) => c.status === "active"));
  });

  it("searches by title and by id", async () => {
    const byTitle = await listCasesForAuthoring({ q: "varus" });
    assert.ok(byTitle.cases.length > 0);
    assert.ok(byTitle.cases.every((c) => c.title.toLowerCase().includes("varus") || c.id.toLowerCase().includes("varus")));

    const byId = await listCasesForAuthoring({ q: "CASE_003" });
    assert.strictEqual(byId.cases.length, 1);
    assert.strictEqual(byId.cases[0].id, "CASE_003");
  });

  it("filters by difficulty, procedure and status independently", async () => {
    const expertOnly = await listCasesForAuthoring({ difficulty: "expert" });
    assert.ok(expertOnly.cases.length > 0);
    assert.ok(expertOnly.cases.every((c) => c.difficulty === "expert"));

    const tkrOnly = await listCasesForAuthoring({ procedureId: "tkr" });
    assert.strictEqual(tkrOnly.cases.length, tkrOnly.total, "every seeded case is a TKR case");

    const activeOnly = await listCasesForAuthoring({ status: "active" });
    assert.ok(activeOnly.cases.every((c) => c.status === "active"));

    const inactiveOnly = await listCasesForAuthoring({ status: "inactive" });
    assert.ok(inactiveOnly.cases.every((c) => c.status === "inactive"));
  });

  it("returns an empty result, not an error, for a filter combination with no matches", async () => {
    const { cases, total } = await listCasesForAuthoring({ q: "no such case exists anywhere" });
    assert.strictEqual(cases.length, 0);
    assert.ok(total > 0, "total still reports the unfiltered catalogue size");
  });

  it("computes usage from real sessions, not a placeholder", async () => {
    const { cases } = await listCasesForAuthoring();
    const attempted = cases.find((c) => c.id === "CASE_001");
    assert.ok(attempted);
    assert.ok(attempted!.usedBySessions > 0);
    assert.ok(attempted!.usedByLearners > 0);

    const untouched = cases.find((c) => c.id === "SYNTH-VARUS-001");
    assert.ok(untouched);
    assert.strictEqual(untouched!.usedBySessions, 0, "a case with no sessions reports zero, not undefined or a guess");
  });
});

describe("Content / Case Library — case detail", () => {
  it("returns full authoring detail for a real case", async () => {
    const detail = await getCaseForAuthoring("CASE_001");
    assert.ok(detail);
    assert.strictEqual(detail!.id, "CASE_001");
    assert.ok(detail!.objectives.length > 0);
    assert.ok(detail!.scoring.length > 0, "every case is assessed against the shared skill categories");
  });

  it("returns null for a case that does not exist, rather than throwing", async () => {
    const detail = await getCaseForAuthoring("NOT-A-REAL-CASE");
    assert.strictEqual(detail, null);
  });

  it("marks the synthetic demo cases as synthetic and never as ordinary content", async () => {
    assert.strictEqual(isSyntheticCase("SYNTH-VARUS-001"), true);
    assert.strictEqual(isSyntheticCase("SYNTH-VALGUS-001"), true);
    assert.strictEqual(isSyntheticCase("CASE_001"), false);

    const varus = await getCaseForAuthoring("SYNTH-VARUS-001");
    const valgus = await getCaseForAuthoring("SYNTH-VALGUS-001");
    assert.ok(varus?.isSynthetic);
    assert.ok(valgus?.isSynthetic);
  });
});

describe("Content / Case Library — procedures", () => {
  it("lists procedures with step and case counts derived from the seed data", async () => {
    const procedures = await listProceduresForAuthoring();
    const tkr = procedures.find((p) => p.id === "tkr");
    assert.ok(tkr);
    assert.strictEqual(tkr!.stepCount, 12, "the eleven TKR parts plus P0");
    assert.ok(tkr!.caseCount >= 8);
  });

  it("returns ordered steps for a procedure, each carrying a required/optional state", async () => {
    const detail = await getProcedureForAuthoring("tkr");
    assert.ok(detail);
    assert.strictEqual(detail!.steps.length, detail!.stepCount);
    assert.strictEqual(detail!.steps[0].part, "P0");
    assert.ok(detail!.steps.some((s) => s.required === false), "a variant-only part is optional");
    assert.ok(detail!.steps.some((s) => s.required === true));
  });

  it("returns null for a procedure that does not exist", async () => {
    const detail = await getProcedureForAuthoring("does-not-exist");
    assert.strictEqual(detail, null);
  });
});

describe("Content / Case Library — assessment criteria", () => {
  it("lists one row per skill, weighted to the report categories", async () => {
    const criteria = await listAssessmentCriteria();
    assert.strictEqual(criteria.length, 7, "the seven report categories");
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    assert.ok(totalWeight > 95 && totalWeight <= 100, `weights should sum close to 100, got ${totalWeight}`);
  });

  it("surfaces which skills carry a critical-error rule, without inventing a tolerance", async () => {
    const criteria = await listAssessmentCriteria();
    assert.ok(criteria.some((c) => c.criticalSceneCount > 0));
    for (const c of criteria) {
      assert.ok(Number.isInteger(c.criticalSceneCount));
      assert.ok(c.caseCount >= 0);
    }
  });
});

describe("Content / Case Library — server actions", () => {
  it("createCase rejects a submission missing required fields", async () => {
    const state = await createCase({}, formData({ title: "AB" }));
    assert.ok(state.error);
    assert.ok(state.fieldErrors?.title);
    assert.ok(state.fieldErrors?.procedureId);
    assert.ok(state.fieldErrors?.difficulty);
    assert.ok(state.fieldErrors?.side);
    assert.ok(state.fieldErrors?.learningObjective);
  });

  it("createCase accepts a valid submission but reports honestly that it is not persisted", async () => {
    const state = await createCase(
      {},
      formData({
        title: "New varus case",
        procedureId: "tkr",
        difficulty: "intermediate",
        side: "right",
        learningObjective: "Plan a neutral mechanical axis for a correctable varus deformity.",
      }),
    );
    assert.strictEqual(state.fieldErrors, undefined);
    assert.ok(state.error, "must not silently succeed while there is nowhere to persist to");
    assert.match(state.error!, /not connected|database migration/i);
  });

  it("updateCase requires a case id", async () => {
    const state = await updateCase({}, formData({ title: "Whatever" }));
    assert.ok(state.error);
  });

  it("setCaseStatus validates the case id and the target status", async () => {
    const missingCase = await setCaseStatus({}, formData({ nextStatus: "inactive" }));
    assert.ok(missingCase.error);

    const badStatus = await setCaseStatus({}, formData({ caseId: "CASE_001", nextStatus: "archived" }));
    assert.ok(badStatus.error);

    const valid = await setCaseStatus({}, formData({ caseId: "CASE_001", nextStatus: "inactive" }));
    assert.ok(valid.error, "reports honestly that nothing was persisted");
  });

  it("saveProcedureStep validates its fields", async () => {
    const state = await saveProcedureStep({}, formData({ procedureId: "tkr", name: "P" }));
    assert.ok(state.fieldErrors?.name);
  });

  it("saveAssessmentCriterion rejects an out-of-range weight", async () => {
    const state = await saveAssessmentCriterion(
      {},
      formData({ key: "bone_cuts", weight: "150" }),
    );
    assert.ok(state.fieldErrors?.weight);
  });

  it("saveAssessmentCriterion accepts a valid weight", async () => {
    const state = await saveAssessmentCriterion(
      {},
      formData({ key: "bone_cuts", weight: "30" }),
    );
    assert.strictEqual(state.fieldErrors, undefined);
    assert.ok(state.error);
  });
});
