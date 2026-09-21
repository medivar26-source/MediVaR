"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { createCohort, type CohortState } from "@/app/actions";
import p from "../panels.module.css";

/**
 * The control that was missing.
 *
 * `cohorts_insert` has allowed this since the schema and no screen ever called it, so
 * a new instructor arrived at "No cohort assigned" and the one button on that
 * dashboard led here, to a list with nothing in it. the schema tightened the policy to
 * instructors and administrators before this shipped — the section is rendered
 * for them and omitted for a learner, and the database refuses
 * the rest independently.
 *
 * In a section panel rather than the page header, which is where
 * `/admin/users` puts *Add an account* and for the same reason: a labelled
 * field in `pageActions` sits in a row that centres its children and holds a
 * sibling button, so the field's label and the button's cap line never agree.
 */
export function NewCohort({ programId }: { programId: string }) {
  const [state, formAction, pending] = useActionState<CohortState, FormData>(
    createCohort,
    {},
  );

  return (
    <form action={formAction} className={p.formRow}>
      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      <input type="hidden" name="program_id" value={programId} />

      <Input
        label="Cohort name"
        name="name"
        placeholder="Orthopaedics, March intake"
        maxLength={80}
        className={p.formGrow}
        required
      />

      <Button variant="primary" icon={Plus} type="submit" loading={pending}>
        Create cohort
      </Button>
    </form>
  );
}
