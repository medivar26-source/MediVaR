/**
 * The time window a dashboard covers, and the options a page may offer.
 *
 * These live in a plain module, **not** in `components/dashboard/Toolbar`,
 * because Toolbar is `"use client"`. When a Server Component imports a value
 * from a client module, Next hands it a client *reference*, not the value —
 * so `DAY_OPTIONS.map(...)` on the server throws `map is not a function` at
 * request time. It compiles, it passes `next build` because `/` is dynamic,
 * and it 500s in the browser.
 *
 * Rule: a constant or pure helper that both sides need lives in `lib/`.
 * Only the component itself carries `"use client"`.
 */

export type WindowOption = { value: number; label: string };

/** Weeks, for the two dashboards whose series are bucketed by week. */
export const WEEK_OPTIONS: WindowOption[] = [
  { value: 7, label: "Last 7 weeks" },
  { value: 13, label: "Last 13 weeks" },
  { value: 26, label: "Last 26 weeks" },
];

/** Days, for the admin dashboard — `daily_sessions` buckets by day. */
export const DAY_OPTIONS: WindowOption[] = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
];

export const DEFAULT_WINDOW = 7;

export type WindowSpec = {
  /** Search param this control writes, e.g. "weeks" or "days". */
  param: string;
  /** The window the page was actually rendered with. */
  value: number;
  /** Omitted from the URL, so the default view has a clean address. */
  fallback: number;
  options: WindowOption[];
};

/** Narrows a raw search param to one the accessor supports. */
export function windowFromParam(
  raw: string | undefined,
  options: WindowOption[],
  fallback: number = DEFAULT_WINDOW,
): number {
  const n = Number(raw);
  return options.some((o) => o.value === n) ? n : fallback;
}
