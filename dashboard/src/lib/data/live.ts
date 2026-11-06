/**
 * Live view, read from the backend for the server-rendered pages. The client component then polls the dashboard's
 * own route handlers (`app/api/live/...`), which forward to the same backend with the viewer's token.
 *
 * Read per request and never cached: the whole point is that it moves. A backend without migration 016 answers
 * 404 "not set up"; that is `available: false`, and the pages say so instead of showing a page that cannot work.
 */

import { ApiError, apiClient } from "@/lib/api-client";
import { liveSummaryFromApi, type LiveSummary } from "@/lib/live-view";

export type LiveRead =
  | { available: false }
  | { available: true; found: false }
  | { available: true; found: true; live: LiveSummary };

function notSetUp(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404 && /not set up/i.test(err.message);
}

export async function getLive(assignmentId: string, after = 0): Promise<LiveRead> {
  try {
    const row = (await apiClient.get(
      `/assignments/${encodeURIComponent(assignmentId)}/live?after=${Math.max(0, after)}`,
    )) as Record<string, unknown>;
    return { available: true, found: true, live: liveSummaryFromApi(row) };
  } catch (err) {
    if (notSetUp(err)) return { available: false };
    if (err instanceof ApiError && err.status === 404) return { available: true, found: false };
    throw err;
  }
}

/** The runs live now that the viewer may watch. Empty when live view is not set up or the backend is away. */
export async function getActiveRuns(): Promise<LiveSummary[]> {
  try {
    const rows = (await apiClient.get("/live/active")) as Record<string, unknown>[];
    return rows.map(liveSummaryFromApi);
  } catch {
    return [];
  }
}
