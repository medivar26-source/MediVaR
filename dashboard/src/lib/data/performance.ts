/**
 * Accessors for performance, skills, assessments, activity, reports.
 *
 * Same contract as every other `lib/data` module: pages await typed shapes and
 * every mean and caption is computed here, never in a component.
 *
 * One honesty ruling worth stating once: a learner's own rows are not a cohort.
 * A "cohort median" drawn from them on a learner's screen would be their own
 * value wearing a costume. The comparison a learner does get is
 * the per-session percentile, and nothing here fakes the rest.
 */

import {
  CASE_BY_ID,
  CATEGORY_BY_KEY,
  PROCEDURES,
  PROFILE_BY_ID,
  REPORT_BY_SESSION,
  SCENES,
  sceneResultsFor,
  sessionsFor,
} from "@/lib/seed";
import { categoryAverages, marksLost as marksLostFor, weeklyActivity } from "./rollups";
import { visibleSessions } from "./scope";
import { slugForCategory } from "@/lib/skills";
import { shortDate } from "@/lib/format";
import type { SessionSummary, Verdict } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const passed = (s: SessionSummary) =>
  s.totalScore !== undefined && s.totalScore >= PASS_MARK[s.difficulty];

/* ============================================================
   /performance
   ============================================================ */

export type PerformanceOverview = {
  stats: {
    completed: number;
    assessments: number;
    meanScore?: number;
    bestScore?: number;
    bestDate?: string;
    totalTimeS: number;
    meanTimeS?: number;
    passRate?: number;
    criticalErrors: number;
  };
  /** The last ten completed sessions, oldest first, for the bar chart. */
  lastScores: { label: string; value: number }[];
  /** Text equivalent, written beside the numbers */
  lastScoresCaption: string;
  categories: {
    key: string;
    slug?: string;
    label: string;
    short: string;
    pct: number;
  }[];
  weakest?: { label: string; pct: number };
  strongest?: { label: string; pct: number };
  procedures: {
    id: string;
    name: string;
    status: string;
    tagline?: string;
    sessions: number;
    best?: number;
    latest?: number;
  }[];
  history: SessionSummary[];
};

export async function getPerformanceOverview(
  userId: string,
): Promise<PerformanceOverview> {
  const mine = sessionsFor(userId);
  const completed = mine.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );

  const byDate = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  );
  const scores = byDate.map((s) => s.totalScore as number);
  const best = scores.length ? Math.max(...scores) : undefined;
  const bestSession = byDate.find((s) => s.totalScore === best);
  const passCount = completed.filter(passed).length;
  const totalTimeS = completed.reduce((a, s) => a + (s.durationS ?? 0), 0);

  const lastTen = byDate.slice(-10);
  const belowPass = lastTen.filter((s) => !passed(s));
  const lastScoresCaption = lastTen.length
    ? `Last ${lastTen.length} completed scores, oldest first: ${lastTen
        .map((s) => s.totalScore)
        .join(", ")}. ${
        belowPass.length === 0
          ? "All at or above their pass mark."
          : `${belowPass.length} below the pass mark for their difficulty.`
      } Pass marks — Beginner 60 · Intermediate 70 · Expert 80.`
    : "No completed sessions yet.";

  const categories = categoryAverages(mine).map((c) => ({
    key: c.key,
    slug: slugForCategory(c.key),
    label: c.label,
    short: c.short,
    pct: c.pct,
  }));
  const rankedCats = [...categories].sort((a, b) => a.pct - b.pct);

  const procedures = PROCEDURES.map((p) => {
    const runs = completed.filter(
      (s) => CASE_BY_ID.get(s.caseId)?.procedureId === p.id,
    );
    const runScores = runs.map((s) => s.totalScore as number);
    const latest = [...runs].sort((a, b) =>
      (b.endedAt ?? "").localeCompare(a.endedAt ?? ""),
    )[0];
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      tagline: p.tagline,
      sessions: runs.length,
      best: runScores.length ? Math.max(...runScores) : undefined,
      latest: latest?.totalScore,
    };
  });

  return {
    stats: {
      completed: completed.length,
      assessments: completed.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      bestScore: best,
      bestDate: bestSession?.endedAt,
      totalTimeS,
      meanTimeS: completed.length
        ? Math.round(totalTimeS / completed.length)
        : undefined,
      passRate: completed.length
        ? Math.round((passCount / completed.length) * 100)
        : undefined,
      criticalErrors: completed.reduce((a, s) => a + s.criticalErrors, 0),
    },
    lastScores: lastTen.map((s) => ({
      label: shortDate(s.endedAt),
      value: s.totalScore as number,
    })),
    lastScoresCaption,
    categories,
    weakest: rankedCats[0],
    strongest: rankedCats[rankedCats.length - 1],
    procedures,
    history: mine,
  };
}

/* ============================================================
   /performance/[skill]
   ============================================================ */

export type SkillScene = {
  scene: string;
  label: string;
  part: string;
  isCritical: boolean;
  parTimeS: number;
  attempts: number;
  outcomes: Record<Verdict, number>;
  lastOutcome?: Verdict;
  meanDurationS?: number;
};

export type SkillDetail = {
  key: string;
  label: string;
  short: string;
  max: number;
  /** The learner's average for this category, from their reports. */
  pct?: number;
  scenes: SkillScene[];
  /** Marks lost in this category's scenes, largest first. */
  marksLost: { scene: string; label: string; points: number }[];
  caption: string;
};

