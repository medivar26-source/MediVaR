import { SESSIONS } from "@/lib/seed";
import { categoryAverages, cohortHotspots } from "./rollups";
import type { CategoryAverage, LearnerSummary, SceneHotspot } from "@/lib/types";
import { apiClient } from "@/lib/api-client";

export type CohortSummary = {
  id: string;
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
  cohortId: string;
  cohortName: string;
};

export async function getSupervisedLearners(): Promise<LearnerRow[]> {
  const cohorts = await getCohorts();
  const perCohort = await Promise.all(
    cohorts.map(async (cohort) => {
      const detail = await getCohort(cohort.id);
      if (!detail) return [];
      return detail.learners.map((learner) => ({
        ...learner,
        cohortId: cohort.id,
        cohortName: cohort.name,
      }));
    })
  );

  return perCohort.flat().sort((a, b) => {
    const rank = (l: LearnerRow) =>
      l.meanScore !== undefined && l.meanScore < 70 ? 0 : l.sessions === 0 ? 1 : 2;
    return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
  });
}
