/**
 * Server-side rules for changing and locking a plan.
 *
 * V1 (PDF p.3, p.6): Continue on Page 1 hard-locks the assessment; a locked plan can no longer be modified
 * in the 2-D software. These rules are pure so the server actions can enforce them and tests can pin them;
 * a hidden button or a read-only React flag is not a lock.
 */

import type { PlanPayload } from "@/lib/plan";
import { V1_FEMORAL_SIZES, V1_TIBIAL_SIZES } from "./implant_templates/dimensions";

type PlanState = { isReadyForVr: boolean; lockedVersion?: unknown; payload: PlanPayload };

/** The only payload keys the planner screens write. Anything else (notably `v1_vr_payload`) is refused. */
export const WRITABLE_PLAN_KEYS = [
  "v1_assessment",
  "assessment_landmarks",
  "scan_calibration",
  "v1_tibial",
  "tibial_planning",
  "v1_femoral",
  "femoral_planning",
] as const;

/** Keys that Continue on Page 1 freezes: the measured values, their points, and the scan scales they used. */
export const ASSESSMENT_LOCKED_KEYS = ["v1_assessment", "assessment_landmarks", "scan_calibration"] as const;

export type Check = { ok: true } | { ok: false; error: string };

export const isPlanLocked = (plan: PlanState) => plan.isReadyForVr || plan.lockedVersion !== undefined;

export function checkPlanUpdate(plan: PlanState, updates: Record<string, unknown>): Check {
  if (isPlanLocked(plan)) {
    return { ok: false, error: "This plan is locked. Once locked, parameters cannot be modified in 2D software." };
  }
  const keys = Object.keys(updates);
  const unknown = keys.filter((k) => !(WRITABLE_PLAN_KEYS as readonly string[]).includes(k));
  if (unknown.length > 0) {
    return { ok: false, error: `These plan fields cannot be written from the planner: ${unknown.join(", ")}.` };
  }
  if (plan.payload.v1_assessment && keys.some((k) => (ASSESSMENT_LOCKED_KEYS as readonly string[]).includes(k))) {
    return { ok: false, error: "The assessment is locked. Continuing to Tibial Planning locked it; start a new plan to measure again." };
  }
  return { ok: true };
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Can this plan be sealed? Pure checks on what is stored; scale verification is checked by the caller. */
export function checkSealable(plan: PlanState): Check {
  if (isPlanLocked(plan)) return { ok: false, error: "This plan is already locked." };
  const p = plan.payload;
  const a = p.v1_assessment;
  if (!a) return { ok: false, error: "The assessment is not finished. Place the points and measure the leg first." };
  const six = [a.MAD_mm, a.AMA_deg, a.mHKA_deg, a.MPTA_deg, a.LDFA_deg, a.PTS_deg];
  if (!six.every(finite)) return { ok: false, error: "The assessment has a missing or invalid value." };

  const t = p.v1_tibial;
  if (!t?.is_confirmed) return { ok: false, error: "The tibial tray is not confirmed yet." };
  if (!(V1_TIBIAL_SIZES as readonly number[]).includes(t.implant_size)) return { ok: false, error: "The tibial size is not one of V1 sizes 1 to 6." };
  const f = p.v1_femoral;
  if (!f?.is_confirmed) return { ok: false, error: "The femoral component is not confirmed yet." };
  if (!(V1_FEMORAL_SIZES as readonly number[]).includes(f.implant_size)) return { ok: false, error: "The femoral size is not one of V1 sizes 1 to 8." };

  for (const [name, pos] of [["tibial", t.position_2d], ["femoral", f.position_2d]] as const) {
    if (!pos || !finite(pos.x_offset_mm) || !finite(pos.y_offset_mm) || !finite(pos.rotation_deg)) {
      return { ok: false, error: `The ${name} position has a missing or invalid value.` };
    }
  }
  return { ok: true };
}
