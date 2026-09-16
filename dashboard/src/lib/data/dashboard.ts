/**
 * Dashboard data accessors.
 *
 * Every function is async and returns a typed shape, so the screens above them
 * never learn where a row came from — the point of the seam, and the reason a
 * data source can change underneath without touching a component.
 *
 * The derived shapes — category averages, hotspots, marks lost, weekly
 * activity — are not computed here. They come from `./rollups`, which holds one
 * implementation of each so that two screens cannot state the same figure
 * differently.
 */

import {
  CASES,
  COHORTS,
  REPORT_BY_SESSION,
  SESSIONS,
  sessionsFor,
} from "@/lib/seed";
import {
  categoryAverages,
  cohortHotspots,
  cohortLearners,
  marksLost,
  timeByScene,
  weeklyActivity,
} from "./rollups";
import type {
  CaseSummary,
  CategoryAverage,
  Cohort,
  LearnerSummary,
  ReportSummary,
  SceneHotspot,
  ScorePoint,
  SessionSummary,
} from "@/lib/types";
import { PASS_MARK } from "@/lib/types";

/** P0 … P11 — twelve groupings, eleven intervals between first and last. */
const TOTAL_PART_INTERVALS = 11;

/** "6.1" -> 6. Returns null for anything unparseable. */
function partFromScene(scene?: string): number | null {
  if (!scene) return null;
  const n = Number.parseInt(scene.split(".")[0], 10);
  return Number.isFinite(n) ? n : null;
}

function mean(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export type SessionDetail = {
  session: SessionSummary;
  highlights: string[];
  categories: { key: string; label: string; score: number; max: number }[];
};

export type TrendSeries = {
  values: number[];
  compare: number[];
  labels: string[];
  /** Text equivalent Written here, never in JSX. */
  caption: string;
};

/* ============================================================
   Learner dashboard
   ============================================================ */

export type LearnerDashboard = {
  stats: {
    sessionsCompleted: number;
    assessments: number;
    meanScore?: number;
    bestScore?: number;
    criticalErrors: number;
    totalTimeS: number;
    /** Percentage-point change against the previous run. */
    latestDelta?: number;
    passRate: number;
  };
  activeSession?: {
    state: "live" | "interrupted";
    session: SessionSummary;
    /** Seconds at render time. The dial ticks on from here when live. */
    elapsedS: number;
    /** 0–1 through the procedure, from the current part. */
    progress: number;
  };
  latestReport?: { session: SessionSummary; report: ReportSummary };
  /** Where the time actually went, per scene. Not an overrun — see the schema. */
  timeLost: { scene: string; label: string; seconds: number; pct: number }[];
  trend: ScorePoint[];
  dynamic: TrendSeries;
  weekly: { label: string; sessions: number; mean: number }[];
  marksLost: { scene: string; label: string; points: number; pct: number }[];
  categories: CategoryAverage[];
  weakest?: CategoryAverage;
  details: SessionDetail[];
  suggestedCases: CaseSummary[];
};

export async function getLearnerDashboard(
  userId: string,
  weeks = 7,
): Promise<LearnerDashboard> {
  const now = Date.now();

  const mine = sessionsFor(userId);
  const completed = mine.filter(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );

  const byDate = [...completed].sort((a, b) =>
    (a.endedAt ?? "").localeCompare(b.endedAt ?? ""),
  );
  const scores = byDate.map((s) => s.totalScore as number);

  const latest = byDate[byDate.length - 1];
  const previous = byDate[byDate.length - 2];

  const passed = completed.filter(
    (s) => (s.totalScore ?? 0) >= PASS_MARK[s.difficulty],
  ).length;

  const categories = categoryAverages(mine);
  const weakest = [...categories].sort((a, b) => a.pct - b.pct)[0];

  // The four most recent completed sessions, with their category breakdown.
  const details: SessionDetail[] = [...completed]
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""))
    .slice(0, 4)
    .map((session) => ({
      session,
      highlights: highlightsFor(session, scores),
      categories: REPORT_BY_SESSION.get(session.id)?.categories ?? [],
    }));

  const weekly = weeklyActivity(mine, weeks);
  const cohortMeans = weeklyActivity(SESSIONS, weeks).map((w) => w.mean);
  const values = weekly.map((w) => w.mean);

  const attemptedCases = new Set(mine.map((s) => s.caseId));
  const latestReportRow = latest ? REPORT_BY_SESSION.get(latest.id) : undefined;

  return {
    stats: {
      sessionsCompleted: completed.length,
      assessments: mine.filter((s) => s.mode === "assessment").length,
      meanScore: mean(scores),
      bestScore: scores.length ? Math.max(...scores) : undefined,
      criticalErrors: mine.reduce((a, s) => a + s.criticalErrors, 0),
      totalTimeS: mine.reduce((a, s) => a + (s.durationS ?? 0), 0),
      latestDelta:
        latest?.totalScore !== undefined && previous?.totalScore !== undefined
          ? latest.totalScore - previous.totalScore
          : undefined,
      passRate: completed.length
        ? Math.round((passed / completed.length) * 100)
        : 0,
    },
    activeSession: (() => {
      const liveSession = mine.find((s) => s.status === "live");
      const session = liveSession ?? mine.find((s) => s.status === "aborted");
      if (!session) return undefined;
      const part = partFromScene(session.currentScene);
      const elapsedS = liveSession
        ? session.startedAt
          ? Math.max(0, Math.floor((now - Date.parse(session.startedAt)) / 1000))
          : 0
        : (session.durationS ?? 0);
      return {
        state: liveSession ? ("live" as const) : ("interrupted" as const),
        session,
        elapsedS,
        progress: part === null ? 0 : part / TOTAL_PART_INTERVALS,
      };
    })(),
    latestReport:
      latest && latestReportRow
        ? {
            session: latest,
            report: {
              sessionId: latestReportRow.sessionId,
              totalScore: latestReportRow.totalScore,
              max: latestReportRow.max,
              percentile: latestReportRow.percentile,
              categories: latestReportRow.categories,
              generatedAt: latestReportRow.generatedAt,
            },
          }
        : undefined,
    timeLost: timeByScene(mine),
    trend: byDate.map((s) => ({
      sessionId: s.id,
      date: s.endedAt ?? "",
      score: s.totalScore as number,
      difficulty: s.difficulty,
    })),
    dynamic: {
      values,
      compare: cohortMeans,
      labels: weekly.map((w) => w.label),
      caption: trendCaption(values, cohortMeans, "Your weekly mean"),
    },
    weekly,
    marksLost: marksLost(mine),
    categories,
    weakest,
    details,
    suggestedCases: CASES.filter(
      (c) => c.isActive && !attemptedCases.has(c.id),
    )
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        title: row.title,
        procedure: row.procedureId,
        pathology: row.pathology,
        side: row.side,
        difficulty: row.difficulty,
        isActive: row.isActive,
        attempts: 0,
      })),
  };
}

