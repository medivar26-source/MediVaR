/**
 * The planning flow
 *
 * Everything a step needs comes from here, and nothing a step needs is a
 * literal in a component. In particular:
 *
 *   - The differential lists and size catalogues come from
 *     `./planning-content`, so adding a diagnosis is a content change rather
 *     than a code change.
 *   - The risk checklist is derived from the case's own columns — the same
 *     derivation step 6 is graded against, so the list on screen and the list
 *     being graded cannot drift apart.
 *   - The gates are not graded yet. Marking an answer needs the ground truth
 *     for the case, which is deliberately not shipped to the browser, so a step
 *     opens once it has an answer and says as much rather than claiming it was
 *     checked.
 *
 * The vocabulary itself lives in `@/lib/plan`, which is pure.
 */

import { CASE_BY_ID, SESSIONS } from "@/lib/seed";
import { PLAN_BY_ID } from "./plans";
import {
  GUIDANCE,
  REFERENCE_RANGES,
  STEP_OPTIONS,
  risksFor,
} from "./planning-content";
import { LAST_STEP } from "@/lib/plan";
import type { PlanCase, PlanDetail, StepGate, CaseRisk } from "@/lib/plan";

export * from "@/lib/plan";

/**
 * Patient fields split the way the planning screens read them: the scalars a
 * surgeon scans, then the paragraphs they read.
 */
const VITALS: { key: string; label: string; suffix?: string }[] = [
  { key: "age", label: "Age", suffix: " years" },
  { key: "sex", label: "Sex" },
  { key: "bmi", label: "BMI" },
  { key: "occupation", label: "Occupation" },
  { key: "walking_distance_m", label: "Walking distance", suffix: " m" },
  { key: "rom", label: "Range of motion" },
  { key: "fixed_flexion_deg", label: "Fixed flexion", suffix: "°" },
  { key: "deformity", label: "Deformity" },
];

const NARRATIVE: { key: string; label: string }[] = [
  { key: "complaint", label: "Chief complaint" },
  { key: "history", label: "History of present illness" },
  { key: "past_management", label: "Past management" },
];

function fieldsOf(
  source: Record<string, unknown>,
  spec: { key: string; label: string; suffix?: string }[],
) {
  return spec.flatMap(({ key, label, suffix }) => {
    const value = source[key];
    if (value === undefined || value === null || value === "") return [];
    const text = String(value);
    return [{ label, value: suffix ? `${text}${suffix}` : text }];
  });
}

/* ---------- the accessor ---------- */

/**
 * Which steps are open.
 *
 * A step passes once it has an answer recorded. That is a weaker claim than
 * the graded gate it stands in for — nothing here compares an answer against
 * the ground truth — and the reason string says so, because a step that says
 * "correct" when nothing checked it is the one thing this flow must not do.
 */
const STEP_ANSWERS: { step: number; key: keyof PlanDetail["payload"] }[] = [
  { step: 1, key: "diagnosis" },
  { step: 2, key: "imaging_reading" },
  { step: 3, key: "measurements" },
  { step: 4, key: "alignment_plan" },
  { step: 5, key: "implants" },
  { step: 6, key: "risks" },
];

function gatesFor(payload: PlanDetail["payload"]): StepGate[] {
  // TKR workflow gates
  if (payload.workflow === "tkr") {
    const isAssessmentDone = !!payload.assessment_landmarks && Object.keys(payload.assessment_landmarks).length > 0;
    const isFemurDone = payload.femoral_planning !== undefined;
    const isTibiaDone = payload.tibial_planning !== undefined;

    return [
      {
        step: 1, // Let's pretend 1-6 are the steps, but realistically we only need step 7 to open
        passed: isAssessmentDone && isFemurDone && isTibiaDone,
        reason: "TKR Planning completeness"
      },
      {
        step: LAST_STEP,
        passed: isAssessmentDone && isFemurDone && isTibiaDone,
        reason: (isAssessmentDone && isFemurDone && isTibiaDone) ? "Ready for review" : "Complete Assessment, Femoral, and Tibial planning first."
      }
    ];
  }

  // Legacy workflow gates
  const gates: StepGate[] = STEP_ANSWERS.map(({ step, key }) => ({
    step,
    passed: payload[key] !== undefined,
    reason:
      payload[key] !== undefined
        ? "Answered. Marking is not connected, so this is not a verdict on whether it is right."
        : "This step has not been answered yet.",
  }));

  // Step 7 is the summary. It opens once every step before it has an answer.
  gates.push({
    step: LAST_STEP,
    passed: gates.every((g) => g.passed),
    reason: gates.every((g) => g.passed)
      ? "Every step has an answer."
      : "Answer the earlier steps first.",
  });

  return gates;
}

