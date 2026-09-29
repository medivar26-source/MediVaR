"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";
import { Banner, Button } from "@/components/ui";
import { assignPractice, type AssignPracticeFormState } from "@/app/actions";

export function AssignPracticeButton({
  residentId,
  caseId,
  caseTitle,
}: {
  residentId: string;
  caseId: string;
  caseTitle: string;
}) {
  const [state, formAction, pending] = useActionState<AssignPracticeFormState, FormData>(
    assignPractice,
    {},
  );

  if (state.saved) {
    return (
      <Banner tone="pass" title="Assigned">
        {caseTitle} was assigned for practice.
      </Banner>
    );
  }

  return (
    <form action={formAction}>
      {state.error && (
        <Banner tone="fail" title="Not assigned">
          {state.error}
        </Banner>
      )}
      <input type="hidden" name="residentId" value={residentId} />
      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="caseTitle" value={caseTitle} />
      <Button variant="secondary" size="sm" icon={CalendarPlus} type="submit" loading={pending}>
        Assign practice
      </Button>
    </form>
  );
}
