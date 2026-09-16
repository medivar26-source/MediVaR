"use client";

import { useActionState, useState } from "react";
import { Badge, Banner, Button, Card, CardHeader, Segmented } from "@/components/ui";
import { saveInstructorConfig, type ConfigState } from "@/app/actions";
import type { InstructorConfig } from "@/lib/data/cases";
import s from "./case.module.css";

/**
 * Flow F. Per-scene overrides, saved as a named preset.
 *
 * Rendered only for instructors and admins — a learner is not shown a disabled
 * copy, because a control that can never be used is not a control.
 *
 * The scale factor and the two scene settings below are the subset that is
 * named explicitly. Every authored value is overridable, so this panel
 * grows; the shape it writes (`instructor_configs.overrides`) does not.
 */
export function ConfigurePanel({
  caseId,
  presets,
}: {
  caseId: string;
  presets: InstructorConfig[];
}) {
  const [tolerance, setTolerance] = useState<"0.7" | "1.0" | "1.5">("1.0");
  const [guides, setGuides] = useState<"on" | "off">("on");
  const [cartilage, setCartilage] = useState<"2" | "3" | "4">("3");
  const [state, formAction, pending] = useActionState<ConfigState, FormData>(
    saveInstructorConfig,
    {},
  );

  return (
    <Card padding="lg" className={s.configure}>
      <CardHeader
        title="Instructor configuration"
        subtitle="A configured session carries a Custom configuration badge on its report, so results are never compared against a different rule set without the reader knowing."
        action={<Badge status="active">Instructor only</Badge>}
      />

      {state.error && (
        <Banner tone="fail" title="Preset not saved">
          {state.error}
        </Banner>
      )}
      {state.saved && (
        <Banner tone="pass" title="Preset saved">
          {state.saved} is available when you start a session on this case.
        </Banner>
      )}

      <form action={formAction} className={s.configForm}>
        <input type="hidden" name="caseId" value={caseId} />
        <input type="hidden" name="tolerance" value={tolerance} />
        <input type="hidden" name="guides" value={guides} />
        <input type="hidden" name="cartilage" value={cartilage} />

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Tolerance bands</p>
            <p className={s.configHint}>
              Scale factor applied to every authored tolerance
            </p>
          </div>
          <Segmented
            label="Tolerance bands"
            value={tolerance}
            onChange={setTolerance}
            options={[
              { value: "0.7", label: "×0.7" },
              { value: "1.0", label: "×1.0" },
              { value: "1.5", label: "×1.5" },
            ]}
          />
        </div>

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Guides in Training</p>
            <p className={s.configHint}>
              Ghost outlines, corridors, arrows and target dots
            </p>
          </div>
          <Segmented
            label="Guides in Training"
            value={guides}
            onChange={setGuides}
            options={[
              { value: "on", label: "On" },
              { value: "off", label: "Off" },
            ]}
          />
        </div>

        <div className={s.configRow}>
          <div>
            <p className={s.configLabel}>Cartilage grade (9.1)</p>
            <p className={s.configHint}>Gates the resurfacing decision</p>
          </div>
          <Segmented
            label="Cartilage grade"
            value={cartilage}
            onChange={setCartilage}
            options={[
              { value: "2", label: "II" },
              { value: "3", label: "III" },
              { value: "4", label: "IV" },
            ]}
          />
        </div>

        <div className={s.configFoot}>
          <label className={s.presetName}>
            <span className={s.configLabel}>Preset name</span>
            <input
              className={s.presetInput}
              name="name"
              required
              maxLength={60}
              placeholder="Exam conditions"
            />
          </label>
          <Button variant="primary" type="submit" loading={pending}>
            Save as preset
          </Button>
        </div>
      </form>

      {presets.length > 0 && (
        <div className={s.presetList}>
          <p className={s.configLabel}>Existing presets</p>
          <ul className={s.presets}>
            {presets.map((preset) => (
              <li key={preset.id} className={s.preset}>
                <span>{preset.name}</span>
                <span className={s.presetMeta}>
                  {`${Object.keys(preset.overrides).length} scene override${
                    Object.keys(preset.overrides).length === 1 ? "" : "s"
                  }`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
