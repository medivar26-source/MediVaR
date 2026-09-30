"use client";

import { useActionState, useState } from "react";
import { Copy, UserPlus } from "lucide-react";
import { Banner, Button, Input, Select } from "@/components/ui";
import { createInstructor, type CreateInstructorState } from "@/app/actions/admin";
import { NEW_INSTITUTION } from "@/lib/admin-constants";
import type { Institution } from "@/lib/data/admin";
import p from "../../panels.module.css";

export function InstructorForm({ institutions }: { institutions: Institution[] }) {
  const [state, formAction, pending] = useActionState<CreateInstructorState, FormData>(
    createInstructor,
    {},
  );
  const [copied, setCopied] = useState(false);
  // With no institution yet, the only choice is to add one.
  const [choice, setChoice] = useState(institutions[0]?.id ?? NEW_INSTITUTION);
  const created = state.created;

  const copy = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(
        `Institution: ${created.institution}\nEmail: ${created.email}\nTemporary password: ${created.tempPassword}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "var(--s-4)" }}>
      {created && (
        <Banner tone="pass" title={`Account created for ${created.name}`}>
          <p style={{ margin: "0 0 var(--s-2)" }}>
            Give these sign-in details to the instructor. The password is shown
            only now and cannot be looked up later.
          </p>
          <p style={{ margin: 0, fontFamily: "var(--font-mono)" }}>
            {created.institution}
            <br />
            {created.email}
            <br />
            {created.tempPassword}
          </p>
          <div style={{ marginTop: "var(--s-3)" }}>
            <Button variant="secondary" size="sm" icon={Copy} onClick={copy}>
              {copied ? "Copied" : "Copy details"}
            </Button>
          </div>
        </Banner>
      )}

      {state.error && (
        <Banner tone="fail" title="Not created">
          {state.error}
        </Banner>
      )}

      {/* Keyed on the created account so the fields clear after a success. */}
      <form key={created?.email ?? "new"} action={formAction} className={p.formRow}>
        <Select
          label="Institution"
          name="institutionId"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
          helper="The instructor, and every learner they create, belong to this institution only."
          className={p.formGrow}
        >
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
          <option value={NEW_INSTITUTION}>+ Add a new institution…</option>
        </Select>

        {choice === NEW_INSTITUTION && (
          <Input
            label="New institution name"
            name="newInstitution"
            maxLength={120}
            placeholder="e.g. North General Hospital"
            className={p.formGrow}
            required
          />
        )}

        <Input label="First name" name="firstName" maxLength={80} className={p.formGrow} required />
        <Input label="Last name" name="lastName" maxLength={80} className={p.formGrow} required />
        <Input
          label="Email (their username)"
          name="email"
          type="email"
          maxLength={254}
          className={p.formGrow}
          required
        />
        <Input
          label="Temporary password (optional)"
          name="password"
          type="text"
          autoComplete="off"
          placeholder="Leave blank to generate one"
          className={p.formGrow}
        />
        <Button variant="primary" icon={UserPlus} type="submit" loading={pending}>
          Create instructor
        </Button>
      </form>
    </div>
  );
}
