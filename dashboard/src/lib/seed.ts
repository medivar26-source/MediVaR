/**
 * The seed dataset the dashboard renders from.
 *
 * Every accessor in `lib/data` reads these tables. They are plain frozen
 * arrays: nothing here is fetched, nothing is written, and a reload returns
 * exactly the same rows. Timestamps are expressed as an offset from load so a
 * screen never shows a date from last year while the catalogue is still being
 * authored.
 *
 * The shapes mirror the data model column for column, so the
 * accessors above them do not care where a row came from.
 */

import type {
  CaseSummary,
  Difficulty,
  FixationType,
  ImplantDesign,
  Profile,
  SessionSummary,
  Side,
  SimMode,
  UserRole,
  Verdict,
} from "./types";

const DAY = 86_400_000;
const MINUTE = 60_000;

const BASE = Date.now();

/** An ISO timestamp `n` days before load. */
export function daysAgo(n: number): string {
  return new Date(BASE - n * DAY).toISOString();
}

/** An ISO timestamp `n` minutes before load. */
export function minutesAgo(n: number): string {
  return new Date(BASE - n * MINUTE).toISOString();
}

/* ============================================================
   report_category_meta The seven categories, and
   the marks each can carry. They total 100.
   ============================================================ */

export type CategoryMeta = {
  key: string;
  label: string;
  short: string;
  max: number;
};

export const CATEGORY_META: CategoryMeta[] = [
  { key: "preop_planning", label: "Pre-operative planning", short: "Pre-op", max: 20 },
  { key: "bone_cuts", label: "Bone cuts & alignment", short: "Cuts", max: 25 },
  { key: "gap_assessment", label: "Gap assessment", short: "Gaps", max: 15 },
  { key: "trialling", label: "Trialling & stability", short: "Trial", max: 15 },
  { key: "implantation", label: "Implantation & cementation", short: "Implant", max: 15 },
  { key: "patellar", label: "Patellar management", short: "Patella", max: 5 },
  { key: "exposure_closure", label: "Exposure & closure", short: "Exposure", max: 5 },
];

export const CATEGORY_BY_KEY = new Map(CATEGORY_META.map((c) => [c.key, c]));

/* ============================================================
   cohorts
   ============================================================ */

export type CohortRow = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export const COHORTS: CohortRow[] = [
  {
    id: "c0000000-0000-4000-a000-000000000001",
    name: "ST3 Orthopaedics 2025",
    ownerId: "a0000000-0000-4000-a000-000000000002",
    createdAt: daysAgo(132),
  },
  {
    id: "c0000000-0000-4000-a000-000000000002",
    name: "Foundation Year 2",
    ownerId: "a0000000-0000-4000-a000-000000000002",
    createdAt: daysAgo(108),
  },
];

/* ============================================================
   profiles
   ============================================================ */

const ST3 = COHORTS[0].id;

export const PROFILES: Profile[] = [
  {
    id: "a0000000-0000-4000-a000-000000000002",
    email: "h.ward@mediver.test",
    displayName: "Prof. Helen Ward",
    role: "instructor",
    level: "Consultant",
    defaultDifficulty: "expert",
    createdAt: daysAgo(260),
    lastActiveAt: minutesAgo(235),
  },
  {
    id: "a0000000-0000-4000-a000-000000000010",
    email: "a.mehta@mediver.test",
    displayName: "Dr Arjun Mehta",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(200),
    lastActiveAt: minutesAgo(23),
  },
  {
    id: "a0000000-0000-4000-a000-000000000011",
    email: "s.iyer@mediver.test",
    displayName: "Dr Sneha Iyer",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(195),
    lastActiveAt: minutesAgo(1440),
  },
  {
    id: "a0000000-0000-4000-a000-000000000012",
    email: "p.nair@mediver.test",
    displayName: "Dr Priya Nair",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(190),
    lastActiveAt: minutesAgo(2880),
  },
  {
    id: "a0000000-0000-4000-a000-000000000013",
    email: "r.khan@mediver.test",
    displayName: "Dr Ravi Khan",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "beginner",
    cohortId: ST3,
    createdAt: daysAgo(120),
    lastActiveAt: minutesAgo(25920),
  },
  {
    id: "a0000000-0000-4000-a000-000000000014",
    email: "l.fernandes@mediver.test",
    displayName: "Lena Fernandes",
    role: "intern",
    level: "Intern",
    defaultDifficulty: "beginner",
    cohortId: ST3,
    createdAt: daysAgo(90),
    lastActiveAt: minutesAgo(31680),
  },
  {
    id: "a0000000-0000-4000-a000-000000000015",
    email: "m.costa@mediver.test",
    displayName: "Dr Marco Costa",
    role: "resident",
    level: "Resident level",
    defaultDifficulty: "intermediate",
    cohortId: ST3,
    createdAt: daysAgo(180),
    lastActiveAt: minutesAgo(4320),
  },
];

export const PROFILE_BY_ID = new Map(PROFILES.map((p) => [p.id, p]));

/**
 * Who the app renders as.
 *
 * Authentication is not wired up yet — `/login` accepts the form and returns
 * here. Point this at any row above to see the product through that role: a
 * learner role swaps `/` for the learner dashboard and hides the Teaching
 * section, exactly as `personaFor` describes.
 */
export const CURRENT_USER: Profile = PROFILES[0];

