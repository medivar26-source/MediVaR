import { categoryAverages, cohortHotspots, cohortLearners } from "./rollups";
import { getStoredResults, sessionsOfCohort } from "./results";
import type { CategoryAverage, LearnerSummary, SceneHotspot } from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { getPrograms } from "./programs";

export type CohortSummary = {
  id: string;
  program_id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  learners: number;
  meanScore?: number;
  belowPass: number;
  presetId?: string;
  presetName?: string;
};

export type PresetSummary = {
  id: string;
  name: string;
  caseId?: string;
  ownerId: string;
  createdAt: string;
  effects: string[];
  assignedTo: { id: string; name: string }[];
  plans: number;
};

export type CohortDetail = {
  cohort: CohortSummary;
  learners: LearnerSummary[];
  categories: CategoryAverage[];
  hotspots: SceneHotspot[];
  presets: PresetSummary[];
};

export async function getPresets(): Promise<PresetSummary[]> {
  return [];
}

export async function getPreset(id: string): Promise<PresetSummary | null> {
  const presets = await getPresets();
  return presets.find((p) => p.id === id) ?? null;
}

export async function getCohorts(): Promise<CohortSummary[]> {
  try {
    const [data, results] = await Promise.all([apiClient.get('/cohorts/'), getStoredResults()]);
    return data.map((c: any) => {
      // The cohort's mean and below-pass count, from the same roll-up the dashboard uses.
      const scored = cohortLearners(c.id, results).filter((l) => l.meanScore !== undefined);
      const means = scored.map((l) => l.meanScore as number);
      return {
        id: c.id,
        program_id: c.program_id,
        name: c.name,
        ownerId: c.owner_id,
        createdAt: c.created_at,
        learners: c.learners,
        meanScore: means.length ? Math.round(means.reduce((a, b) => a + b, 0) / means.length) : undefined,
        belowPass: means.filter((m) => m < 70).length,
        presetId: c.preset_id,
        presetName: c.preset_name,
      };
    });
  } catch (error) {
    console.error("Failed to fetch cohorts:", error);
    return [];
  }
}

export async function getCohort(id: string): Promise<CohortDetail | null> {
  try {
    const data = await apiClient.get(`/cohorts/${id}`);
    const c = data.cohort;
    const cohort: CohortSummary = {
      id: c.id,
      program_id: c.program_id,
      name: c.name,
      ownerId: c.owner_id,
      createdAt: c.created_at,
      learners: c.learners,
      meanScore: c.mean_score !== null ? c.mean_score : undefined,
      belowPass: c.below_pass,
      presetId: c.preset_id,
      presetName: c.preset_name,
    };
    
    // Each learner's figures from the stored results (the same roll-up the dashboard uses); the roster
    // itself (who is in the cohort, when they joined) from the cohort API.
    const results = await getStoredResults();
    const figures = new Map(cohortLearners(id, results).map((l) => [l.id, l]));
    const learners = data.learners.map((l: any) => {
      const f = figures.get(l.id);
      return {
        id: l.id,
        displayName: l.display_name,
        role: l.role,
        sessions: f?.sessions ?? l.sessions ?? 0,
        assessments: f?.assessments ?? l.assessments ?? 0,
        meanScore: f?.meanScore,
        criticalErrors: f?.criticalErrors ?? 0,
        weakestCategory: f?.weakestCategory,
        lastActiveAt: f?.lastActiveAt ?? l.last_active_at,
        joinedAt: l.joined_at,
      };
    });
    const scoredMeans = learners.flatMap((l: any) => (l.meanScore !== undefined ? [l.meanScore as number] : []));
    cohort.meanScore = scoredMeans.length
      ? Math.round(scoredMeans.reduce((a: number, b: number) => a + b, 0) / scoredMeans.length)
      : undefined;
    cohort.belowPass = scoredMeans.filter((m: number) => m < 70).length;

    return {
      cohort,
      learners,
      categories: categoryAverages(sessionsOfCohort(results, id), results),
      hotspots: cohortHotspots(id, results),
      presets: await getPresets(),
    };
  } catch (error) {
    console.error(`Failed to fetch cohort ${id}:`, error);
    return null;
  }
}

export type LearnerRow = LearnerSummary & {
  /**
   * Every cohort of the viewer's this learner belongs to, each named with the
   * program above it — a cohort name alone ("TKR batch 2026") doesn't say
   * which curriculum it belongs to, and a program name alone can't tell two
   * of its own cohorts apart.
   */
  cohorts: { id: string; name: string; programName?: string }[];
};

