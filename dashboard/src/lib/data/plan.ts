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
import type { PlanDetail, StepGate } from "@/lib/plan";

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
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;

  const row = CASE_BY_ID.get(plan.caseId);
  if (!row) return null;

  return {
    id: plan.id,
    caseId: plan.caseId,
    isReadyForVr: plan.isReadyForVr,
    hasSession: SESSIONS.some((s) => s.planId === plan.id),
    payload: plan.payload,
    stepTimings: plan.stepTimings,
    updatedAt: plan.updatedAt,
    case: {
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
    },
    gates: gatesFor(plan.payload),
    options: STEP_OPTIONS,
    guidance: GUIDANCE,
    risks: risksFor(row),
  };
}