/* ============================================================
   procedures / procedure_parts / procedure_scenes
   ============================================================ */

export type PublishState = "published" | "planned" | "exploratory";

export type ProcedureRow = {
  id: string;
  name: string;
  status: PublishState;
  tagline?: string;
  summary?: string;
  typicalDurationS?: number;
};

export const PROCEDURES: ProcedureRow[] = [
  {
    id: "tkr",
    name: "Total Knee Replacement",
    status: "published",
    tagline: "Plan. Simulate. Perform. Perfect.",
    summary:
      "A complete clinical episode — seven pre-operative planning steps on the desktop, eleven operative parts in the headset, then a report scored against your own plan.",
    typicalDurationS: 840,
  },
  {
    id: "thr",
    name: "Total Hip Replacement",
    status: "planned",
    summary:
      "Posterior and direct anterior approaches. Not scheduled for Phase 1.",
  },
  {
    id: "ivc",
    name: "IV Cannulation",
    status: "planned",
    summary:
      "Nursing-student pathway. Shorter session, instrument-recognition led.",
  },
  {
    id: "uka",
    name: "Unicompartmental Knee",
    status: "exploratory",
    summary: "Reuses the TKR cutter and jig framework.",
  },
];

export type PartRow = {
  procedureId: string;
  part: string;
  name: string;
  variantNote?: string;
};

export const PARTS: PartRow[] = [
  { procedureId: "tkr", part: "P0", name: "Pre-surgery check (Time Out)" },
  { procedureId: "tkr", part: "P1", name: "Positioning & preparation" },
  { procedureId: "tkr", part: "P2", name: "Surgical approach" },
  { procedureId: "tkr", part: "P3", name: "Joint preparation" },
  { procedureId: "tkr", part: "P4", name: "Tibial resection" },
  { procedureId: "tkr", part: "P5", name: "Femoral preparation" },
  { procedureId: "tkr", part: "P6", name: "Balancing & trialling" },
  { procedureId: "tkr", part: "P7", name: "Tibial final preparation" },
  { procedureId: "tkr", part: "P8", name: "PS box cut", variantNote: "PS only" },
  { procedureId: "tkr", part: "P9", name: "Patellar management" },
  { procedureId: "tkr", part: "P10", name: "Cementation", variantNote: "Cemented only" },
  { procedureId: "tkr", part: "P11", name: "Closure & debrief" },
];

export type SceneRow = {
  procedureId: string;
  scene: string;
  part: string;
  name: string;
  short: string;
  variantNote?: string;
  /** Which report category this scene's marks land in, if any. */
  categoryKey: string | null;
  /** Seconds the scene should take, and the ceiling before it scores zero. */
  parTimeS: number;
  maxTimeS: number;
  /**
   * Failure here damages a named structure — and counts towards
   * the three-error cap in Failing a non-critical scene costs that scene's
   * marks and nothing else.
   */
  isCritical: boolean;
  /** The variant gates, split out of `variantNote` so a query can filter on them. */
  requiresDesign?: ImplantDesign;
  requiresFixation?: FixationType;
  requiresPatella?: boolean;
};

/** Seconds: [par, max] per scene. */
const SCENE_TIMES: Record<string, [number, number]> = {
  "0.1": [60, 150], "1.1": [60, 150], "1.2": [60, 150],
  "2.1": [45, 120], "2.2": [60, 150], "2.3": [75, 180],
  "3.1": [45, 120], "3.2": [60, 150], "3.3": [75, 180],
  "4.1": [90, 210], "4.2": [75, 180], "4.3": [45, 120],
  "5.1": [60, 150], "5.1b": [40, 100], "5.2": [75, 180],
  "5.3": [60, 150], "5.4": [90, 210],
  "6.1": [90, 210], "6.2": [75, 180], "6.3": [60, 150],
  "7.1": [60, 150], "7.2": [60, 150], "7.2b": [50, 130],
  "8.1": [60, 150],
  "9.1": [50, 130], "9.1b": [60, 150],
  "10.1": [60, 150], "10.2": [90, 210], "10.3": [60, 150],
  "11.1": [75, 180], "11.2": [60, 150],
};

/**
 * Which category a scene's marks land in.
 *
 * P0 Time Out and P1 are deliberately unmapped — they are not scored. And
 * `preop_planning` is absent because it comes from the seven planning steps,
 * which are not scenes at all.
 */
function categoryForScene(part: string, scene: string): string | null {
  if (["P2", "P3", "P11"].includes(part)) return "exposure_closure";
  if (["P4", "P5", "P8"].includes(part)) return "bone_cuts";
  if (scene === "6.1") return "gap_assessment";
  if (scene === "6.2" || scene === "6.3") return "trialling";
  if (["P7", "P10"].includes(part)) return "implantation";
  if (part === "P9") return "patellar";
  return null;
}

/** Scenes where a failure damages a named structure. */
const CRITICAL_SCENES = new Set(["3.2", "4.2", "5.2", "5.4"]);

type SceneSeed = Omit<
  SceneRow,
  | "categoryKey"
  | "parTimeS"
  | "maxTimeS"
  | "isCritical"
  | "requiresDesign"
  | "requiresFixation"
  | "requiresPatella"
>;

