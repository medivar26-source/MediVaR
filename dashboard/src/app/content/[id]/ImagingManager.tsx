"use client";

import { useActionState } from "react";
import { Upload } from "lucide-react";
import { Banner, Button, Input, Select } from "@/components/ui";
import { saveCaseImaging, type CaseImagingFormState } from "@/app/actions";
import p from "../../panels.module.css";

const VIEW_OPTIONS = [
  { value: "ap", label: "AP standing" },
  { value: "lateral", label: "Lateral" },
  { value: "skyline", label: "Skyline" },
  { value: "long_leg", label: "Full-length long-leg" },
  { value: "flap", label: "FLAP" },
  { value: "klat", label: "KLAT" },
];

/**
 * Adds a radiograph view to the case's imaging package. Real client and
 * server validation on the file and the fields — see `saveCaseImaging` for
 * why the upload itself does not land anywhere yet.
 */
export function ImagingManager({ caseId }: { caseId: string }) {
  const [state, formAction, pending] = useActionState<
    CaseImagingFormState,
    FormData
  >(saveCaseImaging, {});

  return (
    <form action={formAction} className={p.form} aria-label="Add an imaging view">
      {state.error && (
        <Banner tone="fail" title="Not uploaded">
          {state.error}
        </Banner>
      )}

      <input type="hidden" name="caseId" value={caseId} />

      <Select label="View" name="view" required error={state.fieldErrors?.view} defaultValue="">
        <option value="" disabled>
          Choose a view
        </option>
        {VIEW_OPTIONS.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </Select>

      <Input
        label="Label"
        name="label"
        placeholder="AP standing"
        maxLength={60}
        required
        error={state.fieldErrors?.label}
      />

      <div className={p.formRow}>
        <input
          type="file"
          name="file"
          accept="image/*"
          aria-label="Radiograph image"
          required
        />
      </div>
      {state.fieldErrors?.file && (
        <p style={{ color: "var(--fail)", fontSize: "var(--t-caption)", marginTop: "calc(var(--s-3) * -1)" }}>
          {state.fieldErrors.file}
        </p>
      )}

      <div className={p.formRow}>
        <Button variant="secondary" icon={Upload} type="submit" loading={pending}>
          Add view
        </Button>
      </div>
    </form>
  );
}
