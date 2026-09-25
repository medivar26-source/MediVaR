import { SESSIONS } from "@/lib/seed";
import { categoryAverages, cohortHotspots } from "./rollups";
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
    const data = await apiClient.get('/cohorts');
    return data.map((c: any) => ({
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
    }));
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
    
    const learners = data.learners.map((l: any) => ({
      id: l.id,
      displayName: l.display_name,
      role: l.role,
      sessions: l.sessions,
      assessments: l.assessments,
      meanScore: l.mean_score !== null ? l.mean_score : undefined,
      criticalErrors: l.critical_errors,
      weakestCategory: l.weakest_category,
      lastActiveAt: l.last_active_at,
      joinedAt: l.joined_at,
    }));
    
    // We still use SESSIONS seeded data for now for categories/hotspots since they are complex aggregations
    // and SESSIONS mock is still intact. But we only use SESSIONS belonging to these learners.
    const memberIds = new Set(learners.map((l: any) => l.id));

    return {
      cohort,
      learners,
      categories: categoryAverages(SESSIONS.filter((s) => memberIds.has(s.userId))),
      hotspots: cohortHotspots(id),
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