const SCENE_SEED: SceneSeed[] = [
  { procedureId: "tkr", scene: "0.1", part: "P0", name: "Time Out", short: "Time Out" },
  { procedureId: "tkr", scene: "1.1", part: "P1", name: "Patient positioning", short: "Position", variantNote: "To be authored" },
  { procedureId: "tkr", scene: "1.2", part: "P1", name: "Clinical examination", short: "Exam", variantNote: "To be authored" },
  { procedureId: "tkr", scene: "2.1", part: "P2", name: "Skin incision", short: "Incision" },
  { procedureId: "tkr", scene: "2.2", part: "P2", name: "Medial parapatellar arthrotomy", short: "Arthrotomy" },
  { procedureId: "tkr", scene: "2.3", part: "P2", name: "Release & patellar eversion", short: "Release" },
  { procedureId: "tkr", scene: "3.1", part: "P3", name: "ACL resection & subluxation", short: "ACL" },
  { procedureId: "tkr", scene: "3.2", part: "P3", name: "Hohmann retractors & sleeve", short: "Retractors" },
  { procedureId: "tkr", scene: "3.3", part: "P3", name: "Osteophyte removal", short: "Osteophyte" },
  { procedureId: "tkr", scene: "4.1", part: "P4", name: "Tibial jig alignment", short: "Tibial jig" },
  { procedureId: "tkr", scene: "4.2", part: "P4", name: "Tibial cut execution", short: "Tibial cut" },
  { procedureId: "tkr", scene: "4.3", part: "P4", name: "Cut surface assessment", short: "Surface" },
  { procedureId: "tkr", scene: "5.1", part: "P5", name: "Femoral landmarks", short: "Landmarks" },
  { procedureId: "tkr", scene: "5.1b", part: "P5", name: "PCL resection", short: "PCL", variantNote: "PS only" },
  { procedureId: "tkr", scene: "5.2", part: "P5", name: "Distal femur cut", short: "Femur cut" },
  { procedureId: "tkr", scene: "5.3", part: "P5", name: "Femoral sizing", short: "Sizing" },
  { procedureId: "tkr", scene: "5.4", part: "P5", name: "4-in-1 block & four cuts", short: "4-in-1" },
  { procedureId: "tkr", scene: "6.1", part: "P6", name: "Flexion/extension gaps", short: "Gaps" },
  { procedureId: "tkr", scene: "6.2", part: "P6", name: "Trial components", short: "Trial" },
  { procedureId: "tkr", scene: "6.3", part: "P6", name: "Alignment, ROM & tracking", short: "Tracking" },
  { procedureId: "tkr", scene: "7.1", part: "P7", name: "Tray sizing & rotation", short: "Tray" },
  { procedureId: "tkr", scene: "7.2", part: "P7", name: "Keel preparation", short: "Keel" },
  { procedureId: "tkr", scene: "7.2b", part: "P7", name: "Cementless broach", short: "Broach", variantNote: "Cementless only" },
  { procedureId: "tkr", scene: "8.1", part: "P8", name: "PS box cut", short: "Box cut", variantNote: "PS only" },
  { procedureId: "tkr", scene: "9.1", part: "P9", name: "Patellar preparation", short: "Patella" },
  { procedureId: "tkr", scene: "9.1b", part: "P9", name: "Patellar resurfacing", short: "Resurface", variantNote: "If resurfaced" },
  { procedureId: "tkr", scene: "10.1", part: "P10", name: "Lavage & cement preparation", short: "Lavage", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "10.2", part: "P10", name: "Cementation", short: "Cement", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "10.3", part: "P10", name: "Cement removal & assessment", short: "Clear-up", variantNote: "Cemented only" },
  { procedureId: "tkr", scene: "11.1", part: "P11", name: "Wound closure", short: "Closure" },
  { procedureId: "tkr", scene: "11.2", part: "P11", name: "Post-op X-rays & debrief", short: "Debrief" },
];

export const SCENES: SceneRow[] = SCENE_SEED.map((seed) => {
  const [parTimeS, maxTimeS] = SCENE_TIMES[seed.scene] ?? [60, 150];
  return {
    ...seed,
    categoryKey: categoryForScene(seed.part, seed.scene),
    parTimeS,
    maxTimeS,
    isCritical: CRITICAL_SCENES.has(seed.scene),
    requiresDesign:
      seed.variantNote === "PS only" ? ("PS" as const) : undefined,
    requiresFixation:
      seed.variantNote === "Cemented only"
        ? ("cemented" as const)
        : seed.variantNote === "Cementless only"
          ? ("cementless" as const)
          : undefined,
    requiresPatella: seed.variantNote === "If resurfaced" ? true : undefined,
  };
});

export const SCENE_BY_ID = new Map(SCENES.map((s) => [s.scene, s]));

/** The label a scene number should carry anywhere it is printed. */
export function sceneLabel(scene: string): string {
  return SCENE_BY_ID.get(scene)?.name ?? scene;
}

/* ============================================================
   cases
   ============================================================ */

export type CaseRow = CaseSummary & {
  procedureId: string;
  pathologyLabel: string;
  summary: string;
  patient: Record<string, string | number>;
  /**
   * `ap` and `long_leg` carry their own matching generic plate from
   * `public/` (`knee_xray_ap.jpg`, `full_leg_xray.jpg`). `lateral` and
   * `skyline` have no distinct asset in the repo at all, so rather than
   * leave them pending they reuse those same two plates with
   * `placeholder: true` — visibly flagged in the UI as a stand-in, never
   * presented as a real lateral or skyline film. The two SYNTH- cases are
   * the exception: they carry their own generated FLAP/KLAT pair and are
   * never placeholders.
   */
  imaging: { view: string; label: string; src?: string; placeholder?: boolean }[];
  objectives: string[];
  createdAt: string;
};

