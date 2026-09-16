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
import { COHORTS, CASE_BY_ID } from "@/lib/seed";
import { PINS } from "./plans";

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

  const pins: PinLifecycle[] = PINS.map((row) => {
    const shape = {
      planId: row.planId,
      caseId: row.caseId,
      caseTitle: CASE_BY_ID.get(row.caseId)?.title ?? row.caseTitle,
      sessionId: row.sessionId,
      expiresAt: row.expiresAt,
      redeemedAt: row.redeemedAt,
    };
    return { ...shape, state: pinState(shape) };
  });

  return {
    cohortName: cohort?.name,
    presetName: undefined,
    pins,
    source: {
      label: "Seed data",
      detail:
        "Screens render from the local seed. Nothing is fetched and nothing is written, so a reload returns the same rows.",
    },
    fleet: undefined,
    about: [
      { label: "Dashboard", value: "Next.js 16 · React 19 · TypeScript" },
      { label: "Data", value: "Local seed fixtures — no service is called" },
      { label: "Headset", value: "Unity 6000.0.66f2 · URP · OpenXR (not yet built)" },
      { label: "Design system", value: "MediVeR Flat — light theme only" },
      { label: "Scoring", value: "Not implemented — reports carry authored scores" },
    ],
  };
}

/** The three fields the account API accepts, and nothing else. */
export type AccountPatch = {
  displayName: string;
  level: string | null;
  defaultDifficulty: Difficulty;
};
