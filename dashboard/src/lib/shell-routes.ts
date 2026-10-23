/**
 * Which screens sit inside the app frame (side navigation and top bar), and what the search box says.
 *
 * The frame is mounted once, in the root layout, and stays mounted as the user moves between pages, so
 * the sidebar and top bar are not rebuilt on every navigation. That makes the frame's own routes a list
 * here rather than something each page opts into. Pure, so it can be tested without a request.
 */

import type { Persona } from "@/lib/roles";

/** Screens that are not part of the signed-in app: sign-in and recovery, which have their own layout. */
const PUBLIC_PREFIXES = ["/login", "/forgot-password", "/request-access", "/reset-password", "/support"];

/**
 * Whether a screen is drawn inside the frame.
 *
 * Not framed: the public screens above; the planner (`/plan/...`), which is a full-screen mode with its own
 * header; the headset launcher (`/simulations/<procedure>`), which has its own shell; and a page shown inside
 * the settings modal (`?embed=1`), which must stay chrome-free. `/plans` (the learner's plan list) is framed:
 * the planner is `/plan/`, with a slash.
 */
export function usesAppFrame(pathname: string, embedded = false): boolean {
  if (embedded) return false;
  const on = (prefix: string) => pathname === prefix || pathname.startsWith(prefix + "/");
  if (PUBLIC_PREFIXES.some(on)) return false;
  if (on("/plan")) return false;
  if (pathname.startsWith("/simulations/")) return false;
  return true;
}

const HINTS: [string, string][] = [
  ["/cases", "varus"],
  ["/content", "varus"],
  ["/sessions", "varus"],
  ["/help", "pairing"],
  ["/kit", "badge"],
  ["/learners", "learners"],
  ["/library", "library"],
  ["/performance", "performance"],
  ["/progress", "reports"],
  ["/reports", "reports"],
  ["/activity", "activity"],
  ["/plans", "plans"],
  ["/programs", "programs"],
  ["/settings", "settings"],
  ["/simulations", "total knee"],
  ["/cohorts", "cohorts"],
];

const DEFAULT_HINT = "Search pages, cases, cohorts, learners";

/** The suggestion in the search pill for a screen. */
export function searchHintFor(pathname: string, persona: Persona): string {
  if (pathname === "/") {
    return persona === "learner" ? 'Try searching "tibial slope"' : 'Try searching "below pass mark"';
  }
  const hit = HINTS.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  return hit ? `Try searching "${hit[1]}"` : DEFAULT_HINT;
}
