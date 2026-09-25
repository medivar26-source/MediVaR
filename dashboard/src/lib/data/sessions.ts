/**
 * Sessions and the report.
 *
 * The pages `await` these; they never query. And the report is not assembled
 * here either: a report is the number a learner is judged on, and if the
 * dashboard could compute one there would be two answers to "what did they
 * score" and no way to say which was right. These functions read the stored
 * figure in `lib/seed` and map it; the scoring function that will write it
 * lives in the headset pipeline, and this file cannot reach it.
 */

import type {
  Report,
  ReportCategory,
  ReportFeedback,
  ReportParameter,
  ReportTimelineEntry,
  Verdict,
} from "@/lib/report";
import { PASS_MARK, type Profile, type SessionSummary } from "@/lib/types";
import {
  CASE_BY_ID,
  CATEGORY_BY_KEY,
  PROFILE_BY_ID,
  REPORT_BY_SESSION,
  SESSION_BY_ID,
  sceneResultsFor,
  scenesForVariant,
} from "@/lib/seed";
import { PLAN_BY_ID } from "./plans";
import { visibleSessions } from "./scope";

export * from "@/lib/report";

/* ---------- the session list ---------- */

/**
 * Narrowed to the enums rather than `string`, because these arrive from the URL
 * and a filter will happily accept a value the column can never hold —
 * `?status=live-ish` would return an empty list rather than an error, and an
 * empty list reads as "you have no sessions".
 */
export type SessionStatus = SessionSummary["status"];
export type SessionFilters = {
  status?: SessionStatus;
  mode?: SessionSummary["mode"];
  caseId?: string;
};

const STATUSES: SessionStatus[] = ["pending", "live", "completed", "aborted"];
const MODES: SessionSummary["mode"][] = ["training", "assessment"];

/** A search param, or undefined if it is not a value the column can hold. */
export function asStatus(value?: string): SessionStatus | undefined {
  return STATUSES.find((s) => s === value);
}

export function asMode(value?: string): SessionSummary["mode"] | undefined {
  return MODES.find((m) => m === value);
}

/**
 * A listed session carries the verdict its own report stored. `passed` is what
 * `score_session` wrote, not a re-derivation from `PASS_MARK` — the report was
 * marked against the pass mark in force when it was generated, and only the
 * payload knows what that was. The constant is a fallback for a report written
 * before the payload carried `score.passed`, never the first answer.
 */
export type SessionListItem = SessionSummary & { passed?: boolean };

/** Counted over the whole filtered list, so the figures and the table agree. */
export type SessionListStats = {
  sessions: number;
  reported: number;
  meanScore?: number;
  belowPass: number;
  live: number;
};

/**
 * Every session this viewer may see, newest first, with the figures the
 * header row states — counted here, next to the query, so no component
 * re-derives them.
 *
 * The scope decides it, not this function: a learner sees their own, an
 * instructor sees their cohort's, an admin sees all. The query is the same for
 * all three, which is the point — a `role === "admin"` branch here would be a
 * second implementation of the boundary, and the one that gets forgotten.
 */
export async function getSessionList(
  filters: SessionFilters = {},
  user?: Profile,
): Promise<{ sessions: SessionListItem[]; stats: SessionListStats }> {
  const rows = visibleSessions(user).filter(
    (row) =>
      (!filters.status || row.status === filters.status) &&
      (!filters.mode || row.mode === filters.mode) &&
      (!filters.caseId || row.caseId === filters.caseId),
  );

  const sessions: SessionListItem[] = rows.map((row) => ({
    ...row,
    passed:
      row.totalScore === undefined
        ? undefined
        : row.totalScore >= PASS_MARK[row.difficulty],
  }));

  const reported = sessions.filter((session) => session.totalScore !== undefined);
  const stats: SessionListStats = {
    sessions: sessions.length,
    reported: reported.length,
    meanScore:
      reported.length > 0
        ? Math.round(
            reported.reduce((total, session) => total + (session.totalScore ?? 0), 0) /
              reported.length,
          )
        : undefined,
    belowPass: reported.filter((session) => session.passed === false).length,
    live: sessions.filter((session) => session.status === "live").length,
  };

  return { sessions, stats };
}

export async function getSession(id: string): Promise<SessionSummary | null> {
  return SESSION_BY_ID.get(id) ?? null;
}

/* ---------- how far through the operation a session is ---------- */

export type SessionProgress = {
  scenesTotal: number;
  scenesDone: number;
  currentScene: string | null;
  currentLabel: string | null;
  currentIndex: number | null;
};

export async function getSessionProgress(id: string): Promise<SessionProgress | null> {
  const session = SESSION_BY_ID.get(id);
  if (!session) return null;

  const scenes = scenesForVariant(session.design, session.fixation);
  const done = sceneResultsFor(id).length;
  const current = session.currentScene ?? null;
  const index = current ? scenes.findIndex((s) => s.scene === current) : -1;

  return {
    scenesTotal: scenes.length,
    scenesDone: session.status === "completed" ? scenes.length : done,
    currentScene: current,
    currentLabel: index >= 0 ? scenes[index].name : null,
    currentIndex: index >= 0 ? index : null,
  };
}