export const CASES: CaseRow[] = [
  {
    id: "CASE_001",
    procedureId: "tkr",
    title: "Varus OA — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "intermediate",
    isActive: false,
    summary:
      "62-year-old man, medial compartment collapse, 8.2° correctable varus. The reference case for the full eleven-part walkthrough.",
    patient: {
      age: 62,
      sex: "male",
      bmi: 28.4,
      occupation: "Retired manual worker",
      activity: "Community ambulant, walks with a stick outdoors",
      complaint: "Medial knee pain, 4 years",
      history:
        "Progressive medial pain, worse on stairs and after standing. Night pain for the last 6 months.",
      past_management:
        "Analgesia, physiotherapy, two intra-articular steroid injections with short-lived relief.",
      walking_distance_m: 200,
      fixed_flexion_deg: 5,
      rom: "5°–115°",
      deformity: "8.2° varus, correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "skyline", label: "Skyline", src: "/full_leg_xray.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Recognise medial compartment OA with correctable varus on a long-leg film.",
      "Plan a neutral mechanical axis and justify the resection depths.",
      "Execute a tibial cut within ±2 mm of the planned 8 mm.",
      "Balance flexion and extension gaps to within 2 mm.",
      "Identify and stage a medial release without over-releasing.",
    ],
    createdAt: daysAgo(210),
  },
  {
    id: "CASE_002",
    procedureId: "tkr",
    title: "Valgus OA — Left knee",
    procedure: "tkr",
    pathology: "primary_oa_valgus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "expert",
    isActive: false,
    summary:
      "Lateral compartment wear with a tight lateral sleeve. PS variant recommended.",
    patient: {
      age: 71,
      sex: "female",
      bmi: 26.1,
      occupation: "Retired teacher",
      activity: "Housebound distances only",
      complaint: "Lateral knee pain, 6 years",
      history: "Long-standing valgus with progressive lateral collapse.",
      past_management: "Analgesia, bracing, physiotherapy.",
      walking_distance_m: 150,
      fixed_flexion_deg: 8,
      rom: "8°–110°",
      deformity: "12° valgus, partially correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Recognise a valgus deformity with a contracted lateral sleeve.",
      "Stage a lateral release without destabilising the knee.",
      "Justify a PS design where the PCL cannot be balanced.",
    ],
    createdAt: daysAgo(190),
  },
  {
    id: "CASE_003",
    procedureId: "tkr",
    title: "Post-traumatic — Right knee",
    procedure: "tkr",
    pathology: "post_traumatic",
    pathologyLabel: "Post-traumatic",
    side: "right",
    difficulty: "expert",
    isActive: false,
    summary:
      "Old plateau fracture, AORI type 2A defect. Augment likely required before keel preparation.",
    patient: {
      age: 54,
      sex: "male",
      bmi: 29.8,
      occupation: "Scaffolder",
      activity: "Limited by pain at work",
      complaint: "Pain and instability, 9 years after a plateau fracture",
      history:
        "Schatzker II plateau fracture treated with ORIF. Progressive post-traumatic arthrosis.",
      past_management: "Hardware removal, analgesia.",
      walking_distance_m: 300,
      fixed_flexion_deg: 10,
      rom: "10°–105°",
      deformity: "6° varus with a metaphyseal defect",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Classify a contained tibial defect using the AORI system.",
      "Decide between cement fill, augment and stem before the keel cut.",
    ],
    createdAt: daysAgo(170),
  },
  {
    id: "CASE_004",
    procedureId: "tkr",
    title: "Rheumatoid — Left knee",
    procedure: "tkr",
    pathology: "inflammatory",
    pathologyLabel: "Inflammatory",
    side: "left",
    difficulty: "beginner",
    isActive: false,
    summary: "Soft bone, balanced deformity. The introductory case for residents.",
    patient: {
      age: 58,
      sex: "female",
      bmi: 23.2,
      occupation: "Administrator",
      activity: "Independent indoors",
      complaint: "Bilateral knee pain and swelling",
      history:
        "Seropositive rheumatoid arthritis for 18 years, well controlled on biologics.",
      past_management: "DMARDs, biologics, joint injections.",
      walking_distance_m: 400,
      fixed_flexion_deg: 3,
      rom: "3°–120°",
      deformity: "Neutral, balanced",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "skyline", label: "Skyline", src: "/full_leg_xray.jpg", placeholder: true },
    ],
    objectives: [
      "Adapt cutting technique to soft, osteopenic bone.",
      "Complete the eleven parts without a tolerance breach.",
    ],
    createdAt: daysAgo(150),
  },
  {
    id: "CASE_005",
    procedureId: "tkr",
    title: "Severe varus — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_varus_severe",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "expert",
    isActive: false,
    summary: "18° varus with a fixed flexion contracture. Staged medial release required.",
    patient: {
      age: 66,
      sex: "male",
      bmi: 33.7,
      occupation: "Retired driver",
      activity: "Sedentary",
      complaint: "Severe medial pain and bow-legged deformity",
      history:
        "End-stage medial OA with a 15-year history and progressive deformity.",
      past_management: "Analgesia, weight management, injections.",
      walking_distance_m: 100,
      fixed_flexion_deg: 15,
      rom: "15°–100°",
      deformity: "18° varus, incompletely correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Sequence a medial release for an incompletely correctable varus knee.",
      "Manage a fixed flexion contracture with distal femoral resection.",
    ],
    createdAt: daysAgo(140),
  },
  {
    id: "CASE_006",
    procedureId: "tkr",
    title: "Bilateral OA — Left knee",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "intermediate",
    isActive: false,
    summary:
      "Second-side surgery six months after a right TKR. Draft — imaging package incomplete.",
    patient: {
      age: 69,
      sex: "female",
      bmi: 30.2,
      occupation: "Retired nurse",
      activity: "Community ambulant",
      complaint: "Left knee pain after a successful right replacement",
      history: "Bilateral medial OA. Right TKR six months ago with a good result.",
      past_management: "Analgesia, physiotherapy.",
      walking_distance_m: 250,
      fixed_flexion_deg: 5,
      rom: "5°–115°",
      deformity: "7° varus, correctable",
    },
    imaging: [{ view: "ap", label: "AP standing" }],
    objectives: [],
    createdAt: daysAgo(40),
  },
  {
    id: "CASE_007",
    procedureId: "tkr",
    title: "Medial OA — Left knee",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "beginner",
    isActive: true,
    summary:
      "58-year-old woman, early medial compartment wear, 4° correctable varus. A gentle introduction to the alignment workflow.",
    patient: {
      age: 58,
      sex: "female",
      bmi: 25.6,
      occupation: "Shop assistant",
      activity: "Community ambulant, no walking aid",
      complaint: "Medial knee pain, 18 months",
      history:
        "Gradual-onset medial pain, worse with prolonged standing. No night pain.",
      past_management: "Analgesia, weight loss advice, one physiotherapy course.",
      walking_distance_m: 600,
      fixed_flexion_deg: 0,
      rom: "0°–125°",
      deformity: "4° varus, correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Recognise early-stage medial OA with a small, fully correctable varus deformity.",
      "Plan a neutral mechanical axis with conservative resection depths.",
      "Complete the eleven parts without a tolerance breach.",
    ],
    createdAt: daysAgo(60),
  },
  {
    id: "CASE_008",
    procedureId: "tkr",
    title: "Lateral OA — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_valgus",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "intermediate",
    isActive: true,
    summary:
      "64-year-old man, moderate lateral compartment collapse, 9° valgus. CR design likely, PCL competence to be confirmed intra-operatively.",
    patient: {
      age: 64,
      sex: "male",
      bmi: 27.9,
      occupation: "Retired engineer",
      activity: "Community ambulant, walks with a stick",
      complaint: "Lateral knee pain, 3 years",
      history:
        "Progressive lateral pain and a sense of the knee giving way on stairs.",
      past_management: "Analgesia, a lateral wedge insole, physiotherapy.",
      walking_distance_m: 300,
      fixed_flexion_deg: 5,
      rom: "5°–118°",
      deformity: "9° valgus, correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "skyline", label: "Skyline", src: "/full_leg_xray.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Recognise a moderate valgus deformity with a contained lateral sleeve.",
      "Assess PCL competence and decide between CR and PS intra-operatively.",
      "Balance flexion and extension gaps to within 2 mm on the lateral side.",
    ],
    createdAt: daysAgo(50),
  },
  {
    id: "CASE_009",
    procedureId: "tkr",
    title: "Post-traumatic stiffness — Left knee",
    procedure: "tkr",
    pathology: "post_traumatic",
    pathologyLabel: "Post-traumatic",
    side: "left",
    difficulty: "expert",
    isActive: false,
    summary:
      "Stiff post-traumatic knee, prior distal femoral fracture with malunion. Draft — assessment criteria not yet finalised.",
    patient: {
      age: 49,
      sex: "male",
      bmi: 28.7,
      occupation: "Delivery driver",
      activity: "Limited by stiffness rather than pain",
      complaint: "Restricted flexion and anterior pain, 7 years after fracture",
      history:
        "Distal femoral fracture treated with plate fixation, healed in mild valgus malunion. Progressive post-traumatic arthrosis and stiffness.",
      past_management: "Manipulation under anaesthesia, physiotherapy, analgesia.",
      walking_distance_m: 200,
      fixed_flexion_deg: 12,
      rom: "12°–90°",
      deformity: "5° valgus malunion, extra-articular",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Account for extra-articular deformity when planning the distal femoral cut.",
      "Sequence soft-tissue releases for a stiff, previously operated knee.",
    ],
    createdAt: daysAgo(25),
  },
  {
    id: "CASE_010",
    procedureId: "tkr",
    title: "Rheumatoid — Right knee",
    procedure: "tkr",
    pathology: "inflammatory",
    pathologyLabel: "Inflammatory",
    side: "right",
    difficulty: "beginner",
    isActive: true,
    summary:
      "61-year-old man, seropositive rheumatoid arthritis, balanced deformity and osteopenic bone. Companion case to CASE_004.",
    patient: {
      age: 61,
      sex: "male",
      bmi: 24.5,
      occupation: "Retired postal worker",
      activity: "Independent indoors, uses a stick outdoors",
      complaint: "Bilateral knee pain and stiffness",
      history:
        "Seropositive rheumatoid arthritis for 14 years, moderately controlled on DMARDs.",
      past_management: "DMARDs, analgesia, joint injections.",
      walking_distance_m: 350,
      fixed_flexion_deg: 5,
      rom: "5°–115°",
      deformity: "Neutral, mild bone loss",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
    ],
    objectives: [
      "Adapt cutting and impaction technique to osteopenic bone.",
      "Recognise soft-tissue laxity typical of inflammatory arthropathy.",
    ],
    createdAt: daysAgo(20),
  },
  {
    id: "CASE_011",
    procedureId: "tkr",
    title: "Severe combined deformity — Right knee",
    procedure: "tkr",
    pathology: "primary_oa_varus_severe",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "expert",
    isActive: false,
    summary:
      "16° varus with a 20° fixed flexion contracture and mediolateral instability. Draft — pending review before release to cohorts.",
    patient: {
      age: 70,
      sex: "male",
      bmi: 31.4,
      occupation: "Retired farmer",
      activity: "Household ambulant only",
      complaint: "Severe deformity and instability, worsening over 20 years",
      history:
        "Long-standing untreated medial OA with progressive bony deformity and attritional ligament laxity.",
      past_management: "Analgesia, a hinged knee brace, walking aids.",
      walking_distance_m: 50,
      fixed_flexion_deg: 20,
      rom: "20°–95°",
      deformity: "16° varus with mediolateral instability, incompletely correctable",
    },
    imaging: [
      { view: "ap", label: "AP standing", src: "/knee_xray_ap.jpg" },
      { view: "lateral", label: "Lateral", src: "/knee_xray_ap.jpg", placeholder: true },
      { view: "long_leg", label: "Full-length long-leg", src: "/full_leg_xray.jpg" },
    ],
    objectives: [
      "Recognise when soft-tissue balancing alone will not stabilise the knee.",
      "Plan for constrained implant options where ligament competence is in doubt.",
      "Sequence a staged medial release for a severe, poorly correctable deformity.",
    ],
    createdAt: daysAgo(10),
  },
  {
    id: "SYNTH-VARUS-001",
    procedureId: "tkr",
    title: "DEMO: Synthetic Varus TKR (P-0247)",
    procedure: "tkr",
    pathology: "primary_oa_varus",
    pathologyLabel: "Osteoarthritis",
    side: "right",
    difficulty: "intermediate",
    isActive: true,
    summary: "Synthetic demo data - Not for clinical use. P-0247 Right Knee 7.0° Varus.",
    patient: {
      age: 68,
      sex: "male",
      bmi: 27.5,
      occupation: "Software Test Fixture",
      complaint: "Synthetic varus demo case",
      history: "Synthetic demo data - Not for clinical use. Used for testing the pre-operative planning workflow.",
      past_management: "None",
      deformity: "7.0° Varus",
    },
    imaging: [
      { view: "flap", label: "FLAP", src: "/synth_varus_flap.jpg" },
      { view: "klat", label: "KLAT", src: "/synth_varus_klat.jpg" },
    ],
    objectives: [],
    createdAt: daysAgo(1),
  },
  {
    id: "SYNTH-VALGUS-001",
    procedureId: "tkr",
    title: "DEMO: Synthetic Valgus TKR (P-0891)",
    procedure: "tkr",
    pathology: "primary_oa_valgus",
    pathologyLabel: "Osteoarthritis",
    side: "left",
    difficulty: "expert",
    isActive: true,
    summary: "Synthetic demo data - Not for clinical use. P-0891 Left Knee 5.0° Valgus.",
    patient: {
      age: 72,
      sex: "female",
      bmi: 26.2,
      occupation: "Software Test Fixture",
      complaint: "Synthetic valgus demo case",
      history: "Synthetic demo data - Not for clinical use. Used for testing the pre-operative planning workflow.",
      past_management: "None",
      deformity: "5.0° Valgus",
    },
    imaging: [
      { view: "flap", label: "FLAP", src: "/synth_valgus_flap.jpg" },
      { view: "klat", label: "KLAT", src: "/synth_valgus_klat.jpg" },
    ],
    objectives: [],
    createdAt: daysAgo(1),
  }
];

