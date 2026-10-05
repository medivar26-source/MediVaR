"use client";

import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import c from "./planControls.module.css";
import type { SaveStatus } from "./planHooks";

export type Tone = "pass" | "warn" | "fail" | "none";

const TONE_ICON = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
  none: CircleDashed,
} as const;

const TONE_WORD: Record<Tone, string> = {
  pass: "within target",
  warn: "borderline",
  fail: "outside target",
  none: "not measured",
};

export type GaugeZone = { from: number; to: number; tone: Exclude<Tone, "none"> };

/**
 * One fit measurement on a banded scale. The bands are the clinical tolerances, the marker is
 * where this plan sits, and the verdict is repeated as an icon and a word so colour is never
 * the only signal.
 */
export function FitGauge({
  label,
  value,
  unit,
  tone,
  min,
  max,
  zones,
  target,
  note,
  decimals = 1,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  tone: Tone;
  min: number;
  max: number;
  zones: GaugeZone[];
  target: string;
  note?: string;
  decimals?: number;
}) {
  const measured = value !== undefined && Number.isFinite(value);
  const effectiveTone: Tone = measured ? tone : "none";
  const Icon = TONE_ICON[effectiveTone];
  const span = max - min;
  const pct = measured ? Math.min(100, Math.max(0, (((value as number) - min) / span) * 100)) : 0;
  const display = measured ? `${(value as number).toFixed(decimals)}${unit}` : "—";

  return (
    <div className={c.gauge}>
      <div className={c.gaugeHead}>
        <span className={c.gaugeLabel}>{label}</span>
        <span className={`${c.gaugeValue} ${c[`tone-${effectiveTone}`]}`}>
          <Icon size={14} aria-hidden="true" />
          {display}
          <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            {TONE_WORD[effectiveTone]}
          </span>
        </span>
      </div>
      <div
        className={c.track}
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={measured ? (value as number) : undefined}
        aria-valuetext={measured ? `${display}, ${TONE_WORD[effectiveTone]}` : "not measured"}
      >
        {zones.map((z) => (
          <div
            key={`${z.from}-${z.to}`}
            className={c[`zone-${z.tone}`]}
            style={{ width: `${((Math.min(z.to, max) - Math.max(z.from, min)) / span) * 100}%` }}
          />
        ))}
        {measured && <div className={c.marker} style={{ left: `${pct}%` }} />}
      </div>
      <div className={c.gaugeFoot}>
        <span>Target {target}</span>
        {note && <span>{note}</span>}
      </div>
    </div>
  );
}

/** The overall verdict for a component, in the same tone vocabulary as the gauges. */
export function FitVerdict({ status }: { status: string | undefined }) {
  const tone: Tone =
    status === "ACCEPTABLE FIT" ? "pass" : status === "POOR FIT" ? "fail" : status?.startsWith("CAUTION") ? "warn" : "none";
  const Icon = TONE_ICON[tone];
  return (
    <div className={`${c.verdict} ${c[`verdict-${tone}`]}`} role="status">
      <Icon size={16} aria-hidden="true" />
      {tone === "none" ? "Measure the patient's bone to evaluate fit" : status}
    </div>
  );
}

/** A labelled −/＋ pair for one position axis. */
export function NudgeRow({
  label,
  valueText,
  step,
  unit,
  disabled,
  onDecrease,
  onIncrease,
}: {
  label: string;
  valueText: string;
  step: number;
  unit: string;
  disabled: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className={c.nudgeRow}>
      <span className={c.nudgeLabel}>{label}</span>
      <div className={c.nudgeControls}>
        <button
          type="button"
          className={c.nudgeButton}
          disabled={disabled}
          onClick={onDecrease}
          aria-label={`Decrease ${label} by ${step} ${unit}`}
        >
          −
        </button>
        <span className={c.nudgeValue} aria-live="off">
          {valueText}
        </span>
        <button
          type="button"
          className={c.nudgeButton}
          disabled={disabled}
          onClick={onIncrease}
          aria-label={`Increase ${label} by ${step} ${unit}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/** Where this component's saved state stands: saved, unsaved, saving or failed. */
export function SaveBadge({ status, onRetry }: { status: SaveStatus; onRetry?: () => void }) {
  const text = (() => {
    switch (status.kind) {
      case "saving":
        return "Saving…";
      case "saved":
        return status.at ? `Saved · ${status.at}` : "Saved";
      case "dirty":
        return "Unsaved changes";
      case "error":
        return "Couldn't save";
      case "locked":
        return "Locked";
      default:
        return "Not saved yet";
    }
  })();
  const Icon =
    status.kind === "saving"
      ? Loader2
      : status.kind === "saved"
        ? CheckCircle2
        : status.kind === "error"
          ? XCircle
          : status.kind === "dirty"
            ? AlertTriangle
            : CircleDashed;

  return (
    <span className={`${c.save} ${c[`save-${status.kind}`]}`} role="status" aria-live="polite" title={status.kind === "error" ? status.message : undefined}>
      <Icon size={13} aria-hidden="true" className={status.kind === "saving" ? c.spin : undefined} />
      {text}
      {status.kind === "error" && onRetry && (
        <button type="button" className={c.retry} onClick={onRetry}>
          Retry
        </button>
      )}
    </span>
  );
}

export function KeyboardHint() {
  return (
    <p className={c.hint}>
      <span className={c.kbd}>←</span> <span className={c.kbd}>→</span> <span className={c.kbd}>↑</span>{" "}
      <span className={c.kbd}>↓</span> nudge 0.1 mm, hold <span className={c.kbd}>Shift</span> for 1 mm.{" "}
      <span className={c.kbd}>[</span> <span className={c.kbd}>]</span> rotate.
    </p>
  );
}
