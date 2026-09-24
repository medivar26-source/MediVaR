"use client";

import { useActionState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Banner, Button, Card, CardHeader, EmptyState, Textarea } from "@/components/ui";
import { saveInstructorFeedback, type InstructorFeedbackFormState } from "@/app/actions";
import { shortDate } from "@/lib/format";
import type { ApiInstructorFeedback } from "@/lib/data/residents";
import p from "../../../panels.module.css";

/**
 * Instructor-only. Mounted on the existing session report rather than a
 * second review screen — this *is* the Case Review panel from the reference
 * design, added to the report everyone already uses.
 */
export function InstructorFeedback({
  residentId,
  attemptId,
  existing,
  unavailableReason,
}: {
  residentId: string;
  attemptId: string;
  existing: ApiInstructorFeedback[];
  /** Set when this attempt's owner isn't a resident the viewer supervises
   *  (or isn't a provisioned user at all) — explains why the form is hidden
   *  instead of silently failing to save. */
  unavailableReason?: string;
}) {
  const [state, formAction, pending] = useActionState<InstructorFeedbackFormState, FormData>(
    saveInstructorFeedback,
    {},
  );

  if (unavailableReason) {
    return (
      <Card padding="lg">
        <CardHeader title="Instructor feedback" />
        <Banner tone="info" title="Not available for this attempt">
          {unavailableReason}
        </Banner>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <CardHeader
        title="Instructor feedback"
        subtitle={
          existing.length === 0
            ? "Nothing added yet."
            : `${existing.length} note${existing.length === 1 ? "" : "s"} on this attempt`
        }
      />

      {existing.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback added yet" />
      ) : (
        <ul style={{ margin: "0 0 var(--s-5)", padding: 0, listStyle: "none" }}>
          {existing.map((item) => (
            <li key={item.id} className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>{item.feedback}</p>
                <p className={p.rowDetail}>
                  {item.instructor_name} · {shortDate(item.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className={p.form} aria-label="Add feedback">
        {state.error && (
          <Banner tone="fail" title="Not saved">
            {state.error}
          </Banner>
        )}
        {state.saved && !state.error && (
          <Banner tone="pass" title="Feedback saved">
            The resident can see this alongside the report.
          </Banner>
        )}
        <input type="hidden" name="residentId" value={residentId} />
        <input type="hidden" name="attemptId" value={attemptId} />
        <Textarea
          label="Add feedback"
          name="feedback"
          placeholder="Repeat tibial cut practice before the next assessment."
          rows={2}
          maxLength={4000}
          error={state.fieldErrors?.feedback}
          required
        />
        <div className={p.formRow}>
          <Button variant="primary" icon={Send} type="submit" loading={pending}>
            Save feedback
          </Button>
        </div>
      </form>
    </Card>
  );
}
