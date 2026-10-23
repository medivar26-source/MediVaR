/**
 * Starts the reads a page is going to make while the user's identity is still being checked.
 *
 * A page needs `/auth/me` to know who is asking, and then reads its data, so the two ran one after the
 * other: two backend rounds before the page could render. Most of that data does not depend on the
 * answer, so a page calls this first, then `await getCurrentUser()` as before. Nothing about what the page
 * reads or shows changes; only when the requests start.
 *
 * Why this is safe:
 * - **Same requests, not new ones.** The reads started here are the exact calls the page makes a moment
 *   later (same URL, same headers). Next de-duplicates identical GETs within one render, so the later call
 *   joins the one already in flight. If it does not (the ids differ), the page simply makes its own.
 * - **Authorisation is the backend's.** Every request carries the caller's own token. The sessions request is
 *   addressed to the token's own subject (`users.id`, which the backend maps the token's `sub` to), read from the
 *   token without verifying it; the backend verifies the token and refuses any id that is not the caller's. The
 *   page still waits for `/auth/me`, and uses sessions only for the id that call returns.
 * - **Nothing is kept between requests.** De-duplication lasts for one render. No response is cached, shared or
 *   reused by another request or another user.
 * - **A failed or unauthorised early read is dropped silently**; the page's own read reports its own errors.
 */

import { getSessionToken } from "@/lib/session";
import { fetchCaseListRows } from "./cases";
import { listPersonalCases } from "./personal-cases";
import { apiListSessions } from "./residents-api";

/** The `sub` claim of a JWT, read without verifying it (a hint for an early request; the backend verifies). */
export function jwtSubject(token: string): string | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof claims?.sub === "string" && claims.sub ? claims.sub : null;
  } catch {
    return null;
  }
}

export type EarlyReads = {
  /** The case list (`GET /cases`), for pages that list cases. */
  cases?: boolean;
  /** The learner's own sessions, for pages that count attempts or list sessions. */
  sessions?: boolean;
  /** The learner's personal cases. */
  personalCases?: boolean;
};

/** Fire and forget: never throws and never delays the caller. */
export function startEarlyReads(reads: EarlyReads): void {
  void (async () => {
    const token = await getSessionToken();
    if (!token) return;

    const jobs: Promise<unknown>[] = [];
    if (reads.cases) jobs.push(fetchCaseListRows(token));
    if (reads.personalCases) jobs.push(listPersonalCases());
    if (reads.sessions) {
      const subject = jwtSubject(token);
      if (subject) jobs.push(apiListSessions(token, subject));
    }
    await Promise.allSettled(jobs);
  })().catch(() => undefined);
}
