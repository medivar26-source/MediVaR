/**
 * How sessions are ordered and which are "upcoming".
 *
 * Pure functions, kept apart from the data accessors so the rules can be tested
 * without a session cookie or a network call.
 */

type WithWhen = {
  status: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
};

const when = (row: WithWhen) =>
  Date.parse(row.scheduledAt ?? row.startedAt ?? row.endedAt ?? "") || 0;

/** What is happening now first, then what is coming (soonest first), then history (newest first). */
export function orderSessions<T extends WithWhen>(rows: T[]): T[] {
  const rank = (row: T) =>
    row.status === "live" || row.status === "in_progress" ? 0 : row.status === "scheduled" ? 1 : 2;
  return [...rows].sort(
    (a, b) => rank(a) - rank(b) || (rank(a) === 1 ? when(a) - when(b) : when(b) - when(a)),
  );
}

/** Sessions still ahead (or under way), soonest first. Cancelled and finished ones are history. */
export function pickUpcoming<T extends WithWhen>(rows: T[], limit = 5): T[] {
  return rows
    .filter((row) => row.status === "scheduled" || row.status === "in_progress")
    .sort((a, b) => when(a) - when(b))
    .slice(0, limit);
}

/** The API says "in_progress"; this product's own word for it is "live". */
export function normalizeStatus(status: string): string {
  return status === "in_progress" ? "live" : status;
}
