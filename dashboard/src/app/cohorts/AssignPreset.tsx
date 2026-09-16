"use client";

import { useActionState } from "react";
import { Banner, Button, Select } from "@/components/ui";
import { assignPreset, type CohortState } from "@/app/actions";
import p from "../panels.module.css";

/**
 * The control that makes a preset do something.
 *
 * It changes what *future* plans are stamped with and never restamps existing
 * ones — a plan freezes its rule set when it is created, the same discipline
 * `sessions.plan_snapshot` has. The banner says so on success rather than
 * leaving the instructor to assume a retroactive change they did not get.
 */
export function AssignPreset({
  cohortId,
  currentPresetId,
  presets,
}: {
  cohortId: string;
  currentPresetId?: string;
  presets: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<CohortState, FormData>(
    assignPreset,
    {},
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="cohortId" value={cohortId} />

      {state.error && (
        <Banner tone="fail" title="Not assigned">
          {state.error}
        </Banner>
      )}
      {state.saved && !state.error && (
        <Banner tone="pass" title="Preset assigned">
          {state.saved}
        </Banner>
      )}

      <div className={p.filters}>
        <Select
          label="Configuration preset"
          name="presetId"
          defaultValue={currentPresetId ?? ""}
          className={p.spacer}
          helper="Applies to plans started after this change."
        >
          <option value="">None — authored tolerances</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </Select>
        <Button variant="primary" type="submit" loading={pending}>
          Assign
        </Button>
      </div>
    </form>
  );
}
