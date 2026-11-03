/**
 * Deadlines for calls to the backend. Without one, a stuck API holds the page that is waiting for it for as
 * long as the server will wait, which looks to the user like the app has hung.
 */

/** Most backend calls: reads and small writes. */
export const REQUEST_TIMEOUT_MS = 20_000;

/** Scan uploads carry large files. */
export const UPLOAD_TIMEOUT_MS = 120_000;

/** A signal that aborts after the default deadline. Create one per request, not once per module. */
export const requestSignal = (): AbortSignal => AbortSignal.timeout(REQUEST_TIMEOUT_MS);

/** The caller's own abort signal still works; the deadline is added to it. */
export function withDeadline(signal: AbortSignal | null | undefined, ms: number): AbortSignal {
  const deadline = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, deadline]) : deadline;
}