export const CASE_BY_ID = new Map(CASES.map((c) => [c.id, c]));

/* ============================================================
   sessions / reports / scene_results

   One spec table drives all three, so a score, its report and its
   scene outcomes can never disagree with each other.
   ============================================================ */

type SessionSpec = {
  n: number;
  userId: string;
  caseId: string;
  /** Absent for a session that never produced a report. */
  score?: number;
  status: SessionSummary["status"];
  daysAgo: number;
  durationS: number;
  mode: SimMode;
  design: ImplantDesign;
  fixation: FixationType;
  criticalErrors: number;
  currentScene?: string;
};

const U = {
  arjun: "a0000000-0000-4000-a000-000000000010",
  sneha: "a0000000-0000-4000-a000-000000000011",
  priya: "a0000000-0000-4000-a000-000000000012",
  ravi: "a0000000-0000-4000-a000-000000000013",
  marco: "a0000000-0000-4000-a000-000000000015",
};

const SPECS: SessionSpec[] = [
  // Dr Arjun Mehta — the worked history, oldest first.
  { n: 2, userId: U.arjun, caseId: "CASE_004", score: 92, status: "completed", daysAgo: 46, durationS: 792, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 3, userId: U.arjun, caseId: "CASE_001", score: 74, status: "completed", daysAgo: 39, durationS: 968, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 4, userId: U.arjun, caseId: "CASE_002", score: 51, status: "completed", daysAgo: 33, durationS: 1124, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 3 },
  { n: 6, userId: U.arjun, caseId: "CASE_001", score: 81, status: "completed", daysAgo: 25, durationS: 861, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 7, userId: U.arjun, caseId: "CASE_005", score: 76, status: "completed", daysAgo: 19, durationS: 1013, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 1 },
  { n: 8, userId: U.arjun, caseId: "CASE_003", score: 64, status: "completed", daysAgo: 14, durationS: 1088, mode: "assessment", design: "PS", fixation: "cementless", criticalErrors: 2 },
  { n: 9, userId: U.arjun, caseId: "CASE_001", score: 88, status: "completed", daysAgo: 8, durationS: 824, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 10, userId: U.arjun, caseId: "CASE_002", score: 68, status: "completed", daysAgo: 3, durationS: 1002, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 2 },
  // An interrupted run, and one still in the headset.
  { n: 5, userId: U.arjun, caseId: "CASE_003", status: "aborted", daysAgo: 29, durationS: 412, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1, currentScene: "5.2" },
  { n: 11, userId: U.arjun, caseId: "CASE_001", status: "live", daysAgo: 0, durationS: 0, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0, currentScene: "6.1" },

  // Dr Sneha Iyer
  { n: 21, userId: U.sneha, caseId: "CASE_004", score: 88, status: "completed", daysAgo: 31, durationS: 803, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 22, userId: U.sneha, caseId: "CASE_001", score: 84, status: "completed", daysAgo: 17, durationS: 878, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 23, userId: U.sneha, caseId: "CASE_001", score: 80, status: "completed", daysAgo: 6, durationS: 912, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 1 },

  // Dr Priya Nair
  { n: 31, userId: U.priya, caseId: "CASE_004", score: 75, status: "completed", daysAgo: 34, durationS: 934, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 32, userId: U.priya, caseId: "CASE_001", score: 71, status: "completed", daysAgo: 21, durationS: 996, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 1 },
  { n: 33, userId: U.priya, caseId: "CASE_005", score: 67, status: "completed", daysAgo: 11, durationS: 1057, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 2 },

  // Dr Ravi Khan — below the pass mark, and idle for weeks.
  { n: 41, userId: U.ravi, caseId: "CASE_004", score: 62, status: "completed", daysAgo: 42, durationS: 1041, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 2 },
  { n: 42, userId: U.ravi, caseId: "CASE_004", score: 58, status: "completed", daysAgo: 27, durationS: 1132, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 3 },
  { n: 43, userId: U.ravi, caseId: "CASE_001", score: 54, status: "completed", daysAgo: 18, durationS: 1187, mode: "assessment", design: "CR", fixation: "cemented", criticalErrors: 3 },

  // Dr Marco Costa
  { n: 61, userId: U.marco, caseId: "CASE_001", score: 83, status: "completed", daysAgo: 30, durationS: 869, mode: "training", design: "CR", fixation: "cemented", criticalErrors: 0 },
  { n: 62, userId: U.marco, caseId: "CASE_002", score: 80, status: "completed", daysAgo: 16, durationS: 941, mode: "training", design: "PS", fixation: "cemented", criticalErrors: 1 },
  { n: 63, userId: U.marco, caseId: "CASE_003", score: 77, status: "completed", daysAgo: 5, durationS: 1008, mode: "assessment", design: "PS", fixation: "cementless", criticalErrors: 1 },
];

