/**
 * Where scored runs and their reports come from.
 *
 * Two sources, never mixed in one answer:
 *
 *   - **database** — `GET /results` (migration 013: `plans`, `attempts`, `assessment_results`). Every real
 *     account reads this. The backend decides who sees what (own runs; a cohort owner's learners; an
 *     administrator's institution), and every figure is the stored one the scorer wrote.
 *   - **sample** — the built-in rows in `lib/seed`, which belong to the six sample learners. Only their own
 *     ids read it, so a real account never sees a sample score as its own.
 *
 * The roll-ups (`./rollups`) and the screens' accessors take a `ResultsData` and reduce it, so one
 * implementation of each figure serves both sources.
 */

import { cache } from "react";
import {
  COHORTS,
  PROCEDURES,
  PROFILES,
  PROFILE_BY_ID,
  REPORTS,
  SCENE_RESULTS,
  SESSIONS,
  type CohortRow,
  type ReportRecord,
  type SceneResultRecord,
} from "@/lib/seed";
import type { PlanningCriterion, ReportFeedback, ReportParameter, ReportPlanning, ReportRules } from "@/lib/report";
import type { Difficulty, FixationType, ImplantDesign, Profile, SeedSession, SimMode, UserRole, Verdict } from "@/lib/types";

/** What the scorer stored beside the headline figures. Absent on sample reports. */
export type StoredReportDetail = {
  passed: boolean;
  passMark: number;
  capped: boolean;
  criticalErrors: number;
  /** Category marks with the share earned on technique and on time (null where a category is not timed). */
  categories: { key: string; label: string; short: string; max: number; score: number; accuracy: number; timing: number | null; raw?: number | null }[];
  parameters: ReportParameter[];
  feedback: ReportFeedback[];
  reasonCodes: string[];
  scoringVersion: string;
  /** The scorer's rules and planning audit, when it wrote them. */
  rules?: ReportRules;
  planning?: ReportPlanning;
  sample?: boolean;
};

/** A stored report has no percentile while the cohort has fewer than three peers with results. */
export type ResultsReport = Omit<ReportRecord, "percentile"> & { percentile?: number; stored?: StoredReportDetail };
export type ResultsSceneResult = SceneResultRecord & {
  pointsLost?: number;
  parS?: number;
  label?: string;
  categoryKey?: string | null;
  points?: number;
  maxPoints?: number;
  timingCredit?: number;
  maxS?: number;
};

export type ResultsData = {
  source: "sample" | "database" | "none";
  sessions: SeedSession[];
  sessionById: Map<string, SeedSession>;
  reportBySession: Map<string, ResultsReport>;
  sceneResults: ResultsSceneResult[];
  sceneResultsBySession: Map<string, ResultsSceneResult[]>;
  profiles: Profile[];
  profileById: Map<string, Profile>;
  cohorts: CohortRow[];
};

function assemble(
  source: ResultsData["source"],
  sessions: SeedSession[],
  reports: ResultsReport[],
  sceneResults: ResultsSceneResult[],
  profiles: Profile[],
  cohorts: CohortRow[],
): ResultsData {
  const bySession = new Map<string, ResultsSceneResult[]>();
  for (const row of sceneResults) {
    const list = bySession.get(row.sessionId);
    if (list) list.push(row);
    else bySession.set(row.sessionId, [row]);
  }
  return {
    source,
    sessions,
    sessionById: new Map(sessions.map((s) => [s.id, s])),
    reportBySession: new Map(reports.map((r) => [r.sessionId, r])),
    sceneResults,
    sceneResultsBySession: bySession,
    profiles,
    profileById: new Map(profiles.map((p) => [p.id, p])),
    cohorts,
  };
}

/** The built-in sample rows, for the six sample learners only. */
export const SAMPLE_RESULTS: ResultsData = assemble("sample", SESSIONS, REPORTS, SCENE_RESULTS, PROFILES, COHORTS);

export const NO_RESULTS: ResultsData = assemble("none", [], [], [], [], []);

/** A sample learner's id (the only ids the sample rows belong to). */
export function isSampleUserId(id: string | undefined): boolean {
  return !!id && PROFILE_BY_ID.has(id);
}

/* ---------- the API's shape ---------- */

