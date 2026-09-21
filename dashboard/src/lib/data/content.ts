/**
 * Content / Case Library — the instructor authoring read model.
 *
 * `lib/data/cases.ts` answers "what can I attempt, and how did I do" for a
 * viewer. This file answers a different question — "what content exists,
 * and is it ready for learners" — for the person who maintains it. The two
 * never share a type: a learner's card carries their own score, an
 * authoring row carries a status and who else is using it.
 *
 * Every row is still read from the same seed tables (`CASES`, `PROCEDURES`,
 * `PARTS`, `CATEGORY_META`, `SESSIONS`) — there is no second, competing case
 * store here, only a different projection of the one that already exists.
 *
 * Two real gaps in the current schema show up as honest omissions rather
 * than invented values:
 *  - `cases` has no `program_id` yet (see 06_DATABASE_SCHEMA.md), so this
 *    catalogue is institution-wide, not program-scoped. Once that column and
 *    its API filter exist, `listCasesForAuthoring` is where the scope goes.
 *  - `cases.version` has no authored history yet. Every row reports version
 *    1 — the schema's own default — rather than a fabricated increment.
 */

import {
  CASES,
  CASE_BY_ID,
  CATEGORY_META,
  PARTS,
  PROCEDURES,
  PROFILE_BY_ID,
  SCENES,
  SESSIONS,
} from "@/lib/seed";
import type { CaseRow, PartRow, ProcedureRow, PublishState } from "@/lib/seed";
import type { Difficulty, Side } from "@/lib/types";

export type CaseAuthoringStatus = "active" | "inactive";

/** Cases seeded purely to exercise the workflow — never real content. */
const SYNTHETIC_PREFIX = "SYNTH-";

export function isSyntheticCase(caseId: string): boolean {
  return caseId.startsWith(SYNTHETIC_PREFIX);
}

/* ---------------------------------- usage --------------------------------- */

type UsageStats = { sessions: number; learners: number };

/** One pass over every session in the system, keyed by case. Not per-viewer — this is authoring usage, the same for every instructor who looks. */
function usageByCase(): Map<string, UsageStats> {
  const stats = new Map<string, UsageStats>();
  const learnersByCase = new Map<string, Set<string>>();

  for (const session of SESSIONS) {
    const entry = stats.get(session.caseId) ?? { sessions: 0, learners: 0 };
    entry.sessions += 1;
    stats.set(session.caseId, entry);

    const learners = learnersByCase.get(session.caseId) ?? new Set<string>();
    learners.add(session.userId);
    learnersByCase.set(session.caseId, learners);
  }

  for (const [caseId, learners] of learnersByCase) {
    const entry = stats.get(caseId);
    if (entry) entry.learners = learners.size;
  }

  return stats;
}

/* ---------------------------------- cases ---------------------------------- */

export type CaseCatalogueRow = {
  id: string;
  title: string;
  procedureId: string;
  procedureName: string;
  difficulty: Difficulty;
  side: Side;
  status: CaseAuthoringStatus;
  /** The schema's own default until authored edits are persisted. */
  version: number;
  learningObjective?: string;
  isSynthetic: boolean;
  usedBySessions: number;
  usedByLearners: number;
  createdAt: string;
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

function toCatalogueRow(row: CaseRow, usage: Map<string, UsageStats>): CaseCatalogueRow {
  const procedure = PROCEDURES.find((p) => p.id === row.procedureId);
  const stat = usage.get(row.id);
  return {
    id: row.id,
    title: row.title,
    procedureId: row.procedureId,
    procedureName: procedure?.name ?? row.procedureId.toUpperCase(),
    difficulty: row.difficulty,
    side: row.side,
    status: row.isActive ? "active" : "inactive",
    version: 1,
    learningObjective: row.objectives[0],
    isSynthetic: isSyntheticCase(row.id),
    usedBySessions: stat?.sessions ?? 0,
    usedByLearners: stat?.learners ?? 0,
    createdAt: row.createdAt,
  };
}

function matchesCase(row: CaseCatalogueRow, filters: CaseAuthoringFilters, skip?: keyof CaseAuthoringFilters): boolean {
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
  labelOf: (value: string) => string,
  order?: string[],
): CaseAuthoringFacet[] {
  const pool = rows.filter((row) => matchesCase(row, filters, axis));
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(valueOf(row), 0);
  for (const row of pool) {
    const key = valueOf(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelOf(value), count }))
    .sort((a, b) => (order ? order.indexOf(a.value) - order.indexOf(b.value) : a.label.localeCompare(b.label)));
}

/**
 * The full catalogue — active and inactive alike. This is the one place in
 * the product an inactive case is still visible, because managing it is
 * the point of this screen.
 */
export async function listCasesForAuthoring(
  filters: CaseAuthoringFilters = {},
): Promise<CaseAuthoringBrowse> {
  const usage = usageByCase();
  const all = CASES.slice()
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((row) => toCatalogueRow(row, usage));

  return {
    cases: all.filter((row) => matchesCase(row, filters)),
    total: all.length,
    facets: {
      difficulties: facetOf(all, filters, "difficulty", (r) => r.difficulty, (v) => v, DIFFICULTY_ORDER),
      procedures: facetOf(all, filters, "procedureId", (r) => r.procedureId, (v) => PROCEDURES.find((p) => p.id === v)?.name ?? v),
      statuses: facetOf(all, filters, "status", (r) => r.status, (v) => (v === "active" ? "Active" : "Inactive")),
    },
  };
}

