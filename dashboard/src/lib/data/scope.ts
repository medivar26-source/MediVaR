/**
 * What the signed-in account may read.
 *
 * One answer, shared by every list that spans more than one learner, so
 * `/sessions` and `/reports` cannot disagree about who the viewer is allowed to
 * see. Kept deliberately small: the moment the store enforces this itself, the
 * three personas collapse back into one query and this file goes away.
 */

import { CURRENT_USER, sessionsFor, sessionsForCohort } from "@/lib/seed";
import { personaFor } from "@/lib/roles";
import type { Profile, SessionSummary } from "@/lib/types";

export function visibleSessions(user?: Profile): SessionSummary[] {
  const activeUser = user ?? CURRENT_USER;
  const persona = personaFor(activeUser.role);
  if (persona === "learner") return sessionsFor(activeUser.id);
  return sessionsForCohort();
}