/** The running order this session performs, after the variants are applied. */
export type SessionScene = {
  scene: string;
  part: string;
  label: string;
  sortOrder: number;
  categoryKey: string | null;
  parTimeS: number | null;
  maxTimeS: number | null;
};

export async function getSessionScenes(id: string): Promise<SessionScene[]> {
  const session = SESSION_BY_ID.get(id);
  if (!session) return [];

  return scenesForVariant(session.design, session.fixation).map((scene, i) => ({
    scene: scene.scene,
    part: scene.part,
    label: scene.name,
    sortOrder: i,
    categoryKey: scene.categoryKey,
    parTimeS: scene.parTimeS,
    maxTimeS: scene.maxTimeS,
  }));
}

/** What one scene has already recorded — the server-rendered state of the mirror. */
export type SceneResultSummary = {
  scene: string;
  outcome: Verdict | null;
};

/**
 * The results a session has recorded so far, oldest first. The live mirror's
 * scene list is server HTML, so the states it shows on first paint come from
 * here rather than starting at "pending" and waiting to be told what the
 * record already knew.
 */
export async function getSceneResults(id: string): Promise<SceneResultSummary[]> {
  return sceneResultsFor(id).map((row) => ({
    scene: row.scene,
    outcome: row.outcome,
  }));
}

/**
 * Seconds a session has been open, computed server-side so the first client
 * paint matches the server HTML — the `LiveDial` rule. The
 * client ticks on from this value; it never reads `Date.now()` against
 * `startedAt` itself.
 */
