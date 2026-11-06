"use client";

import { useActionState, useState } from "react";
import { disconnectHeadset, type DisconnectHeadsetState } from "@/app/actions";
import { Button } from "@/components/ui";

/**
 * "Disconnect" on a Settings → Device & pairing row: a two-step control (the second click confirms), posting
 * the same server action as the review page. A pending code is "cancelled"; a paired or running headset is
 * "disconnected" (signed out, its run abandoned). The row re-reads on the server after the action revalidates.
 */
export function DisconnectHeadsetButton({ assignmentId, planId, pending }: { assignmentId: string; planId: string; pending: boolean }) {
  const [state, action, busy] = useActionState<DisconnectHeadsetState, FormData>(disconnectHeadset, {});
  const [confirm, setConfirm] = useState(false);
  if (state.done) return <span>{pending ? "Code cancelled" : "Disconnected"}</span>;
  return (
    <form action={action} style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="planId" value={planId} />
      {confirm ? (
        <>
          <Button type="submit" variant="secondary" size="sm" loading={busy}>
            {pending ? "Yes, cancel code" : "Yes, disconnect"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(false)}>
            Keep
          </Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(true)}>
          {pending ? "Cancel code" : "Disconnect"}
        </Button>
      )}
      {state.error && <span role="alert">{state.error}</span>}
    </form>
  );
}
