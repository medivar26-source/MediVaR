"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input, Select, Textarea } from "@/components/ui";
import { createCase, type CaseFormState } from "@/app/actions";
import type { ProcedureAuthoringRow } from "@/lib/data/content";
import p from "../panels.module.css";
import c from "./content.module.css";

/**
 * A real create flow: client-side required-field handling backs the
 * `required` attributes, the server action re-validates and returns
 * field-level errors, and the submit button carries its own loading state.
 * What it cannot yet do is survive a reload — see `createCase` for why.
 */
export function NewCaseForm({ procedures }: { procedures: ProcedureAuthoringRow[] }) {
  const [state, formAction, pending] = useActionState<CaseFormState, FormData>(
    createCase,
    {},
  );

  return (
    <form action={formAction} className={p.form} aria-label="Create a case">
      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      <div className={c.grid2}>
        <Input
          label="Case name"
          name="title"
          placeholder="Varus OA — Right knee"
          maxLength={120}
          required
          error={state.fieldErrors?.title}
        />
        <Select
          label="Procedure"
          name="procedureId"
          required
          error={state.fieldErrors?.procedureId}
          defaultValue=""
        >
          <option value="" disabled>
            Choose a procedure
          </option>
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
          required
          error={state.fieldErrors?.difficulty}
          defaultValue=""
        >
          <option value="" disabled>
            Choose a difficulty
          </option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </Select>
        <Select
          label="Side"
          name="side"
          required
          error={state.fieldErrors?.side}
          defaultValue=""
        >
          <option value="" disabled>
            Choose a side
          </option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </Select>
      </div>

      <Textarea
        label="Summary"
        name="summary"
        placeholder="One or two sentences a resident sees before starting."
        rows={2}
        optional
      />

      <Textarea
        label="Learning objective"
        name="learningObjective"
        placeholder="What should a resident be able to do after completing this case?"
        rows={2}
        required
        error={state.fieldErrors?.learningObjective}
      />

      <div className={p.formRow}>
        <Button variant="primary" icon={Plus} type="submit" loading={pending}>
          Create case
        </Button>
      </div>
    </form>
  );
}
