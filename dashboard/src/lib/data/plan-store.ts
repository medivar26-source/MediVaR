/**
 * Where plans are kept.
 *
 * A plan for a library case or one of the learner's own cases is stored by the backend (`/plans`, table
 * `plans`) and is read from there on every request. Nothing is cached across requests: a plan changes while
 * someone works on it. A plan for a built-in practice case cannot be stored (those cases are not database
 * rows), so it stays in this server's memory (`PLANS`) and is lost on restart; the planner says so.
 *
 * A failure to reach the backend is never turned into "not found" or "no plans": that is the lie that made a
 * restart look like lost work. Reads that only decorate a page catch the error themselves.
 */

import { cache } from "react";
import { ApiError, apiClient } from "@/lib/api-client";
import { planFromApi, isStoredId, newPlanSetup } from "@/lib/plan-api";
import { getCurrentUser } from "@/lib/session";
import { PLAN_BY_ID, PLANS, type PlanRecord } from "./plans";

const NOT_SET_UP = "Plans cannot be saved on this server yet: the database has no plans table (migration 013).";

function describe(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 404 && /not set up/i.test(err.message)) return NOT_SET_UP;
    return typeof err.message === "string" && err.message ? err.message : fallback;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

/** One plan by id: a built-in practice plan from memory, otherwise the stored one. Undefined when there is none the caller may read. */
export async function findPlan(id: string): Promise<PlanRecord | undefined> {
  const inMemory = PLAN_BY_ID.get(id);
  if (inMemory) return inMemory;
  if (!isStoredId(id)) return undefined;
  try {
    return planFromApi((await apiClient.get(`/plans/${id}`)) as Record<string, unknown>);
  } catch (err) {
    // 404 covers "no such plan", "not yours" and "no plans table"; the first two are the same answer by design.
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

/** The signed-in user's plans: stored ones from the backend, then any built-in practice plans in memory. */
export async function fetchMyPlans(userId: string): Promise<PlanRecord[]> {
  const memory = PLANS.filter((plan) => plan.userId === userId);
  const user = await getCurrentUser();
  // The backend answers for the signed-in account only; another id's stored plans are not this caller's to list.
  if (user.id !== userId) return memory;
  try {
    const rows = (await apiClient.get("/plans")) as Record<string, unknown>[];
    return [...rows.map(planFromApi), ...memory];
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return memory; // no plans table: nothing stored to list
    throw err;
  }
}

/** The same, once per request, for the screens that only display plans (a failure there is logged, not fatal). */
const listMine = cache(async (userId: string): Promise<PlanRecord[]> => fetchMyPlans(userId));

export async function listMyPlans(userId: string): Promise<PlanRecord[]> {
  try {
    return await listMine(userId);
  } catch (err) {
    console.warn("Could not read plans from the backend:", err);
    return PLANS.filter((plan) => plan.userId === userId);
  }
}

/** Plans the signed-in instructor's learners made against one case (and, in memory, built-in practice plans). */
export async function listLearnerPlansForCase(caseId: string, learnerIds: Set<string>): Promise<PlanRecord[]> {
  const memory = PLANS.filter((plan) => plan.caseId === caseId && learnerIds.has(plan.userId));
  if (!isStoredId(caseId)) return memory;
  try {
    const rows = (await apiClient.get(`/plans?case_id=${encodeURIComponent(caseId)}&supervised=true`)) as Record<string, unknown>[];
    return [...rows.map(planFromApi).filter((plan) => learnerIds.has(plan.userId)), ...memory];
  } catch (err) {
    console.warn("Could not read learners' plans from the backend:", err);
    return memory;
  }
}

export type StoreOutcome<T> = { ok: true; value: T } | { ok: false; error: string };

/** Start a stored draft for a library or personal case. The server decides which of the two the id is. */
export async function createStoredPlan(caseId: string, setup: ReturnType<typeof newPlanSetup>): Promise<StoreOutcome<PlanRecord>> {
  try {
    const row = (await apiClient.post("/plans", { case_id: caseId, session_config: setup })) as Record<string, unknown>;
    return { ok: true, value: planFromApi(row) };
  } catch (err) {
    return { ok: false, error: describe(err, "The plan could not be started.") };
  }
}

/** Save planner work into a stored draft. The backend merges the keys and refuses a locked plan. */
export async function saveStoredPayload(planId: string, updates: Record<string, unknown>): Promise<StoreOutcome<PlanRecord>> {
  try {
    const row = (await apiClient.patch(`/plans/${planId}`, { payload: updates })) as Record<string, unknown>;
    return { ok: true, value: planFromApi(row) };
  } catch (err) {
    return { ok: false, error: describe(err, "The plan could not be saved.") };
  }
}

/** Seal a stored draft; the backend freezes what it holds and records the VR payload. */
export async function lockStoredPlan(
  planId: string,
  vrPayload: unknown,
  chosen: { implant_design?: string; fixation?: string },
): Promise<StoreOutcome<PlanRecord>> {
  try {
    const row = (await apiClient.post(`/plans/${planId}/lock`, { vr_payload: vrPayload, session_config: chosen })) as Record<string, unknown>;
    return { ok: true, value: planFromApi(row) };
  } catch (err) {
    return { ok: false, error: describe(err, "The plan could not be locked.") };
  }
}
