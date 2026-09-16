"use client";

import { Check } from "lucide-react";
import { cx } from "@/lib/cx";
import type { StepOption } from "@/lib/plan";
import t from "./steps.module.css";

/**
 * The shared controls of the planning steps.
 *
 * They are client components because every one of them holds an answer, and
 * they take no icon props, so nothing crosses the RSC boundary that cannot
 *.
 */

/**
 * Move a roving focus within a radio group.
 *
 * A `radiogroup` is one tab stop, and the arrow keys choose inside it. Ours was
 * every option tabbable and no arrow handling at all, which is the shape a
 * keyboard user is least served by: six diagnoses meant six tab stops to cross
 * to reach the button below, and the standard gesture for picking one did
 * nothing. WAI-ARIA radio-group pattern.
 *
 * Selection follows focus, as it does in a native radio group, so arrowing to
 * an option chooses it — which is also what makes a single tab stop safe: there
 * is never a focused option that is not the answer.
 */
function useRovingRadio(
  values: string[],
  value: string | undefined,
  onChange: (value: string) => void,
) {
  const active = Math.max(0, values.indexOf(value ?? ""));

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowDown" || event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowUp" || event.key === "ArrowLeft"
          ? -1
          : 0;

    if (step === 0 || values.length === 0) return;

    event.preventDefault();
    const next = (active + step + values.length) % values.length;
    onChange(values[next]);

    // The group re-renders with `tabIndex` moved; focus has to follow it or the
    // user is left tabbing from an element that is no longer the tab stop.
    const group = event.currentTarget;
    requestAnimationFrame(() => {
      group.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
    });
  }

  return { active, onKeyDown };
}

