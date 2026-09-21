"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input, Select, Textarea } from "@/components/ui";
import { createCase, type CaseFormState } from "@/app/actions";
import type { ProcedureOption } from "@/lib/data/content";
import p from "../panels.module.css";
import c from "./content.module.css";

/**
 * Client-side `required` attributes back a server-side re-validation that
 * returns field-level errors; the API does its own validation after that. A
 * successful create redirects to the new case, so there is no success state
 * to render here.
 */
export function NewCaseForm({ procedures }: { procedures: ProcedureOption[] }) {
  const [state, formAction, pending] = useActionState<CaseFormState, FormData>(
    createCase,
    {},
  );

  if (procedures.length === 0) {
    return (
      <Banner tone="warn" title="No procedures to build a case on">
        A case belongs to a procedure, and none exist yet. Add a procedure
        first, then come back to create the case.
      </Banner>
    );
  }

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

      <Textarea
        label="Description"
        name="description"
        placeholder="One or two sentences a resident sees before starting."
        rows={2}
        maxLength={1000}
        optional
      />

      <Textarea
        label="Learning objective"
        name="learningObjective"
        placeholder="What should a resident be able to do after completing this case?"
        rows={2}
        maxLength={1000}
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
