/**
 * Content / Case Library — the instructor authoring read model.
 *
 * Cases and the procedure picker come from the backend (`/cases`,
 * `/procedures`), scoped to the caller's institution by the API. The
 * Procedures and Assessment Criteria tabs still read the seed reference data
 * (`PROCEDURES`, `PARTS`, `CATEGORY_META`, `SCENES`) — their tables exist in
 * migration 004 but have no seed rows or authoring UI yet.
 *
 * Things the case table has no column for are reported as unavailable rather
 * than invented: usage (no sessions table yet) is `undefined`/`null`, imaging
 * is empty (no image table or storage), and there is no knee side.
 */

import { redirect } from "next/navigation";
import {
  CATEGORY_META,
  PARTS,
  PROCEDURES,
  SCENES,
} from "@/lib/seed";
import type { PartRow, ProcedureRow, PublishState } from "@/lib/seed";
import { getSessionToken } from "@/lib/session";
import type { Difficulty } from "@/lib/types";
import {
  apiGetCase,
  apiListCases,
  apiListProcedures,
  ContentApiError,
} from "./content-api";
import type { ApiCase } from "./content-api";

export type CaseAuthoringStatus = "active" | "inactive";

/** Demo fixtures are named "DEMO: …" — there is no column to flag them. */
export function isSyntheticName(name: string): boolean {
  return name.startsWith("DEMO:");
}

/** Resolve the session token, run the call, and send a dead session to login. */
async function authed<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  try {
    return await fn(token);
  } catch (err) {
    if (err instanceof ContentApiError && err.status === 401) redirect("/login");
    throw err;
  }
}

/* ---------------------------------- cases ---------------------------------- */

export type CaseCatalogueRow = {
  id: string;
  title: string;
  procedureId: string;
  procedureName: string;
  difficulty: Difficulty;
  status: CaseAuthoringStatus;
  version: number;
  description?: string;
  learningObjective?: string;
  isSynthetic: boolean;
  createdAt: string;
  updatedAt: string;
  /** `undefined` = not tracked yet (no sessions table), which is not the same as zero. */
  usedBySessions?: number;
  usedByLearners?: number;
};

export type CaseAuthoringFilters = {
  q?: string;
  difficulty?: string;
  procedureId?: string;
  status?: string;
};

export type CaseAuthoringFacet = { value: string; label: string; count: number };

export type CaseAuthoringFacets = {
  difficulties: CaseAuthoringFacet[];
  procedures: CaseAuthoringFacet[];
  statuses: CaseAuthoringFacet[];
};

export type CaseAuthoringBrowse = {
  cases: CaseCatalogueRow[];
  facets: CaseAuthoringFacets;
  total: number;
};

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

export function toCatalogueRow(row: ApiCase): CaseCatalogueRow {
  return {
    id: row.id,
    title: row.name,
    procedureId: row.procedure_id,
    procedureName: row.procedure_name,
    difficulty: row.difficulty,
    status: row.status,
    version: row.version,
    description: row.description ?? undefined,
    learningObjective: row.learning_objective ?? undefined,
    isSynthetic: isSyntheticName(row.name),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function matchesCase(
  row: CaseCatalogueRow,
  filters: CaseAuthoringFilters,
  skip?: keyof CaseAuthoringFilters,
): boolean {
  if (skip !== "q" && filters.q) {
    const term = filters.q.trim().toLowerCase();
    if (term && !row.title.toLowerCase().includes(term) && !row.id.toLowerCase().includes(term)) {
      return false;
    }
  }
  if (skip !== "difficulty" && filters.difficulty && row.difficulty !== filters.difficulty) return false;
  if (skip !== "procedureId" && filters.procedureId && row.procedureId !== filters.procedureId) return false;
  if (skip !== "status" && filters.status && row.status !== filters.status) return false;
  return true;
}

function facetOf(
  rows: CaseCatalogueRow[],
  filters: CaseAuthoringFilters,
  axis: keyof CaseAuthoringFilters,
  valueOf: (row: CaseCatalogueRow) => string,
  labelOf: (row: CaseCatalogueRow) => string,
  order?: string[],
): CaseAuthoringFacet[] {
  const pool = rows.filter((row) => matchesCase(row, filters, axis));
  const labels = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    labels.set(valueOf(row), labelOf(row));
    counts.set(valueOf(row), 0);
  }
  for (const row of pool) {
    const key = valueOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labels.get(value) ?? value, count }))
    .sort((a, b) =>
      order ? order.indexOf(a.value) - order.indexOf(b.value) : a.label.localeCompare(b.label),
    );
}

/**
 * Filtering and facet counts run in memory over the institution's whole case
 * list — each facet has to be counted against every *other* filter, which is
 * one pass here and five queries in SQL. Authored catalogues are hundreds of
 * rows at the outside; past roughly a thousand, push this into the query.
 */
export function browseCases(
  all: CaseCatalogueRow[],
  filters: CaseAuthoringFilters = {},
): CaseAuthoringBrowse {
  const sorted = all.slice().sort((a, b) => a.title.localeCompare(b.title));
  return {
    cases: sorted.filter((row) => matchesCase(row, filters)),
    total: sorted.length,
    facets: {
      difficulties: facetOf(sorted, filters, "difficulty", (r) => r.difficulty, (r) => r.difficulty, DIFFICULTY_ORDER),
      procedures: facetOf(sorted, filters, "procedureId", (r) => r.procedureId, (r) => r.procedureName),
      statuses: facetOf(sorted, filters, "status", (r) => r.status, (r) => (r.status === "active" ? "Active" : "Inactive")),
    },
  };
}

