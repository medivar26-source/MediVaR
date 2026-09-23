"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { cancelSession, type SessionState } from "@/app/actions";

export function CancelSessionButton({ sessionId, cohortId }: { sessionId: string; cohortId: string }) {
  const [state, formAction, pending] = useActionState<SessionState, FormData>(cancelSession, {});

  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="cohortId" value={cohortId} />
      <Button variant="ghost" type="submit" loading={pending} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}