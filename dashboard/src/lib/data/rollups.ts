/**
 * The roll-ups every insight screen shares.
 *
 * Category averages, marks lost, time by scene, weekly activity, cohort
 * hotspots — one implementation each, so the dashboard, `/performance` and a
 * cohort page can never disagree about the same figure. They read the seed in
 * `lib/seed` and reduce it; they hold no data of their own.
 */

import { CATEGORY_META, REPORTS, SCENE_BY_ID, scenesForVariant } from "@/lib/seed";
import { SAMPLE_RESULTS, type ResultsData } from "./results";
import { PASS_MARK, type CategoryAverage, type LearnerSummary, type SceneHotspot, type SessionSummary } from "@/lib/types";

export function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Completed sessions that produced a report. */
export function reported(sessions: SessionSummary[]): SessionSummary[] {
  return sessions.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
}

/**
 * Mean share of each category's marks, as a percentage, across the sessions
 * given. A category no session scored is absent rather than shown as zero.
 */
export function categoryAverages(
  sessions: SessionSummary[],
  data: ResultsData = SAMPLE_RESULTS,
): CategoryAverage[] {
  const ids = reported(sessions).map((s) => s.id);

  return CATEGORY_META.flatMap((meta) => {
    const shares = ids.flatMap((id) => {
      const row = data.reportBySession.get(id)?.categories.find(
        (c) => c.key === meta.key,
      );
      return row && row.max > 0 ? [(row.score / row.max) * 100] : [];
    });

    const pct = mean(shares);
    if (pct === undefined) return [];
    return [{ key: meta.key, label: meta.label, short: meta.short, pct }];
  });
}

/**
 * Where marks were actually lost, worst scene first. A stored report says exactly how many marks each
 * scene lost; a sample report only has the outcome, so it counts 3 for a fail and 1 for a borderline.
 */
