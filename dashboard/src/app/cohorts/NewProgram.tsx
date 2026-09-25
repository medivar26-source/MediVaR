"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { createProgram, type ProgramState } from "@/app/actions";
import p from "../panels.module.css";
export function NewProgram() {
  const [state, formAction, pending] = useActionState<ProgramState, FormData>(
    createProgram,
    {},
  );

  return (
    <form action={formAction} className={p.formRow}>
      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      <Input
        label="Program name"
        name="name"
        placeholder="E.g. Orthopaedics Residency"
        maxLength={80}
        className={p.formGrow}
        required
      />

      <Input
        label="Description (Optional)"
        name="description"
        placeholder="Brief description"
        maxLength={200}
        className={p.formGrow}
      />

      <Button variant="primary" icon={Plus} type="submit" loading={pending}>
        Create program
      </Button>
    </form>
  );
}
