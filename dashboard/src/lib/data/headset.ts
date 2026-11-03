/**
 * The headset link for one plan, read from the backend for the review page.
 *
 * Read per request and never cached across requests: the status changes while the headset works.
 * A backend without the connectivity tables answers 404 "not set up"; that is `available: false`, and the page
 * says so instead of offering a button that cannot work.
 */

import { ApiError, apiClient } from "@/lib/api-client";
import { assignmentFromApi, lockedPlanBody, type HeadsetLink } from "@/lib/headset-link";
import { CASE_BY_ID } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";
import { PLAN_BY_ID } from "./plans";

export async function getHeadsetLink(planId: string, opts: { isPersonalCase?: boolean } = {}): Promise<HeadsetLink> {
  const user = await getCurrentUser();
  const plan = PLAN_BY_ID.get(planId);
  if (!plan || plan.userId !== user.id) return { available: false, assignments: [] };

  const check = lockedPlanBody({
    caseId: plan.caseId,
    isPersonalCase: opts.isPersonalCase === true,
    isBuiltInCase: CASE_BY_ID.has(plan.caseId),
    lockedVersion: plan.lockedVersion,
    stepTimings: plan.stepTimings,
  });
  // Missing setup choices are asked for in the panel; anything else stops the send.
  // Once stored, the backend already holds the choices made at the first send: do not ask again.
  const needs = "error" in check && !plan.dbPlanId ? check.needs : undefined;
  const blocker = "error" in check && !check.needs ? check.error : undefined;

  try {
    // Without a stored copy there is nothing to list for this plan, but the call still tells us whether the
    // backend has the link at all.
    const rows = (await apiClient.get(
      plan.dbPlanId ? `/assignments?plan_id=${encodeURIComponent(plan.dbPlanId)}` : "/assignments",
    )) as Record<string, unknown>[];
    const assignments = plan.dbPlanId ? rows.map(assignmentFromApi) : [];
    return { available: true, blocker, needs, assignments };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return { available: false, blocker, needs, assignments: [] };
    // The backend is down or refused: show the button anyway; pressing it reports the real error.
    return { available: true, blocker, needs, assignments: [] };
  }
}