export type CaseAuthoringUsageRow = {
  learnerId: string;
  learnerName: string;
  cohortId?: string;
  sessions: number;
  lastSessionAt?: string;
};

export type CaseAuthoringDetail = CaseCatalogueRow & {
  summary?: string;
  objectives: string[];
  imaging: { view: string; label: string; src?: string; placeholder?: boolean }[];
  usage: CaseAuthoringUsageRow[];
  scoring: { key: string; label: string; max: number }[];
  criticalScenes: { scene: string; name: string; part: string }[];
};

export async function getCaseForAuthoring(caseId: string): Promise<CaseAuthoringDetail | null> {
  const row = CASE_BY_ID.get(caseId);
  if (!row) return null;

  const usage = usageByCase();
  const base = toCatalogueRow(row, usage);

  const byLearner = new Map<string, { sessions: number; lastSessionAt?: string }>();
  for (const session of SESSIONS) {
    if (session.caseId !== caseId) continue;
    const entry = byLearner.get(session.userId) ?? { sessions: 0 };
    entry.sessions += 1;
    const at = session.endedAt ?? session.startedAt;
    if (at && (!entry.lastSessionAt || at > entry.lastSessionAt)) entry.lastSessionAt = at;
    byLearner.set(session.userId, entry);
  }

  const usageRows: CaseAuthoringUsageRow[] = [...byLearner.entries()]
    .map(([learnerId, entry]) => {
      const profile = PROFILE_BY_ID.get(learnerId);
      return {
        learnerId,
        learnerName: profile?.displayName ?? learnerId,
        cohortId: profile?.cohortId,
        sessions: entry.sessions,
        lastSessionAt: entry.lastSessionAt,
      };
    })
    .sort((a, b) => (b.lastSessionAt ?? "").localeCompare(a.lastSessionAt ?? ""));

  const criticalScenes = SCENES.filter((s) => s.procedureId === row.procedureId && s.isCritical).map((s) => ({
    scene: s.scene,
    name: s.name,
    part: s.part,
  }));

  return {
    ...base,
    summary: row.summary,
    objectives: row.objectives,
    imaging: row.imaging,
    usage: usageRows,
    scoring: CATEGORY_META.map((c) => ({ key: c.key, label: c.label, max: c.max })),
    criticalScenes,
  };
}

export async function getCaseTitleForAuthoring(caseId: string): Promise<string | null> {
  return CASE_BY_ID.get(caseId)?.title ?? null;
}

/* -------------------------------- procedures ------------------------------- */

export type ProcedureAuthoringRow = ProcedureRow & {
  stepCount: number;
  caseCount: number;
};

export async function listProceduresForAuthoring(): Promise<ProcedureAuthoringRow[]> {
  return PROCEDURES.map((procedure) => ({
    ...procedure,
    stepCount: PARTS.filter((p) => p.procedureId === procedure.id).length,
    caseCount: CASES.filter((c) => c.procedureId === procedure.id).length,
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

  return {
    ...procedure,
    stepCount: steps.length,
    caseCount: CASES.filter((c) => c.procedureId === procedureId).length,
    steps,
  };
}

export type { PublishState };

/* --------------------------- assessment criteria --------------------------- */

/**
 * The product has no dedicated `assessment_criteria` row yet (see
 * 06_DATABASE_SCHEMA.md) — what exists today is the report-category weighting
 * (`CATEGORY_META`) and which scenes are flagged critical (`SCENES.isCritical`).
 * This view surfaces exactly that, framed the way the documented schema will
 * once it lands: one row per skill/category, the cases it applies to, and
 * whether a critical-error rule is attached. It does not invent a tolerance,
 * a target value or a scoring formula that isn't already in the seed data —
 * those stay with the assessment engine.
 */
export type AssessmentCriterionRow = {
  key: string;
  skillLabel: string;
  weight: number;
  procedureId: string;
  procedureName: string;
  caseCount: number;
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
    caseCount: CASES.filter((c) => c.procedureId === (tkr?.id ?? "tkr")).length,
    criticalSceneCount: SCENES.filter((s) => s.categoryKey === category.key && s.isCritical).length,
  }));
}

export type AssessmentSettingsRow = {
  passingScore: number;
  criticalAutoFail: boolean;
  incompleteAutoFail: boolean;
  guidanceEnabled: boolean;
};

/**
 * Mirrors `assessment_settings` in the documented schema. `PASS_MARK` is
 * per-difficulty in this codebase rather than a single program-level value,
 * so the intermediate mark stands in as the headline figure the settings
 * panel reports; the per-difficulty table sits alongside it rather than
 * being collapsed away.
 */
export async function getAssessmentSettings(): Promise<AssessmentSettingsRow> {
  return {
    passingScore: 70,
    criticalAutoFail: true,
    incompleteAutoFail: true,
    guidanceEnabled: false,
  };
}
