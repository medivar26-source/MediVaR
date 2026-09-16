"use client";

import { useActionState, useState } from "react";
import { Banner, Button, Input, Segmented } from "@/components/ui";
import { saveAccount, type AccountState } from "@/app/actions";
import type { Difficulty } from "@/lib/types";
import s from "./settings.module.css";

/**
 * The editable half of the Account tab.
 *
 * Three fields, which is exactly what the account API accepts. If this form ever
 * grows a fourth, the store refuses it — the grant is the contract and
 * this component is the reading of it, not the other way round.
 */
export function AccountForm({
  displayName,
  level,
  defaultDifficulty,
}: {
  displayName: string;
  level?: string;
  defaultDifficulty: Difficulty;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [state, formAction, pending] = useActionState<AccountState, FormData>(
    saveAccount,
    {},
  );

  return (
    <form action={formAction} className={s.form}>
      {state.error && (
        <Banner tone="fail" title="Not saved">
          {state.error}
        </Banner>
      )}
      {state.savedAt && !state.error && (
        <Banner tone="pass" title="Saved">
          Your details are updated everywhere they appear.
        </Banner>
      )}

      <div className={s.pair}>
        <Input
          label="Full name"
          name="displayName"
          defaultValue={displayName}
          required
          maxLength={80}
          helper="Shown on your reports and to your instructor."
        />
        <Input
          label="Level"
          name="level"
          defaultValue={level ?? ""}
          maxLength={60}
          helper="Free text, e.g. ST3. Optional."
        />
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Default difficulty</span>
        <p className={s.fieldHelp}>
          Pre-selects the difficulty on Session setup. It scales every tolerance
          band and moves the pass mark — 60, 70, 80 — so it is a real choice, not
          a preference.
        </p>
        <input type="hidden" name="defaultDifficulty" value={difficulty} />
        <Segmented
          label="Default difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "expert", label: "Expert" },
          ]}
        />
      </div>

      <div className={s.formFoot}>
        <Button variant="primary" type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