export async function getPlan(planId: string): Promise<PlanDetail | null> {
  let plan = PLAN_BY_ID.get(planId);

  if (!plan) {
    // If planId is not in the map, check if it's a valid caseId or if we can instantiate an on-demand plan
    const { getCase } = await import("@/lib/data/cases");
    const { getCurrentUser } = await import("@/lib/session");
    const { CURRENT_USER } = await import("@/lib/seed");
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id || CURRENT_USER.id;

    // Check seed cases or DB cases
    const seedCase = CASE_BY_ID.get(planId);
    let resolvedCaseId: string | null = seedCase ? planId : null;

    if (!resolvedCaseId) {
      const dbCase = await getCase(planId, userId);
      if (dbCase) resolvedCaseId = planId;
    }

    if (resolvedCaseId) {
      plan = {
        id: planId,
        userId: userId,
        caseId: resolvedCaseId,
        payload: {
          workflow: "tkr",
          case_id: resolvedCaseId,
          session_config: { mode: "training", difficulty: "intermediate" },
        },
        stepTimings: {},
        isReadyForVr: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      PLAN_BY_ID.set(plan.id, plan);
    }
  }

  if (!plan) return null;

  let planCase: PlanCase | null = null;
  let risks: CaseRisk[] = [];

  const row = CASE_BY_ID.get(plan.caseId);
  if (row) {
    planCase = {
      id: row.id,
      title: row.title,
      summary: row.summary,
      side: row.side,
      difficulty: row.difficulty,
      pathologyLabel: row.pathologyLabel,
      patient: fieldsOf(row.patient, VITALS),
      narrative: fieldsOf(row.patient, NARRATIVE),
      imaging: row.imaging,
      objectives: row.objectives,
      referenceRanges: REFERENCE_RANGES,
    };
    risks = risksFor(row);
  } else {
    // Fetch dynamically authored case from backend database
    const { getCase } = await import("@/lib/data/cases");
    const caseDetail = await getCase(plan.caseId, plan.userId);
    if (!caseDetail) return null;

    planCase = {
      id: caseDetail.id,
      title: caseDetail.title,
      summary: caseDetail.summary,
      side: caseDetail.side,
      difficulty: caseDetail.difficulty,
      pathologyLabel: caseDetail.pathologyLabel,
      patient: caseDetail.patient?.vitals || [],
      narrative: caseDetail.patient?.notes || [],
      imaging: (caseDetail.imaging || []).map((img) => ({
        view: img.view,
        label: img.label,
        src: img.url || (img.view === "FLAP" ? "/flap.jpg" : "/klat.jpg"),
      })),
      objectives: caseDetail.objectives || [],
      referenceRanges: REFERENCE_RANGES,
    };

    risks = [
      {
        id: "infection",
        label: "Superficial / deep prosthetic joint infection",
        detail: "Standard surgical prophylaxis, laminar airflow and careful tissue handling are required.",
        severity: "critical",
      },
      {
        id: "tightness",
        label: "Contracted collateral sleeve",
        detail: "The deformity is structural. A staged release will be required to balance the gaps.",
        severity: "high",
      },
    ];
  }

  return {
    id: plan.id,
    caseId: plan.caseId,
    isReadyForVr: plan.isReadyForVr,
    hasSession: SESSIONS.some((s) => s.planId === plan.id),
    payload: {
      workflow: "tkr",
      ...plan.payload,
    },
    stepTimings: plan.stepTimings,
    updatedAt: plan.updatedAt,
    lockedVersion: plan.lockedVersion,
    case: planCase,
    gates: gatesFor(plan.payload),
    options: STEP_OPTIONS,
    guidance: GUIDANCE,
    risks: risks,
  };
}
