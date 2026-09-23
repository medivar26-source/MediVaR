"use client";

import { useActionState } from "react";
import { Banner, Button, Checkbox } from "@/components/ui";
import { assignCases, type CohortState } from "@/app/actions";
import p from "../panels.module.css";

/**
 * The control that assigns cases to a cohort.
 *
 * Cases assigned here act as homework/assignments for every learner in the
 * cohort — access is resolved through cohort membership, not copied per
 * learner. Saving replaces the full assigned set for this cohort (checked
 * cases are kept/added, unchecked ones are removed) rather than only adding,
 * so the panel always reflects exactly what's assigned after a save.
 */
export function AssignCasesPanel({
  cohortId,
  assignedCaseIds,
  cases,
}: {
  cohortId: string;
  assignedCaseIds: string[];
  cases: { id: string; name: string; difficulty?: string }[];
}) {
  const [state, formAction, pending] = useActionState<CohortState, FormData>(
    assignCases,
    {},
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="cohortId" value={cohortId} />

      {state.error && (
        <Banner tone="fail" title="Not saved">
          {state.error}
        </Banner>
      )}
      {state.saved && !state.error && (
        <Banner tone="pass" title="Cases assigned">
          {state.saved}
        </Banner>
      )}

      <div className={p.list}>
        {cases.length === 0 && (
          <p className={p.empty}>No cases available for this program yet.</p>
        )}
        {cases.map((c) => (
          <Checkbox
            key={c.id}
            name="caseIds"
            value={c.id}
            defaultChecked={assignedCaseIds.includes(c.id)}
            label={c.name}
            helper={c.difficulty}
          />
        ))}
      </div>

      <div className={p.filters}>
        <Button variant="primary" type="submit" loading={pending}>
          Save assigned cases
        </Button>
      </div>
    </form>
  );
}