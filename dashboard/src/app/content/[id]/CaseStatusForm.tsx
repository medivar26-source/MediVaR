"use client";

import { useActionState } from "react";
import { Ban, Check } from "lucide-react";
import { Banner, Button } from "@/components/ui";
import { setCaseStatus, type CaseStatusState } from "@/app/actions";
import type { CaseAuthoringStatus } from "@/lib/data/content";

/**
 * A status flip is the one destructive-adjacent action this screen exposes,
 * so it asks first — the same confirm-before-archive rule
 * `04_UI_AND_NAVIGATION.md` sets for important configuration. Deactivating
 * never deletes the case; it only stops it from being offered.
 */
export function CaseStatusForm({
  caseId,
  status,
}: {
  caseId: string;
  status: CaseAuthoringStatus;
}) {
  const [state, formAction, pending] = useActionState<CaseStatusState, FormData>(
    setCaseStatus,
    {},
  );

  const nextStatus: CaseAuthoringStatus = status === "active" ? "inactive" : "active";

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const message =
          nextStatus === "inactive"
            ? "Deactivate this case? Residents will no longer be able to start new attempts. Past attempts and reports are kept."
            : "Reactivate this case so residents can attempt it again?";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {state.error && (
        <Banner tone="fail" title="Not changed">
          {state.error}
        </Banner>
      )}
      {state.success && !state.error && (
        <Banner tone="pass" title="Status updated">
          The case is now {status}.
        </Banner>
      )}

      <input type="hidden" name="caseId" value={caseId} />
      <input type="hidden" name="nextStatus" value={nextStatus} />

      <Button
        type="submit"
        variant={nextStatus === "inactive" ? "danger" : "primary"}
        icon={nextStatus === "inactive" ? Ban : Check}
        loading={pending}
        block
      >
        {nextStatus === "inactive" ? "Deactivate case" : "Activate case"}
      </Button>
    </form>
  );
}