export function marksLost(
  sessions: SessionSummary[],
  data: ResultsData = SAMPLE_RESULTS,
): { scene: string; label: string; points: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of data.sceneResults) {
    if (!ids.has(result.sessionId) || result.outcome === "pass") continue;
    const lost = result.pointsLost ?? (result.outcome === "fail" ? 3 : 1);
    byScene.set(result.scene, (byScene.get(result.scene) ?? 0) + lost);
  }
  for (const [scene, points] of byScene) byScene.set(scene, Math.round(points * 10) / 10);

  const total = [...byScene.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];

  return [...byScene.entries()]
    .map(([scene, points]) => ({
      scene,
      label: SCENE_BY_ID.get(scene)?.name ?? scene,
      points,
      pct: Math.round((points / total) * 100),
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 6);
}

/**
 * Where the time went, per scene.
 *
 * Seconds over par, not raw duration: a scene that is simply long is not the
 * same finding as one that ran over, and only the second is worth a row.
 */
export function timeByScene(
  sessions: SessionSummary[],
  data: ResultsData = SAMPLE_RESULTS,
): { scene: string; label: string; seconds: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of data.sceneResults) {
    if (!ids.has(result.sessionId)) continue;
    const par = result.parS ?? SCENE_BY_ID.get(result.scene)?.parTimeS ?? 0;
    const over = Math.max(0, result.durationS - par);
    if (over > 0) byScene.set(result.scene, (byScene.get(result.scene) ?? 0) + over);
  }

  const total = [...byScene.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];

  return [...byScene.entries()]
    .map(([scene, seconds]) => ({
      scene,
      label: SCENE_BY_ID.get(scene)?.name ?? scene,
      seconds,
      pct: Math.round((seconds / total) * 100),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 6);
}

const WEEK_MS = 7 * 86_400_000;

/** Sessions and mean score per week, oldest week first. */
export function weeklyActivity(
  sessions: SessionSummary[],
  weeks: number,
): { label: string; sessions: number; mean: number }[] {
  const now = Date.now();
  const out: { label: string; sessions: number; mean: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const end = now - i * WEEK_MS;
    const start = end - WEEK_MS;

    const inWeek = sessions.filter((s) => {
      const at = Date.parse(s.startedAt ?? "");
      return Number.isFinite(at) && at >= start && at < end;
    });

    const scores = inWeek
      .map((s) => s.totalScore)
      .filter((n): n is number => n !== undefined);

    out.push({
      label: i === 0 ? "This week" : `${i}w ago`,
      sessions: inWeek.length,
      mean: mean(scores) ?? 0,
    });
  }

  return out;
}

/**
 * Every learner in a cohort, with the figures an instructor screen states. With no cohort, every learner
 * the data holds (for an instructor: everyone in any cohort they own).
 */
export function cohortLearners(
  cohortId: string | undefined,
  data: ResultsData = SAMPLE_RESULTS,
): LearnerSummary[] {
  return data.profiles.filter((p) => !cohortId || p.cohortId === cohortId).map((profile) => {
    const mine = data.sessions.filter((s) => s.userId === profile.id);
    const done = reported(mine);
    const scores = done.map((s) => s.totalScore as number);
    const weakest = [...categoryAverages(mine, data)].sort((a, b) => a.pct - b.pct)[0];

    return {
      id: profile.id,
      displayName: profile.displayName,
      role: profile.role,
      sessions: mine.length,
      assessments: mine.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      criticalErrors: mine.reduce((a, s) => a + s.criticalErrors, 0),
      weakestCategory: weakest?.label,
      lastActiveAt: profile.lastActiveAt,
    };
  });
}

/**
 * Scenes the cohort struggles with, worst first.
 *
 * `affected` counts learners who closed the scene below a pass, not attempts —
 * one learner failing a scene five times is one person to talk to, not five.
 */
export function cohortHotspots(
  cohortId: string | undefined,
  data: ResultsData = SAMPLE_RESULTS,
): SceneHotspot[] {
  const members = new Set(
    data.profiles.filter((p) => !cohortId || p.cohortId === cohortId).map((p) => p.id),
  );
  const sessionOwner = new Map(
    data.sessions.filter((s) => members.has(s.userId)).map((s) => [s.id, s.userId]),
  );

  const bad = new Map<string, Set<string>>();
  const seen = new Map<string, Set<string>>();
  // How often the scene went wrong, fails counting double: orders scenes that the same number of
  // learners struggled with, so the one they struggle with most comes first.
  const weight = new Map<string, number>();

  for (const result of data.sceneResults) {
    const owner = sessionOwner.get(result.sessionId);
    if (!owner) continue;

    if (!seen.has(result.scene)) seen.set(result.scene, new Set());
    seen.get(result.scene)!.add(owner);

    if (result.outcome !== "pass") {
      if (!bad.has(result.scene)) bad.set(result.scene, new Set());
      bad.get(result.scene)!.add(owner);
      weight.set(result.scene, (weight.get(result.scene) ?? 0) + (result.outcome === "fail" ? 2 : 1));
    }
  }

  return [...bad.entries()]
    .map(([scene, learners]) => {
      const total = seen.get(scene)?.size ?? learners.size;
      const share = learners.size / (total || 1);
      return {
        scene,
        label: SCENE_BY_ID.get(scene)?.name ?? scene,
        affected: learners.size,
        learners: total,
        severity: (share >= 0.5 ? "fail" : share >= 0.25 ? "borderline" : "pass") as SceneHotspot["severity"],
      };
    })
    .sort((a, b) => b.affected - a.affected || (weight.get(b.scene) ?? 0) - (weight.get(a.scene) ?? 0))
    .slice(0, 6);
}

/** Every scene a session was scheduled to perform, with what it recorded. */
export function sceneRunFor(sessionId: string, data: ResultsData = SAMPLE_RESULTS) {
  const session = data.sessionById.get(sessionId);
  if (!session) return [];
  return scenesForVariant(session.design, session.fixation);
}

/**
 * Did this run pass? A stored report's own verdict first (it was marked against the pass mark in force, and
 * a capped run fails whatever its marks); a sample run is judged against today's pass mark.
 */
export function passedOf(session: SessionSummary): boolean | undefined {
  if (session.totalScore === undefined) return undefined;
  if (session.passed !== undefined) return session.passed;
  return session.totalScore >= PASS_MARK[session.difficulty];
}

export { REPORTS };