/** A single-select list where each option carries its reasoning. */
export function ChoiceList({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: StepOption[];
  value?: string;
  onChange: (value: string) => void;
}) {
  const { active, onKeyDown } = useRovingRadio(
    options.map((o) => o.value),
    value,
    onChange,
  );

  return (
    <div
      className={t.choices}
      role="radiogroup"
      aria-label={name}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={index === active ? 0 : -1}
            className={cx(t.choice, on && t.choiceOn)}
            onClick={() => onChange(option.value)}
          >
            <span className={t.mark} aria-hidden="true">
              {on && <Check className={t.markGlyph} strokeWidth={3.5} />}
            </span>
            <span>
              <span className={t.choiceLabel}>{option.label}</span>
              {option.detail && (
                <span className={t.choiceDetail}>{option.detail}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A discrete value picked from a catalogue — component sizes, insert
 * thicknesses.
 *
 * These were sliders over a `min`/`max`/`step` triple written in the component,
 * which modelled them as a continuous range they are not: an implant system is
 * made in the sizes it is made in. A slider also has to invent the values
 * between them, and `case_truth` accepts a list, so the two could disagree
 * about whether a size exists at all. The options come from
 * `plan_step_options`, so this control can only ever offer what the catalogue
 * holds.
 */
export function OptionScale({
  label,
  hint,
  options,
  value,
  format,
  onChange,
}: {
  label: string;
  hint?: string;
  options: StepOption[];
  value?: number;
  format?: (option: StepOption) => string;
  onChange: (value: number) => void;
}) {
  const { active, onKeyDown } = useRovingRadio(
    options.map((o) => o.value),
    value === undefined ? undefined : String(value),
    (next) => onChange(Number(next)),
  );

  return (
    <div
      className={t.scale}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className={t.sliderHead}>
        <span className={t.sliderLabel}>{label}</span>
        <span className={t.sliderValue}>
          {options.find((o) => Number(o.value) === value)?.label ?? "Not chosen"}
        </span>
      </div>

      <div className={t.scaleRow}>
        {options.map((option, index) => {
          const numeric = Number(option.value);
          const on = numeric === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={option.label}
              tabIndex={index === active ? 0 : -1}
              className={cx(t.scaleStop, on && t.scaleStopOn)}
              onClick={() => onChange(numeric)}
            >
              {format ? format(option) : option.label}
            </button>
          );
        })}
      </div>

      {hint && <p className={t.sliderHint}>{hint}</p>}
    </div>
  );
}

export type MeasurementSpec = {
  key: string;
  label: string;
  short: string;
  unit: string;
};

/**
 * The six angles.
 *
 * The flag on the right says only whether a figure sits inside the *published
 * normal range*, which is population knowledge and is on the case row. Whether
 * it matches this patient's radiograph is a different question, and only
 * `plan_gates` answers it — from `case_truth`, server-side. A learner who is
 * outside normal is not necessarily wrong; this knee is abnormal.
 */
export function MeasurementTable({
  specs,
  values,
  ranges,
  onChange,
}: {
  specs: readonly MeasurementSpec[];
  values: Record<string, number | undefined>;
  ranges: Record<string, [number, number] | undefined>;
  onChange: (key: string, value: number | undefined) => void;
}) {
  return (
    <div className={t.measures}>
      <div className={t.measureHead}>
        <span>Angle</span>
        <span>Your reading</span>
        <span>Normal</span>
        <span>Against normal</span>
      </div>

      {specs.map((spec) => {
        const value = values[spec.key];
        const range = ranges[spec.key];
        const inRange =
          value !== undefined && range
            ? value >= range[0] && value <= range[1]
            : undefined;

        return (
          <div className={t.measure} key={spec.key}>
            <span className={t.measureName}>
              <span className={t.measureShort}>{spec.short}</span>
              <span className={t.measureFull} title={spec.label}>
                {spec.label}
              </span>
            </span>

            <span className={t.numberWrap}>
              <input
                className={t.number}
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value ?? ""}
                aria-label={`${spec.label} in ${spec.unit === "°" ? "degrees" : "millimetres"}`}
                onChange={(event) => {
                  const raw = event.target.value;
                  const next = raw === "" ? undefined : Number(raw);
                  onChange(spec.key, Number.isFinite(next) ? next : undefined);
                }}
              />
              <span className={t.unit} aria-hidden="true">
                {spec.unit}
              </span>
            </span>

            <span className={t.range}>
              {range ? `${range[0]} to ${range[1]}${spec.unit}` : "—"}
            </span>

            <span>
              {inRange === undefined ? (
                <span className={cx(t.flag, t.flagNone)}>Not measured</span>
              ) : inRange ? (
                <span className={cx(t.flag, t.flagIn)}>Within normal</span>
              ) : (
                <span className={cx(t.flag, t.flagOut)}>Outside normal</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.5,
  unit,
  hint,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  hint?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className={t.slider}>
      <div className={t.sliderHead}>
        <span className={t.sliderLabel}>{label}</span>
        <span className={t.sliderValue}>
          {format ? format(value) : `${value}${unit}`}
        </span>
      </div>
      <input
        className={t.sliderInput}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className={t.sliderScale}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
      {hint && <p className={t.sliderHint}>{hint}</p>}
    </div>
  );
}

export function RiskList({
  risks,
  acknowledged,
  onToggle,
}: {
  risks: { id: string; label: string; detail: string; severity: string }[];
  acknowledged: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className={t.risks}>
      {risks.map((risk) => {
        const on = acknowledged.includes(risk.id);
        return (
          <button
            key={risk.id}
            type="button"
            aria-pressed={on}
            className={cx(t.risk, on && t.riskOn)}
            onClick={() => onToggle(risk.id)}
          >
            <span className={t.riskBox} aria-hidden="true">
              {on && <Check className={t.markGlyph} strokeWidth={3.5} />}
            </span>
            <span>
              <span className={t.riskLabel}>{risk.label}</span>
              <span className={t.riskDetail}>{risk.detail}</span>
            </span>
            <SeverityPill severity={risk.severity} />
          </button>
        );
      })}
    </div>
  );
}

/**
 * A severity is a verdict on the risk, so it is a solid fill.
 *
 * Three severities, three fills. Critical and high both rendered as `flagOut`,
 * which meant the popliteal bundle and an elevated BMI arrived on screen
 * looking equally urgent — a ranking the data carries and the UI threw away.
 * Critical takes `--fail`, high takes `--warn`, moderate stays neutral, and the
 * word is there in every case because colour is never the only carrier.
 */
const SEVERITY_TONE: Record<string, string> = {
  critical: t.flagCritical,
  high: t.flagOut,
  moderate: t.flagNone,
};

function SeverityPill({ severity }: { severity: string }) {
  return (
    <span className={cx(t.flag, SEVERITY_TONE[severity] ?? t.flagNone)}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

export function Rows({
  rows,
}: {
  rows: { label: string; value: string }[];
}) {
  return (
    <div className={t.rows}>
      {rows.map((row) => (
        <div className={t.row} key={row.label}>
          <span className={t.rowLabel}>{row.label}</span>
          <span className={t.rowValue}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