const uuid = (prefix: string, n: number) =>
  `${prefix}-0000-4000-a000-${String(n).padStart(12, "0")}`;

export const SESSIONS: SessionSummary[] = SPECS.map((spec) => {
  const kase = CASE_BY_ID.get(spec.caseId)!;
  const started = new Date(BASE - spec.daysAgo * DAY);
  const live = spec.status === "live";

  return {
    id: uuid("20000000", spec.n),
    planId: uuid("10000000", spec.n),
    userId: spec.userId,
    caseId: spec.caseId,
    caseTitle: kase.title,
    mode: spec.mode,
    difficulty: kase.difficulty,
    design: spec.design,
    fixation: spec.fixation,
    status: spec.status,
    currentScene: spec.currentScene,
    startedAt: live ? minutesAgo(11) : started.toISOString(),
    endedAt: live
      ? undefined
      : new Date(started.getTime() + spec.durationS * 1000).toISOString(),
    durationS: live ? undefined : spec.durationS,
    criticalErrors: spec.criticalErrors,
    totalScore: spec.score,
  };
});

export const SESSION_BY_ID = new Map(SESSIONS.map((s) => [s.id, s]));
export const SPEC_BY_SESSION = new Map(
  SPECS.map((spec) => [uuid("20000000", spec.n), spec]),
);

