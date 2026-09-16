/**
 * The roll-ups every insight screen shares.
 *
 * Category averages, marks lost, time by scene, weekly activity, cohort
 * hotspots — one implementation each, so the dashboard, `/performance` and a
 * cohort page can never disagree about the same figure. They read the seed in
 * `lib/seed` and reduce it; they hold no data of their own.
 */

import {
  CATEGORY_META,
  PROFILES,
  REPORTS,
  REPORT_BY_SESSION,
  SCENE_RESULTS,
  SESSIONS,
  SESSION_BY_ID,
  SCENE_BY_ID,
  scenesForVariant,
} from "@/lib/seed";
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
export function categoryAverages(sessions: SessionSummary[]): CategoryAverage[] {
  const ids = reported(sessions).map((s) => s.id);

  return CATEGORY_META.flatMap((meta) => {
    const shares = ids.flatMap((id) => {
      const row = REPORT_BY_SESSION.get(id)?.categories.find(
        (c) => c.key === meta.key,
      );
      return row && row.max > 0 ? [(row.score / row.max) * 100] : [];
    });

    const pct = mean(shares);
    if (pct === undefined) return [];
    return [{ key: meta.key, label: meta.label, short: meta.short, pct }];
  });
}

/** Where marks were actually lost, worst scene first. */
export function marksLost(
  sessions: SessionSummary[],
): { scene: string; label: string; points: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of SCENE_RESULTS) {
    if (!ids.has(result.sessionId) || result.outcome === "pass") continue;
    const lost = result.outcome === "fail" ? 3 : 1;
    byScene.set(result.scene, (byScene.get(result.scene) ?? 0) + lost);
  }

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
): { scene: string; label: string; seconds: number; pct: number }[] {
  const ids = new Set(reported(sessions).map((s) => s.id));
  const byScene = new Map<string, number>();

  for (const result of SCENE_RESULTS) {
    if (!ids.has(result.sessionId)) continue;
    const par = SCENE_BY_ID.get(result.scene)?.parTimeS ?? 0;
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

/** Every learner in a cohort, with the figures an instructor screen states. */
export function cohortLearners(cohortId: string): LearnerSummary[] {
  return PROFILES.filter((p) => p.cohortId === cohortId).map((profile) => {
    const mine = SESSIONS.filter((s) => s.userId === profile.id);
    const done = reported(mine);
    const scores = done.map((s) => s.totalScore as number);
    const weakest = [...categoryAverages(mine)].sort((a, b) => a.pct - b.pct)[0];

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
export function cohortHotspots(cohortId: string): SceneHotspot[] {
  const members = new Set(
    PROFILES.filter((p) => p.cohortId === cohortId).map((p) => p.id),
  );
  const sessionOwner = new Map(
    SESSIONS.filter((s) => members.has(s.userId)).map((s) => [s.id, s.userId]),
  );

  const bad = new Map<string, Set<string>>();
  const seen = new Map<string, Set<string>>();

  for (const result of SCENE_RESULTS) {
    const owner = sessionOwner.get(result.sessionId);
    if (!owner) continue;

    if (!seen.has(result.scene)) seen.set(result.scene, new Set());
    seen.get(result.scene)!.add(owner);

    if (result.outcome !== "pass") {
      if (!bad.has(result.scene)) bad.set(result.scene, new Set());
      bad.get(result.scene)!.add(owner);
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
    .sort((a, b) => b.affected - a.affected)
    .slice(0, 6);
}

/** Every scene a session was scheduled to perform, with what it recorded. */
export function sceneRunFor(sessionId: string) {
  const session = SESSION_BY_ID.get(sessionId);
  if (!session) return [];
  return scenesForVariant(session.design, session.fixation);
}

/** Did this score clear the mark in force for its difficulty? */
export function passedOf(session: SessionSummary): boolean | undefined {
  if (session.totalScore === undefined) return undefined;
  return session.totalScore >= PASS_MARK[session.difficulty];
}

export { REPORTS };