/**
 * Achievements shown as chips on an expanded session row. Derived from the
 * session itself — a claim on the dashboard has to be traceable to a row.
 */
function highlightsFor(session: SessionSummary, allScores: number[]): string[] {
  const out: string[] = [];
  const best = allScores.length ? Math.max(...allScores) : undefined;
  if (session.totalScore !== undefined && session.totalScore === best) {
    out.push("Personal best");
  }
  if (session.criticalErrors === 0) out.push("No critical errors");
  if ((session.totalScore ?? 0) >= PASS_MARK[session.difficulty]) {
    out.push("Above pass mark");
  }
  if (session.difficulty === "expert") out.push("Expert difficulty");
  return out;
}

/** One sentence describing a two-series trend, for the chart's text equivalent. */
function trendCaption(
  values: number[],
  compare: number[],
  what: string,
): string {
  const real = values.filter((v) => v > 0);
  if (real.length < 2) return `${what}: not enough completed sessions to plot a trend yet.`;

  const first = real[0];
  const last = real[real.length - 1];
  const direction = last > first ? "rose" : last < first ? "fell" : "held at";
  const span = `${values.length} weeks`;

  const comparable = compare.filter((v) => v > 0);
  const tail =
    comparable.length === 0
      ? " No cohort comparison is available."
      : ` The cohort mean over the same period ended at ${comparable[comparable.length - 1]}.`;

  return `${what} ${direction} from ${first} to ${last} over ${span}.${tail}`;
}

/* ============================================================
   Instructor dashboard
   ============================================================ */

