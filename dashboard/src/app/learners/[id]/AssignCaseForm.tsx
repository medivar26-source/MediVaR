"use client";

import { useActionState, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Banner, Button, Select } from "@/components/ui";
import { assignPractice, type AssignPracticeFormState } from "@/app/actions";

/**
 * Assign any published case to this learner for practice.
 *
 * It uses the same `assignPractice` action as the per-row "Assign practice"
 * button in Recent cases, which writes through `POST /residents/{id}/assignments`.
 */
export function AssignCaseForm({
  residentId,
  cases,
}: {
  residentId: string;
  cases: { id: string; title: string }[];
}) {
  const [caseId, setCaseId] = useState(cases[0]?.id ?? "");
  const [state, formAction, pending] = useActionState<AssignPracticeFormState, FormData>(
    assignPractice,
    {},
  );

  if (cases.length === 0) {
    return (
      <Banner tone="info" title="No cases to assign yet">
        Publish a case in the Case Library first, then assign it here.
      </Banner>
    );
  }

  const title = cases.find((c) => c.id === caseId)?.title ?? "";

  return (
    <form action={formAction} style={{ display: "grid", gap: "var(--s-3)", maxWidth: 520 }}>
      {state.saved && (
        <Banner tone="pass" title="Assigned">
          {title} was assigned for practice.
        </Banner>
      )}
      {state.error && (
        <Banner tone="fail" title="Not assigned">
          {state.error}
        </Banner>
      )}
      <input type="hidden" name="residentId" value={residentId} />
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="caseTitle" value={title} />
      <Select
        label="Case"
        value={caseId}
        onChange={(event) => setCaseId(event.target.value)}
      >
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </Select>
      <div>
        <Button variant="primary" icon={CalendarPlus} type="submit" loading={pending}>
          Assign case
        </Button>
      </div>
    </form>
  );
}