type ApiResult = {
  overall_score: number;
  max_score: number;
  pass_mark: number;
  passed: boolean;
  critical_errors: number;
  capped: boolean;
  percentile: number | null;
  categories: { key: string; label: string; short?: string; max: number; score: number; accuracy?: number; timing?: number | null; raw?: number | null }[];
  parameters: {
    key: string; label: string; unit: string; planned: number | null; achieved: number | null; deviation: number | null;
    tolerance: number; verdict: Verdict | null; scene?: string;
  }[];
  scene_results: {
    scene: string; part: string; label: string; category: string | null; outcome: Verdict; warnings: number;
    duration_s: number; par_s: number; points_lost: number; notes: string[];
    points?: number; max_points?: number; timing_credit?: number; max_s?: number;
  }[];
  feedback: { scene: string; label: string; category: string; text: string; points: number; severity: "fail" | "warning" }[];
  reason_codes: string[];
  scoring_version: string;
  assessed_at: string;
  rules?: {
    technique_share?: number; timing_share?: number; pass_mark?: Record<string, number>;
    critical_error_limit?: number; critical_error_cap?: number; technique_credit?: Record<string, number>;
    verdict?: string;
  } | null;
  planning?: {
    criteria?: { parameter: string; name: string; unit: string; planned: number; reference: number; deviation: number; tolerance: number; score: number; severity: string }[];
    mean_criterion_score?: number | null;
  } | null;
  sample_data?: boolean;
};

function rulesOf(r: ApiResult["rules"]): ReportRules | undefined {
  if (!r || typeof r.technique_share !== "number" || typeof r.timing_share !== "number") return undefined;
  return {
    techniqueShare: r.technique_share,
    timingShare: r.timing_share,
    passMarks: r.pass_mark ?? {},
    criticalErrorLimit: r.critical_error_limit ?? 3,
    criticalErrorCap: r.critical_error_cap ?? 59,
    techniqueCredit: r.technique_credit ?? { pass: 1, borderline: 0.5, fail: 0 },
    verdictRule: r.verdict,
  };
}

function planningOf(p: ApiResult["planning"]): ReportPlanning | undefined {
  if (!p?.criteria?.length) return undefined;
  const criteria: PlanningCriterion[] = p.criteria.map((c) => ({
    key: c.parameter,
    name: c.name,
    unit: c.unit,
    planned: c.planned,
    reference: c.reference,
    deviation: c.deviation,
    tolerance: c.tolerance,
    score: c.score,
    severity: c.severity,
  }));
  return { criteria, meanScore: p.mean_criterion_score ?? null };
}

type ApiAttempt = {
  id: string;
  resident_id: string;
  session_id: string | null;
  plan_id: string;
  case_id: string | null;
  case_title: string | null;
  procedure_name: string | null;
  mode: SimMode;
  difficulty: Difficulty;
  implant_design: ImplantDesign;
  fixation: FixationType;
  status: string;
  current_scene: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: ApiResult | null;
};

export type ApiResultsBundle = {
  learners: { id: string; display_name: string; role: UserRole; cohort_id: string | null; cohort_name: string | null; last_active_at: string | null }[];
  cohorts: { id: string; name: string; owner_id: string; created_at: string }[];
  attempts: ApiAttempt[];
};

/** The attempt lifecycle (10_VR_INTEGRATION.md) in this product's session words. */
function statusOf(status: string): SeedSession["status"] {
  if (status === "assessed" || status === "completed" || status === "submitted") return "completed";
  if (status === "in_progress") return "live";
  if (status === "created") return "pending";
  return "aborted"; // paused, failed, cancelled
}

/** The catalogue id for a stored procedure name, when the catalogue knows it. Never guessed otherwise. */
function procedureIdOf(name: string | null): string | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  const exact = PROCEDURES.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact.id;
  if (/total knee (replacement|arthroplasty)/.test(lower)) return "tkr";
  return undefined;
}

