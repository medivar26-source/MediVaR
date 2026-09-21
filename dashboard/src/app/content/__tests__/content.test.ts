import { afterEach, describe, it } from "node:test";
import assert from "node:assert";
import {
  browseCases,
  getAssessmentSettings,
  getProcedureForAuthoring,
  isSyntheticName,
  listAssessmentCriteria,
  listProceduresForAuthoring,
  toCaseDetail,
  toCatalogueRow,
} from "../../../lib/data/content";
import {
  apiCreateCase,
  apiGetCase,
  apiListCases,
  apiUpdateCase,
  ContentApiError,
  type ApiCase,
} from "../../../lib/data/content-api";
import {
  createCase,
  saveAssessmentCriterion,
  saveCaseImaging,
  saveProcedureStep,
  setCaseStatus,
  updateCase,
} from "../../actions";

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

function apiCase(over: Partial<ApiCase> = {}): ApiCase {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    program_id: "22222222-2222-4222-8222-222222222222",
    procedure_id: "33333333-3333-4333-8333-333333333333",
    procedure_name: "Total Knee Replacement",
    name: "Varus OA — Right knee",
    difficulty: "intermediate",
    description: "Medial compartment collapse.",
    learning_objective: "Plan a neutral mechanical axis.",
    status: "active",
    version: 1,
    created_at: "2026-09-21T00:00:00Z",
    updated_at: "2026-09-21T00:00:00Z",
    ...over,
  };
}

const ROWS = [
  apiCase({ id: "a", name: "Varus OA — Right knee", difficulty: "intermediate", status: "active" }),
  apiCase({ id: "b", name: "Valgus OA — Left knee", difficulty: "expert", status: "inactive" }),
  apiCase({ id: "c", name: "Rheumatoid — Left knee", difficulty: "beginner", status: "active" }),
  apiCase({
    id: "d",
    name: "DEMO: Synthetic Varus TKR (P-0247)",
    difficulty: "intermediate",
    status: "active",
    procedure_id: "44444444-4444-4444-8444-444444444444",
    procedure_name: "Total Hip Replacement",
  }),
].map(toCatalogueRow);

describe("Content — list, search and filter cases", () => {
  it("shows active and inactive cases alike, sorted by name", () => {
    const { cases, total } = browseCases(ROWS);
    assert.strictEqual(total, 4);
    assert.ok(cases.some((c) => c.status === "inactive"), "an author must still see a retired case");
    const names = cases.map((c) => c.title);
    assert.deepStrictEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  });

  it("searches by title and by id", () => {
    assert.strictEqual(browseCases(ROWS, { q: "valgus" }).cases.length, 1);
    assert.strictEqual(browseCases(ROWS, { q: "  RHEUMATOID " }).cases.length, 1);
    assert.strictEqual(browseCases(ROWS, { q: "c" }).cases.some((c) => c.id === "c"), true);
  });

  it("filters by difficulty, procedure and status", () => {
    assert.ok(browseCases(ROWS, { difficulty: "expert" }).cases.every((c) => c.difficulty === "expert"));
    assert.strictEqual(
      browseCases(ROWS, { procedureId: "44444444-4444-4444-8444-444444444444" }).cases.length,
      1,
    );
    assert.ok(browseCases(ROWS, { status: "inactive" }).cases.every((c) => c.status === "inactive"));
  });

  it("combines filters, and returns an empty list — not an error — when nothing matches", () => {
    const none = browseCases(ROWS, { q: "no such case", status: "active" });
    assert.strictEqual(none.cases.length, 0);
    assert.strictEqual(none.total, 4, "total still reports the unfiltered catalogue");
  });

  it("counts each facet against the OTHER filters, so a chip never leads to an empty result", () => {
    const { facets } = browseCases(ROWS, { status: "inactive" });
    const expert = facets.difficulties.find((f) => f.value === "expert");
    const beginner = facets.difficulties.find((f) => f.value === "beginner");
    assert.strictEqual(expert?.count, 1);
    assert.strictEqual(beginner?.count, 0, "kept visible but counted as zero");
  });

  it("labels procedure facets by name, from the rows themselves", () => {
    const { facets } = browseCases(ROWS);
    assert.deepStrictEqual(
      facets.procedures.map((f) => f.label).sort(),
      ["Total Hip Replacement", "Total Knee Replacement"],
    );
  });

  it("never invents usage — an untracked value stays undefined, not zero", () => {
    assert.ok(ROWS.every((r) => r.usedBySessions === undefined && r.usedByLearners === undefined));
  });

  it("flags demo fixtures by their DEMO: name", () => {
    assert.strictEqual(isSyntheticName("DEMO: Synthetic Varus TKR (P-0247)"), true);
    assert.strictEqual(isSyntheticName("Varus OA — Right knee"), false);
    assert.strictEqual(ROWS.find((r) => r.id === "d")?.isSynthetic, true);
  });
});

