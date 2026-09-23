"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { createSession, type SessionState } from "@/app/actions";
import p from "../panels.module.css";

export function NewSession({ cohortId }: { cohortId: string }) {
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    createSession,
    {},
  );

  return (
    <form action={formAction} className={p.formRow}>
      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      {state.saved && (
        <Banner tone="pass" title="Success">
          {state.saved}
        </Banner>
      )}

      <input type="hidden" name="cohortId" value={cohortId} />

      <Input
        label="Session name"
        name="name"
        placeholder="e.g. Vascular Surgery Simulation"
        maxLength={80}
        className={p.formGrow}
        required
      />

      <Input
        label="Scheduled Date & Time"
        name="scheduledAt"
        type="datetime-local"
        required
      />

      <Input
        label="Duration (minutes)"
        name="duration"
        type="number"
        min={5}
        max={480}
        defaultValue={60}
        required
        style={{ width: "120px" }}
      />

      <Input
        label="Description (optional)"
        name="description"
        placeholder="Topics covered..."
        className={p.formGrow}
      />

      <Button variant="primary" icon={Plus} type="submit" loading={pending}>
        Schedule
      </Button>
    </form>
  );
}