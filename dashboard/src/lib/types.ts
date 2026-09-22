/**
 * The entities the product is modelled on.
 *
 * Field names match the intended columns so wiring a store up is a rename-free
 * change. Where this file uses camelCase, the mapping happens in lib/data —
 * never in a component.
 */

/* ---------- enums ---------- */

export type UserRole =
  | "student"
  | "intern"
  | "resident"
  | "surgeon"
  | "instructor"
  | "admin";

export type Difficulty = "beginner" | "intermediate" | "expert";
export type SimMode = "training" | "assessment";
export type ImplantDesign = "CR" | "PS";
export type FixationType = "cemented" | "cementless";
export type SessionStatus = "pending" | "live" | "completed" | "aborted";
export type Verdict = "pass" | "borderline" | "fail";
export type Side = "left" | "right";

/** Pass marks by difficulty */
export const PASS_MARK: Record<Difficulty, number> = {
  beginner: 60,
  intermediate: 70,
  expert: 80,
};

/**
 * What difficulty does to every authored tolerance Intermediate
 * is the authored value; Beginner widens the target band, Expert narrows it.
 */
export const TOLERANCE_BAND: Record<Difficulty, number> = {
  beginner: 1.5,
  intermediate: 1,
  expert: 0.7,
};

/* ---------- profiles ---------- */

export type Profile = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Free text, e.g. "Resident level". */
  level?: string;
  defaultDifficulty: Difficulty;
  cohortId?: string;
  learnerId?: string;
  institutionId?: string;
  createdAt: string;
  lastActiveAt?: string;
};

export type Cohort = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

/* ---------- cases ---------- */

export type CaseSummary = {
  id: string;
  title: string;
  procedure: string;
  pathology: string;
  side: Side;
  difficulty: Difficulty;
  isActive: boolean;
  /** Derived per-viewer, not a column. */
  bestScore?: number;
  attempts?: number;
};

/* ---------- sessions ---------- */

export type SessionSummary = {
  id: string;
  planId: string;
  userId: string;
  caseId: string;
  caseTitle: string;
  mode: SimMode;
  difficulty: Difficulty;
  design: ImplantDesign;
  fixation: FixationType;
  status: SessionStatus;
  /** Set while status is 'live', e.g. "6.1". */
  currentScene?: string;
  startedAt?: string;
  endedAt?: string;
  durationS?: number;
  criticalErrors: number;
  /** From reports.total_score. Absent until the report is generated. */
  totalScore?: number;
};

export type SceneResult = {
  sessionId: string;
  part: string;
  scene: string;
  durationS?: number;
  outcome?: Verdict;
  warnings: number;
  notes?: string[];
};

/* ---------- reports ---------- */

export type ReportCategory = {
  key: string;
  label: string;
  score: number;
  max: number;
};

export type ReportSummary = {
  sessionId: string;
  totalScore: number;
  max: number;
  percentile?: number;
  categories: ReportCategory[];
  generatedAt: string;
};

/* ---------- pairing ---------- */

export type PairingPin = {
  pin: string;
  planId: string;
  sessionId?: string;
  caseTitle: string;
  ownerName: string;
  expiresAt: string;
  redeemedAt?: string;
};

/* ---------- derived shapes the dashboards consume ---------- */

export type CategoryAverage = {
  key: string;
  label: string;
  /** Axis-safe abbreviation. Charts must never truncate a label themselves. */
  short: string;
  /** 0–100. */
  pct: number;
};

export type ScorePoint = {
  sessionId: string;
  date: string;
  score: number;
  difficulty: Difficulty;
};

export type SceneHotspot = {
  scene: string;
  label: string;
  /** How many learners hit a critical error or fail here. */
  affected: number;
  learners: number;
  severity: Verdict;
};

export type LearnerSummary = {
  id: string;
  displayName: string;
  role: UserRole;
  sessions: number;
  assessments: number;
  meanScore?: number;
  criticalErrors: number;
  weakestCategory?: string;
  lastActiveAt?: string;
};
