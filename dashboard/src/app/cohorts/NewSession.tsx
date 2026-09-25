"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input, Select } from "@/components/ui";
import { createSession, type SessionState } from "@/app/actions";
import type { CaseSummary } from "@/lib/data/cohorts";
import p from "../panels.module.css";

export function NewSession({
  cohortId,
  cases,
}: {
  cohortId: string;
  /** Cases already assigned to this cohort — the only ones a session can be scheduled for. */
  cases: CaseSummary[];
}) {
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

      <Select label="Case" name="caseId" required disabled={cases.length === 0}>
        <option value="">
          {cases.length === 0 ? "Assign a case to this cohort first" : "Select a case…"}
        </option>
        {cases.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select label="Mode" name="mode" defaultValue="training">
        <option value="training">Training</option>
        <option value="assessment">Assessment</option>
      </Select>

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