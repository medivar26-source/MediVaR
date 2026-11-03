/**
 * What the signed-in account may read.
 *
 * One answer, shared by every list that spans more than one learner, so
 * `/sessions` and `/reports` cannot disagree about who the viewer is allowed to
 * see. Kept deliberately small: the moment the store enforces this itself, the
 * three personas collapse back into one query and this file goes away.
 */

import { CURRENT_USER } from "@/lib/seed";
import { personaFor } from "@/lib/roles";
import type { Profile, SessionSummary } from "@/lib/types";
import { resultsFor, sessionsOf, sessionsOfCohort } from "./results";

/**
 * A learner: their own runs. Staff: every run their results hold. The backend has already scoped a real
 * account's results (a cohort owner's learners, an administrator's institution); the sample instructor
 * reads the sample learners'.
 */
export async function visibleSessions(user?: Profile): Promise<SessionSummary[]> {
  const activeUser = user ?? CURRENT_USER;
  const data = await resultsFor(activeUser.id);
  if (personaFor(activeUser.role) === "learner") return sessionsOf(data, activeUser.id);
  return sessionsOfCohort(data);
}
