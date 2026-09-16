/**
 * `/plans` — the learner's own planning work, and where each plan has got to.
 *
 * The nav offers My plans, Ready for VR and Pairing PINs.
 * They are one list with three filters, not three screens: a plan is a draft, or
 * sealed and waiting for a headset, or performed, and the pairing state is a
 * column of that list rather than a separate subject.
 */

import type { PlanPayload, PlanState } from "@/lib/plan";
import { pinState, type PinLifecycle } from "./settings";
import type { SimMode } from "@/lib/types";
import {
  CASE_BY_ID,
  CURRENT_USER,
  SESSIONS,
  daysAgo,
  minutesAgo,
} from "@/lib/seed";

export type PlanRow = {
  id: string;
  caseId: string;
  caseTitle: string;
  difficulty: string;
  mode: string;
  createdAt: string;
  updatedAt: string;
  state: PlanState;
  /** Steps with an answer recorded. Not a gate verdict — that is server-side. */
  stepsAnswered: number;
  /** Seconds spent across every step, from `step_timings`. */
  secondsSpent: number;
  sessionId?: string;
  presetName?: string;
  pin?: PinLifecycle;
};

/** The six sub-objects a step writes. Step 7 is a summary and writes nothing. */
const STEP_KEYS = [
  "diagnosis",
  "imaging_reading",
  "measurements",
  "alignment_plan",
  "implants",
  "risks",
];

export type PlanRecord = {
  id: string;
  userId: string;
  caseId: string;
  payload: PlanPayload;
  stepTimings: Record<string, number>;
  isReadyForVr: boolean;
  presetName?: string;
  createdAt: string;
  updatedAt: string;
};

const FULL_TIMINGS = { "1": 54, "2": 108, "3": 61, "4": 57, "5": 49, "6": 38, "7": 17 };

/** A plan that answered every step, ready to be sealed. */
function completePayload(caseId: string, mode: SimMode): PlanPayload {
  const kase = CASE_BY_ID.get(caseId);
  return {
    case_id: caseId,
    session_config: {
      mode,
      difficulty: kase?.difficulty,
      implant_design: "CR",
      fixation: "cemented",
    },
    diagnosis: "primary_oa_varus",
    imaging_reading: { kl_grade: "4", compartment: "medial" },
    measurements: { hka_deg: 8.2, mad_mm: 24, mpta_deg: 84, mldfa_deg: 88, jlca_deg: 3, ldta_deg: 89 },
    alignment_plan: {
      target_hka_deg: 0,
      planned_correction_deg: 8.2,
      resection_strategy: "mechanical",
    },
    resections: {
      distal_femur_mm: 9,
      proximal_tibia_medial_mm: 8,
      posterior_tibial_slope_deg: 3,
      distal_femur_valgus_deg: 5,
    },
    implants: { design: "CR", femoral_size: 4, tibial_tray_size: 4, pe_insert_mm: 10 },
    risks: { acknowledged: ["medial_release", "flexion_contracture"], tight_side: "medial" },
  };
}

/**
 * Every plan in the seed.
 *
 * One is created per performed session so a report can always be read back to
 * the plan it was scored against, plus the signed-in account's own work in
 * progress.
 */