describe("Content — case detail mapping", () => {
  it("maps an API case to the authoring detail", () => {
    const detail = toCaseDetail(apiCase());
    assert.strictEqual(detail.title, "Varus OA — Right knee");
    assert.deepStrictEqual(detail.objectives, ["Plan a neutral mechanical axis."]);
    assert.strictEqual(detail.version, 1);
    assert.ok(detail.scoring.length > 0);
  });

  it("reports what the schema cannot hold as unavailable, not as empty-but-real", () => {
    const detail = toCaseDetail(apiCase());
    assert.strictEqual(detail.usage, null, "no sessions table yet");
    assert.deepStrictEqual(detail.imaging, [], "no imaging table yet");
  });

  it("tolerates null description and objective from the database", () => {
    const detail = toCaseDetail(apiCase({ description: null, learning_objective: null }));
    assert.strictEqual(detail.description, undefined);
    assert.deepStrictEqual(detail.objectives, []);
  });
});

describe("Content — API client", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  function stub(status: number, body: unknown) {
    const calls: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
    return calls;
  }

  it("sends the bearer token and reads the list", async () => {
    const calls = stub(200, [apiCase()]);
    const cases = await apiListCases("tok-123");
    assert.strictEqual(cases.length, 1);
    assert.match(calls[0].url, /\/cases$/);
    assert.strictEqual((calls[0].init.headers as Record<string, string>).Authorization, "Bearer tok-123");
  });

  it("creates with a JSON body", async () => {
    const calls = stub(201, apiCase());
    await apiCreateCase("t", {
      name: "Varus OA",
      procedure_id: "p",
      difficulty: "intermediate",
      learning_objective: "Plan a neutral mechanical axis.",
    });
    assert.strictEqual(calls[0].init.method, "POST");
    assert.strictEqual(JSON.parse(String(calls[0].init.body)).difficulty, "intermediate");
  });

  it("patches only what it is given, and has no way to DELETE", async () => {
    const calls = stub(200, apiCase({ status: "inactive" }));
    await apiUpdateCase("t", "abc", { status: "inactive" });
    assert.strictEqual(calls[0].init.method, "PATCH");
    assert.deepStrictEqual(JSON.parse(String(calls[0].init.body)), { status: "inactive" });
    assert.strictEqual("apiDeleteCase" in (await import("../../../lib/data/content-api")), false);
  });

  it("returns null for a case that does not exist", async () => {
    stub(404, { detail: "Case not found." });
    assert.strictEqual(await apiGetCase("t", "nope"), null);
  });

  it("surfaces the backend's user-facing 503 message, not a status code", async () => {
    stub(503, { detail: "Content storage is not set up yet. Try again once the database migration has been applied." });
    await assert.rejects(apiListCases("t"), (err: unknown) => {
      assert.ok(err instanceof ContentApiError);
      assert.strictEqual(err.status, 503);
      assert.match(err.message, /not set up yet/);
      return true;
    });
  });

  it("explains a 403 and a dead session in plain words", async () => {
    stub(403, { detail: "Not authorized to manage content." });
    await assert.rejects(apiListCases("t"), /Not authorized to manage content/);
    stub(401, { detail: "raw jwt error" });
    await assert.rejects(apiListCases("t"), (err: unknown) => {
      assert.ok(err instanceof ContentApiError);
      assert.match(err.message, /Sign in again/);
      assert.doesNotMatch(err.message, /jwt/i);
      return true;
    });
  });

  it("never leaks an unexpected server error's body", async () => {
    stub(500, { detail: 'relation "cases" does not exist' });
    await assert.rejects(apiListCases("t"), (err: unknown) => {
      assert.ok(err instanceof ContentApiError);
      assert.doesNotMatch(err.message, /relation|cases/);
      return true;
    });
  });

  it("turns an unreachable server into a friendly error", async () => {
    globalThis.fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    await assert.rejects(apiListCases("t"), /Cannot reach the server/);
  });
});