/**
 * How a total splits across the seven categories.
 *
 * The weakness is deliberate and consistent: bone cuts and gap assessment
 * carry the loss, because that is what the scene outcomes below also say.
 * A report whose categories contradicted its scenes would be worse than no
 * report at all.
 */
const CATEGORY_BIAS: Record<string, number> = {
  preop_planning: 1.08,
  bone_cuts: 0.88,
  gap_assessment: 0.85,
  trialling: 1.02,
  implantation: 1.05,
  patellar: 1.1,
  exposure_closure: 1.12,
};

export function categoriesForScore(total: number) {
  const raw = CATEGORY_META.map((meta) => {
    const scaled = (total / 100) * meta.max * (CATEGORY_BIAS[meta.key] ?? 1);
    return { meta, value: Math.min(meta.max, Math.max(0, scaled)) };
  });

  const rounded = raw.map((r) => ({ ...r, score: Math.round(r.value) }));

  // Push the rounding error onto the largest category so the parts always
  // add up to the headline figure.
  let drift = total - rounded.reduce((sum, r) => sum + r.score, 0);
  for (const row of [...rounded].sort((a, b) => b.meta.max - a.meta.max)) {
    if (drift === 0) break;
    const step = drift > 0 ? 1 : -1;
    const next = row.score + step;
    if (next >= 0 && next <= row.meta.max) {
      row.score = next;
      drift -= step;
    }
  }

  return rounded.map((r) => ({
    key: r.meta.key,
    label: r.meta.label,
    score: r.score,
    max: r.meta.max,
  }));
}