export const PLANS: PlanRecord[] = [
  ...SESSIONS.map((session, i) => ({
    id: session.planId,
    userId: session.userId,
    caseId: session.caseId,
    payload: completePayload(session.caseId, session.mode),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    presetName: i % 3 === 0 ? "Exam conditions" : undefined,
    createdAt: session.startedAt ?? daysAgo(30),
    updatedAt: session.startedAt ?? daysAgo(30),
  })),

  // The signed-in account's own bench: two drafts, one sealed, one paired.
  {
    id: "10000000-0000-4000-a000-000000000901",
    userId: CURRENT_USER.id,
    caseId: "CASE_003",
    payload: {
      case_id: "CASE_003",
      session_config: { mode: "training", difficulty: "expert" },
      diagnosis: "post_traumatic",
      imaging_reading: { kl_grade: "4", compartment: "medial" },
    },
    stepTimings: { "1": 61, "2": 96 },
    isReadyForVr: false,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: "10000000-0000-4000-a000-000000000902",
    userId: CURRENT_USER.id,
    caseId: "CASE_005",
    payload: {
      case_id: "CASE_005",
      session_config: { mode: "assessment", difficulty: "expert" },
      diagnosis: "primary_oa_varus_severe",
    },
    stepTimings: { "1": 48 },
    isReadyForVr: false,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
  },
  {
    id: "10000000-0000-4000-a000-000000000903",
    userId: CURRENT_USER.id,
    caseId: "CASE_001",
    payload: completePayload("CASE_001", "training"),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
  },
  {
    id: "10000000-0000-4000-a000-000000000904",
    userId: CURRENT_USER.id,
    caseId: "CASE_004",
    payload: completePayload("CASE_004", "assessment"),
    stepTimings: FULL_TIMINGS,
    isReadyForVr: true,
    presetName: "Exam conditions",
    createdAt: daysAgo(1),
    updatedAt: minutesAgo(46),
  },
];

export const PLAN_BY_ID = new Map(PLANS.map((p) => [p.id, p]));

/**
 * Pairing PINs. A PIN lives for thirty minutes, so only the most recent one is
 * still alive; the rest are here so the lifecycle column has something to say.
 */
type PinRecord = {
  planId: string;
  caseId: string;
  caseTitle: string;
  sessionId?: string;
  expiresAt: string;
  redeemedAt?: string;
};

export const PINS: PinRecord[] = [
  {
    planId: "10000000-0000-4000-a000-000000000904",
    caseId: "CASE_004",
    caseTitle: CASE_BY_ID.get("CASE_004")!.title,
    expiresAt: minutesAgo(-16),
  },
  {
    planId: "10000000-0000-4000-a000-000000000903",
    caseId: "CASE_001",
    caseTitle: CASE_BY_ID.get("CASE_001")!.title,
    expiresAt: daysAgo(3),
  },
];

export type PlansView = {
  plans: PlanRow[];
  counts: Record<PlanState, number>;
};

export async function getPlans(state?: PlanState): Promise<PlansView> {
  const mine = PLANS.filter((plan) => plan.userId === CURRENT_USER.id);

  const rows: PlanRow[] = mine.map((plan) => {
    const kase = CASE_BY_ID.get(plan.caseId);
    const config = plan.payload.session_config;
    const session = SESSIONS.find((s) => s.planId === plan.id);

    const pinRow = PINS.find((p) => p.planId === plan.id);
    const pin: PinLifecycle | undefined = pinRow
      ? {
          planId: pinRow.planId,
          caseId: pinRow.caseId,
          caseTitle: pinRow.caseTitle,
          sessionId: pinRow.sessionId,
          expiresAt: pinRow.expiresAt,
          redeemedAt: pinRow.redeemedAt,
          state: pinState({
            expiresAt: pinRow.expiresAt,
            redeemedAt: pinRow.redeemedAt,
          }),
        }
      : undefined;

    const payload = plan.payload as unknown as Record<string, unknown>;

    return {
      id: plan.id,
      caseId: plan.caseId,
      caseTitle: kase?.title ?? plan.caseId,
      difficulty: config?.difficulty ?? kase?.difficulty ?? "intermediate",
      mode: config?.mode ?? "training",
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      state: session
        ? "performed"
        : pin?.state === "live"
          ? "paired"
          : plan.isReadyForVr
            ? "ready"
            : "draft",
      stepsAnswered: STEP_KEYS.filter((key) => payload[key] !== undefined).length,
      secondsSpent: Object.values(plan.stepTimings).reduce(
        (sum, value) => sum + (Number(value) || 0),
        0,
      ),
      sessionId: session?.id,
      presetName: plan.presetName,
      pin,
    };
  });

  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const counts = {
    draft: rows.filter((r) => r.state === "draft").length,
    ready: rows.filter((r) => r.state === "ready").length,
    paired: rows.filter((r) => r.state === "paired").length,
    performed: rows.filter((r) => r.state === "performed").length,
  };

  return {
    plans: state ? rows.filter((r) => r.state === state) : rows,
    counts,
  };
}