export async function getSkillDetail(
  userId: string,
  categoryKey: string,
): Promise<SkillDetail | null> {
  const meta = CATEGORY_BY_KEY.get(categoryKey);
  if (!meta) return null;

  const mine = sessionsFor(userId).filter((s) => s.status === "completed");
  const categoryScenes = SCENES.filter((s) => s.categoryKey === categoryKey);
  const sceneIds = new Set(categoryScenes.map((s) => s.scene));

  // Every result this learner recorded in one of this category's scenes,
  // oldest first, so `lastOutcome` is genuinely the last one.
  const results = mine
    .slice()
    .reverse()
    .flatMap((session) =>
      sceneResultsFor(session.id)
        .filter((r) => sceneIds.has(r.scene))
        .map((r) => ({ ...r, at: session.endedAt ?? "" })),
    );

  const scenes: SkillScene[] = categoryScenes.map((s) => {
    const mineHere = results.filter((r) => r.scene === s.scene);
    const outcomes: Record<Verdict, number> = { pass: 0, borderline: 0, fail: 0 };
    const durations: number[] = [];
    for (const r of mineHere) {
      outcomes[r.outcome] += 1;
      durations.push(r.durationS);
    }
    return {
      scene: s.scene,
      label: s.name,
      part: s.part,
      isCritical: s.isCritical,
      parTimeS: s.parTimeS,
      attempts: mineHere.length,
      outcomes,
      lastOutcome: mineHere[mineHere.length - 1]?.outcome,
      meanDurationS: durations.length ? mean(durations) : undefined,
    };
  });

  const pct = categoryAverages(mine).find((c) => c.key === categoryKey)?.pct;
  const marksLost = marksLostFor(mine)
    .filter((m) => sceneIds.has(m.scene))
    .map((m) => ({ scene: m.scene, label: m.label, points: m.points }));

  const attempted = scenes.filter((s) => s.attempts > 0);
  const struggling = scenes.filter(
    (s) => s.outcomes.fail + s.outcomes.borderline > 0,
  );
  const caption =
    attempted.length === 0
      ? `None of the ${scenes.length} scenes in this category have been attempted yet.`
      : `${attempted.length} of ${scenes.length} scenes attempted. ${
          struggling.length === 0
            ? "Every attempt passed."
            : `Marks are being lost in ${struggling
                .map((s) => `${s.scene} (${s.label})`)
                .join(", ")}.`
        }`;

  return {
    key: meta.key,
    label: meta.label,
    short: meta.short,
    max: meta.max,
    pct,
    scenes,
    marksLost,
    caption,
  };
}

/* ============================================================
   /assessments
   ============================================================ */

export type AssessmentsView = {
  stats: {
    taken: number;
    passed: number;
    passRate?: number;
    meanScore?: number;
    criticalErrors: number;
    firstDate?: string;
  };
  sessions: SessionSummary[];
  /** A session capped by three critical errors, if any — the banner names it. */
  capped?: SessionSummary;
};

export async function getAssessments(userId: string): Promise<AssessmentsView> {
  const sessions = sessionsFor(userId).filter((s) => s.mode === "assessment");
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
  const passCount = completed.filter(passed).length;
  const scores = completed.map((s) => s.totalScore as number);
  const first = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  )[0];

  return {
    stats: {
      taken: completed.length,
      passed: passCount,
      passRate: completed.length
        ? Math.round((passCount / completed.length) * 100)
        : undefined,
      meanScore: mean(scores),
      criticalErrors: completed.reduce((a, s) => a + s.criticalErrors, 0),
      firstDate: first?.endedAt,
    },
    sessions,
    capped: completed.find((s) => s.criticalErrors >= 3),
  };
}

/* ============================================================
   /reports
   ============================================================ */

export type ReportRow = SessionSummary & {
  reportGeneratedAt: string;
  /** Present when the viewer may read the learner's profile — instructors and admins. */
  learnerName?: string;
};

/**
 * Every generated report this viewer may see, newest first. The scope comes
 * from `./scope` — one answer, shared with the session list, so the two screens
 * cannot disagree about what the viewer is allowed to read.
 */
export async function getReportsList(): Promise<ReportRow[]> {
  return visibleSessions()
    .filter((session) => REPORT_BY_SESSION.has(session.id))
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))
    .map((session) => ({
      ...session,
      reportGeneratedAt: REPORT_BY_SESSION.get(session.id)!.generatedAt,
      learnerName: PROFILE_BY_ID.get(session.userId)?.displayName,
    }));
}

/* ============================================================
   /activity
   ============================================================ */

export type ActivityDay = {
  /** "20 May 2026" — the grouping key and the heading. */
  day: string;
  sessions: SessionSummary[];
};

export type ActivityView = {
  weekly: { label: string; sessions: number; mean: number }[];
  weeklyCaption: string;
  days: ActivityDay[];
  totals: { sessions: number; completed: number; timeS: number };
};

export async function getActivity(
  userId: string,
  weeks = 12,
): Promise<ActivityView> {
  const mine = sessionsFor(userId).slice(0, 60);
  const weekly = weeklyActivity(mine, weeks);
  const active = weekly.filter((w) => w.sessions > 0);
  const weeklyCaption = active.length
    ? `Sessions per week over the last ${weeks} weeks: ${weekly
        .map((w) => w.sessions)
        .join(", ")}. Busiest week ${
        [...active].sort((a, b) => b.sessions - a.sessions)[0].label
      }.`
    : `No sessions in the last ${weeks} weeks.`;

  const sessions = mine;
  const days: ActivityDay[] = [];
  for (const session of sessions) {
    const day = shortDate(session.startedAt);
    const last = days[days.length - 1];
    if (last && last.day === day) last.sessions.push(session);
    else days.push({ day, sessions: [session] });
  }

  const completed = sessions.filter((s) => s.status === "completed");
  return {
    weekly,
    weeklyCaption,
    days,
    totals: {
      sessions: sessions.length,
      completed: completed.length,
      timeS: completed.reduce((a, s) => a + (s.durationS ?? 0), 0),
    },
  };
}
