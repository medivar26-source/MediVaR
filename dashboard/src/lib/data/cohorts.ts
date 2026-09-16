/**
 * `/cohorts`, `/cohorts/[id]` and `/cohorts/learners`.
 *
 * Scope is one answer shared with `/sessions` and `/reports`: the cohorts you
 * own, the one you are in, or all of them if you are an administrator. There is
 * no `role === 'admin'` branch here, because a second implementation of the
 * boundary is the one that goes wrong.
 */

import { COHORTS, PROFILE_BY_ID, SESSIONS } from "@/lib/seed";
import { categoryAverages, cohortHotspots, cohortLearners, mean } from "./rollups";
import type { CategoryAverage, LearnerSummary, SceneHotspot } from "@/lib/types";

export type PresetSummary = {
  id: string;
  name: string;
  caseId?: string;
  ownerId: string;
  createdAt: string;
  /** Human-readable lines derived from `overrides`'s shape. */
  effects: string[];
  /** Cohorts currently assigned this preset. Empty means it changes nothing. */
  assignedTo: { id: string; name: string }[];
  /** Plans stamped with it, which is the only measure of whether it was used. */
  plans: number;
};

export type CohortSummary = {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  learners: number;
  /** Undefined when nobody in the cohort has a scored report yet. */
  meanScore?: number;
  belowPass: number;
  presetId?: string;
  presetName?: string;
};

export type CohortDetail = {
  cohort: CohortSummary;
  learners: LearnerSummary[];
  categories: CategoryAverage[];
  hotspots: SceneHotspot[];
  /** Every preset the viewer could assign — theirs, or all if an admin. */
  presets: PresetSummary[];
};

/* ─────────────────────────── presets ─────────────────────────── */

/**
 * Configuration presets.
 *
 * Nothing authors one yet — the screen that would is not built — so this is
 * empty for everybody and the panel on a cohort draws its own empty state
 * rather than a list of preset names nobody saved.
 */
export async function getPresets(): Promise<PresetSummary[]> {
  return [];
}

export async function getPreset(id: string): Promise<PresetSummary | null> {
  const presets = await getPresets();
  return presets.find((p) => p.id === id) ?? null;
}

/* ─────────────────────────── cohorts ─────────────────────────── */

export async function getCohorts(): Promise<CohortSummary[]> {
  return [...COHORTS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => {
      const learners = cohortLearners(row.id);
      const scored = learners.filter((l) => l.meanScore !== undefined);

      return {
        id: row.id,
        name: row.name,
        ownerId: row.ownerId,
        ownerName: PROFILE_BY_ID.get(row.ownerId)?.displayName,
        createdAt: row.createdAt,
        learners: learners.length,
        meanScore: mean(scored.map((l) => l.meanScore as number)),
        // Against the intermediate pass mark, which is what the instructor
        // dashboard already uses for a cohort figure — a per-learner mark would
        // need each learner's own difficulty mix and is answered on their page.
        belowPass: scored.filter((l) => (l.meanScore as number) < 70).length,
        presetId: undefined,
        presetName: undefined,
      };
    });
}

export async function getCohort(id: string): Promise<CohortDetail | null> {
  const cohorts = await getCohorts();
  const cohort = cohorts.find((c) => c.id === id);
  if (!cohort) return null;

  const learners = cohortLearners(id);
  const memberIds = new Set(learners.map((l) => l.id));

  return {
    cohort,
    learners,
    categories: categoryAverages(
      SESSIONS.filter((s) => memberIds.has(s.userId)),
    ),
    hotspots: cohortHotspots(id),
    presets: await getPresets(),
  };
}

/* ─────────────────────────── invites ─────────────────────────── */

export type InviteSummary = {
  id: string;
  label?: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number;
  used: number;
  /** What the instructor needs to know before they send it again. */
  state: "open" | "expired" | "exhausted" | "revoked";
  /** Who has joined through it. Names, because a count answers nothing. */
  joiners: { id: string; name: string; at: string }[];
};

/**
 * The join links for a cohort, and who followed each one.
 *
 * There is no `token_hash` here and there could not be: the column is never
 * selected.
 * Redemption is by hash, so reading one would be holding the link.
 *
 * `used` is `redemptions.length` rather than a column. The table is the record
 * and a counter beside it would be a second answer that can drift from it.
 */
export async function getInvites(cohortId: string): Promise<InviteSummary[]> {
  void cohortId;
  // Minting and redeeming a join link both need a service behind them. Until
  // one exists there are no invites to list, and the panel says so rather than
  // showing a link that could never be followed.
  return [];
}

export type LearnerRow = LearnerSummary & {
  cohortId: string;
  cohortName: string;
};

/** Every learner the viewer supervises, flattened across their cohorts. */
export async function getSupervisedLearners(): Promise<LearnerRow[]> {
  const cohorts = await getCohorts();

  const perCohort = cohorts.map((cohort) =>
    cohortLearners(cohort.id).map((learner) => ({
      ...learner,
      cohortId: cohort.id,
      cohortName: cohort.name,
    })),
  );

  return perCohort.flat().sort((a, b) => {
    // Below the pass mark first, then never-active, then by name. The order the
    // instructor dashboard's attention list already uses.
    const rank = (l: LearnerRow) =>
      l.meanScore !== undefined && l.meanScore < 70 ? 0 : l.sessions === 0 ? 1 : 2;
    return rank(a) - rank(b) || a.displayName.localeCompare(b.displayName);
  });
}
