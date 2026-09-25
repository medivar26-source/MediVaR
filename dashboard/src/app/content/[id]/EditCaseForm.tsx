"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Banner, Button, Input, Select, Textarea } from "@/components/ui";
import { updateCase, type CaseFormState } from "@/app/actions";
import type { CaseAuthoringDetail, ProcedureOption } from "@/lib/data/content";
import p from "../../panels.module.css";
import c from "../content.module.css";

export function EditCaseForm({
  detail,
  procedures,
}: {
  detail: CaseAuthoringDetail;
  procedures: ProcedureOption[];
}) {
  const [state, formAction, pending] = useActionState<CaseFormState, FormData>(
    updateCase,
    {},
  );

  return (
    <form action={formAction} className={p.form} aria-label={`Edit ${detail.title}`}>
      {state.error && (
        <Banner tone="fail" title="Not saved">
          {state.error}
        </Banner>
      )}
      {state.saved && !state.error && (
        <Banner tone="pass" title="Saved">
          Changes to a case start a new version; attempts already run keep the
          version they were taken on.
        </Banner>
      )}

      <input type="hidden" name="caseId" value={detail.id} />

      <div className={c.grid2}>
        <Input
          label="Case name"
          name="title"
          defaultValue={detail.title}
          maxLength={120}
          required
          error={state.fieldErrors?.title}
        />
        <Select
          label="Procedure"
          name="procedureId"
          defaultValue={detail.procedureId}
          required
          error={state.fieldErrors?.procedureId}
        >
          {procedures.map((procedure) => (
            <option key={procedure.id} value={procedure.id}>
              {procedure.name}
            </option>
          ))}
        </Select>
      </div>

      <Select
        label="Difficulty"
        name="difficulty"
        defaultValue={detail.difficulty}
        required
        error={state.fieldErrors?.difficulty}
      >
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="expert">Expert</option>
      </Select>

      <Textarea
        label="Description"
        name="description"
        defaultValue={detail.description}
        rows={2}
        maxLength={1000}
        optional
      />

      <Textarea
        label="Learning objective"
        name="learningObjective"
        defaultValue={detail.learningObjective}
        rows={2}
        maxLength={1000}
        required
        error={state.fieldErrors?.learningObjective}
      />

      <div className={p.formRow}>
        <Button variant="primary" icon={Save} type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
