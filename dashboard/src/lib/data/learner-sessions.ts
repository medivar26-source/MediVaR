/**
 * One answer to "which sessions does this learner have?".
 *
 * Before this, the Sessions list read the API's scheduled sessions plus the sample
 * data, the Program page read the sample data of whoever the fallback account was,
 * and case, nav and progress pages read the sample data only. The same learner saw
 * a different set of sessions on each screen. Every learner-facing read goes
 * through here now, so the counts agree.
 *
 * Nothing is invented: API sessions carry no score and no report, so they list as
 * sessions without one. A report is linked only where one exists (`session-links`).
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { personaFor } from "@/lib/roles";
import { sessionsFor } from "@/lib/seed";
import { getCurrentUser } from "@/lib/session";
import type { SessionSummary } from "@/lib/types";
import { toSessionSummary } from "./cohorts";
import { apiListSessions } from "./residents-api";
import { normalizeStatus } from "./session-order";

/**
 * The learner's own sessions: the ones scheduled for them (API) and the sample
 * history for their id. Only the signed-in learner's own list is read from the API;
 * any other id (a staff member opening a learner's plan) gets the sample data only.
 */
export const getLearnerSessions = cache(async (userId: string): Promise<SessionSummary[]> => {
  const viewer = await getCurrentUser();
  let fromApi: SessionSummary[] = [];

  if (viewer.id === userId && personaFor(viewer.role) === "learner") {
    try {
      const token = (await cookies()).get("mediver-token")?.value;
      if (token) {
        const raw = await apiListSessions(token, userId);
        // The API says "in_progress"; this product's own word for it is "live".
        fromApi = raw.map(toSessionSummary).map((row) => ({
          ...row,
          status: normalizeStatus(row.status),
        })) as unknown as SessionSummary[];
      }
    } catch (err) {
      console.warn("Failed to fetch sessions from API:", err);
    }
  }

  // Newest first, so "latest" and "recent" mean the same thing on every screen.
  const when = (row: SessionSummary) =>
    Date.parse(row.startedAt ?? row.endedAt ?? row.scheduledAt ?? "") || 0;
  return [...fromApi, ...sessionsFor(userId)].sort((a, b) => when(b) - when(a));
});