/**
 * Every learner the viewer supervises — **one row per person**, not per
 * cohort membership.
 *
 * A learner can sit in several of an instructor's cohorts, and their
 * sessions, scores and critical errors belong to the person, not to the
 * membership: listing them once per cohort repeated the same figures under
 * two names and gave React two rows with the same key. Their cohorts are
 * collected onto the single row instead.
 */
export async function getSupervisedLearners(): Promise<LearnerRow[]> {
  const [cohorts, programs] = await Promise.all([
    getCohorts(),
    // A failure here costs the program name, not the learner list.
    getPrograms().catch(() => []),
  ]);
  const programName = new Map(programs.map((p) => [p.id, p.name]));

  const perCohort = await Promise.all(
    cohorts.map(async (cohort) => {
      const detail = await getCohort(cohort.id);
      if (!detail) return [];
      return detail.learners.map((learner) => ({ learner, cohort }));
    })
  );

  const byLearner = new Map<string, LearnerRow>();
  for (const { learner, cohort } of perCohort.flat()) {
    const entry = {
      id: cohort.id,
      name: cohort.name,
      programName: programName.get(cohort.program_id),
    };
    const existing = byLearner.get(learner.id);
    if (existing) {
      existing.cohorts.push(entry);
    } else {
      byLearner.set(learner.id, { ...learner, cohorts: [entry] });
    }
  }

  return [...byLearner.values()].sort((a, b) => {
    const rank = (l: LearnerRow) =>
      l.meanScore !== undefined && l.meanScore < 70 ? 0 : l.sessions === 0 ? 1 : 2;
    return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
  });
}

export type CaseSummary = {
  id: string;
  name: string;
  difficulty?: string;
};

export async function getCohortCases(cohortId: string): Promise<CaseSummary[]> {
  try {
    const data = await apiClient.get(`/cohorts/${cohortId}/cases`);
    return data.cases.map((c: any) => ({
      id: c.id,
      name: c.name,
      difficulty: c.difficulty,
    }));
  } catch (error) {
    console.error(`Failed to fetch cases for cohort ${cohortId}:`, error);
    return [];
  }
}

export type SessionSummary = {
  id: string;
  cohortId: string;
  name: string;
  scheduledAt: string;
  duration: number;
  description?: string;
  status: string;
  createdAt: string;
  caseId?: string;
  caseName?: string;
  /** Same value as `caseName`, under the name the shared session type uses. */
  caseTitle?: string;
  mode: string;
  difficulty?: string;
  design?: string;
  fixation?: string;
  residentCount: number;
  completedCount: number;
};

export function toSessionSummary(s: any): SessionSummary {
  return {
    id: s.id,
    cohortId: s.cohort_id,
    name: s.name,
    scheduledAt: s.scheduled_at,
    duration: s.duration,
    description: s.description ?? undefined,
    status: s.status,
    createdAt: s.created_at,
    caseId: s.case_id ?? undefined,
    caseTitle: s.case_name ?? "Unknown Case",
    caseName: s.case_name ?? undefined,
    mode: s.mode ?? "training",
    difficulty: s.difficulty ?? "beginner",
    design: s.design ?? "CR",
    fixation: s.fixation ?? "cemented",
    residentCount: s.resident_count ?? 0,
    completedCount: s.completed_count ?? 0,
  };
}

export async function getCohortSessions(cohortId: string): Promise<SessionSummary[]> {
  try {
    const data = await apiClient.get(`/cohorts/${cohortId}/sessions`);
    return data.map(toSessionSummary);
  } catch (error) {
    console.error(`Failed to fetch sessions for cohort ${cohortId}:`, error);
    return [];
  }
}

export type SessionResidentSummary = {
  id: string;
  residentId: string;
  displayName: string;
  status: string;
  joinedAt: string;
  completedAt?: string;
};

export async function getSessionRoster(sessionId: string): Promise<SessionResidentSummary[]> {
  try {
    const data = await apiClient.get(`/cohorts/sessions/${sessionId}/residents`);
    return data.residents.map((r: any) => ({
      id: r.id,
      residentId: r.resident_id,
      displayName: r.display_name,
      status: r.status,
      joinedAt: r.joined_at,
      completedAt: r.completed_at ?? undefined,
    }));
  } catch (error) {
    console.error(`Failed to fetch roster for session ${sessionId}:`, error);
    return [];
  }
}