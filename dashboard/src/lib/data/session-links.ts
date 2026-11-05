/**
 * What can be said about a session, and where each of its pages is.
 *
 * Pure, so the rules are testable without a request. A session, its case, its plan
 * and its report are four different pages; this is the one place that decides which
 * of them exist for a given session, so a button never points at a page that is not
 * there (a report that was never generated, a plan the session does not have).
 */

import { personaFor } from "@/lib/roles";
import { REPORT_BY_SESSION, SESSION_BY_ID } from "@/lib/seed";
import type { Profile, SessionSummary } from "@/lib/types";
import { PLAN_BY_ID } from "./plans";
import { normalizeStatus } from "./session-order";

/** A session that has actually run (or is running). A scheduled or cancelled one has not. */
export function hasRun(session: Pick<SessionSummary, "status">): boolean {
  const status = normalizeStatus(session.status);
  return status === "completed" || status === "live" || status === "aborted";
}

/**
 * Whether a stored report exists to open. A completed session without one has none to link. A run read
 * from the database carries its score only when its report row exists, so the score is the evidence.
 */
export function hasReport(
  session: string | Pick<SessionSummary, "id" | "source" | "totalScore">,
): boolean {
  if (typeof session === "string") return REPORT_BY_SESSION.has(session);
  if (session.source === "database") return session.totalScore !== undefined;
  return REPORT_BY_SESSION.has(session.id);
}

/** True for a session that comes from the built-in sample data rather than a real account's records. */
export function isSampleSession(sessionId: string): boolean {
  return SESSION_BY_ID.has(sessionId);
}

/**
 * Whether a viewer may open this session. A learner may open their own and nobody
 * else's; the sample sessions belong to the sample learners, so a real learner who
 * types a sample session's address is not shown it. Instructors and administrators
 * review learners, so they are not restricted here. A session with no owner on it
 * (one the API listed for the signed-in learner) is theirs by construction.
 */
export function canViewSession(
  viewer: Pick<Profile, "id" | "role">,
  session: Pick<SessionSummary, "userId">,
): boolean {
  if (personaFor(viewer.role) !== "learner") return true;
  return !session.userId || session.userId === viewer.id;
}

export type SessionLinks = {
  /** The session itself: what the headset did, scene by scene. */
  session: string;
  /** The case it was run against, when the session names one. */
  case?: string;
  /** The sealed plan it was scored against, read-only, when this session has one. */
  plan?: string;
  /** The scored report, only when one exists. */
  report?: string;
};

export function sessionLinks(
  session: Pick<SessionSummary, "id" | "caseId" | "planId"> & Partial<Pick<SessionSummary, "source" | "totalScore">>,
): SessionLinks {
  return {
    session: `/sessions/${session.id}`,
    case: session.caseId ? `/cases/${session.caseId}` : undefined,
    // A run read from the database was scored against a stored plan, which the plan page can open for anyone
    // who may read that run; a sample session's plan is one of the built-in ones.
    plan: session.planId && (session.source === "database" || PLAN_BY_ID.has(session.planId)) ? `/plan/${session.planId}/review` : undefined,
    report: hasReport(session) ? `/sessions/${session.id}/report` : undefined,
  };
}