export type InstructorDashboard = {
  cohort?: Cohort;
  stats: {
    learners: number;
    meanScore: number;
    belowPassMark: number;
    sessionsThisWeek: number;
    criticalErrors: number;
    meanDelta: number;
  };
  needsAttention: {
    learner: LearnerSummary;
    reason: string;
    severity: "warn" | "fail";
  }[];
  learners: LearnerSummary[];
  hotspots: SceneHotspot[];
  categories: CategoryAverage[];
  weekly: { label: string; sessions: number; mean: number }[];
  dynamic: TrendSeries;
  bands: { label: string; value: number; pct: number }[];
};

const INACTIVE_DAYS = 14;

export async function getInstructorDashboard(
  ownerId: string,
  weeks = 7,
): Promise<InstructorDashboard> {
  const now = Date.now();

  const owned = COHORTS.filter((c) => c.ownerId === ownerId).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const cohort: Cohort | undefined = owned[0];

  const weekAgo = now - 7 * 86_400_000;

  // An instructor with no cohort yet is a real state — the screen renders its
  // empty shape rather than erroring or inventing a group.
  const learners: LearnerSummary[] = cohort ? cohortLearners(cohort.id) : [];
  const hotspots: SceneHotspot[] = cohort ? cohortHotspots(cohort.id) : [];
  const cohortCategories: CategoryAverage[] = cohort
    ? categoryAverages(
        SESSIONS.filter((s) => learners.some((l) => l.id === s.userId)),
      )
    : [];

  const weekRows = weeklyActivity(SESSIONS, weeks);
  const sessionsThisWeek = SESSIONS.filter((s) => {
    const at = Date.parse(s.startedAt ?? "");
    return Number.isFinite(at) && at >= weekAgo;
  }).length;

  const scored = learners.filter((l) => l.meanScore !== undefined);
  const passMark = PASS_MARK.intermediate;

  const needsAttention = learners
    .map((learner) => {
      if (learner.meanScore !== undefined && learner.meanScore < passMark) {
        return {
          learner,
          reason: `Mean score ${learner.meanScore} is below the pass mark of ${passMark}. ${learner.criticalErrors} critical errors logged.`,
          severity: "fail" as const,
        };
      }
      const idleDays = learner.lastActiveAt
        ? Math.floor((now - Date.parse(learner.lastActiveAt)) / 86_400_000)
        : Infinity;
      if (idleDays >= INACTIVE_DAYS) {
        return {
          learner,
          reason: `No activity for ${Number.isFinite(idleDays) ? idleDays : "over 30"} days. ${learner.assessments} assessments completed.`,
          severity: "warn" as const,
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort(
      (a, b) => (a.severity === "fail" ? 0 : 1) - (b.severity === "fail" ? 0 : 1),
    );

  const weekly = weekRows;
  const values = weekly.map((w) => w.mean);

  const strong = scored.filter((l) => (l.meanScore as number) >= 80).length;
  const okay = scored.filter(
    (l) => (l.meanScore as number) >= passMark && (l.meanScore as number) < 80,
  ).length;
  const below = scored.filter((l) => (l.meanScore as number) < passMark).length;
  const noData = learners.length - scored.length;
  const total = learners.length || 1;
  const pct = (n: number) => Math.round((n / total) * 100);

  const meanScore =
    mean(scored.map((l) => l.meanScore as number)) ?? 0;

  // Change in the cohort mean between the first and last week that had data.
  const plotted = values.filter((v) => v > 0);
  const meanDelta =
    plotted.length >= 2 ? plotted[plotted.length - 1] - plotted[0] : 0;

  return {
    cohort,
    stats: {
      learners: learners.length,
      meanScore,
      belowPassMark: below,
      sessionsThisWeek,
      criticalErrors: learners.reduce((a, l) => a + l.criticalErrors, 0),
      meanDelta,
    },
    needsAttention,
    learners: [...learners].sort((a, b) => (b.meanScore ?? 0) - (a.meanScore ?? 0)),
    hotspots,
    categories: cohortCategories,
    weekly,
    dynamic: {
      values,
      compare: [],
      labels: weekly.map((w) => w.label),
      caption: trendCaption(values, [], "The cohort's weekly mean"),
    },
    bands: [
      { label: "Strong (80+)", value: strong, pct: pct(strong) },
      { label: `Passing (${passMark}–79)`, value: okay, pct: pct(okay) },
      { label: `Below ${passMark}`, value: below, pct: pct(below) },
      { label: "No data", value: noData, pct: pct(noData) },
    ],
  };
}
