/**
 * Resident Detail — the instructor's view of one resident.
 *
 * Identity, cohort and instructor notes/feedback are real: they come from
 * `/residents` (migration 006 + `users`/`cohort_members`), scoped so an
 * instructor can only see residents in cohorts they own.
 *
 * Performance (competency, skill breakdown, recent cases, critical errors)
 * has no backing table yet — there is no `attempts`, `assessment_results` or
 * `skill_scores` in this database (see 06_DATABASE_SCHEMA.md and
 * CONTENT_SCHEMA_PLAN.md). Rather than invent one, or fabricate numbers
 * against a real person's account, this reads the same seed-backed session
 * accessors `/performance` and `/cohorts/[id]` already use, keyed by this
 * resident's real id. For every resident actually in the database today
 * that id has no seeded sessions, so performance renders as "not tracked
 * yet" — an honest answer, not an empty shell. The moment a real assessment
 * pipeline populates sessions for a real resident id, these same functions
 * start returning real figures with no page change required.
 */

import { redirect } from "next/navigation";
import { CATEGORY_META, sessionsFor } from "@/lib/seed";
import { categoryAverages } from "./rollups";
import { getSessionToken } from "@/lib/session";
import { PASS_MARK, type CategoryAverage, type SessionSummary } from "@/lib/types";
import {
  apiAddAssignment,
  apiAddFeedback,
  apiAddNote,
  apiGetResident,
  apiListAssignments,
  apiListFeedback,
  apiListNotes,
  ResidentApiError,
  type ApiInstructorFeedback,
  type ApiInstructorNote,
  type ApiTrainingAssignment,
} from "./residents-api";

async function authed<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getSessionToken();
  if (!token) redirect("/login");
  try {
    return await fn(token);
  } catch (err) {
    if (err instanceof ResidentApiError && err.status === 401) redirect("/login");
    throw err;
  }
}

export type ResidentStatus = "at-risk" | "on-track" | "no-data";

export type RecentCase = {
  sessionId: string;
  caseId: string;
  caseTitle: string;
  score?: number;
  passed?: boolean;
  date?: string;
};

export type ResidentDetail = {
  id: string;
  displayName: string;
  role: string;
  cohortId?: string;
  cohortName?: string;
  joinedAt?: string;

  status: ResidentStatus;
  /** Most recent scored session. */
  competency?: number;
  /** The scored session before that, for the "previous vs current" delta. */
  previousCompetency?: number;
  /** Completed sessions as a share of every session this resident has started. */
  completionPct?: number;

  sessionsCount: number;
  assessmentsCount: number;
  casesCompletedCount: number;

  skillPerformance: CategoryAverage[];
  /** Skill categories under the pass mark, weakest first — at most 3. */
  weaknesses: CategoryAverage[];
  recentCases: RecentCase[];
  criticalErrorsCount: number;

  /** Grounded in this resident's own worst scored attempt, not a matching algorithm. */
  recommendation?: { skillLabel: string; caseId: string; caseTitle: string; score: number };

  notes: ApiInstructorNote[];
  assignments: ApiTrainingAssignment[];
};

function toDetail(
  base: { id: string; displayName: string; role: string; cohortId?: string; cohortName?: string; joinedAt?: string },
  sessions: SessionSummary[],
  notes: ApiInstructorNote[],
  assignments: ApiTrainingAssignment[],
): ResidentDetail {
  const scored = sessions
    .filter((s) => s.status === "completed" && s.totalScore !== undefined)
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""));

  const competency = scored[0]?.totalScore;
  const previousCompetency = scored[1]?.totalScore;
  const completed = sessions.filter((s) => s.status === "completed");
  const completionPct = sessions.length
    ? Math.round((completed.length / sessions.length) * 100)
    : undefined;

  const skillPerformance = categoryAverages(sessions);
  const weaknesses = [...skillPerformance].sort((a, b) => a.pct - b.pct).filter((c) => c.pct < 70).slice(0, 3);

  const recentCases: RecentCase[] = scored.slice(0, 5).map((s) => ({
    sessionId: s.id,
    caseId: s.caseId,
    caseTitle: s.caseTitle,
    score: s.totalScore,
    passed: s.totalScore !== undefined ? s.totalScore >= PASS_MARK[s.difficulty] : undefined,
    date: s.endedAt,
  }));

  const worst = [...scored].sort((a, b) => (a.totalScore ?? 0) - (b.totalScore ?? 0))[0];
  const recommendation =
    worst && weaknesses[0]
      ? {
          skillLabel: weaknesses[0].label,
          caseId: worst.caseId,
          caseTitle: worst.caseTitle,
          score: worst.totalScore as number,
        }
      : undefined;

  const status: ResidentStatus =
    scored.length === 0 ? "no-data" : (competency as number) < 70 ? "at-risk" : "on-track";

  return {
    ...base,
    status,
    competency,
    previousCompetency,
    completionPct,
    sessionsCount: sessions.length,
    assessmentsCount: sessions.filter((s) => s.mode === "assessment").length,
    casesCompletedCount: new Set(completed.map((s) => s.caseId)).size,
    skillPerformance,
    weaknesses,
    recentCases,
    criticalErrorsCount: sessions.reduce((sum, s) => sum + s.criticalErrors, 0),
    recommendation,
    notes,
    assignments,
  };
}

export async function getResidentDetail(residentId: string): Promise<ResidentDetail | null> {
  const [resident, notes, assignments] = await authed(async (token) =>
    Promise.all([
      apiGetResident(token, residentId),
      apiListNotes(token, residentId),
      apiListAssignments(token, residentId),
    ]),
  );
  if (!resident) return null;

  const sessions = sessionsFor(residentId);

  return toDetail(
    {
      id: resident.id,
      displayName: resident.display_name,
      role: resident.role,
      cohortId: resident.cohort_id ?? undefined,
      cohortName: resident.cohort_name ?? undefined,
      joinedAt: resident.joined_at ?? undefined,
    },
    sessions,
    notes,
    assignments,
  );
}

export async function addResidentAssignment(
  residentId: string,
  caseId: string,
  caseTitle: string,
): Promise<ApiTrainingAssignment> {
  return authed((token) => apiAddAssignment(token, residentId, { case_id: caseId, case_title: caseTitle }));
}

export async function addResidentNote(residentId: string, note: string): Promise<ApiInstructorNote> {
  return authed((token) => apiAddNote(token, residentId, note));
}

export async function addResidentFeedback(
  residentId: string,
  feedback: string,
  attemptId?: string,
): Promise<ApiInstructorFeedback> {
  return authed((token) => apiAddFeedback(token, residentId, feedback, attemptId));
}

export async function getFeedbackForAttempt(
  residentId: string,
  attemptId: string,
): Promise<ApiInstructorFeedback[]> {
  return authed((token) => apiListFeedback(token, residentId, attemptId));
}

export type { ApiInstructorFeedback, ApiInstructorNote, ApiTrainingAssignment };
export { CATEGORY_META };
