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

export type CaseStatus = "draft" | "active" | "inactive";
export type CaseVersionStatus = "draft" | "published" | "archived";

export type CaseImaging = {
  id: string;
  case_version_id: string;
  view_type: "FLAP" | "KLAT" | string;
  label: string;
  storage_path: string;
  signed_url?: string;
  filename?: string;
  mimetype?: string;
  file_size?: number;
  width?: number;
  height?: number;
  laterality?: Side;
  calibration: {
    marker_type?: string;
    physical_marker_diameter_mm?: number;
    detected_marker_pixel_diameter?: number;
    calculated_scale_mm_per_px?: number;
    unit?: string;
    is_valid: boolean;
    validation_error?: string | null;
  };
  created_at?: string;
};

export type CasePatient = {
  age?: number;
  gender?: string;
  bmi?: number;
  clinical_notes?: string;
  history?: string;
};

export type CaseVersionDetail = {
  id: string;
  case_id: string;
  version_number: number;
  title: string;
  pathology?: string;
  pathology_label?: string;
  side: Side;
  difficulty: Difficulty;
  description?: string;
  patient: CasePatient;
  objectives: string[];
  status: CaseVersionStatus;
  is_immutable: boolean;
  created_at: string;
  published_at?: string;
};

export type CaseAssessmentCriterion = {
  id?: string;
  skill_id: string;
  name: string;
  parameter: string;
  target_value: number;
  tolerance_min?: number;
  tolerance_max?: number;
  unit?: string;
  severity_rule?: {
    minor?: number;
    major?: number;
    critical?: number;
  };
};

export type CaseItem = {
  id: string;
  name: string;
  difficulty: Difficulty;
  description?: string;
  learning_objective?: string;
  status: CaseStatus;
  version: number;
  institution_id?: string;
  draft_version_id?: string | null;
  published_version_id?: string | null;
  program_ids: string[];
  created_at: string;
  updated_at: string;
  active_version?: CaseVersionDetail;
  imaging?: CaseImaging[];
  reference_plan?: any;
  criteria?: CaseAssessmentCriterion[];
  validation_errors?: string[];
  is_publishable?: boolean;
};

export type LearnerCaseItem = {
  id: string;
  name: string;
  difficulty: Difficulty;
  description?: string;
  learning_objective?: string;
  status: CaseStatus;
  version: number;
  published_version_id: string;
  title: string;
  pathology?: string;
  pathology_label?: string;
  side: Side;
  patient: CasePatient;
  objectives: string[];
  imaging: CaseImaging[];
};

export type CaseSummary = {
  id: string;
  title: string;
  procedure: string;
  pathology: string;
  side: Side;
  difficulty: Difficulty;
  isActive: boolean;
  version?: number;
  status?: CaseStatus;
  draft_version_id?: string | null;
  published_version_id?: string | null;
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
