/**
 * What the navigation chrome is allowed to say.
 *
 * The panels used to carry literal counts — `badge: 2`, `badge: 3` — and two
 * pinned links to a hardcoded case and session id. Those are fabricated claims
 * sitting in the shell of every screen, and the pinned links
 * pointed at rows that may not exist for the signed-in user at all.
 *
 * Everything here is a query. A count that cannot be sourced is absent, and an
 * absent count renders no badge rather than a zero.
 */

import { PLANS } from "./plans";
import { sessionsFor } from "@/lib/seed";
import type { Profile } from "@/lib/types";

/** Stable keys the nav panels reference. Absent key → no badge. */
export type BadgeKey = "plans.ready" | "sessions.live" | "sessions.aborted";

export type NavPin = { label: string; href: string };

export type NavNotification = {
  id: string;
  title: string;
  meta: string;
  href: string;
};

export type NavData = {
  counts: Partial<Record<BadgeKey, number>>;
  /** Real destinations for this user, or empty — never a placeholder. */
  pinned: NavPin[];
  notifications: NavNotification[];
};

const EMPTY: NavData = { counts: {}, pinned: [], notifications: [] };

export async function getNavData(user: Profile): Promise<NavData> {
  const mine = sessionsFor(user.id).slice(0, 20);
  const readyCount = PLANS.filter(
    (plan) => plan.userId === user.id && plan.isReadyForVr,
  ).length;

  if (!mine.length && !readyCount) return EMPTY;

  const live = mine.filter((s) => s.status === "live");
  const aborted = mine.filter((s) => s.status === "aborted");
  const latestScored = mine.find(
    (s) => s.status === "completed" && s.totalScore !== undefined,
  );
  const latest = mine[0];

  const counts: Partial<Record<BadgeKey, number>> = {};
  if (readyCount) counts["plans.ready"] = readyCount;
  if (live.length) counts["sessions.live"] = live.length;
  if (aborted.length) counts["sessions.aborted"] = aborted.length;

  /* ---- pinned: where this user actually was, not a fixed pair of ids ---- */

  const pinned: NavPin[] = [];
  if (latest) {
    pinned.push({ label: latest.caseTitle, href: `/cases/${latest.caseId}` });
  }
  if (latestScored) {
    pinned.push({
      label: "Latest report",
      href: `/sessions/${latestScored.id}/report`,
    });
  }

  /* ---- notifications: things that happened and need a decision ---- */

  const notifications: NavNotification[] = [];
  if (live[0]) {
    notifications.push({
      id: `live-${live[0].id}`,
      title: "Session running in the headset",
      meta: `${live[0].caseTitle} · scene ${live[0].currentScene ?? "—"}`,
      href: `/sessions/${live[0].id}`,
    });
  }
  if (aborted[0]) {
    notifications.push({
      id: `aborted-${aborted[0].id}`,
      title: "Session was interrupted",
      meta: `${aborted[0].caseTitle} · resume or discard`,
      href: `/sessions/${aborted[0].id}`,
    });
  }
  if (latestScored) {
    notifications.push({
      id: `report-${latestScored.id}`,
      title: `Report ready · scored ${latestScored.totalScore}`,
      meta: latestScored.caseTitle,
      href: `/sessions/${latestScored.id}/report`,
    });
  }

  return { counts, pinned, notifications };
}