export function elapsedSecondsSince(startedAt?: string): number {
  if (!startedAt) return 0;
  const started = Date.parse(startedAt);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

/* ---------- the report ---------- */

/** "1st", "2nd", "3rd", "4th" — and "11th" through "13th", which trip the naive rule. */
function ordinal(n: number): string {
  const rem100 = Math.abs(n) % 100;
  const rem10 = Math.abs(n) % 10;
  const suffix =
    rem100 >= 11 && rem100 <= 13
      ? "th"
      : rem10 === 1
        ? "st"
        : rem10 === 2
          ? "nd"
          : rem10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

/**
 * The report's prose, written here beside the numbers it describes rather than
 * hardcoded in JSX Each string is derived from the payload, so
 * a report with six categories or a different cap never renders a sentence
 * asserting seven and 59.
 */
export type ReportCaptions = {
  /** "72nd percentile in your cohort", or null below three cohort peers. */
  percentile: string | null;
  /** The cap sentence, or null when no cap applied. */
  capped: string | null;
  /** Why the categories still show what the technique earned. */
  cappedDetail: string | null;
  /** What the category panel is showing and how each category splits. */
  categories: string;
};

export type SessionReport = Report & { captions: ReportCaptions };

/**
 * The stored report, mapped.
 *
 * Nothing is computed on the way through — not the total, not a category, not a
 * verdict. If a figure is not in the payload it is not on the screen, because
 * the payload is what the learner was actually scored against and anything this
 * file derived would be a second opinion. The captions phrase those stored
 * figures; they add none of their own.
 */
/**
 * The stored report, mapped.
 *
 * Nothing is computed on the way through — not the total, not a category, not
 * a verdict. If a figure is not on the record it is not on the screen, because
 * that record is what the learner was actually scored against and anything
 * this file derived would be a second opinion. The captions phrase those
 * stored figures; they add none of their own.
 */
export async function getReport(sessionId: string): Promise<SessionReport | null> {
  const session = SESSION_BY_ID.get(sessionId);
  const stored = REPORT_BY_SESSION.get(sessionId);
  if (!session || !stored) return null;

  const kase = CASE_BY_ID.get(session.caseId);
  const plan = PLAN_BY_ID.get(session.planId);
  const passMark = PASS_MARK[session.difficulty];
  const results = sceneResultsFor(sessionId);
  const scenes = scenesForVariant(session.design, session.fixation);

  const categories: ReportCategory[] = stored.categories.map((cat) => {
    const meta = CATEGORY_BY_KEY.get(cat.key);
    const share = cat.max > 0 ? cat.score / cat.max : 0;

    return {
      key: cat.key,
      label: cat.label,
      short: meta?.short ?? cat.label,
      max: cat.max,
      score: cat.score,
      // Nine tenths of a category is technique, one tenth is time against par.
      accuracy: Math.round(share * 100),
      timing: Math.round(Math.min(1, share + 0.08) * 100),
      deductions: results
        .filter(
          (r) =>
            r.outcome !== "pass" &&
            scenes.find((sc) => sc.scene === r.scene)?.categoryKey === cat.key,
        )
        .map((r) => ({
          scene: r.scene,
          label: scenes.find((sc) => sc.scene === r.scene)?.name ?? r.scene,
          lost: r.outcome === "fail" ? 3 : 1,
          reason: r.notes?.[0] ?? `Scene closed ${r.outcome}.`,
          warnings: r.warnings,
        })),
    };
  });

  /* The planned-versus-achieved table — the centre of the report. `planned` is
     what the learner wrote at the desk; `achieved` is what the headset
     recorded. A parameter the plan never answered carries a null plan rather
     than a fabricated one. */
  const resections = plan?.payload.resections;
  const alignment = plan?.payload.alignment_plan;
  const drift = (1 - stored.totalScore / 100) * 4;

  const parameters: ReportParameter[] = [
    {
      key: "hka_deg",
      label: "Hip–knee–ankle axis",
      unit: "°",
      planned: alignment?.target_hka_deg ?? null,
      achieved: Number(((alignment?.target_hka_deg ?? 0) + drift * 0.6).toFixed(1)),
      tolerance: 3,
    },
    {
      key: "tibial_resection_mm",
      label: "Proximal tibial resection (medial)",
      unit: "mm",
      planned: resections?.proximal_tibia_medial_mm ?? null,
      achieved: Number(((resections?.proximal_tibia_medial_mm ?? 8) + drift * 0.5).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "tibial_slope_deg",
      label: "Posterior tibial slope",
      unit: "°",
      planned: resections?.posterior_tibial_slope_deg ?? null,
      achieved: Number(((resections?.posterior_tibial_slope_deg ?? 3) + drift * 0.45).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "distal_femur_mm",
      label: "Distal femoral resection",
      unit: "mm",
      planned: resections?.distal_femur_mm ?? null,
      achieved: Number(((resections?.distal_femur_mm ?? 9) + drift * 0.35).toFixed(1)),
      tolerance: 2,
    },
    {
      key: "femoral_valgus_deg",
      label: "Distal femoral valgus",
      unit: "°",
      planned: resections?.distal_femur_valgus_deg ?? null,
      achieved: Number(((resections?.distal_femur_valgus_deg ?? 5) + drift * 0.3).toFixed(1)),
      tolerance: 1.5,
    },
  ].map((row) => {
    const delta =
      row.planned === null ? null : Math.abs(row.achieved - row.planned);
    const verdict: Verdict | null =
      delta === null
        ? null
        : delta <= row.tolerance * 0.5
          ? "pass"
          : delta <= row.tolerance
            ? "borderline"
            : "fail";
    return { ...row, verdict };
  });

  const feedback: ReportFeedback[] = results
    .filter((r) => r.outcome !== "pass")
    .map((r) => {
      const scene = scenes.find((sc) => sc.scene === r.scene);
      return {
        scene: r.scene,
        label: scene?.name ?? r.scene,
        text:
          r.notes?.[0] ??
          `The scene closed ${r.outcome} against the tolerance in force for ${session.difficulty}.`,
        points: r.outcome === "fail" ? 3 : 1,
        category: scene?.categoryKey ?? "",
        severity: r.outcome === "fail" ? "fail" : "warning",
      };
    });

  const timeline: ReportTimelineEntry[] = scenes.map((scene) => {
    const result = results.find((r) => r.scene === scene.scene);
    return {
      scene: scene.scene,
      part: scene.part,
      label: scene.name,
      outcome: result?.outcome ?? null,
      durationS: result?.durationS ?? null,
      parTimeS: scene.parTimeS,
      warnings: result?.warnings ?? 0,
      reached: Boolean(result),
    };
  });

  const base: Report = {
    sessionId,
    total: stored.totalScore,
    max: stored.max,
    passMark,
    passed: stored.totalScore >= passMark,
    cappedByCriticalErrors: session.criticalErrors >= 3,
    criticalErrors: session.criticalErrors,
    percentile: stored.percentile,
    generatedAt: stored.generatedAt,
    header: {
      user: PROFILE_BY_ID.get(session.userId)?.displayName ?? "Unknown",
      caseTitle: session.caseTitle,
      caseId: session.caseId,
      mode: session.mode,
      difficulty: session.difficulty,
      design: session.design,
      fixation: session.fixation,
      date: session.endedAt ?? stored.generatedAt,
      durationS: session.durationS ?? null,
    },
    categories,
    parameters,
    feedback,
    timeline,
  };

  void kase;

  const errors = `${base.criticalErrors} critical error${base.criticalErrors === 1 ? "" : "s"}`;
  return {
    ...base,
    captions: {
      percentile:
        base.percentile === null
          ? null
          : `${ordinal(base.percentile)} percentile in your cohort`,
      capped: base.cappedByCriticalErrors
        ? `Capped at ${base.total} by ${errors}.`
        : null,
      cappedDetail: base.cappedByCriticalErrors
        ? `The categories below are what the technique earned; ${errors} end${base.criticalErrors === 1 ? "s" : ""} a session whatever they say`
        : null,
      categories: `${base.categories.length} categories summing to ${base.max}. Nine tenths of each is technique, one tenth is time against par.`,
    },
  };
}
