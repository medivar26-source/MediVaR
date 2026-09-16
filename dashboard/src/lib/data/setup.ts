/**
 * Session setup defaults.
 *
 * Every field is defaulted from the user's account, and most
 * people press Continue without changing anything. Nothing is written here —
 * a `plans` row is created when planning step 1 is
 * submitted, not when a setup form is opened, or every abandoned setup would
 * leave an orphaned draft behind.
 */

import type { Profile } from "@/lib/types";
import { getProcedures, type ProcedureCard } from "./catalogue";

export type SetupDefaults = {
  procedures: ProcedureCard[];
  procedure: ProcedureCard | undefined;
  mode: "training" | "assessment";
  difficulty: Profile["defaultDifficulty"];
  design: "CR" | "PS";
  fixation: "cemented" | "cementless";
};

export async function getSetupDefaults(
  user: Profile,
): Promise<SetupDefaults> {
  const procedures = await getProcedures();
  const published = procedures.filter((p) => p.status === "published");

  return {
    procedures: published,
    procedure: published[0],
    // Training first: guides on, retry without penalty. Assessment is a
    // deliberate choice, never a default.
    mode: "training",
    difficulty: user.defaultDifficulty,
    design: "CR",
    fixation: "cemented",
  };
}
