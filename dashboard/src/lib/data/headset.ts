/**
 * The headset link for one plan, read from the backend for the review page.
 *
 * Read per request and never cached across requests: the status changes while the headset works.
 * A backend without the connectivity tables answers 404 "not set up"; that is `available: false`, and the page
 * says so instead of offering a button that cannot work.
 */

import { ApiError, apiClient } from "@/lib/api-client";
import { BUILT_IN_NOT_SENDABLE, assignmentFromApi, type HeadsetLink } from "@/lib/headset-link";
import { isStoredPlan } from "@/lib/plan-api";
import { getCurrentUser } from "@/lib/session";
import { findPlan } from "./plan-store";

export async function getHeadsetLink(planId: string): Promise<HeadsetLink> {
  const user = await getCurrentUser();
  const plan = await findPlan(planId);
  if (!plan || plan.userId !== user.id) return { available: false, assignments: [] };

  // A built-in practice plan is not a database row, so a headset has nothing to load.
  if (!isStoredPlan(plan)) return { available: true, blocker: BUILT_IN_NOT_SENDABLE, assignments: [] };

  try {
    const rows = (await apiClient.get(`/assignments?plan_id=${encodeURIComponent(plan.id)}`)) as Record<string, unknown>[];
    return { available: true, assignments: rows.map(assignmentFromApi) };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { available: false, assignments: [] };
    // The backend is down or refused: show the button anyway; pressing it reports the real error.
    return { available: true, assignments: [] };
  }
}