describe("Content — procedures and assessment criteria (reference data)", () => {
  it("lists procedures with a step count", async () => {
    const tkr = (await listProceduresForAuthoring()).find((p) => p.id === "tkr");
    assert.ok(tkr);
    assert.strictEqual(tkr!.stepCount, 12, "the eleven TKR parts plus P0");
  });

  it("returns ordered steps, each required or optional", async () => {
    const detail = await getProcedureForAuthoring("tkr");
    assert.strictEqual(detail!.steps[0].part, "P0");
    assert.ok(detail!.steps.some((s) => s.required === false));
    assert.ok(detail!.steps.some((s) => s.required === true));
  });

  it("returns null for a procedure that does not exist", async () => {
    assert.strictEqual(await getProcedureForAuthoring("nope"), null);
  });

  it("lists one criterion per skill category without inventing a tolerance", async () => {
    const criteria = await listAssessmentCriteria();
    assert.strictEqual(criteria.length, 7);
    const total = criteria.reduce((sum, c) => sum + c.weight, 0);
    assert.ok(total > 95 && total <= 100);
    assert.ok(criteria.some((c) => c.criticalSceneCount > 0));
    assert.strictEqual((await getAssessmentSettings()).passingScore, 70);
  });
});

describe("Content — action validation", () => {
  it("createCase rejects a submission missing required fields, before any network call", async () => {
    const state = await createCase({}, formData({ title: "AB" }));
    assert.ok(state.fieldErrors?.title);
    assert.ok(state.fieldErrors?.procedureId);
    assert.ok(state.fieldErrors?.difficulty);
    assert.ok(state.fieldErrors?.learningObjective);
    assert.strictEqual(state.fieldErrors?.side, undefined, "the schema has no side column");
  });

  it("createCase, given valid input but no session, asks the user to sign in", async () => {
    const state = await createCase(
      {},
      formData({
        title: "New varus case",
        procedureId: "p1",
        difficulty: "intermediate",
        learningObjective: "Plan a neutral mechanical axis for a correctable varus deformity.",
      }),
    );
    assert.strictEqual(state.fieldErrors, undefined);
    assert.match(state.error ?? "", /Sign in again/);
  });

  it("updateCase requires a case id and validates like create", async () => {
    assert.ok((await updateCase({}, formData({ title: "Whatever" }))).error);
    const bad = await updateCase({}, formData({ caseId: "x", title: "AB" }));
    assert.ok(bad.fieldErrors?.title);
  });

  it("setCaseStatus validates the id and the target status", async () => {
    assert.ok((await setCaseStatus({}, formData({ nextStatus: "inactive" }))).error);
    assert.ok((await setCaseStatus({}, formData({ caseId: "c", nextStatus: "archived" }))).error);
    assert.match(
      (await setCaseStatus({}, formData({ caseId: "c", nextStatus: "inactive" }))).error ?? "",
      /Sign in again/,
    );
  });

  it("procedure-step and criterion forms validate, then report nothing was saved", async () => {
    assert.ok((await saveProcedureStep({}, formData({ procedureId: "tkr", name: "P" }))).fieldErrors?.name);
    assert.ok((await saveAssessmentCriterion({}, formData({ key: "bone_cuts", weight: "150" }))).fieldErrors?.weight);
    const ok = await saveAssessmentCriterion({}, formData({ key: "bone_cuts", weight: "30" }));
    assert.strictEqual(ok.fieldErrors, undefined);
    assert.match(ok.error ?? "", /not connected to storage/);
  });

  it("saveCaseImaging rejects a missing file, an unknown view and a non-image", async () => {
    const none = await saveCaseImaging({}, formData({ caseId: "c", view: "mri", label: "MRI" }));
    assert.ok(none.fieldErrors?.view && none.fieldErrors?.file);

    const fd = formData({ caseId: "c", view: "ap", label: "AP standing" });
    fd.set("file", new File(["not an image"], "notes.txt", { type: "text/plain" }));
    assert.ok((await saveCaseImaging({}, fd)).fieldErrors?.file);
  });

  it("saveCaseImaging accepts a valid image but says it is not stored", async () => {
    const fd = formData({ caseId: "c", view: "ap", label: "AP standing" });
    fd.set("file", new File(["x"], "ap.jpg", { type: "image/jpeg" }));
    const state = await saveCaseImaging({}, fd);
    assert.strictEqual(state.fieldErrors, undefined);
    assert.match(state.error ?? "", /storage/i);
  });
});