/** The whole catalogue — active and inactive alike; managing it is the point of this screen. */
export async function listCasesForAuthoring(
  filters: CaseAuthoringFilters = {},
): Promise<CaseAuthoringBrowse> {
  const rows = await authed((token) => apiListCases(token));
  return browseCases(rows.map(toCatalogueRow), filters);
}

export type CaseAuthoringUsageRow = {
  learnerId: string;
  learnerName: string;
  cohortId?: string;
  sessions: number;
  lastSessionAt?: string;
};

export type CaseAuthoringDetail = CaseCatalogueRow & {
  objectives: string[];
  /** Always empty for now — there is no imaging table or storage bucket. */
  imaging: { view: string; label: string; src?: string; placeholder?: boolean }[];
  /** `null` = usage is not tracked yet, as opposed to an empty list (tracked, nobody has used it). */
  usage: CaseAuthoringUsageRow[] | null;
  scoring: { key: string; label: string; max: number }[];
  criticalScenes: { scene: string; name: string; part: string }[];
};

export function toCaseDetail(row: ApiCase): CaseAuthoringDetail {
  const base = toCatalogueRow(row);
  return {
    ...base,
    objectives: base.learningObjective ? [base.learningObjective] : [],
    imaging: [],
    usage: null,
    scoring: CATEGORY_META.map((c) => ({ key: c.key, label: c.label, max: c.max })),
    criticalScenes: [],
  };
}

export async function getCaseForAuthoring(caseId: string): Promise<CaseAuthoringDetail | null> {
  const row = await authed((token) => apiGetCase(token, caseId));
  return row ? toCaseDetail(row) : null;
}

export async function getCaseTitleForAuthoring(caseId: string): Promise<string | null> {
  try {
    return (await getCaseForAuthoring(caseId))?.title ?? null;
  } catch {
    return null;
  }
}

export type ProcedureOption = { id: string; name: string };

/** The real procedures a case can be attached to — ids are the FK the API expects. */
export async function listProcedureOptions(): Promise<ProcedureOption[]> {
  const rows = await authed((token) => apiListProcedures(token));
  return rows.map((p) => ({ id: p.id, name: p.name }));
}

/* ----------------- procedures tab (seed reference data) ------------------- */

export type ProcedureAuthoringRow = ProcedureRow & {
  stepCount: number;
};

export async function listProceduresForAuthoring(): Promise<ProcedureAuthoringRow[]> {
  return PROCEDURES.map((procedure) => ({
    ...procedure,
    stepCount: PARTS.filter((p) => p.procedureId === procedure.id).length,
  }));
}

export type ProcedureStepRow = PartRow & {
  /** `PARTS` has no explicit flag — every seeded part is required today, and a
   *  variant note is the only optional signal the model carries. */
  required: boolean;
};

export type ProcedureAuthoringDetail = ProcedureAuthoringRow & {
  steps: ProcedureStepRow[];
};

export async function getProcedureForAuthoring(procedureId: string): Promise<ProcedureAuthoringDetail | null> {
  const procedure = PROCEDURES.find((p) => p.id === procedureId);
  if (!procedure) return null;

  const steps = PARTS.filter((p) => p.procedureId === procedureId).map((step) => ({
    ...step,
    required: !step.variantNote,
  }));

  return { ...procedure, stepCount: steps.length, steps };
}

export type { PublishState };

/* ------------- assessment criteria tab (seed reference data) -------------- */

/**
 * There is no `assessment_criteria` row in the seed data — what exists is the
 * report-category weighting (`CATEGORY_META`) and which scenes are flagged
 * critical (`SCENES.isCritical`). This view surfaces exactly that. It does not
 * invent a tolerance, a target value or a scoring formula; those stay with the
 * assessment engine.
 */
export type AssessmentCriterionRow = {
  key: string;
  skillLabel: string;
  weight: number;
  procedureId: string;
  procedureName: string;
  criticalSceneCount: number;
};

export async function listAssessmentCriteria(): Promise<AssessmentCriterionRow[]> {
  const totalMax = CATEGORY_META.reduce((sum, c) => sum + c.max, 0);
  const tkr = PROCEDURES.find((p) => p.id === "tkr");

  return CATEGORY_META.map((category) => ({
    key: category.key,
    skillLabel: category.label,
    weight: totalMax > 0 ? Math.round((category.max / totalMax) * 100) : 0,
    procedureId: tkr?.id ?? "tkr",
    procedureName: tkr?.name ?? "Total Knee Replacement",
    criticalSceneCount: SCENES.filter((s) => s.categoryKey === category.key && s.isCritical).length,
  }));
}

export type AssessmentSettingsRow = {
  passingScore: number;
  criticalAutoFail: boolean;
  incompleteAutoFail: boolean;
  guidanceEnabled: boolean;
};

/** Mirrors `assessment_settings`; the intermediate pass mark stands in as the headline figure. */
export async function getAssessmentSettings(): Promise<AssessmentSettingsRow> {
  return {
    passingScore: 70,
    criticalAutoFail: true,
    incompleteAutoFail: true,
    guidanceEnabled: false,
  };
}
