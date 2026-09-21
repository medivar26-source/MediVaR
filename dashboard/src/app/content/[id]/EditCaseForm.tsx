"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Banner, Button, Input, Select, Textarea } from "@/components/ui";
import { updateCase, type CaseFormState } from "@/app/actions";
import type { CaseAuthoringDetail, ProcedureAuthoringRow } from "@/lib/data/content";
import p from "../../panels.module.css";
import c from "../content.module.css";

export function EditCaseForm({
  detail,
  procedures,
}: {
  detail: CaseAuthoringDetail;
  procedures: ProcedureAuthoringRow[];
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

      <div className={c.grid2}>
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
        <Select
          label="Side"
          name="side"
          defaultValue={detail.side}
          required
          error={state.fieldErrors?.side}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Select>
      </div>

      <Textarea
        label="Summary"
        name="summary"
        defaultValue={detail.summary}
        rows={2}
        optional
      />

      <Textarea
        label="Learning objective"
        name="learningObjective"
        defaultValue={detail.learningObjective}
        rows={2}
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
