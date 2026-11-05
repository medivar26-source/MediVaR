/**
 * What `/settings` may show and what it may change.
 *
 * The division is not a design preference, it is the schema: `authenticated` holds
 * UPDATE on exactly three columns of `profiles`, so the three fields this file
 * writes are the three the database will accept. Everything else on the Account
 * tab is rendered read-only with the reason beside it, because a disabled
 * control is for a condition the user can satisfy and this one they cannot.
 */

import type { Difficulty, Profile } from "@/lib/types";
import { COHORTS } from "@/lib/seed";
import { getPlans } from "./plans";

export type PinLifecycle = {
  planId: string;
  caseId: string;
  caseTitle: string;
  sessionId?: string;
  expiresAt: string;
  redeemedAt?: string;
  /** Derived here, not stored — the row carries timestamps, not a verdict. */
  state: "live" | "redeemed" | "expired";
};

export type SettingsView = {
  /** The cohort's name, when the viewer is in one. Read, never written here. */
  cohortName?: string;
  /** The preset the viewer's plans are stamped with, if their cohort has one. */
  presetName?: string;
  pins: PinLifecycle[];
  /** Where the rows on every screen came from. */
  source: {
    label: string;
    detail: string;
  };
  fleet?: {
    devices: number;
    seenToday: number;
  };
  /** Facts about the build, each sourced from something. */
  about: { label: string; value: string }[];
};

export function pinState(pin: {
  expiresAt: string;
  redeemedAt?: string;
}): PinLifecycle["state"] {
  if (pin.redeemedAt) return "redeemed";
  return new Date(pin.expiresAt) > new Date() ? "live" : "expired";
}

export async function getSettings(user: Profile): Promise<SettingsView> {
  const cohort = user.cohortId
    ? COHORTS.find((c) => c.id === user.cohortId)
    : undefined;

  // The code lifecycle of the user's own plans: each plan's newest headset assignment (never the digits).
  const pins: PinLifecycle[] = (await getPlans(undefined, user.id)).plans.flatMap((plan) => (plan.pin ? [plan.pin] : []));

  return {
    cohortName: cohort?.name,
    presetName: undefined,
    pins,
    source: {
      label: "Database",
      detail:
        "Plans, sessions, cases, cohorts and results are saved to and read from the backend database, so restarting the server loses nothing. The exception is built-in practice cases: they are not database rows, so a plan on one is kept in memory and is lost when the dashboard server restarts.",
    },
    fleet: undefined,
    about: [
      { label: "Dashboard", value: "Next.js 16 · React 19 · TypeScript" },
      { label: "Data", value: "Backend database, through the MediVeR API" },
      { label: "Headset", value: "Quest 3 · pairs with a one-time code from a sealed plan; its report comes back through the API" },
      { label: "Design system", value: "MediVeR Flat — light theme only" },
      { label: "Scoring", value: "Headset runs are scored by the backend (sample tolerances, pending clinical approval)" },
    ],
  };
}

/** The three fields the account API accepts, and nothing else. */
export type AccountPatch = {
  displayName: string;
  level: string | null;
  defaultDifficulty: Difficulty;
};
