"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import { updateSession, type SessionState } from "@/app/actions";
import type { SessionSummary } from "@/lib/data/cohorts";
import s from "./EditSessionModal.module.css";

export function EditSessionModal({ session }: { session: SessionSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    updateSession,
    {},
  );

  // Close modal on successful update. Depend on the state object, not `state.saved`: the
  // saved message is the same string every time, so a second save would never re-fire.
  useEffect(() => {
    if (state.saved) {
      setIsOpen(false);
    }
  }, [state]);

  // Format date string for datetime-local input (YYYY-MM-DDTHH:mm)
const defaultScheduled = session.scheduledAt
  ? (() => {
      const date = new Date(session.scheduledAt);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })()
  : "";

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon={Edit2}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Edit
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} title="Edit session" size="sm">
        <form action={formAction} className={s.form}>
          {state.error && (
            <Banner tone="fail" title="The session was not saved">
              {state.error}
            </Banner>
          )}

          <input type="hidden" name="sessionId" value={session.id} />
          <input type="hidden" name="cohortId" value={session.cohortId} />

          <Input label="Session name" name="name" defaultValue={session.name} required />

          <Input
            label="Scheduled date and time"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={defaultScheduled}
            required
          />

          <Input
            label="Duration (minutes)"
            name="duration"
            type="number"
            min={5}
            max={480}
            defaultValue={session.duration}
            required
          />

          <Input label="Description" name="description" optional defaultValue={session.description ?? ""} />

          <div className={s.actions}>
            <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={pending}>
              Save changes
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}