export type ReportRecord = {
  sessionId: string;
  totalScore: number;
  max: number;
  percentile: number;
  categories: { key: string; label: string; score: number; max: number }[];
  generatedAt: string;
};

const scored = SESSIONS.filter((s) => s.totalScore !== undefined);
const ranking = [...scored].sort((a, b) => a.totalScore! - b.totalScore!);

export const REPORTS: ReportRecord[] = scored.map((session) => ({
  sessionId: session.id,
  totalScore: session.totalScore!,
  max: 100,
  percentile: Math.round(
    ((ranking.findIndex((s) => s.id === session.id) + 1) / ranking.length) * 100,
  ),
  categories: categoriesForScore(session.totalScore!),
  generatedAt: new Date(
    new Date(session.endedAt!).getTime() + 14_000,
  ).toISOString(),
}));

export const REPORT_BY_SESSION = new Map(REPORTS.map((r) => [r.sessionId, r]));

/** Scenes a run actually visited, once the variant gates are applied. */
export function scenesForVariant(
  design: ImplantDesign,
  fixation: FixationType,
): SceneRow[] {
  return SCENES.filter((scene) => {
    const note = scene.variantNote;
    if (!note) return true;
    if (note === "PS only") return design === "PS";
    if (note === "Cemented only") return fixation === "cemented";
    if (note === "Cementless only") return fixation === "cementless";
    if (note === "To be authored") return false;
    if (note === "If resurfaced") return true;
    return true;
  });
}

export type SceneResultRecord = {
  sessionId: string;
  part: string;
  scene: string;
  durationS: number;
  outcome: Verdict;
  warnings: number;
  notes?: string[];
};

/** The scenes that degrade first, and the note each carries when it does. */
const WEAK_SCENES: Record<string, { failBelow: number; borderlineBelow: number; note?: string }> = {
  "4.2": { failBelow: 70, borderlineBelow: 85, note: "Saw angled medially at 4.2°" },
  "5.2": { failBelow: 70, borderlineBelow: 85, note: "Cutting block moved during the distal cut" },
  "5.3": { failBelow: 70, borderlineBelow: 85 },
  "6.1": { failBelow: 62, borderlineBelow: 78 },
};

export const SCENE_RESULTS: SceneResultRecord[] = SESSIONS.filter(
  (s) => s.status === "completed" && s.totalScore !== undefined,
).flatMap((session) => {
  const scenes = scenesForVariant(session.design, session.fixation);
  const per = Math.max(20, Math.round((session.durationS ?? 900) / scenes.length));
  const score = session.totalScore!;

  return scenes.map((scene, i) => {
    const rule = WEAK_SCENES[scene.scene];
    const outcome: Verdict = !rule
      ? "pass"
      : score < rule.failBelow
        ? "fail"
        : score < rule.borderlineBelow
          ? "borderline"
          : "pass";

    // A little spread, so the time column is not a flat line.
    const durationS = per + ((i % 5) - 2) * 6;

    return {
      sessionId: session.id,
      part: scene.part,
      scene: scene.scene,
      durationS: Math.max(20, durationS),
      outcome,
      warnings: outcome === "pass" ? 0 : 1,
      notes: outcome !== "pass" && rule?.note ? [rule.note] : undefined,
    };
  });
});

export function sceneResultsFor(sessionId: string): SceneResultRecord[] {
  return SCENE_RESULTS.filter((r) => r.sessionId === sessionId);
}

export function sessionsFor(userId: string): SessionSummary[] {
  return SESSIONS.filter((s) => s.userId === userId).sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? ""),
  );
}

/** Every session an instructor may read — their cohort, plus their own. */
export function sessionsForCohort(cohortId?: string): SessionSummary[] {
  const members = new Set(
    PROFILES.filter((p) => !cohortId || p.cohortId === cohortId).map((p) => p.id),
  );
  return SESSIONS.filter((s) => members.has(s.userId)).sort((a, b) =>
    (b.startedAt ?? "").localeCompare(a.startedAt ?? ""),
  );
}

export type { Difficulty, UserRole, Side };
