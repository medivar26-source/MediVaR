/**
 * Plans as the backend stores them, turned into the dashboard's own `PlanRecord`. Pure (no fetch, no cookies),
 * so the mapping and the rules around it can be tested and used on either side of the server boundary.
 *
 * Where a plan lives:
 *   - a plan for a case in the library, or one of the learner's own cases, is a row in the database
 *     (`plans`, migration 013) and survives a restart. Its id is the row's id.
 *   - a plan for a built-in practice case cannot be a row (those cases are not rows either), so it is kept
 *     in the dashboard server's memory and is lost when the server restarts. The planner says so.
 */

import type { PlanPayload, PlanSnapshot } from "@/lib/plan";
import type { PinLifecycle } from "@/lib/data/settings";
import type { PlanRecord } from "@/lib/data/plans";
import type { Difficulty, SimMode } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True for an id the database could hold. Built-in practice cases use readable ids (CASE_001) and never match. */
export function isStoredId(id: string): boolean {
  return UUID.test(id);
}

/** True when this plan is a database row (and so survives a restart). */
export function isStoredPlan(plan: Pick<PlanRecord, "dbPlanId">): boolean {
  return plan.dbPlanId !== undefined;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): string | undefined => (typeof v === "string" && v !== "" ? v : undefined);

/** One row of GET /plans or GET /plans/{id}. */
export function planFromApi(row: Record<string, unknown>): PlanRecord {
  const payload = (isObject(row.payload) ? row.payload : {}) as PlanPayload;
  const locked = isObject(row.locked) ? row.locked : undefined;
  const lockedVersion: PlanSnapshot | undefined = locked
    ? {
        versionId: String(locked.version_id),
        sealedBy: text(locked.sealed_by) ?? "",
        sealedAt: text(locked.sealed_at) ?? "",
        // A locked plan's payload never changes, so the list (which leaves the snapshot out) can use it as is.
        payload: (isObject(locked.payload) ? locked.payload : payload) as PlanPayload,
      }
    : undefined;
  const headset = isObject(row.headset)
    ? {
        status: String(row.headset.status),
        codeExpiresAt: text(row.headset.code_expires_at),
        pairedAt: text(row.headset.paired_at),
        // Only when the backend sent them (older rows and the tests' fixtures have neither).
        ...(text(row.headset.id) ? { id: text(row.headset.id) } : {}),
        ...(text(row.headset.device_name) ? { deviceName: text(row.headset.device_name) } : {}),
      }
    : undefined;
  const timings = isObject(row.step_timings) ? row.step_timings : {};

  return {
    id: String(row.id),
    userId: String(row.owner_id),
    caseId: String(row.case_id),
    payload,
    stepTimings: Object.fromEntries(Object.entries(timings).filter(([, v]) => typeof v === "number")) as Record<string, number>,
    isReadyForVr: row.status === "locked",
    presetName: text(row.preset_name),
    createdAt: text(row.created_at) ?? "",
    updatedAt: text(row.updated_at) ?? "",
    lockedVersion,
    dbPlanId: String(row.id),
    isPersonalCase: row.is_personal_case === true,
    attemptId: text(row.attempt_id),
    headset,
  };
}

/** The pairing code's lifecycle for a plan's newest headset assignment, or none. Never carries the digits. */
export function pinFromHeadset(
  headset: PlanRecord["headset"],
  plan: { id: string; caseId: string },
  caseTitle: string,
  sessionId?: string,
): PinLifecycle | undefined {
  if (!headset) return undefined;
  const expiresAt = headset.codeExpiresAt ?? headset.pairedAt ?? "";
  const link = { assignmentId: headset.id, deviceName: headset.deviceName };
  switch (headset.status) {
    case "pending":
      return { planId: plan.id, caseId: plan.caseId, caseTitle, sessionId, expiresAt, state: "live", ...link, connected: true };
    case "expired":
      return { planId: plan.id, caseId: plan.caseId, caseTitle, sessionId, expiresAt, state: "expired", ...link };
    case "paired":
    case "running":
      return { planId: plan.id, caseId: plan.caseId, caseTitle, sessionId, expiresAt, redeemedAt: headset.pairedAt, state: "redeemed", ...link, connected: true };
    case "reported":
      return { planId: plan.id, caseId: plan.caseId, caseTitle, sessionId, expiresAt, redeemedAt: headset.pairedAt, state: "redeemed", ...link };
    default:
      return undefined; // a replaced (cancelled) code is not a pairing
  }
}

const MODES: SimMode[] = ["training", "assessment"];
const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "expert"];

/**
 * The setup a new plan starts with. Mode and difficulty keep their long-standing defaults when the case setup
 * sent nothing usable; the implant design and fixation never get one (the headset runs what was chosen).
 */
export function newPlanSetup(input: {
  mode?: string | null;
  difficulty?: string | null;
  design?: string | null;
  fixation?: string | null;
}): { mode: SimMode; difficulty: Difficulty; implant_design?: "CR" | "PS"; fixation?: "cemented" | "cementless" } {
  const mode = MODES.find((m) => m === input.mode) ?? "training";
  const difficulty = DIFFICULTIES.find((d) => d === input.difficulty) ?? "intermediate";
  return {
    mode,
    difficulty,
    ...(input.design === "CR" || input.design === "PS" ? { implant_design: input.design } : {}),
    ...(input.fixation === "cemented" || input.fixation === "cementless" ? { fixation: input.fixation } : {}),
  };
}
