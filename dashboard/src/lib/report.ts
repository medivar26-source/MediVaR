/**
 * The report vocabulary — pure, so both a Server and a Client Component may
 * import it.
 *
 * Every shape here mirrors what the scorer returns. That is the only thing in
 * the product that decides a score, so these types describe its output rather
 * than a parallel idea of what a report is.
 */

import type { Difficulty, ImplantDesign, FixationType, SimMode } from "@/lib/types";

export type Verdict = "pass" | "borderline" | "fail";

export type ReportDeduction = {
  scene: string;
  label: string;
  lost: number;
  reason: string;
  warnings: number;
};

export type ReportCategory = {
  key: string;
  label: string;
  short: string;
  max: number;
  score: number;
  /** Share of the marks earned on technique, 0–100. */
  accuracy: number;
  /** Share earned on time against par, 0–100. Worth a tenth of the category. Null where a category is not timed. */
  timing: number | null;
  /** The unrounded mark the scorer reached before rounding half-up to `score`. Absent on sample reports. */
  raw?: number | null;
  deductions: ReportDeduction[];
};

/** One row of the planned-versus-achieved table — the centre of the report. */
export type ReportParameter = {
  key: string;
  label: string;
  unit: string;
  planned: number | null;
  /** Null when the headset did not measure this parameter (the scorer records it as not measured). */
  achieved: number | null;
  tolerance: number;
  verdict: Verdict | null;
  /** The scene that measured it, when the scorer says. */
  scene?: string;
};

export type ReportFeedback = {
  scene: string;
  label: string;
  text: string;
  points: number;
  category: string;
  severity: "fail" | "warning";
};

export type ReportTimelineEntry = {
  scene: string;
  part: string;
  label: string;
  outcome: Verdict | null;
  durationS: number | null;
  parTimeS: number | null;
  warnings: number;
  reached: boolean;
  /** The category the scene's marks belong to (null for the time-out, which carries none). */
  category?: string | null;
  /** Marks the scene earned and the marks it offered, as the scorer wrote them. */
  points?: number | null;
  maxPoints?: number | null;
  /** 0–1 credit for time against par. */
  timingCredit?: number | null;
  /** The scene's time limit, in seconds. */
  maxTimeS?: number | null;
};

/** The scoring rules the scorer stored beside the result, so the page can show its working. */
export type ReportRules = {
  /** Share of a timed category's marks earned on technique (0.9). */
  techniqueShare: number;
  /** Share earned on time against par (0.1). */
  timingShare: number;
  /** Pass mark per difficulty. */
  passMarks: Record<string, number>;
  /** Critical errors at which the total is capped… */
  criticalErrorLimit: number;
  /** …to this many marks. */
  criticalErrorCap: number;
  /** Credit a scene earns on technique, by verdict. */
  techniqueCredit: Record<string, number>;
  /** Plain-words statement of how a verdict follows from a deviation. */
  verdictRule?: string;
};

/** One row of the pre-operative planning audit: what the learner planned against the reference. */
export type PlanningCriterion = {
  key: string;
  name: string;
  unit: string;
  planned: number;
  reference: number;
  deviation: number;
  tolerance: number;
  /** 0–100 */
  score: number;
  severity: string;
};

export type ReportPlanning = {
  criteria: PlanningCriterion[];
  /** The scorer's mean of the criterion scores, 0–100. */
  meanScore: number | null;
};

export type Report = {
  sessionId: string;
  total: number;
  max: number;
  passMark: number;
  passed: boolean;
  cappedByCriticalErrors: boolean;
  criticalErrors: number;
  /** Null below three cohort peers — */
  percentile: number | null;
  generatedAt: string;
  header: {
    user: string;
    caseTitle: string;
    caseId: string;
    mode: SimMode;
    difficulty: Difficulty;
    design: ImplantDesign;
    fixation: FixationType;
    date: string;
    durationS: number | null;
  };
  categories: ReportCategory[];
  parameters: ReportParameter[];
  feedback: ReportFeedback[];
  timeline: ReportTimelineEntry[];
  /** Present on stored reports whose scorer wrote its rules. */
  rules?: ReportRules;
  planning?: ReportPlanning;
  scoringVersion?: string;
  /** True when the stored run is sample data rather than a real performance. */
  sample?: boolean;
};

/**
 * How a parameter's deviation reads as a proportion of its tolerance.
 *
 * Returned as a fraction of the band rather than the raw difference, so a 1.2°
 * axis error and a 1.2 mm joint-line error can sit in the same column and mean
 * the same thing. Clamped, because a bar that runs off its track says less than
 * one that is full.
 */
export function deviationOf(parameter: ReportParameter): number | null {
  if (parameter.planned === null || parameter.achieved === null) return null;
  const delta = Math.abs(parameter.achieved - parameter.planned);
  return Math.min(1, delta / (parameter.tolerance || 1));
}

/** Where the marks actually went, worst category first. */
export function weakestCategory(categories: ReportCategory[]): ReportCategory | undefined {
  return [...categories]
    .filter((c) => c.max > 0)
    .sort((a, b) => a.score / a.max - b.score / b.max)[0];
}

export const SESSION_STATUS_LABEL: Record<string, string> = {
  pending: "Not started",
  live: "In progress",
  completed: "Completed",
  aborted: "Interrupted",
};
