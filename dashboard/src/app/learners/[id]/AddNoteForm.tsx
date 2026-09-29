"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Textarea } from "@/components/ui";
import { addInstructorNote, type InstructorNoteFormState } from "@/app/actions";
import p from "../../../panels.module.css";

export function AddNoteForm({ residentId }: { residentId: string }) {
  const [state, formAction, pending] = useActionState<InstructorNoteFormState, FormData>(
    addInstructorNote,
    {},
  );

  return (
    <form action={formAction} className={p.formRow} aria-label="Add a note">
      {state.error && (
        <Banner tone="fail" title="Not saved">
          {state.error}
        </Banner>
      )}
      <input type="hidden" name="residentId" value={residentId} />
      <Textarea
        label="Add a note"
        name="note"
        placeholder="Progressing well on gap assessment; still rushing the tibial cut."
        rows={2}
        maxLength={4000}
        className={p.formGrow}
        error={state.fieldErrors?.note}
        required
      />
      <Button variant="secondary" icon={Plus} type="submit" loading={pending}>
        Add note
      </Button>
    </form>
  );
}