export function fromApi(bundle: ApiResultsBundle): ResultsData {
  const sessions: SeedSession[] = [];
  const reports: ResultsReport[] = [];
  const scenes: ResultsSceneResult[] = [];

  for (const a of bundle.attempts) {
    const r = a.result;
    const durationS = r
      ? r.scene_results.reduce((sum, s) => sum + s.duration_s, 0)
      : a.started_at && a.completed_at
        ? Math.round((Date.parse(a.completed_at) - Date.parse(a.started_at)) / 1000)
        : undefined;
    sessions.push({
      id: a.id,
      planId: a.plan_id,
      userId: a.resident_id,
      caseId: a.case_id ?? "",
      caseTitle: a.case_title ?? "Not recorded",
      mode: a.mode,
      difficulty: a.difficulty,
      design: a.implant_design,
      fixation: a.fixation,
      status: statusOf(a.status),
      currentScene: a.current_scene ?? undefined,
      startedAt: a.started_at ?? undefined,
      endedAt: a.completed_at ?? undefined,
      durationS,
      criticalErrors: r?.critical_errors ?? 0,
      totalScore: r?.overall_score,
      passed: r?.passed,
      procedureId: procedureIdOf(a.procedure_name),
      scheduledSessionId: a.session_id ?? undefined,
      source: "database",
    });
    if (!r) continue;

    reports.push({
      sessionId: a.id,
      totalScore: r.overall_score,
      max: r.max_score,
      percentile: r.percentile ?? undefined,
      categories: r.categories.map((c) => ({ key: c.key, label: c.label, score: c.score, max: c.max })),
      generatedAt: r.assessed_at,
      stored: {
        passed: r.passed,
        passMark: r.pass_mark,
        capped: r.capped,
        criticalErrors: r.critical_errors,
        categories: r.categories.map((c) => ({
          key: c.key,
          label: c.label,
          short: c.short ?? c.label,
          max: c.max,
          score: c.score,
          accuracy: c.accuracy ?? Math.round((c.score / (c.max || 1)) * 100),
          timing: c.timing ?? null,
          raw: c.raw ?? null,
        })),
        parameters: r.parameters.map((p) => ({
          key: p.key,
          label: p.label,
          unit: p.unit,
          planned: p.planned,
          achieved: p.achieved,
          tolerance: p.tolerance,
          verdict: p.verdict,
          scene: p.scene,
        })),
        feedback: r.feedback.map((f) => ({
          scene: f.scene,
          label: f.label,
          text: f.text,
          points: f.points,
          category: f.category,
          severity: f.severity,
        })),
        reasonCodes: r.reason_codes ?? [],
        scoringVersion: r.scoring_version,
        rules: rulesOf(r.rules),
        planning: planningOf(r.planning),
        sample: r.sample_data === true,
      },
    });
    for (const s of r.scene_results) {
      scenes.push({
        sessionId: a.id,
        part: s.part,
        scene: s.scene,
        durationS: s.duration_s,
        outcome: s.outcome,
        warnings: s.warnings,
        notes: s.notes?.length ? s.notes : undefined,
        pointsLost: s.points_lost,
        parS: s.par_s,
        label: s.label,
        categoryKey: s.category,
        points: s.points,
        maxPoints: s.max_points,
        timingCredit: s.timing_credit,
        maxS: s.max_s,
      });
    }
  }

  const profiles: Profile[] = bundle.learners.map((l) => ({
    id: l.id,
    email: "",
    displayName: l.display_name,
    role: l.role,
    defaultDifficulty: "intermediate",
    cohortId: l.cohort_id ?? undefined,
    createdAt: "",
    lastActiveAt: l.last_active_at ?? undefined,
  }));
  const cohorts: CohortRow[] = bundle.cohorts.map((c) => ({
    id: c.id,
    name: c.name,
    ownerId: c.owner_id,
    createdAt: c.created_at,
  }));

  sessions.sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
  return assemble("database", sessions, reports, scenes, profiles, cohorts);
}

/**
 * The signed-in account's stored results, read once per request. A database without migration 013 answers
 * 404, which is "nothing stored yet", not an error to show.
 */
export const getStoredResults = cache(async (): Promise<ResultsData> => {
  try {
    const { apiClient } = await import("@/lib/api-client");
    const bundle = (await apiClient.get("/results")) as ApiResultsBundle | null;
    return bundle ? fromApi(bundle) : NO_RESULTS;
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 404 && status !== 401) console.warn("Failed to fetch stored results:", err);
    return NO_RESULTS;
  }
});

/**
 * The results a screen about `subjectId` should read: the sample rows for a sample learner, the stored
 * results otherwise. For an instructor's own screens pass their id; the backend scopes the rows.
 */
export async function resultsFor(subjectId: string | undefined): Promise<ResultsData> {
  if (isSampleUserId(subjectId)) return SAMPLE_RESULTS;
  return getStoredResults();
}

/** One learner's runs, newest first. */
export function sessionsOf(data: ResultsData, userId: string): SeedSession[] {
  return data.sessions
    .filter((s) => s.userId === userId)
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
}

/** Runs by the learners in a cohort (every learner in the data when no cohort is given), newest first. */
export function sessionsOfCohort(data: ResultsData, cohortId?: string): SeedSession[] {
  const members = new Set(data.profiles.filter((p) => !cohortId || p.cohortId === cohortId).map((p) => p.id));
  return data.sessions
    .filter((s) => members.has(s.userId))
    .sort((a, b) => (b.startedAt ?? "").localeCompare(a.startedAt ?? ""));
}

/**
 * The run performed for a *scheduled* session id, when one has been performed: a session is scheduled as
 * `sessions.id` and performed as `attempts.id`, and pages are linked by either. Prefers a run with a report.
 */
export function runForScheduled(data: ResultsData, scheduledId: string): SeedSession | undefined {
  const runs = data.sessions.filter((run) => run.scheduledSessionId === scheduledId);
  return runs.find((run) => data.reportBySession.has(run.id)) ?? runs[0];
}

export function sceneResultsOf(data: ResultsData, sessionId: string): ResultsSceneResult[] {
  return data.sceneResultsBySession.get(sessionId) ?? [];
}
